const STORAGE_KEY = 'gol_ahora_maintenance_slots'

/** Bloqueos de mantenimiento solo en UI (hasta endpoint en backend). */
export function loadMaintenanceSlots() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveMaintenanceSlots(slots) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(slots))
}

export function maintenanceSlotKey(courtId, date, slot) {
  return `${courtId}|${date}|${slot}`
}

export function findMaintenanceSlot(slots, courtId, date, slot) {
  const key = maintenanceSlotKey(courtId, date, slot)
  return slots.find((s) => maintenanceSlotKey(s.courtId, s.date, s.slot) === key)
}

export function addMaintenanceSlot(slots, courtId, date, slot, courtName) {
  if (findMaintenanceSlot(slots, courtId, date, slot)) return slots
  return [
    ...slots,
    {
      id: `maint-${courtId}-${date}-${slot.replace(/\s/g, '')}`,
      courtId: String(courtId),
      courtName: courtName || `Cancha #${courtId}`,
      date,
      slot,
      time: slot,
      status: 'maintenance',
      totalPrice: 0,
    },
  ]
}

export function removeMaintenanceSlot(slots, courtId, date, slot) {
  const key = maintenanceSlotKey(courtId, date, slot)
  return slots.filter((s) => maintenanceSlotKey(s.courtId, s.date, s.slot) !== key)
}
