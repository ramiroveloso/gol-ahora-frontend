import { mockApi } from './mockApi.js'

/** true = datos locales (sin backend). false = API Django/FastAPI real. */
export const isMockMode = import.meta.env.VITE_USE_MOCK === 'true'

const USE_MOCK = isMockMode

function resolveApiUrl() {
  const fromEnv = import.meta.env.VITE_API_URL
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  if (import.meta.env.DEV) return 'http://127.0.0.1:8000'
  return 'https://gol-ahora-backend-1.onrender.com'
}

const API_URL = resolveApiUrl()

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token')
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  let data = {}
  try {
    data = await response.json()
  } catch {
    data = {}
  }

  if (!response.ok) {
    const errorMsg = data.detail || data.error || `Error ${response.status} en la petición.`
    throw new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg))
  }
  return data
}

const httpApi = {
  login: async (email, password) => {
    const data = await request('/api/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username: email, password }),
    })
    return {
      name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.username,
      email: data.email,
      role: mapDjangoRole(data.rol),
    }
  },

  register: async (data) => {
    const parts = data.name.trim().split(/\s+/)
    await request('/api/auth/usuarios/', {
      method: 'POST',
      body: JSON.stringify({
        username: data.email.split('@')[0],
        email: data.email,
        password: data.password,
        first_name: parts[0] || data.name,
        last_name: parts.slice(1).join(' ') || '-',
        rol: mapFrontRoleToDjango(data.role),
        telefono: data.telefono,
        direccion: data.direccion,
      }),
    })
    return httpApi.login(data.email, data.password)
  },

  logout: () => {
    localStorage.removeItem('token')
    request('/api/auth/logout/', { method: 'POST' }).catch(() => {})
  },

  getMe: async () => {
    const list = await request('/api/auth/usuarios/')
    const token = localStorage.getItem('token')
    const user = Array.isArray(list) ? list[0] : list
    if (!user) throw new Error('Sesión no válida')
    return {
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
      email: user.email,
      role: mapDjangoRole(user.rol),
    }
  },

  getCourts: async () => {
    const data = await request('/api/fields/canchas/')
    return Array.isArray(data) ? data.map(mapDjangoCourt) : []
  },

  getProfessors: async () => {
    const data = await request('/api/auth/profesores/')
    return Array.isArray(data) ? data.map(mapDjangoProfessor) : []
  },

  getBookings: async () => request('/api/bookings/reservas/'),

  getOccupiedBookings: async () => request('/api/bookings/reservas/'),

  createBooking: async (bookingData) =>
    request('/api/bookings/reservas/', { method: 'POST', body: JSON.stringify(bookingData) }),

  updateBookingStatus: async (id, status) =>
    request(`/api/bookings/reservas/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ estado: status }),
    }),

  deleteBooking: async (id) => request(`/api/bookings/reservas/${id}/`, { method: 'DELETE' }),

  adminGetUsers: async () => {
    const data = await request('/api/auth/usuarios/')
    const list = Array.isArray(data) ? data : data.results || []
    return list.map(mapDjangoUser)
  },

  adminDeleteUser: async (id) => request(`/api/auth/usuarios/${id}/`, { method: 'DELETE' }),

  updateProfile: async () => {
    throw new Error('Actualizar perfil requiere backend configurado')
  },

  processPayment: async () => {
    throw new Error('Pagos requieren backend finance configurado')
  },

  getClasses: async () => request('/api/bookings/clases/'),

  saveAttendance: async (classId, students) =>
    request(`/api/bookings/asistencia/`, {
      method: 'POST',
      body: JSON.stringify({ clase_id: classId, alumnos: students }),
    }),
}

function mapDjangoRole(rol) {
  if (rol === 'ADMINISTRADOR') return 'administrador'
  if (rol === 'PROFESOR') return 'profesional'
  return 'cliente'
}

function mapFrontRoleToDjango(role) {
  if (role === 'administrador') return 'ADMINISTRADOR'
  if (role === 'profesional') return 'PROFESOR'
  return 'SOCIO'
}

function mapDjangoCourt(c) {
  return {
    id: String(c.id),
    name: `Cancha #${c.numero}`,
    type: c.tipo_cancha?.replace('FUTBOL_', 'Fútbol ') || 'Cancha',
    turf: c.superficie?.replace(/_/g, ' ') || '',
    roofed: false,
    pricePerHour: Number(c.precio_base_hora) || 0,
    rating: '—',
    icon: 'stadium',
    disponible: c.estado_disponibilidad !== false,
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

function mapDjangoUser(u) {
  return {
    id: String(u.id),
    name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username,
    email: u.email,
    role: mapDjangoRole(u.rol),
  }
}

export const api = USE_MOCK ? mockApi : httpApi
