import React, { useState, useEffect } from 'react'
import { TIME_SLOTS } from '../App.jsx'
import { DEFAULT_COURTS } from '../data/catalogDefaults.js'
import {
  loadMaintenanceSlots,
  saveMaintenanceSlots,
  addMaintenanceSlot,
  removeMaintenanceSlot,
  findMaintenanceSlot,
} from '../utils/maintenanceStorage.js'

function AdminCalendar({ bookings, courts = DEFAULT_COURTS, onDeleteBooking, onBackToPortal, showToast }) {
  const getTodayDateString = () => {
    const d = new Date()
    return d.toISOString().split('T')[0]
  }

  // Date state (defaults to today)
  const [selectedDate, setSelectedDate] = useState(getTodayDateString())
  
  // Modal states
  const [selectedCell, setSelectedCell] = useState(null) // { court, slot }
  const [selectedBooking, setSelectedBooking] = useState(null) // booking object
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [maintenanceSlots, setMaintenanceSlots] = useState(loadMaintenanceSlots)

  useEffect(() => {
    saveMaintenanceSlots(maintenanceSlots)
  }, [maintenanceSlots])

  // Navigate dates helpers
  const handlePrevDay = () => {
    const d = new Date(selectedDate + 'T00:00:00')
    d.setDate(d.getDate() - 1)
    setSelectedDate(d.toISOString().split('T')[0])
  }

  const handleNextDay = () => {
    const d = new Date(selectedDate + 'T00:00:00')
    d.setDate(d.getDate() + 1)
    setSelectedDate(d.toISOString().split('T')[0])
  }

  const handleGoToToday = () => {
    setSelectedDate(getTodayDateString())
  }

  // Find bookings for the active date
  const bookingsForSelectedDate = bookings.filter(b => b.date === selectedDate)

  const maintenanceForDate = maintenanceSlots.filter((m) => m.date === selectedDate)

  const getBookingForCell = (courtId, slot) => {
    const maint = findMaintenanceSlot(maintenanceForDate, courtId, selectedDate, slot)
    if (maint) return maint
    return bookingsForSelectedDate.find((b) => b.courtId === String(courtId) && b.time === slot)
  }

  // Handle cell click
  const handleCellClick = (court, slot, booking) => {
    if (booking) {
      setSelectedBooking(booking)
    } else {
      setSelectedCell({ court, slot })
    }
  }

  // Action: Lock as Maintenance
  const handleLockMaintenance = () => {
    if (!selectedCell) return
    setMaintenanceSlots((prev) =>
      addMaintenanceSlot(
        prev,
        selectedCell.court.id,
        selectedDate,
        selectedCell.slot,
        selectedCell.court.name,
      ),
    )
    setSelectedCell(null)
    showToast('Franja bloqueada en mantenimiento (solo en este navegador).', 'success')
  }

  const handleCancelBooking = async () => {
    if (!selectedBooking) return
    setIsSubmitting(true)
    try {
      const isMaint = selectedBooking.status === 'maintenance'
      if (isMaint) {
        setMaintenanceSlots((prev) =>
          removeMaintenanceSlot(prev, selectedBooking.courtId, selectedDate, selectedBooking.time),
        )
        showToast('Cancha liberada de mantenimiento.', 'info')
      } else {
        await onDeleteBooking(selectedBooking.id)
        showToast('Reserva eliminada del sistema.', 'info')
      }
      setSelectedBooking(null)
    } catch (err) {
      showToast(err.message || 'Error al remover la reserva.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '2rem auto',
      padding: '0 1.5rem',
      fontFamily: 'Outfit, sans-serif'
    }}>
      {/* Header / Nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
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
          Panel: <strong>Control y Mantenimiento de Canchas</strong>
        </span>
      </div>

      {/* Main Container */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
      }}>
        
        {/* Title & Controls */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          marginBottom: '2rem',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '1.5rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--accent-garnet)', fontSize: '2rem' }}>calendar_month</span>
              <h2 style={{ fontSize: '1.6rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
                Control de Reservas
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Visualiza ocupación, crea reservas rápidas y bloquea canchas por mantenimiento.
            </p>
          </div>

          {/* Date Selector Navigation */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '0.4rem 0.6rem'
          }}>
            <button 
              onClick={handlePrevDay} 
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-main)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Día Anterior"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>

            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-main)',
                fontSize: '0.9rem',
                fontWeight: '600',
                outline: 'none',
                fontFamily: 'inherit',
                cursor: 'pointer',
                padding: '0 0.5rem'
              }}
            />

            <button 
              onClick={handleNextDay}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-main)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Siguiente Día"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>

            <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-color)', margin: '0 0.2rem' }} />

            <button 
              onClick={handleGoToToday}
              style={{
                background: 'rgba(46, 204, 113, 0.1)',
                border: '1px solid rgba(46, 204, 113, 0.25)',
                color: 'var(--accent-garnet)',
                borderRadius: '6px',
                padding: '0.2rem 0.6rem',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Hoy
            </button>
          </div>
        </div>

        {/* Legend Panel */}
        <div style={{
          display: 'flex',
          gap: '1.5rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          backgroundColor: 'rgba(255,255,255,0.01)',
          padding: '0.8rem 1rem',
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border-color)', display: 'inline-block' }} />
            <span>Disponible / Libre (Haz clic para operar)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'rgba(46, 204, 113, 0.15)', border: '1px solid var(--accent-garnet)', display: 'inline-block' }} />
            <span>En Mantenimiento</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-color)', display: 'inline-block' }} />
            <span>Reservado por Cliente</span>
          </div>
        </div>

        {/* Calendar Grid wrapper */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            minWidth: '750px',
            fontSize: '0.85rem'
          }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{
                  padding: '1rem',
                  color: 'var(--text-muted)',
                  fontWeight: '600',
                  textAlign: 'left',
                  width: '120px'
                }}>Horarios</th>
                {courts.map(court => (
                  <th key={court.id} style={{
                    padding: '1rem',
                    color: 'var(--text-main)',
                    fontWeight: '700',
                    textAlign: 'center'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--accent-garnet)', fontSize: '1.4rem' }}>{court.icon}</span>
                      <span>{court.name}</span>
                      <span style={{ fontSize: '0.7rem', fontWeight: '500', color: 'var(--text-muted)' }}>{court.type}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map((slot) => (
                <tr key={slot} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background-color 0.2s' }}>
                  {/* Time label cell */}
                  <td style={{
                    padding: '1rem 0.5rem',
                    fontWeight: '600',
                    color: 'var(--text-muted)',
                    verticalAlign: 'middle'
                  }}>
                    <div style={{
                      backgroundColor: 'rgba(255,255,255,0.02)',
                      padding: '0.4rem 0.6rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      textAlign: 'center',
                      fontSize: '0.8rem',
                      whiteSpace: 'nowrap'
                    }}>
                      {slot}
                    </div>
                  </td>

                  {/* Courts cells */}
                  {courts.map((court) => {
                    const booking = getBookingForCell(court.id, slot)
                    const isMaint = booking?.status === 'maintenance'
                    const isBooked = !!booking && !isMaint

                    let cellStyle = {
                      padding: '0.6rem',
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      width: '22%'
                    }

                    return (
                      <td key={court.id} style={cellStyle}>
                        {isMaint ? (
                          /* MANTENIMIENTO BLOCK */
                          <div 
                            onClick={() => handleCellClick(court, slot, booking)}
                            style={{
                              backgroundColor: 'rgba(46, 204, 113, 0.12)',
                              border: '1.5px solid var(--accent-garnet)',
                              borderRadius: '10px',
                              padding: '0.7rem',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '0.2rem',
                              color: 'var(--accent-garnet)',
                              transition: 'transform 0.2s, box-shadow 0.2s',
                              boxShadow: '0 4px 12px rgba(46, 204, 113, 0.08)'
                            }}
                            className="admin-calendar-block"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', color: 'var(--accent-garnet)' }}>warning</span>
                            <span style={{ fontWeight: '700', fontSize: '0.8rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>En Mantenimiento</span>
                            <span style={{ fontSize: '0.7rem', color: 'rgba(46, 204, 113, 0.75)' }}>Liberar Cancha</span>
                          </div>
                        ) : isBooked ? (
                          /* CLIENT BOOKING */
                          <div 
                            onClick={() => handleCellClick(court, slot, booking)}
                            style={{
                              backgroundColor: 'rgba(255, 255, 255, 0.02)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '10px',
                              padding: '0.7rem',
                              cursor: 'pointer',
                              textAlign: 'left',
                              position: 'relative',
                              transition: 'transform 0.2s, border-color 0.2s'
                            }}
                            className="admin-calendar-block"
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                              <span style={{
                                fontSize: '0.65rem',
                                padding: '0.1rem 0.35rem',
                                borderRadius: '4px',
                                textTransform: 'uppercase',
                                fontWeight: 'bold',
                                backgroundColor: booking.status === 'confirmed' ? 'rgba(0, 160, 0, 0.12)' : 'rgba(255, 170, 0, 0.12)',
                                border: `1px solid ${booking.status === 'confirmed' ? '#00a000' : '#ffaa00'}`,
                                color: booking.status === 'confirmed' ? '#00a000' : '#ffaa00'
                              }}>
                                {booking.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}
                              </span>
                              <span className="material-symbols-outlined" style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>edit_calendar</span>
                            </div>
                            <div style={{
                              fontWeight: '700',
                              color: 'var(--text-main)',
                              fontSize: '0.8rem',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }} title={booking.userEmail}>
                              {booking.userEmail.split('@')[0]}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                              ${booking.totalPrice} • Sin extras
                            </div>
                          </div>
                        ) : (
                          /* AVAILABLE SLOT */
                          <div 
                            onClick={() => handleCellClick(court, slot, null)}
                            style={{
                              border: '1px dashed var(--border-color)',
                              borderRadius: '10px',
                              padding: '0.8rem 0.5rem',
                              cursor: 'pointer',
                              color: 'var(--text-muted)',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.3rem',
                              backgroundColor: 'rgba(255, 255, 255, 0.005)'
                            }}
                            className="admin-calendar-available"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>add</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: '500' }}>Disponible</span>
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* MODAL 1: Create Block or Special Booking */}
      {selectedCell && (
        <div 
          className="modal-overlay"
          onClick={(e) => {
            if (e.target.className === 'modal-overlay') setSelectedCell(null)
          }}
        >
          <div className="modal-drawer" style={{ maxWidth: '420px', minHeight: 'auto', padding: '1.8rem' }}>
            <div className="modal-header" style={{ marginBottom: '1.2rem', padding: 0 }}>
              <h3 style={{ margin: 0 }}>Administrar Turno</h3>
              <button className="icon-btn" onClick={() => setSelectedCell(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem', fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              <p style={{ margin: '0 0 0.4rem 0' }}>
                Cancha: <strong style={{ color: 'var(--text-main)' }}>{selectedCell.court.name}</strong>
              </p>
              <p style={{ margin: '0 0 0.4rem 0' }}>
                Fecha: <strong style={{ color: 'var(--text-main)' }}>{selectedDate}</strong>
              </p>
              <p style={{ margin: 0 }}>
                Horario: <strong style={{ color: 'var(--text-main)' }}>{selectedCell.slot}</strong>
              </p>
            </div>

            <div
              style={{
                borderTop: '1px solid var(--border-color)',
                paddingTop: '1.2rem',
                marginBottom: '1.2rem',
                padding: '0.9rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 165, 0, 0.06)',
                border: '1px solid rgba(255, 165, 0, 0.25)',
              }}
            >
              <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Reserva para otro cliente
              </h4>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                No disponible: la API crea reservas solo para el usuario logueado. Cuando el backend
                acepte <code>usuario</code> en el body, se habilitará la reserva rápida por email.
              </p>
            </div>

            <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '1.2rem' }}>
              <h4 style={{ margin: '0 0 0.6rem 0', fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)' }}>
                Opción B: Bloqueo de Mantenimiento
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 1rem 0', lineHeight: '1.4' }}>
                Bloqueo visual en este calendario (sessionStorage). No se guarda en el servidor hasta que exista
                un endpoint de mantenimiento.
              </p>
              <button 
                type="button"
                disabled={isSubmitting}
                onClick={handleLockMaintenance}
                className="btn"
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(46, 204, 113, 0.1)',
                  border: '1px solid var(--accent-garnet)',
                  color: 'var(--accent-garnet)',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.3rem',
                  transition: 'all 0.2s'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>engineering</span>
                <span>{isSubmitting ? 'Bloqueando...' : 'Poner en Mantenimiento'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: View and Manage existing Booking / Block */}
      {selectedBooking && (
        <div 
          className="modal-overlay"
          onClick={(e) => {
            if (e.target.className === 'modal-overlay') setSelectedBooking(null)
          }}
        >
          <div className="modal-drawer" style={{ maxWidth: '400px', minHeight: 'auto', padding: '1.8rem' }}>
            <div className="modal-header" style={{ marginBottom: '1.2rem', padding: 0 }}>
              <h3 style={{ margin: 0 }}>
                {selectedBooking.status === 'maintenance' ? 'Detalle de Bloqueo' : 'Detalle de Reserva'}
              </h3>
              <button className="icon-btn" onClick={() => setSelectedBooking(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div style={{ marginBottom: '1.8rem', fontSize: '0.88rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div>Cancha: <strong style={{ color: 'var(--text-main)' }}>{selectedBooking.courtName}</strong></div>
              <div>Fecha: <strong style={{ color: 'var(--text-main)' }}>{selectedBooking.date}</strong></div>
              <div>Horario: <strong style={{ color: 'var(--text-main)' }}>{selectedBooking.time}</strong></div>
              
              {selectedBooking.status !== 'maintenance' ? (
                <>
                  <div>Email Cliente: <strong style={{ color: 'var(--text-main)' }}>{selectedBooking.userEmail}</strong></div>
                  <div>Precio: <strong style={{ color: 'var(--text-main)' }}>${selectedBooking.totalPrice}</strong></div>
                  <div>Estado: <span style={{
                    fontSize: '0.72rem',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    backgroundColor: selectedBooking.status === 'confirmed' ? 'rgba(0, 160, 0, 0.1)' : 'rgba(255, 170, 0, 0.1)',
                    border: `1px solid ${selectedBooking.status === 'confirmed' ? '#00a000' : '#ffaa00'}`,
                    color: selectedBooking.status === 'confirmed' ? '#00a000' : '#ffaa00'
                  }}>{selectedBooking.status}</span></div>
                </>
              ) : (
                <div style={{
                  marginTop: '0.5rem',
                  padding: '0.6rem 0.8rem',
                  backgroundColor: 'rgba(46, 204, 113, 0.08)',
                  border: '1px solid rgba(46, 204, 113, 0.25)',
                  borderRadius: '8px',
                  color: 'var(--accent-garnet)',
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>engineering</span>
                  <span>Este horario está cerrado al público por tareas de mantenimiento.</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.2rem' }}>
              <button 
                type="button"
                disabled={isSubmitting}
                onClick={handleCancelBooking}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  backgroundColor: 'var(--accent-garnet)',
                  border: '1px solid var(--accent-garnet)',
                  color: 'var(--text-main)',
                  padding: '0.6rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.3rem'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>
                  {selectedBooking.status === 'maintenance' ? 'lock_open' : 'cancel'}
                </span>
                <span>
                  {isSubmitting 
                    ? 'Procesando...' 
                    : selectedBooking.status === 'maintenance' 
                      ? 'Liberar Cancha (Quitar Bloqueo)' 
                      : 'Cancelar Reserva de Cliente'
                  }
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminCalendar
