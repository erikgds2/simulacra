import { useParams } from 'react-router-dom'
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Legend,
  Tooltip,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import useSimulationSSE from '../hooks/useSimulationSSE.js'

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Legend, Tooltip)

export default function SimulationView() {
  const { id } = useParams()
  const { ticks, isConnected, error } = useSimulationSSE(id)

  const data = {
    labels: ticks.map((t) => `T${t.tick}`),
    datasets: [
      {
        label: 'Infectados',
        data: ticks.map((t) => t.infected),
        borderColor: 'rgb(239,68,68)',
        backgroundColor: 'rgba(239,68,68,0.1)',
        tension: 0.3,
      },
      {
        label: 'Expostos',
        data: ticks.map((t) => t.exposed),
        borderColor: 'rgb(234,179,8)',
        backgroundColor: 'rgba(234,179,8,0.1)',
        tension: 0.3,
      },
      {
        label: 'Recuperados',
        data: ticks.map((t) => t.recovered),
        borderColor: 'rgb(34,197,94)',
        backgroundColor: 'rgba(34,197,94,0.1)',
        tension: 0.3,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: { legend: { labels: { color: '#e2e8f0' } } },
    scales: {
      x: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } },
      y: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } },
    },
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold text-purple-400 mb-2">Simulacao</h2>
      <p className="text-slate-400 text-sm mb-2">ID: {id}</p>
      <p className="text-sm mb-6">
        Status:{' '}
        <span className={isConnected ? 'text-green-400' : 'text-slate-400'}>
          {isConnected ? 'Conectado' : 'Aguardando...'}
        </span>
      </p>
      {error && <p className="text-red-400 mb-4">{error}</p>}
      {ticks.length > 0 ? (
        <div className="bg-slate-800 rounded-xl p-6">
          <Line data={data} options={options} />
        </div>
      ) : (
        <p className="text-slate-400">Aguardando dados da simulacao...</p>
      )}
    </div>
  )
}
