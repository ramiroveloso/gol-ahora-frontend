import React from 'react'
import KanbanColumn from './KanbanColumn.jsx'
import { getKanbanColumnId } from '../utils/bookingRules.js'

const COLUMNS = [
  { id: 'pending', title: 'Pendientes / Borrador', indicatorClass: 'indicator-pending' },
  { id: 'confirmed', title: 'Confirmadas', indicatorClass: 'indicator-confirmed' },
  { id: 'live', title: 'En Juego / Activas', indicatorClass: 'indicator-live' },
  { id: 'completed', title: 'Historial', indicatorClass: 'indicator-completed' }
]

function KanbanBoard({
  bookings,
  onCancelBooking,
  onDeleteBooking,
  onUpdateBookingStatus,
  onRequestPayment,
  now = new Date(),
}) {
  const handleConfirmPayment = (booking) => {
    if (onRequestPayment) onRequestPayment(booking)
    else onUpdateBookingStatus(booking.id, 'confirmed')
  }

  return (
    <div className="kanban-container">
      <div className="kanban-board">
        {COLUMNS.map(col => {
          const columnBookings = bookings.filter((b) => getKanbanColumnId(b, now) === col.id)
          return (
            <KanbanColumn 
              key={col.id}
              id={col.id}
              title={col.title}
              indicatorClass={col.indicatorClass}
              bookings={columnBookings}
              onCancelBooking={onCancelBooking}
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
