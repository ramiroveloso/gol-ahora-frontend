import React, { useState, useEffect } from 'react'
import { api, isMockMode } from '../services/api.js'

const PROVINCIAS_AR = [
  'Buenos Aires',
  'CABA',
  'Córdoba',
  'Santa Fe',
  'Mendoza',
  'Tucumán',
  'Otra',
]

function ProfileModal({ currentUser, isOpen, onClose, onUserUpdate, showToast }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    telefono: '',
    direccion: '',
    localidad: '',
    provincia: 'Buenos Aires',
    codigoPostal: '',
  })

  useEffect(() => {
    if (currentUser) {
      setForm({
        name: currentUser.name || '',
        telefono: currentUser.telefono || '',
        direccion: currentUser.direccion || '',
        localidad: currentUser.localidad || '',
        provincia: currentUser.provincia || 'Buenos Aires',
        codigoPostal: currentUser.codigoPostal || '',
      })
    }
    setEditing(false)
  }, [currentUser, isOpen])

  if (!isOpen || !currentUser) return null

  const role = currentUser.role || 'cliente'

  const getRoleBadgeColor = (r) => {
    if (r === 'administrador') return 'var(--accent-garnet)'
    if (r === 'profesional') return '#0070f3'
    return '#00a000'
  }

  const getRoleDisplayName = (r) => {
    if (r === 'administrador') return 'Administrador'
    if (r === 'profesional') return 'Profesional'
    return 'Cliente'
  }

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      showToast?.('El nombre es obligatorio', 'error')
      return
    }
    setSaving(true)
    try {
      const updated = await api.updateProfile({
        name: form.name.trim(),
        telefono: form.telefono.trim(),
        direccion: form.direccion.trim(),
        localidad: form.localidad.trim(),
        provincia: form.provincia,
        codigoPostal: form.codigoPostal.trim(),
      })
      onUserUpdate?.(updated)
      setEditing(false)
      showToast?.('Perfil actualizado correctamente', 'success')
    } catch (err) {
      showToast?.(err.message || 'No se pudo guardar el perfil', 'error')
    } finally {
      setSaving(false)
    }
  }

  const fieldStyle = {
    width: '100%',
    padding: '0.55rem 0.75rem',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-input)',
    color: 'var(--text-main)',
    fontSize: '0.9rem',
    marginTop: '0.25rem',
  }

  return (
    <div
      className="profile-modal-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="profile-modal-close" onClick={onClose} title="Cerrar">
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="profile-modal-header">
          <div className="profile-avatar">
            <span className="material-symbols-outlined">account_circle</span>
          </div>
          <h3>Mi Perfil</h3>
          <span className="profile-id-hint">
            {currentUser.email}
            {isMockMode && ' · guardado en demo local'}
          </span>
        </div>

        <div className="profile-modal-body">
          {!editing ? (
            <>
              <ProfileRow icon="person" label="Nombre" value={currentUser.name} />
              <ProfileRow icon="mail" label="Correo" value={currentUser.email} />
              <ProfileRow icon="phone" label="Teléfono" value={currentUser.telefono || '—'} />
              <ProfileRow icon="home" label="Dirección" value={currentUser.direccion || '—'} />
              <ProfileRow
                icon="location_on"
                label="Ubicación"
                value={[currentUser.localidad, currentUser.provincia, currentUser.codigoPostal]
                  .filter(Boolean)
                  .join(', ') || '—'}
              />
              <ProfileRow
                icon="badge"
                label="Rol"
                value={
                  <span
                    className="profile-role-badge"
                    style={{ borderColor: getRoleBadgeColor(role), color: getRoleBadgeColor(role) }}
                  >
                    {getRoleDisplayName(role)}
                  </span>
                }
              />
              <ProfileRow icon="event" label="Miembro desde" value={currentUser.memberSince || 'Mayo 2026'} />
            </>
          ) : (
            <div className="profile-edit-form">
              <label>
                Nombre completo
                <input style={fieldStyle} value={form.name} onChange={handleChange('name')} />
              </label>
              <label>
                Teléfono
                <input
                  style={fieldStyle}
                  type="tel"
                  value={form.telefono}
                  onChange={handleChange('telefono')}
                  placeholder="11 1234-5678"
                />
              </label>
              <label>
                Dirección
                <input
                  style={fieldStyle}
                  value={form.direccion}
                  onChange={handleChange('direccion')}
                  placeholder="Calle y número"
                />
              </label>
              <label>
                Localidad
                <input
                  style={fieldStyle}
                  value={form.localidad}
                  onChange={handleChange('localidad')}
                  placeholder="Ezpeleta"
                />
              </label>
              <label>
                Provincia
                <select style={fieldStyle} value={form.provincia} onChange={handleChange('provincia')}>
                  {PROVINCIAS_AR.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Código postal
                <input
                  style={fieldStyle}
                  value={form.codigoPostal}
                  onChange={handleChange('codigoPostal')}
                  placeholder="1884"
                />
              </label>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                El correo no se puede cambiar en modo demo.
              </p>
            </div>
          )}
        </div>

        <div className="profile-modal-footer">
          {!editing ? (
            <>
              <button type="button" className="btn btn-outline" onClick={() => setEditing(true)}>
                <span className="material-symbols-outlined">edit</span>
                Editar perfil
              </button>
              <button type="button" className="btn btn-primary" onClick={onClose}>
                Cerrar
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn btn-outline" onClick={() => setEditing(false)} disabled={saving}>
                Cancelar
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function ProfileRow({ icon, label, value }) {
  return (
    <div className="profile-row">
      <span className="material-symbols-outlined">{icon}</span>
      <div>
        <span className="profile-row-label">{label}</span>
        <div className="profile-row-value">{value}</div>
      </div>
    </div>
  )
}

export default ProfileModal
