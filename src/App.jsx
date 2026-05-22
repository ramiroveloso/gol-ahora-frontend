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
import ProfileModal from './components/ProfileModal.jsx'
import { api } from './services/api.js'

// ==========================================================================
// STATIC DATA SYSTEMS
// ==========================================================================
export const COURTS = [
  {
    id: 'court-1',
    name: 'Camp Nou Synthetic',
    type: 'Fútbol 11',
    turf: 'Césped Sintético',
    roofed: false,
    pricePerHour: 45,
    rating: '4.9',
    icon: 'sports_soccer'
  },
  {
    id: 'court-2',
    name: 'Sintética Pro',
    type: 'Fútbol 7',
    turf: 'Césped Sintético A1',
    roofed: false,
    pricePerHour: 35,
    rating: '4.8',
    icon: 'grass'
  },
  {
    id: 'court-3',
    name: 'La Bombonera Techada',
    type: 'Fútbol 5',
    turf: 'Césped Sintético',
    roofed: true,
    pricePerHour: 30,
    rating: '4.7',
    icon: 'roofing'
  },
  {
    id: 'court-4',
    name: 'Maracaná Arena',
    type: 'Fútbol 5',
    turf: 'Parquet Profesional',
    roofed: true,
    pricePerHour: 28,
    rating: '4.6',
    icon: 'domain'
  }
];

export const TIME_SLOTS = [
  "08:00 - 09:00", "09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00",
  "12:00 - 13:00", "13:00 - 14:00", "14:00 - 15:00", "15:00 - 16:00",
  "16:00 - 17:00", "17:00 - 18:00", "18:00 - 19:00", "19:00 - 20:00",
  "20:00 - 21:00", "21:00 - 22:00"
];

function App() {
  // Global States
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('portal');
  const [bookings, setBookings] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Sync theme to HTML data-theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Session verification on bootup (Recovers logged user using token)
  useEffect(() => {
    const fetchSession = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const user = await api.getMe()
          setCurrentUser(user)
        } catch (err) {
          // Token expired or server is off, clear token
          api.logout()
          setCurrentUser(null)
        }
      }
      setLoading(false)
    }
    fetchSession()
  }, []);

  // Fetch bookings when user logs in
  useEffect(() => {
    if (currentUser) {
      const fetchBookings = async () => {
        try {
          const data = await api.getBookings()
          setBookings(data)
        } catch (err) {
          showToast(err.message || 'Error al cargar reservas del servidor', 'error')
        }
      }
      fetchBookings()
    } else {
      setBookings([])
    }
  }, [currentUser]);

  // Dynamic toast triggering helper
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    showToast(`Modo ${nextTheme === 'dark' ? 'oscuro' : 'claro'} activado`, 'info');
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    setCurrentView('portal');
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setCurrentView('portal');
    showToast('Sesión cerrada correctamente', 'info');
  };

  const handleRefreshBookings = async () => {
    try {
      const data = await api.getBookings()
      setBookings(data)
    } catch (err) {
      showToast(err.message || 'Error al actualizar reservas', 'error')
    }
  };

  // REST API Actions for Bookings CRUD
  const handleUpdateBookingStatus = async (bookingId, nextStatus) => {
    try {
      await api.updateBookingStatus(bookingId, nextStatus)
      setBookings(prev => prev.map(b => {
        if (b.id === bookingId) {
          return { ...b, status: nextStatus };
        }
        return b;
      }));
      showToast('Reserva actualizada en el servidor', 'success')
    } catch (err) {
      showToast(err.message || 'Error al mover la reserva', 'error')
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    try {
      await api.deleteBooking(bookingId)
      setBookings(prev => prev.filter(b => b.id !== bookingId));
      showToast('Reserva eliminada con éxito', 'info');
    } catch (err) {
      showToast(err.message || 'Error al cancelar la reserva', 'error')
    }
  };

  const handleAddBooking = async (bookingData) => {
    try {
      const createdBooking = await api.createBooking(bookingData)
      setBookings(prev => [...prev, createdBooking]);
      showToast('¡Reserva registrada en el servidor!', 'success');
    } catch (err) {
      showToast(err.message || 'Error al registrar la reserva', 'error')
    }
  };

  // Wait loader to prevent Auth flashing while checking session
  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme === 'dark' ? '#101012' : '#f5f5f8',
        color: theme === 'dark' ? '#f3f4f6' : '#1f2937',
        fontFamily: 'Outfit, sans-serif',
        fontSize: '1.2rem',
        fontWeight: '500'
      }}>
        <span className="material-symbols-outlined sports-icon" style={{
          marginRight: '0.6rem',
          fontSize: '2rem'
        }}>sports_soccer</span>
        Cargando Gol Ahora...
      </div>
    )
  }

  return (
    <>
      <Header 
        currentUser={currentUser} 
        onLogout={handleLogout} 
        theme={theme} 
        onToggleTheme={handleToggleTheme} 
        onGoToPortal={() => setCurrentView('portal')}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      <main className="app-container">
        {!currentUser ? (
          <Auth onLoginSuccess={handleLogin} showToast={showToast} />
        ) : (
          <>
            {currentView === 'portal' && (
              <Portal 
                currentUser={currentUser} 
                onViewChange={setCurrentView} 
              />
            )}
            {currentView === 'dashboard' && (
              <Dashboard 
                bookings={bookings} 
                onDeleteBooking={handleDeleteBooking}
                onUpdateBookingStatus={handleUpdateBookingStatus}
                onOpenBooking={() => setIsBookingOpen(true)}
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
            {currentView === 'admin_calendar' && (
              <AdminCalendar 
                bookings={bookings}
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
          allBookings={bookings} // In API mode, we validate overlaps against active bookings
          onAddBooking={handleAddBooking}
        />
      )}

      {isProfileOpen && currentUser && (
        <ProfileModal 
          currentUser={currentUser}
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
        />
      )}

      {toast.show && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(prev => ({ ...prev, show: false }))} 
        />
      )}
    </>
  )
}

export default App
