import React, { useCallback, useEffect, useState } from 'react'
import { api } from '../services/api.js'
import { printReceipt } from '../utils/printReceipt.js'

const TABS = [
  { id: 'cobros', label: 'Cobros', icon: 'payments' },
  { id: 'recibos', label: 'Recibos', icon: 'receipt_long' },
  { id: 'descuentos', label: 'Descuentos', icon: 'sell' },
]

const ESTADOS_PAGO = ['PENDIENTE', 'APROBADO', 'RECHAZADO']

const EMPTY_DESCUENTO = {
  tipo: 'PORCENTAJE',
  valor: '',
  descripcion: '',
  activo: true,
}

function formatFecha(ms) {
  if (!ms) return '—'
  try {
    return new Date(Number(ms)).toLocaleString('es-AR')
  } catch {
    return '—'
  }
}

function ReciboPrintModal({ recibo, onClose }) {
  if (!recibo) return null
  return (
    <div
      className="payment-modal-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="payment-modal-card recibo-print-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button type="button" className="payment-modal-close no-print" onClick={onClose} aria-label="Cerrar">
          <span className="material-symbols-outlined">close</span>
        </button>
        <div className="recibo-print-root">
          <div className="payment-modal-header receipt-header">
            <span className="material-symbols-outlined payment-icon success no-print">receipt_long</span>
            <h3>Recibo #{recibo.id}</h3>
            <p>Cobro #{recibo.cobroId}</p>
          </div>
          <div className="receipt-body">
          <div className="receipt-brand">GOL AHORA</div>
          {recibo.detalle && (
            <div className="receipt-line">
              <span>Detalle</span>
              <span>{recibo.detalle}</span>
            </div>
          )}
          <div className="receipt-line">
            <span>Fecha emisión</span>
            <span>{formatFecha(recibo.fechaEmision || recibo.fecha_emision)}</span>
          </div>
          <div className="receipt-line">
            <span>Cliente</span>
            <span>{recibo.usuarioNombre || recibo.usuarioEmail || '—'}</span>
          </div>
          {recibo.tipoServicio && (
            <div className="receipt-line">
              <span>Servicio</span>
              <span>{recibo.tipoServicio}</span>
            </div>
          )}
          {recibo.metodoPago && (
            <div className="receipt-line">
              <span>Método</span>
              <span>{recibo.metodoPago}</span>
            </div>
          )}
          <div className="receipt-line receipt-total">
            <span>Importe</span>
            <strong>${Number(recibo.monto || 0).toFixed(2)}</strong>
          </div>
          <p className="receipt-legal">Comprobante válido como constancia de pago digital.</p>
          </div>
        </div>
        <div className="payment-modal-footer no-print">
          <button type="button" className="btn btn-outline" onClick={() => printReceipt()}>
            <span className="material-symbols-outlined">print</span>
            Imprimir
          </button>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

function AdminFinance({ onBackToPortal, showToast }) {
  const [tab, setTab] = useState('cobros')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [cobros, setCobros] = useState([])
  const [recibos, setRecibos] = useState([])
  const [descuentos, setDescuentos] = useState([])
  const [reciboModal, setReciboModal] = useState(null)
  const [descForm, setDescForm] = useState(EMPTY_DESCUENTO)
  const [editingDescId, setEditingDescId] = useState(null)
  const [savingDesc, setSavingDesc] = useState(false)

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [c, r, d] = await Promise.all([
        api.getCobros(),
        api.getRecibos(),
        api.getDescuentos(),
      ])
      setCobros(c)
      setRecibos(r)
      setDescuentos(d)
    } catch (err) {
      showToast(err.message || 'Error al cargar finanzas', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const q = search.toLowerCase()

  const filteredCobros = cobros.filter(
    (c) =>
      !q ||
      String(c.id).includes(q) ||
      (c.usuarioNombre || '').toLowerCase().includes(q) ||
      (c.usuarioEmail || '').toLowerCase().includes(q) ||
      (c.estadoPago || '').toLowerCase().includes(q) ||
      (c.tipoServicio || '').toLowerCase().includes(q),
  )

  const filteredRecibos = recibos.filter(
    (r) =>
      !q ||
      String(r.id).includes(q) ||
      String(r.cobroId).includes(q) ||
      (r.usuarioNombre || '').toLowerCase().includes(q) ||
      (r.detalle || '').toLowerCase().includes(q),
  )

  const filteredDescuentos = descuentos.filter(
    (d) =>
      !q ||
      (d.descripcion || '').toLowerCase().includes(q) ||
      (d.label || '').toLowerCase().includes(q),
  )

  const handleEstadoChange = async (cobro, estadoPago) => {
    try {
      await api.updateCobro(cobro.id, { estadoPago })
      showToast(`Cobro #${cobro.id} → ${estadoPago}`, 'success')
      await loadAll()
    } catch (err) {
      showToast(err.message || 'No se pudo actualizar el cobro', 'error')
    }
  }

  const handleDeleteCobro = async (id) => {
    if (!window.confirm(`¿Eliminar cobro #${id}?`)) return
    try {
      await api.deleteCobro(id)
      showToast(`Cobro #${id} eliminado`, 'info')
      await loadAll()
    } catch (err) {
      showToast(err.message || 'No se pudo eliminar el cobro', 'error')
    }
  }

  const openRecibo = async (reciboId) => {
    try {
      const detail = await api.getRecibo(reciboId)
      const fromList = recibos.find((r) => r.id === String(reciboId))
      setReciboModal({
        ...fromList,
        ...detail,
        id: detail.id,
        cobroId: detail.cobroId || fromList?.cobroId,
      })
    } catch (err) {
      showToast(err.message || 'No se pudo cargar el recibo', 'error')
    }
  }

  const resetDescForm = () => {
    setDescForm(EMPTY_DESCUENTO)
    setEditingDescId(null)
  }

  const handleEditDescuento = (d) => {
    setEditingDescId(d.id)
    setDescForm({
      tipo: d.tipo,
      valor: String(d.valor),
      descripcion: d.descripcion,
      activo: d.activo,
    })
  }

  const handleSaveDescuento = async (e) => {
    e.preventDefault()
    const valor = Number(descForm.valor)
    if (!Number.isFinite(valor) || valor <= 0) {
      showToast('Ingresá un valor válido para el descuento', 'error')
      return
    }
    setSavingDesc(true)
    try {
      const payload = {
        tipo: descForm.tipo,
        valor,
        descripcion: descForm.descripcion.trim(),
        activo: descForm.activo,
      }
      if (editingDescId) {
        await api.updateDescuento(editingDescId, payload)
        showToast('Descuento actualizado', 'success')
      } else {
        await api.createDescuento(payload)
        showToast('Descuento creado', 'success')
      }
      resetDescForm()
      await loadAll()
    } catch (err) {
      showToast(err.message || 'No se pudo guardar el descuento', 'error')
    } finally {
      setSavingDesc(false)
    }
  }

  const handleDeleteDescuento = async (id) => {
    if (!window.confirm(`¿Eliminar descuento #${id}?`)) return
    try {
      await api.deleteDescuento(id)
      showToast('Descuento eliminado', 'info')
      if (editingDescId === id) resetDescForm()
      await loadAll()
    } catch (err) {
      showToast(err.message || 'No se pudo eliminar el descuento', 'error')
    }
  }

  const tabBtnStyle = (active) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    padding: '0.45rem 0.9rem',
    borderRadius: '8px',
    border: active ? '1px solid #2ECC71' : '1px solid var(--border-color)',
    backgroundColor: active ? 'rgba(46, 204, 113, 0.12)' : 'transparent',
    color: active ? '#2ECC71' : 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 600,
  })

  return (
    <div style={{ maxWidth: '980px', margin: '2rem auto', padding: '0 1.5rem', fontFamily: 'Outfit, sans-serif' }}>
      <button type="button" className="btn btn-outline" onClick={onBackToPortal} style={{ marginBottom: '1.5rem' }}>
        <span className="material-symbols-outlined">arrow_back</span>
        Volver al Portal
      </button>

      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '1.75rem',
        }}
      >
        <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.5rem', fontWeight: 800 }}>Gestión financiera</h2>
        <p style={{ margin: '0 0 1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Cobros, recibos y descuentos. Altas de usuarios y canchas:{' '}
          <a href="http://127.0.0.1:8000/admin/" target="_blank" rel="noreferrer" style={{ color: '#2ECC71' }}>
            panel Django Admin
          </a>
        </p>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id)
                setSearch('')
              }}
              style={tabBtnStyle(tab === t.id)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        <div className="bookings-search-wrap" style={{ marginBottom: '1rem' }}>
          <span className="material-symbols-outlined">search</span>
          <input
            type="search"
            placeholder={
              tab === 'cobros'
                ? 'Buscar cobros por id, nombre, estado...'
                : tab === 'recibos'
                  ? 'Buscar recibos...'
                  : 'Buscar descuentos...'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Cargando...</p>
        ) : (
          <>
            {tab === 'cobros' && (
              <>
                {filteredCobros.length === 0 ? (
                  <div className="bookings-list-empty">
                    <span className="material-symbols-outlined">payments</span>
                    <p>No hay cobros registrados.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {filteredCobros.map((c) => (
                      <article
                        key={c.id}
                        style={{
                          border: '1px solid var(--border-color)',
                          borderRadius: '10px',
                          padding: '1rem 1.2rem',
                          display: 'grid',
                          gridTemplateColumns: '1fr auto',
                          gap: '0.75rem',
                          alignItems: 'start',
                        }}
                      >
                        <div>
                          <strong>Cobro #{c.id}</strong>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                            {c.tipoServicio} · {c.usuarioNombre || c.usuarioEmail || `Usuario ${c.usuarioId}`}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {formatFecha(c.fechaCobro)} · {c.metodoPago}
                            {c.reservaId ? ` · Reserva #${c.reservaId}` : ''}
                          </div>
                          {c.descuentoLabel && (
                            <div style={{ fontSize: '0.75rem', color: '#2ECC71', marginTop: '0.2rem' }}>
                              Descuento: {c.descuentoLabel}
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-garnet)' }}>
                            ${Number(c.monto).toFixed(2)}
                          </div>
                          <select
                            value={c.estadoPago}
                            onChange={(e) => handleEstadoChange(c, e.target.value)}
                            className="bookings-sort-select"
                            style={{ fontSize: '0.7rem', marginTop: '0.35rem', maxWidth: '130px' }}
                            aria-label={`Estado cobro ${c.id}`}
                          >
                            {ESTADOS_PAGO.map((st) => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
                          <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                            {c.reciboId && (
                              <button type="button" className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }} onClick={() => openRecibo(c.reciboId)}>
                                Recibo #{c.reciboId}
                              </button>
                            )}
                            <button type="button" className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', color: '#e74c3c', borderColor: '#e74c3c' }} onClick={() => handleDeleteCobro(c.id)}>
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}

            {tab === 'recibos' && (
              <>
                {filteredRecibos.length === 0 ? (
                  <div className="bookings-list-empty">
                    <span className="material-symbols-outlined">receipt_long</span>
                    <p>No hay recibos. Se generan al aprobar un cobro.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {filteredRecibos.map((r) => (
                      <article
                        key={r.id}
                        style={{
                          border: '1px solid var(--border-color)',
                          borderRadius: '10px',
                          padding: '1rem 1.2rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '1rem',
                        }}
                      >
                        <div>
                          <strong>Recibo #{r.id}</strong>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                            Cobro #{r.cobroId} · {r.usuarioNombre || r.usuarioEmail || '—'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {formatFecha(r.fechaEmision)} · {r.detalle || '—'}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 800, color: 'var(--accent-garnet)' }}>
                            ${Number(r.monto).toFixed(2)}
                          </div>
                          <button type="button" className="btn btn-outline" style={{ marginTop: '0.4rem', fontSize: '0.75rem' }} onClick={() => openRecibo(r.id)}>
                            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>visibility</span>
                            Ver / Imprimir
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}

            {tab === 'descuentos' && (
              <>
                <form
                  onSubmit={handleSaveDescuento}
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '1rem',
                    marginBottom: '1.25rem',
                    display: 'grid',
                    gap: '0.75rem',
                  }}
                >
                  <strong>{editingDescId ? `Editar descuento #${editingDescId}` : 'Nuevo descuento'}</strong>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label htmlFor="desc-tipo">Tipo</label>
                      <select
                        id="desc-tipo"
                        value={descForm.tipo}
                        onChange={(e) => setDescForm((f) => ({ ...f, tipo: e.target.value }))}
                        className="bookings-sort-select"
                        style={{ width: '100%' }}
                      >
                        <option value="PORCENTAJE">Porcentaje (%)</option>
                        <option value="MONTO_FIJO">Monto fijo ($)</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label htmlFor="desc-valor">{descForm.tipo === 'MONTO_FIJO' ? 'Monto ($)' : 'Porcentaje (%)'}</label>
                      <input
                        id="desc-valor"
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={descForm.valor}
                        onChange={(e) => setDescForm((f) => ({ ...f, valor: e.target.value }))}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label htmlFor="desc-desc">Descripción</label>
                      <input
                        id="desc-desc"
                        type="text"
                        value={descForm.descripcion}
                        onChange={(e) => setDescForm((f) => ({ ...f, descripcion: e.target.value }))}
                        placeholder="Ej: Promo verano"
                      />
                    </div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <input
                      type="checkbox"
                      checked={descForm.activo}
                      onChange={(e) => setDescForm((f) => ({ ...f, activo: e.target.checked }))}
                    />
                    Activo (visible al pagar reservas)
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="submit" className="btn btn-primary" disabled={savingDesc}>
                      {savingDesc ? 'Guardando...' : editingDescId ? 'Actualizar' : 'Crear descuento'}
                    </button>
                    {editingDescId && (
                      <button type="button" className="btn btn-outline" onClick={resetDescForm}>
                        Cancelar edición
                      </button>
                    )}
                  </div>
                </form>

                {filteredDescuentos.length === 0 ? (
                  <div className="bookings-list-empty">
                    <span className="material-symbols-outlined">sell</span>
                    <p>No hay descuentos cargados.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {filteredDescuentos.map((d) => (
                      <article
                        key={d.id}
                        style={{
                          border: '1px solid var(--border-color)',
                          borderRadius: '10px',
                          padding: '0.85rem 1rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          opacity: d.activo ? 1 : 0.65,
                        }}
                      >
                        <div>
                          <strong>{d.label}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            #{d.id} · {d.activo ? 'Activo' : 'Inactivo'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <button type="button" className="btn btn-outline" style={{ fontSize: '0.75rem' }} onClick={() => handleEditDescuento(d)}>
                            Editar
                          </button>
                          <button type="button" className="btn btn-outline" style={{ fontSize: '0.75rem', color: '#e74c3c', borderColor: '#e74c3c' }} onClick={() => handleDeleteDescuento(d.id)}>
                            Eliminar
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {reciboModal && (
        <ReciboPrintModal recibo={reciboModal} onClose={() => setReciboModal(null)} />
      )}
    </div>
  )
}

export default AdminFinance
