import { useTranslation } from 'react-i18next'

const REGIONS = [
  { code: 'SP', flag: '🏙️', multiplier: 1.20 },
  { code: 'NE', flag: '🌵', multiplier: 1.35 },
  { code: 'SUL', flag: '🌲', multiplier: 0.85 },
  { code: 'CO', flag: '🌾', multiplier: 1.00 },
  { code: 'N', flag: '🌿', multiplier: 1.10 },
  { code: 'RJ', flag: '🏖️', multiplier: 1.15 },
]

export default function RegionSelector({ value, onChange }) {
  const { t } = useTranslation()

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <label style={{ color: '#94A3B8', fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>
        {t('simulate.regiao_label')}
      </label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        <button
          type="button"
          onClick={() => onChange(null)}
          style={{
            background: !value ? '#06B6D415' : 'transparent',
            color: !value ? '#06B6D4' : '#64748B',
            border: `1px solid ${!value ? '#06B6D4' : '#1e293b'}`,
            borderRadius: '8px',
            padding: '0.4rem 0.875rem',
            fontSize: '0.8rem',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {t('simulate.regiao_todas')}
        </button>
        {REGIONS.map(({ code, flag, multiplier }) => {
          const isActive = value === code
          const isHigh = multiplier > 1.1
          const isLow = multiplier < 0.95
          const accentColor = isHigh ? '#f87171' : isLow ? '#34d399' : '#06B6D4'
          return (
            <button
              key={code}
              type="button"
              onClick={() => onChange(code)}
              title={t(`simulate.regiao_${code.toLowerCase()}_desc`, { multiplier: (multiplier * 100 - 100).toFixed(0) })}
              style={{
                background: isActive ? accentColor + '22' : 'transparent',
                color: isActive ? accentColor : '#94A3B8',
                border: `1px solid ${isActive ? accentColor + '88' : '#1e293b'}`,
                borderRadius: '8px',
                padding: '0.4rem 0.875rem',
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <span>{flag}</span>
              <span>{code}</span>
              {isActive && (
                <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                  {multiplier > 1 ? `+${((multiplier - 1) * 100).toFixed(0)}%` : `-${((1 - multiplier) * 100).toFixed(0)}%`}
                </span>
              )}
            </button>
          )
        })}
      </div>
      <p style={{ color: '#475569', fontSize: '0.72rem', marginTop: '0.4rem', marginBottom: 0 }}>
        {t('simulate.regiao_hint')}
      </p>
    </div>
  )
}
