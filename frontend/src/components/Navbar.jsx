import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './LanguageSwitcher'

export default function Navbar() {
  const { t } = useTranslation()

  const links = [
    { to: '/', label: t('nav.painel') },
    { to: '/simulate', label: t('nav.simular') },
    { to: '/compare', label: t('nav.comparar') },
    { to: '/multi', label: t('nav.multi') },
    { to: '/compare-view', label: t('nav.comparar_sims') },
  ]

  return (
    <nav style={{
      borderBottom: '1px solid #112236',
      background: 'rgba(4,9,15,0.9)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '0 clamp(1rem, 3vw, 2rem)',
        display: 'flex',
        alignItems: 'center',
        height: '56px',
        gap: 'clamp(1rem, 2vw, 2.5rem)',
        overflowX: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>
          <div style={{
            width: 28, height: 28,
            background: 'linear-gradient(135deg, #06B6D4, #0891B2)',
            borderRadius: '6px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: 700, color: '#000',
            boxShadow: '0 0 12px #06B6D440',
          }}>S</div>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#E2E8F0', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
            Simulacra
          </span>
          <span style={{
            fontSize: '0.65rem', fontWeight: 600, padding: '0.15rem 0.45rem',
            background: '#06B6D415', color: '#06B6D4', border: '1px solid #06B6D430',
            borderRadius: '4px', letterSpacing: '0.05em',
          }}>{t('nav.beta')}</span>
        </div>

        <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
          {links.map(({ to, label }) => (
            <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
              padding: '0.375rem 0.875rem',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: 500,
              textDecoration: 'none',
              color: isActive ? '#06B6D4' : '#94A3B8',
              background: isActive ? '#06B6D415' : 'transparent',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            })}>
              {label}
            </NavLink>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          <LanguageSwitcher />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981' }} />
            <span style={{ fontSize: '0.75rem', color: '#475569', whiteSpace: 'nowrap' }}>{t('nav.sistema_ativo')}</span>
          </div>
        </div>
      </div>
    </nav>
  )
}
