import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { apiFetch } from '../api'
import BASE_URL from '../api'
import { SkeletonList } from '../components/Skeleton'
import ColdStartBanner from '../components/ColdStartBanner'
import { toast } from '../components/Toast'

const STATUS_COLORS = {
  ready: '#fbbf24',
  finished: '#34d399',
  error: '#f87171',
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [simulations, setSimulations] = useState([])
  const [loading, setLoading] = useState(true)
  const [apiOnline, setApiOnline] = useState(null)

  const infoCards = [
    { title: t('dashboard.card_como_funciona_titulo'), text: t('dashboard.card_como_funciona_texto') },
    { title: t('dashboard.card_fontes_titulo'), text: t('dashboard.card_fontes_texto') },
    { title: t('dashboard.card_intervencoes_titulo'), text: t('dashboard.card_intervencoes_texto') },
  ]

  const STATUS_LABELS = {
    ready: t('dashboard.status_andamento'),
    finished: t('dashboard.status_concluida'),
    error: t('dashboard.status_erro'),
  }

  useEffect(() => {
    async function load() {
      try {
        const health = await apiFetch('/health')
        setApiOnline(health.ok)
        const r = await apiFetch('/simulation/list?limit=10')
        if (r.ok) {
          const d = await r.json()
          setSimulations(d.simulations || [])
        }
      } catch {
        setApiOnline(false)
        toast(t('dashboard.erro_conexao'), 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: 'clamp(1.5rem, 4vw, 3rem) clamp(1rem, 4vw, 2rem)' }}>
      <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 700, color: '#818cf8', marginBottom: '0.5rem' }}>
        {t('dashboard.titulo')}
      </h1>
      <p style={{ color: '#94a3b8', marginBottom: '2.5rem', fontSize: '1.05rem' }}>
        {t('dashboard.subtitulo')}
      </p>

      {loading && apiOnline === null && <ColdStartBanner />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {infoCards.map(({ title, text }) => (
          <div key={title} style={{
            background: '#1a1d27',
            border: '1px solid #2d3148',
            borderRadius: '12px',
            padding: '1.5rem',
          }}>
            <h3 style={{ color: '#c7d2fe', marginBottom: '0.75rem', fontSize: '1rem' }}>{title}</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.6 }}>{text}</p>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => navigate('/simulate')}
        style={{
          background: '#4f46e5', color: '#fff', border: 'none',
          borderRadius: '8px', padding: '0.75rem 2rem',
          fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
          marginBottom: '3rem',
        }}
      >
        {t('dashboard.iniciar')}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ color: '#c7d2fe', fontSize: '1.1rem', margin: 0 }}>
          {t('dashboard.recentes')}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {apiOnline === false && (
            <span style={{ color: '#f87171', fontSize: '0.78rem' }}>{t('dashboard.servidor_offline')}</span>
          )}
          {apiOnline === true && (
            <span style={{ color: '#34d399', fontSize: '0.78rem' }}>{t('dashboard.servidor_online')}</span>
          )}
          <a
            href={`${BASE_URL}/seeds/export/csv`}
            download
            title={t('export.tooltip_seeds')}
            style={{
              background: 'transparent', color: '#94a3b8', border: '1px solid #2d3148',
              borderRadius: '6px', padding: '0.3rem 0.75rem',
              fontSize: '0.75rem', cursor: 'pointer',
              textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
            }}
          >
            {t('export.seeds_csv')}
          </a>
        </div>
      </div>

      {loading ? (
        <SkeletonList count={3} />
      ) : simulations.length === 0 ? (
        <div style={{
          background: '#1a1d27', border: '1px solid #2d3148',
          borderRadius: '10px', padding: '2rem', textAlign: 'center',
        }}>
          <p style={{ color: '#64748b', margin: 0 }}>
            {t('dashboard.nenhuma')}
          </p>
          <p style={{ color: '#475569', fontSize: '0.8rem', margin: '0.5rem 0 0' }}>
            {t('dashboard.nenhuma_sub')}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {simulations.map(sim => (
            <div
              key={sim.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/simulation/${sim.id}`)}
              onKeyDown={e => e.key === 'Enter' && navigate(`/simulation/${sim.id}`)}
              style={{
                background: '#1a1d27', border: '1px solid #2d3148',
                borderRadius: '10px', padding: '1rem 1.25rem',
                cursor: 'pointer', display: 'flex',
                alignItems: 'center', gap: '1rem',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#4f46e5'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#2d3148'}
            >
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: STATUS_COLORS[sim.status] || '#64748b',
                flexShrink: 0,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  color: '#c7d2fe', fontSize: '0.875rem', margin: 0,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {sim.seed_text?.slice(0, 80)}...
                </p>
                <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0.25rem 0 0' }}>
                  {formatDate(sim.created_at)} · {sim.num_agents} agentes
                  {sim.intervention ? ` · ${sim.intervention}` : ''}
                  · <span style={{ color: STATUS_COLORS[sim.status] }}>
                    {STATUS_LABELS[sim.status] || sim.status}
                  </span>
                </p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {sim.peak_infected != null && (
                  <p style={{ color: '#f87171', fontSize: '0.875rem', margin: 0, fontWeight: 600 }}>
                    {t('dashboard.pico')}: {sim.peak_infected}
                  </p>
                )}
                {sim.total_reach != null && (
                  <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: '0.2rem 0 0' }}>
                    {t('dashboard.alcance')}: {(sim.total_reach * 100).toFixed(1)}%
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
