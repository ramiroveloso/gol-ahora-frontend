/**
 * API simulada — desarrollo frontend sin backend ni token.
 * Activar: VITE_USE_MOCK=true en .env
 */

import {
  DEFAULT_COURTS,
  DEFAULT_PROFESSORS,
  DEMO_USERS,
} from '../data/catalogDefaults.js'
import { DEFAULT_CLASSES } from '../data/attendanceDefaults.js'

const STORAGE = {
  users: 'gol_mock_users',
  bookings: 'gol_mock_bookings',
  courts: 'gol_mock_courts',
  professors: 'gol_mock_professors',
  classes: 'gol_mock_classes',
  cobros: 'gol_mock_cobros',
  recibos: 'gol_mock_recibos',
  session: 'gol_mock_session',
}

const SEED_BOOKINGS = [
  {
    id: 'booking-seed-1',
    userEmail: 'demo@golahora.com',
    courtId: 'court-2',
    courtName: 'Sintética Pro',
    type: 'Fútbol 7',
    date: new Date().toISOString().split('T')[0],
    time: '18:00 - 19:00',
    extras: ['Balón Profesional'],
    totalPrice: 40,
    status: 'pending',
  },
  {
    id: 'booking-seed-2',
    userEmail: 'demo@golahora.com',
    courtId: 'court-3',
    courtName: 'La Bombonera Techada',
    type: 'Fútbol 5',
    date: new Date().toISOString().split('T')[0],
    time: '20:00 - 21:00',
    extras: [],
    totalPrice: 30,
    status: 'confirmed',
  },
]

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function deepCloneClasses() {
  return DEFAULT_CLASSES.map((c) => ({
    ...c,
    students: c.students.map((s) => ({ ...s })),
  }))
}

function ensureSeed() {
  if (!localStorage.getItem(STORAGE.users)) writeJson(STORAGE.users, DEMO_USERS)
  if (!localStorage.getItem(STORAGE.bookings)) writeJson(STORAGE.bookings, SEED_BOOKINGS)
  if (!localStorage.getItem(STORAGE.courts)) writeJson(STORAGE.courts, DEFAULT_COURTS)
  if (!localStorage.getItem(STORAGE.professors)) writeJson(STORAGE.professors, DEFAULT_PROFESSORS)
  if (!localStorage.getItem(STORAGE.classes)) writeJson(STORAGE.classes, deepCloneClasses())
  if (!localStorage.getItem(STORAGE.cobros)) writeJson(STORAGE.cobros, [])
  if (!localStorage.getItem(STORAGE.recibos)) writeJson(STORAGE.recibos, [])
}

function delay(ms = 120) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getSessionUser() {
  return readJson(STORAGE.session, null)
}

function toUserResponse(found) {
  if (!found) return null
  return {
    id: found.id,
    name: found.name,
    email: found.email,
    role: found.role,
    telefono: found.telefono || '',
    direccion: found.direccion || '',
    localidad: found.localidad || '',
    provincia: found.provincia || '',
    codigoPostal: found.codigoPostal || '',
    pais: found.pais || 'Argentina',
    dni: found.dni || '',
    memberSince: found.memberSince || 'Mayo 2026',
    certificacionVigente: found.certificacionVigente ?? found.role !== 'profesional',
  }
}

export const mockApi = {
  async login(email, _password) {
    await delay()
    ensureSeed()
    const users = readJson(STORAGE.users, DEMO_USERS)
    const found = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
    if (!found) throw new Error('El email o la contraseña son incorrectos')
    const token = `mock-token-${found.id}`
    localStorage.setItem('token', token)
    writeJson(STORAGE.session, found)
    return toUserResponse(found)
  },

  async register(data) {
    await delay()
    ensureSeed()
    const users = readJson(STORAGE.users, DEMO_USERS)
    const mail = data.email.trim().toLowerCase()
    if (users.some((u) => u.email.toLowerCase() === mail)) {
      throw new Error('El correo electrónico ya está registrado.')
    }
    if (!data.name?.trim()) throw new Error('El nombre es obligatorio')
    if ((data.password || '').length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres')

    const newUser = {
      id: `u-${Date.now()}`,
      name: data.name.trim(),
      email: mail,
      role: data.role || 'cliente',
      telefono: data.telefono?.trim() || '',
      direccion: data.direccion?.trim() || '',
      localidad: data.localidad?.trim() || '',
      provincia: data.provincia?.trim() || 'Buenos Aires',
      codigoPostal: data.codigoPostal?.trim() || '',
      pais: data.pais?.trim() || 'Argentina',
      dni: data.dni?.trim() || '',
      memberSince: new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }),
      certificacionVigente: data.role !== 'profesional',
    }
    users.push(newUser)
    writeJson(STORAGE.users, users)
    const token = `mock-token-${newUser.id}`
    localStorage.setItem('token', token)
    writeJson(STORAGE.session, newUser)
    return toUserResponse(newUser)
  },

  logout() {
    localStorage.removeItem('token')
    localStorage.removeItem(STORAGE.session)
  },

  async getMe() {
    await delay(80)
    const user = getSessionUser()
    if (!user) throw new Error('Sesión no válida')
    return toUserResponse(user)
  },

  async getCourts() {
    await delay(80)
    ensureSeed()
    return readJson(STORAGE.courts, DEFAULT_COURTS)
  },

  async getProfessors() {
    await delay(80)
    ensureSeed()
    return readJson(STORAGE.professors, DEFAULT_PROFESSORS)
  },

  async getBookings() {
    await delay()
    ensureSeed()
    const user = getSessionUser()
    const all = readJson(STORAGE.bookings, [])
    if (!user) return []
    if (user.role === 'administrador') return all
    return all.filter((b) => b.userEmail === user.email)
  },

  async getOccupiedBookings() {
    await delay(80)
    ensureSeed()
    const all = readJson(STORAGE.bookings, [])
    return all.filter((b) => b.status !== 'completed')
  },

  async createBooking(bookingData) {
    await delay()
    const all = readJson(STORAGE.bookings, [])
    const booking = { ...bookingData, id: bookingData.id || `booking-${Date.now()}` }
    all.push(booking)
    writeJson(STORAGE.bookings, all)
    return booking
  },

  async updateBookingStatus(id, status) {
    await delay()
    const all = readJson(STORAGE.bookings, [])
    const idx = all.findIndex((b) => b.id === id)
    if (idx === -1) throw new Error('Reserva no encontrada')
    all[idx] = { ...all[idx], status }
    writeJson(STORAGE.bookings, all)
    return all[idx]
  },

  async deleteBooking(id) {
    await delay()
    const all = readJson(STORAGE.bookings, []).filter((b) => b.id !== id)
    writeJson(STORAGE.bookings, all)
    return { ok: true }
  },

  async adminGetUsers() {
    await delay()
    ensureSeed()
    return readJson(STORAGE.users, DEMO_USERS)
  },

  async updateProfile(updates) {
    await delay()
    const session = getSessionUser()
    if (!session) throw new Error('Sesión no válida')
    const users = readJson(STORAGE.users, DEMO_USERS)
    const idx = users.findIndex((u) => u.email === session.email)
    const merged = {
      ...(idx >= 0 ? users[idx] : session),
      ...updates,
      email: session.email,
      id: session.id,
    }
    if (idx >= 0) users[idx] = merged
    writeJson(STORAGE.users, users)
    writeJson(STORAGE.session, merged)
    return toUserResponse(merged)
  },

  async adminDeleteUser(id) {
    await delay()
    const users = readJson(STORAGE.users, [])
    const removed = users.find((u) => u.id === id)
    const next = users.filter((u) => u.id !== id)
    writeJson(STORAGE.users, next)
    const bookings = readJson(STORAGE.bookings, []).filter((b) => b.userEmail !== removed?.email)
    writeJson(STORAGE.bookings, bookings)
    return { ok: true }
  },

  async processPayment(bookingId, paymentMethod = 'tarjeta') {
    await delay(200)
    ensureSeed()
    const bookings = readJson(STORAGE.bookings, [])
    const idx = bookings.findIndex((b) => b.id === bookingId)
    if (idx === -1) throw new Error('Reserva no encontrada')
    const booking = bookings[idx]
    if (booking.status !== 'pending') throw new Error('Esta reserva no está pendiente de pago')

    const user = getSessionUser()
    const cobroId = `cobro-${Date.now()}`
    const reciboId = `recibo-${Date.now()}`
    const numeroRecibo = `GA-${Date.now().toString().slice(-8)}`

    const cobro = {
      id: cobroId,
      bookingId,
      usuarioEmail: user?.email,
      monto: booking.totalPrice,
      metodoPago: paymentMethod,
      estadoPago: 'APROBADO',
      fecha: new Date().toISOString(),
    }

    const recibo = {
      id: reciboId,
      cobroId,
      numero: numeroRecibo,
      bookingId,
      courtName: booking.courtName,
      fecha: booking.date,
      horario: booking.time,
      monto: booking.totalPrice,
      metodoPago: paymentMethod,
      cliente: user?.name || booking.userEmail,
      emitidoEn: new Date().toISOString(),
    }

    bookings[idx] = {
      ...booking,
      status: 'confirmed',
      cobroId,
      reciboId,
      paidAt: new Date().toISOString(),
    }

    const cobros = readJson(STORAGE.cobros, [])
    cobros.push(cobro)
    const recibos = readJson(STORAGE.recibos, [])
    recibos.push(recibo)

    writeJson(STORAGE.bookings, bookings)
    writeJson(STORAGE.cobros, cobros)
    writeJson(STORAGE.recibos, recibos)

    return { booking: bookings[idx], cobro, recibo }
  },

  async getClasses() {
    await delay(80)
    ensureSeed()
    const user = getSessionUser()
    const all = readJson(STORAGE.classes, deepCloneClasses())
    if (!user) return []
    if (user.role === 'administrador') return all
    if (user.role === 'profesional') {
      return all.filter((c) => c.profesorEmail === user.email)
    }
    return []
  },

  async saveAttendance(classId, students) {
    await delay(150)
    ensureSeed()
    const classes = readJson(STORAGE.classes, [])
    const idx = classes.findIndex((c) => c.id === classId)
    if (idx === -1) throw new Error('Clase no encontrada')

    const cls = classes[idx]
    if (students.length > cls.maxStudents) {
      throw new Error(`Cupo máximo: ${cls.maxStudents} alumnos (RF-62)`)
    }

    classes[idx] = { ...cls, students }
    writeJson(STORAGE.classes, classes)
    return classes[idx]
  },
}
