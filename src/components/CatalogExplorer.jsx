import React, { useState, useEffect } from 'react'
import { api } from '../services/api.js'

const COURT_TYPE_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'FUTBOL_5', label: 'Fútbol 5' },
  { value: 'FUTBOL_7', label: 'Fútbol 7' },
  { value: 'FUTBOL_11', label: 'Fútbol 11' },
  { value: 'PADDLE', label: 'Paddle' },
  { value: 'TENIS', label: 'Tenis' },
]

const TIPO_CANCHA_OPTIONS = COURT_TYPE_FILTERS.filter((o) => o.value)
const SUPERFICIE_OPTIONS = [
  { value: 'CESPED_SINTETICO', label: 'Césped sintético' },
  { value: 'CESPED_NATURAL', label: 'Césped natural' },
  { value: 'CEMENTO', label: 'Cemento' },
  { value: 'POLVO_LADRILLO', label: 'Polvo de ladrillo' },
]

const TABS = [
  { id: 'courts', label: 'Canchas', icon: 'stadium' },
  { id: 'professors', label: 'Profesores', icon: 'school' },
  { id: 'users', label: 'Usuarios', icon: 'groups' },
]

const EMPTY_COURT = {
  numero: '',
  tipo_cancha: 'FUTBOL_5',
  superficie: 'CESPED_SINTETICO',
  capacidad: '10',
  precio_base_hora: '',
  duracion_maxima_reserva: '120',
  estado_disponibilidad: true,
  activa: true,
}

function CatalogExplorer({ onBackToPortal, showToast, onCourtsChanged }) {
  const [tab, setTab] = useState('courts')
  const [courts, setCourts] = useState([])
  const [professors, setProfessors] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [courtTipoFilter, setCourtTipoFilter] = useState('')
  const [courtModal, setCourtModal] = useState(null)
  const [courtForm, setCourtForm] = useState(EMPTY_COURT)
  const [saving, setSaving] = useState(false)
  const [confirmDeleteCourtId, setConfirmDeleteCourtId] = useState(null)

  const loadAll = async (tipoCancha = courtTipoFilter) => {
    setLoading(true)
    try {
      const [c, p, u] = await Promise.all([
        api.getCourts(tipoCancha ? { tipo_cancha: tipoCancha } : {}),
        api.getProfessors(),
        api.adminGetUsers(),
      ])
      setCourts(c)
      setProfessors(p)
      setUsers(u)
    } catch (err) {
      showToast(err.message || 'Error al cargar catálogo', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  useEffect(() => {
    if (tab === 'courts') loadAll(courtTipoFilter)
  }, [courtTipoFilter])

  const openCreateCourt = () => {
    setCourtForm({ ...EMPTY_COURT })
    setCourtModal({ mode: 'create' })
  }

  const openEditCourt = (c) => {
    setCourtForm({
      numero: String(c.numero ?? c.id),
      tipo_cancha: c.tipoCancha || 'FUTBOL_5',
      superficie: c.rawSuperficie || 'CESPED_SINTETICO',
      capacidad: String(c.capacidad || 10),
      precio_base_hora: String(c.pricePerHour || ''),
      duracion_maxima_reserva: String(c.maxDurationMinutes || 120),
      estado_disponibilidad: c.estadoDisponibilidad !== false,
      activa: c.activa !== false,
    })
    setCourtModal({ mode: 'edit', id: c.id })
  }

  const handleSaveCourt = async () => {
    if (!courtForm.numero || !courtForm.precio_base_hora) {
      showToast('Completá número y precio por hora.', 'error')
      return
    }
    setSaving(true)
    try {
      if (courtModal.mode === 'create') {
        await api.createCourt(courtForm)
        showToast('Cancha creada.', 'success')
      } else {
        await api.updateCourt(courtModal.id, courtForm)
        showToast('Cancha actualizada.', 'success')
      }
      setCourtModal(null)
      await loadAll(courtTipoFilter)
      onCourtsChanged?.()
    } catch (err) {
      showToast(err.message || 'No se pudo guardar la cancha', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCourt = async (id) => {
    setSaving(true)
    try {
      await api.deleteCourt(id)
      showToast('Cancha eliminada.', 'info')
      setConfirmDeleteCourtId(null)
      await loadAll(courtTipoFilter)
      onCourtsChanged?.()
    } catch (err) {
      showToast(err.message || 'No se pudo eliminar', 'error')
    } finally {
      setSaving(false)
    }
  }

  const q = search.toLowerCase()

  const filteredCourts = courts.filter(
    (c) =>
      c.name?.toLowerCase().includes(q) ||
      c.type?.toLowerCase().includes(q) ||
      c.turf?.toLowerCase().includes(q),
  )

  const filteredProfessors = professors.filter(
    (p) =>
      p.name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.certificacion?.toLowerCase().includes(q),
  )

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q),
  )

  return (
    <div className="admin-page">
      <div className="admin-page-top">
        <button type="button" className="btn btn-outline" onClick={onBackToPortal}>
          <span className="material-symbols-outlined">arrow_back</span>
          Volver al Portal
        </button>
        {tab === 'courts' && (
          <button type="button" className="btn btn-primary" onClick={openCreateCourt}>
            <span className="material-symbols-outlined">add</span>
            Nueva cancha
          </button>
        )}
      </div>

      <div className="admin-card">
        <h2>Catálogo del sistema</h2>
        <p className="admin-card-desc">
          Consulta y gestión de canchas. Profesores y usuarios en modo consulta.
        </p>

        {tab === 'courts' && (
          <div className="form-group" style={{ marginBottom: '1rem', maxWidth: 280 }}>
            <label htmlFor="catalog-court-filter">Tipo de cancha</label>
            <select
              id="catalog-court-filter"
              value={courtTipoFilter}
              onChange={(e) => setCourtTipoFilter(e.target.value)}
              className="bookings-sort-select"
              style={{ width: '100%' }}
            >
              {COURT_TYPE_FILTERS.map((o) => (
                <option key={o.value || 'all'} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        )}

        <div className="admin-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`admin-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <span className="material-symbols-outlined">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        <input
          type="search"
          className="admin-search"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {loading ? (
          <p className="admin-muted">Cargando catálogo...</p>
        ) : (
          <>
            {tab === 'courts' && (
              <div className="admin-list">
                {filteredCourts.map((c) => (
                  <div key={c.id} className="admin-list-item">
                    <div>
                      <strong>{c.name}</strong>
                      <div className="admin-list-meta">
                        {c.type} · {c.turf} · ${c.pricePerHour}/h · cap. {c.capacidad}
                      </div>
                    </div>
                    <div className="admin-list-actions">
                      <span className={`admin-badge ${c.disponible !== false ? 'ok' : 'muted'}`}>
                        {c.disponible !== false ? 'DISPONIBLE' : 'NO DISPONIBLE'}
                      </span>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => openEditCourt(c)}>
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm btn-danger"
                        onClick={() => setConfirmDeleteCourtId(c.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
                {filteredCourts.length === 0 && <p className="admin-muted">Sin resultados.</p>}
              </div>
            )}

            {tab === 'professors' && (
              <div className="admin-list">
                {filteredProfessors.map((p) => (
                  <div key={p.id} className="admin-list-item">
                    <div>
                      <strong>{p.name}</strong>
                      <div className="admin-list-meta">{p.email}</div>
                      <div className="admin-list-meta">{p.certificacion} · {p.alumnosCount} alumnos</div>
                    </div>
                  </div>
                ))}
                {filteredProfessors.length === 0 && <p className="admin-muted">Sin resultados.</p>}
              </div>
            )}

            {tab === 'users' && (
              <div className="admin-list">
                {filteredUsers.map((u) => (
                  <div key={u.id} className="admin-list-item">
                    <div>
                      <strong>{u.name}</strong>
                      <div className="admin-list-meta">{u.email}</div>
                    </div>
                    <span className="admin-badge ok">{u.role}</span>
                  </div>
                ))}
                {filteredUsers.length === 0 && <p className="admin-muted">Sin resultados.</p>}
              </div>
            )}
          </>
        )}
      </div>

      {courtModal && (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && setCourtModal(null)}>
          <div className="modal-drawer admin-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{courtModal.mode === 'create' ? 'Nueva cancha' : 'Editar cancha'}</h3>
              <button type="button" className="icon-btn" onClick={() => setCourtModal(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="admin-form-grid">
              <div className="form-group">
                <label>Número</label>
                <input
                  type="number"
                  min="1"
                  value={courtForm.numero}
                  onChange={(e) => setCourtForm((f) => ({ ...f, numero: e.target.value }))}
                  disabled={courtModal.mode === 'edit'}
                />
              </div>
              <div className="form-group">
                <label>Tipo</label>
                <select
                  value={courtForm.tipo_cancha}
                  onChange={(e) => setCourtForm((f) => ({ ...f, tipo_cancha: e.target.value }))}
                >
                  {TIPO_CANCHA_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Superficie</label>
                <select
                  value={courtForm.superficie}
                  onChange={(e) => setCourtForm((f) => ({ ...f, superficie: e.target.value }))}
                >
                  {SUPERFICIE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Capacidad</label>
                <input
                  type="number"
                  min="1"
                  value={courtForm.capacidad}
                  onChange={(e) => setCourtForm((f) => ({ ...f, capacidad: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Precio / hora ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={courtForm.precio_base_hora}
                  onChange={(e) => setCourtForm((f) => ({ ...f, precio_base_hora: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Duración máx. (min)</label>
                <input
                  type="number"
                  min="30"
                  step="30"
                  value={courtForm.duracion_maxima_reserva}
                  onChange={(e) => setCourtForm((f) => ({ ...f, duracion_maxima_reserva: e.target.value }))}
                />
              </div>
              <div className="form-group admin-form-check">
                <label>
                  <input
                    type="checkbox"
                    checked={courtForm.estado_disponibilidad}
                    onChange={(e) => setCourtForm((f) => ({ ...f, estado_disponibilidad: e.target.checked }))}
                  />
                  Disponible para reservas
                </label>
              </div>
              <div className="form-group admin-form-check">
                <label>
                  <input
                    type="checkbox"
                    checked={courtForm.activa}
                    onChange={(e) => setCourtForm((f) => ({ ...f, activa: e.target.checked }))}
                  />
                  Activa (no dada de baja)
                </label>
              </div>
            </div>
            <div className="admin-form-footer">
              <button type="button" className="btn btn-outline" onClick={() => setCourtModal(null)}>Cancelar</button>
              <button type="button" className="btn btn-primary" onClick={handleSaveCourt} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteCourtId && (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && setConfirmDeleteCourtId(null)}>
          <div className="modal-drawer admin-form-modal" onClick={(e) => e.stopPropagation()}>
            <p>¿Eliminar la cancha #{confirmDeleteCourtId}? Esta acción no se puede deshacer.</p>
            <div className="admin-form-footer">
              <button type="button" className="btn btn-outline" onClick={() => setConfirmDeleteCourtId(null)}>Cancelar</button>
              <button type="button" className="btn btn-primary btn-danger" onClick={() => handleDeleteCourt(confirmDeleteCourtId)} disabled={saving}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CatalogExplorer
