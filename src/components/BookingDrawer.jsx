import React, { useState, useEffect } from 'react'
import { COURTS, TIME_SLOTS } from '../App.jsx'
import { api } from '../services/api.js'

function BookingDrawer({ isOpen, onClose, currentUser, allBookings, onAddBooking }) {
  const getTodayDateString = () => {
    const d = new Date()
    return d.toISOString().split('T')[0]
  }

  // States
  const [selectedCourtId, setSelectedCourtId] = useState(COURTS[0].id)
  const [selectedDate, setSelectedDate] = useState(getTodayDateString())
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null)
  const [isClosing, setIsClosing] = useState(false)
  const [occupiedSlots, setOccupiedSlots] = useState([])
  const [loadingOccupied, setLoadingOccupied] = useState(false)

  // Extras checkboxes states
  const [extras, setExtras] = useState({
    referee: false,
    ball: false,
    lights: false,
    bibs: false
  })

  // Prevent background scrolling while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [])

  // Load occupied slots from server for safety check
  useEffect(() => {
    const fetchOccupied = async () => {
      setLoadingOccupied(true)
      try {
        const data = await api.getOccupiedBookings()
        setOccupiedSlots(data)
      } catch (err) {
        console.error('Error fetching occupied slots:', err)
      } finally {
        setLoadingOccupied(false)
      }
    }
    if (isOpen) {
      fetchOccupied()
    }
  }, [isOpen, selectedDate])

  // Reset selected slot when court or date changes
  useEffect(() => {
    setSelectedTimeSlot(null)
  }, [selectedCourtId, selectedDate])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
    }, 350)
  }

  // Find court details
  const selectedCourt = COURTS.find(c => c.id === selectedCourtId)

  // Calculate dynamic price
  const calculateTotalPrice = () => {
    if (!selectedCourt) return 0
    let total = selectedCourt.pricePerHour
    if (extras.referee) total += 15
    if (extras.ball) total += 5
    if (extras.lights) total += 8
    if (extras.bibs) total += 5
    return total
  }

  // Check collision for time slots (returns status map)
  const getBookedSlotsForSelectedDay = () => {
    const local = allBookings
      .filter(b => b.courtId === selectedCourtId && b.date === selectedDate && b.status !== 'completed')
      .map(b => ({ time: b.time, status: b.status }))

    const remote = occupiedSlots
      .filter(b => b.courtId === selectedCourtId && b.date === selectedDate)
      .map(b => ({ time: b.time, status: b.status }))

    const combined = [...local, ...remote]
    const statusMap = {}
    combined.forEach(item => {
      statusMap[item.time] = item.status
    })
    return statusMap
  }

  const isSlotInThePast = (slot) => {
    const todayStr = getTodayDateString()
    if (selectedDate !== todayStr) return false
    
    const currentHour = new Date().getHours()
    const slotStartHour = parseInt(slot.split(':')[0])
    return slotStartHour <= currentHour
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!selectedCourt) return
    if (!selectedDate) return
    if (!selectedTimeSlot) {
      alert('Por favor, selecciona un horario disponible')
      return
    }

    // Prepare Extras list
    const selectedExtrasList = []
    if (extras.referee) selectedExtrasList.push('Árbitro Profesional')
    if (extras.ball) selectedExtrasList.push('Balón Profesional')
    if (extras.lights) selectedExtrasList.push('Reflectores LED')
    if (extras.bibs) selectedExtrasList.push('Chalecos de Equipo')

    const newBooking = {
      id: 'booking-' + Date.now(),
      userEmail: currentUser.email,
      courtId: selectedCourt.id,
      courtName: selectedCourt.name,
      type: selectedCourt.type,
      date: selectedDate,
      time: selectedTimeSlot,
      extras: selectedExtrasList,
      totalPrice: calculateTotalPrice(),
      status: 'pending' // starts as pending
    }

    onAddBooking(newBooking)
    handleClose()
  }

  const bookedSlots = getBookedSlotsForSelectedDay()

  return (
    <div 
      className="modal-overlay" 
      onClick={(e) => {
        if (e.target.className === 'modal-overlay') handleClose()
      }}
    >
      <div className={`modal-drawer ${isClosing ? 'closing' : ''}`}>
        <div className="modal-header">
          <h3>Nueva Reserva de Cancha</h3>
          <button className="icon-btn" onClick={handleClose} aria-label="Cerrar modal">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <form className="modal-body" onSubmit={handleSubmit}>
          {/* STEP 1: Select Field */}
          <div className="booking-step">
            <span className="step-num">Paso 1 de 3</span>
            <h4>Selecciona la Cancha</h4>
            <div className="court-selector-grid">
              {COURTS.map(court => (
                <div 
                  className={`selectable-court-card ${selectedCourtId === court.id ? 'selected' : ''}`}
                  key={court.id}
                  onClick={() => setSelectedCourtId(court.id)}
                >
                  <span className="court-checkbox"></span>
                  <div className="mini-field-visual" style={{ marginLeft: '0.2rem' }}>
                    <span className="material-symbols-outlined">{court.icon}</span>
                  </div>
                  <div className="mini-field-info">
                    <div className="mini-field-name">{court.name}</div>
                    <div className="mini-field-details">{court.type} • {court.turf} • {court.roofed ? 'Techada' : 'Descubierta'}</div>
                  </div>
                  <div className="mini-field-price">${court.pricePerHour}/h</div>
                </div>
              ))}
            </div>
          </div>

          {/* STEP 2: Select Date & Time */}
          <div className="booking-step">
            <span className="step-num">Paso 2 de 3</span>
            <h4>Fecha y Horario</h4>
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
                <label>Horarios Disponibles</label>
                <div className="time-slots-grid">
                  {TIME_SLOTS.map(slot => {
                    const status = bookedSlots[slot]
                    const isBooked = !!status
                    const isPast = isSlotInThePast(slot)
                    const isUnavailable = isBooked || isPast
                    const isSelected = selectedTimeSlot === slot
                    const isMaintenance = status === 'maintenance'

                    return (
                      <div 
                        className={`time-slot ${isUnavailable ? 'unavailable' : ''} ${isSelected && !isUnavailable ? 'selected' : ''} ${isMaintenance ? 'maintenance-block' : ''}`}
                        key={slot}
                        onClick={() => {
                          if (!isUnavailable) setSelectedTimeSlot(slot)
                        }}
                        style={isMaintenance ? {
                          backgroundColor: 'rgba(218, 25, 60, 0.08)',
                          border: '1.5px solid var(--accent-garnet)',
                          color: 'var(--accent-garnet)',
                          cursor: 'not-allowed',
                          gridColumn: 'span 2'
                        } : {}}
                      >
                        {isMaintenance ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', height: '100%' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>engineering</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>En Mantenimiento</span>
                          </div>
                        ) : (
                          slot
                        )}
                      </div>
                    )
                  })}
                </div>
                <span className="info-help">Haz clic para seleccionar un bloque de 1 hora.</span>
              </div>
            </div>
          </div>

          {/* STEP 3: Extras and Customization */}
          <div className="booking-step">
            <span className="step-num">Paso 3 de 3</span>
            <h4>Características y Extras</h4>
            
            {/* Selected Court Characteristics details */}
            {selectedCourt && (
              <div className="court-badge-details">
                <span className="card-pill card-pill-accent">{selectedCourt.type}</span>
                <span className="card-pill card-pill-accent">{selectedCourt.turf}</span>
                <span className="card-pill card-pill-accent">{selectedCourt.roofed ? 'Techada' : 'Aire Libre'}</span>
                <span className="card-pill" style={{ borderColor: 'var(--accent-garnet-glow)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '0.8rem', verticalAlign: 'middle', marginRight: '0.1rem', color: 'var(--accent-garnet)' }}>star</span>
                  {selectedCourt.rating}
                </span>
              </div>
            )}

            <div className="extras-selection">
              <label>Servicios Adicionales</label>
              
              <div className="extras-grid">
                <label className="extra-item">
                  <input 
                    type="checkbox" 
                    checked={extras.referee}
                    onChange={(e) => setExtras(prev => ({ ...prev, referee: e.target.checked }))}
                  />
                  <span className="extra-custom-checkbox"></span>
                  <div className="extra-info">
                    <span className="extra-title">Árbitro Oficial</span>
                    <span className="extra-desc">Dirige con profesionalismo (+$15)</span>
                  </div>
                </label>
                
                <label className="extra-item">
                  <input 
                    type="checkbox" 
                    checked={extras.ball}
                    onChange={(e) => setExtras(prev => ({ ...prev, ball: e.target.checked }))}
                  />
                  <span className="extra-custom-checkbox"></span>
                  <div className="extra-info">
                    <span className="extra-title">Balón Profesional</span>
                    <span className="extra-desc">Balón de alta gama (+$5)</span>
                  </div>
                </label>

                <label className="extra-item">
                  <input 
                    type="checkbox" 
                    checked={extras.lights}
                    onChange={(e) => setExtras(prev => ({ ...prev, lights: e.target.checked }))}
                  />
                  <span className="extra-custom-checkbox"></span>
                  <div className="extra-info">
                    <span className="extra-title">Reflectores LED</span>
                    <span className="extra-desc">Iluminación nocturna (+$8)</span>
                  </div>
                </label>

                <label className="extra-item">
                  <input 
                    type="checkbox" 
                    checked={extras.bibs}
                    onChange={(e) => setExtras(prev => ({ ...prev, bibs: e.target.checked }))}
                  />
                  <span className="extra-custom-checkbox"></span>
                  <div className="extra-info">
                    <span className="extra-title">Chalecos de Distinción</span>
                    <span className="extra-desc">Dos juegos limpios (+$5)</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Reservation Total Price & Submit */}
          <div className="booking-footer">
            <div className="price-summary">
              <span className="label">Total Estimado</span>
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
