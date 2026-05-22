import React from 'react'
import KanbanBoard from './KanbanBoard.jsx'
import { COURTS } from '../App.jsx'

function Dashboard({ bookings, onDeleteBooking, onUpdateBookingStatus, onOpenBooking }) {
  return (
    <section id="dashboard-section" className="dashboard-section">
      {/* Dashboard Controls */}
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h2>Panel de Reservas</h2>
          <p>Crea, gestiona y visualiza el estado de tus partidos en tiempo real.</p>
        </div>
        
        <div className="dashboard-actions">
          <button id="open-booking-btn" className="btn btn-primary" onClick={onOpenBooking}>
            <span className="material-symbols-outlined">add_circle</span>
            <span>Nueva Reserva</span>
          </button>
        </div>
      </div>

      {/* Dashboard Grid Layout */}
      <div className="dashboard-grid">
        
        {/* Main Kanban Board */}
        <KanbanBoard 
          bookings={bookings} 
          onDeleteBooking={onDeleteBooking}
          onUpdateBookingStatus={onUpdateBookingStatus}
        />

        {/* Fields Catalog & Info Side panel */}
        <aside className="sidebar-panel">
          <div className="panel-card">
            <h3>Nuestras Canchas</h3>
            <p className="panel-subtitle">Explora nuestras canchas exclusivas equipadas con la mejor tecnología.</p>
            
            <div className="fields-mini-list" id="fields-mini-list">
              {COURTS.map(court => (
                <div className="mini-field-card" key={court.id}>
                  <div className="mini-field-visual">
                    <span className="material-symbols-outlined">{court.icon}</span>
                  </div>
                  <div className="mini-field-info">
                    <div className="mini-field-name" title={court.name}>{court.name}</div>
                    <div className="mini-field-details">{court.type} • {court.turf}</div>
                  </div>
                  <div className="mini-field-price">
                    ${court.pricePerHour}
                    <span style={{ fontSize: '0.65rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>/h</span>
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
