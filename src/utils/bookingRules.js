/** Reglas de duración máxima por tipo de cancha (F5 / F7 / F11). */

/** F5 1h · F7 1,5h · F11 2h (grilla de bloques de 1 h) */
export function getMaxDurationHours(court) {
  if (!court) return 1
  const minutes = court.maxDurationMinutes ?? durationMinutesByType(court.type)
  if (minutes <= 60) return 1
  if (minutes <= 90) return 1
  if (minutes <= 120) return 2
  return Math.min(3, Math.ceil(minutes / 60))
}

export function getMaxDurationLabel(court) {
  const minutes = court?.maxDurationMinutes ?? durationMinutesByType(court?.type)
  if (minutes <= 60) return '1 hora'
  if (minutes <= 90) return '1,5 horas (1 bloque horario)'
  if (minutes <= 120) return '2 horas'
  return `${minutes} min`
}

function durationMinutesByType(type = '') {
  if (type.includes('11')) return 120
  if (type.includes('7')) return 90
  if (type.includes('5')) return 60
  return 60
}

export function getConsecutiveSlots(startSlot, hours, timeSlots) {
  const startIdx = timeSlots.indexOf(startSlot)
  if (startIdx === -1) return null
  const slots = []
  for (let i = 0; i < hours; i++) {
    const idx = startIdx + i
    if (idx >= timeSlots.length) return null
    slots.push(timeSlots[idx])
  }
  return slots
}

export function formatTimeRange(slots) {
  if (!slots?.length) return ''
  if (slots.length === 1) return slots[0]
  const start = slots[0].split(' - ')[0]
  const end = slots[slots.length - 1].split(' - ')[1]
  return `${start} - ${end}`
}

export const STATUS_LABELS = {
  pending: 'Pendiente de pago',
  confirmed: 'Confirmada',
  live: 'En juego',
  completed: 'Finalizada',
  cancelled: 'Cancelada',
  maintenance: 'Mantenimiento',
}

/** Importe que cuenta para totales (canceladas no suman). */
export function bookingBillableAmount(booking) {
  if (!booking || booking.status === 'cancelled') return 0
  return Number(booking.totalPrice) || 0
}

export function isHistorialStatus(status) {
  return status === 'completed' || status === 'cancelled'
}

/** Inicio y fin del turno en hora local (según date + time del booking). */
export function getBookingWindow(booking) {
  const [startPart, endPart] = (booking.time || '00:00 - 01:00').split(' - ').map((s) => s.trim())
  const [sh, sm] = startPart.split(':').map(Number)
  const [y, mo, d] = (booking.date || '').split('-').map(Number)
  const atLocal = (h, m) => new Date(y, mo - 1, d, h, m || 0, 0, 0)

  const start = atLocal(sh, sm)
  let end
  if (endPart) {
    const [eh, em] = endPart.split(':').map(Number)
    end = atLocal(eh, em)
  } else {
    end = new Date(start.getTime() + (booking.durationHours || 1) * 3600000)
  }
  return { start, end }
}

/** Confirmada dentro del horario → columna En juego (solo UI; backend sigue CONFIRMADA). */
export function resolveBookingDisplayStatus(booking, now = new Date()) {
  const stored = booking.status
  if (stored !== 'confirmed' && stored !== 'live') return stored

  const { start, end } = getBookingWindow(booking)
  const t = now.getTime()
  if (t >= start.getTime() && t < end.getTime()) return 'live'
  return 'confirmed'
}

export function withDisplayStatuses(bookings, now = new Date()) {
  return bookings.map((b) => ({
    ...b,
    status: resolveBookingDisplayStatus(b, now),
  }))
}

/** Turno confirmado/en juego cuyo horario de fin ya pasó → finalizar en servidor. */
/** Busca por nombre, apellido o texto completo (insensible a mayúsculas). */
/** Reservas visibles según rol (cliente/profesional: solo las propias). */
export function filterBookingsForUser(bookings, user) {
  if (!user || !Array.isArray(bookings)) return bookings || []
  if (user.role === 'administrador') return bookings

  const id = String(user.id ?? '')
  const email = (user.email || '').toLowerCase()

  return bookings.filter((b) => {
    if (id && b.userId && String(b.userId) === id) return true
    if (email && (b.userEmail || '').toLowerCase() === email) return true
    return false
  })
}

export function dateStringToEpochMs(dateStr) {
  const [y, mo, d] = (dateStr || '').split('-').map(Number)
  return new Date(y, mo - 1, d, 12, 0, 0, 0).getTime()
}

export function matchesStudentSearch(student, term) {
  const q = (term || '').trim().toLowerCase()
  if (!q) return true
  const first = (student.firstName || '').toLowerCase()
  const last = (student.lastName || '').toLowerCase()
  const full = (student.name || '').toLowerCase()
  const email = (student.email || '').toLowerCase()
  return (
    first.includes(q) ||
    last.includes(q) ||
    full.includes(q) ||
    `${first} ${last}`.trim().includes(q) ||
    email.includes(q)
  )
}

export function shouldFinalizeTurn(booking, now = new Date()) {
  const stored = booking.status
  if (stored === 'cancelled' || stored === 'completed') return false
  if (stored !== 'confirmed' && stored !== 'live') return false
  const { end } = getBookingWindow(booking)
  return now.getTime() >= end.getTime()
}
