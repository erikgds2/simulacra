import { useEffect, useState } from 'react'
import { apiFetch } from '../api'
import { SkeletonList } from './Skeleton'
import { toast } from './Toast'

const INTL_SOURCES = ['fullfact', 'snopes', 'factcheckorg']
const REGION_TABS = [
  { id: 'all', label: 'Todas' },
  { id: 'brasil', label: '🇧🇷 Brasil' },
  { id: 'internacional', label: '🌍 Internacional' },
]

function isInternational(seed) {
  return seed.region_br === 'internacional' || INTL_SOURCES.includes(seed.source)
}

export default function SeedSelector({ onSelect }) {
  const [seeds, setSeeds] = useState([])
  const [loading, setLoading] = useState(false)
  const [collecting, setCollecting] = useState(false)
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')
  const [regionTab, setRegionTab] = useState('all')
  const [translating, setTranslating] = useState({})
  const [translations, setTranslations] = useState({})

  async function loadSeeds() {
    setLoading(true)
    try {
      const res = await apiFetch('/seeds/db/list?limit=100')
      const data = await res.json()
      setSeeds(data.seeds || [])
    } catch {
      setError('Erro ao carregar seeds. O backend pode estar acordando — tente novamente em 30s.')
      toast('Erro ao coletar seeds. Tente novamente.', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function collectSeeds() {
    setCollecting(true)
    setError('')
    try {
      const res = await apiFetch('/seeds/collect', { method: 'POST' })
      if (!res.ok) throw new Error(`Erro ${res.status}`)
      const data = await res.json()
      await loadSeeds()
      toast(`${data.collected} novas seeds coletadas!`, 'success')
    } catch (e) {
      setError(`Erro ao coletar: ${e.message}. Aguarde 30s e tente novamente.`)
      toast('Erro ao coletar seeds. Tente novamente.', 'error')
    } finally {
      setCollecting(false)
    }
  }

  async function translateSeed(seed) {
    setTranslating(t => ({ ...t, [seed.id]: true }))
    try {
      const res = await apiFetch('/seeds/translate', {
        method: 'POST',
        body: JSON.stringify({ title: seed.title, content: seed.content }),
      })
      const data = await res.json()
      setTranslations(t => ({ ...t, [seed.id]: data }))
    } catch {
      setError('Erro ao traduzir. Verifique se há créditos na API Anthropic.')
    } finally {
      setTranslating(t => ({ ...t, [seed.id]: false }))
    }
  }

  useEffect(() => { loadSeeds() }, [])

  function handleSelect(seed) {
    const tr = translations[seed.id]
    setSelected(seed.id)
    onSelect(tr ? { ...seed, title: tr.title, content: tr.content } : seed)
  }

  const filtered = seeds.filter(s => {
    if (regionTab === 'brasil') return !isInternational(s)
    if (regionTab === 'internacional') return isInternational(s)
    return true
  })

  const brCount = seeds.filter(s => !isInternational(s)).length
  const intlCount = seeds.filter(s => isInternational(s)).length

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          {REGION_TABS.map(tab => {
            const count = tab.id === 'all' ? seeds.length : tab.id === 'brasil' ? brCount : intlCount
            return (
              <button key={tab.id} onClick={() => setRegionTab(tab.id)} style={{
                padding: '0.35rem 0.875rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 500,
                border: '1px solid',
                borderColor: regionTab === tab.id ? '#06B6D4' : '#112236',
                background: regionTab === tab.id ? '#06B6D415' : 'transparent',
                color: regionTab === tab.id ? '#06B6D4' : '#64748B',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}>
                {tab.label} <span style={{ opacity: 0.6, fontFamily: 'var(--mono)', fontSize: '0.7rem' }}>{count}</span>
              </button>
            )
          })}
        </div>
        <button onClick={collectSeeds} disabled={collecting} style={{
          padding: '0.35rem 0.875rem',
          borderRadius: '6px',
          fontSize: '0.78rem',
          fontWeight: 500,
          border: '1px solid #112236',
          background: 'transparent',
          color: collecting ? '#475569' : '#06B6D4',
          cursor: collecting ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s',
        }}>
          {collecting ? '⟳ Coletando...' : '↓ Atualizar feeds'}
        </button>
      </div>

      {error && (
        <div style={{ background: '#1C0A0A', border: '1px solid #EF444430', borderRadius: '8px', padding: '0.75rem 1rem', color: '#FCA5A5', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <SkeletonList count={3} />
      ) : filtered.length === 0 ? (
        <div style={{ background: '#081222', border: '1px solid #112236', borderRadius: '10px', padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem', opacity: 0.3 }}>◎</div>
          <p style={{ color: '#64748B', fontSize: '0.875rem' }}>Nenhuma seed coletada ainda.</p>
          <p style={{ color: '#475569', fontSize: '0.78rem', marginTop: '0.35rem' }}>
            Clique em "Atualizar feeds" para buscar das agências de checagem.
          </p>
        </div>
      ) : (
        <div style={{ maxHeight: '380px', overflowY: 'auto', paddingRight: '2px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filtered.map(seed => {
            const tr = translations[seed.id]
            const isIntl = isInternational(seed)
            const isTranslating = translating[seed.id]
            const isSelected = selected === seed.id
            return (
              <div key={seed.id} onClick={() => handleSelect(seed)} style={{
                background: isSelected ? '#0D1B2E' : '#081222',
                border: '1px solid',
                borderColor: isSelected ? '#06B6D4' : '#112236',
                borderRadius: '10px',
                padding: '0.875rem 1rem',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = '#1E3A5F' }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = '#112236' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <p style={{ color: '#C7D2FE', fontSize: '0.875rem', lineHeight: 1.45, flex: 1, fontWeight: 500 }}>
                    {tr ? tr.title : seed.title}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    {isIntl && (
                      <button
                        onClick={e => { e.stopPropagation(); if (!tr) translateSeed(seed) }}
                        title={tr ? 'Já traduzido' : 'Traduzir para PT-BR'}
                        style={{
                          background: tr ? '#0D2E1E' : '#081222',
                          border: '1px solid',
                          borderColor: tr ? '#10B98130' : '#1E3A5F',
                          borderRadius: '5px',
                          padding: '0.2rem 0.5rem',
                          fontSize: '0.7rem',
                          color: tr ? '#10B981' : '#06B6D4',
                          cursor: tr ? 'default' : 'pointer',
                          display: 'flex', alignItems: 'center', gap: '0.25rem',
                        }}
                      >
                        {isTranslating ? '...' : tr ? '✓ PT' : '🌐 PT'}
                      </button>
                    )}
                    <span style={{
                      background: '#04090F', color: '#475569', fontSize: '0.68rem',
                      padding: '0.2rem 0.5rem', borderRadius: '4px', whiteSpace: 'nowrap',
                      fontFamily: 'var(--mono)',
                    }}>
                      {seed.source_name}
                    </span>
                  </div>
                </div>
                <p style={{
                  color: '#475569', fontSize: '0.78rem', marginTop: '0.45rem', lineHeight: 1.5,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  {tr ? tr.content : seed.content}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
