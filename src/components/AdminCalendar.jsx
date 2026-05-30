import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { TIME_SLOTS } from '../App.jsx'
import { DEFAULT_COURTS } from '../data/catalogDefaults.js'
import { api } from '../services/api.js'
import { loadClubConfig, saveClubConfig } from '../utils/clubConfig.js'
import { getCheckIn, markCheckIn, clearCheckIn, isCheckedIn } from '../utils/checkInStorage.js'
import {
  loadMaintenanceSlots,
  saveMaintenanceSlots,
  addMaintenanceSlot,
  removeMaintenanceSlot,
  findMaintenanceSlot,
} from '../utils/maintenanceStorage.js'

function msToTimeRange(horaInicio, horaFin) {
  const start = new Date(Number(horaInicio))
  const end = new Date(Number(horaFin))
  const fmt = (d) =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return `${fmt(start)} - ${fmt(end)}`
}

function slotStart(slot) {
  return (slot || '').split(' - ')[0]?.trim() || ''
}

function bookingCoversSlot(booking, slot) {
  if (!booking?.time || !slot) return false
  const sStart = slotStart(slot)
  const [bStart, bEnd] = booking.time.split(' - ').map((s) => s.trim())
  if (!bStart || !bEnd) return booking.time === slot
  return sStart >= bStart && sStart < bEnd
}

function AdminCalendar({
  bookings,
  courts = DEFAULT_COURTS,
  currentUser,
  onDeleteBooking,
  onCancelBooking,
  onUpdateBooking,
  onBackToPortal,
  onRefreshBookings,
  showToast,
}) {
  const getTodayDateString = () => new Date().toISOString().split('T')[0]

  const [selectedDate, setSelectedDate] = useState(getTodayDateString())
  const [selectedCell, setSelectedCell] = useState(null)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [maintenanceSlots, setMaintenanceSlots] = useState(loadMaintenanceSlots)
  const [globalAvailability, setGlobalAvailability] = useState([])
  const [loadingGlobal, setLoadingGlobal] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [clubConfig, setClubConfig] = useState(loadClubConfig())
  const [editForm, setEditForm] = useState(null)
  const [checkInTick, setCheckInTick] = useState(0)

  useEffect(() => {
    saveMaintenanceSlots(maintenanceSlots)
  }, [maintenanceSlots])

  const loadGlobal = useCallback(async () => {
    setLoadingGlobal(true)
    try {
      const data = await api.getGlobalAvailability(selectedDate)
      setGlobalAvailability(data)
    } catch {
      setGlobalAvailability([])
    } finally {
      setLoadingGlobal(false)
    }
  }, [selectedDate])

  useEffect(() => {
    loadGlobal()
  }, [loadGlobal])

  const bookingsForSelectedDate = useMemo(
    () => bookings.filter((b) => b.date === selectedDate && b.status !== 'cancelled'),
    [bookings, selectedDate],
  )

  const maintenanceForDate = maintenanceSlots.filter((m) => m.date === selectedDate)

  const globalBookingStubs = useMemo(() => {
    const stubs = []
    for (const row of globalAvailability) {
      for (const occ of row.horarios_ocupados || []) {
        const time = msToTimeRange(occ.hora_inicio, occ.hora_fin)
        const existing = bookings.find((b) => String(b.id) === String(occ.num_reserva))
        if (existing) continue
        stubs.push({
          id: String(occ.num_reserva),
          courtId: String(row.cancha_id),
          courtName: `Cancha #${row.numero}`,
          date: selectedDate,
          time,
          status: 'confirmed',
          userEmail: 'cargando…',
          totalPrice: 0,
          _fromGlobalApi: true,
        })
      }
    }
    return stubs
  }, [globalAvailability, bookings, selectedDate])

  const allDayBookings = useMemo(() => {
    const byId = new Map()
    for (const b of [...bookingsForSelectedDate, ...globalBookingStubs]) {
      byId.set(b.id, b)
    }
    return [...byId.values()]
  }, [bookingsForSelectedDate, globalBookingStubs])

  const getBookingForCell = (courtId, slot) => {
    const maint = findMaintenanceSlot(maintenanceForDate, courtId, selectedDate, slot)
    if (maint) return maint
    return allDayBookings.find(
      (b) => String(b.courtId) === String(courtId) && bookingCoversSlot(b, slot),
    )
  }

  const handleCellClick = (court, slot, booking) => {
    if (booking) {
      setSelectedBooking(booking)
      setEditForm(null)
    } else {
      setSelectedCell({ court, slot })
    }
  }

  const handleLockMaintenance = () => {
    if (!selectedCell) return
    setMaintenanceSlots((prev) =>
      addMaintenanceSlot(prev, selectedCell.court.id, selectedDate, selectedCell.slot, selectedCell.court.name),
    )
    setSelectedCell(null)
    showToast('Franja bloqueada en mantenimiento (local).', 'success')
  }

  const handleCancelBooking = async () => {
    if (!selectedBooking) return
    setIsSubmitting(true)
    try {
      if (selectedBooking.status === 'maintenance') {
        setMaintenanceSlots((prev) =>
          removeMaintenanceSlot(prev, selectedBooking.courtId, selectedDate, selectedBooking.time),
        )
        showToast('Cancha liberada de mantenimiento.', 'info')
      } else if (onCancelBooking) {
        await onCancelBooking(selectedBooking.id, selectedBooking)
        await loadGlobal()
        if (onRefreshBookings) await onRefreshBookings()
      } else {
        await onDeleteBooking(selectedBooking.id)
      }
      setSelectedBooking(null)
    } catch (err) {
      showToast(err.message || 'Error al cancelar la reserva.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditBooking = () => {
    if (!selectedBooking || selectedBooking.status === 'maintenance') return
    const startSlot = TIME_SLOTS.find((s) => bookingCoversSlot(selectedBooking, s)) || TIME_SLOTS[0]
    setEditForm({
      courtId: selectedBooking.courtId,
      date: selectedBooking.date,
      time: startSlot,
      durationHours: selectedBooking.durationHours || 1,
    })
  }

  const handleSaveEdit = async () => {
    if (!selectedBooking || !editForm) return
    setIsSubmitting(true)
    try {
      const court = courts.find((c) => c.id === String(editForm.courtId))
      const updated = await onUpdateBooking(selectedBooking.id, {
        courtId: editForm.courtId,
        date: editForm.date,
        time: editForm.time,
        durationHours: Number(editForm.durationHours) || 1,
        courtName: court?.name || selectedBooking.courtName,
        totalPrice: court
          ? court.pricePerHour * (Number(editForm.durationHours) || 1)
          : selectedBooking.totalPrice,
      }, selectedBooking)
      setSelectedBooking(updated)
      setEditForm(null)
      await loadGlobal()
      showToast('Reserva actualizada.', 'success')
    } catch (err) {
      showToast(err.message || 'No se pudo editar la reserva', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCheckIn = () => {
    if (!selectedBooking?.id) return
    if (isCheckedIn(selectedBooking.id)) {
      clearCheckIn(selectedBooking.id)
      showToast('Check-in anulado.', 'info')
    } else {
      markCheckIn(selectedBooking.id, currentUser?.id, currentUser?.name)
      showToast('Check-in registrado.', 'success')
    }
    setCheckInTick((t) => t + 1)
  }

  const handleSaveConfig = () => {
    saveClubConfig(clubConfig)
    showToast('Reglas de reserva/cancelación guardadas.', 'success')
    setShowConfig(false)
  }

  const checkedIn = selectedBooking ? isCheckedIn(selectedBooking.id) : false
  void checkInTick

  return (
    <div className="admin-page admin-calendar-page">
      <div className="admin-page-top">
        <button type="button" className="btn btn-outline" onClick={onBackToPortal}>
          <span className="material-symbols-outlined">arrow_back</span>
          Volver al Portal
        </button>
        <button type="button" className="btn btn-outline" onClick={() => setShowConfig((v) => !v)}>
          <span className="material-symbols-outlined">tune</span>
          Reglas de reserva
        </button>
      </div>

      {showConfig && (
        <div className="admin-card admin-config-panel">
          <h3>Configuración del club</h3>
          <div className="admin-form-grid">
            <div className="form-group">
              <label>Anticipación máxima para reservar (días)</label>
              <input
                type="number"
                min="1"
                value={clubConfig.maxAdvanceDays}
                onChange={(e) => setClubConfig((c) => ({ ...c, maxAdvanceDays: Number(e.target.value) }))}
              />
            </div>
            <div className="form-group">
              <label>Antelación mínima para cancelar sin penalización (horas)</label>
              <input
                type="number"
                min="0"
                value={clubConfig.minCancelHours}
                onChange={(e) => setClubConfig((c) => ({ ...c, minCancelHours: Number(e.target.value) }))}
              />
            </div>
          </div>
          <button type="button" className="btn btn-primary" onClick={handleSaveConfig}>Guardar reglas</button>
        </div>
      )}

      <div className="admin-card">
        <div className="admin-calendar-header">
          <div>
            <h2>Control de Reservas</h2>
            <p className="admin-card-desc">
              Calendario global del servidor · editar reservas · check-in presencial
              {loadingGlobal ? ' · sincronizando…' : ''}
            </p>
          </div>
          <div className="admin-date-nav">
            <button type="button" onClick={() => {
              const d = new Date(`${selectedDate}T00:00:00`)
              d.setDate(d.getDate() - 1)
              setSelectedDate(d.toISOString().split('T')[0])
            }}>
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            <button type="button" onClick={() => {
              const d = new Date(`${selectedDate}T00:00:00`)
              d.setDate(d.getDate() + 1)
              setSelectedDate(d.toISOString().split('T')[0])
            }}>
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
            <button type="button" className="btn-today" onClick={() => setSelectedDate(getTodayDateString())}>Hoy</button>
          </div>
        </div>

        <div className="admin-calendar-legend">
          <span><i className="leg libre" /> Disponible</span>
          <span><i className="leg maint" /> Mantenimiento</span>
          <span><i className="leg booked" /> Reservado</span>
          <span><i className="leg checkin" /> Con check-in</span>
        </div>

        <div className="admin-calendar-scroll">
          <table className="admin-calendar-table">
            <thead>
              <tr>
                <th>Horarios</th>
                {courts.map((court) => (
                  <th key={court.id}>{court.name}<br /><small>{court.type}</small></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map((slot) => (
                <tr key={slot}>
                  <td className="slot-label">{slot}</td>
                  {courts.map((court) => {
                    const booking = getBookingForCell(court.id, slot)
                    const isMaint = booking?.status === 'maintenance'
                    const isBooked = !!booking && !isMaint
                    const checked = isBooked && isCheckedIn(booking.id)
                    if (isBooked && slotStart(booking.time) !== slotStart(slot)) {
                      return <td key={court.id} className="slot-continued" />
                    }
                    return (
                      <td key={court.id}>
                        {isMaint ? (
                          <button type="button" className="cal-cell cal-maint" onClick={() => handleCellClick(court, slot, booking)}>
                            Mantenimiento
                          </button>
                        ) : isBooked ? (
                          <button
                            type="button"
                            className={`cal-cell cal-booked ${checked ? 'cal-checkin' : ''}`}
                            onClick={() => handleCellClick(court, slot, booking)}
                          >
                            <small>{booking.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}</small>
                            <strong>{booking.userEmail?.split('@')[0] || `#${booking.id}`}</strong>
                            {checked && <span className="checkin-tag">✓ Ingreso</span>}
                          </button>
                        ) : (
                          <button type="button" className="cal-cell cal-free" onClick={() => handleCellClick(court, slot, null)}>
                            +
                          </button>
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

      {selectedCell && (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && setSelectedCell(null)}>
          <div className="modal-drawer admin-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Administrar turno</h3>
              <button type="button" className="icon-btn" onClick={() => setSelectedCell(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="admin-muted">
              {selectedCell.court.name} · {selectedDate} · {selectedCell.slot}
            </p>
            <button type="button" className="btn btn-outline" style={{ width: '100%' }} onClick={handleLockMaintenance}>
              Poner en mantenimiento
            </button>
          </div>
        </div>
      )}

      {selectedBooking && (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && setSelectedBooking(null)}>
          <div className="modal-drawer admin-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedBooking.status === 'maintenance' ? 'Bloqueo' : `Reserva #${selectedBooking.id}`}</h3>
              <button type="button" className="icon-btn" onClick={() => setSelectedBooking(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {!editForm ? (
              <>
                <div className="admin-detail-lines">
                  <div>Cancha: <strong>{selectedBooking.courtName}</strong></div>
                  <div>Fecha: <strong>{selectedBooking.date}</strong></div>
                  <div>Horario: <strong>{selectedBooking.time}</strong></div>
                  {selectedBooking.status !== 'maintenance' && (
                    <>
                      <div>Cliente: <strong>{selectedBooking.userEmail}</strong></div>
                      <div>Precio: <strong>${selectedBooking.totalPrice}</strong></div>
                      <div>Estado: <strong>{selectedBooking.status}</strong></div>
                      {checkedIn && (
                        <div className="checkin-banner">
                          Check-in: {new Date(getCheckIn(selectedBooking.id).at).toLocaleString('es-AR')}
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="admin-form-footer">
                  {selectedBooking.status !== 'maintenance' && (
                    <>
                      <button type="button" className="btn btn-outline" onClick={openEditBooking}>Editar reserva</button>
                      <button type="button" className="btn btn-outline" onClick={handleCheckIn}>
                        {checkedIn ? 'Anular check-in' : 'Registrar check-in'}
                      </button>
                    </>
                  )}
                  <button type="button" className="btn btn-primary btn-danger" disabled={isSubmitting} onClick={handleCancelBooking}>
                    {selectedBooking.status === 'maintenance' ? 'Liberar' : 'Cancelar reserva'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="admin-form-grid">
                  <div className="form-group">
                    <label>Cancha</label>
                    <select value={editForm.courtId} onChange={(e) => setEditForm((f) => ({ ...f, courtId: e.target.value }))}>
                      {courts.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Fecha</label>
                    <input type="date" value={editForm.date} onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Horario inicio</label>
                    <select value={editForm.time} onChange={(e) => setEditForm((f) => ({ ...f, time: e.target.value }))}>
                      {TIME_SLOTS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Duración (h)</label>
                    <input
                      type="number"
                      min="1"
                      max="3"
                      value={editForm.durationHours}
                      onChange={(e) => setEditForm((f) => ({ ...f, durationHours: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="admin-form-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setEditForm(null)}>Volver</button>
                  <button type="button" className="btn btn-primary" disabled={isSubmitting} onClick={handleSaveEdit}>
                    {isSubmitting ? 'Guardando…' : 'Guardar cambios'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminCalendar
