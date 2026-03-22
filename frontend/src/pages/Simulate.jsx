import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SeedSelector from '../components/SeedSelector'
import { apiFetch } from '../api'
import { toast } from '../components/Toast'

const interventions = [
  { value: '', label: 'Nenhuma — propagação livre, sem intervenção' },
  { value: 'label_warning', label: 'Aviso de rótulo — plataforma marca o conteúdo como contestado (-25%)' },
  { value: 'counter_narrative', label: 'Contra-narrativa — publicação de conteúdo verdadeiro disputando espaço (-40%)' },
  { value: 'fact_check', label: 'Fact-check — agência de checagem publica verificação oficial (-50%)' },
  { value: 'removal', label: 'Remoção — publicação retirada do ar pela plataforma ou autoridade (-80%)' },
]

const inputStyle = {
  background: '#081222', border: '1px solid #112236', borderRadius: '8px',
  color: '#E2E8F0', padding: '0.75rem', width: '100%', fontSize: '0.95rem', boxSizing: 'border-box',
}

const TABS = ['Usar seed coletada', 'Digitar texto livre']

export default function Simulate() {
  const navigate = useNavigate()
  const [tab, setTab] = useState(0)
  const [seedText, setSeedText] = useState('')
  const [selectedSeed, setSelectedSeed] = useState(null)
  const [numAgents, setNumAgents] = useState(200)
  const [intervention, setIntervention] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleSeedSelect(seed) {
    setSelectedSeed(seed)
    setSeedText(seed.content)
  }

  async function handleSubmit() {
    const text = tab === 0 ? selectedSeed?.content : seedText
    if (!text || text.trim().length < 10) {
      setError(tab === 0 ? 'Selecione uma seed da lista.' : 'Digite pelo menos 10 caracteres.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const body = {
        seed_text: text,
        seed_id: tab === 0 ? selectedSeed?.id : null,
        num_agents: numAgents,
        intervention: intervention || null,
      }
      const res = await apiFetch('/simulation/start', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.simulation_id) {
        toast('Simulação iniciada! Redirecionando...', 'success')
        navigate(`/simulation/${data.simulation_id}`)
      } else setError('Erro ao iniciar simulacao.')
    } catch {
      const msg = 'Nao foi possivel conectar ao backend.'
      setError(msg)
      toast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '3rem 2rem' }}>
      <h2 style={{ color: '#06B6D4', marginBottom: '0.5rem' }}>Nova simulação</h2>
      <p style={{ color: '#64748B', fontSize: '0.875rem', marginBottom: '2rem' }}>
        Escolha uma notícia verificada ou cole um texto para simular a propagação.
      </p>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {TABS.map((label, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            background: tab === i ? '#06B6D415' : 'transparent', color: tab === i ? '#06B6D4' : '#64748B',
            border: '1px solid', borderColor: tab === i ? '#06B6D4' : '#112236',
            borderRadius: '8px', padding: '0.5rem 1.25rem', fontSize: '0.875rem', cursor: 'pointer',
          }}>{label}</button>
        ))}
      </div>
      {tab === 0 ? (
        <SeedSelector onSelect={handleSeedSelect} />
      ) : (
        <>
          <label style={{ color: '#94A3B8', fontSize: '0.875rem' }}>Texto seed</label>
          <textarea rows={5} value={seedText} onChange={e => setSeedText(e.target.value)}
            placeholder="Cole aqui uma noticia ou texto para simular a propagacao..."
            style={{ ...inputStyle, marginTop: '0.5rem', marginBottom: '1.5rem', resize: 'vertical' }} />
        </>
      )}
      <div style={{ marginTop: '1.5rem' }}>
        <label style={{ color: '#94A3B8', fontSize: '0.875rem' }}>
          Agentes: <strong style={{ color: '#E2E8F0' }}>{numAgents}</strong>
        </label>
        <input type="range" min={50} max={500} step={10} value={numAgents}
          onChange={e => setNumAgents(Number(e.target.value))}
          style={{ width: '100%', marginTop: '0.5rem', marginBottom: '1.5rem', accentColor: '#06B6D4' }} />
        <label style={{ color: '#94A3B8', fontSize: '0.875rem' }}>Intervenção</label>
        <select value={intervention} onChange={e => setIntervention(e.target.value)}
          style={{ ...inputStyle, marginTop: '0.5rem', marginBottom: '2rem' }}>
          {interventions.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        {error && <p style={{ color: '#f87171', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</p>}
        <button onClick={handleSubmit} disabled={loading} style={{
          background: loading ? '#112236' : '#06B6D4', color: loading ? '#475569' : '#000', border: 'none',
          borderRadius: '8px', padding: '0.75rem 2rem', fontSize: '1rem', fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer', width: '100%',
        }}>
          {loading ? 'Iniciando...' : 'Iniciar simulação →'}
        </button>
      </div>
    </div>
  )
}
