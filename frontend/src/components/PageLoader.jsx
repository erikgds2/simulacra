export default function PageLoader({ message = 'Carregando...' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: '1rem',
    }}>
      <div style={{
        width: 36,
        height: 36,
        border: '3px solid #2d3148',
        borderTop: '3px solid #818cf8',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{message}</p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
