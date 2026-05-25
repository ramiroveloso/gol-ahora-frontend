/**
 * Mensajes legibles para respuestas 400 del backend Django/DRF.
 */
export function formatApiError(err) {
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
    return 'Ese horario ya está ocupado. Elegí otro turno.'
  }
  if (lower.includes('clase') && lower.includes('alumno') && lower.includes('único')) {
    return 'Ya existe un registro de asistencia para ese alumno en esta clase.'
  }
  if (lower.includes('credenciales inválidas')) {
    return 'Usuario o contraseña incorrectos.'
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
