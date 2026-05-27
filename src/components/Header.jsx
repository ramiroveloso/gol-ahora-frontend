import React from 'react'
import { isMockMode } from '../services/api.js'

function Header({ currentUser, onLogout, theme, onToggleTheme, onGoToPortal, onOpenProfile }) {
  return (
    <header className="main-header">
      <div className="header-container">
        <div className="logo" onClick={currentUser ? onGoToPortal : undefined} style={{ cursor: currentUser ? 'pointer' : 'default' }}>
          <span className="material-symbols-outlined sports-icon">sports_soccer</span>
          <h1>GOL<span className="accent">AHORA</span></h1>
        </div>
        
        <div className="header-actions">
          {isMockMode && (
            <span
              title="Datos en localStorage — backend pendiente"
              style={{
                fontSize: '0.65rem',
                fontWeight: 600,
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                backgroundColor: 'rgba(46, 204, 113, 0.15)',
                color: '#2ECC71',
                border: '1px solid rgba(46, 204, 113, 0.35)',
                letterSpacing: '0.04em',
              }}
            >
              MODO DEMO
            </span>
          )}
          {/* Theme toggle button */}
          <button 
            id="theme-toggle" 
            className="icon-btn" 
            onClick={onToggleTheme} 
            title="Cambiar Tema" 
            aria-label="Cambiar Tema"
          >
            {theme === 'dark' ? (
              <span className="material-symbols-outlined theme-icon-dark">dark_mode</span>
            ) : (
              <span className="material-symbols-outlined theme-icon-light">light_mode</span>
            )}
          </button>
          
          {/* Logged User Info */}
          {currentUser && (
            <div id="user-profile" className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <button 
                className="btn" 
                style={{ 
                  padding: '0.4rem 0.6rem', 
                  fontSize: '0.75rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.2rem', 
                  backgroundColor: 'rgba(46, 204, 113, 0.1)', 
                  border: '1px solid var(--accent-garnet)', 
                  color: 'var(--text-main)', 
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
                onClick={onGoToPortal}
                title="Volver al Portal"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.05rem' }}>home</span>
                <span>Inicio</span>
              </button>
              
              <div 
                onClick={onOpenProfile}
                title="Ver Mi Perfil"
                className="header-profile-trigger"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.4rem',
                  cursor: 'pointer',
                  padding: '0.3rem 0.5rem',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid transparent'
                }}
              >
                <span className="material-symbols-outlined user-avatar">account_circle</span>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: '1.2' }}>
                  <span id="user-display-name" className="user-name" style={{ fontSize: '0.85rem', fontWeight: '600' }}>{currentUser.name}</span>
                  <span className="role-tag" style={{ 
                    fontSize: '0.6rem', 
                    padding: '0.05rem 0.3rem', 
                    borderRadius: '4px', 
                    textTransform: 'uppercase', 
                    backgroundColor: currentUser.role === 'administrador' ? 'var(--accent-garnet)' : currentUser.role === 'profesional' ? '#0070f3' : '#00a000', 
                    color: '#fff', 
                    fontWeight: '700' 
                  }}>
                    {currentUser.role || 'cliente'}
                  </span>
                </div>
              </div>
              
              <button 
                id="logout-btn" 
                className="text-btn" 
                onClick={onLogout} 
                title="Cerrar Sesión"
              >
                <span className="material-symbols-outlined">logout</span>
                <span>Salir</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
