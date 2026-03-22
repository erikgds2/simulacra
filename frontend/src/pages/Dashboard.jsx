import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../api'
import { SkeletonList } from '../components/Skeleton'
import ColdStartBanner from '../components/ColdStartBanner'
import { toast } from '../components/Toast'

const infoCards = [
  {
    title: 'Como funciona',
    text: 'Simula propagação de desinformação em redes sociais usando SEIR em grafos Barabási-Albert.',
  },
  {
    title: 'Fontes de dados',
    text: 'Seeds coletadas da Agência Lupa e Aos Fatos — bases de verificação de fatos do Brasil.',
  },
  {
    title: 'Intervenções',
    text: 'Teste 4 estratégias: fact-check, remoção, contra-narrativa e aviso de rótulo.',
  },
]

const STATUS_COLORS = {
  ready: '#fbbf24',
  finished: '#34d399',
  error: '#f87171',
}

const STATUS_LABELS = {
  ready: 'em andamento',
  finished: 'concluída',
  error: 'erro',
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [simulations, setSimulations] = useState([])
  const [loading, setLoading] = useState(true)
  const [apiOnline, setApiOnline] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const health = await apiFetch('/health')
        setApiOnline(health.ok)
        const r = await apiFetch('/simulation/list?limit=10')
        if (r.ok) {
          const d = await r.json()
          setSimulations(d.simulations || [])
        }
      } catch {
        setApiOnline(false)
        toast('Não foi possível conectar ao servidor. Verifique se o backend está rodando.', 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '3rem 2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#818cf8', marginBottom: '0.5rem' }}>
        Simulacra
      </h1>
      <p style={{ color: '#94a3b8', marginBottom: '2.5rem', fontSize: '1.05rem' }}>
        Motor de simulação de comportamento coletivo para o Brasil
      </p>

      {loading && apiOnline === null && <ColdStartBanner />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {infoCards.map(({ title, text }) => (
          <div key={title} style={{
            background: '#1a1d27',
            border: '1px solid #2d3148',
            borderRadius: '12px',
            padding: '1.5rem',
          }}>
            <h3 style={{ color: '#c7d2fe', marginBottom: '0.75rem', fontSize: '1rem' }}>{title}</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.6 }}>{text}</p>
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate('/simulate')}
        style={{
          background: '#4f46e5', color: '#fff', border: 'none',
          borderRadius: '8px', padding: '0.75rem 2rem',
          fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
          marginBottom: '3rem',
        }}
      >
        Iniciar nova simulação →
      </button>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2 style={{ color: '#c7d2fe', fontSize: '1.1rem', margin: 0 }}>
          Simulações recentes
        </h2>
        {apiOnline === false && (
          <span style={{ color: '#f87171', fontSize: '0.78rem' }}>● servidor offline</span>
        )}
        {apiOnline === true && (
          <span style={{ color: '#34d399', fontSize: '0.78rem' }}>● servidor online</span>
        )}
      </div>

      {loading ? (
        <SkeletonList count={3} />
      ) : simulations.length === 0 ? (
        <div style={{
          background: '#1a1d27', border: '1px solid #2d3148',
          borderRadius: '10px', padding: '2rem', textAlign: 'center',
        }}>
          <p style={{ color: '#64748b', margin: 0 }}>
            Nenhuma simulação ainda.
          </p>
          <p style={{ color: '#475569', fontSize: '0.8rem', margin: '0.5rem 0 0' }}>
            Clique em "Iniciar nova simulação" para começar.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {simulations.map(sim => (
            <div
              key={sim.id}
              onClick={() => navigate(`/simulation/${sim.id}`)}
              style={{
                background: '#1a1d27', border: '1px solid #2d3148',
                borderRadius: '10px', padding: '1rem 1.25rem',
                cursor: 'pointer', display: 'flex',
                alignItems: 'center', gap: '1rem',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#4f46e5'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#2d3148'}
            >
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: STATUS_COLORS[sim.status] || '#64748b',
                flexShrink: 0,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  color: '#c7d2fe', fontSize: '0.875rem', margin: 0,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {sim.seed_text?.slice(0, 80)}...
                </p>
                <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0.25rem 0 0' }}>
                  {formatDate(sim.created_at)} · {sim.num_agents} agentes
                  {sim.intervention ? ` · ${sim.intervention}` : ''}
                  · <span style={{ color: STATUS_COLORS[sim.status] }}>
                    {STATUS_LABELS[sim.status] || sim.status}
                  </span>
                </p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {sim.peak_infected != null && (
                  <p style={{ color: '#f87171', fontSize: '0.875rem', margin: 0, fontWeight: 600 }}>
                    Pico: {sim.peak_infected}
                  </p>
                )}
                {sim.total_reach != null && (
                  <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: '0.2rem 0 0' }}>
                    Alcance: {(sim.total_reach * 100).toFixed(1)}%
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
