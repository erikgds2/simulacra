import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import SeedSelector from '../components/SeedSelector'
import { apiFetch } from '../api'
import { toast } from '../components/Toast'

const inputStyle = {
  background: '#081222', border: '1px solid #112236', borderRadius: '8px',
  color: '#E2E8F0', padding: '0.75rem', width: '100%', fontSize: '0.95rem', boxSizing: 'border-box',
}

const TABS = ['Usar seed coletada', 'Digitar texto livre']

export default function Simulate() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [tab, setTab] = useState(0)
  const [seedText, setSeedText] = useState('')
  const [selectedSeed, setSelectedSeed] = useState(null)
  const [numAgents, setNumAgents] = useState(200)
  const [intervention, setIntervention] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const interventions = [
    { value: '', label: t('simulate.intervencao_nenhuma') },
    { value: 'label_warning', label: t('simulate.intervencao_aviso') },
    { value: 'counter_narrative', label: t('simulate.intervencao_contra') },
    { value: 'fact_check', label: t('simulate.intervencao_factcheck') },
    { value: 'removal', label: t('simulate.intervencao_remocao') },
  ]

  function handleSeedSelect(seed) {
    setSelectedSeed(seed)
    setSeedText(seed.content)
  }

  async function handleSubmit() {
    const text = tab === 0 ? selectedSeed?.content : seedText
    if (!text || text.trim().length < 10) {
      setError(tab === 0 ? 'Selecione uma seed da lista.' : t('compare.minimo_chars'))
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
        toast(t('simulate.toast_iniciada'), 'success')
        navigate(`/simulation/${data.simulation_id}`)
      } else setError('Erro ao iniciar simulacao.')
    } catch {
      const msg = t('simulate.erro_conexao')
      setError(msg)
      toast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: 'clamp(1.5rem, 4vw, 3rem) clamp(1rem, 4vw, 2rem)' }}>
      <h2 style={{ color: '#06B6D4', marginBottom: '0.5rem' }}>{t('simulate.titulo')}</h2>
      <p style={{ color: '#64748B', fontSize: '0.875rem', marginBottom: '2rem' }}>
        {t('simulate.seed_hint')}
      </p>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {TABS.map((label, i) => (
          <button type="button" key={i} onClick={() => setTab(i)} style={{
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
          <label htmlFor="seed-text" style={{ color: '#94A3B8', fontSize: '0.875rem' }}>{t('simulate.seed_label')}</label>
          <textarea
            id="seed-text"
            rows={5}
            value={seedText}
            onChange={e => setSeedText(e.target.value)}
            placeholder={t('simulate.seed_placeholder')}
            style={{ ...inputStyle, marginTop: '0.5rem', marginBottom: '1.5rem', resize: 'vertical' }}
          />
        </>
      )}
      <div style={{ marginTop: '1.5rem' }}>
        <label htmlFor="num-agents" style={{ color: '#94A3B8', fontSize: '0.875rem' }}>
          {t('simulate.agentes_label')}: <strong style={{ color: '#E2E8F0' }}>{numAgents}</strong>
        </label>
        <input
          id="num-agents"
          type="range"
          min={50}
          max={500}
          step={10}
          value={numAgents}
          onChange={e => setNumAgents(Number(e.target.value))}
          style={{ width: '100%', marginTop: '0.5rem', marginBottom: '0.35rem', accentColor: '#06B6D4' }}
        />
        <p style={{ color: '#475569', fontSize: '0.75rem', marginBottom: '1.5rem' }}>{t('simulate.agentes_hint')}</p>
        <label htmlFor="intervention" style={{ color: '#94A3B8', fontSize: '0.875rem' }}>{t('simulate.intervencao_label')}</label>
        <select
          id="intervention"
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
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          style={{
            background: loading ? '#112236' : '#06B6D4', color: loading ? '#475569' : '#000', border: 'none',
            borderRadius: '8px', padding: '0.75rem 2rem', fontSize: '1rem', fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer', width: '100%',
          }}
        >
          {loading ? t('simulate.botao_simulando') : t('simulate.botao_simular')}
        </button>
      </div>
    </div>
  )
}
