import React, { useState } from 'react'
import { api } from '../services/api.js'

const PROVINCIAS = ['Buenos Aires', 'CABA', 'Córdoba', 'Santa Fe', 'Mendoza', 'Tucumán', 'Otra']

const EMPTY_REGISTER = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  dni: '',
  telefono: '',
  direccion: '',
  localidad: '',
  provincia: 'Buenos Aires',
  codigoPostal: '',
  pais: 'Argentina',
  role: 'cliente',
}

function Auth({ onLoginSuccess, showToast }) {
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
    } catch (err) {
      showToast(err.message || 'Error al iniciar sesión.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const validateStep = (step) => {
    if (step === 1) {
      if (!register.name.trim()) return 'Ingresá tu nombre completo'
      if (!register.email.trim()) return 'Ingresá un correo válido'
      if (register.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres'
      if (register.password !== register.confirmPassword) return 'Las contraseñas no coinciden'
    }
    if (step === 2) {
      if (!register.localidad.trim()) return 'Ingresá la localidad'
      if (!register.provincia) return 'Seleccioná la provincia'
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
      const user = await api.register({
        name: register.name,
        email: register.email,
        password: register.password,
        role: register.role,
        dni: register.dni,
        telefono: register.telefono,
        direccion: register.direccion,
        localidad: register.localidad,
        provincia: register.provincia,
        codigoPostal: register.codigoPostal,
        pais: register.pais,
      })
      onLoginSuccess(user)
      showToast('¡Cuenta creada correctamente!', 'success')
    } catch (err) {
      showToast(err.message || 'Error al registrar.', 'error')
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
      <div className="auth-card auth-card-wide">
        <div className="auth-header">
          <h2>Bienvenido a Gol Ahora</h2>
          <p>Gestiona y reserva tus canchas preferidas al instante</p>
        </div>

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

        {activeTab === 'login' && (
          <form className="auth-form active" onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label htmlFor="login-email">Correo Electrónico</label>
              <div className="input-wrapper">
                <span className="material-symbols-outlined input-icon">mail</span>
                <input
                  type="email"
                  id="login-email"
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
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
              <span>{submitting ? 'Ingresando...' : 'Ingresar'}</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </form>
        )}

        {activeTab === 'register' && (
          <form className="auth-form active" onSubmit={registerStep === 3 ? handleRegisterSubmit : (e) => e.preventDefault()}>
            <div className="register-steps">
              {[1, 2, 3].map((n) => (
                <div key={n} className={`register-step-dot ${registerStep >= n ? 'done' : ''} ${registerStep === n ? 'current' : ''}`}>
                  <span>{n}</span>
                  <small>{n === 1 ? 'Cuenta' : n === 2 ? 'Ubicación' : 'Rol'}</small>
                </div>
              ))}
            </div>

            {registerStep === 1 && (
              <div className="register-step-panel">
                <h3 className="register-step-title">Paso 1 — Datos de cuenta</h3>
                <div className="form-group">
                  <label htmlFor="register-name">Nombre completo</label>
                  <input type="text" id="register-name" required value={register.name} onChange={setReg('name')} />
                </div>
                <div className="form-group">
                  <label htmlFor="register-dni">DNI</label>
                  <input type="text" id="register-dni" value={register.dni} onChange={setReg('dni')} placeholder="Opcional" />
                </div>
                <div className="form-group">
                  <label htmlFor="register-email">Correo electrónico</label>
                  <input type="email" id="register-email" required value={register.email} onChange={setReg('email')} />
                </div>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label htmlFor="register-password">Contraseña</label>
                    <input
                      type="password"
                      id="register-password"
                      required
                      minLength={6}
                      value={register.password}
                      onChange={setReg('password')}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="register-confirm">Confirmar</label>
                    <input
                      type="password"
                      id="register-confirm"
                      required
                      minLength={6}
                      value={register.confirmPassword}
                      onChange={setReg('confirmPassword')}
                    />
                  </div>
                </div>
              </div>
            )}

            {registerStep === 2 && (
              <div className="register-step-panel">
                <h3 className="register-step-title">Paso 2 — Ubicación y contacto</h3>
                <div className="form-group">
                  <label htmlFor="register-telefono">Teléfono</label>
                  <input type="tel" id="register-telefono" value={register.telefono} onChange={setReg('telefono')} />
                </div>
                <div className="form-group">
                  <label htmlFor="register-direccion">Dirección</label>
                  <input type="text" id="register-direccion" value={register.direccion} onChange={setReg('direccion')} />
                </div>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label htmlFor="register-localidad">Localidad</label>
                    <input type="text" id="register-localidad" required value={register.localidad} onChange={setReg('localidad')} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="register-cp">Código postal</label>
                    <input type="text" id="register-cp" value={register.codigoPostal} onChange={setReg('codigoPostal')} />
                  </div>
                </div>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label htmlFor="register-provincia">Provincia</label>
                    <select id="register-provincia" value={register.provincia} onChange={setReg('provincia')}>
                      {PROVINCIAS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="register-pais">País</label>
                    <input type="text" id="register-pais" value={register.pais} onChange={setReg('pais')} />
                  </div>
                </div>
              </div>
            )}

            {registerStep === 3 && (
              <div className="register-step-panel">
                <h3 className="register-step-title">Paso 3 — Tipo de usuario</h3>
                <p className="register-step-hint">Elegí cómo vas a usar Gol Ahora (RF-06).</p>
                <div className="role-cards">
                  {[
                    { value: 'cliente', title: 'Cliente', desc: 'Reservar canchas y ver competiciones', icon: 'sports_soccer' },
                    { value: 'profesional', title: 'Profesional', desc: 'Tomar asistencia en clases', icon: 'school' },
                    { value: 'administrador', title: 'Administrador', desc: 'Gestión del complejo', icon: 'admin_panel_settings' },
                  ].map((r) => (
                    <label key={r.value} className={`role-card ${register.role === r.value ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="role"
                        value={r.value}
                        checked={register.role === r.value}
                        onChange={setReg('role')}
                      />
                      <span className="material-symbols-outlined">{r.icon}</span>
                      <strong>{r.title}</strong>
                      <span>{r.desc}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="register-nav">
              {registerStep > 1 && (
                <button type="button" className="btn btn-outline" onClick={() => setRegisterStep((s) => s - 1)}>
                  Atrás
                </button>
              )}
              {registerStep < 3 ? (
                <button type="button" className="btn btn-primary" onClick={nextRegisterStep}>
                  Siguiente
                </button>
              ) : (
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creando cuenta...' : 'Crear cuenta'}
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
