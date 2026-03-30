import useAuthStore from '../../store/authStore'
import supabase from '../../lib/supabaseClient'

/**
 * Auth Gate — bloqueia acesso à aplicação se auth estiver habilitada
 * e o usuário não estiver logado.
 *
 * Se VITE_SUPABASE_URL não estiver configurado (modo open source),
 * renderiza os filhos normalmente sem exigir login.
 */
export default function AuthGate({ children }) {
  const { user, loading, openAuthModal, isAuthEnabled } = useAuthStore()

  // Auth desabilitada (open source / dev sem vars) → passa direto
  if (!isAuthEnabled()) return children

  // Aguarda verificação da sessão inicial
  if (loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: '#0f1117', gap: '1rem',
      }}>
        <div style={{
          width: 36, height: 36,
          border: '3px solid #06B6D420',
          borderTop: '3px solid #06B6D4',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <span style={{ color: '#475569', fontSize: '0.875rem' }}>Verificando sessão…</span>
      </div>
    )
  }

  // Logado → acesso liberado
  if (user) return children

  // Não logado → tela de boas-vindas com CTA de login
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#0f1117',
      padding: '2rem', textAlign: 'center',
    }}>
      <div style={{
        width: 56, height: 56,
        background: 'linear-gradient(135deg, #06B6D4, #0891B2)',
        borderRadius: '12px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '24px', fontWeight: 700, color: '#000',
        boxShadow: '0 0 24px #06B6D440',
        marginBottom: '1.5rem',
      }}>S</div>

      <h1 style={{ color: '#E2E8F0', fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        Simulacra
      </h1>
      <p style={{ color: '#64748B', fontSize: '0.9rem', maxWidth: '360px', lineHeight: 1.6, marginBottom: '0.5rem' }}>
        Motor de simulação de propagação de desinformação no Brasil.
      </p>
      <p style={{ color: '#334155', fontSize: '0.8rem', maxWidth: '360px', marginBottom: '2rem' }}>
        Acesso restrito — faça login com sua conta para continuar.
      </p>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => openAuthModal('login')}
          style={{
            padding: '0.75rem 2rem', fontSize: '0.95rem', fontWeight: 700,
            background: '#06B6D4', color: '#000',
            border: 'none', borderRadius: '8px', cursor: 'pointer',
          }}
        >
          Entrar
        </button>
        <button
          onClick={() => openAuthModal('register')}
          style={{
            padding: '0.75rem 2rem', fontSize: '0.95rem', fontWeight: 600,
            background: 'transparent', color: '#06B6D4',
            border: '1px solid #06B6D450', borderRadius: '8px', cursor: 'pointer',
          }}
        >
          Criar conta
        </button>
      </div>

      <p style={{ color: '#1e3a5f', fontSize: '0.7rem', marginTop: '2.5rem', maxWidth: '320px' }}>
        Ao criar conta, você concorda com o uso de seus dados (e-mail, provedor, data de cadastro)
        para controle de acesso. Limite: 2 relatórios simples/dia e 1 avançado/dia por conta.
      </p>
    </div>
  )
}
