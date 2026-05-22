import React, { useState } from 'react'
import { api } from '../services/api.js'

function Auth({ onLoginSuccess, showToast }) {
  const [activeTab, setActiveTab] = useState('login')
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register State
  const [registerName, setRegisterName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerRole, setRegisterRole] = useState('cliente')

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    const email = loginEmail.trim()
    const password = loginPassword

    try {
      const user = await api.login(email, password)
      onLoginSuccess(user)
    } catch (err) {
      showToast(err.message || 'Error al iniciar sesión. Inténtalo de nuevo.', 'error')
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    const name = registerName.trim()
    const email = registerEmail.trim()
    const password = registerPassword

    try {
      const user = await api.register(name, email, password, registerRole)
      onLoginSuccess(user)
    } catch (err) {
      showToast(err.message || 'Error al registrar la cuenta. Inténtalo de nuevo.', 'error')
    }
  }

  return (
    <section id="auth-section" className="auth-section">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Bienvenido a Gol Ahora</h2>
          <p>Gestiona y reserva tus canchas preferidas al instante</p>
        </div>
        
        {/* Tab headers for Sign In / Sign Up */}
        <div className="auth-tabs">
          <button 
            id="tab-login" 
            className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
          >
            Iniciar Sesión
          </button>
          <button 
            id="tab-register" 
            className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => setActiveTab('register')}
          >
            Registrarse
          </button>
        </div>
        
        {/* Login Form */}
        {activeTab === 'login' && (
          <form id="login-form" className="auth-form active" onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label htmlFor="login-email">Correo Electrónico</label>
              <div className="input-wrapper">
                <span className="material-symbols-outlined input-icon">mail</span>
                <input 
                  type="email" 
                  id="login-email" 
                  placeholder="correo@ejemplo.com" 
                  required 
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="login-password">Contraseña</label>
              <div className="input-wrapper">
                <span className="material-symbols-outlined input-icon">lock</span>
                <input 
                  type="password" 
                  id="login-password" 
                  placeholder="••••••••" 
                  required 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-full">
              <span>Ingresar</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </form>
        )}

        {activeTab === 'register' && (
          <form id="register-form" className="auth-form active" onSubmit={handleRegisterSubmit}>
            <div className="form-group">
              <label htmlFor="register-name">Nombre Completo</label>
              <div className="input-wrapper">
                <span className="material-symbols-outlined input-icon">person</span>
                <input 
                  type="text" 
                  id="register-name" 
                  placeholder="Tu nombre" 
                  required 
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="register-email">Correo Electrónico</label>
              <div className="input-wrapper">
                <span className="material-symbols-outlined input-icon">mail</span>
                <input 
                  type="email" 
                  id="register-email" 
                  placeholder="correo@ejemplo.com" 
                  required 
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="register-password">Contraseña</label>
              <div className="input-wrapper">
                <span className="material-symbols-outlined input-icon">lock</span>
                <input 
                  type="password" 
                  id="register-password" 
                  placeholder="Mínimo 6 caracteres" 
                  minlength="6" 
                  required 
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="register-role">Rol en la Plataforma</label>
              <div className="input-wrapper" style={{ position: 'relative' }}>
                <span className="material-symbols-outlined input-icon">badge</span>
                <select 
                  id="register-role" 
                  value={registerRole}
                  onChange={(e) => setRegisterRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    appearance: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="cliente">Cliente (Reservar canchas y ver torneos)</option>
                  <option value="profesional">Profesional (Tomar asistencia en clases)</option>
                  <option value="administrador">Administrador (Gestión total del sistema)</option>
                </select>
                <span className="material-symbols-outlined" style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: 'var(--text-muted)'
                }}>unfold_more</span>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-full">
              <span>Crear Cuenta</span>
              <span className="material-symbols-outlined">how_to_reg</span>
            </button>
          </form>
        )}
      </div>
    </section>
  )
}

export default Auth
