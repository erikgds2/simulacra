import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../api'

const STATUS = {
  ready:    { color: '#F59E0B', label: 'Aguardando' },
  finished: { color: '#10B981', label: 'Concluída' },
  error:    { color: '#EF4444', label: 'Erro' },
}

function fmt(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const features = [
  {
    icon: '⬡',
    title: 'Grafo Barabási-Albert',
    text: 'Rede com topologia de redes sociais reais — poucos nós altamente conectados (influenciadores) e maioria com poucas conexões.',
  },
  {
    icon: '◎',
    title: 'Modelo SEIR',
    text: 'Simulação epidemiológica: Suscetível → Exposto → Infectado → Recuperado. O mesmo modelo usado para doenças aplicado à desinformação.',
  },
  {
    icon: '⚡',
    title: '4 Tipos de Intervenção',
    text: 'Compare o impacto de fact-check, remoção de conteúdo, contra-narrativa e avisos de rótulo sobre a propagação.',
  },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [simulations, setSimulations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/simulation/list?limit=10')
      .then(r => r.json())
      .then(d => setSimulations(d.simulations || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '3rem 2rem' }}>

      {/* Hero */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <span style={{
            fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em',
            color: '#06B6D4', textTransform: 'uppercase',
            padding: '0.25rem 0.75rem', background: '#06B6D415',
            border: '1px solid #06B6D430', borderRadius: '20px',
          }}>Motor de Simulação</span>
        </div>
        <h1 style={{
          fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700,
          color: '#E2E8F0', lineHeight: 1.15, marginBottom: '1rem',
          letterSpacing: '-0.02em',
        }}>
          Como a desinformação<br />
          <span style={{ color: '#06B6D4' }}>se espalha no Brasil</span>
        </h1>
        <p style={{ color: '#94A3B8', fontSize: '1.05rem', maxWidth: '520px', lineHeight: 1.7, marginBottom: '2rem' }}>
          Simule a propagação de fake news em redes sociais com modelo epidemiológico SEIR.
          Teste intervenções e veja os resultados em tempo real.
        </p>
        <button className="btn-primary" onClick={() => navigate('/simulate')}
          style={{ padding: '0.75rem 2rem', fontSize: '0.95rem' }}>
          Iniciar simulação →
        </button>
      </div>

      {/* Feature cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
        {features.map(({ icon, title, text }) => (
          <div key={title} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontSize: '1.25rem', color: '#06B6D4' }}>{icon}</div>
            <h3 style={{ color: '#E2E8F0', fontSize: '0.95rem', fontWeight: 600 }}>{title}</h3>
            <p style={{ color: '#64748B', fontSize: '0.85rem', lineHeight: 1.65 }}>{text}</p>
          </div>
        ))}
      </div>

      {/* Simulations history */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ color: '#94A3B8', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Simulações recentes
          </h2>
          {simulations.length > 0 && (
            <span className="mono" style={{ fontSize: '0.75rem', color: '#475569' }}>
              {simulations.length} registro{simulations.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loading ? (
          <div style={{ color: '#475569', fontSize: '0.875rem', padding: '2rem 0' }}>Carregando...</div>
        ) : simulations.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#475569' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem', opacity: 0.4 }}>◎</div>
            <p>Nenhuma simulação ainda.</p>
            <p style={{ fontSize: '0.8rem', marginTop: '0.35rem' }}>Inicie uma acima para começar.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {simulations.map(sim => {
              const st = STATUS[sim.status] || STATUS.ready
              return (
                <div key={sim.id} className="card card-hover"
                  onClick={() => navigate(`/simulation/${sim.id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: st.color, flexShrink: 0, boxShadow: `0 0 6px ${st.color}` }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#C7D2FE', fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {sim.seed_text?.slice(0, 90) || 'Sem texto'}…
                    </p>
                    <p style={{ color: '#475569', fontSize: '0.72rem', marginTop: '0.2rem', fontFamily: 'var(--mono)' }}>
                      {fmt(sim.created_at)} · {sim.num_agents} agentes{sim.intervention ? ` · ${sim.intervention}` : ''}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {sim.peak_infected != null && (
                      <p style={{ color: '#EF4444', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'var(--mono)' }}>
                        pico {sim.peak_infected}
                      </p>
                    )}
                    {sim.total_reach != null && (
                      <p style={{ color: '#475569', fontSize: '0.72rem', marginTop: '0.1rem', fontFamily: 'var(--mono)' }}>
                        {(sim.total_reach * 100).toFixed(1)}% alcance
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
