import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

const STATE_COLORS = {
  S: '#60a5fa',
  E: '#fbbf24',
  I: '#f87171',
  R: '#34d399',
}

const NODE_COUNT = 80

function generateGraph(numAgents, ticks) {
  const lastTick = ticks[ticks.length - 1]
  if (!lastTick) return { nodes: [], links: [] }

  const total = lastTick.S + lastTick.E + lastTick.I + lastTick.R
  const count = Math.min(NODE_COUNT, total)

  const sRatio = lastTick.S / total
  const eRatio = lastTick.E / total
  const iRatio = lastTick.I / total

  const nodes = Array.from({ length: count }, (_, idx) => {
    let state
    const r = idx / count
    if (r < iRatio) state = 'I'
    else if (r < iRatio + eRatio) state = 'E'
    else if (r < iRatio + eRatio + sRatio) state = 'S'
    else state = 'R'
    return {
      id: idx,
      state,
      r: state === 'I' ? 7 : state === 'E' ? 5 : 4,
    }
  })

  const links = []
  nodes.forEach((node, i) => {
    const degree = Math.floor(Math.random() * 3) + 1
    for (let d = 0; d < degree; d++) {
      const target = Math.floor(Math.pow(Math.random(), 2) * i)
      if (target !== i) {
        links.push({ source: i, target })
      }
    }
  })

  return { nodes, links }
}

export default function PropagationGraph({ ticks, numAgents }) {
  const svgRef = useRef(null)
  const simRef = useRef(null)

  useEffect(() => {
    if (!ticks || ticks.length === 0) return
    const { nodes, links } = generateGraph(numAgents, ticks)
    if (nodes.length === 0) return

    const svg = d3.select(svgRef.current)
    const W = svgRef.current.clientWidth || 600
    const H = 340

    svg.attr('viewBox', `0 0 ${W} ${H}`)

    if (simRef.current) simRef.current.stop()
    svg.selectAll('*').remove()

    const g = svg.append('g')

    svg.call(
      d3.zoom()
        .scaleExtent([0.5, 3])
        .on('zoom', e => g.attr('transform', e.transform))
    )

    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#2d3148')
      .attr('stroke-width', 0.8)
      .attr('stroke-opacity', 0.6)

    const node = g.append('g')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', d => d.r)
      .attr('fill', d => STATE_COLORS[d.state])
      .attr('fill-opacity', 0.85)
      .attr('stroke', d => STATE_COLORS[d.state])
      .attr('stroke-width', 1)
      .attr('stroke-opacity', 0.4)

    node.append('title').text(d => `Agente ${d.id} — Estado: ${d.state}`)

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(30))
      .force('charge', d3.forceManyBody().strength(-40))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collision', d3.forceCollide(d => d.r + 2))
      .on('tick', () => {
        link
          .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x).attr('y2', d => d.target.y)
        node
          .attr('cx', d => d.x).attr('cy', d => d.y)
      })

    simRef.current = simulation
    return () => simulation.stop()
  }, [ticks, numAgents])

  return (
    <div style={{ background: '#0d1117', border: '1px solid #2d3148', borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: '1.25rem', padding: '0.75rem 1.25rem', borderBottom: '1px solid #2d3148', flexWrap: 'wrap' }}>
        {Object.entries(STATE_COLORS).map(([state, color]) => (
          <div key={state} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
            <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
              {state === 'S' ? 'Suscetível' : state === 'E' ? 'Exposto' : state === 'I' ? 'Infectado' : 'Recuperado'}
            </span>
          </div>
        ))}
        <span style={{ color: '#475569', fontSize: '0.75rem', marginLeft: 'auto' }}>
          Scroll para zoom · Arraste para mover
        </span>
      </div>
      <svg ref={svgRef} width="100%" height="340" style={{ display: 'block' }} />
    </div>
  )
}
