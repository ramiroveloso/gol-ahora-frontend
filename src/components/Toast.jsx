import React, { useState, useEffect } from 'react'

function Toast({ message, type = 'success', onClose }) {
  const [isHiding, setIsHiding] = useState(false)

  useEffect(() => {
    // Slide out animation starts at 2.7s
    const startHideTimeout = setTimeout(() => {
      setIsHiding(true)
    }, 2700)

    // Triggers actual close callback at 3s (after 300ms animation finishes)
    const closeTimeout = setTimeout(() => {
      onClose()
    }, 3000)

    return () => {
      clearTimeout(startHideTimeout)
      clearTimeout(closeTimeout)
    }
  }, [message, onClose])

  // Icon selector based on state type
  const getIcon = () => {
    switch (type) {
      case 'success': return 'check_circle'
      case 'error': return 'warning'
      default: return 'info'
    }
  }

  // Border and Icon color styling override based on type
  const getBorderColorStyle = () => {
    if (type === 'success') return { borderLeftColor: 'var(--accent-garnet)' }
    if (type === 'error') return { borderLeftColor: '#ef4444' }
    return { borderLeftColor: 'var(--text-muted)' }
  }

  const getIconColorStyle = () => {
    if (type === 'success') return { color: 'var(--accent-garnet)' }
    if (type === 'error') return { color: '#ef4444' }
    return { color: 'var(--text-muted)' }
  }

  return (
    <div 
      className={`toast ${isHiding ? 'hiding' : ''}`} 
      style={getBorderColorStyle()}
    >
      <span className="material-symbols-outlined toast-icon" style={getIconColorStyle()}>
        {getIcon()}
      </span>
      <span className="toast-message">{message}</span>
    </div>
  )
}

export default Toast
