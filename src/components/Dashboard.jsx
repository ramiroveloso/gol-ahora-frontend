import React, { useState, useEffect, useMemo } from 'react'
import KanbanBoard from './KanbanBoard.jsx'
import BookingsList from './BookingsList.jsx'
import { DEFAULT_COURTS } from '../data/catalogDefaults.js'
import { withDisplayStatuses } from '../utils/bookingRules.js'

function Dashboard({
  bookings,
  courts = DEFAULT_COURTS,
  onCancelBooking,
  onDeleteBooking,
  onUpdateBookingStatus,
  onOpenBooking,
  onRequestPayment,
}) {
  const [viewMode, setViewMode] = useState('kanban')
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const tick = () => setNow(new Date())
    const id = setInterval(tick, 15000)
    return () => clearInterval(id)
  }, [])

  const displayBookings = useMemo(
    () => withDisplayStatuses(bookings, now),
    [bookings, now]
  )

  if (courts.length === 0) {
    return (
      <section id="dashboard-section" className="dashboard-section">
        <div className="bookings-list-empty" style={{ marginTop: '2rem' }}>
          <span className="material-symbols-outlined">stadium</span>
          <p>No hay canchas disponibles en el sistema. Contactá al administrador.</p>
        </div>
      </section>
    )
  }

  return (
    <section id="dashboard-section" className="dashboard-section">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h2>Mis Reservas</h2>
          <p>Crea, filtra y gestiona tus turnos. Pendientes → pago → confirmada.</p>
        </div>

        <div className="dashboard-actions">
          <div className="dashboard-view-tabs">
            <button
              type="button"
              className={`view-tab ${viewMode === 'kanban' ? 'active' : ''}`}
              onClick={() => setViewMode('kanban')}
            >
              <span className="material-symbols-outlined">view_kanban</span>
              Tablero
            </button>
            <button
              type="button"
              className={`view-tab ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <span className="material-symbols-outlined">list_alt</span>
              Lista
            </button>
          </div>
          <button type="button" id="open-booking-btn" className="btn btn-primary" onClick={onOpenBooking}>
            <span className="material-symbols-outlined">add_circle</span>
            <span>Nueva Reserva</span>
          </button>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-main-panel">
          {displayBookings.length === 0 ? (
            <div className="bookings-list-empty" style={{ padding: '3rem 1rem' }}>
              <span className="material-symbols-outlined">event_available</span>
              <p>No tenés reservas todavía. Creá una con el botón Nueva Reserva.</p>
              <button type="button" className="btn btn-primary" onClick={onOpenBooking}>
                Nueva Reserva
              </button>
            </div>
          ) : viewMode === 'kanban' ? (
            <KanbanBoard
              bookings={displayBookings}
              onCancelBooking={onCancelBooking}
              onDeleteBooking={onDeleteBooking}
              onUpdateBookingStatus={onUpdateBookingStatus}
              onRequestPayment={onRequestPayment}
            />
          ) : (
            <BookingsList
              bookings={displayBookings}
              onCancelBooking={onCancelBooking}
              onDeleteBooking={onDeleteBooking}
              onUpdateBookingStatus={onUpdateBookingStatus}
              onRequestPayment={onRequestPayment}
            />
          )}
        </div>

        <aside className="sidebar-panel">
          <div className="panel-card">
            <h3>Nuestras Canchas</h3>
            <p className="panel-subtitle">Duración máx.: F5 1 h · F7 1,5 h · F11 2 h.</p>
            <div className="fields-mini-list" id="fields-mini-list">
              {courts.map((court) => (
                <div className="mini-field-card" key={court.id}>
                  <div className="mini-field-visual">
                    <span className="material-symbols-outlined">{court.icon}</span>
                  </div>
                  <div className="mini-field-info">
                    <div className="mini-field-name" title={court.name}>
                      {court.name}
                    </div>
                    <div className="mini-field-details">
                      {court.type} · máx. {Math.floor((court.maxDurationMinutes || 120) / 60)} h
                    </div>
                  </div>
                  <div className="mini-field-price">
                    ${court.pricePerHour}
                    <span style={{ fontSize: '0.65rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>
                      /h
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}

export default Dashboard
