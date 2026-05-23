/** Reglas de duración máxima por tipo de cancha (RF F5 / F7 / F11). */

/** RF-26: F5 1h · F7 1,5h · F11 2h (grilla de bloques de 1 h) */
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
  maintenance: 'Mantenimiento',
}
