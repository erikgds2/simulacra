import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function NotFound() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()

  return (
    <div style={{ textAlign: 'center', padding: 'clamp(3rem, 8vw, 6rem) 2rem' }}>
      <div style={{
        fontSize: '4rem', fontWeight: 700,
        color: '#4f46e5', marginBottom: '1rem',
        fontVariantNumeric: 'tabular-nums',
      }}>
        404
      </div>
      <h2 style={{ color: '#c7d2fe', marginBottom: '0.75rem', fontSize: '1.25rem' }}>
        {t('not_found.titulo')}
      </h2>
      <p style={{ color: '#64748b', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
        O caminho <code style={{ color: '#818cf8', background: '#1a1d27', padding: '2px 6px', borderRadius: 4 }}>
          {location.pathname}
        </code> não existe.
      </p>
      <p style={{ color: '#475569', fontSize: '0.8rem', marginBottom: '2rem' }}>
        {t('not_found.subtitulo')}
      </p>
      <button
        type="button"
        onClick={() => navigate('/')}
        style={{
          background: '#4f46e5', color: '#fff', border: 'none',
          borderRadius: '8px', padding: '0.6rem 1.75rem',
          fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
        }}
      >
        {t('not_found.voltar')}
      </button>
    </div>
  )
}
