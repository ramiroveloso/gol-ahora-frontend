import {
  dateStringToEpochMs,
  isSlotBlockingStatus,
  bookingsOverlap,
  mergeOccupiedSlots,
} from '../utils/bookingRules.js'
import { formatApiError } from '../utils/apiErrors.js'

const PROTOCOL = import.meta.env.VITE_API_PROTOCOL || 'http'
const DOMAIN = import.meta.env.VITE_API_DOMAIN || 'localhost'
const PORT = import.meta.env.VITE_API_PORT || '8000'
const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? '/api' : `${PROTOCOL}://${DOMAIN}:${PORT}/api`)
const CSRF_STORAGE_KEY = `csrftoken:${API_URL}`
const PAID_AMOUNTS_KEY = 'booking_paid_amounts'

function getStoredPaidAmounts() {
  try {
    return JSON.parse(localStorage.getItem(PAID_AMOUNTS_KEY) || '{}')
  } catch {
    return {}
  }
}

function setStoredPaidAmount(bookingId, amount) {
  const id = String(bookingId)
  const paid = Number(amount)
  if (!id || !(paid > 0)) return
  const map = getStoredPaidAmounts()
  map[id] = paid
  localStorage.setItem(PAID_AMOUNTS_KEY, JSON.stringify(map))
}

/** Siempre false: conexión al backend Django (sesión + CSRF). */
export const isMockMode = false

function isCrossOriginApi() {
  try {
    return new URL(API_URL).origin !== window.location.origin
  } catch {
    return false
  }
}

function readCsrfFromDocumentCookie() {
  const name = 'csrftoken'
  if (!document.cookie) return null
  for (const part of document.cookie.split(';')) {
    const cookie = part.trim()
    if (cookie.startsWith(`${name}=`)) {
      return decodeURIComponent(cookie.slice(name.length + 1))
    }
  }
  return null
}

function clearCsrfToken() {
  sessionStorage.removeItem(CSRF_STORAGE_KEY)
}

function setCsrfToken(token) {
  if (token) sessionStorage.setItem(CSRF_STORAGE_KEY, token)
  else clearCsrfToken()
}

/** La cookie del navegador manda sobre sessionStorage (evita token viejo tras login/cancelar). */
function getCsrfToken() {
  const fromCookie = readCsrfFromDocumentCookie()
  if (fromCookie) {
    const stored = sessionStorage.getItem(CSRF_STORAGE_KEY)
    if (stored !== fromCookie) setCsrfToken(fromCookie)
    return fromCookie
  }
  return sessionStorage.getItem(CSRF_STORAGE_KEY)
}

function isCsrfError(status, detail) {
  if (status !== 403) return false
  return String(detail || '').toLowerCase().includes('csrf')
}

async function fetchCsrfTokenInternal() {
  try {
    const response = await fetch(`${API_URL}/auth/csrf/`, {
      method: 'GET',
      credentials: 'include',
    })
    if (response.ok) {
      const data = await response.json().catch(() => ({}))
      if (data.csrfToken) setCsrfToken(data.csrfToken)
    }
    const fromCookie = readCsrfFromDocumentCookie()
    if (fromCookie) setCsrfToken(fromCookie)
  } catch (error) {
    console.warn('CSRF:', error)
  }
}

async function ensureCsrfToken() {
  await fetchCsrfTokenInternal()
  return getCsrfToken()
}

async function request(endpoint, options = {}, csrfRetried = false) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  const method = (options.method || 'GET').toUpperCase()
  const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
  if (isMutating) {
    const csrfToken = await ensureCsrfToken()
    if (csrfToken) headers['X-CSRFToken'] = csrfToken
  }

  const config = {
    ...options,
    headers,
    credentials: 'include',
  }

  const response = await fetch(`${API_URL}${endpoint}`, config)
  const isNoContent = response.status === 204
  let data = {}

  if (!isNoContent) {
    try {
      data = await response.json()
    } catch {
      data = { detail: 'La respuesta no es JSON válido' }
    }
  }

  if (!response.ok) {
    if (!csrfRetried && isMutating && isCsrfError(response.status, data.detail)) {
      clearCsrfToken()
      await fetchCsrfTokenInternal()
      return request(endpoint, options, true)
    }

    const errorMsg =
      data.detail ||
      data.error ||
      (typeof data === 'object' ? JSON.stringify(data) : data) ||
      `Error ${response.status} en la petición.`
    const e = new Error(
      formatApiError({
        message: typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg),
        data,
        status: response.status,
      }),
    )
    e.status = response.status
    e.url = `${API_URL}${endpoint}`
    e.data = data
    throw e
  }

  return data
}

function formatUser(djangoUser) {
  if (!djangoUser) return null

  let role = 'cliente'
  const djangoRol = (djangoUser.rol || '').toUpperCase()
  if (djangoRol === 'ADMINISTRADOR' || djangoRol === 'EMPLEADO') role = 'administrador'
  else if (djangoRol === 'PROFESOR') role = 'profesional'
  else if (djangoRol === 'SOCIO') role = 'cliente'
  else role = djangoUser.role || 'cliente'

  return {
    id: djangoUser.id,
    username: djangoUser.username,
    email: djangoUser.email,
    name:
      djangoUser.first_name && djangoUser.last_name
        ? `${djangoUser.first_name} ${djangoUser.last_name}`.trim()
        : djangoUser.name || djangoUser.username || djangoUser.email,
    role,
    telefono: djangoUser.telefono || '',
    direccion: djangoUser.direccion || '',
    localidad: djangoUser.localidad || '',
    provincia: djangoUser.provincia || '',
    codigoPostal: djangoUser.codigoPostal || djangoUser.codigopostal || '',
    dni: djangoUser.dni || '',
    memberSince: djangoUser.memberSince || '',
    certificacionVigente: djangoUser.certificacionVigente ?? role !== 'profesional',
  }
}

function mapDjangoRole(rol) {
  if (rol === 'ADMINISTRADOR' || rol === 'EMPLEADO') return 'administrador'
  if (rol === 'PROFESOR') return 'profesional'
  return 'cliente'
}

function mapFrontStatus(estado) {
  const key = String(estado ?? '').toUpperCase()
  const map = {
    PENDIENTE: 'pending',
    CONFIRMADA: 'confirmed',
    CANCELADA: 'cancelled',
    COMPLETADA: 'completed',
  }
  return map[key] || 'pending'
}

/** Estados del kanban/UI → valores del backend (EstadoEnum). */
function mapDjangoStatus(status) {
  const map = {
    pending: 'PENDIENTE',
    confirmed: 'CONFIRMADA',
    live: 'CONFIRMADA',
    completed: 'COMPLETADA',
    cancelled: 'CANCELADA',
  }
  return map[status] || 'PENDIENTE'
}

const CAMBIAR_ESTADO_PATH = (id) => `/bookings/reservas/${id}/cambiar_estado/`

function msToTimeRange(horaInicio, horaFin) {
  const start = new Date(Number(horaInicio))
  const end = new Date(Number(horaFin))
  const fmt = (d) =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return `${fmt(start)} - ${fmt(end)}`
}

/** Inicio/fin del turno en ms (hora local), alineado con Swagger. */
function bookingWindowToEpochMs(dateStr, timeRange, durationHours = 1) {
  const [startPart, endPart] = (timeRange || '08:00 - 09:00').split(' - ').map((s) => s.trim())
  const [y, mo, d] = (dateStr || '').split('-').map(Number)
  const [sh, sm] = startPart.split(':').map(Number)
  const start = new Date(y, mo - 1, d, sh, sm || 0, 0, 0)
  let end
  if (endPart) {
    const [eh, em] = endPart.split(':').map(Number)
    end = new Date(y, mo - 1, d, eh, em || 0, 0, 0)
  } else {
    end = new Date(start.getTime() + durationHours * 3600000)
  }
  return { startMs: start.getTime(), endMs: end.getTime() }
}

/** Mediodía UTC del día del turno (misma lógica que EpochMillisecondsField en Django). */
function fechaReservaMsFromStart(startMs) {
  const t = new Date(startMs)
  return Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate(), 12, 0, 0, 0)
}

/**
 * Valor de fecha_reserva para POST /reservas/ sin romper la respuesta del backend.
 * Si el string es solo dígitos, Django guarda datetime.date y falla al serializar (500).
 * Un espacio al final hace que use el datetime validado del serializer.
 */
function fechaReservaForCreatePayload(startMs) {
  return `${fechaReservaMsFromStart(startMs)} `
}

function courtPkFromId(courtId) {
  const digits = String(courtId ?? '').replace(/\D/g, '')
  return digits || String(courtId)
}

function bookingProbe(bookingData) {
  const courtNum = String(bookingData.courtId ?? '').replace(/\D/g, '')
  return {
    courtId: courtNum,
    date: bookingData.date,
    time: bookingData.time,
    durationHours: bookingData.durationHours || 1,
  }
}

function fechaReservaSameDay(a, b) {
  const da = new Date(Number(a))
  const db = new Date(Number(b))
  if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return false
  return (
    da.getUTCFullYear() === db.getUTCFullYear() &&
    da.getUTCMonth() === db.getUTCMonth() &&
    da.getUTCDate() === db.getUTCDate()
  )
}

/** Misma clave única del backend: cancha + fecha_reserva + hora_inicio. */
function rawMatchesCreatePayload(raw, payload, bookingData) {
  if (Number(raw.cancha) !== Number(payload.cancha)) return false
  if (Number(raw.hora_inicio) !== Number(payload.hora_inicio)) return false
  if (fechaReservaSameDay(raw.fecha_reserva, payload.fecha_reserva)) return true
  if (bookingData?.date && epochMsToLocalDateStr(raw.fecha_reserva) === bookingData.date) {
    return true
  }
  return false
}

async function listAllReservas() {
  const data = await request('/bookings/reservas/')
  return Array.isArray(data) ? data : data.results || []
}

/** Fila existente en el mismo slot exacto (cancelada/completada bloquean POST → 500). */
async function findExactSlotReservation(bookingData, userId) {
  let payload
  try {
    payload = parseBookingToDjango(bookingData, userId)
  } catch {
    return null
  }

  for (const raw of await listAllReservas()) {
    if (!rawMatchesCreatePayload(raw, payload, bookingData)) continue
    return mapDjangoReserva(raw)
  }
  return null
}

/** Cancelada/completada que solapa (reservas viejas con fecha distinta). */
async function findGhostReservationAtSlot(bookingData) {
  const probe = bookingProbe(bookingData)
  if (!probe.courtId || !probe.date) return null

  for (const raw of await listAllReservas()) {
    const b = mapDjangoReserva(raw)
    if (b.status !== 'cancelled' && b.status !== 'completed') continue
    if (String(b.courtId) !== probe.courtId) continue
    if (bookingsOverlap(probe, b)) return b
  }
  return null
}

async function reactivateCancelledBooking(ghost, bookingData) {
  const reactivated = await api.updateBookingStatus(ghost.id, 'pending', {
    ...ghost,
    ...bookingData,
  })
  const merged = mergeBookingFromClient({ ...reactivated, status: 'pending' }, bookingData)
  return enrichBookingPrice(merged, [])
}

/**
 * Elimina o reactiva reservas fantasma antes del POST (evita 500 por unique_cancha_fecha_hora).
 * @returns {Promise<object|null>} reserva si se reactivó; null si no había fantasma o se borró
 */
async function resolveGhostBeforePost(bookingData, userId) {
  const exact = await findExactSlotReservation(bookingData, userId)
  const ghost = exact || (await findGhostReservationAtSlot(bookingData))
  if (!ghost) return null

  if (ghost.status === 'cancelled' && String(ghost.userId) === String(userId)) {
    return reactivateCancelledBooking(ghost, bookingData)
  }

  if (isSlotBlockingStatus(ghost.status)) {
    throw new Error(
      `Horario no disponible (reserva #${ghost.id} ${ghost.status === 'pending' ? 'pendiente' : 'confirmada'}). Actualizá la grilla.`,
    )
  }

  try {
    await api.deleteBooking(ghost.id)
  } catch (delErr) {
    if (ghost.status === 'cancelled' && String(ghost.userId) === String(userId)) {
      return reactivateCancelledBooking(ghost, bookingData)
    }
    console.warn('No se pudo eliminar reserva #' + ghost.id, delErr)
    throw new Error(
      `No se pudo liberar el turno (reserva #${ghost.id}, estado ${ghost.status}). Probá otro horario o pedí ayuda al administrador.`,
    )
  }
  return null
}

async function postNewReserva(bookingData, userId) {
  const payload = parseBookingToDjango(bookingData, userId)
  const created = await request('/bookings/reservas/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  const mapped = mergeBookingFromClient(mapDjangoReserva(created), bookingData)
  return enrichBookingPrice(mapped, [])
}

async function assertSlotAvailable(bookingData) {
  const candidate = bookingProbe(bookingData)
  const occupied = await api.getOccupiedSlotsForCourt(bookingData.courtId, bookingData.date)
  const conflict = occupied.find(
    (b) => isSlotBlockingStatus(b.status) && bookingsOverlap(candidate, b),
  )
  if (conflict) {
    throw new Error(
      `Horario no disponible (reserva #${conflict.id} ${conflict.status === 'pending' ? 'pendiente' : 'confirmada'}). Elegí otro turno según la grilla.`,
    )
  }
}

function parseBookingToDjango(booking, userId) {
  if (!userId) {
    throw new Error('Tenés que iniciar sesión para reservar.')
  }
  const courtNum = String(booking.courtId ?? '').replace(/\D/g, '')
  if (!courtNum) {
    throw new Error('Seleccioná una cancha válida del listado.')
  }
  const { startMs, endMs } = bookingWindowToEpochMs(
    booking.date,
    booking.time,
    booking.durationHours || 1,
  )
  return {
    usuario: Number(userId),
    cancha: Number(courtNum),
    fecha_reserva: fechaReservaForCreatePayload(startMs),
    hora_inicio: startMs,
    hora_fin: endMs,
  }
}

function epochMsToLocalDateStr(ms) {
  const d = new Date(Number(ms))
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${day}`
}

function mapDjangoReserva(r) {
  const fecha = r.fecha_reserva ?? r.hora_inicio
  const dateStr = epochMsToLocalDateStr(fecha)
  const durationMs = Number(r.hora_fin) - Number(r.hora_inicio)
  const durationHours = Math.max(1, Math.round(durationMs / 3600000))
  const precioHora = Number(r.precio_base_hora ?? r.cancha_precio ?? 0)

  return {
    id: String(r.id),
    userId: String(r.usuario ?? r.usuario?.id ?? ''),
    userEmail: r.usuario_email || r.usuario?.email || '',
    courtId: String(r.cancha),
    courtName: r.cancha_nombre || `Cancha #${r.cancha}`,
    type: r.tipo_cancha || 'Cancha',
    date: dateStr,
    time: msToTimeRange(r.hora_inicio, r.hora_fin),
    durationHours,
    extras: [],
    status: mapFrontStatus(r.estado),
    totalPrice:
      mapFrontStatus(r.estado) === 'cancelled'
        ? 0
        : Number(r.monto) || (precioHora ? precioHora * durationHours : 0),
  }
}

/** Conserva datos calculados en el front (precio, extras) que Django no devuelve. */
function mergeBookingFromClient(mapped, source = {}) {
  if (!source || typeof source !== 'object') return mapped
  if (mapped.status === 'cancelled') {
    return { ...mapped, totalPrice: 0 }
  }
  return {
    ...mapped,
    totalPrice:
      source.totalPrice != null && source.totalPrice > 0
        ? Number(source.totalPrice)
        : mapped.totalPrice,
    extras: Array.isArray(source.extras) && source.extras.length ? source.extras : mapped.extras,
    courtName: source.courtName || mapped.courtName,
    type: source.type || mapped.type,
    durationHours: source.durationHours ?? mapped.durationHours,
    userEmail: source.userEmail || mapped.userEmail,
  }
}

/** Calcula total desde catálogo de canchas si el backend no envió monto. */
function enrichBookingPrice(booking, courts = []) {
  if (booking.totalPrice > 0) return booking
  const court = courts.find((c) => c.id === String(booking.courtId))
  if (!court?.pricePerHour) return booking
  return {
    ...booking,
    totalPrice: court.pricePerHour * (booking.durationHours || 1),
    courtName:
      booking.courtName?.startsWith('Cancha #') && court.name ? court.name : booking.courtName,
    type: booking.type === 'Cancha' && court.type ? court.type : booking.type,
  }
}

function mapDjangoCourt(c) {
  return {
    id: String(c.id),
    name: `Cancha #${c.numero}`,
    numero: c.numero,
    tipoCancha: c.tipo_cancha || '',
    type: c.tipo_cancha?.replace('FUTBOL_', 'Fútbol ') || 'Cancha',
    turf: c.superficie?.replace(/_/g, ' ') || '',
    rawSuperficie: c.superficie || 'CESPED_SINTETICO',
    capacidad: Number(c.capacidad) || 0,
    estadoDisponibilidad: c.estado_disponibilidad !== false,
    activa: c.activa !== false,
    roofed: false,
    pricePerHour: Number(c.precio_base_hora) || 0,
    maxDurationMinutes: Number(c.duracion_maxima_reserva) || 120,
    rating: '—',
    icon: 'stadium',
    disponible: c.estado_disponibilidad !== false && c.activa !== false,
  }
}

function mapRoleToDjango(role) {
  if (role === 'administrador') return 'ADMINISTRADOR'
  if (role === 'profesional') return 'PROFESOR'
  return 'SOCIO'
}

function courtFormToPayload(form) {
  return {
    numero: Number(form.numero),
    tipo_cancha: form.tipo_cancha || form.tipoCancha,
    superficie: form.superficie || form.rawSuperficie || 'CESPED_SINTETICO',
    capacidad: Number(form.capacidad) || 10,
    estado_disponibilidad: form.estado_disponibilidad ?? form.estadoDisponibilidad !== false,
    duracion_maxima_reserva: Number(form.duracion_maxima_reserva ?? form.maxDurationMinutes) || 120,
    precio_base_hora: String(Number(form.precio_base_hora ?? form.pricePerHour) || 0),
    activa: form.activa !== false,
  }
}

function classFormToPayload(form) {
  return {
    profesor: Number(form.profesorId),
    cancha: form.canchaId ? Number(form.canchaId) : null,
    horario: Number(form.horarioMs),
    maximo_alumnos: Number(form.maximo_alumnos ?? form.maxStudents) || 10,
    tipo_clase: form.tipo_clase || 'FUTBOL',
  }
}

function mapDjangoClassDetailed(clase, userMap = null) {
  const base = mapDjangoClass(clase, userMap)
  const horarioMs = Number(clase.horario)
  const horarioDate = Number.isFinite(horarioMs) ? new Date(horarioMs) : null
  return {
    ...base,
    profesorId: String(clase.profesor ?? ''),
    canchaId: clase.cancha != null ? String(clase.cancha) : '',
    tipoClase: clase.tipo_clase || 'FUTBOL',
    horarioMs,
    horarioInput: horarioDate
      ? `${horarioDate.getFullYear()}-${String(horarioDate.getMonth() + 1).padStart(2, '0')}-${String(horarioDate.getDate()).padStart(2, '0')}T${String(horarioDate.getHours()).padStart(2, '0')}:${String(horarioDate.getMinutes()).padStart(2, '0')}`
      : '',
  }
}

function mapDjangoProfessor(p) {
  return {
    id: String(p.id),
    name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.username,
    email: p.email,
    telefono: p.telefono || '',
    certificacion: p.certificacion_deportiva || '—',
    alumnosCount: p.alumnos_count ?? 0,
    activo: p.activo !== false,
  }
}

function mapUserToStudentProfile(u) {
  const firstName = (u.first_name || '').trim()
  const lastName = (u.last_name || '').trim()
  return {
    firstName,
    lastName,
    name: [firstName, lastName].filter(Boolean).join(' ') || u.username || '',
    email: u.email || '',
  }
}

async function fetchUsersNameMap() {
  const map = new Map()
  try {
    const data = await request('/auth/usuarios/')
    const list = Array.isArray(data) ? data : data.results || []
    for (const u of list) {
      map.set(String(u.id), mapUserToStudentProfile(u))
    }
  } catch {
    /* profesor puede no tener listado completo */
  }
  return map
}

async function enrichUsersNameMap(userMap, userIds) {
  const missing = userIds.filter((id) => {
    const profile = userMap.get(String(id))
    return !profile?.name
  })
  await Promise.all(
    missing.map(async (id) => {
      try {
        const u = await request(`/auth/usuarios/${id}/`)
        userMap.set(String(id), mapUserToStudentProfile(u))
      } catch {
        /* sin permiso para ese usuario */
      }
    }),
  )
}

async function resolveMissingStudentNames(students, userMap) {
  const enriched = students.map((s) => {
    const profile = userMap.get(String(s.id))
    if (!profile) return s
    return {
      ...s,
      firstName: s.firstName || profile.firstName,
      lastName: s.lastName || profile.lastName,
      name: s.name?.startsWith('Alumno ') ? profile.name : s.name || profile.name,
      email: s.email || profile.email,
    }
  })

  const missing = enriched.filter((s) => !s.firstName && !s.lastName && (s.name || '').startsWith('Alumno '))
  await enrichUsersNameMap(
    userMap,
    missing.map((s) => s.id),
  )
  return enriched.map((s) => {
    const profile = userMap.get(String(s.id))
    if (!profile) return s
    return {
      ...s,
      firstName: s.firstName || profile.firstName,
      lastName: s.lastName || profile.lastName,
      name: s.name?.startsWith('Alumno ') ? profile.name : s.name || profile.name,
      email: s.email || profile.email,
    }
  })
}

function mapStudentFromAsistencia(a, userMap = null) {
  const alumnoId = a.alumno?.id ?? a.alumno
  const nested = typeof a.alumno === 'object' && a.alumno ? a.alumno : null

  let firstName = (a.alumno_first_name || nested?.first_name || '').trim()
  let lastName = (a.alumno_last_name || nested?.last_name || '').trim()
  let email = a.alumno_email || nested?.email || ''

  if (userMap && alumnoId != null) {
    const profile = userMap.get(String(alumnoId))
    if (profile) {
      firstName = firstName || profile.firstName
      lastName = lastName || profile.lastName
      email = email || profile.email
    }
  }

  const fullName =
    [firstName, lastName].filter(Boolean).join(' ') ||
    (a.alumno_nombre || '').trim() ||
    (alumnoId != null ? `Alumno ${alumnoId}` : 'Alumno')

  return {
    id: String(alumnoId ?? a.id),
    asistenciaId: a.alumno != null ? String(a.id) : null,
    firstName,
    lastName,
    name: fullName,
    email,
    present: a.estado_asistencia === 'PRESENTE',
  }
}

function mapDjangoClass(clase, userMap = null) {
  const students = (clase.asistencias || []).map((a) => mapStudentFromAsistencia(a, userMap))

  const horario = new Date(Number(clase.horario))
  return {
    id: String(clase.id),
    profesorId: String(clase.profesor ?? ''),
    name: clase.tipo_clase?.replace('_', ' ') || `Clase #${clase.id}`,
    schedule: horario.toLocaleString('es-AR', { weekday: 'short', hour: '2-digit', minute: '2-digit' }),
    maxStudents: clase.maximo_alumnos || 0,
    students,
  }
}

const PAYMENT_METHOD_MAP = {
  tarjeta: 'TARJETA_CREDITO',
  efectivo: 'EFECTIVO',
  transferencia: 'TRANSFERENCIA',
}

function mapDescuento(raw) {
  const tipo = raw.tipo_descuento || 'PORCENTAJE'
  const valor = Number(raw.porcentaje) || 0
  const descripcion = (raw.descripcion || '').trim()
  const label =
    tipo === 'MONTO_FIJO'
      ? `$${valor.toFixed(2)}${descripcion ? ` — ${descripcion}` : ''}`
      : `${valor}%${descripcion ? ` — ${descripcion}` : ''}`
  return {
    id: String(raw.id),
    tipo,
    valor,
    descripcion,
    activo: raw.activo !== false,
    label,
  }
}

function buildPaidAmountByReserva(cobrosList) {
  const map = new Map()
  for (const c of cobrosList) {
    if (!c.reserva || c.estado_pago !== 'APROBADO') continue
    const rid = String(c.reserva)
    const monto = Number(c.monto) || 0
    if (monto > 0) map.set(rid, monto)
  }
  return map
}

export function applyDiscountToAmount(baseAmount, descuento) {
  if (!descuento?.activo) return Number(baseAmount) || 0
  const base = Number(baseAmount) || 0
  if (descuento.tipo === 'MONTO_FIJO') {
    return Math.max(0, Math.round((base - descuento.valor) * 100) / 100)
  }
  return Math.max(0, Math.round(base * (1 - descuento.valor / 100) * 100) / 100)
}

async function mapCobroFromApi(c, userMap, descuentosMap = new Map()) {
  const profile = userMap.get(String(c.usuario)) || {}
  const descuentoRawId =
    c.descuento != null
      ? String(typeof c.descuento === 'object' ? c.descuento.id : c.descuento)
      : null
  const descFromApi = c.descuento && typeof c.descuento === 'object' ? mapDescuento(c.descuento) : null
  const descFromMap = descuentoRawId ? descuentosMap.get(descuentoRawId) : null
  const descuento = descFromApi || descFromMap

  return {
    id: String(c.id),
    usuarioId: String(c.usuario),
    usuarioNombre: profile.name || '',
    usuarioFirstName: profile.firstName || '',
    usuarioLastName: profile.lastName || '',
    usuarioEmail: c.usuario_email || profile.email || '',
    monto: Number(c.monto) || 0,
    metodoPago: c.metodo_pago || '',
    estadoPago: c.estado_pago || '',
    tipoServicio: c.tipo_servicio || '',
    reservaId: c.reserva ? String(c.reserva) : null,
    claseId: c.clase ? String(c.clase) : null,
    competenciaId: c.competencia ? String(c.competencia) : null,
    descuentoId: descuentoRawId,
    descuentoLabel: descuento?.label || '',
    fechaCobro: c.fecha_cobro,
    reciboId: c.recibo?.id ?? c.recibo ?? null,
    reciboDetalle: c.recibo?.detalle || '',
    reciboFechaEmision: c.recibo?.fecha_emision || null,
  }
}

async function mapReciboFromApi(r, cobrosById = new Map(), userMap = new Map()) {
  const cobroId = String(typeof r.cobro === 'object' ? r.cobro?.id : r.cobro)
  const cobro = cobrosById.get(cobroId)
  const profile = cobro ? userMap.get(String(cobro.usuarioId)) : null
  return {
    id: String(r.id),
    cobroId,
    detalle: r.detalle || '',
    fechaEmision: r.fecha_emision,
    monto: cobro?.monto ?? (Number(r.cobro_monto) || 0),
    metodoPago: cobro?.metodoPago || '',
    tipoServicio: cobro?.tipoServicio || '',
    usuarioNombre: cobro?.usuarioNombre || profile?.name || '',
    usuarioEmail: cobro?.usuarioEmail || profile?.email || '',
  }
}

export const api = {
  /** GET /api/auth/csrf/ — cookie csrftoken (misma origen vía proxy de Vite en local). */
  fetchCsrfToken: fetchCsrfTokenInternal,

  login: async (username, password) => {
    await api.fetchCsrfToken()
    const data = await request('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    const formattedUser = formatUser(data.user || data.data || data)
    if (!formattedUser?.id) {
      throw new Error('El servidor no devolvió datos de usuario tras el login.')
    }
    localStorage.setItem('user_data', JSON.stringify(formattedUser))
    return formattedUser
  },

  register: async (userData) => {
    const details = userData || {}
    let djangoRol = 'SOCIO'
    if (details.role === 'administrador') djangoRol = 'ADMINISTRADOR'
    else if (details.role === 'profesional') djangoRol = 'PROFESOR'

    const firstName = details.name ? details.name.split(' ')[0] : ''
    const lastName = details.name ? details.name.split(' ').slice(1).join(' ') : ' '

    await request('/auth/usuarios/', {
      method: 'POST',
      body: JSON.stringify({
        username: details.username || details.email.split('@')[0],
        email: details.email,
        password: details.password,
        first_name: firstName,
        last_name: lastName || ' ',
        rol: djangoRol,
        telefono: details.telefono || '',
        direccion: details.direccion || '',
      }),
    })

    return api.login(details.username || details.email, details.password)
  },

  /** Actualiza sesión desde GET usuarios/{id}/ (+ profesor si aplica). */
  refreshSessionUser: async () => {
    const stored = JSON.parse(localStorage.getItem('user_data') || '{}')
    if (!stored.id) throw new Error('Sin sesión')

    const data = await request(`/auth/usuarios/${stored.id}/`)
    let formatted = formatUser(data)

    if (formatted.role === 'profesional') {
      try {
        const prof = await api.getProfessor(stored.id)
        formatted = { ...formatted, ...prof }
      } catch {
        /* GET profesores/{id} opcional */
      }
    }

    localStorage.setItem('user_data', JSON.stringify(formatted))
    return formatted
  },

  logout: async () => {
    try {
      await request('/auth/logout/', { method: 'POST' })
    } catch (err) {
      console.error('Error durante logout', err)
    } finally {
      localStorage.removeItem('user_data')
      clearCsrfToken()
    }
  },

  getMe: async () => {
    const stored = localStorage.getItem('user_data')
    if (!stored) throw new Error('Sin sesión')
    const parsed = JSON.parse(stored)
    try {
      return await api.refreshSessionUser()
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) {
        localStorage.removeItem('user_data')
        clearCsrfToken()
      }
      throw err
    }
  },

  getCourts: async (filters = {}) => {
    const params = new URLSearchParams()
    if (filters.tipo_cancha) params.set('tipo_cancha', filters.tipo_cancha)
    const qs = params.toString()
    const data = await request(`/fields/canchas/${qs ? `?${qs}` : ''}`)
    const list = Array.isArray(data) ? data : data.results || []
    return list.map(mapDjangoCourt)
  },

  getProfessors: async () => {
    const data = await request('/auth/profesores/')
    const list = Array.isArray(data) ? data : data.results || []
    return list.map(mapDjangoProfessor)
  },

  /** GET /api/auth/profesores/{id}/ — datos completos del profesor logueado. */
  getProfessor: async (id) => {
    const data = await request(`/auth/profesores/${id}/`)
    const base = formatUser(data)
    const cert = (data.certificacion_deportiva || '').trim()
    return {
      ...base,
      certificacion: cert || '—',
      certificacionVigente: Boolean(cert),
      alumnosCount: data.alumnos_count ?? (Array.isArray(data.alumnos) ? data.alumnos.length : 0),
    }
  },

  getBookings: async () => {
    const data = await request('/bookings/reservas/')
    const list = Array.isArray(data) ? data : data.results || []
    let courts = []
    let paidByReserva = new Map()
    try {
      courts = await api.getCourts()
    } catch {
      courts = []
    }
    try {
      const cobrosData = await request('/finance/cobros/')
      const cobrosList = Array.isArray(cobrosData) ? cobrosData : cobrosData.results || []
      paidByReserva = buildPaidAmountByReserva(cobrosList)
    } catch {
      /* cobros opcionales para clientes sin permiso */
    }
    const storedPaid = getStoredPaidAmounts()
    return list.map((r) => {
      const booking = enrichBookingPrice(mapDjangoReserva(r), courts)
      const paid = paidByReserva.get(String(r.id)) ?? storedPaid[String(r.id)]
      if (paid != null && paid > 0 && booking.status !== 'cancelled' && booking.status !== 'pending') {
        return { ...booking, totalPrice: paid, paidAmount: paid }
      }
      return booking
    })
  },

  /**
   * GET /api/fields/canchas/{id}/disponibilidad/?dia=<epoch_ms>
   * Respuesta: { cancha, dia, reservas: [{ id, hora_inicio, hora_fin, estado, usuario }] }
   */
  getCourtAvailability: async (courtId, dateStr) => {
    const dia = dateStringToEpochMs(dateStr)
    if (!Number.isFinite(dia)) {
      throw new Error('Fecha inválida para consultar disponibilidad.')
    }
    const id = courtPkFromId(courtId)
    return request(`/fields/canchas/${id}/disponibilidad/?dia=${dia}`)
  },

  _mapCourtAvailabilityResponse(data, courtId, dateStr) {
    const courtNumId = String(data.cancha?.id ?? courtPkFromId(courtId))
    const numero = data.cancha?.numero
    return (data.reservas || [])
      .filter((r) => isSlotBlockingStatus(mapFrontStatus(r.estado)))
      .map((r) => {
        const hi = Number(r.hora_inicio)
        const hf = Number(r.hora_fin)
        if (!Number.isFinite(hi) || !Number.isFinite(hf)) return null
        const durationMs = hf - hi
        return {
          id: String(r.id),
          courtId: courtNumId,
          courtName: numero != null ? `Cancha #${numero}` : `Cancha #${courtNumId}`,
          date: dateStr,
          time: msToTimeRange(hi, hf),
          durationHours: Math.max(1, Math.round(durationMs / 3600000)),
          status: mapFrontStatus(r.estado),
        }
      })
      .filter(Boolean)
  },

  /**
   * Horarios ocupados según GET /api/fields/canchas/{id}/disponibilidad/?dia=<epoch_ms>
   * (solo PENDIENTE / CONFIRMADA, como Swagger).
   */
  getOccupiedSlotsForCourt: async (courtId, dateStr, { localBookings } = {}) => {
    const dia = dateStringToEpochMs(dateStr)
    if (!Number.isFinite(dia)) {
      throw new Error('Fecha inválida para consultar disponibilidad.')
    }

    const data = await api.getCourtAvailability(courtId, dateStr)
    const fromApi = api._mapCourtAvailabilityResponse(data, courtId, dateStr)
    return mergeOccupiedSlots(fromApi, localBookings, courtId, dateStr)
  },

  createBooking: async (bookingData) => {
    await assertSlotAvailable(bookingData)
    const user = JSON.parse(localStorage.getItem('user_data') || '{}')
    if (!user.id) {
      throw new Error('Tenés que iniciar sesión para reservar.')
    }

    const reactivated = await resolveGhostBeforePost(bookingData, user.id)
    if (reactivated) return reactivated

    try {
      return await postNewReserva(bookingData, user.id)
    } catch (err) {
      const detail = String(err?.data?.detail || err?.message || '')
      if (
        err?.status === 400 &&
        detail.toLowerCase().includes('ya se encuentra reservada')
      ) {
        throw new Error(
          'Ese horario ya está reservado (pendiente o confirmada). Actualizá la grilla y elegí otro turno.',
        )
      }
      if (err?.status === 500) {
        try {
          const again = await resolveGhostBeforePost(bookingData, user.id)
          if (again) return again
          return await postNewReserva(bookingData, user.id)
        } catch (retryErr) {
          const exact = await findExactSlotReservation(bookingData, user.id)
          if (exact) {
            throw new Error(
              `No se pudo crear la reserva: el turno #${exact.id} (${exact.status}) sigue ocupando este horario en el servidor. Elegí otro horario o contactá al administrador.`,
            )
          }
          throw new Error(
            'Error interno al crear la reserva (500). Revisá la consola del backend o probá otro horario.',
          )
        }
      }
      throw err
    }
  },

  /**
   * POST /api/bookings/reservas/{id}/cambiar_estado/
   * Body: { "estado": "PENDIENTE" | "CONFIRMADA" | "CANCELADA" } (según Swagger actual).
   */
  updateBookingStatus: async (id, status, previousBooking = null) => {
    const djangoEstado = mapDjangoStatus(status)
    const data = await request(CAMBIAR_ESTADO_PATH(id), {
      method: 'POST',
      body: JSON.stringify({ estado: djangoEstado }),
    })
    const mapped = mapDjangoReserva(data)
    return previousBooking ? mergeBookingFromClient(mapped, previousBooking) : mapped
  },

  /**
   * Turno finalizado → COMPLETADA si el backend lo admite; si no, solo actualización en UI.
   */
  finalizeBooking: async (booking) => {
    try {
      return await api.updateBookingStatus(booking.id, 'completed', booking)
    } catch (err) {
      if (err?.status === 400) {
        return { ...booking, status: 'completed' }
      }
      throw err
    }
  },

  /** Cancelar vía cambiar_estado → CANCELADA (preferido sobre DELETE). */
  cancelBooking: async (id, previousBooking = null) => {
    const updated = await api.updateBookingStatus(id, 'cancelled', previousBooking)
    return { ...updated, status: 'cancelled', totalPrice: 0 }
  },

  deleteBooking: async (id) => {
    await request(`/bookings/reservas/${id}/`, { method: 'DELETE' })
  },

  /** PATCH /api/bookings/reservas/{id}/ — editar reserva */
  updateBooking: async (id, bookingData, previousBooking = null) => {
    const userId = previousBooking?.userId || JSON.parse(localStorage.getItem('user_data') || '{}').id
    const merged = { ...previousBooking, ...bookingData }
    const payload = parseBookingToDjango(merged, userId)
    const { usuario: _u, ...patchBody } = payload
    const data = await request(`/bookings/reservas/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(patchBody),
    })
    const mapped = mapDjangoReserva(data)
    return mergeBookingFromClient(mapped, merged)
  },

  /** GET /api/bookings/disponibilidad/?fecha=<epoch_ms> — calendario global */
  getGlobalAvailability: async (dateStr) => {
    const fecha = dateStringToEpochMs(dateStr)
    if (!Number.isFinite(fecha)) {
      throw new Error('Fecha inválida para consultar disponibilidad global.')
    }
    const data = await request(`/bookings/disponibilidad/?fecha=${fecha}`)
    return Array.isArray(data) ? data : []
  },

  createCourt: async (form) => {
    const data = await request('/fields/canchas/', {
      method: 'POST',
      body: JSON.stringify(courtFormToPayload(form)),
    })
    return mapDjangoCourt(data)
  },

  updateCourt: async (id, form) => {
    const data = await request(`/fields/canchas/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(courtFormToPayload(form)),
    })
    return mapDjangoCourt(data)
  },

  deleteCourt: async (id) => {
    await request(`/fields/canchas/${id}/`, { method: 'DELETE' })
  },

  createClass: async (form) => {
    const userMap = await fetchUsersNameMap()
    const data = await request('/bookings/clases/', {
      method: 'POST',
      body: JSON.stringify(classFormToPayload(form)),
    })
    return mapDjangoClassDetailed(data, userMap)
  },

  updateClass: async (id, form) => {
    const userMap = await fetchUsersNameMap()
    const data = await request(`/bookings/clases/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(classFormToPayload(form)),
    })
    return mapDjangoClassDetailed(data, userMap)
  },

  deleteClass: async (id) => {
    await request(`/bookings/clases/${id}/`, { method: 'DELETE' })
  },

  getAllClasses: async () => {
    const userMap = await fetchUsersNameMap()
    const data = await request('/bookings/clases/')
    const list = Array.isArray(data) ? data : data.results || []
    return list.map((c) => mapDjangoClassDetailed(c, userMap))
  },

  /** GET /api/bookings/asistencia/ — historial de asistencias */
  getAsistencias: async () => {
    const [asistData, classData] = await Promise.all([
      request('/bookings/asistencia/'),
      request('/bookings/clases/'),
    ])
    const list = Array.isArray(asistData) ? asistData : asistData.results || []
    const classes = Array.isArray(classData) ? classData : classData.results || []
    const classMap = new Map(classes.map((c) => [String(c.id), c]))
    const userMap = await fetchUsersNameMap()
    await enrichUsersNameMap(
      userMap,
      list.map((a) => a.alumno?.id ?? a.alumno).filter(Boolean),
    )
    return list.map((a) => {
      const cls = classMap.get(String(a.clase))
      const student = mapStudentFromAsistencia(a, userMap)
      const horarioMs = cls ? Number(cls.horario) : null
      return {
        id: String(a.id),
        claseId: String(a.clase),
        claseName: cls?.tipo_clase?.replace('_', ' ') || `Clase #${a.clase}`,
        claseHorario: horarioMs,
        claseHorarioLabel: horarioMs
          ? new Date(horarioMs).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
          : '—',
        alumnoId: student.id,
        alumnoName: student.name,
        alumnoEmail: student.email,
        estado: a.estado_asistencia,
        present: a.estado_asistencia === 'PRESENTE',
        fechaRegistro: a.fecha,
        fechaRegistroLabel: a.fecha
          ? new Date(Number(a.fecha)).toLocaleString('es-AR')
          : '—',
      }
    })
  },

  adminGetUsers: async () => {
    const data = await request('/auth/usuarios/')
    const list = Array.isArray(data) ? data : data.results || []
    return list.map((u) => ({
      id: String(u.id),
      name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username,
      email: u.email,
      role: mapDjangoRole(u.rol),
      rol: u.rol,
      activo: u.activo !== false,
      telefono: u.telefono || '',
      direccion: u.direccion || '',
    }))
  },

  adminUpdateUser: async (id, patch) => {
    const body = {}
    if (patch.name != null) {
      const parts = String(patch.name).trim().split(/\s+/)
      body.first_name = parts[0] || ''
      body.last_name = parts.slice(1).join(' ') || ' '
    }
    if (patch.email != null) body.email = patch.email
    if (patch.telefono != null) body.telefono = patch.telefono
    if (patch.direccion != null) body.direccion = patch.direccion
    if (patch.role != null) body.rol = mapRoleToDjango(patch.role)
    if (patch.activo != null) body.activo = Boolean(patch.activo)
    const data = await request(`/auth/usuarios/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
    return {
      id: String(data.id),
      name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.username,
      email: data.email,
      role: mapDjangoRole(data.rol),
      rol: data.rol,
      activo: data.activo !== false,
      telefono: data.telefono || '',
      direccion: data.direccion || '',
    }
  },

  adminDeleteUser: async (id) => {
    await request(`/auth/usuarios/${id}/`, { method: 'DELETE' })
  },

  updateProfile: async (patch) => {
    const user = JSON.parse(localStorage.getItem('user_data') || '{}')
    if (!user.id) throw new Error('Usuario no identificado')

    const parts = (patch.name || user.name || '').trim().split(/\s+/)
    const updated = await request(`/auth/usuarios/${user.id}/`, {
      method: 'PATCH',
      body: JSON.stringify({
        first_name: parts[0] || user.name,
        last_name: parts.slice(1).join(' ') || ' ',
        telefono: patch.telefono ?? user.telefono,
        direccion: patch.direccion ?? user.direccion,
      }),
    })
    const formatted = formatUser(updated)
    localStorage.setItem('user_data', JSON.stringify(formatted))
    return formatted
  },

  processPayment: async (bookingId, method, bookingFromUI = null, descuentoId = null) => {
    const user = JSON.parse(localStorage.getItem('user_data') || '{}')
    const bookings = await api.getBookings()
    const booking =
      bookingFromUI ||
      bookings.find((b) => b.id === String(bookingId))
    let monto = Number(booking?.totalPrice) || 0
    if (monto <= 0) {
      throw new Error('No se pudo determinar el monto de la reserva. Volvé a cargar la página.')
    }

    let descuentoPayload = null
    if (descuentoId) {
      const descuentos = await api.getDescuentos()
      const desc = descuentos.find((d) => d.id === String(descuentoId) && d.activo)
      if (desc) {
        descuentoPayload = Number(desc.id)
        monto = applyDiscountToAmount(monto, desc)
      }
    }

    const cobro = await request('/finance/cobros/', {
      method: 'POST',
      body: JSON.stringify({
        usuario: Number(user.id),
        tipo_servicio: 'RESERVA',
        reserva: Number(bookingId),
        monto,
        metodo_pago: PAYMENT_METHOD_MAP[method] || 'EFECTIVO',
        estado_pago: 'PENDIENTE',
        ...(descuentoPayload ? { descuento: descuentoPayload } : {}),
      }),
    })

    const approved = await request(`/finance/cobros/${cobro.id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ estado_pago: 'APROBADO' }),
    })

    const bookingWithPrice = { ...booking, totalPrice: monto, paidAmount: monto }
    const updatedBooking = await api.updateBookingStatus(bookingId, 'confirmed', bookingWithPrice)
    const confirmedBooking = { ...updatedBooking, status: 'confirmed', totalPrice: monto, paidAmount: monto }
    setStoredPaidAmount(bookingId, monto)

    let reciboApi = null
    const reciboId = approved.recibo?.id ?? approved.recibo
    if (reciboId) {
      try {
        reciboApi = await api.getRecibo(reciboId)
      } catch {
        reciboApi = null
      }
    }

    return {
      booking: confirmedBooking,
      recibo: {
        id: reciboApi?.id ?? reciboId ?? cobro.id,
        numero: reciboApi?.id ?? reciboId ?? cobro.id,
        monto: Number(reciboApi?.cobro_monto ?? approved.monto ?? monto),
        metodo: method,
        metodoPago: method,
        emitidoEn: reciboApi?.fecha_emision
          ? new Date(Number(reciboApi.fecha_emision)).toISOString()
          : new Date().toISOString(),
        detalle: reciboApi?.detalle || `Pago reserva #${bookingId}`,
        cliente: user.name || user.email,
        courtName: booking.courtName,
        fecha: booking.date,
        horario: booking.time,
        cobroId: cobro.id,
      },
    }
  },

  getCobros: async () => {
    const userMap = await fetchUsersNameMap()
    const descuentos = await api.getDescuentos().catch(() => [])
    const descuentosMap = new Map(descuentos.map((d) => [d.id, d]))
    const data = await request('/finance/cobros/')
    const list = Array.isArray(data) ? data : data.results || []
    const userIds = [...new Set(list.map((c) => c.usuario).filter((id) => id != null))]
    await enrichUsersNameMap(userMap, userIds)
    return Promise.all(list.map((c) => mapCobroFromApi(c, userMap, descuentosMap)))
  },

  getCobro: async (id) => {
    const userMap = await fetchUsersNameMap()
    const descuentos = await api.getDescuentos().catch(() => [])
    const descuentosMap = new Map(descuentos.map((d) => [d.id, d]))
    const data = await request(`/finance/cobros/${id}/`)
    await enrichUsersNameMap(userMap, [data.usuario])
    return mapCobroFromApi(data, userMap, descuentosMap)
  },

  updateCobro: async (id, patch) => {
    const body = {}
    if (patch.estadoPago != null) body.estado_pago = patch.estadoPago
    if (patch.metodoPago != null) body.metodo_pago = patch.metodoPago
    if (patch.monto != null) body.monto = patch.monto
    if (patch.descuentoId !== undefined) {
      body.descuento = patch.descuentoId ? Number(patch.descuentoId) : null
    }
    const data = await request(`/finance/cobros/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
    return api.getCobro(data.id ?? id)
  },

  deleteCobro: async (id) => {
    await request(`/finance/cobros/${id}/`, { method: 'DELETE' })
  },

  getRecibos: async () => {
    const [recibosRaw, cobros] = await Promise.all([
      request('/finance/recibos/').then((d) => (Array.isArray(d) ? d : d.results || [])),
      api.getCobros(),
    ])
    const cobrosById = new Map(cobros.map((c) => [c.id, c]))
    const userMap = await fetchUsersNameMap()
    return Promise.all(recibosRaw.map((r) => mapReciboFromApi(r, cobrosById, userMap)))
  },

  getRecibo: async (id) => {
    const data = await request(`/finance/recibos/${id}/`)
    const cobroId = typeof data.cobro === 'object' ? data.cobro?.id : data.cobro
    let cobro = null
    if (cobroId) {
      try {
        cobro = await api.getCobro(cobroId)
      } catch {
        cobro = null
      }
    }
    return {
      id: String(data.id),
      detalle: data.detalle || '',
      fecha_emision: data.fecha_emision,
      cobroId: cobroId ? String(cobroId) : null,
      cobro_monto: cobro?.monto ?? (Number(data.cobro_monto) || 0),
      metodoPago: cobro?.metodoPago || '',
      tipoServicio: cobro?.tipoServicio || '',
      usuarioNombre: cobro?.usuarioNombre || '',
      usuarioEmail: cobro?.usuarioEmail || '',
    }
  },

  getDescuentos: async () => {
    const data = await request('/finance/descuentos/')
    const list = Array.isArray(data) ? data : data.results || []
    return list.map(mapDescuento)
  },

  createDescuento: async (payload) => {
    const data = await request('/finance/descuentos/', {
      method: 'POST',
      body: JSON.stringify({
        tipo_descuento: payload.tipo,
        porcentaje: payload.valor,
        descripcion: payload.descripcion || '',
        activo: payload.activo !== false,
      }),
    })
    return mapDescuento(data)
  },

  updateDescuento: async (id, payload) => {
    const body = {}
    if (payload.tipo != null) body.tipo_descuento = payload.tipo
    if (payload.valor != null) body.porcentaje = payload.valor
    if (payload.descripcion != null) body.descripcion = payload.descripcion
    if (payload.activo != null) body.activo = payload.activo
    const data = await request(`/finance/descuentos/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
    return mapDescuento(data)
  },

  deleteDescuento: async (id) => {
    await request(`/finance/descuentos/${id}/`, { method: 'DELETE' })
  },

  getClasses: async (professorId = null) => {
    const userMap = await fetchUsersNameMap()
    const data = await request('/bookings/clases/')
    let list = Array.isArray(data) ? data : data.results || []
    if (professorId != null) {
      list = list.filter((c) => String(c.profesor) === String(professorId))
    }
    const mapped = list.map((c) => mapDjangoClass(c, userMap))
    return Promise.all(
      mapped.map(async (cls) => ({
        ...cls,
        students: await resolveMissingStudentNames(cls.students, userMap),
      })),
    )
  },

  saveAttendance: async (classId, students) => {
    const estado = (present) => (present ? 'PRESENTE' : 'AUSENTE')

    for (const st of students) {
      const body = JSON.stringify({
        clase: Number(classId),
        alumno: Number(st.id),
        estado_asistencia: estado(st.present),
      })

      if (st.asistenciaId) {
        await request(`/bookings/asistencia/${st.asistenciaId}/`, {
          method: 'PATCH',
          body: JSON.stringify({ estado_asistencia: estado(st.present) }),
        })
      } else {
        await request('/bookings/asistencia/', { method: 'POST', body })
      }
    }
  },
}
