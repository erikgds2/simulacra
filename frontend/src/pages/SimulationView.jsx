import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Title, Tooltip, Legend,
} from 'chart.js'
import PropagationGraph from '../components/PropagationGraph'
import { apiFetch } from '../api'
import BASE_URL from '../api'
import { toast } from '../components/Toast'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const COLORS = { S: '#60a5fa', E: '#fbbf24', I: '#f87171', R: '#34d399' }

function MetricCard({ label, value, color }) {
  return (
    <div style={{
      background: '#081222',
      border: `1px solid ${color}44`,
      borderRadius: '10px',
      padding: '1rem 1.5rem',
      textAlign: 'center',
      flex: '1 1 120px',
      minWidth: '100px',
    }}>
      <div style={{ color, fontSize: '1.75rem', fontWeight: 700 }}>{value}</div>
      <div style={{ color: '#94A3B8', fontSize: '0.8rem', marginTop: '0.25rem' }}>{label}</div>
    </div>
  )
}

export default function SimulationView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [ticks, setTicks] = useState([])
  const [done, setDone] = useState(false)
  const [connected, setConnected] = useState(false)
  const [result, setResult] = useState(null)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [reportError, setReportError] = useState(null)
  const esRef = useRef(null)

  useEffect(() => {
    if (!id) return
    const es = new EventSource(`${BASE_URL}/simulation/${id}/stream`)
    esRef.current = es
    setConnected(true)
    es.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.done) {
        setDone(true)
        es.close()
        setConnected(false)
        toast(t('simulation_view.toast_concluida'), 'success')
        apiFetch(`/simulation/${id}/result`)
          .then(r => r.json())
          .then(d => setResult(d))
          .catch(() => {})
        return
      }
      setTicks(prev => [...prev, data])
    }
    es.onerror = () => {
      es.close()
      setConnected(false)
      toast(t('simulation_view.toast_conexao_perdida'), 'error')
    }
    return () => es.close()
  }, [id])

  const labels = ticks.map(t => t.tick)
  const chartData = {
    labels,
    datasets: [
      { label: t('simulation_view.suscetiveis'), data: ticks.map(tick => tick.S), borderColor: COLORS.S, backgroundColor: COLORS.S + '22', tension: 0.3, pointRadius: 0 },
      { label: t('simulation_view.expostos'),    data: ticks.map(tick => tick.E), borderColor: COLORS.E, backgroundColor: COLORS.E + '22', tension: 0.3, pointRadius: 0 },
      { label: t('simulation_view.infectados'),  data: ticks.map(tick => tick.I), borderColor: COLORS.I, backgroundColor: COLORS.I + '22', tension: 0.3, pointRadius: 0 },
      { label: t('simulation_view.recuperados'), data: ticks.map(tick => tick.R), borderColor: COLORS.R, backgroundColor: COLORS.R + '22', tension: 0.3, pointRadius: 0 },
    ],
  }

  const options = {
    responsive: true,
    animation: { duration: 0 },
    plugins: { legend: { labels: { color: '#94A3B8' } } },
    scales: {
      x: { ticks: { color: '#94A3B8' }, grid: { color: '#112236' } },
      y: { ticks: { color: '#94A3B8' }, grid: { color: '#112236' } },
    },
  }

  async function handleGenerateReport() {
    setGeneratingReport(true)
    setReportError(null)
    try {
      const res = await apiFetch('/report/generate', {
        method: 'POST',
        body: JSON.stringify({ simulation_id: id }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || `Erro ${res.status}`)
      }
      const data = await res.json()
      toast(t('simulation_view.toast_relatorio_ok'), 'success')
      navigate(`/report/${data.id}`)
    } catch (err) {
      setReportError(err.message)
      setGeneratingReport(false)
    }
  }

  const last = ticks[ticks.length - 1] || { S: 0, E: 0, I: 0, R: 0 }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(1rem, 3vw, 2rem)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <h2 style={{ color: '#06B6D4', margin: 0 }}>{t('simulation_view.titulo')}</h2>
        {connected && <span style={{ color: '#34d399', fontSize: '0.8rem' }}>{t('simulation_view.transmitindo')}</span>}
        {done && <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{t('simulation_view.concluida')}</span>}
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <MetricCard label={t('simulation_view.suscetiveis')} value={last.S} color={COLORS.S} />
        <MetricCard label={t('simulation_view.expostos')}    value={last.E} color={COLORS.E} />
        <MetricCard label={t('simulation_view.infectados')}  value={last.I} color={COLORS.I} />
        <MetricCard label={t('simulation_view.recuperados')} value={last.R} color={COLORS.R} />
      </div>

      {result?.risk && (
        <div style={{
          background: '#1a1d27',
          border: `1px solid ${result.risk.color}44`,
          borderRadius: '12px',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          flexWrap: 'wrap',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '2.5rem', fontWeight: 700,
              color: result.risk.color, lineHeight: 1,
            }}>
              {result.risk.score}
            </div>
            <div style={{
              color: result.risk.color, fontSize: '0.8rem',
              fontWeight: 600, marginTop: '0.25rem',
            }}>
              {result.risk.label}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ color: '#c7d2fe', fontSize: '0.9rem', margin: 0, fontWeight: 500 }}>
              {t('simulation_view.score_risco')}
            </p>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>
              {result.risk.description}
            </p>
          </div>
          {result.region && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fbbf24' }}>
                {result.region}
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.72rem', marginTop: '0.2rem' }}>
                {t('report.regiao')}
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{
        background: '#081222',
        border: '1px solid #112236',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
      }}>
        {ticks.length > 0
          ? <Line data={chartData} options={options} />
          : <p style={{ color: '#94A3B8', textAlign: 'center', padding: '3rem 0' }}>{t('simulation_view.aguardando')}</p>
        }
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ color: '#94A3B8', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
          {t('simulation_view.grafo_titulo')} ({ticks.length > 0 ? `tick ${ticks[ticks.length-1].tick}` : t('simulation_view.aguardando')})
        </p>
        <PropagationGraph ticks={ticks} numAgents={200} />
      </div>

      {done && (
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleGenerateReport}
            disabled={generatingReport}
            style={{
              background: generatingReport ? '#112236' : '#06B6D4',
              color: generatingReport ? '#475569' : '#000', border: 'none',
              borderRadius: '8px', padding: '0.75rem 2rem',
              fontSize: '1rem', fontWeight: 600,
              cursor: generatingReport ? 'not-allowed' : 'pointer',
              opacity: generatingReport ? 0.8 : 1,
            }}
          >
            {generatingReport ? t('simulation_view.gerando') : t('simulation_view.gerar_relatorio')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/simulate')}
            style={{
              background: '#081222', color: '#94A3B8', border: '1px solid #112236',
              borderRadius: '8px', padding: '0.75rem 2rem',
              fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            {t('simulation_view.nova_simulacao')}
          </button>
          {reportError && (
            <span style={{ color: '#f87171', fontSize: '0.875rem' }}>
              ⚠ {reportError}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
