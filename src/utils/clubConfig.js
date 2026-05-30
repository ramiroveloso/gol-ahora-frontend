const STORAGE_KEY = 'gol_ahora_club_config'

export const DEFAULT_CLUB_CONFIG = {
  /** Días máximos de anticipación para reservar */
  maxAdvanceDays: 30,
  /** Horas mínimas antes del turno para cancelar sin penalización */
  minCancelHours: 24,
}

export function loadClubConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_CLUB_CONFIG }
    return { ...DEFAULT_CLUB_CONFIG, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_CLUB_CONFIG }
  }
}

export function saveClubConfig(patch) {
  const next = { ...loadClubConfig(), ...patch }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

/** Valida si la fecha está dentro del plazo de anticipación permitido. */
export function canBookOnDate(dateStr, config = loadClubConfig()) {
  if (!dateStr) return { ok: false, reason: 'Seleccioná una fecha.' }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(target.getTime())) return { ok: false, reason: 'Fecha inválida.' }
  if (target < today) return { ok: false, reason: 'No podés reservar fechas pasadas.' }
  const maxDate = new Date(today)
  maxDate.setDate(maxDate.getDate() + Number(config.maxAdvanceDays || 30))
  if (target > maxDate) {
    return {
      ok: false,
      reason: `Solo podés reservar hasta ${config.maxAdvanceDays} días de anticipación.`,
    }
  }
  return { ok: true }
}

/** Indica si la cancelación está dentro del plazo sin penalización. */
export function canCancelWithoutPenalty(booking, config = loadClubConfig()) {
  if (!booking?.date || !booking?.time) return { ok: true, withinPolicy: true }
  const [startPart] = (booking.time || '').split(' - ')
  const [h, m] = (startPart || '00:00').split(':').map(Number)
  const start = new Date(`${booking.date}T${String(h).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}:00`)
  const now = new Date()
  const hoursLeft = (start.getTime() - now.getTime()) / 3600000
  const minHours = Number(config.minCancelHours || 24)
  if (hoursLeft >= minHours) {
    return { ok: true, withinPolicy: true, hoursLeft }
  }
  return {
    ok: true,
    withinPolicy: false,
    hoursLeft,
    message: `Cancelación fuera de plazo (${minHours} h de antelación). Puede aplicarse penalización.`,
  }
}
