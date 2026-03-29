import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Markdown from 'react-markdown'
import { apiFetch } from '../api'
import BASE_URL from '../api'

/* ─── Print / PDF styles ─────────────────────────────────────────── */
const PRINT_STYLE = `
@media print {
  body { background: #fff !important; color: #111 !important; }
  .no-print { display: none !important; }

  .report-shell {
    padding: 0 !important;
    max-width: 100% !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }
  .report-card {
    background: #fff !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }
  .report-header {
    background: #fff !important;
    border: 1px solid #d1d5db !important;
    border-radius: 8px !important;
    margin-bottom: 24px !important;
    page-break-inside: avoid !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }
  .metric-card {
    border: 1px solid #d1d5db !important;
    background: #f9fafb !important;
  }
  .risk-block {
    border: 1px solid #d1d5db !important;
    background: #f9fafb !important;
  }

  /* Prevent text overflow — core fix */
  * {
    box-sizing: border-box !important;
    overflow-wrap: break-word !important;
    word-wrap: break-word !important;
    word-break: break-word !important;
    max-width: 100% !important;
  }

  /* Code blocks: wrap long lines instead of clipping */
  pre, code {
    white-space: pre-wrap !important;
    word-break: break-all !important;
    font-size: 0.78rem !important;
  }

  /* Tables: fixed layout so columns don't overflow */
  table {
    table-layout: fixed !important;
    width: 100% !important;
    page-break-inside: avoid !important;
    border-collapse: collapse !important;
  }
  td, th {
    word-break: break-word !important;
    overflow-wrap: break-word !important;
    hyphens: auto !important;
    padding: 0.4rem 0.5rem !important;
    font-size: 0.82rem !important;
  }

  /* Images */
  img { max-width: 100% !important; height: auto !important; }

  /* Headings and paragraphs */
  h1, h2, h3 { page-break-after: avoid !important; }
  p, li { page-break-inside: avoid !important; line-height: 1.6 !important; }

  /* Metric cards grid: collapse to 2 cols max in print */
  .metric-cards-row {
    display: grid !important;
    grid-template-columns: repeat(3, 1fr) !important;
    gap: 8px !important;
  }

  @page {
    margin: 2cm 2.5cm;
    size: A4 portrait;
  }
}
`

/* ─── Markdown components — paleta profissional ──────────────────── */
const mdComponents = {
  h1: ({ children }) => (
    <h1 style={{
      color: '#0f172a',
      fontSize: '1.5rem',
      fontWeight: 700,
      marginBottom: '0.75rem',
      marginTop: '0.5rem',
      borderBottom: '2px solid #e2e8f0',
      paddingBottom: '0.5rem',
      letterSpacing: '-0.01em',
    }}>
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 style={{
      color: '#1e3a5f',
      fontSize: '1.1rem',
      fontWeight: 700,
      marginTop: '2rem',
      marginBottom: '0.6rem',
      paddingLeft: '0.75rem',
      borderLeft: '3px solid #2563eb',
    }}>
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 style={{
      color: '#334155',
      fontSize: '0.95rem',
      fontWeight: 600,
      marginTop: '1.25rem',
      marginBottom: '0.4rem',
    }}>
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p style={{
      color: '#374151',
      lineHeight: 1.8,
      marginBottom: '0.85rem',
      fontSize: '0.925rem',
    }}>
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul style={{ color: '#374151', paddingLeft: '1.5rem', marginBottom: '0.85rem' }}>
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol style={{ color: '#374151', paddingLeft: '1.5rem', marginBottom: '0.85rem' }}>
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li style={{ marginBottom: '0.4rem', lineHeight: 1.7, fontSize: '0.925rem' }}>
      {children}
    </li>
  ),
  strong: ({ children }) => (
    <strong style={{ color: '#0f172a', fontWeight: 700 }}>{children}</strong>
  ),
  em: ({ children }) => (
    <em style={{ color: '#4b5563' }}>{children}</em>
  ),
  hr: () => (
    <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '1.75rem 0' }} />
  ),
  blockquote: ({ children }) => (
    <blockquote style={{
      borderLeft: '4px solid #2563eb',
      paddingLeft: '1rem',
      color: '#4b5563',
      margin: '1.25rem 0',
      fontStyle: 'italic',
      background: '#f0f7ff',
      borderRadius: '0 6px 6px 0',
      padding: '0.75rem 1rem',
    }}>
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div style={{ overflowX: 'auto', marginBottom: '1.25rem' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '0.875rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        borderRadius: '6px',
        overflow: 'hidden',
      }}>
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th style={{
      background: '#1e3a5f',
      color: '#ffffff',
      padding: '0.625rem 0.875rem',
      textAlign: 'left',
      fontWeight: 600,
      fontSize: '0.8rem',
      letterSpacing: '0.03em',
      textTransform: 'uppercase',
    }}>
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td style={{
      color: '#374151',
      padding: '0.5rem 0.875rem',
      borderBottom: '1px solid #e2e8f0',
      background: '#fff',
    }}>
      {children}
    </td>
  ),
  code: ({ children }) => (
    <code style={{
      background: '#f1f5f9',
      color: '#be185d',
      borderRadius: '4px',
      padding: '0.15rem 0.4rem',
      fontSize: '0.85em',
      fontFamily: 'JetBrains Mono, monospace',
      border: '1px solid #e2e8f0',
    }}>
      {children}
    </code>
  ),
}

/* ─── Risk badge ─────────────────────────────────────────────────── */
const RISK_PRINT_COLORS = {
  'Baixo':    { bg: '#f0fdf4', border: '#86efac', text: '#166534' },
  'Moderado': { bg: '#fffbeb', border: '#fcd34d', text: '#92400e' },
  'Alto':     { bg: '#fff7ed', border: '#fdba74', text: '#9a3412' },
  'Crítico':  { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b' },
  'Low':      { bg: '#f0fdf4', border: '#86efac', text: '#166534' },
  'Moderate': { bg: '#fffbeb', border: '#fcd34d', text: '#92400e' },
  'High':     { bg: '#fff7ed', border: '#fdba74', text: '#9a3412' },
  'Critical': { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b' },
}

function RiskBadge({ risk }) {
  const { t } = useTranslation()
  if (!risk) return null
  const c = RISK_PRINT_COLORS[risk.label] || RISK_PRINT_COLORS['Moderado']
  return (
    <div className="risk-block" style={{
      background: c.bg,
      border: `1px solid ${c.border}`,
      borderRadius: '10px',
      padding: '1rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1.25rem',
      marginBottom: '1.5rem',
      flexWrap: 'wrap',
    }}>
      <div style={{ textAlign: 'center', minWidth: 64 }}>
        <div style={{ fontSize: '2.25rem', fontWeight: 800, color: c.text, lineHeight: 1 }}>
          {risk.score}
        </div>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: c.text, letterSpacing: '0.05em', marginTop: 2 }}>
          {risk.label.toUpperCase()}
        </div>
      </div>
      <div style={{ borderLeft: `2px solid ${c.border}`, paddingLeft: '1.25rem' }}>
        <div style={{ fontWeight: 700, color: c.text, fontSize: '0.9rem' }}>
          {t('report.score_risco')} — {risk.label}
        </div>
        <div style={{ color: '#4b5563', fontSize: '0.825rem', marginTop: '0.25rem' }}>
          {risk.description}
        </div>
      </div>
    </div>
  )
}

/* ─── Metric cards ───────────────────────────────────────────────── */
function MetricCard({ label, value, sub }) {
  return (
    <div className="metric-card" style={{
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '0.875rem 1.1rem',
      textAlign: 'center',
      flex: 1,
      minWidth: 110,
    }}>
      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{value}</div>
      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 1 }}>{sub}</div>}
    </div>
  )
}

/* ─── Main component ─────────────────────────────────────────────── */
export default function Report() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [report, setReport]   = useState(null)
  const [sim, setSim]         = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [copied, setCopied]   = useState(false)

  useEffect(() => {
    apiFetch(`/report/${id}`)
      .then(res => {
        if (!res.ok) throw new Error(`Relatório não encontrado (${res.status})`)
        return res.json()
      })
      .then(data => {
        setReport(data)
        return apiFetch(`/simulation/${data.simulation_id}/result`)
      })
      .then(res => res.ok ? res.json() : null)
      .then(d => { if (d) setSim(d) })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  function handleCopy() {
    if (!report?.markdown) return
    navigator.clipboard.writeText(report.markdown).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handlePrint() {
    window.print()
  }

  const intervention_labels = {
    fact_check: 'Fact-check',
    removal: 'Remoção',
    counter_narrative: 'Contra-narrativa',
    label_warning: 'Aviso de rótulo',
    null: t('report.nenhuma_intervencao'),
  }

  return (
    <div className="report-shell" style={{ maxWidth: '860px', margin: '0 auto', padding: 'clamp(1rem, 3vw, 2rem)' }}>
      <style>{PRINT_STYLE}</style>

      {/* ── Toolbar ── */}
      <div className="no-print" style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem',
      }}>
        <h2 style={{ color: '#e2e8f0', margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
          {t('report.titulo')}
        </h2>
        <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              background: 'transparent', color: '#94a3b8',
              border: '1px solid #1e293b', borderRadius: '7px',
              padding: '0.45rem 1rem', cursor: 'pointer', fontSize: '0.85rem',
            }}
          >
            {t('report.voltar')}
          </button>
          {report && (
            <>
              <button
                type="button"
                onClick={handleCopy}
                style={{
                  background: copied ? '#166534' : '#1e293b',
                  color: copied ? '#bbf7d0' : '#e2e8f0',
                  border: 'none', borderRadius: '7px',
                  padding: '0.45rem 1rem', cursor: 'pointer', fontSize: '0.85rem',
                }}
              >
                {copied ? t('report.copiado') : t('report.copiar')}
              </button>
              <a
                href={`${BASE_URL}/report/${id}/export/md`}
                download
                title={t('export.tooltip_md')}
                style={{
                  background: '#0f172a', color: '#94a3b8',
                  border: '1px solid #1e293b', borderRadius: '7px',
                  padding: '0.45rem 1rem', cursor: 'pointer', fontSize: '0.85rem',
                  textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
                }}
              >
                {t('export.md')}
              </a>
              <button
                type="button"
                onClick={handlePrint}
                style={{
                  background: '#1e3a5f', color: '#ffffff',
                  border: 'none', borderRadius: '7px',
                  padding: '0.45rem 1.25rem', cursor: 'pointer',
                  fontSize: '0.85rem', fontWeight: 600,
                }}
              >
                {t('report.exportar_pdf')}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Loading / Error ── */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: '#94a3b8' }}>
          <div style={{
            width: 36, height: 36, border: '3px solid #1e293b',
            borderTop: '3px solid #2563eb', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem',
          }} />
          <p style={{ margin: 0 }}>{t('report.carregando')}</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fca5a5',
          borderRadius: '10px', padding: '1.5rem', color: '#991b1b', textAlign: 'center',
        }}>
          <p style={{ margin: 0 }}>{error}</p>
        </div>
      )}

      {/* ── Report content ── */}
      {report && (
        <div className="report-card" style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: 'clamp(1.25rem, 3vw, 2.25rem) clamp(1rem, 3vw, 2.5rem)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
        }}>

          {/* Header block */}
          <div className="report-header" style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.75rem',
          }}>
            {/* Title row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#2563eb', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                  {t('report.header_label')}
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                  {t('report.header_titulo')}
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#64748b' }}>
                <div>{new Date(report.created_at).toLocaleString('pt-BR')}</div>
                <div style={{ marginTop: 2 }}>{t('report.modelo')}: {report.model}</div>
                {report.cached && <div style={{ color: '#16a34a', marginTop: 2 }}>{t('report.cache')}</div>}
              </div>
            </div>

            {/* Simulation metrics */}
            {sim && (
              <>
                {/* Seed text */}
                <div style={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '7px',
                  padding: '0.625rem 0.875rem',
                  fontSize: '0.8rem',
                  color: '#374151',
                  marginBottom: '1rem',
                  lineHeight: 1.6,
                }}>
                  <span style={{ fontWeight: 700, color: '#64748b', marginRight: 6 }}>{t('report.seed_label')}:</span>
                  {sim.seed_text?.slice(0, 180)}{sim.seed_text?.length > 180 ? '...' : ''}
                </div>

                {/* Metric cards */}
                <div className="metric-cards-row" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  <MetricCard
                    label={t('report.agentes')}
                    value={sim.num_agents}
                  />
                  <MetricCard
                    label={t('report.pico')}
                    value={sim.peak_infected}
                    sub={`${((sim.peak_infected / sim.num_agents) * 100).toFixed(1)}% ${t('report.da_rede')}`}
                  />
                  <MetricCard
                    label={t('report.alcance')}
                    value={`${((sim.total_reach || 0) * 100).toFixed(1)}%`}
                    sub={t('report.agentes_expostos')}
                  />
                  <MetricCard
                    label={t('report.tempo_pico')}
                    value={`${sim.time_to_peak} ticks`}
                    sub={t('report.velocidade')}
                  />
                  <MetricCard
                    label={t('report.intervencao')}
                    value={intervention_labels[sim.intervention] || t('report.nenhuma_intervencao')}
                  />
                  {sim.region && (
                    <MetricCard
                      label={t('report.regiao')}
                      value={sim.region}
                    />
                  )}
                </div>

                {/* Risk badge */}
                {sim.risk && <RiskBadge risk={sim.risk} />}
              </>
            )}
          </div>

          {/* Markdown body */}
          <Markdown components={mdComponents}>{report.markdown}</Markdown>

          {/* Footer */}
          <div style={{
            marginTop: '2.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              {t('report.footer_gerado')}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              {t('report.footer_motor')}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
