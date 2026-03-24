import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { apiFetch } from '../api'
import { toast } from '../components/Toast'
import PageLoader from '../components/PageLoader'
import RegionSelector from '../components/RegionSelector'

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

export default function MultiSeed() {
  const { t } = useTranslation()
  const [seeds, setSeeds] = useState(['', ''])
  const [numAgents, setNumAgents] = useState(150)
  const [intervention, setIntervention] = useState('')
  const [region, setRegion] = useState(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')

  function handleSeedChange(index, value) {
    const next = [...seeds]
    next[index] = value
    setSeeds(next)
  }

  function addSeed() {
    if (seeds.length < 5) setSeeds([...seeds, ''])
  }

  function removeSeed(index) {
    if (seeds.length > 2) setSeeds(seeds.filter((_, i) => i !== index))
  }

  async function handleSubmit() {
    if (seeds.length < 2) {
      setError(t('multi.minimo_seeds'))
      return
    }
    if (seeds.some(s => s.trim().length < 10)) {
      setError(t('multi.minimo_chars'))
      return
    }
    setError('')
    setLoading(true)
    setResults(null)
    try {
      const res = await apiFetch('/simulation/multi', {
        method: 'POST',
        body: JSON.stringify({
          seeds: seeds.map(s => s.trim()),
          num_agents: numAgents,
          intervention: intervention || null,
          region: region || null,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.detail || 'Erro ao simular')
      }
      const data = await res.json()
      setResults(data)
      toast(t('multi.toast_ok', { count: data.results.length }), 'success')
    } catch (e) {
      setError(e.message)
      toast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(1.5rem, 4vw, 3rem) clamp(1rem, 4vw, 2rem)' }}>
      <h2 style={{ color: '#818cf8', marginBottom: '0.5rem' }}>{t('multi.titulo')}</h2>
      <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '2rem' }}>
        {t('multi.subtitulo')}
      </p>

      {/* Dynamic seed textareas */}
      {seeds.map((seed, i) => (
        <div key={i} style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <label style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
              {t('multi.seed_label', { n: i + 1 })}
            </label>
            {seeds.length > 2 && (
              <button
                type="button"
                onClick={() => removeSeed(i)}
                style={{
                  background: 'transparent',
                  border: '1px solid #4b1c1c',
                  color: '#f87171',
                  borderRadius: '6px',
                  padding: '0.2rem 0.6rem',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                }}
              >
                {t('multi.remover_seed')}
              </button>
            )}
          </div>
          <textarea
            rows={3}
            value={seed}
            onChange={e => handleSeedChange(i, e.target.value)}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>
      ))}

      {seeds.length < 5 && (
        <button
          type="button"
          onClick={addSeed}
          style={{
            background: 'transparent',
            border: '1px dashed #4f46e5',
            color: '#818cf8',
            borderRadius: '8px',
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            cursor: 'pointer',
            marginBottom: '1.5rem',
            width: '100%',
          }}
        >
          {t('multi.adicionar_seed')}
        </button>
      )}

      {/* Agents slider */}
      <label htmlFor="multi-agents" style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
        {t('multi.agentes_label')}: <strong style={{ color: '#c7d2fe' }}>{numAgents}</strong>
      </label>
      <input
        id="multi-agents"
        type="range"
        min={50}
        max={300}
        step={10}
        value={numAgents}
        onChange={e => setNumAgents(Number(e.target.value))}
        style={{ width: '100%', marginTop: '0.5rem', marginBottom: '0.5rem', accentColor: '#4f46e5' }}
      />
      <p style={{ color: '#475569', fontSize: '0.75rem', marginBottom: '1.5rem' }}>
        {t('multi.agentes_hint')}
      </p>

      {/* Intervention select */}
      <label htmlFor="multi-intervention" style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
        {t('multi.intervencao_label')}
      </label>
      <select
        id="multi-intervention"
        value={intervention}
        onChange={e => setIntervention(e.target.value)}
        style={{ ...inputStyle, marginTop: '0.5rem', marginBottom: '1.5rem' }}
      >
        <option value="">{t('simulate.intervencao_nenhuma')}</option>
        <option value="fact_check">{t('simulate.intervencao_factcheck')}</option>
        <option value="removal">{t('simulate.intervencao_remocao')}</option>
        <option value="counter_narrative">{t('simulate.intervencao_contra')}</option>
        <option value="label_warning">{t('simulate.intervencao_aviso')}</option>
      </select>

      <RegionSelector value={region} onChange={setRegion} />

      {error && <p style={{ color: '#f87171', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</p>}

      <button
        type="button"
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
          marginBottom: '2rem',
        }}
      >
        {loading
          ? t('multi.botao_simulando', { count: seeds.length })
          : t('multi.botao_simular')}
      </button>

      {loading && <PageLoader message={t('multi.botao_simulando', { count: seeds.length })} />}

      {results && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1rem',
          marginTop: '1rem',
        }}>
          {results.results.map((result, i) => (
            <ResultCard key={i} result={result} t={t} />
          ))}
        </div>
      )}
    </div>
  )
}

function RiskBadge({ score, label, color }) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.4rem',
      background: color + '22',
      border: `1px solid ${color}44`,
      borderRadius: '6px',
      padding: '0.2rem 0.6rem',
    }}>
      <span style={{ color, fontWeight: 700, fontSize: '0.9rem' }}>{score}</span>
      <span style={{ color, fontSize: '0.75rem' }}>{label}</span>
    </div>
  )
}

function ResultCard({ result, t }) {
  const seedPreview = result.seed_text.length > 80
    ? result.seed_text.slice(0, 80) + '…'
    : result.seed_text

  return (
    <div style={{
      background: '#1a1d27',
      border: '1px solid #2d3148',
      borderRadius: '12px',
      padding: '1.25rem',
    }}>
      <div style={{ marginBottom: '0.75rem' }}>
        <p style={{ color: '#94a3b8', fontSize: '0.72rem', margin: '0 0 0.25rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {t('multi.seed_resultado', { n: result.seed_index + 1 })}
        </p>
        <p style={{ color: '#c7d2fe', fontSize: '0.85rem', margin: 0, lineHeight: 1.4 }}>
          {seedPreview}
        </p>
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <RiskBadge
          score={result.risk.score}
          label={result.risk.label}
          color={result.risk.color}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
        {[
          { label: t('multi.pico'), value: `${result.peak_pct}%`, color: '#f87171' },
          { label: t('multi.alcance'), value: `${result.total_reach_pct}%`, color: '#fbbf24' },
          { label: t('multi.tempo_pico'), value: `${result.time_to_peak} ${t('multi.ticks')}`, color: '#60a5fa' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: '#0f1117',
            borderRadius: '8px',
            padding: '0.5rem',
            textAlign: 'center',
          }}>
            <div style={{ color, fontSize: '1rem', fontWeight: 700 }}>{value}</div>
            <div style={{ color: '#64748b', fontSize: '0.68rem', marginTop: '0.2rem' }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
