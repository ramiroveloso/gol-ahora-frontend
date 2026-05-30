import React, { useState, useEffect } from 'react'
import { api } from '../services/api.js'

function AdminUsers({ currentUser, onBackToPortal, onRefreshBookings, showToast }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'cliente', activo: true, telefono: '' })
  const [savingEdit, setSavingEdit] = useState(false)

  // Fetch users from API
  const fetchUsers = async () => {
    setLoading(true)
    try {
      const data = await api.adminGetUsers()
      setUsers(data)
    } catch (err) {
      showToast(err.message || 'Error al cargar usuarios de administración.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const openEditUser = (user) => {
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      activo: user.activo !== false,
      telefono: user.telefono || '',
    })
    setEditingUser(user)
  }

  const handleSaveUser = async () => {
    if (!editingUser) return
    setSavingEdit(true)
    try {
      await api.adminUpdateUser(editingUser.id, editForm)
      showToast('Usuario actualizado.', 'success')
      setEditingUser(null)
      await fetchUsers()
    } catch (err) {
      showToast(err.message || 'No se pudo actualizar el usuario', 'error')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDeleteUser = async (userId) => {
    setDeleting(true)
    try {
      const userToDelete = users.find(u => u.id === userId)
      await api.adminDeleteUser(userId)
      showToast(`El usuario ${userToDelete?.name || ''} ha sido dado de baja. Sus reservas fueron eliminadas en cascada.`, 'info')
      setConfirmingDeleteId(null)
      // Refresh local list
      await fetchUsers()
      // Refresh global bookings list in App.jsx
      if (onRefreshBookings) {
        onRefreshBookings()
      }
    } catch (err) {
      showToast(err.message || 'No se pudo dar de baja al usuario.', 'error')
    } finally {
      setDeleting(false)
    }
  }

  // Filter list by search term
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculate statistics
  const totalCount = users.length
  const clientsCount = users.filter(u => u.role === 'cliente').length
  const proCount = users.filter(u => u.role === 'profesional').length
  const adminCount = users.filter(u => u.role === 'administrador').length

  return (
    <div style={{
      maxWidth: '950px',
      margin: '2rem auto',
      padding: '0 1.5rem',
      fontFamily: 'Outfit, sans-serif'
    }}>
      {/* Header Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button 
          onClick={onBackToPortal}
          className="btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            backgroundColor: 'transparent',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            padding: '0.5rem 0.8rem',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.85rem'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>arrow_back</span>
          <span>Volver al Portal</span>
        </button>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Rol: <strong>Administrador Principal</strong>
        </span>
      </div>

      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
      }}>
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <span className="material-symbols-outlined" style={{
            color: 'var(--accent-garnet)',
            fontSize: '2rem'
          }}>admin_panel_settings</span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
            Gestión de Usuarios
          </h2>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          {[
            { label: 'Total Registrados', value: totalCount, icon: 'groups', color: 'var(--text-main)' },
            { label: 'Clientes', value: clientsCount, icon: 'sports_soccer', color: '#00a000' },
            { label: 'Profesionales', value: proCount, icon: 'school', color: '#0070f3' },
            { label: 'Administradores', value: adminCount, icon: 'shield_person', color: 'var(--accent-garnet)' }
          ].map((st, idx) => (
            <div 
              key={idx} 
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '1rem 1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                  {st.label}
                </span>
                <strong style={{ fontSize: '1.4rem', fontWeight: '800', color: st.color }}>
                  {st.value}
                </strong>
              </div>
              <span className="material-symbols-outlined" style={{ color: 'rgba(255,255,255,0.1)', fontSize: '2rem' }}>
                {st.icon}
              </span>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.8rem',
          marginBottom: '1.5rem',
          position: 'relative'
        }}>
          <span className="material-symbols-outlined" style={{
            position: 'absolute',
            left: '0.8rem',
            color: 'var(--text-muted)',
            fontSize: '1.1rem'
          }}>search</span>
          <input 
            type="text" 
            placeholder="Filtrar por nombre, correo electrónico o rol..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 1rem 0.6rem 2.2rem',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          />
        </div>

        {/* Loader */}
        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 1rem',
            color: 'var(--text-muted)',
            fontSize: '0.95rem'
          }}>
            <span className="material-symbols-outlined sports-icon" style={{
              fontSize: '2rem',
              animation: 'spin 2s linear infinite',
              marginBottom: '0.5rem',
              display: 'inline-block'
            }}>sync</span>
            <p style={{ margin: 0 }}>Cargando base de datos de usuarios...</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => {
                const isSelf = user.email === currentUser.email
                const isConfirming = confirmingDeleteId === user.id

                return (
                  <div 
                    key={user.id} 
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      backgroundColor: isConfirming ? 'rgba(46, 204, 113, 0.04)' : 'rgba(255, 255, 255, 0.01)',
                      border: isConfirming ? '1px solid var(--accent-garnet)' : '1px solid var(--border-color)',
                      borderRadius: '12px',
                      padding: '1rem 1.4rem',
                      transition: 'all 0.25s ease'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '1rem'
                    }}>
                      {/* Left: User Info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid var(--border-color)',
                          color: user.role === 'administrador' ? 'var(--accent-garnet)' : user.role === 'profesional' ? '#0070f3' : '#00a000',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <span className="material-symbols-outlined">
                            {user.role === 'administrador' ? 'shield_person' : user.role === 'profesional' ? 'school' : 'person'}
                          </span>
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>
                              {user.name}
                            </h4>
                            {isSelf && (
                              <span style={{
                                fontSize: '0.6rem',
                                padding: '0.1rem 0.3rem',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                color: 'var(--text-muted)',
                                fontWeight: 'bold'
                              }}>Tú</span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {user.email}
                          </span>
                        </div>
                      </div>

                      {/* Right: Badge & Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(255, 255, 255, 0.02)',
                          border: `1px solid ${user.role === 'administrador' ? 'var(--accent-garnet)' : user.role === 'profesional' ? '#0070f3' : '#00a000'}`,
                          color: user.role === 'administrador' ? 'var(--accent-garnet)' : user.role === 'profesional' ? '#0070f3' : '#00a000'
                        }}>
                          {user.role}
                        </span>

                        {!user.activo && (
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: '700',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(255, 100, 100, 0.1)',
                            border: '1px solid rgba(255, 100, 100, 0.4)',
                            color: '#ff6464',
                          }}>INACTIVO</span>
                        )}

                        {!isConfirming && (
                          <button
                            onClick={() => openEditUser(user)}
                            className="btn"
                            style={{
                              padding: '0.4rem 0.8rem',
                              fontSize: '0.75rem',
                              borderRadius: '6px',
                              backgroundColor: 'transparent',
                              border: '1px solid var(--border-color)',
                              color: 'var(--text-main)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.2rem',
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>edit</span>
                            Editar
                          </button>
                        )}

                        {!isSelf && !isConfirming && (
                          <button
                            onClick={() => setConfirmingDeleteId(user.id)}
                            className="btn"
                            style={{
                              padding: '0.4rem 0.8rem',
                              fontSize: '0.75rem',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(46, 204, 113, 0.05)',
                              border: '1px solid rgba(46, 204, 113, 0.3)',
                              color: 'var(--accent-garnet)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.2rem',
                              transition: 'all 0.2s'
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>person_remove</span>
                            <span>Dar de Baja</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Inline Danger Action Overlay */}
                    {isConfirming && (
                      <div style={{
                        marginTop: '1rem',
                        paddingTop: '0.8rem',
                        borderTop: '1px dashed rgba(46, 204, 113, 0.3)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.8rem'
                      }}>
                        <span style={{
                          fontSize: '0.8rem',
                          color: 'var(--accent-garnet)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          fontWeight: '500'
                        }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>warning</span>
                          ¿Confirmar baja? Se cancelarán en cascada todas sus reservas del sistema.
                        </span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            disabled={deleting}
                            onClick={() => setConfirmingDeleteId(null)}
                            className="btn"
                            style={{
                              padding: '0.35rem 0.7rem',
                              fontSize: '0.75rem',
                              borderRadius: '6px',
                              border: '1px solid var(--border-color)',
                              backgroundColor: 'transparent',
                              color: 'var(--text-main)',
                              cursor: 'pointer'
                            }}
                          >
                            Cancelar
                          </button>
                          <button
                            disabled={deleting}
                            onClick={() => handleDeleteUser(user.id)}
                            className="btn btn-primary"
                            style={{
                              padding: '0.35rem 0.8rem',
                              fontSize: '0.75rem',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              backgroundColor: 'var(--accent-garnet)',
                              border: '1px solid var(--accent-garnet)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.2rem'
                            }}
                          >
                            {deleting ? (
                              <span>Eliminando...</span>
                            ) : (
                              <>
                                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>delete_forever</span>
                                <span>Confirmar Baja</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '3rem 1.5rem',
                color: 'var(--text-muted)',
                border: '1px dashed var(--border-color)',
                borderRadius: '12px'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>search_off</span>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>No se encontraron usuarios que coincidan con la búsqueda.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {editingUser && (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && setEditingUser(null)}>
          <div className="modal-drawer admin-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Editar usuario</h3>
              <button type="button" className="icon-btn" onClick={() => setEditingUser(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="admin-form-grid">
              <div className="form-group">
                <label>Nombre completo</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="text"
                  value={editForm.telefono}
                  onChange={(e) => setEditForm((f) => ({ ...f, telefono: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Rol</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                  disabled={editingUser.email === currentUser.email}
                >
                  <option value="cliente">Cliente</option>
                  <option value="profesional">Profesional</option>
                  <option value="administrador">Administrador</option>
                </select>
              </div>
              <div className="form-group admin-form-check">
                <label>
                  <input
                    type="checkbox"
                    checked={editForm.activo}
                    onChange={(e) => setEditForm((f) => ({ ...f, activo: e.target.checked }))}
                    disabled={editingUser.email === currentUser.email}
                  />
                  Usuario activo
                </label>
              </div>
            </div>
            <div className="admin-form-footer">
              <button type="button" className="btn btn-outline" onClick={() => setEditingUser(null)}>Cancelar</button>
              <button type="button" className="btn btn-primary" onClick={handleSaveUser} disabled={savingEdit}>
                {savingEdit ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUsers
