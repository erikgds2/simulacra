import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const infoCards = [
  { title: 'Como funciona', text: 'Simula propagacao de desinformacao em redes sociais usando SEIR em grafos Barabasi-Albert.' },
  { title: 'Fontes de dados', text: 'Seeds coletadas da Agencia Lupa e Aos Fatos - bases de verificacao de fatos do Brasil.' },
  { title: 'Intervencoes', text: 'Teste 4 estrategias: fact-check, remocao, contra-narrativa e aviso de rotulo.' },
]

const STATUS_COLORS = { ready: '#fbbf24', finished: '#34d399', error: '#f87171' }

function formatDate(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [simulations, setSimulations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/simulation/list?limit=10')
      .then(r => r.json())
      .then(d => setSimulations(d.simulations || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '3rem 2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#818cf8', marginBottom: '0.5rem' }}>DesinfoLab</h1>
      <p style={{ color: '#94a3b8', marginBottom: '2.5rem', fontSize: '1.05rem' }}>
        Simulador de propagacao de desinformacao no Brasil
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {infoCards.map(({ title, text }) => (
          <div key={title} style={{ background: '#1a1d27', border: '1px solid #2d3148', borderRadius: '12px', padding: '1.5rem' }}>
            <h3 style={{ color: '#c7d2fe', marginBottom: '0.75rem', fontSize: '1rem' }}>{title}</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.6 }}>{text}</p>
          </div>
        ))}
      </div>
      <button onClick={() => navigate('/simulate')} style={{
        background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px',
        padding: '0.75rem 2rem', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', marginBottom: '3rem',
      }}>
        Iniciar nova simulacao
      </button>
      <h2 style={{ color: '#c7d2fe', fontSize: '1.1rem', marginBottom: '1rem' }}>Simulacoes recentes</h2>
      {loading ? (
        <p style={{ color: '#64748b' }}>Carregando...</p>
      ) : simulations.length === 0 ? (
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Nenhuma simulacao ainda. Inicie uma acima.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {simulations.map(sim => (
            <div key={sim.id} onClick={() => navigate(`/simulation/${sim.id}`)} style={{
              background: '#1a1d27', border: '1px solid #2d3148', borderRadius: '10px',
              padding: '1rem 1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem',
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[sim.status] || '#64748b', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: '#c7d2fe', fontSize: '0.875rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {sim.seed_text?.slice(0, 80) || 'Sem texto'}...
                </p>
                <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0.25rem 0 0' }}>
                  {formatDate(sim.created_at)} · {sim.num_agents} agentes{sim.intervention ? ` · ${sim.intervention}` : ''}
                </p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {sim.peak_infected != null && (
                  <p style={{ color: '#f87171', fontSize: '0.875rem', margin: 0, fontWeight: 600 }}>Pico: {sim.peak_infected}</p>
                )}
                {sim.total_reach != null && (
                  <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: '0.2rem 0 0' }}>Alcance: {(sim.total_reach * 100).toFixed(1)}%</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
