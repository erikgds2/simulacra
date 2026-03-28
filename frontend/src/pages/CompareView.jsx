import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Title, Tooltip, Legend,
} from 'chart.js'
import { apiFetch } from '../api'
import { toast } from '../components/Toast'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const COLORS = { S: '#60a5fa', E: '#fbbf24', I: '#f87171', R: '#34d399' }
const RISK_COLORS = {
  'Baixo': '#34d399', 'Low': '#34d399',
  'Moderado': '#fbbf24', 'Moderate': '#fbbf24',
  'Alto': '#f97316', 'High': '#f97316',
  'Crítico': '#f87171', 'Critical': '#f87171',
}

function simLabel(sim) {
  const text = (sim.seed_text || '').slice(0, 50)
  const date = sim.created_at ? new Date(sim.created_at).toLocaleDateString('pt-BR') : ''
  return `${date} · ${text}...`
}

export default function CompareView() {
  const { t } = useTranslation()
  const [simulations, setSimulations] = useState([])
  const [simAId, setSimAId] = useState('')
  const [simBId, setSimBId] = useState('')
  const [comparison, setComparison] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingList, setLoadingList] = useState(true)

  useEffect(() => {
    apiFetch('/simulation/list?limit=50')
      .then(r => r.ok ? r.json() : { simulations: [] })
      .then(d => setSimulations((d.simulations || []).filter(s => s.status === 'finished')))
      .catch(() => {})
      .finally(() => setLoadingList(false))
  }, [])

  async function handleCompare(e) {
    e.preventDefault()
    if (!simAId || !simBId) return
    if (simAId === simBId) { toast('Selecione duas simulações diferentes.', 'error'); return }
    setLoading(true)
    setComparison(null)
    try {
      const res = await apiFetch(`/simulation/compare-view?sim_a=${simAId}&sim_b=${simBId}`)
      if (!res.ok) throw new Error(`Erro ${res.status}`)
      setComparison(await res.json())
      toast(t('compare_view.toast_ok'), 'success')
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const selectStyle = {
    width: '100%', background: '#0f1117', color: '#e2e8f0',
    border: '1px solid #2d3148', borderRadius: '8px',
    padding: '0.6rem 0.875rem', fontSize: '0.875rem',
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(1rem, 3vw, 2rem)' }}>
      <h2 style={{ color: '#818cf8', margin: '0 0 0.4rem', fontSize: '1.4rem' }}>
        {t('compare_view.titulo')}
      </h2>
      <p style={{ color: '#94a3b8', marginBottom: '2rem', fontSize: '0.9rem' }}>
        {t('compare_view.subtitulo')}
      </p>

      <form onSubmit={handleCompare} style={{
        background: '#1a1d27', border: '1px solid #2d3148',
        borderRadius: '12px', padding: '1.5rem',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1.25rem', marginBottom: '2rem', alignItems: 'end',
      }}>
        {['a', 'b'].map((key, idx) => (
          <div key={key}>
            <label htmlFor={`sim-${key}-select`} style={{ color: '#c7d2fe', fontSize: '0.8rem', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
              {idx === 0 ? t('compare_view.sim_a') : t('compare_view.sim_b')}
            </label>
            {loadingList ? (
              <p style={{ color: '#64748b', fontSize: '0.8rem' }}>{t('compare_view.carregando')}</p>
            ) : simulations.length === 0 ? (
              <p style={{ color: '#f87171', fontSize: '0.8rem' }}>{t('compare_view.sem_dados')}</p>
            ) : (
              <select
                id={`sim-${key}-select`}
                value={idx === 0 ? simAId : simBId}
                onChange={e => idx === 0 ? setSimAId(e.target.value) : setSimBId(e.target.value)}
                style={selectStyle}
                required
              >
                <option value="">{t('compare_view.selecione')}</option>
                {simulations.map(s => (
                  <option key={s.id} value={s.id}>{simLabel(s)}</option>
                ))}
              </select>
            )}
          </div>
        ))}
        <button
          type="submit"
          disabled={loading || !simAId || !simBId}
          style={{
            background: loading ? '#1e293b' : '#4f46e5', color: loading ? '#475569' : '#fff',
            border: 'none', borderRadius: '8px', padding: '0.65rem 1.5rem',
            fontSize: '0.9rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? t('compare_view.carregando') : t('compare_view.botao_comparar')}
        </button>
      </form>

      {comparison && (() => {
        const maxTick = Math.max(
          comparison.sim_a.ticks?.length ?? 0,
          comparison.sim_b.ticks?.length ?? 0
        )

        function SyncChart({ ticks, title }) {
          if (!ticks || ticks.length === 0) return null
          const padded = [...ticks]
          const last = ticks[ticks.length - 1]
          while (padded.length < maxTick) {
            padded.push({ tick: padded.length + 1, S: last.S, E: 0, I: 0, R: last.R })
          }
          const labels = padded.map(t => t.tick)
          const data = {
            labels,
            datasets: [
              { label: 'S', data: padded.map(t => t.S), borderColor: COLORS.S, backgroundColor: COLORS.S + '22', tension: 0.3, pointRadius: 0 },
              { label: 'E', data: padded.map(t => t.E), borderColor: COLORS.E, backgroundColor: COLORS.E + '22', tension: 0.3, pointRadius: 0 },
              { label: 'I', data: padded.map(t => t.I), borderColor: COLORS.I, backgroundColor: COLORS.I + '22', tension: 0.3, pointRadius: 0 },
              { label: 'R', data: padded.map(t => t.R), borderColor: COLORS.R, backgroundColor: COLORS.R + '22', tension: 0.3, pointRadius: 0 },
            ],
          }
          return <Line data={data} options={{
            responsive: true,
            animation: { duration: 0 },
            plugins: {
              legend: { labels: { color: '#94A3B8', boxWidth: 12, font: { size: 11 } } },
              title: { display: true, text: title, color: '#c7d2fe', font: { size: 13, weight: '600' } },
            },
            scales: {
              x: { ticks: { color: '#94A3B8', maxTicksLimit: 10 }, grid: { color: '#112236' } },
              y: { ticks: { color: '#94A3B8' }, grid: { color: '#112236' } },
            },
          }} />
        }

        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            {['sim_a', 'sim_b'].map((key, idx) => {
              const sim = comparison[key]
              const risk = sim.risk
              const riskColor = risk ? (RISK_COLORS[risk.label] || '#94a3b8') : '#94a3b8'
              return (
                <div key={key} style={{ background: '#0f1117', border: `1px solid ${riskColor}33`, borderRadius: '12px', padding: '1.25rem' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{ color: '#c7d2fe', fontWeight: 700, fontSize: '0.9rem' }}>
                        {idx === 0 ? t('compare_view.sim_a') : t('compare_view.sim_b')}
                      </span>
                      {risk && (
                        <span style={{ background: riskColor + '22', color: riskColor, border: `1px solid ${riskColor}44`, borderRadius: '6px', padding: '0.2rem 0.6rem', fontSize: '0.8rem', fontWeight: 700 }}>
                          {risk.score} — {risk.label}
                        </span>
                      )}
                    </div>
                    <p style={{ color: '#64748b', fontSize: '0.75rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {(sim.seed_text || '').slice(0, 80)}...
                    </p>
                  </div>
                  <div style={{ background: '#081222', borderRadius: '8px', padding: '0.75rem' }}>
                    <SyncChart ticks={sim.ticks} title={t('compare_view.grafico_titulo')} />
                  </div>
                </div>
              )
            })}
          </div>
        )
      })()}
    </div>
  )
}
