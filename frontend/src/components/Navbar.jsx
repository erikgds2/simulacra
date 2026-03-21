import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Painel' },
  { to: '/simulate', label: 'Simular' },
]

export default function Navbar() {
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
        padding: '0 2rem',
        display: 'flex',
        alignItems: 'center',
        height: '56px',
        gap: '2.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: 28, height: 28,
            background: 'linear-gradient(135deg, #06B6D4, #0891B2)',
            borderRadius: '6px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: 700, color: '#000',
            boxShadow: '0 0 12px #06B6D440',
          }}>D</div>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#E2E8F0', letterSpacing: '0.02em' }}>
            DesinfoLab
          </span>
          <span style={{
            fontSize: '0.65rem', fontWeight: 600, padding: '0.15rem 0.45rem',
            background: '#06B6D415', color: '#06B6D4', border: '1px solid #06B6D430',
            borderRadius: '4px', letterSpacing: '0.05em',
          }}>BETA</span>
        </div>

        <div style={{ display: 'flex', gap: '0.25rem' }}>
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
            })}>
              {label}
            </NavLink>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981' }} />
          <span style={{ fontSize: '0.75rem', color: '#475569' }}>Sistema ativo</span>
        </div>
      </div>
    </nav>
  )
}
