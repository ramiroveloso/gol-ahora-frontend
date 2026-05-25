import React, { useState, useEffect } from 'react'
import Auth from './components/Auth.jsx'
import { api } from './services/api.js'

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  // Sync theme with HTML attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Initialization and Session validation on startup
  useEffect(() => {
    const initApp = async () => {
      // Fetch CSRF token for subsequent POST requests
      await api.fetchCsrfToken();

      // Check if session exists on the backend
      try {
        const user = await api.getMe();
        if (user) {
          setCurrentUser(user);
        }
      } catch (err) {
        // No active session, ignore
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };
    initApp();
  }, []);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    showToast(`Modo ${nextTheme === 'dark' ? 'oscuro' : 'claro'} activado`, 'success');
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    showToast('Sesión cerrada correctamente', 'success');
  };

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme === 'dark' ? '#050505' : '#fcfcfd',
        color: theme === 'dark' ? '#f3f4f6' : '#111827',
        fontFamily: 'Outfit, sans-serif',
        fontSize: '1.2rem',
        fontWeight: '600',
        transition: 'all 0.4s'
      }}>
        <span className="material-symbols-outlined" style={{
          marginRight: '0.6rem',
          fontSize: '2rem',
          animation: 'spin 1.5s linear infinite',
          color: '#2ECC71'
        }}>sports_soccer</span>
        Cargando Gol Ahora...
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {!currentUser ? (
          <Auth
            onLoginSuccess={handleLogin}
            showToast={showToast}
            theme={theme}
            onToggleTheme={handleToggleTheme}
          />
        ) : (
          <section className="auth-section">
            {/* Theme Toggle is also active in success view! */}
            <button
              type="button"
              className="auth-theme-toggle"
              onClick={handleToggleTheme}
              title="Cambiar Tema"
              aria-label="Cambiar Tema"
            >
              <span className="material-symbols-outlined theme-icon">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            <div className="auth-card success-screen">
              <span className="material-symbols-outlined success-icon">check_circle</span>
              <h1>¡SESIÓN INICIADA!</h1>

              <div style={{ textAlign: 'center', margin: '0.5rem 0 1.5rem', lineHeight: '1.6' }}>
                <p style={{ fontWeight: '600', fontSize: '1.1rem', color: '#2ECC71' }}>
                  {currentUser.name}
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.2rem' }}>
                  Rol: {currentUser.role}
                </p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.8rem' }}>
                  Email: {currentUser.email}
                </p>
                {currentUser.telefono && (
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Tel: {currentUser.telefono}
                  </p>
                )}
                {currentUser.direccion && (
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Dirección: {currentUser.direccion}, {currentUser.localidad}
                  </p>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="btn btn-outline btn-full"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.20rem' }}>logout</span>
                Cerrar Sesión
              </button>
            </div>
          </section>
        )}
      </main>

      {/* Toast Notifications container */}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map((t) => (
            <div key={t.id} className={`toast ${t.type}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', color: t.type === 'success' ? '#2ECC71' : '#e74c3c' }}>
                {t.type === 'success' ? 'check_circle' : 'error'}
              </span>
              <span>{t.message}</span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

export default App
