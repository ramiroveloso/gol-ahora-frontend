import React, { useCallback, useEffect, useState } from 'react'
import { api } from '../services/api.js'

const TIPO_CLASE_OPTIONS = [
  { value: 'FUNCIONAL', label: 'Funcional' },
  { value: 'FUTBOL', label: 'Fútbol' },
  { value: 'PADDLE', label: 'Paddle' },
  { value: 'PERSONALIZADO', label: 'Personalizado' },
]

const EMPTY_FORM = {
  profesorId: '',
  canchaId: '',
  horarioInput: '',
  maximo_alumnos: '12',
  tipo_clase: 'FUTBOL',
}

function AdminClasses({ onBackToPortal, showToast }) {
  const [classes, setClasses] = useState([])
  const [professors, setProfessors] = useState([])
  const [courts, setCourts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [cls, profs, cts] = await Promise.all([
        api.getAllClasses(),
        api.getProfessors(),
        api.getCourts(),
      ])
      setClasses(cls)
      setProfessors(profs)
      setCourts(cts)
    } catch (err) {
      showToast(err.message || 'Error al cargar clases', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setForm({
      ...EMPTY_FORM,
      profesorId: professors[0]?.id || '',
      canchaId: courts[0]?.id || '',
    })
    setModal({ mode: 'create' })
  }

  const openEdit = (cls) => {
    setForm({
      profesorId: cls.profesorId || '',
      canchaId: cls.canchaId || '',
      horarioInput: cls.horarioInput || '',
      maximo_alumnos: String(cls.maxStudents || 12),
      tipo_clase: cls.tipoClase || 'FUTBOL',
    })
    setModal({ mode: 'edit', id: cls.id })
  }

  const handleSave = async () => {
    if (!form.profesorId || !form.horarioInput) {
      showToast('Completá profesor y horario.', 'error')
      return
    }
    const horarioMs = new Date(form.horarioInput).getTime()
    if (!Number.isFinite(horarioMs)) {
      showToast('Horario inválido.', 'error')
      return
    }
    setSaving(true)
    try {
      const payload = {
        profesorId: form.profesorId,
        canchaId: form.canchaId || null,
        horarioMs,
        maximo_alumnos: form.maximo_alumnos,
        tipo_clase: form.tipo_clase,
      }
      if (modal.mode === 'create') {
        await api.createClass(payload)
        showToast('Clase creada.', 'success')
      } else {
        await api.updateClass(modal.id, payload)
        showToast('Clase actualizada.', 'success')
      }
      setModal(null)
      await load()
    } catch (err) {
      showToast(err.message || 'No se pudo guardar la clase', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    setSaving(true)
    try {
      await api.deleteClass(id)
      showToast('Clase eliminada.', 'info')
      setConfirmDeleteId(null)
      await load()
    } catch (err) {
      showToast(err.message || 'No se pudo eliminar', 'error')
    } finally {
      setSaving(false)
    }
  }

  const q = search.toLowerCase()
  const filtered = classes.filter(
    (c) =>
      c.name?.toLowerCase().includes(q) ||
      c.schedule?.toLowerCase().includes(q) ||
      professors.find((p) => p.id === c.profesorId)?.name?.toLowerCase().includes(q),
  )

  return (
    <div className="admin-page">
      <div className="admin-page-top">
        <button type="button" className="btn btn-outline" onClick={onBackToPortal}>
          <span className="material-symbols-outlined">arrow_back</span>
          Volver al Portal
        </button>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <span className="material-symbols-outlined">add</span>
          Nueva clase
        </button>
      </div>

      <div className="admin-card">
        <h2>Gestión de clases</h2>
        <p className="admin-card-desc">Alta, edición y baja de clases de entrenamiento.</p>

        <input
          type="search"
          className="admin-search"
          placeholder="Buscar por tipo, horario o profesor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {loading ? (
          <p className="admin-muted">Cargando clases...</p>
        ) : filtered.length === 0 ? (
          <p className="admin-muted">No hay clases registradas.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Horario</th>
                  <th>Profesor</th>
                  <th>Cancha</th>
                  <th>Cupo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((cls) => {
                  const prof = professors.find((p) => p.id === cls.profesorId)
                  const court = courts.find((c) => c.id === cls.canchaId)
                  return (
                    <tr key={cls.id}>
                      <td>{cls.name}</td>
                      <td>{cls.schedule}</td>
                      <td>{prof?.name || cls.profesorId}</td>
                      <td>{court?.name || '—'}</td>
                      <td>{cls.students?.length || 0}/{cls.maxStudents}</td>
                      <td className="admin-actions-cell">
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => openEdit(cls)}>
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm btn-danger"
                          onClick={() => setConfirmDeleteId(cls.id)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && setModal(null)}>
          <div className="modal-drawer admin-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modal.mode === 'create' ? 'Nueva clase' : 'Editar clase'}</h3>
              <button type="button" className="icon-btn" onClick={() => setModal(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="admin-form-grid">
              <div className="form-group">
                <label>Tipo de clase</label>
                <select value={form.tipo_clase} onChange={(e) => setForm((f) => ({ ...f, tipo_clase: e.target.value }))}>
                  {TIPO_CLASE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Profesor</label>
                <select value={form.profesorId} onChange={(e) => setForm((f) => ({ ...f, profesorId: e.target.value }))}>
                  <option value="">Seleccionar...</option>
                  {professors.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Cancha (opcional)</label>
                <select value={form.canchaId} onChange={(e) => setForm((f) => ({ ...f, canchaId: e.target.value }))}>
                  <option value="">Sin cancha</option>
                  {courts.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Horario</label>
                <input
                  type="datetime-local"
                  value={form.horarioInput}
                  onChange={(e) => setForm((f) => ({ ...f, horarioInput: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Máximo alumnos</label>
                <input
                  type="number"
                  min="1"
                  value={form.maximo_alumnos}
                  onChange={(e) => setForm((f) => ({ ...f, maximo_alumnos: e.target.value }))}
                />
              </div>
            </div>
            <div className="admin-form-footer">
              <button type="button" className="btn btn-outline" onClick={() => setModal(null)}>Cancelar</button>
              <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && setConfirmDeleteId(null)}>
          <div className="modal-drawer admin-form-modal" onClick={(e) => e.stopPropagation()}>
            <p>¿Eliminar la clase #{confirmDeleteId}? También se eliminarán sus registros de asistencia.</p>
            <div className="admin-form-footer">
              <button type="button" className="btn btn-outline" onClick={() => setConfirmDeleteId(null)}>Cancelar</button>
              <button type="button" className="btn btn-primary btn-danger" onClick={() => handleDelete(confirmDeleteId)} disabled={saving}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminClasses
