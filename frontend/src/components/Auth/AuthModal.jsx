import { useState } from 'react'
import { apiFetch } from '../../api'
import supabase from '../../lib/supabaseClient'
import useAuthStore from '../../store/authStore'

const S = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(0,0,0,0.75)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '1rem',
  },
  modal: {
    background: '#0d1520',
    border: '1px solid #1e3a5f',
    borderRadius: '12px',
    width: '100%', maxWidth: '420px',
    padding: '2rem',
    boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
  },
  title: {
    fontSize: '1.25rem', fontWeight: 700, color: '#E2E8F0',
    marginBottom: '0.25rem',
  },
  subtitle: { fontSize: '0.8rem', color: '#475569', marginBottom: '1.5rem' },
  tabs: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' },
  tab: (active) => ({
    flex: 1, padding: '0.5rem',
    borderRadius: '6px', border: 'none', cursor: 'pointer',
    fontSize: '0.875rem', fontWeight: 600,
    background: active ? '#06B6D4' : '#112236',
    color: active ? '#000' : '#94A3B8',
    transition: 'all 0.15s',
  }),
  label: {
    display: 'block', fontSize: '0.75rem',
    color: '#64748B', marginBottom: '0.375rem', fontWeight: 500,
  },
  input: {
    width: '100%', padding: '0.625rem 0.75rem',
    background: '#0a1628', border: '1px solid #1e3a5f',
    borderRadius: '6px', color: '#E2E8F0', fontSize: '0.875rem',
    outline: 'none', boxSizing: 'border-box',
    marginBottom: '1rem',
  },
  btn: (disabled) => ({
    width: '100%', padding: '0.75rem',
    background: disabled ? '#0e2a3d' : '#06B6D4',
    color: disabled ? '#475569' : '#000',
    border: 'none', borderRadius: '6px',
    fontSize: '0.875rem', fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s',
  }),
  divider: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    margin: '1rem 0', color: '#334155', fontSize: '0.75rem',
  },
  dividerLine: { flex: 1, height: '1px', background: '#1e3a5f' },
  googleBtn: {
    width: '100%', padding: '0.625rem',
    background: '#fff', color: '#1a1a1a',
    border: '1px solid #d1d5db', borderRadius: '6px',
    fontSize: '0.875rem', fontWeight: 600,
    cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
    transition: 'background 0.15s',
  },
  error: {
    background: '#2d0f0f', border: '1px solid #7f1d1d',
    borderRadius: '6px', padding: '0.625rem 0.75rem',
    fontSize: '0.8rem', color: '#FCA5A5',
    marginBottom: '1rem',
  },
  success: {
    background: '#0f2d1a', border: '1px solid #14532d',
    borderRadius: '6px', padding: '0.625rem 0.75rem',
    fontSize: '0.8rem', color: '#86EFAC',
    marginBottom: '1rem',
  },
  closeBtn: {
    position: 'absolute', top: '1rem', right: '1rem',
    background: 'transparent', border: 'none',
    color: '#475569', cursor: 'pointer', fontSize: '1.25rem',
    lineHeight: 1,
  },
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

export default function AuthModal() {
  const { authModalTab, closeAuthModal } = useAuthStore()
  const [tab, setTab] = useState(authModalTab) // 'login' | 'register' | 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  if (!supabase) return null

  const redirectTo =
    typeof window !== 'undefined'
      ? window.location.origin + (import.meta.env.PROD ? '/simulacra/' : '/')
      : '/'

  const handleGoogleLogin = async () => {
    setError('')
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo,
    })
    setLoading(false)
    if (err) {
      setError(err.message)
    } else {
      setSuccess('E-mail de recuperação enviado! Verifique sua caixa de entrada.')
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) {
      setError(err.message === 'Invalid login credentials'
        ? 'E-mail ou senha incorretos.'
        : err.message)
    } else {
      closeAuthModal()
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }
    if (password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.')
      return
    }

    setLoading(true)

    // Valida e-mail contra lista de temporários
    try {
      const res = await apiFetch(`/auth/validate-email?email=${encodeURIComponent(email)}`)
      if (!res.ok) {
        const data = await res.json()
        setError(data.detail || 'E-mail não permitido.')
        setLoading(false)
        return
      }
    } catch {
      setError('Erro ao validar e-mail. Tente novamente.')
      setLoading(false)
      return
    }

    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo },
    })
    setLoading(false)

    if (err) {
      setError(err.message)
    } else {
      setSuccess('Cadastro realizado! Verifique seu e-mail para confirmar a conta antes de fazer login.')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
    }
  }

  return (
    <div style={S.overlay} onClick={(e) => e.target === e.currentTarget && closeAuthModal()}>
      <div style={{ ...S.modal, position: 'relative' }}>
        <button style={S.closeBtn} onClick={closeAuthModal} aria-label="Fechar">×</button>

        <div style={S.title}>Simulacra</div>
        <div style={S.subtitle}>
          {tab === 'login' ? 'Faça login para gerar relatórios' : 'Crie sua conta gratuita'}
        </div>

        <div style={S.tabs}>
          <button style={S.tab(tab === 'login')} onClick={() => { setTab('login'); setError(''); setSuccess('') }}>
            Entrar
          </button>
          <button style={S.tab(tab === 'register')} onClick={() => { setTab('register'); setError(''); setSuccess('') }}>
            Cadastrar
          </button>
          <button style={S.tab(tab === 'forgot')} onClick={() => { setTab('forgot'); setError(''); setSuccess('') }}>
            Esqueci
          </button>
        </div>

        {error && <div style={S.error}>{error}</div>}
        {success && <div style={S.success}>{success}</div>}

        {tab === 'forgot' ? (
          <form onSubmit={handleForgotPassword}>
            <label style={S.label}>E-mail da sua conta</label>
            <input
              style={S.input} type="email" value={email} required
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
            />
            <button type="submit" style={S.btn(loading)} disabled={loading}>
              {loading ? 'Enviando…' : 'Enviar e-mail de recuperação'}
            </button>
          </form>
        ) : tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <label style={S.label}>E-mail</label>
            <input
              style={S.input} type="email" value={email} required
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
            />
            <label style={S.label}>Senha</label>
            <input
              style={S.input} type="password" value={password} required
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <button type="submit" style={S.btn(loading)} disabled={loading}>
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <label style={S.label}>E-mail</label>
            <input
              style={S.input} type="email" value={email} required
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@gmail.com ou @hotmail.com"
              autoComplete="email"
            />
            <label style={S.label}>Senha (mínimo 8 caracteres)</label>
            <input
              style={S.input} type="password" value={password} required
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
            <label style={S.label}>Confirmar senha</label>
            <input
              style={S.input} type="password" value={confirmPassword} required
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
            <button type="submit" style={S.btn(loading)} disabled={loading}>
              {loading ? 'Cadastrando…' : 'Criar conta'}
            </button>
          </form>
        )}

        {tab !== 'forgot' && (
        <>
        <div style={S.divider}>
          <div style={S.dividerLine} />
          <span>ou</span>
          <div style={S.dividerLine} />
        </div>

        <button style={S.googleBtn} onClick={handleGoogleLogin} type="button">
          <GoogleIcon />
          Continuar com Google
        </button>

        {tab === 'register' && (
          <p style={{ fontSize: '0.7rem', color: '#334155', marginTop: '1rem', textAlign: 'center' }}>
            Ao criar conta você concorda com o uso de seus dados (e-mail, provedor, data de cadastro) para controle de acesso.
            Limite: 2 relatórios simples/dia e 1 avançado/dia.
          </p>
        )}
        </>
        )}
      </div>
    </div>
  )
}
