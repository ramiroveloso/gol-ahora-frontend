import React, { useState } from 'react'

function KanbanCard({ booking, onDelete, onConfirmPayment }) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragStart = (e) => {
    setIsDragging(true)
    e.dataTransfer.setData('text/plain', booking.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  // Format Date for premium visual presentation
  let formattedDate = booking.date
  try {
    const dateObj = new Date(booking.date + 'T00:00:00')
    formattedDate = dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
  } catch (e) {}

  const courtName = booking.courtName || booking.court_name || 'Cancha';
  const totalPrice = typeof booking.totalPrice === 'number' ? booking.totalPrice : (typeof booking.total_price === 'number' ? booking.total_price : 0);
  const extras = Array.isArray(booking.extras) ? booking.extras : [];

  return (
    <div 
      className={`kanban-card ${isDragging ? 'dragging' : ''}`}
      draggable="true" 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      data-id={booking.id}
    >
      {/* Delete reservation button */}
      <button 
        className="card-delete-btn card-action-menu" 
        onClick={() => {
          if (window.confirm('¿Estás seguro de que deseas eliminar esta reserva?')) {
            onDelete(booking.id)
          }
        }} 
        title="Eliminar reserva"
      >
        <span className="material-symbols-outlined">delete</span>
      </button>
      
      <div className="card-court-name">{courtName}</div>
      
      <div className="card-meta">
        <div className="card-meta-item">
          <span className="material-symbols-outlined">calendar_today</span>
          <span>{formattedDate}</span>
        </div>
        <div className="card-meta-item">
          <span className="material-symbols-outlined">schedule</span>
          <span>{booking.time}</span>
        </div>
      </div>
      
      <div className="card-details-pills">
        <span className="card-pill">{booking.type}</span>
        {extras.map((ex, index) => (
          <span className="card-pill card-pill-accent" key={index}>{ex}</span>
        ))}
      </div>
      
      <div className="card-footer">
        <span className="card-price">${totalPrice.toFixed(2)}</span>
        {booking.durationHours > 1 && (
          <span className="card-duration-tag">{booking.durationHours} h</span>
        )}
      </div>
      {booking.status === 'pending' && onConfirmPayment && (
        <button
          type="button"
          className="kanban-pay-btn"
          onClick={() => onConfirmPayment(booking)}
        >
          <span className="material-symbols-outlined">payments</span>
          Pagar
        </button>
      )}
      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.35rem' }}>
        Arrastrar para mover de columna
      </span>
    </div>
  )
}

export default KanbanCard
