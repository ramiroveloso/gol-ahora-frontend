import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { getDatabase, initDatabase } from './db.js'
import authMiddleware from './middleware/auth.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
const JWT_SECRET = process.env.JWT_SECRET || 'gol_ahora_secreto_seguro_para_firmar_tokens_jwt_2026_xyz'

// Apply Middlewares
app.use(cors())
app.use(express.json())

// Initialize Database on server bootup
try {
  await initDatabase()
  console.log('✔ Conexión con base de datos SQLite establecida.')
} catch (err) {
  console.error('✘ Error al inicializar la base de datos:', err)
}

// ==========================================================================
// AUTHENTICATION API ROUTES (Públicas)
// ==========================================================================

// Register route
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Por favor, rellene todos los campos requeridos.' })
  }

  try {
    const db = await getDatabase()
    
    // Check if user already exists
    const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email.trim()])
    if (existingUser) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado.' })
    }

    // Hash user password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Insert user into SQLite
    await db.run(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name.trim(), email.trim().toLowerCase(), hashedPassword, role || 'cliente']
    )

    // Retrieve new user details
    const newUser = await db.get('SELECT id, name, email, role FROM users WHERE email = ?', [email.trim().toLowerCase()])

    // Sign JWT Token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.status(201).json({
      token,
      user: { name: newUser.name, email: newUser.email, role: newUser.role }
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error del servidor al registrar el usuario.' })
  }
})

// Login route
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Por favor, ingrese correo y contraseña.' })
  }

  try {
    const db = await getDatabase()
    
    // Check user email
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()])
    if (!user) {
      return res.status(400).json({ error: 'El correo electrónico o la contraseña son incorrectos.' })
    }

    // Verify hashed password
    const isPasswordMatch = await bcrypt.compare(password, user.password_hash)
    if (!isPasswordMatch) {
      return res.status(400).json({ error: 'El correo electrónico o la contraseña son incorrectos.' })
    }

    // Sign JWT Token
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({
      token,
      user: { name: user.name, email: user.email, role: user.role }
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error del servidor al iniciar sesión.' })
  }
})

// Check user status (GET /me)
app.get('/api/auth/me', authMiddleware, (req, res) => {
  // Returns decoded token details bound by authorization middleware
  res.json({ user: req.user })
})

// ==========================================================================
// BOOKINGS CRUD ROUTES (Privadas - Requieren Token)
// ==========================================================================

// Get user bookings
app.get('/api/bookings', authMiddleware, async (req, res) => {
  try {
    const db = await getDatabase()
    let bookingsList
    if (req.user.role === 'administrador') {
      bookingsList = await db.all('SELECT * FROM bookings')
    } else {
      bookingsList = await db.all('SELECT * FROM bookings WHERE user_email = ?', [req.user.email])
    }
    
    // Map SQLite database snake_case fields to camelCase expected by React frontend
    const formattedBookings = bookingsList.map(b => ({
      id: b.id,
      userEmail: b.user_email,
      courtId: b.court_id,
      courtName: b.court_name,
      type: b.type,
      date: b.date,
      time: b.time,
      extras: JSON.parse(b.extras || '[]'),
      totalPrice: b.total_price,
      status: b.status
    }))

    res.json(formattedBookings)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error del servidor al cargar las reservas.' })
  }
})

// Create a booking with schedule validation
app.post('/api/bookings', authMiddleware, async (req, res) => {
  const { courtId, courtName, type, date, time, extras, totalPrice } = req.body

  if (!courtId || !courtName || !type || !date || !time || totalPrice === undefined) {
    return res.status(400).json({ error: 'Por favor, suministre toda la información de la reserva.' })
  }

  try {
    const db = await getDatabase()

    // Collision Check: Check if slot is already booked for this court and day
    const overlap = await db.get(
      'SELECT * FROM bookings WHERE court_id = ? AND date = ? AND time = ? AND status != "completed"',
      [courtId, date, time]
    )

    if (overlap) {
      return res.status(409).json({ error: 'El horario seleccionado ya se encuentra reservado para esta cancha.' })
    }

    const bookingId = 'booking-' + Date.now()
    const extrasString = JSON.stringify(extras || [])

    let targetEmail = req.user.email
    let targetStatus = 'pending'

    if (req.user.role === 'administrador') {
      if (req.body.status) {
        targetStatus = req.body.status
      }
      if (req.body.userEmail) {
        targetEmail = req.body.userEmail
      }
    }

    // Insert booking linked to authenticated user
    await db.run(
      `INSERT INTO bookings (id, user_email, court_id, court_name, type, date, time, extras, total_price, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [bookingId, targetEmail, courtId, courtName, type, date, time, extrasString, totalPrice, targetStatus]
    )

    res.status(201).json({
      id: bookingId,
      userEmail: targetEmail,
      courtId,
      courtName,
      type,
      date,
      time,
      extras: extras || [],
      totalPrice,
      status: targetStatus
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error del servidor al crear la reserva.' })
  }
})

// Update booking status (used for drag and drop)
app.put('/api/bookings/:id/status', authMiddleware, async (req, res) => {
  const { id } = req.params
  const { status } = req.body

  if (!status) {
    return res.status(400).json({ error: 'Por favor, suministre el estado de actualización.' })
  }

  try {
    const db = await getDatabase()
    
    // Check if booking belongs to active user (or bypass if administrator)
    let booking
    if (req.user.role === 'administrador') {
      booking = await db.get('SELECT * FROM bookings WHERE id = ?', [id])
    } else {
      booking = await db.get('SELECT * FROM bookings WHERE id = ? AND user_email = ?', [id, req.user.email])
    }
    
    if (!booking) {
      return res.status(404).json({ error: 'Reserva no encontrada o no posee autorización para modificarla.' })
    }

    // Update status in SQLite
    await db.run('UPDATE bookings SET status = ? WHERE id = ?', [status, id])
    
    res.json({ success: true, id, status })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error del servidor al actualizar el estado de la reserva.' })
  }
})

// Delete / Cancel a booking
app.delete('/api/bookings/:id', authMiddleware, async (req, res) => {
  const { id } = req.params

  try {
    const db = await getDatabase()
    
    // Check ownership (or bypass if administrator)
    let booking
    if (req.user.role === 'administrador') {
      booking = await db.get('SELECT * FROM bookings WHERE id = ?', [id])
    } else {
      booking = await db.get('SELECT * FROM bookings WHERE id = ? AND user_email = ?', [id, req.user.email])
    }
    
    if (!booking) {
      return res.status(404).json({ error: 'Reserva no encontrada o no posee autorización para eliminarla.' })
    }

    // Delete row
    await db.run('DELETE FROM bookings WHERE id = ?', [id])
    
    res.json({ success: true, message: 'Reserva eliminada.' })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error del servidor al eliminar la reserva.' })
  }
})

// Get occupied slots (available for all authenticated users to check overlaps safely)
app.get('/api/bookings/occupied', authMiddleware, async (req, res) => {
  try {
    const db = await getDatabase()
    const bookingsList = await db.all('SELECT court_id, date, time, status FROM bookings WHERE status != "completed"')
    
    const formatted = bookingsList.map(b => ({
      courtId: b.court_id,
      date: b.date,
      time: b.time,
      status: b.status
    }))

    res.json(formatted)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error del servidor al recuperar ocupación.' })
  }
})

// ==========================================================================
// ADMINISTRATIVE API ROUTES (Privadas - Requieren Token de Administrador)
// ==========================================================================

// Get all users
app.get('/api/admin/users', authMiddleware, async (req, res) => {
  if (req.user.role !== 'administrador') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere perfil de Administrador.' })
  }

  try {
    const db = await getDatabase()
    const usersList = await db.all('SELECT id, name, email, role, created_at FROM users')
    res.json(usersList)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error del servidor al recuperar los usuarios.' })
  }
})

// Delete user and automatically delete their bookings
app.delete('/api/admin/users/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'administrador') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere perfil de Administrador.' })
  }

  const { id } = req.params

  try {
    const db = await getDatabase()
    
    // Find the user email first to delete their bookings
    const user = await db.get('SELECT * FROM users WHERE id = ?', [id])
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' })
    }

    if (user.email === req.user.email) {
      return res.status(400).json({ error: 'No puedes darte de baja a ti mismo.' })
    }

    // Delete user's bookings first (cascade bookings delete)
    await db.run('DELETE FROM bookings WHERE user_email = ?', [user.email])

    // Delete user row
    await db.run('DELETE FROM users WHERE id = ?', [id])

    res.json({ success: true, message: `Usuario ${user.name} y todas sus reservas han sido eliminados de forma automática.` })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error del servidor al dar de baja el usuario.' })
  }
})

// Start server listening
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor de Gol Ahora corriendo en http://127.0.0.1:${PORT}`)
})
