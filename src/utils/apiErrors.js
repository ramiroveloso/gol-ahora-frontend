/**
 * Mensajes legibles para respuestas 400 del backend Django/DRF.
 */
export function formatApiError(err) {
  if (err?.status === 500) {
    return 'Error interno del servidor (500). Suele ocurrir si ya hay una reserva cancelada en el mismo horario. Probá otro horario o pedí al backend revisar la restricción única.'
  }

  if (err?.data && typeof err.data === 'object') {
    const fromData = flattenDjangoErrors(err.data)
    if (fromData && fromData !== 'Error en la petición') return fromData
  }

  const raw = err?.message || String(err || 'Error desconocido')
  let parsed = raw
  try {
    const json = JSON.parse(raw)
    if (typeof json === 'object' && json !== null) {
      parsed = flattenDjangoErrors(json)
    }
  } catch {
    /* texto plano */
  }

  const lower = parsed.toLowerCase()
  if (lower.includes('deudas pendientes')) {
    return 'No podés reservar: tenés pagos pendientes. Regularizá tu cuenta primero.'
  }
  if (lower.includes('solapamiento') || lower.includes('ya se encuentra reservada')) {
    return 'Ese horario ya tiene una reserva pendiente o confirmada. Revisá el tablero, cancelá la activa o elegí otro horario.'
  }
  if (lower.includes('unique') || lower.includes('único') || lower.includes('already exists')) {
    return 'Ese turno ya existe en el sistema (a veces queda una reserva cancelada con el mismo horario). Probá otro horario.'
  }
  if (lower.includes('milisegundos') || lower.includes('epoch')) {
    return 'Fecha u hora inválida. Volvé a elegir fecha y horario.'
  }
  if (lower.includes('clase') && lower.includes('alumno') && lower.includes('único')) {
    return 'Ya existe un registro de asistencia para ese alumno en esta clase.'
  }
  if (lower.includes('credenciales inválidas')) {
    return 'Usuario o contraseña incorrectos.'
  }
  if (
    lower.includes('credenciales de autenticación') ||
    lower.includes('authentication credentials')
  ) {
    return 'Sesión no activa. Cerrá sesión y volvé a entrar.'
  }
  if (lower.includes('csrf') && lower.includes('incorrect')) {
    return 'La sesión de seguridad expiró. Recargá la página (F5) e intentá de nuevo.'
  }
  if (lower.includes('csrf')) {
    return 'Error de seguridad (CSRF). Recargá la página o reiniciá sesión.'
  }
  if (lower.includes('method not allowed') || lower.includes('405')) {
    return 'La acción no está permitida por el servidor.'
  }
  if (lower.includes('not found') || lower.includes('404')) {
    return 'Recurso no encontrado en el servidor.'
  }
  if (lower.includes('sin sesión')) {
    return 'Tu sesión expiró. Volvé a iniciar sesión.'
  }

  return parsed.length > 280 ? `${parsed.slice(0, 280)}…` : parsed
}

function flattenDjangoErrors(data) {
  if (data.detail) return String(data.detail)
  if (data.non_field_errors) {
    const arr = data.non_field_errors
    return Array.isArray(arr) ? arr.join(' ') : String(arr)
  }
  const parts = []
  for (const [key, val] of Object.entries(data)) {
    const msg = Array.isArray(val) ? val.join(' ') : String(val)
    parts.push(key === 'detail' ? msg : `${key}: ${msg}`)
  }
  return parts.join(' · ') || 'Error en la petición'
}
