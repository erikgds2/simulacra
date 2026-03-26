import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { apiFetch } from '../api'
import { toast } from './Toast'

export default function AlertBanner() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [threshold, setThreshold] = useState(70)
  const [config, setConfig] = useState(null)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    apiFetch('/alerts/config')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setConfig(d) })
      .catch(() => {})
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    if (!email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) {
      toast(t('alert.email_invalido'), 'error')
      return
    }
    setSaving(true)
    try {
      const res = await apiFetch('/alerts/config', {
        method: 'POST',
        body: JSON.stringify({ recipient_email: email, threshold }),
      })
      if (!res.ok) throw new Error()
      const d = await res.json()
      setConfig(d)
      toast(t('alert.salvo'), 'success')
      setOpen(false)
    } catch {
      toast('Erro ao salvar configuração', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDisable() {
    await apiFetch('/alerts/config', { method: 'DELETE' })
    setConfig({ enabled: false })
    toast(t('alert.desativado'), 'success')
  }

  const isActive = config?.enabled && config?.recipient_email

  return (
    <div style={{ marginBottom: '1rem' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          background: isActive ? '#052e16' : '#1a1d27',
          color: isActive ? '#4ade80' : '#94a3b8',
          border: `1px solid ${isActive ? '#16a34a44' : '#2d3148'}`,
          borderRadius: '8px', padding: '0.5rem 1rem',
          fontSize: '0.8rem', cursor: 'pointer', display: 'flex',
          alignItems: 'center', gap: '0.5rem',
        }}
      >
        <span>{isActive ? '🔔' : '🔕'}</span>
        <span>{isActive ? `${t('alert.status_ativo')} — ${config.recipient_email}` : t('alert.status_inativo')}</span>
        <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{
          background: '#1a1d27', border: '1px solid #2d3148',
          borderRadius: '10px', padding: '1.25rem', marginTop: '0.5rem',
        }}>
          <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 1rem' }}>
            {t('alert.subtitulo')}
          </p>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div>
              <label htmlFor="alert-email" style={{ color: '#c7d2fe', fontSize: '0.8rem', display: 'block', marginBottom: '0.35rem' }}>
                {t('alert.email_label')}
              </label>
              <input
                id="alert-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('alert.email_placeholder')}
                required
                style={{
                  width: '100%', background: '#0f1117', color: '#e2e8f0',
                  border: '1px solid #2d3148', borderRadius: '6px',
                  padding: '0.5rem 0.75rem', fontSize: '0.875rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label htmlFor="alert-threshold" style={{ color: '#c7d2fe', fontSize: '0.8rem', display: 'block', marginBottom: '0.35rem' }}>
                {t('alert.threshold_label')}: <strong style={{ color: '#f87171' }}>{threshold}</strong>
              </label>
              <input
                id="alert-threshold"
                type="range"
                min={0} max={100} value={threshold}
                onChange={e => setThreshold(Number(e.target.value))}
                style={{ width: '100%' }}
              />
              <p style={{ color: '#64748b', fontSize: '0.72rem', margin: '0.25rem 0 0' }}>
                {t('alert.threshold_hint')}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  background: '#4f46e5', color: '#fff', border: 'none',
                  borderRadius: '7px', padding: '0.5rem 1.25rem',
                  fontSize: '0.85rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {t('alert.botao_salvar')}
              </button>
              {isActive && (
                <button
                  type="button"
                  onClick={handleDisable}
                  style={{
                    background: 'transparent', color: '#f87171', border: '1px solid #f8717144',
                    borderRadius: '7px', padding: '0.5rem 1rem',
                    fontSize: '0.85rem', cursor: 'pointer',
                  }}
                >
                  {t('alert.botao_desativar')}
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
