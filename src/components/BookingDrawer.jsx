import React, { useState, useEffect, useMemo } from 'react'
import { TIME_SLOTS } from '../App.jsx'
import { DEFAULT_COURTS } from '../data/catalogDefaults.js'
import { api } from '../services/api.js'
import {
  getMaxDurationHours,
  getMaxDurationLabel,
  getConsecutiveSlots,
  formatTimeRange,
} from '../utils/bookingRules.js'

const COURT_TYPE_FILTERS = [
  { value: '', label: 'Todos los deportes' },
  { value: 'FUTBOL_5', label: 'Fútbol 5' },
  { value: 'FUTBOL_7', label: 'Fútbol 7' },
  { value: 'FUTBOL_11', label: 'Fútbol 11' },
  { value: 'PADDLE', label: 'Paddle' },
  { value: 'TENIS', label: 'Tenis' },
]

function getSlotsOccupiedByBooking(booking, timeSlots) {
  const hours = booking.durationHours || 1
  const startPart = booking.time?.split(' - ')[0]
  const startSlot = timeSlots.find((s) => s.startsWith(startPart))
  if (!startSlot) return [booking.time]
  return getConsecutiveSlots(startSlot, hours, timeSlots) || [booking.time]
}

function BookingDrawer({ isOpen, onClose, currentUser, courts = DEFAULT_COURTS, allBookings, onAddBooking }) {
  const getTodayDateString = () => new Date().toISOString().split('T')[0]

  const [selectedCourtId, setSelectedCourtId] = useState(courts[0]?.id)
  const [selectedDate, setSelectedDate] = useState(getTodayDateString())
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null)
  const [durationHours, setDurationHours] = useState(1)
  const [isClosing, setIsClosing] = useState(false)
  const [occupiedSlots, setOccupiedSlots] = useState([])
  const [extras, setExtras] = useState({ referee: false, ball: false, lights: false, bibs: false })
  const [tipoCanchaFilter, setTipoCanchaFilter] = useState('')
  const [filteredCourts, setFilteredCourts] = useState(courts)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const list = await api.getCourts(
          tipoCanchaFilter ? { tipo_cancha: tipoCanchaFilter } : {},
        )
        if (!cancelled) {
          setFilteredCourts(list.length ? list : courts)
          if (list.length && !list.find((c) => c.id === selectedCourtId)) {
            setSelectedCourtId(list[0].id)
          }
        }
      } catch {
        if (!cancelled) setFilteredCourts(courts)
      }
    }
    if (isOpen) load()
    return () => {
      cancelled = true
    }
  }, [isOpen, tipoCanchaFilter, courts])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [])

  useEffect(() => {
    const fetchOccupied = async () => {
      try {
        const data = await api.getOccupiedBookings(selectedDate)
        setOccupiedSlots(data)
      } catch (err) {
        console.error('Error fetching occupied slots:', err)
      }
    }
    if (isOpen) fetchOccupied()
  }, [isOpen, selectedDate])

  useEffect(() => {
    setSelectedTimeSlot(null)
    setDurationHours(1)
  }, [selectedCourtId, selectedDate])

  useEffect(() => {
    setDurationHours(1)
  }, [selectedTimeSlot])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => onClose(), 350)
  }

  const selectedCourt = filteredCourts.find((c) => c.id === selectedCourtId)
  const maxDurationHours = getMaxDurationHours(selectedCourt)

  const bookedSlots = useMemo(() => {
    const statusMap = {}
    const merge = (list) => {
      list
        .filter((b) => b.courtId === selectedCourtId && b.date === selectedDate && b.status !== 'completed')
        .forEach((b) => {
          getSlotsOccupiedByBooking(b, TIME_SLOTS).forEach((slot) => {
            statusMap[slot] = b.status
          })
        })
    }
    merge(allBookings)
    merge(occupiedSlots)
    return statusMap
  }, [allBookings, occupiedSlots, selectedCourtId, selectedDate])

  const isSlotInThePast = (slot) => {
    if (selectedDate !== getTodayDateString()) return false
    const currentHour = new Date().getHours()
    return parseInt(slot.split(':')[0], 10) <= currentHour
  }

  const isSlotFree = (slot) => !bookedSlots[slot] && !isSlotInThePast(slot)

  const canUseDuration = (hours) => {
    if (!selectedTimeSlot) return false
    const slots = getConsecutiveSlots(selectedTimeSlot, hours, TIME_SLOTS)
    if (!slots || slots.length !== hours) return false
    return slots.every(isSlotFree)
  }

  const selectedSlots = useMemo(() => {
    if (!selectedTimeSlot) return []
    return getConsecutiveSlots(selectedTimeSlot, durationHours, TIME_SLOTS) || []
  }, [selectedTimeSlot, durationHours])

  const calculateTotalPrice = () => {
    if (!selectedCourt) return 0
    let total = selectedCourt.pricePerHour * durationHours
    if (extras.referee) total += 15
    if (extras.ball) total += 5
    if (extras.lights) total += 8
    if (extras.bibs) total += 5
    return total
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!selectedCourt || !selectedDate || !selectedTimeSlot) {
      alert('Por favor, selecciona un horario disponible')
      return
    }
    if (!canUseDuration(durationHours)) {
      alert('El rango horario seleccionado no está disponible completo')
      return
    }

    const selectedExtrasList = []
    if (extras.referee) selectedExtrasList.push('Árbitro Profesional')
    if (extras.ball) selectedExtrasList.push('Balón Profesional')
    if (extras.lights) selectedExtrasList.push('Reflectores LED')
    if (extras.bibs) selectedExtrasList.push('Chalecos de Equipo')

    onAddBooking({
      id: `booking-${Date.now()}`,
      userEmail: currentUser.email,
      courtId: selectedCourt.id,
      courtName: selectedCourt.name,
      type: selectedCourt.type,
      date: selectedDate,
      time: formatTimeRange(selectedSlots),
      durationHours,
      extras: selectedExtrasList,
      totalPrice: calculateTotalPrice(),
      status: 'pending',
    })
    handleClose()
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target.className === 'modal-overlay') handleClose()
      }}
    >
      <div
        className={`modal-drawer ${isClosing ? 'closing' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-drawer-title"
      >
        <div className="modal-header">
          <h3 id="booking-drawer-title">Nueva Reserva de Cancha</h3>
          <button type="button" className="icon-btn" onClick={handleClose} aria-label="Cerrar modal">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          <div className="booking-step">
            <span className="step-num">Paso 1 de 3</span>
            <h4>Selecciona la Cancha</h4>
            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label htmlFor="court-type-filter">Filtrar por deporte</label>
              <select
                id="court-type-filter"
                value={tipoCanchaFilter}
                onChange={(e) => setTipoCanchaFilter(e.target.value)}
                className="bookings-sort-select"
                style={{ width: '100%' }}
              >
                {COURT_TYPE_FILTERS.map((o) => (
                  <option key={o.value || 'all'} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="court-selector-grid">
              {filteredCourts.filter((c) => c.disponible !== false).length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', gridColumn: '1 / -1' }}>
                  No hay canchas para ese filtro.
                </p>
              ) : null}
              {filteredCourts.filter((c) => c.disponible !== false).map((court) => (
                <div
                  className={`selectable-court-card ${selectedCourtId === court.id ? 'selected' : ''}`}
                  key={court.id}
                  onClick={() => setSelectedCourtId(court.id)}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedCourtId(court.id)}
                  role="button"
                  tabIndex={0}
                >
                  <span className="court-checkbox" />
                  <div className="mini-field-visual" style={{ marginLeft: '0.2rem' }}>
                    <span className="material-symbols-outlined">{court.icon}</span>
                  </div>
                  <div className="mini-field-info">
                    <div className="mini-field-name">{court.name}</div>
                    <div className="mini-field-details">
                      {court.type} · Máx. {getMaxDurationHours(court)} h
                    </div>
                  </div>
                  <div className="mini-field-price">${court.pricePerHour}/h</div>
                </div>
              ))}
            </div>
          </div>

          <div className="booking-step">
            <span className="step-num">Paso 2 de 3</span>
            <h4>Fecha, horario y duración</h4>
            {selectedCourt && (
              <p className="duration-limit-hint">
                <span className="material-symbols-outlined">info</span>
                {selectedCourt.type}: duración máxima{' '}
                <strong>{getMaxDurationLabel(selectedCourt)}</strong>
              </p>
            )}
            <div className="date-time-picker">
              <div className="form-group">
                <label htmlFor="booking-date">Fecha del Encuentro</label>
                <input
                  type="date"
                  id="booking-date"
                  required
                  value={selectedDate}
                  min={getTodayDateString()}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Horario de inicio</label>
                <div className="time-slots-grid">
                  {TIME_SLOTS.map((slot) => {
                    const status = bookedSlots[slot]
                    const isUnavailable = !!status || isSlotInThePast(slot)
                    const isSelected = selectedTimeSlot === slot
                    const isMaintenance = status === 'maintenance'

                    return (
                      <div
                        className={`time-slot ${isUnavailable ? 'unavailable' : ''} ${isSelected && !isUnavailable ? 'selected' : ''} ${isMaintenance ? 'maintenance-block' : ''}`}
                        key={slot}
                        onClick={() => {
                          if (!isUnavailable) setSelectedTimeSlot(slot)
                        }}
                        role="button"
                        tabIndex={isUnavailable ? -1 : 0}
                      >
                        {isMaintenance ? 'Mantenimiento' : slot}
                      </div>
                    )
                  })}
                </div>
              </div>
              {selectedTimeSlot && (
                <div className="form-group duration-picker">
                  <label>Duración de la reserva</label>
                  <div className="duration-options">
                    {Array.from({ length: maxDurationHours }, (_, i) => i + 1).map((h) => {
                      const ok = canUseDuration(h)
                      return (
                        <button
                          key={h}
                          type="button"
                          className={`duration-option ${durationHours === h ? 'selected' : ''} ${!ok ? 'disabled' : ''}`}
                          disabled={!ok}
                          onClick={() => ok && setDurationHours(h)}
                        >
                          {h} h
                        </button>
                      )
                    })}
                  </div>
                  {selectedSlots.length > 0 && (
                    <span className="info-help">
                      Horario total: <strong>{formatTimeRange(selectedSlots)}</strong>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="booking-step">
            <span className="step-num">Paso 3 de 3</span>
            <h4>Características y Extras</h4>
            {selectedCourt && (
              <div className="court-badge-details">
                <span className="card-pill card-pill-accent">{selectedCourt.type}</span>
                <span className="card-pill card-pill-accent">{selectedCourt.turf}</span>
                <span className="card-pill card-pill-accent">
                  {selectedCourt.roofed ? 'Techada' : 'Aire Libre'}
                </span>
              </div>
            )}
            <div className="extras-selection">
              <label>Servicios Adicionales</label>
              <div className="extras-grid">
                {[
                  { key: 'referee', title: 'Árbitro Oficial', desc: '+$15' },
                  { key: 'ball', title: 'Balón Profesional', desc: '+$5' },
                  { key: 'lights', title: 'Reflectores LED', desc: '+$8' },
                  { key: 'bibs', title: 'Chalecos', desc: '+$5' },
                ].map((ex) => (
                  <label className="extra-item" key={ex.key}>
                    <input
                      type="checkbox"
                      checked={extras[ex.key]}
                      onChange={(e) => setExtras((prev) => ({ ...prev, [ex.key]: e.target.checked }))}
                    />
                    <span className="extra-custom-checkbox" />
                    <div className="extra-info">
                      <span className="extra-title">{ex.title}</span>
                      <span className="extra-desc">{ex.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="booking-footer">
            <div className="price-summary">
              <span className="label">
                Total ({durationHours} h × ${selectedCourt?.pricePerHour || 0})
              </span>
              <span className="total-price">${calculateTotalPrice().toFixed(2)}</span>
            </div>
            <button type="submit" className="btn btn-primary" id="confirm-booking-btn">
              <span>Confirmar Reserva</span>
              <span className="material-symbols-outlined">check_circle</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BookingDrawer
