import { dateStringToEpochMs } from '../utils/bookingRules.js'
import { formatApiError } from '../utils/apiErrors.js'

const PROTOCOL = import.meta.env.VITE_API_PROTOCOL || 'http'
const DOMAIN = import.meta.env.VITE_API_DOMAIN || 'localhost'
const PORT = import.meta.env.VITE_API_PORT || '8000'

// CORRECCIÓN: Aseguramos que API_URL no deje barras flotantes ambiguas
const BASE_URL_ENV = import.meta.env.VITE_API_URL
const API_URL = BASE_URL_ENV ? BASE_URL_ENV.replace(/\/$/, '') : `${PROTOCOL}://${DOMAIN}:${PORT}/api`

/** Siempre false: conexión al backend Django (sesión + CSRF). */
export const isMockMode = false

function getCsrfToken() {
  const name = 'csrftoken'
  if (!document.cookie) return null
  const cookies = document.cookie.split(';')
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim()
    if (cookie.substring(0, name.length + 1) === `${name}=`) {
      return decodeURIComponent(cookie.substring(name.length + 1))
    }
  }
  return null
}

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  const method = (options.method || 'GET').toUpperCase()
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = getCsrfToken()
    if (csrfToken) headers['X-CSRFToken'] = csrfToken
  }

  const config = {
    ...options,
    headers,
    credentials: 'include',
  }

  // Normalizamos para evitar que se junten dobles barras (ej: api//auth)
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const response = await fetch(`${API_URL}${cleanEndpoint}`, config)
  const isNoContent = response.status === 204
  let data = {}

  if (!isNoContent) {
    try {
      data = await response.json()
    } catch {
      data = { detail: 'La respuesta del servidor no es un JSON válido' }
    }
  }

  if (!response.ok) {
    const errorMsg =
      data.detail ||
      data.error ||
      (typeof data === 'object' ? JSON.stringify(data) : data) ||
      `Error ${response.status} en la petición.`
    throw new Error(formatApiError({ message: typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg) }))
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
    // ADAPTADO: Agregamos soporte para la nomenclatura snake_case de Django
    codigoPostal: djangoUser.codigo_postal || djangoUser.codigoPostal || djangoUser.codigopostal || '',
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
  const map = {
    PENDIENTE: 'pending',
    CONFIRMADA: 'confirmed',
    CANCELADA: 'cancelled',
    COMPLETADA: 'completed',
  }
  return map[estado] || 'pending'
}

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

function parseBookingToDjango(booking, userId) {
  const [startPart] = (booking.time || '08:00 - 09:00').split(' - ')
  const [h, m] = startPart.split(':').map(Number)
  const start = new Date(`${booking.date}T${String(h).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}:00`)
  const startMs = start.getTime()
  const endMs = startMs + (booking.durationHours || 1) * 3600000

  return {
    usuario: Number(userId),
    cancha: Number(String(booking.courtId).replace(/\D/g, '') || booking.courtId),
    fecha_reserva: startMs,
    hora_inicio: startMs,
    hora_fin: endMs,
  }
}

function mapDjangoReserva(r) {
  const fecha = r.fecha_reserva ?? r.hora_inicio
  const dateObj = new Date(Number(fecha))
  const dateStr = dateObj.toISOString().split('T')[0]
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
    tipoCancha: c.tipo_cancha || '',
    type: c.tipo_cancha?.replace('FUTBOL_', 'Fútbol ') || 'Cancha',
    turf: c.superficie?.replace(/_/g, ' ') || '',
    roofed: false,
    pricePerHour: Number(c.precio_base_hora) || 0,
    maxDurationMinutes: Number(c.duracion_maxima_reserva) || 120,
    rating: '—',
    icon: 'stadium',
    disponible: c.estado_disponibilidad !== false && c.activa !== false,
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

function mapStudentFromAsistencia(a) {
  const firstName = (a.alumno_first_name || '').trim()
  const lastName = (a.alumno_last_name || '').trim()
  const fullName =
    [firstName, lastName].filter(Boolean).join(' ') ||
    (a.alumno_nombre || '').trim() ||
    `Alumno ${a.alumno}`

  return {
    id: String(a.alumno ?? a.id),
    asistenciaId: a.alumno != null ? String(a.id) : null,
    firstName,
    lastName,
    name: fullName,
    email: a.alumno_email || '',
    present: a.estado_asistencia === 'PRESENTE',
  }
}

function mapDjangoClass(clase) {
  const students = (clase.asistencias || []).map(mapStudentFromAsistencia)
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

export const api = {
  fetchCsrfToken: async () => {
    try {
      await fetch(`${API_URL}/auth/login/`, { method: 'GET', credentials: 'include' })
    } catch (error) {
      console.warn('CSRF cookie:', error)
    }
  },

  login: async (usernameOrEmail, password) => {
    const data = await request('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username: usernameOrEmail, password }),
    })
    
    // CONTROL PROTEGIDO: Si DRF devuelve el usuario suelto o adentro de data.user
    const targetUser = data.user || data.data || (data.token ? null : data)
    const formattedUser = formatUser(targetUser || { username: usernameOrEmail, email: usernameOrEmail, rol: 'SOCIO' })
    
    if (data.token) {
      localStorage.setItem('token', data.token)
    }
    
    if (formattedUser) localStorage.setItem('user_data', JSON.stringify(formattedUser))
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
        localidad: details.localidad || '',
        provincia: details.provincia || '',
        codigo_postal: details.codigoPostal || '', // Mapeado exacto para el backend
      }),
    })

    return api.login(details.username || details.email, details.password)
  },

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
        /* Opcional */
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
      localStorage.removeItem('token') // Limpieza total de llaves
    }
  },

  getMe: async () => {
    const stored = localStorage.getItem('user_data')
    if (!stored) throw new Error('Sin sesión')
    try {
      await request('/bookings/reservas/', { method: 'GET' })
      return api.refreshSessionUser()
    } catch (err) {
      localStorage.removeItem('user_data')
      localStorage.removeItem('token')
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
    try {
      courts = await api.getCourts()
    } catch {
      courts = []
    }
    return list.map((r) => enrichBookingPrice(mapDjangoReserva(r), courts))
  },

  getAvailability: async (dateStr) => {
    const fecha = dateStringToEpochMs(dateStr)
    const data = await request(`/bookings/disponibilidad/?fecha=${fecha}`)
    return Array.isArray(data) ? data : []
  },

  mapAvailabilityToBookings(dateStr, canchasData) {
    const bookings = []
    for (const court of canchasData) {
      for (const slot of court.horarios_ocupados || []) {
        const time = msToTimeRange(slot.hora_inicio, slot.hora_fin)
        const durationMs = Number(slot.hora_fin) - Number(slot.hora_inicio)
        const durationHours = Math.max(1, Math.round(durationMs / 3600000))
        bookings.push({
          id: `avail-${court.cancha_id}-${slot.hora_inicio}`,
          courtId: String(court.cancha_id),
          courtName: `Cancha #${court.numero}`,
          date: dateStr,
          time,
          durationHours,
          status: 'confirmed',
        })
      }
    }
    return bookings
  },

  getOccupiedBookings: async (dateStr) => {
    if (dateStr) {
      const raw = await api.getAvailability(dateStr)
      return api.mapAvailabilityToBookings(dateStr, raw)
    }
    const all = await api.getBookings()
    return all.filter((b) => b.status !== 'completed' && b.status !== 'cancelled')
  },

  createBooking: async (bookingData) => {
    const user = JSON.parse(localStorage.getItem('user_data') || '{}')
    const payload = parseBookingToDjango(bookingData, user.id)
    const created = await request('/bookings/reservas/', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    const mapped = mergeBookingFromClient(mapDjangoReserva(created), bookingData)
    return enrichBookingPrice(mapped, [])
  },

  updateBookingStatus: async (id, status, previousBooking = null) => {
    const djangoEstado = mapDjangoStatus(status)
    const data = await request(CAMBIAR_ESTADO_PATH(id), {
      method: 'POST',
      body: JSON.stringify({ estado: djangoEstado }),
    })
    const mapped = mapDjangoReserva(data)
    return previousBooking
      ? mergeBookingFromClient(mapped, previousBooking)
      : mapped
  },

  finalizeBooking: async (booking) => {
    return api.updateBookingStatus(booking.id, 'completed', booking)
  },

  cancelBooking: async (id, previousBooking = null) => {
    const updated = await api.updateBookingStatus(id, 'cancelled', previousBooking)
    return { ...updated, status: 'cancelled', totalPrice: 0 }
  },

  deleteBooking: async (id) => {
    await request(`/bookings/reservas/${id}/`, { method: 'DELETE' })
  },

  adminGetUsers: async () => {
    const data = await request('/auth/usuarios/')
    const list = Array.isArray(data) ? data : data.results || []
    return list.map((u) => ({
      id: String(u.id),
      name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username,
      email: u.email,
      role: mapDjangoRole(u.rol),
    }))
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

  processPayment: async (bookingId, method, bookingFromUI = null) => {
    const user = JSON.parse(localStorage.getItem('user_data') || '{}')
    const bookings = await api.getBookings()
    const booking =
      bookingFromUI ||
      bookings.find((b) => b.id === String(bookingId))
    const monto = Number(booking?.totalPrice) || 0
    if (monto <= 0) {
      throw new Error('No se pudo determinar el monto de la reserva. Volvé a cargar la página.')
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
      }),
    })

    const approved = await request(`/finance/cobros/${cobro.id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ estado_pago: 'APROBADO' }),
    })

    const updatedBooking = await api.updateBookingStatus(bookingId, 'confirmed', booking)

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
      booking: updatedBooking,
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
    const data = await request('/finance/cobros/')
    const list = Array.isArray(data) ? data : data.results || []
    return list.map((c) => ({
      id: String(c.id),
      usuarioId: String(c.usuario),
      usuarioEmail: c.usuario_email || '',
      monto: Number(c.monto) || 0,
      metodoPago: c.metodo_pago || '',
      estadoPago: c.estado_pago || '',
      tipoServicio: c.tipo_servicio || '',
      reservaId: c.reserva ? String(c.reserva) : null,
      fechaCobro: c.fecha_cobro,
      reciboId: c.recibo?.id ?? c.recibo ?? null,
    }))
  },

  getRecibo: async (id) => {
    const data = await request(`/finance/recibos/${id}/`)
    return {
      id: data.id,
      detalle: data.detalle || '',
      fecha_emision: data.fecha_emision,
      cobro: data.cobro,
      cobro_monto: data.cobro_monto,
    }
  },

  getClasses: async (professorId = null) => {
    const data = await request('/bookings/clases/')
    let list = Array.isArray(data) ? data : data.results || []
    if (professorId != null) {
      list = list.filter((c) => String(c.profesor) === String(professorId))
    }
    return list.map(mapDjangoClass)
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