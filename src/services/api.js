const API_URL = import.meta.env.VITE_API_URL || "https://gol-ahora-backend-1.onrender.com/api";

export const isMockMode = false;

// Base request wrapper optimized for Django REST Framework
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);
  
  const isNoContent = response.status === 204;
  const data = isNoContent ? {} : await response.json();

  if (!response.ok) {
    const errorMsg = data.detail || JSON.stringify(data) || `Error ${response.status} en la petición.`;
    throw new Error(errorMsg);
  }

  return data;
}

// Helper to format Django User object into React User object
function formatUser(djangoUser) {
  if (!djangoUser) return null;
  
  // Map Django roles ('SOCIO', 'PROFESOR', 'ADMINISTRADOR', 'EMPLEADO') to React roles ('cliente', 'profesional', 'administrador')
  let role = 'cliente';
  const djangoRol = (djangoUser.rol || '').toUpperCase();
  if (djangoRol === 'ADMINISTRADOR' || djangoRol === 'EMPLEADO') {
    role = 'administrador';
  } else if (djangoRol === 'PROFESOR') {
    role = 'profesional';
  } else if (djangoRol === 'SOCIO') {
    role = 'cliente';
  } else {
    role = djangoUser.role || 'cliente';
  }

  return {
    id: djangoUser.id,
    username: djangoUser.username,
    email: djangoUser.email,
    name: djangoUser.first_name && djangoUser.last_name 
      ? `${djangoUser.first_name} ${djangoUser.last_name}` 
      : djangoUser.name || djangoUser.username || djangoUser.email,
    role: role,
    telefono: djangoUser.telefono || '',
    direccion: djangoUser.direccion || '',
    localidad: djangoUser.localidad || '',
    provincia: djangoUser.provincia || '',
    codigoPostal: djangoUser.codigoPostal || djangoUser.codigopostal || ''
  };
}

export const api = {
  // Authentication methods
  login: async (email, password) => {
    // Django's LoginSerializer expects 'username' and 'password'
    const data = await request('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username: email, password })
    });
    
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    
    const rawUser = data.user || data.data || data;
    const formattedUser = formatUser(rawUser);
    
    if (formattedUser) {
      localStorage.setItem('user_data', JSON.stringify(formattedUser));
    }
    
    return formattedUser;
  },

  register: async (userData) => {
    let details = {};
    if (typeof userData === 'object' && userData !== null) {
      details = userData;
    }

    // Map React role to Django rol
    let djangoRol = 'SOCIO';
    if (details.role === 'administrador') djangoRol = 'ADMINISTRADOR';
    else if (details.role === 'profesional') djangoRol = 'PROFESOR';

    const firstName = details.name ? details.name.split(' ')[0] : (details.firstName || '');
    const lastName = details.name ? details.name.split(' ').slice(1).join(' ') : (details.lastName || '');

    const payload = {
      username: details.username || details.email.split('@')[0],
      email: details.email,
      password: details.password,
      first_name: firstName,
      last_name: lastName || ' ',
      rol: djangoRol,
      telefono: details.telefono || '',
      direccion: details.direccion || '',
      localidad: details.localidad || '',
      provincia: details.provincia || 'Buenos Aires',
      codigopostal: details.codigoPostal ? parseInt(details.codigoPostal) : 1000
    };

    const data = await request('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (data.token) {
      localStorage.setItem('token', data.token);
    }

    const rawUser = data.user || data.data || data;
    const formattedUser = formatUser(rawUser);

    if (formattedUser) {
      localStorage.setItem('user_data', JSON.stringify(formattedUser));
    }

    return formattedUser;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_data');
  },

  getMe: async () => {
    try {
      const data = await request('/auth/me/', {
        method: 'GET'
      });
      const rawUser = data.user || data.data || data;
      const formattedUser = formatUser(rawUser);
      if (formattedUser) {
        localStorage.setItem('user_data', JSON.stringify(formattedUser));
      }
      return formattedUser;
    } catch (err) {
      const cached = localStorage.getItem('user_data');
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          // Ignore
        }
      }
      throw err;
    }
  }
};
