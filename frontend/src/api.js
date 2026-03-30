import supabase from './lib/supabaseClient'

const BASE = import.meta.env.PROD
  ? (import.meta.env.VITE_API_URL || 'https://desinfolab.onrender.com')
  : '/api'

export async function apiFetch(path, options = {}) {
  const url = `${BASE}${path}`

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  // Injeta JWT do Supabase automaticamente quando auth está habilitada
  if (supabase) {
    const { data } = await supabase.auth.getSession()
    const token = data?.session?.access_token
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  const res = await fetch(url, { ...options, headers })
  return res
}

export default BASE
