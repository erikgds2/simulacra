import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function ColdStartBanner() {
  const { t } = useTranslation()
  const [show, setShow] = useState(false)
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!show) return
    const interval = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(interval)
  }, [show])

  if (!show) return null

  return (
    <div style={{
      background: '#1c1917',
      border: '1px solid #fbbf24',
      borderRadius: '10px',
      padding: '1rem 1.25rem',
      marginBottom: '1.5rem',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.75rem',
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: '#fbbf24',
        marginTop: 6, flexShrink: 0,
        animation: 'pulse 1s ease-in-out infinite',
      }} />
      <div>
        <p style={{ color: '#fde68a', fontSize: '0.875rem', margin: 0, fontWeight: 500 }}>
          {t('cold_start.titulo')}
        </p>
        <p style={{ color: '#92400e', fontSize: '0.78rem', margin: '0.25rem 0 0' }}>
          {t('cold_start.subtitulo')}
          {seconds > 0 ? ` ${t('cold_start.aguardando', { seconds })}` : ''}
        </p>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
