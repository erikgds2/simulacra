import { useTranslation } from 'react-i18next'

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const current = i18n.language

  function switchTo(lang) {
    i18n.changeLanguage(lang)
    localStorage.setItem('simulacra_lang', lang)
  }

  return (
    <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
      <button
        type="button"
        onClick={() => switchTo('pt')}
        title="Português"
        aria-label="Mudar para Português"
        style={{
          background: current === 'pt' ? '#06B6D430' : 'transparent',
          border: current === 'pt' ? '1px solid #06B6D460' : '1px solid transparent',
          borderRadius: '5px',
          padding: '0.2rem 0.45rem',
          cursor: 'pointer',
          fontSize: '1rem',
          lineHeight: 1,
          transition: 'all 0.15s',
        }}
      >
        🇧🇷
      </button>
      <button
        type="button"
        onClick={() => switchTo('en')}
        title="English"
        aria-label="Switch to English"
        style={{
          background: current === 'en' ? '#06B6D430' : 'transparent',
          border: current === 'en' ? '1px solid #06B6D460' : '1px solid transparent',
          borderRadius: '5px',
          padding: '0.2rem 0.45rem',
          cursor: 'pointer',
          fontSize: '1rem',
          lineHeight: 1,
          transition: 'all 0.15s',
        }}
      >
        🇬🇧
      </button>
    </div>
  )
}
