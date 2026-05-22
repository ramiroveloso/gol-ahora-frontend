import React, { useState } from 'react'

function Attendance({ currentUser, onBackToPortal, showToast }) {
  // Mock classes led by this professional
  const classes = [
    { id: 'c1', name: 'Fútbol Avanzado - Lunes y Miércoles 19:00', sport: 'Fútbol 11', time: '19:00 - 20:30' },
    { id: 'c2', name: 'Entrenamiento Funcional y Resistencia - Martes 18:00', sport: 'Funcional', time: '18:00 - 19:30' },
    { id: 'c3', name: 'Táctica de Fútbol 5 y Juego Colectivo - Sábado 10:00', sport: 'Fútbol 5', time: '10:00 - 11:30' }
  ]

  const [selectedClass, setSelectedClass] = useState(classes[0].id)
  const [searchTerm, setSearchTerm] = useState('')

  // Mock list of signed up students (alumnos)
  const [students, setStudents] = useState({
    c1: [
      { id: 's1', name: 'Renzo Ramírez', email: 'rramirez@example.com', present: true, avatar: 'sports_soccer' },
      { id: 's2', name: 'Juan Manuel Dávalos', email: 'jmdavalos@example.com', present: false, avatar: 'person' },
      { id: 's3', name: 'Florencia Benítez', email: 'flor.b@example.com', present: true, avatar: 'person' },
      { id: 's4', name: 'Carlos Tévez', email: 'apache@example.com', present: true, avatar: 'sports_soccer' },
      { id: 's5', name: 'Mateo Messi', email: 'mateo.messi@example.com', present: false, avatar: 'person' }
    ],
    c2: [
      { id: 's6', name: 'Agustín Almendra', email: 'almendra@example.com', present: true, avatar: 'person' },
      { id: 's7', name: 'Sofía Martínez', email: 'sofia.m@example.com', present: true, avatar: 'person' },
      { id: 's8', name: 'Franco Armani', email: 'pulpo@example.com', present: false, avatar: 'sports_soccer' }
    ],
    c3: [
      { id: 's1', name: 'Renzo Ramírez', email: 'rramirez@example.com', present: true, avatar: 'sports_soccer' },
      { id: 's3', name: 'Florencia Benítez', email: 'flor.b@example.com', present: false, avatar: 'person' },
      { id: 's9', name: 'Luis Advíncula', email: 'rayo@example.com', present: true, avatar: 'sports_soccer' },
      { id: 's10', name: 'Marcos Rojo', email: 'capitan@example.com', present: true, avatar: 'person' }
    ]
  })

  // Handle toggling presence
  const togglePresence = (studentId) => {
    setStudents(prev => {
      const currentList = prev[selectedClass]
      const updatedList = currentList.map(st => 
        st.id === studentId ? { ...st, present: !st.present } : st
      )
      return {
        ...prev,
        [selectedClass]: updatedList
      }
    })
  }

  // Filter students based on search input
  const activeStudents = students[selectedClass] || []
  const filteredStudents = activeStudents.filter(st => 
    st.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    st.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Stats calculation
  const totalStudents = activeStudents.length
  const presentCount = activeStudents.filter(s => s.present).length
  const attendancePercentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0

  const handleSave = () => {
    showToast('Asistencia guardada correctamente en el sistema.', 'success')
    onBackToPortal()
  }

  return (
    <div style={{
      maxWidth: '850px',
      margin: '2rem auto',
      padding: '0 1.5rem',
      fontFamily: 'Outfit, sans-serif'
    }}>
      {/* Header section with back link */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button 
          onClick={onBackToPortal}
          className="btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            backgroundColor: 'transparent',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            padding: '0.5rem 0.8rem',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.85rem'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>arrow_back</span>
          <span>Volver al Portal</span>
        </button>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Instructor: <strong>{currentUser.name}</strong>
        </span>
      </div>

      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
      }}>
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <span className="material-symbols-outlined" style={{
            color: 'var(--accent-garnet)',
            fontSize: '2rem'
          }}>checklist</span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
            Tomar Asistencia
          </h2>
        </div>

        {/* Selection & Stats Area */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 200px',
          gap: '1.5rem',
          marginBottom: '2rem',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          padding: '1.2rem',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.03)'
        }}>
          <div>
            <label htmlFor="class-select" style={{
              display: 'block',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              marginBottom: '0.4rem',
              fontWeight: '600'
            }}>
              Seleccionar Clase Activa
            </label>
            <div style={{ position: 'relative' }}>
              <select 
                id="class-select" 
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value)
                  setSearchTerm('')
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem 2rem 0.75rem 1rem',
                  backgroundColor: 'var(--bg-body)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  appearance: 'none',
                  cursor: 'pointer'
                }}
              >
                {classes.map(cl => (
                  <option key={cl.id} value={cl.id}>{cl.name}</option>
                ))}
              </select>
              <span className="material-symbols-outlined" style={{
                position: 'absolute',
                right: '0.8rem',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: 'var(--text-muted)',
                fontSize: '1.2rem'
              }}>unfold_more</span>
            </div>
          </div>

          {/* Stats card */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            borderLeft: '1px solid var(--border-color)',
            paddingLeft: '1.5rem',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '1.6rem', fontWeight: '800', color: 'rgb(0, 200, 100)' }}>
              {attendancePercentage}%
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Presentes: <strong>{presentCount} / {totalStudents}</strong>
            </span>
            <div style={{
              width: '100%',
              height: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '2px',
              marginTop: '0.6rem',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${attendancePercentage}%`,
                height: '100%',
                backgroundColor: 'rgb(0, 180, 80)',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.8rem',
          marginBottom: '1.2rem',
          position: 'relative'
        }}>
          <span className="material-symbols-outlined" style={{
            position: 'absolute',
            left: '0.8rem',
            color: 'var(--text-muted)',
            fontSize: '1.1rem'
          }}>search</span>
          <input 
            type="text" 
            placeholder="Buscar alumno por nombre o correo..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 1rem 0.6rem 2.2rem',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          />
        </div>

        {/* Students list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '2rem' }}>
          {filteredStudents.length > 0 ? (
            filteredStudents.map(student => (
              <div 
                key={student.id} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'rgba(255, 255, 255, 0.01)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '0.8rem 1.2rem',
                  transition: 'all 0.2s'
                }}
              >
                {/* Student Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: student.present ? 'rgba(0, 180, 80, 0.08)' : 'rgba(218, 25, 60, 0.08)',
                    border: student.present ? '1px solid rgb(0, 160, 60)' : '1px solid var(--accent-garnet)',
                    color: student.present ? 'rgb(0, 180, 80)' : 'var(--accent-garnet)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>
                      {student.avatar}
                    </span>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '600', margin: 0, color: 'var(--text-main)' }}>
                      {student.name}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {student.email}
                    </span>
                  </div>
                </div>

                {/* Attendance Toggles */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => togglePresence(student.id)}
                    className="btn"
                    style={{
                      padding: '0.4rem 0.8rem',
                      fontSize: '0.75rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.2rem',
                      backgroundColor: student.present ? 'rgba(0, 180, 80, 0.12)' : 'transparent',
                      border: student.present ? '1px solid rgb(0, 180, 80)' : '1px solid var(--border-color)',
                      color: student.present ? 'rgb(0, 200, 100)' : 'var(--text-muted)',
                      fontWeight: '600',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>check_circle</span>
                    Presente
                  </button>
                  <button
                    onClick={() => togglePresence(student.id)}
                    className="btn"
                    style={{
                      padding: '0.4rem 0.8rem',
                      fontSize: '0.75rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.2rem',
                      backgroundColor: !student.present ? 'rgba(218, 25, 60, 0.12)' : 'transparent',
                      border: !student.present ? '1px solid var(--accent-garnet)' : '1px solid var(--border-color)',
                      color: !student.present ? 'var(--accent-garnet)' : 'var(--text-muted)',
                      fontWeight: '600',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>cancel</span>
                    Ausente
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '2.5rem 1rem',
              color: 'var(--text-muted)',
              border: '1px dashed var(--border-color)',
              borderRadius: '10px'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '2.2rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>person_search</span>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>No se encontraron alumnos coincidentes en esta clase.</p>
            </div>
          )}
        </div>

        {/* Action button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          <button 
            onClick={onBackToPortal}
            className="btn"
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            className="btn btn-primary"
            style={{
              padding: '0.6rem 1.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.15rem' }}>save</span>
            <span>Guardar Asistencia</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Attendance
