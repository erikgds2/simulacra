const BASE = import.meta.env.PROD
  ? (import.meta.env.VITE_API_URL || 'https://simulacra-api.onrender.com')
  : '/api'

export async function apiFetch(path, options = {}) {
  const url = `${BASE}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  return res
}

export default BASE
