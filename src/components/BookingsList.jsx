import React, { useMemo, useState } from 'react'
import { STATUS_LABELS, bookingBillableAmount, isHistorialStatus } from '../utils/bookingRules.js'

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'confirmed', label: 'Confirmadas' },
  { value: 'live', label: 'En juego' },
  { value: 'completed', label: 'Finalizadas' },
  { value: 'cancelled', label: 'Canceladas' },
]

function BookingsList({
  bookings,
  onCancelBooking,
  onDeleteBooking,
  onUpdateBookingStatus,
  onRequestPayment,
}) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('date-desc')

  const filtered = useMemo(() => {
    let list = [...bookings]
    if (statusFilter !== 'all') {
      list = list.filter((b) => b.status === statusFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (b) =>
          b.courtName?.toLowerCase().includes(q) ||
          b.type?.toLowerCase().includes(q) ||
          b.time?.toLowerCase().includes(q)
      )
    }
    list.sort((a, b) => {
      const da = `${a.date}T${a.time?.split(' - ')[0] || '00:00'}`
      const db = `${b.date}T${b.time?.split(' - ')[0] || '00:00'}`
      return sortBy === 'date-desc' ? db.localeCompare(da) : da.localeCompare(db)
    })
    return list
  }, [bookings, statusFilter, search, sortBy])

  const stats = useMemo(() => {
    const counts = { pending: 0, confirmed: 0, live: 0, completed: 0, cancelled: 0 }
    bookings.forEach((b) => {
      if (counts[b.status] !== undefined) counts[b.status]++
    })
    return counts
  }, [bookings])

  const formatDate = (dateStr) => {
    try {
      return new Date(`${dateStr}T12:00:00`).toLocaleDateString('es-AR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      })
    } catch {
      return dateStr
    }
  }

  const handlePay = (booking) => {
    if (onRequestPayment) onRequestPayment(booking)
    else onUpdateBookingStatus(booking.id, 'confirmed')
  }

  return (
    <div className="bookings-list-panel">
      <div className="bookings-list-stats">
        {STATUS_OPTIONS.filter((o) => o.value !== 'all').map((o) => (
          <button
            key={o.value}
            type="button"
            className={`bookings-stat-chip ${statusFilter === o.value ? 'active' : ''}`}
            onClick={() => setStatusFilter(statusFilter === o.value ? 'all' : o.value)}
          >
            <span>{o.label}</span>
            <strong>{stats[o.value] || 0}</strong>
          </button>
        ))}
      </div>

      <div className="bookings-list-toolbar">
        <div className="bookings-search-wrap">
          <span className="material-symbols-outlined">search</span>
          <input
            type="search"
            placeholder="Buscar por cancha, tipo o horario..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bookings-sort-select">
          <option value="date-desc">Más recientes primero</option>
          <option value="date-asc">Más antiguas primero</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bookings-sort-select">
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bookings-list-empty">
          <span className="material-symbols-outlined">event_busy</span>
          <p>No hay reservas con esos filtros.</p>
        </div>
      ) : (
        <div className="bookings-list-items">
          {filtered.map((b) => (
            <article key={b.id} className={`booking-list-card status-${b.status}`}>
              <div className="booking-list-main">
                <h4>{b.courtName}</h4>
                <p className="booking-list-meta">
                  <span className="material-symbols-outlined">calendar_today</span>
                  {formatDate(b.date)} · {b.time}
                  {b.durationHours > 1 && (
                    <span className="booking-duration-badge">{b.durationHours} h</span>
                  )}
                </p>
                <div className="booking-list-pills">
                  <span className="card-pill">{b.type}</span>
                  <span className={`booking-status-pill status-${b.status}`}>
                    {STATUS_LABELS[b.status] || b.status}
                  </span>
                </div>
              </div>
              <div className="booking-list-side">
                {b.status === 'cancelled' ? (
                  <span className="booking-list-price booking-list-price-cancelled">Sin cargo</span>
                ) : (
                  <span className="booking-list-price">
                    ${bookingBillableAmount(b).toFixed(2)}
                  </span>
                )}
                <div className="booking-list-actions">
                  {b.status === 'pending' && (
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => handlePay(b)}>
                      <span className="material-symbols-outlined">payments</span>
                      Pagar y confirmar
                    </button>
                  )}
                  {b.status === 'confirmed' && (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => onUpdateBookingStatus(b.id, 'live')}
                    >
                      Iniciar partido
                    </button>
                  )}
                  {b.status === 'live' && (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => onUpdateBookingStatus(b.id, 'completed')}
                    >
                      Finalizar
                    </button>
                  )}
                  {(onCancelBooking || onDeleteBooking) && !isHistorialStatus(b.status) && (
                    <button
                      type="button"
                      className="btn btn-danger-outline btn-sm"
                      onClick={() => {
                        if (onCancelBooking) {
                          if (window.confirm('¿Cancelar esta reserva?')) onCancelBooking(b.id)
                        } else if (
                          onDeleteBooking &&
                          window.confirm('¿Eliminar esta reserva del sistema?')
                        ) {
                          onDeleteBooking(b.id)
                        }
                      }}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export default BookingsList
