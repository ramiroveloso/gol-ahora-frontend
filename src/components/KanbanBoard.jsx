import React from 'react'
import KanbanColumn from './KanbanColumn.jsx'

const COLUMNS = [
  { id: 'pending', title: 'Pendientes / Borrador', indicatorClass: 'indicator-pending' },
  { id: 'confirmed', title: 'Confirmadas', indicatorClass: 'indicator-confirmed' },
  { id: 'live', title: 'En Juego / Activas', indicatorClass: 'indicator-live' },
  { id: 'completed', title: 'Historial', indicatorClass: 'indicator-completed' }
]

function KanbanBoard({ bookings, onDeleteBooking, onUpdateBookingStatus, onRequestPayment }) {
  const handleConfirmPayment = (booking) => {
    if (onRequestPayment) onRequestPayment(booking)
    else onUpdateBookingStatus(booking.id, 'confirmed')
  }

  return (
    <div className="kanban-container">
      <div className="kanban-board">
        {COLUMNS.map(col => {
          const columnBookings = bookings.filter(b => b.status === col.id)
          return (
            <KanbanColumn 
              key={col.id}
              id={col.id}
              title={col.title}
              indicatorClass={col.indicatorClass}
              bookings={columnBookings}
              onDeleteBooking={onDeleteBooking}
              onUpdateBookingStatus={onUpdateBookingStatus}
              onConfirmPayment={handleConfirmPayment}
            />
          )
        })}
      </div>
    </div>
  )
}

export default KanbanBoard
