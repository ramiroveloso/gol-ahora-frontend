import React from 'react'

function ProfileModal({ currentUser, isOpen, onClose }) {
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

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      animation: 'fadeIn 0.25s ease'
    }} onClick={onClose}>
      <div 
        style={{
          width: '90%',
          maxWidth: '440px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 15px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(218, 25, 60, 0.1)',
          position: 'relative',
          animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          fontFamily: 'Outfit, sans-serif'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.2rem',
            right: '1.2rem',
            backgroundColor: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.4rem',
            borderRadius: '50%',
            transition: 'all 0.2s'
          }}
          className="modal-close-hover"
          title="Cerrar"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.3rem' }}>close</span>
        </button>

        {/* Modal Header & Avatar */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          marginBottom: '2rem',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '1.5rem'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: 'rgba(218, 25, 60, 0.08)',
            border: '2px solid var(--accent-garnet)',
            color: 'var(--accent-garnet)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
            boxShadow: '0 0 15px rgba(218, 25, 60, 0.2)'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '3.2rem' }}>account_circle</span>
          </div>

          <h3 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
            Mi Perfil
          </h3>
          <span style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            marginTop: '0.2rem'
          }}>
            Gol Ahora ID: #{currentUser.id ? currentUser.id.toString().substring(0, 8) : 'GOL-AHO'}
          </span>
        </div>

        {/* Info Rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginBottom: '2rem' }}>
          {/* Row 1: Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--text-muted)', fontSize: '1.3rem' }}>person</span>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Nombre Completo</span>
              <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{currentUser.name}</strong>
            </div>
          </div>

          {/* Row 2: Email */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--text-muted)', fontSize: '1.3rem' }}>mail</span>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Correo Electrónico</span>
              <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)', wordBreak: 'break-all' }}>{currentUser.email}</strong>
            </div>
          </div>

          {/* Row 3: Role */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--text-muted)', fontSize: '1.3rem' }}>badge</span>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Rol Asignado</span>
              <span style={{
                display: 'inline-block',
                marginTop: '0.2rem',
                fontSize: '0.7rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: `1px solid ${getRoleBadgeColor(role)}`,
                color: getRoleBadgeColor(role)
              }}>
                {getRoleDisplayName(role)}
              </span>
            </div>
          </div>

          {/* Row 4: Account Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span className="material-symbols-outlined" style={{ color: '#00a000', fontSize: '1.3rem' }}>verified</span>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Estado de Cuenta</span>
              <strong style={{ fontSize: '0.95rem', color: '#00c864' }}>Verificado / Activo</strong>
            </div>
          </div>

          {/* Row 5: Member Since */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--text-muted)', fontSize: '1.3rem' }}>event</span>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Miembro Desde</span>
              <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>Mayo 2026</strong>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button 
            onClick={onClose}
            className="btn btn-primary"
            style={{
              padding: '0.6rem 2rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: '600',
              width: '100%'
            }}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProfileModal
