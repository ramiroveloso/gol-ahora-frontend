import React from 'react'

function Competitions({ currentUser, bookings = [], onBackToPortal, onDeleteBooking }) {
  // Mock tournaments
  const tournaments = [
    {
      id: 't1',
      name: 'Torneo Apertura Gol Ahora 2026',
      sport: 'Fútbol 11',
      status: 'En Curso',
      statusColor: 'rgb(0, 200, 100)',
      details: 'Fase de Grupos - Fecha 4 de 6',
      team: 'Deportivo Antigravity',
      position: '3º de 12 equipos',
      banner: 'sports_soccer'
    },
    {
      id: 't2',
      name: 'Copa Relámpago Garnet',
      sport: 'Fútbol 5',
      status: 'Inscripto',
      statusColor: 'rgb(0, 180, 255)',
      details: 'Comienza el 05 de Junio',
      team: 'La Muralla FC',
      position: 'Sorteo pendiente',
      banner: 'emoji_events'
    },
    {
      id: 't3',
      name: 'Liga Femenina Campeonas del Sur',
      sport: 'Fútbol 7',
      status: 'Finalizado',
      statusColor: 'var(--text-muted)',
      details: 'Terminó en Abril 2026',
      team: 'Las Diablas',
      position: 'Subcampeón 🥈',
      banner: 'stars'
    }
  ]

  // Filter client's reservations
  const myBookings = bookings.filter(b => b.user_email === currentUser.email)

  return (
    <div style={{
      maxWidth: '900px',
      margin: '2rem auto',
      padding: '0 1.5rem',
      fontFamily: 'Outfit, sans-serif'
    }}>
      {/* Header section */}
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
          Usuario: <strong>{currentUser.email}</strong>
        </span>
      </div>

      {/* Grid: Tournaments Left, Reservations Right */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '2rem'
      }}>
        {/* Left Column: Tournaments */}
        <div>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '800',
            color: 'var(--text-main)',
            marginBottom: '1.2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span className="material-symbols-outlined" style={{ color: '#00a000' }}>emoji_events</span>
            Mis Competiciones Activas
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {tournaments.map(t => (
              <div 
                key={t.id} 
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <span className="material-symbols-outlined" style={{
                      color: 'var(--accent-garnet)',
                      fontSize: '1.8rem',
                      backgroundColor: 'rgba(218, 25, 60, 0.08)',
                      padding: '0.4rem',
                      borderRadius: '8px'
                    }}>{t.banner}</span>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>
                        {t.name}
                      </h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Deporte: {t.sport}
                      </span>
                    </div>
                  </div>
                  
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    border: `1px solid ${t.statusColor}`,
                    color: t.statusColor
                  }}>
                    {t.status}
                  </span>
                </div>

                <div style={{
                  backgroundColor: 'rgba(0,0,0,0.15)',
                  borderRadius: '8px',
                  padding: '0.8rem 1rem',
                  fontSize: '0.8rem',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.8rem'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>Mi Equipo</span>
                    <strong style={{ color: 'var(--text-main)' }}>{t.team}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>Posición</span>
                    <strong style={{ color: 'var(--text-main)' }}>{t.position}</strong>
                  </div>
                </div>

                <p style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  marginTop: '0.8rem',
                  marginBottom: 0,
                  textAlign: 'right'
                }}>
                  {t.details}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Reservations */}
        <div>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '800',
            color: 'var(--text-main)',
            marginBottom: '1.2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--accent-garnet)' }}>book_online</span>
            Mis Reservas de Canchas
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {myBookings.length > 0 ? (
              myBookings.map(b => (
                <div 
                  key={b.id} 
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '1.2rem',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--accent-garnet)', fontSize: '1.2rem' }}>stadium</span>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{b.court_name}</strong>
                    </div>

                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      padding: '0.15rem 0.4rem',
                      borderRadius: '4px',
                      backgroundColor: b.status === 'confirmed' ? 'rgba(0, 180, 80, 0.08)' : b.status === 'pending' ? 'rgba(255, 165, 0, 0.08)' : 'rgba(218, 25, 60, 0.08)',
                      border: b.status === 'confirmed' ? '1px solid rgb(0, 180, 80)' : b.status === 'pending' ? '1px solid orange' : '1px solid var(--accent-garnet)',
                      color: b.status === 'confirmed' ? 'rgb(0, 200, 100)' : b.status === 'pending' ? 'orange' : 'var(--accent-garnet)'
                    }}>
                      {b.status === 'confirmed' ? 'Confirmado' : b.status === 'pending' ? 'Pendiente' : 'Cancelado'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>
                    <div>
                      <span className="material-symbols-outlined" style={{ fontSize: '0.9rem', verticalAlign: 'middle', marginRight: '0.2rem' }}>calendar_month</span>
                      {b.date}
                    </div>
                    <div>
                      <span className="material-symbols-outlined" style={{ fontSize: '0.9rem', verticalAlign: 'middle', marginRight: '0.2rem' }}>schedule</span>
                      {b.time_slot}
                    </div>
                  </div>

                  {/* Cancel Button */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.6rem' }}>
                    <button
                      onClick={() => onDeleteBooking(b.id)}
                      className="btn"
                      style={{
                        padding: '0.35rem 0.6rem',
                        fontSize: '0.75rem',
                        backgroundColor: 'rgba(218, 25, 60, 0.06)',
                        border: '1px solid rgba(218, 25, 60, 0.3)',
                        color: 'var(--accent-garnet)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                        transition: 'all 0.2s'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>delete</span>
                      <span>Cancelar Turno</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '3rem 1.5rem',
                color: 'var(--text-muted)',
                border: '1px dashed var(--border-color)',
                borderRadius: '12px'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>sports_soccer</span>
                <p style={{ margin: 0, fontSize: '0.9rem', marginBottom: '1rem' }}>No tienes reservas activas registradas.</p>
                <button
                  onClick={() => onBackToPortal()}
                  className="btn btn-primary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', borderRadius: '6px' }}
                >
                  Reservar Cancha Ahora
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Competitions
