import React, { useState } from 'react'
import KanbanCard from './KanbanCard.jsx'

function KanbanColumn({ id, title, indicatorClass, bookings, onDeleteBooking, onUpdateBookingStatus, onConfirmPayment }) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const bookingId = e.dataTransfer.getData('text/plain')
    if (bookingId) {
      onUpdateBookingStatus(bookingId, id)
    }
  }

  return (
    <div className="kanban-column" data-status={id}>
      <div className="kanban-column-header">
        <div className="column-title-wrapper">
          <span className={`status-indicator ${indicatorClass}`}></span>
          <h3>{title}</h3>
        </div>
        <span className="badge">{bookings.length}</span>
      </div>

      <div 
        className={`kanban-cards ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        data-status={id}
      >
        {bookings.length === 0 ? (
          <div className="empty-column-message">
            <span className="material-symbols-outlined">folder_open</span>
            <span>Sin reservas en esta etapa</span>
          </div>
        ) : (
          bookings.map(booking => (
            <KanbanCard 
              key={booking.id}
              booking={booking}
              onDelete={onDeleteBooking}
              onConfirmPayment={id === 'pending' ? onConfirmPayment : undefined}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default KanbanColumn
