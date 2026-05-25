import React, { useState } from 'react'
import { STATUS_LABELS } from '../utils/bookingRules.js'

function KanbanCard({ booking, onCancelBooking, onDelete, onConfirmPayment }) {
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

  const courtName = booking.courtName || booking.court_name || 'Cancha'
  const isCancelled = booking.status === 'cancelled'
  const isHistorial = booking.status === 'completed' || isCancelled
  const totalPrice = isCancelled
    ? 0
    : typeof booking.totalPrice === 'number'
      ? booking.totalPrice
      : typeof booking.total_price === 'number'
        ? booking.total_price
        : 0
  const extras = Array.isArray(booking.extras) ? booking.extras : []

  return (
    <div 
      className={`kanban-card ${isDragging ? 'dragging' : ''}`}
      draggable="true" 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      data-id={booking.id}
    >
      {/* Delete reservation button */}
      {(onCancelBooking || onDelete) && !isHistorial && (
        <button
          type="button"
          className="card-delete-btn card-action-menu"
          onClick={() => {
            const isCancel = onCancelBooking && !isHistorial
            const msg = isCancel
              ? '¿Cancelar esta reserva? (quedará en historial)'
              : '¿Eliminar esta reserva del sistema?'
            if (!window.confirm(msg)) return
            if (isCancel) onCancelBooking(booking.id)
            else if (onDelete) onDelete(booking.id)
          }}
          title={onCancelBooking ? 'Cancelar reserva' : 'Eliminar reserva'}
        >
          <span className="material-symbols-outlined">cancel</span>
        </button>
      )}
      
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
      
      {isCancelled && (
        <span className="card-status-badge card-status-cancelled">
          {STATUS_LABELS.cancelled}
        </span>
      )}
      <div className="card-footer">
        {isCancelled ? (
          <span className="card-price card-price-cancelled">Sin cargo</span>
        ) : (
          <span className="card-price">${totalPrice.toFixed(2)}</span>
        )}
        {!isCancelled && booking.durationHours > 1 && (
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
      {!isHistorial && (
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.35rem' }}>
          Arrastrar para mover de columna
        </span>
      )}
    </div>
  )
}

export default KanbanCard
