import React, { useEffect, useState } from 'react'
import { api } from '../services/api.js'

function AdminFinance({ onBackToPortal, showToast }) {
  const [cobros, setCobros] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const data = await api.getCobros()
        setCobros(data)
      } catch (err) {
        showToast(err.message || 'Error al cargar cobros', 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = cobros.filter((c) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      String(c.id).includes(q) ||
      (c.usuarioEmail || '').toLowerCase().includes(q) ||
      (c.estadoPago || '').toLowerCase().includes(q) ||
      (c.tipoServicio || '').toLowerCase().includes(q)
    )
  })

  const formatFecha = (ms) => {
    if (!ms) return '—'
    try {
      return new Date(Number(ms)).toLocaleString('es-AR')
    } catch {
      return '—'
    }
  }

  return (
    <div style={{ maxWidth: '960px', margin: '2rem auto', padding: '0 1.5rem', fontFamily: 'Outfit, sans-serif' }}>
      <button type="button" className="btn btn-outline" onClick={onBackToPortal} style={{ marginBottom: '1.5rem' }}>
        <span className="material-symbols-outlined">arrow_back</span>
        Volver al Portal
      </button>

      <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: 800 }}>Historial de cobros</h2>
      <p style={{ margin: '0 0 1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        Listado desde <code>GET /api/finance/cobros/</code>. Filtro por fechas cuando el backend lo exponga.
      </p>

      <div className="bookings-search-wrap" style={{ marginBottom: '1rem' }}>
        <span className="material-symbols-outlined">search</span>
        <input
          type="search"
          placeholder="Buscar por id, usuario, estado..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Buscar cobros"
        />
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Cargando cobros...</p>
      ) : filtered.length === 0 ? (
        <div className="bookings-list-empty">
          <span className="material-symbols-outlined">payments</span>
          <p>No hay cobros registrados.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map((c) => (
            <article
              key={c.id}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '1rem 1.2rem',
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: '0.5rem',
                alignItems: 'center',
              }}
            >
              <div>
                <strong style={{ color: 'var(--text-main)' }}>Cobro #{c.id}</strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {c.tipoServicio} · {c.usuarioEmail || `Usuario ${c.usuarioId}`}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {formatFecha(c.fechaCobro)} · {c.metodoPago}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-garnet)' }}>
                  ${Number(c.monto || 0).toFixed(2)}
                </div>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: c.estadoPago === 'APROBADO' ? '#10b981' : 'orange',
                  }}
                >
                  {c.estadoPago}
                </span>
                {c.reciboId && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Recibo #{c.reciboId}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminFinance
