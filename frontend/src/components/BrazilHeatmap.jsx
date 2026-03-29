import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

// Simplified Brazil region paths (viewBox 0 0 500 600)
// Each path is a simplified polygon for its region
const REGION_PATHS = {
  N: "M 60,80 L 200,60 L 260,100 L 280,160 L 220,200 L 160,220 L 80,200 L 40,150 Z",
  NE: "M 260,60 L 380,80 L 420,140 L 400,220 L 340,260 L 280,240 L 260,180 L 260,100 Z",
  CO: "M 160,220 L 280,200 L 340,260 L 320,340 L 260,360 L 180,340 L 140,280 Z",
  SE_RJ: "M 280,320 L 360,300 L 400,360 L 380,420 L 320,440 L 280,400 Z",
  SP: "M 200,340 L 280,320 L 320,380 L 300,440 L 240,460 L 200,420 Z",
  SUL: "M 180,420 L 300,400 L 340,460 L 320,520 L 260,540 L 200,520 L 160,480 Z",
}

// Proper region paths for BrazilHeatmap
const REGIONS_DATA = [
  {
    code: "N",
    label: "Norte",
    path: "M 50,40 L 210,30 L 270,70 L 290,140 L 240,180 L 170,200 L 70,180 L 30,120 Z",
    cx: 155, cy: 110,
  },
  {
    code: "NE",
    label: "Nordeste",
    path: "M 270,30 L 390,50 L 430,110 L 420,190 L 360,240 L 290,220 L 270,160 L 270,70 Z",
    cx: 345, cy: 135,
  },
  {
    code: "CO",
    label: "Centro-Oeste",
    path: "M 160,195 L 285,175 L 345,235 L 330,320 L 270,345 L 180,325 L 140,265 Z",
    cx: 245, cy: 265,
  },
  {
    code: "SP",
    label: "São Paulo",
    path: "M 200,335 L 275,315 L 315,375 L 295,435 L 235,450 L 195,415 Z",
    cx: 255, cy: 380,
  },
  {
    code: "RJ",
    label: "Rio de Janeiro",
    path: "M 290,300 L 370,285 L 405,345 L 385,405 L 325,420 L 285,390 Z",
    cx: 340, cy: 355,
  },
  {
    code: "SUL",
    label: "Sul",
    path: "M 175,430 L 295,410 L 335,460 L 315,520 L 255,540 L 195,520 L 155,475 Z",
    cx: 245, cy: 480,
  },
]

export default function BrazilHeatmap({ regions }) {
  const svgRef = useRef(null)
  const tooltipRef = useRef(null)

  useEffect(() => {
    if (!regions || regions.length === 0) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const scoreMap = Object.fromEntries(regions.map(r => [r.code, r]))
    const colorMap = {
      'Baixo': '#34d399', 'Low': '#34d399',
      'Moderado': '#fbbf24', 'Moderate': '#fbbf24',
      'Alto': '#f97316', 'High': '#f97316',
      'Crítico': '#f87171', 'Critical': '#f87171',
    }

    REGIONS_DATA.forEach(reg => {
      const data = scoreMap[reg.code]
      const fill = data ? (colorMap[data.label] || '#475569') : '#334155'

      svg.append('path')
        .attr('d', reg.path)
        .attr('fill', fill)
        .attr('fill-opacity', 0.85)
        .attr('stroke', '#1e293b')
        .attr('stroke-width', 1.5)
        .style('cursor', 'pointer')
        .on('mouseover', function(event) {
          d3.select(this).attr('fill-opacity', 1).attr('stroke-width', 2.5)
          if (data && tooltipRef.current) {
            tooltipRef.current.style.display = 'block'
            tooltipRef.current.style.left = (event.offsetX + 12) + 'px'
            tooltipRef.current.style.top = (event.offsetY - 10) + 'px'
            tooltipRef.current.innerHTML = `
              <strong>${data.name}</strong><br/>
              Score: <strong style="color:${fill}">${data.score}</strong> — ${data.label}<br/>
              Pico: ${data.peak_infected} · Alcance: ${data.total_reach_pct}%
            `
          }
        })
        .on('mouseout', function() {
          d3.select(this).attr('fill-opacity', 0.85).attr('stroke-width', 1.5)
          if (tooltipRef.current) tooltipRef.current.style.display = 'none'
        })

      // Region label
      svg.append('text')
        .attr('x', reg.cx)
        .attr('y', reg.cy - 6)
        .attr('text-anchor', 'middle')
        .attr('fill', '#f8fafc')
        .attr('font-size', '9px')
        .attr('font-weight', '700')
        .attr('pointer-events', 'none')
        .text(reg.code)

      if (data) {
        svg.append('text')
          .attr('x', reg.cx)
          .attr('y', reg.cy + 8)
          .attr('text-anchor', 'middle')
          .attr('fill', '#f8fafc')
          .attr('font-size', '8px')
          .attr('pointer-events', 'none')
          .text(data.score)
      }
    })
  }, [regions])

  if (!regions || regions.length === 0) return null

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <p style={{ color: '#94A3B8', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
        Mapa de risco por região — Brasil
      </p>
      <div style={{
        background: '#081222',
        border: '1px solid #112236',
        borderRadius: '12px',
        padding: '1rem',
        display: 'flex',
        gap: '1.5rem',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
      }}>
        {/* SVG map */}
        <div style={{ position: 'relative', flex: '0 0 auto' }}>
          <svg ref={svgRef} width="460" height="570" style={{ maxWidth: '100%' }} />
          <div
            ref={tooltipRef}
            style={{
              display: 'none',
              position: 'absolute',
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '0.5rem 0.75rem',
              fontSize: '0.78rem',
              color: '#e2e8f0',
              pointerEvents: 'none',
              zIndex: 10,
              minWidth: 160,
              lineHeight: 1.6,
            }}
          />
        </div>

        {/* Ranking sidebar */}
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
            Ranking de risco
          </div>
          {regions.map((r, i) => (
            <div key={r.code} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem',
              padding: '0.4rem 0.6rem',
              background: '#0f1827',
              borderRadius: '7px',
              border: `1px solid ${r.color}33`,
            }}>
              <span style={{ color: '#475569', fontSize: '0.7rem', width: 14, textAlign: 'right' }}>{i + 1}</span>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: r.color, flexShrink: 0,
              }} />
              <span style={{ color: '#cbd5e1', fontSize: '0.8rem', flex: 1 }}>{r.name}</span>
              <span style={{ color: r.color, fontSize: '0.85rem', fontWeight: 700 }}>{r.score}</span>
            </div>
          ))}
          {/* Legend */}
          <div style={{ marginTop: '1rem', borderTop: '1px solid #1e293b', paddingTop: '0.75rem' }}>
            <div style={{ color: '#64748b', fontSize: '0.68rem', marginBottom: '0.4rem' }}>Score</div>
            {[
              { color: '#34d399', label: '0–25 Baixo' },
              { color: '#fbbf24', label: '26–50 Moderado' },
              { color: '#f97316', label: '51–75 Alto' },
              { color: '#f87171', label: '76–100 Crítico' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                <div style={{ width: 10, height: 10, borderRadius: '2px', background: l.color }} />
                <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
