// Definimos la URL base usando la variable de entorno de Vercel. 
// Si no existe (desarrollo local), usa la de Render de respaldo.
const API_URL = import.meta.env.VITE_API_URL || "https://gol-ahora-backend-1.onrender.com";

// Base request wrapper that injects JWT token
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token')
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  }

  // Inject Bearer Authorization header if token is present
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const config = {
    ...options,
    headers
  }

  // Ejecuta la petición unificando la URL base con el endpoint
  const response = await fetch(`${API_URL}${endpoint}`, config)
  const data = await response.json()

  if (!response.ok) {
    const errorMsg = data.detail || data.error || `Error ${response.status} en la petición.`
    throw new Error(errorMsg)
  }

  return data
}

export const api = {
  // Authentication methods
  login: async (email, password) => {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
    
    if (data.token) {
      localStorage.setItem('token', data.token)
    }
    return data.user
  },

  // CORREGIDO: Apunta al endpoint real /api/usuarios que creamos en tu main.py de FastAPI
  register: async (name, email, password, role = 'cliente') => {
    // Como tu formulario viaja estructurado para la tabla de Python:
    // Mapeamos los datos mínimos que espera el esquema relacional
    const datosUsuario = {
      nombre: name.split(' ')[0] || name,
      apellido: name.split(' ')[1] || ' ',
      dni: Math.floor(10000000 + Math.random() * 90000000), // Temporal hasta que tu front tenga el input de DNI
      email: email,
      telefono: "1100000000",
      direccion: "Calle Falsa 123",
      codigopostal: 1884,
      localidad: "Ezpeleta",
      provincia: "Buenos Aires",
      pais: "Argentina",
      fechaNacimiento: "2000-01-01",
      nacionalidad: "Argentina",
      rol: role
    }

    const data = await request('/api/usuarios', {
      method: 'POST',
      body: JSON.stringify(datosUsuario)
    })
    
    if (data.token) {
      localStorage.setItem('token', data.token)
    }
    return data.data
  },

  logout: () => {
    localStorage.removeItem('token')
  },

  getMe: async () => {
    const data = await request('/auth/me', {
      method: 'GET'
    })
    return data.user
  },

  // Bookings CRUD methods
  getBookings: async () => {
    return await request('/bookings', {
      method: 'GET'
    })
  },

  getOccupiedBookings: async () => {
    return await request('/bookings/occupied', {
      method: 'GET'
    })
  },

  createBooking: async (bookingData) => {
    return await request('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData)
    })
  },

  updateBookingStatus: async (id, status) => {
    return await request(`/bookings/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    })
  },

  deleteBooking: async (id) => {
    return await request(`/bookings/${id}`, {
      method: 'DELETE'
    })
  },

  // Admin methods
  adminGetUsers: async () => {
    return await request('/admin/users', {
      method: 'GET'
    })
  },

  adminDeleteUser: async (id) => {
    return await request(`/admin/users/${id}`, {
      method: 'DELETE'
    })
  }
}
