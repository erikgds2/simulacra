import { useEffect, useState } from 'react'

const toastListeners = []
let toastId = 0

export function toast(message, type = 'info', duration = 4000) {
  const id = ++toastId
  toastListeners.forEach(fn => fn({ id, message, type, duration }))
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const handler = (t) => {
      setToasts(prev => [...prev, t])
      setTimeout(() => {
        setToasts(prev => prev.filter(x => x.id !== t.id))
      }, t.duration)
    }
    toastListeners.push(handler)
    return () => {
      const i = toastListeners.indexOf(handler)
      if (i > -1) toastListeners.splice(i, 1)
    }
  }, [])

  if (toasts.length === 0) return null

  const colors = {
    info:    { bg: '#1e293b', border: '#818cf8', text: '#c7d2fe' },
    success: { bg: '#064e3b', border: '#34d399', text: '#6ee7b7' },
    error:   { bg: '#450a0a', border: '#f87171', text: '#fca5a5' },
    warning: { bg: '#431407', border: '#fbbf24', text: '#fde68a' },
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      right: '1.5rem',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      maxWidth: '360px',
    }}>
      {toasts.map(t => {
        const c = colors[t.type] || colors.info
        return (
          <div
            key={t.id}
            style={{
              background: c.bg,
              border: `1px solid ${c.border}`,
              borderRadius: '10px',
              padding: '0.875rem 1.25rem',
              color: c.text,
              fontSize: '0.875rem',
              lineHeight: 1.5,
              boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
              animation: 'slideIn 0.2s ease',
            }}
          >
            {t.message}
          </div>
        )
      })}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
