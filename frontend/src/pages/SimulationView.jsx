import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Title, Tooltip, Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const COLORS = { S: '#60a5fa', E: '#fbbf24', I: '#f87171', R: '#34d399' }

function MetricCard({ label, value, color }) {
  return (
    <div style={{
      background: '#1a1d27',
      border: `1px solid ${color}44`,
      borderRadius: '10px',
      padding: '1rem 1.5rem',
      textAlign: 'center',
      minWidth: '120px',
    }}>
      <div style={{ color, fontSize: '1.75rem', fontWeight: 700 }}>{value}</div>
      <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.25rem' }}>{label}</div>
    </div>
  )
}

export default function SimulationView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ticks, setTicks] = useState([])
  const [done, setDone] = useState(false)
  const [connected, setConnected] = useState(false)
  const esRef = useRef(null)

  useEffect(() => {
    if (!id) return
    const es = new EventSource(`/api/simulation/${id}/stream`)
    esRef.current = es
    setConnected(true)
    es.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.done) {
        setDone(true)
        es.close()
        setConnected(false)
        return
      }
      setTicks(prev => [...prev, data])
    }
    es.onerror = () => {
      es.close()
      setConnected(false)
    }
    return () => es.close()
  }, [id])

  const labels = ticks.map(t => t.tick)
  const chartData = {
    labels,
    datasets: [
      { label: 'Suscetíveis', data: ticks.map(t => t.S), borderColor: COLORS.S, backgroundColor: COLORS.S + '22', tension: 0.3, pointRadius: 0 },
      { label: 'Expostos',    data: ticks.map(t => t.E), borderColor: COLORS.E, backgroundColor: COLORS.E + '22', tension: 0.3, pointRadius: 0 },
      { label: 'Infectados',  data: ticks.map(t => t.I), borderColor: COLORS.I, backgroundColor: COLORS.I + '22', tension: 0.3, pointRadius: 0 },
      { label: 'Recuperados', data: ticks.map(t => t.R), borderColor: COLORS.R, backgroundColor: COLORS.R + '22', tension: 0.3, pointRadius: 0 },
    ],
  }

  const options = {
    responsive: true,
    animation: { duration: 0 },
    plugins: { legend: { labels: { color: '#94a3b8' } } },
    scales: {
      x: { ticks: { color: '#94a3b8' }, grid: { color: '#2d3148' } },
      y: { ticks: { color: '#94a3b8' }, grid: { color: '#2d3148' } },
    },
  }

  const last = ticks[ticks.length - 1] || { S: 0, E: 0, I: 0, R: 0 }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <h2 style={{ color: '#818cf8', margin: 0 }}>Simulação ao vivo</h2>
        {connected && <span style={{ color: '#34d399', fontSize: '0.8rem' }}>● transmitindo</span>}
        {done && <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>● concluída</span>}
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <MetricCard label="Suscetíveis" value={last.S} color={COLORS.S} />
        <MetricCard label="Expostos"    value={last.E} color={COLORS.E} />
        <MetricCard label="Infectados"  value={last.I} color={COLORS.I} />
        <MetricCard label="Recuperados" value={last.R} color={COLORS.R} />
      </div>

      <div style={{
        background: '#1a1d27',
        border: '1px solid #2d3148',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
      }}>
        {ticks.length > 0
          ? <Line data={chartData} options={options} />
          : <p style={{ color: '#94a3b8', textAlign: 'center', padding: '3rem 0' }}>Aguardando dados...</p>
        }
      </div>

      {done && (
        <button
          onClick={() => navigate('/simulate')}
          style={{
            background: '#4f46e5',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '0.75rem 2rem',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Nova simulação →
        </button>
      )}
    </div>
  )
}
