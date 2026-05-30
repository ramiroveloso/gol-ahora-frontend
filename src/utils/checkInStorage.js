const STORAGE_KEY = 'gol_ahora_checkins'

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function writeAll(map) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

/** Check-in presencial (local hasta que el backend exponga campo/endpoint). */
export function getCheckIn(bookingId) {
  return readAll()[String(bookingId)] || null
}

export function isCheckedIn(bookingId) {
  return Boolean(getCheckIn(bookingId))
}

export function markCheckIn(bookingId, adminUserId, adminName = '') {
  const id = String(bookingId)
  const map = readAll()
  map[id] = {
    at: Date.now(),
    by: String(adminUserId || ''),
    byName: adminName || '',
  }
  writeAll(map)
  return map[id]
}

export function clearCheckIn(bookingId) {
  const id = String(bookingId)
  const map = readAll()
  delete map[id]
  writeAll(map)
}

export function listCheckInsForDate(dateStr) {
  const all = readAll()
  return Object.entries(all).map(([bookingId, meta]) => ({ bookingId, ...meta }))
}
