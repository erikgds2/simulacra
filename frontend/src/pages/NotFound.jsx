import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      <p className="text-7xl font-bold text-slate-700 mb-4">404</p>
      <h1 className="text-2xl font-bold text-slate-300 mb-2">Pagina nao encontrada</h1>
      <p className="text-slate-500 mb-8">Esta rota nao existe no DesinfoLab.</p>
      <button
        onClick={() => navigate('/')}
        className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
      >
        Voltar ao inicio
      </button>
    </div>
  )
}
