import { useState } from 'react'
import { apiFetch } from '../api'
import { toast } from '../components/Toast'
import PageLoader from '../components/PageLoader'

const INTERVENTION_ICONS = {
  'Sem intervenção': '—',
  'Fact-check': '✓',
  'Remoção': '✕',
  'Contra-narrativa': '↺',
  'Aviso de rótulo': '⚠',
}

function RiskBadge({ score, label, color }) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.4rem',
      background: color + '22',
      border: `1px solid ${color}44`,
      borderRadius: '6px',
      padding: '0.2rem 0.6rem',
    }}>
      <span style={{ color, fontWeight: 700, fontSize: '0.9rem' }}>{score}</span>
      <span style={{ color, fontSize: '0.75rem' }}>{label}</span>
    </div>
  )
}

function ResultCard({ result, isBest, isWorst }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={{
      background: '#1a1d27',
      border: `1px solid ${isBest ? '#34d399' : isWorst ? '#f87171' : '#2d3148'}`,
      borderRadius: '12px',
      padding: '1.25rem',
      position: 'relative',
    }}>
      {isBest && (
        <div style={{
          position: 'absolute', top: -10, right: 12,
          background: '#064e3b', border: '1px solid #34d399',
          borderRadius: '6px', padding: '2px 10px',
          color: '#34d399', fontSize: '0.72rem', fontWeight: 600,
        }}>
          MELHOR INTERVENÇÃO
        </div>
      )}
      {isWorst && (
        <div style={{
          position: 'absolute', top: -10, right: 12,
          background: '#450a0a', border: '1px solid #f87171',
          borderRadius: '6px', padding: '2px 10px',
          color: '#f87171', fontSize: '0.72rem', fontWeight: 600,
        }}>
          PIOR CENÁRIO
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#64748b', fontSize: '1rem' }}>
              {INTERVENTION_ICONS[result.label]}
            </span>
            <h3 style={{ color: '#c7d2fe', fontSize: '1rem', margin: 0 }}>
              {result.label}
            </h3>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0.25rem 0 0' }}>
            {result.risk.description}
          </p>
        </div>
        <RiskBadge
          score={result.risk.score}
          label={result.risk.label}
          color={result.risk.color}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '0.75rem' }}>
        {[
          { label: 'Pico infectados', value: `${result.peak_pct}%`, color: '#f87171' },
          { label: 'Alcance total', value: `${result.total_reach_pct}%`, color: '#fbbf24' },
          { label: 'Tempo ao pico', value: `${result.time_to_peak} ticks`, color: '#60a5fa' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: '#0f1117',
            borderRadius: '8px',
            padding: '0.6rem 0.75rem',
            textAlign: 'center',
          }}>
            <div style={{ color, fontSize: '1.1rem', fontWeight: 700 }}>{value}</div>
            <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: '0.2rem' }}>{label}</div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          background: 'transparent', border: 'none',
          color: '#475569', fontSize: '0.78rem',
          cursor: 'pointer', padding: 0,
        }}
      >
        {expanded ? '▲ Ocultar curva' : '▼ Ver curva SEIR'}
      </button>

      {expanded && result.ticks.length > 0 && (
        <div style={{ marginTop: '0.75rem', overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: '0.72rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Tick', 'S', 'E', 'I', 'R'].map(h => (
                  <th key={h} style={{ color: '#64748b', padding: '4px 8px', textAlign: 'right', borderBottom: '1px solid #2d3148' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.ticks
                .filter((_, i) => i % Math.max(1, Math.floor(result.ticks.length / 10)) === 0)
                .map(t => (
                  <tr key={t.tick}>
                    {[t.tick, t.S, t.E, t.I, t.R].map((v, i) => (
                      <td key={i} style={{ color: ['#94a3b8', '#60a5fa', '#fbbf24', '#f87171', '#34d399'][i], padding: '3px 8px', textAlign: 'right' }}>{v}</td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const inputStyle = {
  background: '#1a1d27',
  border: '1px solid #2d3148',
  borderRadius: '8px',
  color: '#e2e8f0',
  padding: '0.75rem',
  width: '100%',
  fontSize: '0.95rem',
  boxSizing: 'border-box',
}

export default function Compare() {
  const [seedText, setSeedText] = useState('')
  const [numAgents, setNumAgents] = useState(150)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')

  async function handleCompare() {
    if (seedText.trim().length < 10) {
      setError('Digite pelo menos 10 caracteres.')
      return
    }
    setLoading(true)
    setError('')
    setResults(null)
    try {
      const res = await apiFetch('/simulation/compare', {
        method: 'POST',
        body: JSON.stringify({ seed_text: seedText, num_agents: numAgents }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.detail || 'Erro ao comparar')
      }
      const data = await res.json()
      setResults(data)
      toast(`Comparação concluída. Melhor intervenção: ${data.best_intervention}`, 'success')
    } catch (e) {
      setError(e.message)
      toast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 2rem' }}>
      <h2 style={{ color: '#818cf8', marginBottom: '0.5rem' }}>Comparar intervenções</h2>
      <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '2rem' }}>
        Roda a mesma simulação com todas as intervenções e mostra qual reduz mais o risco.
      </p>

      <label style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Texto seed</label>
      <textarea
        rows={4}
        value={seedText}
        onChange={e => setSeedText(e.target.value)}
        placeholder="Ex: Governo anuncia bloqueio do Pix a partir de segunda-feira..."
        style={{ ...inputStyle, marginTop: '0.5rem', marginBottom: '1.5rem', resize: 'vertical' }}
      />

      <label style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
        Agentes: <strong style={{ color: '#c7d2fe' }}>{numAgents}</strong>
      </label>
      <input
        type="range" min={50} max={300} step={10} value={numAgents}
        onChange={e => setNumAgents(Number(e.target.value))}
        style={{ width: '100%', marginTop: '0.5rem', marginBottom: '0.5rem', accentColor: '#4f46e5' }}
      />
      <p style={{ color: '#475569', fontSize: '0.75rem', marginBottom: '1.5rem' }}>
        Máximo 300 agentes no modo comparação (5 simulações paralelas)
      </p>

      {error && <p style={{ color: '#f87171', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</p>}

      <button
        onClick={handleCompare}
        disabled={loading}
        style={{
          background: loading ? '#374151' : '#4f46e5',
          color: '#fff', border: 'none', borderRadius: '8px',
          padding: '0.75rem 2rem', fontSize: '1rem', fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          width: '100%', marginBottom: '2rem',
        }}
      >
        {loading ? 'Rodando 5 simulações...' : 'Comparar todas as intervenções →'}
      </button>

      {loading && <PageLoader message="Rodando 5 simulações em paralelo..." />}

      {results && (
        <div>
          <div style={{
            background: '#0f172a',
            border: '1px solid #2d3148',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '2rem',
            display: 'flex',
            gap: '2rem',
            flexWrap: 'wrap',
          }}>
            <div>
              <p style={{ color: '#64748b', fontSize: '0.75rem', margin: 0 }}>Texto simulado</p>
              <p style={{ color: '#c7d2fe', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
                {results.seed_text}
              </p>
            </div>
            <div>
              <p style={{ color: '#64748b', fontSize: '0.75rem', margin: 0 }}>Melhor intervenção</p>
              <p style={{ color: '#34d399', fontSize: '0.95rem', fontWeight: 700, margin: '0.25rem 0 0' }}>
                {results.best_intervention}
              </p>
            </div>
            <div>
              <p style={{ color: '#64748b', fontSize: '0.75rem', margin: 0 }}>Pior cenário</p>
              <p style={{ color: '#f87171', fontSize: '0.95rem', fontWeight: 700, margin: '0.25rem 0 0' }}>
                {results.worst_intervention}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {results.results.map((result, i) => (
              <ResultCard
                key={result.intervention || 'none'}
                result={result}
                isBest={i === 0}
                isWorst={i === results.results.length - 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
