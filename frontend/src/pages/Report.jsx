import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Markdown from 'react-markdown'
import { apiFetch } from '../api'

const mdComponents = {
  h1: ({ children }) => (
    <h1 style={{ color: '#06B6D4', fontSize: '1.75rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid #112236', paddingBottom: '0.5rem' }}>
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 style={{ color: '#22D3EE', fontSize: '1.2rem', fontWeight: 600, marginTop: '1.75rem', marginBottom: '0.75rem' }}>
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 style={{ color: '#67E8F9', fontSize: '1rem', fontWeight: 600, marginTop: '1.25rem', marginBottom: '0.5rem' }}>
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p style={{ color: '#cbd5e1', lineHeight: 1.75, marginBottom: '0.75rem' }}>{children}</p>
  ),
  ul: ({ children }) => (
    <ul style={{ color: '#cbd5e1', paddingLeft: '1.5rem', marginBottom: '0.75rem' }}>{children}</ul>
  ),
  ol: ({ children }) => (
    <ol style={{ color: '#cbd5e1', paddingLeft: '1.5rem', marginBottom: '0.75rem' }}>{children}</ol>
  ),
  li: ({ children }) => (
    <li style={{ marginBottom: '0.35rem', lineHeight: 1.65 }}>{children}</li>
  ),
  strong: ({ children }) => (
    <strong style={{ color: '#f1f5f9', fontWeight: 600 }}>{children}</strong>
  ),
  em: ({ children }) => (
    <em style={{ color: '#94A3B8' }}>{children}</em>
  ),
  hr: () => (
    <hr style={{ border: 'none', borderTop: '1px solid #112236', margin: '1.5rem 0' }} />
  ),
  blockquote: ({ children }) => (
    <blockquote style={{
      borderLeft: '3px solid #06B6D4',
      paddingLeft: '1rem',
      color: '#94A3B8',
      margin: '1rem 0',
      fontStyle: 'italic',
    }}>
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th style={{ background: '#0D1B2E', color: '#06B6D4', padding: '0.5rem 0.75rem', textAlign: 'left', border: '1px solid #1E3A5F' }}>
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td style={{ color: '#cbd5e1', padding: '0.45rem 0.75rem', border: '1px solid #112236' }}>
      {children}
    </td>
  ),
  code: ({ children }) => (
    <code style={{ background: '#0D1B2E', color: '#f472b6', borderRadius: '4px', padding: '0.15rem 0.4rem', fontSize: '0.85em' }}>
      {children}
    </code>
  ),
}

export default function Report() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    apiFetch(`/report/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Relatório não encontrado (${res.status})`)
        return res.json()
      })
      .then((data) => {
        setReport(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
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

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ color: '#06B6D4', margin: 0, fontSize: '1.5rem' }}>Relatório de Análise</h2>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'transparent', color: '#94A3B8', border: '1px solid #112236', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.875rem' }}
          >
            ← Voltar
          </button>
          {report && (
            <>
              <button
                onClick={handleCopy}
                style={{ background: copied ? '#16a34a' : '#0D1B2E', color: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.875rem' }}
              >
                {copied ? '✓ Copiado' : 'Copiar Markdown'}
              </button>
              <button
                onClick={handlePrint}
                style={{ background: '#06B6D4', color: '#000', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.875rem' }}
              >
                Exportar PDF
              </button>
            </>
          )}
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: '#94A3B8' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p>Carregando relatório...</p>
        </div>
      )}

      {error && (
        <div style={{ background: '#3f1c1c', border: '1px solid #ef4444', borderRadius: '12px', padding: '1.5rem', color: '#fca5a5', textAlign: 'center' }}>
          <p style={{ margin: 0 }}>{error}</p>
        </div>
      )}

      {report && (
        <>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <span style={{ background: '#0D1B2E', color: '#22D3EE', borderRadius: '20px', padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>
              Modelo: {report.model}
            </span>
            {report.cached && (
              <span style={{ background: '#1e3a2e', color: '#34d399', borderRadius: '20px', padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>
                Cacheado
              </span>
            )}
            <span style={{ background: '#1e2d40', color: '#60a5fa', borderRadius: '20px', padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>
              {new Date(report.created_at).toLocaleString('pt-BR')}
            </span>
          </div>

          <div style={{
            background: '#081222',
            border: '1px solid #112236',
            borderRadius: '12px',
            padding: '2rem',
          }}>
            <Markdown components={mdComponents}>{report.markdown}</Markdown>
          </div>
        </>
      )}
    </div>
  )
}
