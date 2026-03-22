import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary capturou:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          maxWidth: '600px',
          margin: '5rem auto',
          padding: '2rem',
          background: '#1a1d27',
          border: '1px solid #f87171',
          borderRadius: '12px',
          textAlign: 'center',
        }}>
          <h2 style={{ color: '#f87171', marginBottom: '1rem' }}>
            Algo deu errado
          </h2>
          <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            {this.state.error?.message || 'Erro inesperado'}
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, error: null })
              window.location.href = '/'
            }}
            style={{
              background: '#4f46e5',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem 1.5rem',
              cursor: 'pointer',
            }}
          >
            Voltar ao início
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
