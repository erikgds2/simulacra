import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const interventions = [
  { value: '', label: 'Nenhuma' },
  { value: 'fact_check', label: 'Fact-check' },
  { value: 'removal', label: 'Remoção' },
  { value: 'counter_narrative', label: 'Contra-narrativa' },
  { value: 'label_warning', label: 'Aviso de rótulo' },
]

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

export default function Simulate() {
  const navigate = useNavigate()
  const [seedText, setSeedText] = useState('')
  const [numAgents, setNumAgents] = useState(200)
  const [intervention, setIntervention] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!seedText.trim()) { setError('Cole um texto para simular.'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/simulation/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seed_text: seedText,
          num_agents: numAgents,
          intervention: intervention || null,
        }),
      })
      const data = await res.json()
      if (data.simulation_id) {
        navigate(`/simulation/${data.simulation_id}`)
      } else {
        setError('Erro ao iniciar simulação.')
      }
    } catch {
      setError('Não foi possível conectar ao backend. Verifique se está rodando.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '3rem 2rem' }}>
      <h2 style={{ color: '#818cf8', marginBottom: '2rem' }}>Nova simulação</h2>

      <label style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Texto seed</label>
      <textarea
        rows={5}
        value={seedText}
        onChange={e => setSeedText(e.target.value)}
        placeholder="Cole aqui uma notícia ou texto para simular a propagação..."
        style={{ ...inputStyle, marginTop: '0.5rem', marginBottom: '1.5rem', resize: 'vertical' }}
      />

      <label style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
        Agentes: <strong style={{ color: '#c7d2fe' }}>{numAgents}</strong>
      </label>
      <input
        type="range"
        min={50}
        max={500}
        value={numAgents}
        onChange={e => setNumAgents(Number(e.target.value))}
        style={{ width: '100%', marginTop: '0.5rem', marginBottom: '1.5rem', accentColor: '#4f46e5' }}
      />

      <label style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Intervenção</label>
      <select
        value={intervention}
        onChange={e => setIntervention(e.target.value)}
        style={{ ...inputStyle, marginTop: '0.5rem', marginBottom: '2rem' }}
      >
        {interventions.map(({ value, label }) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>

      {error && <p style={{ color: '#f87171', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          background: loading ? '#374151' : '#4f46e5',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          padding: '0.75rem 2rem',
          fontSize: '1rem',
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          width: '100%',
        }}
      >
        {loading ? 'Iniciando...' : 'Iniciar simulação →'}
      </button>
    </div>
  )
}
