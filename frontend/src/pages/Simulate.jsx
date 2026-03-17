import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Simulate() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ seed_text: '', num_agents: 200, intervention: '' })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: name === 'num_agents' ? Number(value) : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seed_text: form.seed_text,
          num_agents: form.num_agents,
          intervention: form.intervention || null,
        }),
      })
      const data = await res.json()
      navigate(`/simulation/${data.simulation_id}`)
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold text-purple-400 mb-8">Nova Simulacao</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <label className="block text-slate-300 font-medium mb-2">Conteudo de desinformacao</label>
          <textarea
            name="seed_text"
            value={form.seed_text}
            onChange={handleChange}
            required
            rows={4}
            placeholder="Ex: Vacinas causam autismo segundo novo estudo..."
            className="w-full bg-slate-800 text-slate-100 rounded-lg p-3 border border-slate-600 focus:outline-none focus:border-purple-500"
          />
        </div>
        <div>
          <label className="block text-slate-300 font-medium mb-2">
            Numero de agentes: <span className="text-purple-400">{form.num_agents}</span>
          </label>
          <input
            type="range" name="num_agents" min={50} max={1000} step={10}
            value={form.num_agents} onChange={handleChange}
            className="w-full accent-purple-500"
          />
          <div className="flex justify-between text-slate-500 text-sm mt-1">
            <span>50</span><span>1000</span>
          </div>
        </div>
        <div>
          <label className="block text-slate-300 font-medium mb-2">Intervencao</label>
          <select
            name="intervention" value={form.intervention} onChange={handleChange}
            className="w-full bg-slate-800 text-slate-100 rounded-lg p-3 border border-slate-600 focus:outline-none focus:border-purple-500"
          >
            <option value="">Sem intervencao</option>
            <option value="fact_check">Fact-check</option>
            <option value="label">Rotulagem</option>
            <option value="remove">Remocao de conteudo</option>
          </select>
        </div>
        <button
          type="submit" disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
        >
          {loading ? 'Simulando...' : 'Iniciar Simulacao'}
        </button>
      </form>
    </div>
  )
}
