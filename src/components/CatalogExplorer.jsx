import React, { useState, useEffect } from 'react'
import { api, isMockMode } from '../services/api.js'

const TABS = [
  { id: 'courts', label: 'Canchas', icon: 'stadium' },
  { id: 'professors', label: 'Profesores', icon: 'school' },
  { id: 'users', label: 'Usuarios', icon: 'groups' },
]

function CatalogExplorer({ onBackToPortal, showToast }) {
  const [tab, setTab] = useState('courts')
  const [courts, setCourts] = useState([])
  const [professors, setProfessors] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const loadAll = async () => {
    setLoading(true)
    try {
      const [c, p, u] = await Promise.all([
        api.getCourts(),
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

  const q = search.toLowerCase()

  const filteredCourts = courts.filter(
    (c) =>
      c.name?.toLowerCase().includes(q) ||
      c.type?.toLowerCase().includes(q) ||
      c.turf?.toLowerCase().includes(q)
  )

  const filteredProfessors = professors.filter(
    (p) =>
      p.name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.certificacion?.toLowerCase().includes(q)
  )

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
  )

  return (
    <div style={{ maxWidth: '950px', margin: '2rem auto', padding: '0 1.5rem', fontFamily: 'Outfit, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button
          type="button"
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
            fontSize: '0.85rem',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>arrow_back</span>
          Volver al Portal
        </button>
        {isMockMode && (
          <span style={{ fontSize: '0.75rem', color: '#2ECC71' }}>Datos locales — sin token del backend</span>
        )}
      </div>

      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '2rem',
        }}
      >
        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: 800 }}>Catálogo del sistema</h2>
        <p style={{ margin: '0 0 1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Listados de canchas, profesores y usuarios para desarrollo de pantallas.
        </p>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.9rem',
                borderRadius: '8px',
                border: tab === t.id ? '1px solid #2ECC71' : '1px solid var(--border-color)',
                backgroundColor: tab === t.id ? 'rgba(46, 204, 113, 0.12)' : 'transparent',
                color: tab === t.id ? '#2ECC71' : 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        <input
          type="search"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            marginBottom: '1.25rem',
            padding: '0.6rem 1rem',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            background: 'transparent',
            color: 'var(--text-main)',
          }}
        />

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Cargando catálogo...</p>
        ) : (
          <>
            {tab === 'courts' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filteredCourts.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      padding: '1rem 1.2rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                    }}
                  >
                    <div>
                      <strong>{c.name}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {c.type} · {c.turf} · ${c.pricePerHour}/h
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: c.disponible !== false ? '#2ECC71' : 'var(--text-muted)',
                      }}
                    >
                      {c.disponible !== false ? 'DISPONIBLE' : 'NO DISPONIBLE'}
                    </span>
                  </div>
                ))}
                {filteredCourts.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Sin resultados.</p>}
              </div>
            )}

            {tab === 'professors' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filteredProfessors.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      padding: '1rem 1.2rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                    }}
                  >
                    <strong>{p.name}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.email}</div>
                    <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                      {p.certificacion} · {p.alumnosCount} alumnos
                    </div>
                  </div>
                ))}
                {filteredProfessors.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Sin resultados.</p>}
              </div>
            )}

            {tab === 'users' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    style={{
                      padding: '1rem 1.2rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <strong>{u.name}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</div>
                    </div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#2ECC71', textTransform: 'uppercase' }}>
                      {u.role}
                    </span>
                  </div>
                ))}
                {filteredUsers.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Sin resultados.</p>}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default CatalogExplorer
