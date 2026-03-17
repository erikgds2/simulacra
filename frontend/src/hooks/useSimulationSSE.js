import { useState, useEffect } from 'react'
import useSimulationStore from '../store/simulationStore.js'

export default function useSimulationSSE(simulationId) {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState(null)
  const { ticks, addTick, setIsRunning } = useSimulationStore()

  useEffect(() => {
    if (!simulationId) return
    const es = new EventSource(`/api/simulate/${simulationId}/stream`)
    es.onopen = () => setIsConnected(true)
    es.onmessage = (event) => {
      try { addTick(JSON.parse(event.data)) } catch (e) { console.error('SSE parse error', e) }
    }
    es.addEventListener('done', () => {
      setIsRunning(false)
      setIsConnected(false)
      es.close()
    })
    es.onerror = () => {
      setError('Conexao SSE perdida.')
      setIsConnected(false)
      es.close()
    }
    return () => es.close()
  }, [simulationId, addTick, setIsRunning])

  return { ticks, isConnected, error }
}
