import React, { useState } from 'react'
import { api } from '../services/api.js'

const PROVINCIAS = ['Buenos Aires', 'CABA', 'Córdoba', 'Santa Fe', 'Mendoza', 'Tucumán', 'Otra']

const EMPTY_REGISTER = {
  username: '',
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  telefono: '',
  direccion: '',
  localidad: '',
  provincia: 'Buenos Aires',
  codigoPostal: '',
  role: 'cliente',
}

function Auth({ onLoginSuccess, showToast, theme = 'dark', onToggleTheme }) {
  const [activeTab, setActiveTab] = useState('login')
  const [registerStep, setRegisterStep] = useState(1)
  const [register, setRegister] = useState(EMPTY_REGISTER)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const setReg = (field) => (e) => setRegister((prev) => ({ ...prev, [field]: e.target.value }))

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const user = await api.login(loginEmail.trim(), loginPassword)
      onLoginSuccess(user)
      showToast('¡Sesión iniciada correctamente!', 'success')
    } catch (err) {
      showToast(err.message || 'Error al iniciar sesión. Verifica tus credenciales.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const validateStep = (step) => {
    if (step === 1) {
      if (!register.username.trim()) return 'Ingresá un nombre de usuario'
      if (!register.name.trim()) return 'Ingresá tu nombre completo'
      if (!register.email.trim()) return 'Ingresá un correo válido'
      if (register.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres'
      if (register.password !== register.confirmPassword) return 'Las contraseñas no coinciden'
    }
    if (step === 2) {
      if (!register.direccion.trim()) return 'Ingresá tu dirección'
      if (!register.localidad.trim()) return 'Ingresá tu localidad'
      if (!register.provincia) return 'Seleccioná tu provincia'
    }
    return null
  }

  const nextRegisterStep = () => {
    const err = validateStep(registerStep)
    if (err) {
      showToast(err, 'error')
      return
    }
    setRegisterStep((s) => Math.min(3, s + 1))
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    const err = validateStep(2)
    if (err) {
      showToast(err, 'error')
      return
    }
    setSubmitting(true)
    try {
      const user = await api.register(register)
      onLoginSuccess(user)
      showToast('¡Cuenta creada correctamente en Django!', 'success')
    } catch (err) {
      showToast(err.message || 'Error al registrar el usuario.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const switchToRegister = () => {
    setActiveTab('register')
    setRegisterStep(1)
    setRegister(EMPTY_REGISTER)
  }

  return (
    <section id="auth-section" className="auth-section">
      {/* Botón flotante permanente para cambio de tema */}
      {onToggleTheme && (
        <button 
          type="button" 
          className="auth-theme-toggle" 
          onClick={onToggleTheme} 
          title="Cambiar Tema"
          aria-label="Cambiar Tema"
        >
          <span className="material-symbols-outlined theme-icon">
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
        </button>
      )}

      <div className="auth-card">
        {/* Isotipo SVG de Balón de Fútbol */}
        <div className="auth-logo-container">
          <svg className="auth-logo-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="45" stroke="#2ECC71" strokeWidth="2.5" fill="#000" />
            <path d="M50 25 L58 37 L42 37 Z" fill="#2ECC71" />
            <path d="M50 25 L50 8" stroke="#2ECC71" strokeWidth="2" strokeLinecap="round" />
            <path d="M42 37 L28 33 L18 43" stroke="#2ECC71" strokeWidth="2" strokeLinecap="round" />
            <path d="M58 37 L72 33 L82 43" stroke="#2ECC71" strokeWidth="2" strokeLinecap="round" />
            <path d="M50 56 L35 49 L20 62" stroke="#2ECC71" strokeWidth="2" strokeLinecap="round" />
            <path d="M50 56 L65 49 L80 62" stroke="#2ECC71" strokeWidth="2" strokeLinecap="round" />
            <path d="M50 56 L58 37" stroke="#2ECC71" strokeWidth="2" strokeLinecap="round" />
            <path d="M50 56 L42 37" stroke="#2ECC71" strokeWidth="2" strokeLinecap="round" />
            <path d="M50 78 L50 92" stroke="#2ECC71" strokeWidth="2" strokeLinecap="round" />
            <circle cx="50" cy="50" r="3" fill="#ffffff" />
          </svg>
          <div className="auth-header">
            <h2>GOL <span style={{ color: '#2ECC71' }}>AHORA</span></h2>
            <p>El portal minimalista para gestionar y reservar tus turnos preferidos</p>
          </div>
        </div>

        {/* Pestañas */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
            onClick={switchToRegister}
          >
            Registrarse
          </button>
        </div>

        {/* Formulario de Login */}
        {activeTab === 'login' && (
          <form className="auth-form" onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label htmlFor="login-email">Usuario o Email</label>
              <div className="input-wrapper">
                <span className="material-symbols-outlined input-icon">person</span>
                <input
                  type="text"
                  id="login-email"
                  required
                  placeholder="Ej: demo@golahora.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  autoComplete="username"
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
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </div>
            
            <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
              <span>{submitting ? 'Ingresando...' : 'Entrar al Vestuario'}</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </form>
        )}

        {/* Formulario de Registro por Pasos */}
        {activeTab === 'register' && (
          <form className="auth-form" onSubmit={registerStep === 3 ? handleRegisterSubmit : (e) => e.preventDefault()}>
            {/* Pasos */}
            <div className="register-steps">
              {[1, 2, 3].map((n) => (
                <div key={n} className={`register-step-dot ${registerStep >= n ? 'done' : ''} ${registerStep === n ? 'current' : ''}`}>
                  <span>{n}</span>
                  <small>{n === 1 ? 'Cuenta' : n === 2 ? 'Ubicación' : 'Rol'}</small>
                </div>
              ))}
            </div>

            {/* Paso 1 */}
            {registerStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>Datos de la Cuenta</h3>
                
                <div className="form-group">
                  <label htmlFor="register-username">Nombre de usuario</label>
                  <div className="input-wrapper">
                    <span className="material-symbols-outlined input-icon">alternate_email</span>
                    <input 
                      type="text" 
                      id="register-username" 
                      required 
                      placeholder="usuario123"
                      value={register.username} 
                      onChange={setReg('username')} 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="register-name">Nombre completo</label>
                  <div className="input-wrapper">
                    <span className="material-symbols-outlined input-icon">badge</span>
                    <input 
                      type="text" 
                      id="register-name" 
                      required 
                      placeholder="Juan Pérez"
                      value={register.name} 
                      onChange={setReg('name')} 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="register-email">Email</label>
                  <div className="input-wrapper">
                    <span className="material-symbols-outlined input-icon">mail</span>
                    <input 
                      type="email" 
                      id="register-email" 
                      required 
                      placeholder="juan@ejemplo.com"
                      value={register.email} 
                      onChange={setReg('email')} 
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label htmlFor="register-password">Contraseña</label>
                    <div className="input-wrapper">
                      <span className="material-symbols-outlined input-icon" style={{ left: '0.8rem' }}>lock</span>
                      <input
                        type="password"
                        id="register-password"
                        required
                        minLength={6}
                        placeholder="••••••"
                        style={{ paddingLeft: '2.4rem' }}
                        value={register.password}
                        onChange={setReg('password')}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="register-confirm">Confirmar</label>
                    <div className="input-wrapper">
                      <span className="material-symbols-outlined input-icon" style={{ left: '0.8rem' }}>lock</span>
                      <input
                        type="password"
                        id="register-confirm"
                        required
                        minLength={6}
                        placeholder="••••••"
                        style={{ paddingLeft: '2.4rem' }}
                        value={register.confirmPassword}
                        onChange={setReg('confirmPassword')}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Paso 2 */}
            {registerStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>Ubicación y Contacto</h3>
                
                <div className="form-group">
                  <label htmlFor="register-telefono">Teléfono</label>
                  <div className="input-wrapper">
                    <span className="material-symbols-outlined input-icon">phone</span>
                    <input 
                      type="tel" 
                      id="register-telefono" 
                      placeholder="11 2345 6789"
                      value={register.telefono} 
                      onChange={setReg('telefono')} 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="register-direccion">Dirección</label>
                  <div className="input-wrapper">
                    <span className="material-symbols-outlined input-icon">home_pin</span>
                    <input 
                      type="text" 
                      id="register-direccion" 
                      required
                      placeholder="Calle Falsa 123"
                      value={register.direccion} 
                      onChange={setReg('direccion')} 
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label htmlFor="register-localidad">Localidad</label>
                    <input 
                      type="text" 
                      id="register-localidad" 
                      required 
                      placeholder="Ezpeleta"
                      value={register.localidad} 
                      onChange={setReg('localidad')} 
                      style={{ padding: '0.85rem 1rem', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="register-cp">C.P.</label>
                    <input 
                      type="text" 
                      id="register-cp" 
                      placeholder="1884"
                      value={register.codigoPostal} 
                      onChange={setReg('codigoPostal')} 
                      style={{ padding: '0.85rem 1rem', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="register-provincia">Provincia</label>
                  <select 
                    id="register-provincia" 
                    value={register.provincia} 
                    onChange={setReg('provincia')}
                    style={{ padding: '0.85rem 1rem', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none', width: '100%' }}
                  >
                    {PROVINCIAS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Paso 3 */}
            {registerStep === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>Selección de Rol</h3>
                
                <div className="role-cards">
                  {[
                    { value: 'cliente', title: 'Socio / Cliente', desc: 'Reserva tus canchas preferidas.', icon: 'sports_soccer' },
                    { value: 'profesional', title: 'Entrenador', desc: 'Gestiona entrenamientos y clases.', icon: 'school' },
                    { value: 'administrador', title: 'Administrador', desc: 'Administra canchas y reportes.', icon: 'admin_panel_settings' },
                  ].map((r) => (
                    <div 
                      key={r.value} 
                      className={`role-card ${register.role === r.value ? 'selected' : ''}`}
                      onClick={() => setRegister((prev) => ({ ...prev, role: r.value }))}
                    >
                      <span className="material-symbols-outlined role-icon">{r.icon}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <strong>{r.title}</strong>
                        <span>{r.desc}</span>
                      </div>
                      {register.role === r.value && (
                        <span className="material-symbols-outlined" style={{ color: '#2ECC71' }}>check_circle</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navegación del Registro */}
            <div className="register-nav" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              {registerStep > 1 && (
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setRegisterStep((s) => s - 1)}
                >
                  Atrás
                </button>
              )}
              {registerStep < 3 ? (
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={nextRegisterStep}
                >
                  Siguiente
                </button>
              ) : (
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={submitting}
                >
                  {submitting ? 'Registrando...' : 'Completar Registro'}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </section>
  )
}

export default Auth
