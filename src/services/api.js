const PROTOCOL = import.meta.env.VITE_API_PROTOCOL || 'http'
const DOMAIN = import.meta.env.VITE_API_DOMAIN || 'localhost'
const PORT = import.meta.env.VITE_API_PORT || '8000'
const API_URL = import.meta.env.VITE_API_URL || `${PROTOCOL}://${DOMAIN}:${PORT}/api`

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
    const errorMsg =
      data.detail ||
      data.error ||
      (typeof data === 'object' ? JSON.stringify(data) : data) ||
      `Error ${response.status} en la petición.`
    throw new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg))
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
  const map = {
    PENDIENTE: 'pending',
    CONFIRMADA: 'confirmed',
    CANCELADA: 'completed',
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
  }
  return map[status] || 'PENDIENTE'
}

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

  return {
    id: String(r.id),
    userEmail: r.usuario_email || r.usuario?.email || '',
    courtId: String(r.cancha),
    courtName: r.cancha_nombre || `Cancha #${r.cancha}`,
    type: r.tipo_cancha || 'Cancha',
    date: dateStr,
    time: msToTimeRange(r.hora_inicio, r.hora_fin),
    durationHours,
    extras: [],
    totalPrice: Number(r.monto) || 0,
    status: mapFrontStatus(r.estado),
  }
}

function mapDjangoCourt(c) {
  return {
    id: String(c.id),
    name: `Cancha #${c.numero}`,
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

function mapDjangoClass(clase) {
  const students = (clase.asistencias || []).map((a) => ({
    id: String(a.alumno ?? a.id),
    name: a.alumno_nombre || a.nombre || `Alumno ${a.alumno}`,
    email: a.alumno_email || '',
    present: a.estado_asistencia === 'PRESENTE',
  }))

  const horario = new Date(Number(clase.horario))
  return {
    id: String(clase.id),
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

  login: async (email, password) => {
    const data = await request('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username: email, password }),
    })
    const formattedUser = formatUser(data.user || data.data || data)
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
      }),
    })

    return api.login(details.email, details.password)
  },

  logout: async () => {
    try {
      await request('/auth/logout/', { method: 'POST' })
    } catch (err) {
      console.error('Error durante logout', err)
    } finally {
      localStorage.removeItem('user_data')
    }
  },

  getMe: async () => {
    const stored = localStorage.getItem('user_data')
    if (!stored) throw new Error('Sin sesión')
    try {
      await request('/bookings/reservas/', { method: 'GET' })
      return JSON.parse(stored)
    } catch (err) {
      localStorage.removeItem('user_data')
      throw err
    }
  },

  getCourts: async () => {
    const data = await request('/fields/canchas/')
    const list = Array.isArray(data) ? data : data.results || []
    return list.map(mapDjangoCourt)
  },

  getProfessors: async () => {
    const data = await request('/auth/profesores/')
    const list = Array.isArray(data) ? data : data.results || []
    return list.map(mapDjangoProfessor)
  },

  getBookings: async () => {
    const data = await request('/bookings/reservas/')
    const list = Array.isArray(data) ? data : data.results || []
    return list.map(mapDjangoReserva)
  },

  getOccupiedBookings: async () => {
    const all = await api.getBookings()
    return all.filter((b) => b.status !== 'completed')
  },

  createBooking: async (bookingData) => {
    const user = JSON.parse(localStorage.getItem('user_data') || '{}')
    const payload = parseBookingToDjango(bookingData, user.id)
    const created = await request('/bookings/reservas/', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return mapDjangoReserva(created)
  },

  updateBookingStatus: async (id, status) => {
    const updated = await request(`/bookings/reservas/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ estado: mapDjangoStatus(status) }),
    })
    return mapDjangoReserva(updated)
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

  processPayment: async (bookingId, method) => {
    const user = JSON.parse(localStorage.getItem('user_data') || '{}')
    const bookings = await api.getBookings()
    const booking = bookings.find((b) => b.id === String(bookingId))

    const cobro = await request('/finance/cobros/', {
      method: 'POST',
      body: JSON.stringify({
        usuario: Number(user.id),
        tipo_servicio: 'RESERVA',
        reserva: Number(bookingId),
        monto: booking?.totalPrice || 0,
        metodo_pago: PAYMENT_METHOD_MAP[method] || 'EFECTIVO',
        estado_pago: 'PENDIENTE',
      }),
    })

    const approved = await request(`/finance/cobros/${cobro.id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ estado_pago: 'APROBADO' }),
    })

    await api.updateBookingStatus(bookingId, 'confirmed')
    const updatedBooking = (await api.getBookings()).find((b) => b.id === String(bookingId)) || booking

    return {
      booking: { ...updatedBooking, status: 'confirmed' },
      recibo: {
        numero: approved.recibo?.id || cobro.id,
        monto: approved.monto,
        metodo: method,
        fecha: new Date().toLocaleDateString('es-AR'),
      },
    }
  },

  getClasses: async () => {
    const data = await request('/bookings/clases/')
    const list = Array.isArray(data) ? data : data.results || []
    return list.map(mapDjangoClass)
  },

  saveAttendance: async (classId, students) => {
    for (const st of students) {
      await request('/bookings/asistencia/', {
        method: 'POST',
        body: JSON.stringify({
          clase: Number(classId),
          alumno: Number(st.id),
          estado_asistencia: st.present ? 'PRESENTE' : 'AUSENTE',
        }),
      })
    }
  },
}
