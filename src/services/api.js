// ❌ ANTES (Hardcodeado - Rompe en producción):
// const respuesta = await axios.post("http://127.0.0.1:5000/api/auth/register", datos);

//  AHORA (Dinámico e inteligente):
// Si existe la variable de Vercel usa Render, sino usa el puerto local de desarrollo
const API_URL = import.meta.env.VITE_API_URL;

// Y la petición la hacés usando esa constante y la ruta correcta de tu main.py:
const respuesta = await fetch(`${API_URL}/api/usuarios`, {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify(datos)
});

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

  const response = await fetch(`${API_URL}${endpoint}`, config)
  const data = await response.json()

  if (!response.ok) {
    // Extract server-side custom error message or fallback
    const errorMsg = data.error || `Error ${response.status} en la petición.`
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
    return data.user // returns { name, email }
  },

  register: async (name, email, password, role = 'cliente') => {
    const data = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role })
    })
    
    if (data.token) {
      localStorage.setItem('token', data.token)
    }
    return data.user
  },

  logout: () => {
    localStorage.removeItem('token')
  },

  getMe: async () => {
    const data = await request('/auth/me', {
      method: 'GET'
    })
    return data.user // returns { id, name, email, role }
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
