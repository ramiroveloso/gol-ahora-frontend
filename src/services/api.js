const PROTOCOL = import.meta.env.VITE_API_PROTOCOL || "http";
const DOMAIN = import.meta.env.VITE_API_DOMAIN || "localhost";
const PORT = import.meta.env.VITE_API_PORT || "8000";
const API_URL = import.meta.env.VITE_API_URL || `${PROTOCOL}://${DOMAIN}:${PORT}/api`;

export const isMockMode = false;
// Obtener el valor de la cookie CSRF
function getCsrfToken() {
  const name = 'csrftoken';
  if (!document.cookie || document.cookie === '') {
    return null;
  }
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.substring(0, name.length + 1) === (name + '=')) {
      return decodeURIComponent(cookie.substring(name.length + 1));
    }
  }
  return null;
}

// Base request wrapper optimized for Django REST Framework con Sesiones
async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  // Inyectar token CSRF para peticiones inseguras
  const method = (options.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }
  }

  const config = {
    ...options,
    headers,
    credentials: 'include' // Obligatorio para enviar la cookie de sesión y csrftoken
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);

  const isNoContent = response.status === 204;
  let data = {};

  if (!isNoContent) {
    try {
      data = await response.json();
    } catch (err) {
      data = { detail: "La respuesta no es JSON válido" };
    }
  }

  if (!response.ok) {
    const errorMsg = data.detail || (typeof data === 'object' ? JSON.stringify(data) : data) || `Error ${response.status} en la petición.`;
    throw new Error(errorMsg);
  }

  return data;
}

// Helper to format Django User object into React User object
function formatUser(djangoUser) {
  if (!djangoUser) return null;

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
  // Inicializa el token CSRF para asegurar que la cookie esté presente
  fetchCsrfToken: async () => {
    try {
      await request('/auth/csrf/', { method: 'GET' });
    } catch (error) {
      console.warn("No se pudo obtener el token CSRF o ya estaba presente", error);
    }
  },

  // Authentication methods
  login: async (email, password) => {
    const data = await request('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username: email, password })
    });

    // Con sesiones no necesitamos guardar el token localmente,
    // pero si devolvemos el usuario formateado
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

    const data = await request('/auth/usuarios/', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const rawUser = data.user || data.data || data;
    const formattedUser = formatUser(rawUser);

    if (formattedUser) {
      localStorage.setItem('user_data', JSON.stringify(formattedUser));
    }

    return formattedUser;
  },

  logout: async () => {
    try {
      await request('/auth/logout/', { method: 'POST' });
    } catch (err) {
      console.error("Error durante logout en el backend", err);
    } finally {
      localStorage.removeItem('user_data');
    }
  },

  getMe: async () => {
    try {
      // Con sesiones, este GET validará la cookie sessionid en el servidor
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
      localStorage.removeItem('user_data');
      throw err;
    }
  }
};
