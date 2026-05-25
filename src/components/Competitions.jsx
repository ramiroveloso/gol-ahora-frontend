import React, { useMemo } from 'react'
import { STATUS_LABELS } from '../utils/bookingRules.js'

function Competitions({ currentUser, bookings = [], onBackToPortal, onCancelBooking }) {
  const myBookings = useMemo(() => {
    const email = (currentUser?.email || '').toLowerCase()
    const id = String(currentUser?.id ?? '')
    return bookings.filter((b) => {
      if (id && b.userId && String(b.userId) === id) return true
      if (email && (b.userEmail || '').toLowerCase() === email) return true
      return false
    })
  }, [bookings, currentUser])

  const statusLabel = (status) => STATUS_LABELS[status] || status

  return (
    <div
      style={{
        maxWidth: '900px',
        margin: '2rem auto',
        padding: '0 1.5rem',
        fontFamily: 'Outfit, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <button
          type="button"
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
            fontSize: '0.85rem',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>
            arrow_back
          </span>
          <span>Volver al Portal</span>
        </button>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Usuario: <strong>{currentUser.email}</strong>
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
        }}
      >
        <div>
          <h3
            style={{
              fontSize: '1.25rem',
              fontWeight: '800',
              color: 'var(--text-main)',
              marginBottom: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span className="material-symbols-outlined" style={{ color: '#00a000' }}>
              emoji_events
            </span>
            Mis Competiciones
          </h3>

          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px dashed var(--border-color)',
              borderRadius: '12px',
              padding: '2rem 1.5rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '2.5rem', marginBottom: '0.75rem', color: 'var(--accent-garnet)' }}
            >
              construction
            </span>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', color: 'var(--text-main)' }}>
              Torneos y ligas — próximamente
            </p>
            <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.5 }}>
              Cuando el backend exponga <code>/api/competitions/</code>, acá vas a ver tus
              inscripciones y el fixture.
            </p>
          </div>
        </div>

        <div>
          <h3
            style={{
              fontSize: '1.25rem',
              fontWeight: '800',
              color: 'var(--text-main)',
              marginBottom: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span className="material-symbols-outlined" style={{ color: 'var(--accent-garnet)' }}>
              book_online
            </span>
            Mis Reservas de Canchas
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {myBookings.length > 0 ? (
              myBookings.map((b) => (
                <div
                  key={b.id}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '1.2rem',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.8rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        className="material-symbols-outlined"
                        style={{ color: 'var(--accent-garnet)', fontSize: '1.2rem' }}
                      >
                        stadium
                      </span>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        {b.courtName}
                      </strong>
                    </div>

                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        padding: '0.15rem 0.4rem',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {statusLabel(b.status)}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.5rem',
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                      marginBottom: '0.8rem',
                    }}
                  >
                    <div>
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: '0.9rem', verticalAlign: 'middle', marginRight: '0.2rem' }}
                      >
                        calendar_month
                      </span>
                      {b.date}
                    </div>
                    <div>
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: '0.9rem', verticalAlign: 'middle', marginRight: '0.2rem' }}
                      >
                        schedule
                      </span>
                      {b.time}
                    </div>
                  </div>

                  {onCancelBooking && b.status !== 'completed' && b.status !== 'cancelled' && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        borderTop: '1px solid rgba(255,255,255,0.03)',
                        paddingTop: '0.6rem',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('¿Cancelar este turno?')) onCancelBooking(b.id)
                        }}
                        className="btn"
                        style={{
                          padding: '0.35rem 0.6rem',
                          fontSize: '0.75rem',
                          backgroundColor: 'rgba(46, 204, 113, 0.06)',
                          border: '1px solid rgba(46, 204, 113, 0.3)',
                          color: 'var(--accent-garnet)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>
                          cancel
                        </span>
                        <span>Cancelar turno</span>
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '3rem 1.5rem',
                  color: 'var(--text-muted)',
                  border: '1px dashed var(--border-color)',
                  borderRadius: '12px',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: '2.5rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}
                >
                  sports_soccer
                </span>
                <p style={{ margin: 0, fontSize: '0.9rem', marginBottom: '1rem' }}>
                  No tenés reservas registradas con esta cuenta.
                </p>
                <button
                  type="button"
                  onClick={onBackToPortal}
                  className="btn btn-primary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', borderRadius: '6px' }}
                >
                  Reservar cancha
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
