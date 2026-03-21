import { useEffect, useState } from 'react'
import { apiFetch } from '../api'

export default function SeedSelector({ onSelect }) {
  const [seeds, setSeeds] = useState([])
  const [loading, setLoading] = useState(false)
  const [collecting, setCollecting] = useState(false)
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')

  async function loadSeeds() {
    setLoading(true)
    try {
      const res = await apiFetch('/seeds/db/list?limit=30')
      const data = await res.json()
      setSeeds(data.seeds || [])
    } catch {
      setError('Erro ao carregar seeds')
    } finally {
      setLoading(false)
    }
  }

  async function collectSeeds() {
    setCollecting(true)
    setError('')
    try {
      await apiFetch('/seeds/collect', { method: 'POST' })
      await loadSeeds()
    } catch {
      setError('Erro ao coletar seeds')
    } finally {
      setCollecting(false)
    }
  }

  useEffect(() => { loadSeeds() }, [])

  function handleSelect(seed) {
    setSelected(seed.id)
    onSelect(seed)
  }

  const card = {
    background: '#1a1d27',
    border: '1px solid #2d3148',
    borderRadius: '10px',
    padding: '1rem',
    cursor: 'pointer',
    transition: 'border-color 0.15s',
    marginBottom: '0.75rem',
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
          {seeds.length} seeds disponíveis
        </span>
        <button
          onClick={collectSeeds}
          disabled={collecting}
          style={{
            background: collecting ? '#374151' : '#1e293b',
            color: collecting ? '#6b7280' : '#818cf8',
            border: '1px solid #2d3148',
            borderRadius: '6px',
            padding: '0.4rem 1rem',
            fontSize: '0.8rem',
            cursor: collecting ? 'not-allowed' : 'pointer',
          }}
        >
          {collecting ? 'Coletando...' : 'Coletar novas seeds'}
        </button>
      </div>

      {error && (
        <p style={{ color: '#f87171', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{error}</p>
      )}

      {loading ? (
        <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Carregando...</p>
      ) : seeds.length === 0 ? (
        <div style={{ ...card, cursor: 'default', textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: '#94a3b8', margin: 0 }}>Nenhuma seed coletada ainda.</p>
          <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0.5rem 0 0' }}>
            Clique em "Coletar novas seeds" para buscar da Agência Lupa e Aos Fatos.
          </p>
        </div>
      ) : (
        <div style={{ maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}>
          {seeds.map(seed => (
            <div
              key={seed.id}
              onClick={() => handleSelect(seed)}
              style={{
                ...card,
                borderColor: selected === seed.id ? '#818cf8' : '#2d3148',
                background: selected === seed.id ? '#1e1b4b' : '#1a1d27',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                <p style={{ color: '#c7d2fe', fontSize: '0.875rem', margin: 0, lineHeight: 1.4, flex: 1 }}>
                  {seed.title}
                </p>
                <span style={{
                  background: '#0f172a', color: '#64748b', fontSize: '0.7rem',
                  padding: '2px 8px', borderRadius: '4px', whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  {seed.source_name}
                </span>
              </div>
              <p style={{
                color: '#64748b', fontSize: '0.78rem', margin: '0.5rem 0 0', lineHeight: 1.4,
                display: '-webkit-box', WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {seed.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
