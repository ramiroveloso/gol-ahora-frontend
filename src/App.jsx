import React, { useState, useEffect } from 'react'
import Header from './components/Header.jsx'
import Auth from './components/Auth.jsx'
import Dashboard from './components/Dashboard.jsx'
import BookingDrawer from './components/BookingDrawer.jsx'
import Toast from './components/Toast.jsx'
import Portal from './components/Portal.jsx'
import Attendance from './components/Attendance.jsx'
import Competitions from './components/Competitions.jsx'
import AdminUsers from './components/AdminUsers.jsx'
import AdminCalendar from './components/AdminCalendar.jsx'
import CatalogExplorer from './components/CatalogExplorer.jsx'
import ProfileModal from './components/ProfileModal.jsx'
import PaymentModal from './components/PaymentModal.jsx'
import { api } from './services/api.js'
import { DEFAULT_COURTS } from './data/catalogDefaults.js'

export const TIME_SLOTS = [
  '08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00',
  '12:00 - 13:00', '13:00 - 14:00', '14:00 - 15:00', '15:00 - 16:00',
  '16:00 - 17:00', '17:00 - 18:00', '18:00 - 19:00', '19:00 - 20:00',
  '20:00 - 21:00', '21:00 - 22:00',
]

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')
  const [currentUser, setCurrentUser] = useState(null)
  const [currentView, setCurrentView] = useState('portal')
  const [bookings, setBookings] = useState([])
  const [courts, setCourts] = useState(DEFAULT_COURTS)

  const [loading, setLoading] = useState(true)
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [paymentBooking, setPaymentBooking] = useState(null)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    const initApp = async () => {
      await api.fetchCsrfToken()
      try {
        const user = await api.getMe()
        setCurrentUser(user)
      } catch {
        setCurrentUser(null)
      } finally {
        setLoading(false)
      }
    }
    initApp()
  }, [])

  useEffect(() => {
    if (!currentUser) {
      setBookings([])
      return
    }

    const load = async () => {
      try {
        const [bookingData, courtData] = await Promise.all([
          api.getBookings(),
          api.getCourts(),
        ])
        setBookings(bookingData)
        if (courtData.length > 0) setCourts(courtData)
      } catch (err) {
        showToast(err.message || 'Error al cargar datos del servidor', 'error')
      }
    }
    load()
  }, [currentUser])

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
  }

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    showToast(`Modo ${nextTheme === 'dark' ? 'oscuro' : 'claro'} activado`, 'info')
  }

  const handleLogin = (user) => {
    setCurrentUser(user)
    setCurrentView('portal')
  }

  const handleLogout = async () => {
    await api.logout()
    setCurrentUser(null)
    setCurrentView('portal')
    showToast('Sesión cerrada correctamente', 'info')
  }

  const handleRefreshBookings = async () => {
    try {
      const data = await api.getBookings()
      setBookings(data)
    } catch (err) {
      showToast(err.message || 'Error al actualizar reservas', 'error')
    }
  }

  const handleUpdateBookingStatus = async (bookingId, nextStatus) => {
    try {
      const updated = await api.updateBookingStatus(bookingId, nextStatus)
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? updated : b)))
      showToast('Reserva actualizada en el servidor', 'success')
    } catch (err) {
      showToast(err.message || 'Error al mover la reserva', 'error')
    }
  }

  const handleDeleteBooking = async (bookingId) => {
    try {
      await api.deleteBooking(bookingId)
      setBookings((prev) => prev.filter((b) => b.id !== bookingId))
      showToast('Reserva eliminada con éxito', 'info')
    } catch (err) {
      showToast(err.message || 'Error al cancelar la reserva', 'error')
    }
  }

  const handleAddBooking = async (bookingData) => {
    try {
      const createdBooking = await api.createBooking(bookingData)
      setBookings((prev) => [...prev, createdBooking])
      showToast('Reserva creada. Completá el pago para confirmarla.', 'success')
    } catch (err) {
      showToast(err.message || 'Error al registrar la reserva', 'error')
    }
  }

  const handleUserUpdate = (user) => {
    setCurrentUser(user)
  }

  const handleRequestPayment = (booking) => {
    setPaymentBooking(booking)
  }

  const handlePaymentSuccess = ({ booking }) => {
    setBookings((prev) => prev.map((b) => (b.id === booking.id ? booking : b)))
    setPaymentBooking(null)
  }

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme === 'dark' ? '#050505' : '#fcfcfd',
        color: theme === 'dark' ? '#f3f4f6' : '#111827',
        fontFamily: 'Outfit, sans-serif',
        fontSize: '1.2rem',
        fontWeight: '600',
      }}>
        <span className="material-symbols-outlined" style={{
          marginRight: '0.6rem',
          fontSize: '2rem',
          animation: 'spin 1.5s linear infinite',
          color: '#2ECC71',
        }}>sports_soccer</span>
        Cargando Gol Ahora...
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <>
      {currentUser && (
        <Header
          currentUser={currentUser}
          onLogout={handleLogout}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onGoToPortal={() => setCurrentView('portal')}
          onOpenProfile={() => setIsProfileOpen(true)}
        />
      )}

      <main className={currentUser ? 'app-container' : ''}>
        {!currentUser ? (
          <Auth
            onLoginSuccess={handleLogin}
            showToast={showToast}
            theme={theme}
            onToggleTheme={handleToggleTheme}
          />
        ) : (
          <>
            {currentView === 'portal' && (
              <Portal currentUser={currentUser} onViewChange={setCurrentView} />
            )}
            {currentView === 'dashboard' && (
              <Dashboard
                bookings={bookings}
                courts={courts}
                onDeleteBooking={handleDeleteBooking}
                onUpdateBookingStatus={handleUpdateBookingStatus}
                onOpenBooking={() => setIsBookingOpen(true)}
                onRequestPayment={handleRequestPayment}
              />
            )}
            {currentView === 'attendance' && (
              <Attendance
                currentUser={currentUser}
                onBackToPortal={() => setCurrentView('portal')}
                showToast={showToast}
              />
            )}
            {currentView === 'competitions' && (
              <Competitions
                currentUser={currentUser}
                bookings={bookings}
                onBackToPortal={() => setCurrentView('portal')}
                onDeleteBooking={handleDeleteBooking}
              />
            )}
            {currentView === 'admin_users' && (
              <AdminUsers
                currentUser={currentUser}
                onBackToPortal={() => setCurrentView('portal')}
                onRefreshBookings={handleRefreshBookings}
                showToast={showToast}
              />
            )}
            {currentView === 'catalog' && (
              <CatalogExplorer
                onBackToPortal={() => setCurrentView('portal')}
                showToast={showToast}
              />
            )}
            {currentView === 'admin_calendar' && (
              <AdminCalendar
                bookings={bookings}
                courts={courts}
                onAddBooking={handleAddBooking}
                onDeleteBooking={handleDeleteBooking}
                onBackToPortal={() => setCurrentView('portal')}
                showToast={showToast}
              />
            )}
          </>
        )}
      </main>

      {isBookingOpen && currentUser && (
        <BookingDrawer
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          currentUser={currentUser}
          courts={courts}
          allBookings={bookings}
          onAddBooking={handleAddBooking}
        />
      )}

      {isProfileOpen && currentUser && (
        <ProfileModal
          currentUser={currentUser}
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          onUserUpdate={handleUserUpdate}
          showToast={showToast}
        />
      )}

      {paymentBooking && currentUser && (
        <PaymentModal
          booking={paymentBooking}
          currentUser={currentUser}
          onClose={() => setPaymentBooking(null)}
          onPaymentSuccess={handlePaymentSuccess}
          showToast={showToast}
        />
      )}

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast((prev) => ({ ...prev, show: false }))}
        />
      )}
    </>
  )
}

export default App
