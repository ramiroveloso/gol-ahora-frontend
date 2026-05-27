import React, { useState, useEffect } from 'react'
import { api } from '../services/api.js'
import { matchesStudentSearch } from '../utils/bookingRules.js'

function Attendance({ currentUser, onBackToPortal, showToast }) {
  const [classes, setClasses] = useState([])
  const [professor, setProfessor] = useState(null)
  const [selectedClassId, setSelectedClassId] = useState('')
  const [students, setStudents] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const instructor = professor || currentUser

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const classPromise =
          currentUser.role === 'profesional' && currentUser.id
            ? api.getClasses(currentUser.id)
            : api.getClasses()
        const tasks = [classPromise]
        if (currentUser.role === 'profesional' && currentUser.id) {
          tasks.push(api.getProfessor(currentUser.id))
        }
        const [classData, profData] = await Promise.all(tasks)
        setClasses(classData)
        if (profData) setProfessor(profData)
        if (classData.length > 0) {
          setSelectedClassId(classData[0].id)
          setStudents(classData[0].students.map((s) => ({ ...s })))
        }
      } catch (err) {
        showToast(err.message || 'Error al cargar datos', 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [currentUser.id, currentUser.role, currentUser.email])

  const selectedClass = classes.find((c) => c.id === selectedClassId)

  useEffect(() => {
    if (selectedClass) {
      setStudents(selectedClass.students.map((s) => ({ ...s })))
      setSearchTerm('')
    }
  }, [selectedClassId, classes])

  const setPresent = (studentId, present) => {
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
      const updated = await api.getClasses()
      setClasses(updated)
      showToast('Asistencia guardada correctamente.', 'success')
      onBackToPortal()
    } catch (err) {
      showToast(err.message || 'No se pudo guardar la asistencia', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="attendance-page">
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>Cargando clases...</p>
      </div>
    )
  }

  if (classes.length === 0) {
    return (
      <div className="attendance-page">
        <button type="button" className="btn btn-outline" onClick={onBackToPortal}>
          <span className="material-symbols-outlined">arrow_back</span>
          Volver
        </button>
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
        <span className="attendance-instructor">
          Instructor: <strong>{instructor.name}</strong>
          {professor?.certificacion && professor.certificacion !== '—' && (
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
              Certificación: {professor.certificacion}
            </span>
          )}
        </span>
      </div>

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
              onChange={(e) => setSelectedClassId(e.target.value)}
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
          {filteredStudents.map((student) => (
            <div key={student.id} className="attendance-student-row">
              <div>
                <strong>{student.name}</strong>
                {student.email ? (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{student.email}</div>
                ) : null}
              </div>
              <div className="attendance-toggle-group">
                <button
                  type="button"
                  className={`attendance-toggle ${student.present ? 'on' : ''}`}
                  onClick={() => setPresent(student.id, true)}
                >
                  Presente
                </button>
                <button
                  type="button"
                  className={`attendance-toggle absent ${!student.present ? 'on' : ''}`}
                  onClick={() => setPresent(student.id, false)}
                >
                  Ausente
                </button>
              </div>
            </div>
          ))}
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
    </div>
  )
}

export default Attendance
