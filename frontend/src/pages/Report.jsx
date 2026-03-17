import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

export default function Report() {
  const { id } = useParams()
  const [markdown, setMarkdown] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`/api/report/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Erro ${res.status}`)
        return res.json()
      })
      .then((data) => {
        setMarkdown(data.report || JSON.stringify(data, null, 2))
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [id])

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold text-purple-400 mb-6">Relatorio</h2>
      {loading && <p className="text-slate-400">Gerando relatorio com IA...</p>}
      {error && <p className="text-red-400">{error}</p>}
      {!loading && !error && (
        <pre className="bg-slate-800 rounded-xl p-6 text-slate-200 whitespace-pre-wrap text-sm leading-relaxed">
          {markdown}
        </pre>
      )}
    </div>
  )
}
