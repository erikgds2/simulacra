import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <h1 className="text-5xl font-bold text-purple-400 mb-4">MiroFish-BR</h1>
      <p className="text-slate-400 text-lg max-w-xl mb-8">
        Motor de simulacao de desinformacao no Brasil baseado em swarm intelligence.
        Modele como noticias falsas se propagam em redes sociais usando o modelo SEIR.
      </p>
      <button
        onClick={() => navigate('/simulate')}
        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 text-lg"
      >
        Nova Simulacao
      </button>
    </div>
  )
}
