import React from 'react'

function Portal({ currentUser, onViewChange }) {
  const role = currentUser.role || 'cliente'

  // Define role specific cards and their target views
  const getRoleActions = () => {
    switch (role) {
      case 'profesional':
        return [
          {
            id: 'attendance',
            title: 'Tomar Lista',
            description: 'Registra la asistencia de los alumnos anotados a tu clase del día.',
            icon: 'checklist',
            target: 'attendance',
            badge: 'Clases hoy',
            badgeColor: '#0070f3'
          },
          {
            id: 'reservas',
            title: 'Tablero de Canchas',
            description: 'Visualiza el estado de las reservas de canchas y horarios disponibles.',
            icon: 'sports_soccer',
            target: 'dashboard',
            badge: 'Calendario',
            badgeColor: 'var(--text-muted)'
          }
        ]
      case 'administrador':
        return [
          {
            id: 'catalog',
            title: 'Catálogo (Canchas / Profes / Users)',
            description: 'Listar canchas, profesores y usuarios desde la API (auth, fields).',
            icon: 'database',
            target: 'catalog',
            badge: 'Desarrollo',
            badgeColor: '#2ECC71',
          },
          {
            id: 'admin_users',
            title: 'Gestión de Usuarios',
            description: 'Visualiza, audita o da de baja usuarios. La baja eliminará en cascada todas sus reservas activas.',
            icon: 'group',
            target: 'admin_users',
            badge: 'Control Total',
            badgeColor: 'var(--accent-garnet)'
          },
          {
            id: 'admin_finance',
            title: 'Historial de Cobros',
            description: 'Consultá cobros y recibos registrados (cierre de caja).',
            icon: 'payments',
            target: 'admin_finance',
            badge: 'Finanzas',
            badgeColor: '#2ECC71',
          },
          {
            id: 'reservas',
            title: 'Control de Reservas',
            description: 'Supervisa el calendario de canchas en tiempo real y bloquea franjas horarias por mantenimiento.',
            icon: 'calendar_month',
            target: 'admin_calendar',
            badge: 'Calendario',
            badgeColor: 'var(--accent-garnet)'
          }
        ]
      case 'cliente':
      default:
        return [
          {
            id: 'reservas',
            title: 'Ver y Reservar Canchas',
            description: 'Agenda un turno en nuestras canchas sintéticas o techadas de última generación.',
            icon: 'stadium',
            target: 'dashboard',
            badge: 'Reservas rápidas',
            badgeColor: 'var(--accent-garnet)'
          },
          {
            id: 'competitions',
            title: 'Mis Competiciones',
            description: 'Consulta los torneos y ligas a las que estás inscripto y sigue tu desempeño.',
            icon: 'emoji_events',
            target: 'competitions',
            badge: 'Mis Torneos',
            badgeColor: '#00a000'
          }
        ]
    }
  }

  const actions = getRoleActions()

  const getRoleDisplayName = (r) => {
    if (r === 'administrador') return 'Administrador del Sistema'
    if (r === 'profesional') return 'Profesional Deportivo'
    return 'Cliente Especial'
  }

  const getRoleDescription = (r) => {
    if (r === 'administrador') return 'Panel exclusivo para supervisión y administración de cuentas.'
    if (r === 'profesional') return 'Gestiona la asistencia y el progreso de los deportistas en tus clases.'
    return 'Reserva turnos en instantes y haz el seguimiento de tus competiciones activas.'
  }

  return (
    <div className="portal-container" style={{
      maxWidth: '900px',
      margin: '2rem auto',
      padding: '0 1.5rem',
      fontFamily: 'Outfit, sans-serif'
    }}>
      {/* Welcome Banner */}
      <div className="portal-welcome-banner" style={{
        background: 'linear-gradient(135deg, rgba(46, 204, 113, 0.15) 0%, rgba(20, 20, 24, 0.95) 100%)',
        border: '1px solid rgba(46, 204, 113, 0.25)',
        borderRadius: '16px',
        padding: '2.5rem',
        marginBottom: '2.5rem',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Decorative subtle neon dot */}
        <div style={{
          position: 'absolute',
          top: '1.5rem',
          right: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.75rem',
          color: 'var(--text-muted)'
        }}>
          <span className="material-symbols-outlined" style={{
            color: role === 'administrador' ? 'var(--accent-garnet)' : role === 'profesional' ? '#0070f3' : '#00a000',
            animation: 'pulse 2s infinite',
            fontSize: '1.1rem'
          }}>fiber_manual_record</span>
          Sistema Activo
        </div>

        <h2 style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
          ¡Hola, <span style={{ color: 'var(--accent-garnet)' }}>{currentUser.name}</span>!
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '1.5rem' }}>
          Rol asignado: <strong style={{ color: 'var(--text-main)', textTransform: 'capitalize' }}>{getRoleDisplayName(role)}</strong>
        </p>
        <div style={{
          height: '2px',
          width: '60px',
          backgroundColor: 'var(--accent-garnet)',
          marginBottom: '1rem'
        }} />
        <p style={{
          color: 'var(--text-muted)',
          fontSize: '0.95rem',
          lineHeight: '1.6',
          maxWidth: '600px',
          margin: 0
        }}>
          {getRoleDescription(role)}
        </p>
      </div>

      {/* Action Title */}
      <h3 style={{
        fontSize: '1.2rem',
        fontWeight: '700',
        color: 'var(--text-main)',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <span className="material-symbols-outlined" style={{ color: 'var(--accent-garnet)' }}>bolt</span>
        Tareas y Operaciones Disponibles
      </h3>

      {/* Grid of Action Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem'
      }}>
        {actions.map((act) => (
          <div 
            key={act.id} 
            onClick={() => onViewChange(act.target)}
            className="portal-action-card"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '1.8rem',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '180px'
            }}
          >
            <div>
              {/* Badge header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  padding: '0.6rem',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-garnet)'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.8rem' }}>{act.icon}</span>
                </div>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${act.badgeColor}`,
                  color: act.badgeColor
                }}>
                  {act.badge}
                </span>
              </div>

              {/* Title & Desc */}
              <h4 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: 'var(--text-main)',
                marginBottom: '0.5rem'
              }}>
                {act.title}
              </h4>
              <p style={{
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                lineHeight: '1.5',
                margin: 0
              }}>
                {act.description}
              </p>
            </div>

            {/* Bottom link style indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              color: 'var(--accent-garnet)',
              fontSize: '0.8rem',
              fontWeight: '600',
              marginTop: '1.5rem',
              alignSelf: 'flex-start'
            }}>
              <span>Comenzar tarea</span>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem', transition: 'transform 0.2s' }}>arrow_forward</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Portal
