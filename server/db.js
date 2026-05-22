import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import bcrypt from 'bcryptjs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.resolve(__dirname, 'database.db')

let dbInstance = null

// Establish SQLite database connection
export async function getDatabase() {
  if (dbInstance) return dbInstance

  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database
  })

  return dbInstance
}

// Helper to generate dynamic dates relative to today
const getRelativeDateString = (daysOffset) => {
  const d = new Date()
  d.setDate(d.getDate() + daysOffset)
  return d.toISOString().split('T')[0]
}

// Seed Database Tables and default records
export async function initDatabase() {
  const db = await getDatabase()

  // 1. Create Users Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'cliente',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Add column dynamically if table already existed without role column
  try {
    const columns = await db.all('PRAGMA table_info(users)')
    const hasRole = columns.some(c => c.name === 'role')
    if (!hasRole) {
      await db.exec('ALTER TABLE users ADD COLUMN role TEXT DEFAULT "cliente"')
      console.log('✔ Añadida columna "role" a la tabla users.')
    }
  } catch (err) {
    console.warn('⚠️ Advertencia al verificar columna role:', err.message)
  }

  // 2. Create Bookings Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL,
      court_id TEXT NOT NULL,
      court_name TEXT NOT NULL,
      type TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      extras TEXT NOT NULL, -- JSON serialized string
      total_price REAL NOT NULL,
      status TEXT NOT NULL
    )
  `)

  // 3. Seed Default Users (Force-refreshed on startup to prevent sync/typing discrepancies)
  const demoEmail = 'demo@golahora.com'
  const adminEmail = 'admin@gol.com'
  const profEmail = 'profesional@gol.com'
  const simpleEmail = 'a@a.com'
  
  // Clean existing to force fresh hashes
  await db.run('DELETE FROM users WHERE email IN (?, ?, ?, ?)', [demoEmail, adminEmail, profEmail, simpleEmail])
  
  // Hash passwords
  const demoHash = await bcrypt.hash('123456', 10)
  const adminHash = await bcrypt.hash('123', 10)
  const profHash = await bcrypt.hash('123', 10)
  const simpleHash = await bcrypt.hash('1', 10)
  
  // Insert fresh accounts
  await db.run(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    ['Ramón Rami', demoEmail, demoHash, 'cliente']
  )
  await db.run(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    ['Administrador', adminEmail, adminHash, 'administrador']
  )
  await db.run(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    ['Profesor Carlos', profEmail, profHash, 'profesional']
  )
  await db.run(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    ['Usuario Simple', simpleEmail, simpleHash, 'cliente']
  )
  console.log('✔ Cuentas de prueba sembradas con éxito (demo@golahora.com / 123456, admin@gol.com / 123, profesional@gol.com / 123 y a@a.com / 1).')

  // 4. Seed Default Bookings
  const existingBookings = await db.get('SELECT COUNT(*) as count FROM bookings')
  if (existingBookings.count === 0) {
    const defaultBookings = [
      {
        id: 'booking-mock-1',
        user_email: demoEmail,
        court_id: 'court-3',
        court_name: 'La Bombonera Techada',
        type: 'Fútbol 5',
        date: getRelativeDateString(0), // Today
        time: '19:00 - 20:00',
        extras: JSON.stringify(['Reflectores LED', 'Balón Profesional']),
        total_price: 43.0,
        status: 'confirmed'
      },
      {
        id: 'booking-mock-2',
        user_email: demoEmail,
        court_id: 'court-2',
        court_name: 'Sintética Pro',
        type: 'Fútbol 7',
        date: getRelativeDateString(1), // Tomorrow
        time: '17:00 - 18:00',
        extras: JSON.stringify(['Chalecos de Equipo']),
        total_price: 40.0,
        status: 'pending'
      },
      {
        id: 'booking-mock-3',
        user_email: demoEmail,
        court_id: 'court-4',
        court_name: 'Maracaná Arena',
        type: 'Fútbol 5',
        date: getRelativeDateString(-1), // Yesterday
        time: '20:00 - 21:00',
        extras: JSON.stringify(['Árbitro Profesional', 'Reflectores LED']),
        total_price: 51.0,
        status: 'completed'
      }
    ]

    for (const b of defaultBookings) {
      await db.run(`
        INSERT INTO bookings (id, user_email, court_id, court_name, type, date, time, extras, total_price, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [b.id, b.user_email, b.court_id, b.court_name, b.type, b.date, b.time, b.extras, b.total_price, b.status])
    }
    console.log('✔ Reservas de demostración inicializadas en la base de datos.')
  }
}
