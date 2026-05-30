import React, { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api.js'
import { matchesStudentSearch } from '../utils/bookingRules.js'
function studentDisplayName(student) {
  const full = [student.firstName, student.lastName].filter(Boolean).join(' ').trim()
  return full || student.name || 'Alumno'
}

function Attendance({ currentUser, onBackToPortal, showToast }) {
  const [view, setView] = useState('take')
  const [classes, setClasses] = useState([])
  const [historial, setHistorial] = useState([])
  const [historialLoading, setHistorialLoading] = useState(false)
  const [historialSearch, setHistorialSearch] = useState('')
  const [professor, setProfessor] = useState(null)
  const [selectedClassId, setSelectedClassId] = useState('')
  const [students, setStudents] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const instructor = professor || currentUser
  const professorId =
    currentUser.role === 'profesional' && currentUser.id ? currentUser.id : null

  const loadClasses = useCallback(async () => {
    const classData = await api.getClasses(professorId)
    setClasses(classData)
    return classData
  }, [professorId])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const tasks = [loadClasses()]
        if (professorId) {
          tasks.push(api.getProfessor(professorId))
        }
        const [classData, profData] = await Promise.all(tasks)
        if (cancelled) return
        if (profData) setProfessor(profData)
        if (classData.length > 0) {
          const firstId = classData[0].id
          setSelectedClassId(firstId)
          setStudents(classData[0].students.map((s) => ({ ...s })))
        } else {
          setSelectedClassId('')
          setStudents([])
        }
      } catch (err) {
        if (!cancelled) showToast(err.message || 'Error al cargar datos', 'error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [loadClasses, professorId])

  const loadHistorial = useCallback(async () => {
    setHistorialLoading(true)
    try {
      const rows = await api.getAsistencias()
      setHistorial(rows)
    } catch (err) {
      showToast(err.message || 'Error al cargar historial', 'error')
    } finally {
      setHistorialLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    if (view === 'historial') loadHistorial()
  }, [view, loadHistorial])

  const selectedClass = classes.find((c) => c.id === selectedClassId)
  const handleClassChange = (classId) => {
    setSelectedClassId(classId)
    const cls = classes.find((c) => c.id === classId)
    if (cls) {
      setStudents(cls.students.map((s) => ({ ...s })))
      setSearchTerm('')
    }
  }

  const setPresent = (studentId, present, event) => {
    event?.preventDefault()
    event?.stopPropagation()
    setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, present } : s)))
  }

  const filteredStudents = students.filter((st) => matchesStudentSearch(st, searchTerm))

  const presentCount = students.filter((s) => s.present).length
  const totalStudents = students.length
  const attendancePercentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0
  const cupoLleno = totalStudents >= (selectedClass?.maxStudents || 0)

  const handleSave = async () => {
    if (!selectedClassId) return
    setSaving(true)
    try {
      await api.saveAttendance(selectedClassId, students)
      const updated = await loadClasses()
      const refreshed = updated.find((c) => c.id === selectedClassId)
      if (refreshed) {
        setStudents(refreshed.students.map((s) => ({ ...s })))
      }
      showToast('Asistencia guardada correctamente.', 'success')
    } catch (err) {
      showToast(err.message || 'No se pudo guardar la asistencia', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading && view !== 'historial') {
    return (
      <div className="attendance-page">
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>Cargando clases...</p>
      </div>
    )
  }

  if (classes.length === 0 && view !== 'historial') {
    return (
      <div className="attendance-page">
        <div className="attendance-top">
          <button type="button" className="btn btn-outline" onClick={onBackToPortal}>
            <span className="material-symbols-outlined">arrow_back</span>
            Volver
          </button>
          <div className="admin-tabs" style={{ margin: 0 }}>
            <button type="button" className="admin-tab" onClick={() => setView('historial')}>
              Historial
            </button>
          </div>
        </div>
        <div className="bookings-list-empty" style={{ marginTop: '2rem' }}>
          <span className="material-symbols-outlined">school</span>
          <p>
            {currentUser.role === 'profesional'
              ? 'No tenés clases asignadas como profesor en el sistema.'
              : 'No hay clases de entrenamiento cargadas.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="attendance-page">
      <div className="attendance-top">
        <button type="button" className="btn btn-outline" onClick={onBackToPortal}>
          <span className="material-symbols-outlined">arrow_back</span>
          Volver
        </button>
        <div className="admin-tabs" style={{ margin: 0 }}>
          <button type="button" className={`admin-tab ${view === 'take' ? 'active' : ''}`} onClick={() => setView('take')}>
            Tomar lista
          </button>
          <button type="button" className={`admin-tab ${view === 'historial' ? 'active' : ''}`} onClick={() => setView('historial')}>
            Historial
          </button>
        </div>
      </div>

      {view === 'historial' ? (
        <div className="attendance-card">
          <h2>Historial de asistencias</h2>
          <input
            type="search"
            className="admin-search"
            placeholder="Buscar alumno o clase..."
            value={historialSearch}
            onChange={(e) => setHistorialSearch(e.target.value)}
          />
          {historialLoading ? (
            <p className="admin-muted">Cargando historial...</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Alumno</th>
                    <th>Clase</th>
                    <th>Horario clase</th>
                    <th>Estado</th>
                    <th>Registrado</th>
                  </tr>
                </thead>
                <tbody>
                  {historial
                    .filter((r) => {
                      const q = historialSearch.toLowerCase()
                      if (!q) return true
                      return (
                        r.alumnoName?.toLowerCase().includes(q) ||
                        r.claseName?.toLowerCase().includes(q)
                      )
                    })
                    .map((r) => (
                      <tr key={r.id}>
                        <td>{r.alumnoName}</td>
                        <td>{r.claseName}</td>
                        <td>{r.claseHorarioLabel}</td>
                        <td>
                          <span className={`admin-badge ${r.present ? 'ok' : 'muted'}`}>
                            {r.estado}
                          </span>
                        </td>
                        <td>{r.fechaRegistroLabel}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {historial.length === 0 && <p className="admin-muted">Sin registros de asistencia.</p>}
            </div>
          )}
        </div>
      ) : (
      <>
      <span className="attendance-instructor" style={{ display: 'block', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Instructor: <strong>{instructor.name}</strong>
          {professor?.certificacion && professor.certificacion !== '—' && (
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
              Certificación: {professor.certificacion}
            </span>
          )}
      </span>

      <div className="attendance-card">
        <div className="attendance-title-row">
          <span className="material-symbols-outlined">checklist</span>
          <h2>Tomar Asistencia</h2>
        </div>

        {instructor.certificacionVigente === false && (
          <div className="attendance-warning">
            <span className="material-symbols-outlined">warning</span>
            Certificación deportiva no vigente. No podrías dictar clases en producción.
          </div>
        )}

        <div className="attendance-toolbar">
          <div className="attendance-select-wrap">
            <label htmlFor="class-select">Clase activa</label>
            <select
              id="class-select"
              value={selectedClassId}
              onChange={(e) => handleClassChange(e.target.value)}
            >
              {classes.map((cl) => (
                <option key={cl.id} value={cl.id}>
                  {cl.name} — {cl.schedule}
                </option>
              ))}
            </select>
            {selectedClass && (
              <span className="attendance-cupo">
                Cupo: {totalStudents}/{selectedClass.maxStudents} alumnos
                {cupoLleno && ' · CUPO COMPLETO'}
              </span>
            )}
          </div>
          <div className="attendance-stat">
            <strong>{attendancePercentage}%</strong>
            <span>Presentes {presentCount}/{totalStudents}</span>
            <div className="attendance-stat-bar">
              <div style={{ width: `${attendancePercentage}%` }} />
            </div>
          </div>
        </div>

        <div className="bookings-search-wrap" style={{ marginBottom: '1rem' }}>
          <span className="material-symbols-outlined">search</span>
          <input
            type="search"
            placeholder="Buscar por nombre o apellido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="attendance-students">
          {filteredStudents.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
              No hay alumnos que coincidan con la búsqueda.
            </p>
          ) : (
            filteredStudents.map((student) => (
              <div key={student.id} className="attendance-student-row">
                <div>
                  <strong>{studentDisplayName(student)}</strong>
                  {student.email ? (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{student.email}</div>
                  ) : null}
                </div>
                <div className="attendance-toggle-group">
                  <button
                    type="button"
                    className={`attendance-toggle ${student.present ? 'on' : ''}`}
                    onClick={(e) => setPresent(student.id, true, e)}
                  >
                    Presente
                  </button>
                  <button
                    type="button"
                    className={`attendance-toggle absent ${!student.present ? 'on' : ''}`}
                    onClick={(e) => setPresent(student.id, false, e)}
                  >
                    Ausente
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="attendance-footer">
          <button type="button" className="btn btn-outline" onClick={onBackToPortal}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <span className="material-symbols-outlined">save</span>
            {saving ? 'Guardando...' : 'Guardar asistencia'}
          </button>
        </div>
      </div>
      </>
      )}
    </div>
  )
}

export default Attendance
