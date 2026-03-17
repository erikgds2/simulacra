import { useNavigate } from 'react-router-dom'

const metricas = [
  { label: 'Fontes de dados', valor: '2', desc: 'Lupa + Aos Fatos' },
  { label: 'Max. agentes', valor: '1.000', desc: 'por simulacao' },
  { label: 'Modelo', valor: 'SEIR', desc: 'Barabasi-Albert' },
]

export default function Dashboard() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] px-4 text-center">
      <h1 className="text-5xl font-bold text-purple-400 mb-3">DesinfoLab</h1>
      <p className="text-slate-400 text-lg max-w-xl mb-10">
        Motor de simulacao de propagacao de desinformacao no Brasil.
        Modele como noticias falsas se espalham em redes sociais usando swarm intelligence e SEIR.
      </p>

      <div className="flex gap-6 mb-10 flex-wrap justify-center">
        {metricas.map(({ label, valor, desc }) => (
          <div key={label} className="bg-slate-800 rounded-xl px-6 py-4 text-center min-w-[120px]">
            <div className="text-2xl font-bold text-purple-300">{valor}</div>
            <div className="text-slate-300 text-sm font-medium">{label}</div>
            <div className="text-slate-500 text-xs">{desc}</div>
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate('/simulate')}
        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-10 rounded-lg transition-colors duration-200 text-lg"
      >
        Nova Simulacao
      </button>
    </div>
  )
}
