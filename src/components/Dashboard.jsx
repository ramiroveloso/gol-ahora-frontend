import React, { useState } from 'react'
import KanbanBoard from './KanbanBoard.jsx'
import BookingsList from './BookingsList.jsx'
import { COURTS } from '../App.jsx'

function Dashboard({ bookings, onDeleteBooking, onUpdateBookingStatus, onOpenBooking, onRequestPayment }) {
  const [viewMode, setViewMode] = useState('kanban')

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
          {viewMode === 'kanban' ? (
            <KanbanBoard
              bookings={bookings}
              onDeleteBooking={onDeleteBooking}
              onUpdateBookingStatus={onUpdateBookingStatus}
              onRequestPayment={onRequestPayment}
            />
          ) : (
            <BookingsList
              bookings={bookings}
              onDeleteBooking={onDeleteBooking}
              onUpdateBookingStatus={onUpdateBookingStatus}
              onRequestPayment={onRequestPayment}
            />
          )}
        </div>

        <aside className="sidebar-panel">
          <div className="panel-card">
            <h3>Nuestras Canchas</h3>
            <p className="panel-subtitle">Duración máx.: F5 1 h · F7 1,5 h · F11 2 h (RF-26).</p>
            <div className="fields-mini-list" id="fields-mini-list">
              {COURTS.map((court) => (
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
