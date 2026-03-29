import { useState, useEffect, useRef, useCallback } from 'react'

const SPEEDS = [0.5, 1, 2, 4]

export default function ReplayControls({ ticks, onTick, peakTick }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const intervalRef = useRef(null)

  const total = ticks.length

  const goToIndex = useCallback((idx) => {
    const clamped = Math.max(0, Math.min(idx, total - 1))
    setCurrentIndex(clamped)
    if (ticks[clamped]) onTick(ticks[clamped], clamped)
  }, [ticks, onTick, total])

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev >= total - 1) {
            setPlaying(false)
            return prev
          }
          const next = prev + 1
          if (ticks[next]) onTick(ticks[next], next)
          return next
        })
      }, 200 / speed)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [playing, speed, ticks, onTick, total])

  const peakIndex = peakTick != null
    ? ticks.findIndex(t => t.tick === peakTick)
    : -1

  if (!ticks || ticks.length === 0) return null

  return (
    <div style={{
      background: '#081222',
      border: '1px solid #112236',
      borderRadius: '12px',
      padding: '1rem 1.5rem',
      marginBottom: '1.5rem',
    }}>
      <div style={{ color: '#94A3B8', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
        Replay — Tick {ticks[currentIndex]?.tick ?? 0} / {ticks[total - 1]?.tick ?? total - 1}
      </div>

      {/* Scrubber */}
      <input
        type="range"
        min={0}
        max={total - 1}
        value={currentIndex}
        onChange={e => { setPlaying(false); goToIndex(Number(e.target.value)) }}
        style={{ width: '100%', marginBottom: '0.75rem', accentColor: '#06B6D4' }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
        {/* Prev frame */}
        <button
          type="button"
          onClick={() => { setPlaying(false); goToIndex(currentIndex - 1) }}
          disabled={currentIndex === 0}
          style={btnStyle}
          title="Frame anterior"
        >⏮</button>

        {/* Play / Pause */}
        <button
          type="button"
          onClick={() => setPlaying(p => !p)}
          style={{ ...btnStyle, background: '#06B6D4', color: '#000', minWidth: 64 }}
        >
          {playing ? '⏸ Pausar' : '▶ Play'}
        </button>

        {/* Next frame */}
        <button
          type="button"
          onClick={() => { setPlaying(false); goToIndex(currentIndex + 1) }}
          disabled={currentIndex === total - 1}
          style={btnStyle}
          title="Próximo frame"
        >⏭</button>

        {/* Speed selector */}
        <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.5rem' }}>
          {SPEEDS.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              style={{
                ...btnStyle,
                background: speed === s ? '#0f3460' : '#0a1628',
                color: speed === s ? '#06B6D4' : '#64748b',
                fontSize: '0.75rem',
                padding: '0.3rem 0.5rem',
                minWidth: 36,
              }}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Go to peak */}
        {peakIndex >= 0 && (
          <button
            type="button"
            onClick={() => { setPlaying(false); goToIndex(peakIndex) }}
            style={{ ...btnStyle, marginLeft: 'auto', color: '#f87171', borderColor: '#f8717144' }}
            title="Ir para o pico de infectados"
          >
            Ir ao Pico ⚡
          </button>
        )}
      </div>
    </div>
  )
}

const btnStyle = {
  background: '#0a1628',
  color: '#94a3b8',
  border: '1px solid #1e293b',
  borderRadius: '7px',
  padding: '0.4rem 0.75rem',
  cursor: 'pointer',
  fontSize: '0.875rem',
  fontWeight: 500,
}
