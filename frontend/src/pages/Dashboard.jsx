import { useNavigate } from 'react-router-dom'

const cards = [
  {
    title: 'Como funciona',
    text: 'Simula a propagação de desinformação em redes sociais usando o modelo SEIR em grafos Barabási-Albert.',
  },
  {
    title: 'Fontes de dados',
    text: 'Seeds coletadas da Agência Lupa, Aos Fatos e GDELT — bases de verificação de fatos do Brasil.',
  },
  {
    title: 'Intervenções',
    text: 'Teste 4 estratégias: fact-check, remoção, contra-narrativa e aviso de rótulo. Veja qual funciona mais.',
  },
]

export default function Dashboard() {
  const navigate = useNavigate()
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#818cf8', marginBottom: '0.5rem' }}>
        DesinfoLab
      </h1>
      <p style={{ color: '#94a3b8', marginBottom: '2.5rem', fontSize: '1.05rem' }}>
        Simulador de propagação de desinformação no Brasil
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1.25rem',
        marginBottom: '2.5rem',
      }}>
        {cards.map(({ title, text }) => (
          <div key={title} style={{
            background: '#1a1d27',
            border: '1px solid #2d3148',
            borderRadius: '12px',
            padding: '1.5rem',
          }}>
            <h3 style={{ color: '#c7d2fe', marginBottom: '0.75rem', fontSize: '1rem' }}>{title}</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.6 }}>{text}</p>
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate('/simulate')}
        style={{
          background: '#4f46e5',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          padding: '0.75rem 2rem',
          fontSize: '1rem',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Iniciar nova simulação →
      </button>
    </div>
  )
}
