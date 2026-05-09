import { useState, useEffect } from 'react'
import { useFeedCosts } from '../../hooks/useFeedCosts'
import { useIncome } from '../../hooks/useIncome'
import { useAnimals } from '../../hooks/useAnimals'
import { useIsMobile } from '../../hooks/useIsMobile'
import { S, fmt, ANIMAL_META } from '../ui/shared'

// ─── Bar Chart ────────────────────────────────────────────────────────────────
function BarChart({ months, incomeByMonth, costsByMonth }) {
  const isMobile = useIsMobile()
  const maxVal = Math.max(...months.map(m => Math.max(incomeByMonth[m] || 0, costsByMonth[m] || 0)), 1)
  const chartH  = isMobile ? 160 : 220
  const barW    = isMobile ? 18 : 28
  const gap     = isMobile ? 8  : 16
  const groupW  = barW * 2 + gap
  const padL    = 52
  const padB    = 44
  const padT    = 16
  const totalW  = padL + months.length * (groupW + (isMobile ? 10 : 20)) + 20
  const ticks   = 4

  return (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 4 }}>
      <svg width={Math.max(totalW, 300)} height={chartH + padB + padT} style={{ display: 'block' }}>
        {/* Y axis ticks */}
        {Array.from({ length: ticks + 1 }, (_, i) => {
          const val = (maxVal / ticks) * i
          const y   = padT + chartH - (chartH * i / ticks)
          return (
            <g key={i}>
              <line x1={padL} x2={totalW - 10} y1={y} y2={y} stroke="#f0ebe4" strokeWidth={1} />
              <text x={padL - 6} y={y + 4} textAnchor="end" fontSize={isMobile ? 9 : 10} fill="#a08060">{fmt(val).replace('$','').replace('.00','')}</text>
            </g>
          )
        })}
        {/* Bars */}
        {months.map((mo, idx) => {
          const x       = padL + idx * (groupW + (isMobile ? 10 : 20))
          const income  = incomeByMonth[mo] || 0
          const expense = costsByMonth[mo]  || 0
          const incH    = (income  / maxVal) * chartH
          const expH    = (expense / maxVal) * chartH
          const label   = mo.slice(5) // MM
          const monthNames = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
          return (
            <g key={mo}>
              {/* Income bar */}
              <rect x={x} y={padT + chartH - incH} width={barW} height={Math.max(incH, 1)}
                fill="#4caf50" rx={3} opacity={0.85} />
              {/* Expense bar */}
              <rect x={x + barW + gap} y={padT + chartH - expH} width={barW} height={Math.max(expH, 1)}
                fill="#c62828" rx={3} opacity={0.75} />
              {/* Month label */}
              <text x={x + barW + gap/2} y={padT + chartH + 16} textAnchor="middle" fontSize={isMobile ? 9 : 11} fill="#7a6648" fontWeight={600}>
                {monthNames[parseInt(label)]}
              </text>
              {/* Year label if Jan */}
              {label === '01' && (
                <text x={x + barW + gap/2} y={padT + chartH + 30} textAnchor="middle" fontSize={8} fill="#c8b89a">{mo.slice(0,4)}</text>
              )}
            </g>
          )
        })}
        {/* X axis line */}
        <line x1={padL} x2={totalW - 10} y1={padT + chartH} y2={padT + chartH} stroke="#e8e0d0" strokeWidth={1.5} />
      </svg>
    </div>
  )
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────
function DonutChart({ segments, title, centerLabel, centerValue }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  if (total === 0) return (
    <div style={{ textAlign: 'center', padding: '32px 0', color: '#a08060', fontSize: 13 }}>No data yet</div>
  )

  const size = 160, r = 60, cx = size/2, cy = size/2
  let angle = -90

  const paths = segments.map(seg => {
    const pct   = seg.value / total
    const start = angle
    const end   = angle + pct * 360
    angle       = end

    const startR = (start * Math.PI) / 180
    const endR   = (end   * Math.PI) / 180
    const large  = end - start > 180 ? 1 : 0

    const x1 = cx + r * Math.cos(startR)
    const y1 = cy + r * Math.sin(startR)
    const x2 = cx + r * Math.cos(endR)
    const y2 = cy + r * Math.sin(endR)

    return { ...seg, d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`, pct }
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <svg width={size} height={size}>
          {/* Donut hole */}
          {paths.map((p, i) => (
            <path key={i} d={p.d} fill={p.color} opacity={0.9} />
          ))}
          <circle cx={cx} cy={cy} r={38} fill="#fff" />
          <text x={cx} y={cy - 5} textAnchor="middle" fontSize={11} fill="#a08060" fontWeight={600}>{centerLabel}</text>
          <text x={cx} y={cy + 12} textAnchor="middle" fontSize={14} fill="#2c2416" fontWeight={700}
            style={{ fontFamily: "'Playfair Display',serif" }}>{centerValue}</text>
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 140 }}>
        {paths.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#4a3c28', flex: 1, fontWeight: 600 }}>{p.label}</span>
            <span style={{ fontSize: 12, color: '#a08060' }}>{Math.round(p.pct * 100)}%</span>
            <span style={{ fontSize: 12, color: '#2c2416', fontWeight: 700 }}>{p.isCount ? p.value : fmt(p.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export function DashboardPage() {
  const { costs }   = useFeedCosts()
  const { income }  = useIncome()
  const { animals: sheep }    = useAnimals('sheep')
  const { animals: chickens } = useAnimals('chickens')
  const isMobile = useIsMobile()

  const [view, setView] = useState('pnl') // 'pnl' | 'animals'

  // ── P&L by month ──────────────────────────────────────────────────────────
  const incomeByMonth = {}
  const costsByMonth  = {}
  income.forEach(i => { const m = i.date.slice(0,7); incomeByMonth[m] = (incomeByMonth[m]||0) + Number(i.amount) })
  costs.forEach(c  => { const m = c.date.slice(0,7); costsByMonth[m]  = (costsByMonth[m] ||0) + Number(c.amount) })

  const allMonths = [...new Set([...Object.keys(incomeByMonth), ...Object.keys(costsByMonth)])].sort()
  const last6     = allMonths.slice(-6)

  const totalIncome  = income.reduce((s, i) => s + Number(i.amount), 0)
  const totalCosts   = costs.reduce((s,  c) => s + Number(c.amount), 0)
  const netPnL       = totalIncome - totalCosts

  // ── Income by type ────────────────────────────────────────────────────────
  const incomeTypeColors = {
    sale_animal:  '#795548', sale_produce: '#4caf50', sale_eggs: '#f9a825',
    sale_wool:    '#90caf9', sale_meat:    '#ef5350', breeding: '#ab47bc', other: '#78909c',
  }
  const incomeTypeLabels = {
    sale_animal: 'Animal Sale', sale_produce: 'Produce', sale_eggs: 'Eggs',
    sale_wool:   'Wool',        sale_meat:    'Meat',    breeding: 'Breeding', other: 'Other',
  }
  const byType = {}
  income.forEach(i => { byType[i.income_type] = (byType[i.income_type]||0) + Number(i.amount) })
  const incomeSegments = Object.entries(byType).map(([k, v]) => ({
    label: incomeTypeLabels[k] || k, value: v, color: incomeTypeColors[k] || '#78909c',
  })).filter(s => s.value > 0).sort((a,b) => b.value - a.value)

  // ── Expense by category ───────────────────────────────────────────────────
  const expCatColors = {
    hay: '#f9a825', feed: '#795548', medicine: '#ef5350', infrastructure: '#546e7a',
    equipment: '#1565c0', bedding: '#66bb6a', supplements: '#ab47bc', labour: '#8d6e63', other: '#78909c',
  }
  const expCatLabels = {
    hay:'Hay', feed:'Feed', medicine:'Medicine', infrastructure:'Infrastructure',
    equipment:'Equipment', bedding:'Bedding', supplements:'Supplements', labour:'Labour', other:'Other',
  }
  const byCat = {}
  costs.forEach(c => { byCat[c.category||'other'] = (byCat[c.category||'other']||0) + Number(c.amount) })
  const expSegments = Object.entries(byCat).map(([k,v]) => ({
    label: expCatLabels[k]||k, value: v, color: expCatColors[k]||'#78909c',
  })).filter(s => s.value > 0).sort((a,b) => b.value - a.value)

  // ── Animal breakdown ──────────────────────────────────────────────────────
  const sheepBySex    = {}
  sheep.forEach(a => { sheepBySex[a.sex] = (sheepBySex[a.sex]||0) + 1 })
  const sheepSegments = Object.entries(sheepBySex).map(([k,v]) => ({
    label: k.charAt(0).toUpperCase()+k.slice(1), value: v, color: k==='ram'?'#5d4037':k==='ewe'?'#a1887f':'#d7ccc8', isCount: true,
  }))

  const sheepByStatus = {}
  sheep.forEach(a => { sheepByStatus[a.status] = (sheepByStatus[a.status]||0) + 1 })
  const sheepStatusSegments = Object.entries(sheepByStatus).map(([k,v]) => ({
    label: k.charAt(0).toUpperCase()+k.slice(1), value: v,
    color: k==='alive'?'#4caf50':k==='sold'?'#9c27b0':'#9e9e9e', isCount: true,
  }))

  const chickenByBreed = {}
  chickens.forEach(c => { const breed = c.breed||'Unknown'; chickenByBreed[breed] = (chickenByBreed[breed]||0) + 1 })
  const breedColors = ['#f57f17','#e65100','#ff8f00','#f9a825','#ef6c00','#d84315','#bf360c','#e64a19','#ff7043']
  const chickenBreedSegments = Object.entries(chickenByBreed).map(([k,v],i) => ({
    label: k, value: v, color: breedColors[i % breedColors.length], isCount: true,
  })).sort((a,b) => b.value - a.value)

  const chickenBySex = {}
  chickens.forEach(c => { chickenBySex[c.sex] = (chickenBySex[c.sex]||0) + 1 })
  const chickenSexSegments = Object.entries(chickenBySex).map(([k,v]) => ({
    label: k.charAt(0).toUpperCase()+k.slice(1), value: v,
    color: k==='hen'?'#f9a825':k==='rooster'?'#c62828':'#ffcc80', isCount: true,
  }))

  const card = { ...S.card, padding: isMobile ? 16 : 24, marginBottom: 16 }
  const sectionTitle = { fontFamily:"'Playfair Display',serif", fontSize: 17, fontWeight: 700, marginBottom: 16, color: '#2c2416' }

  return (
    <div style={{ ...S.page, padding: isMobile ? '16px 12px' : '32px 24px' }}>
      <style>{`
        @media(max-width:767px){
          .dash-stats{grid-template-columns:repeat(2,1fr)!important;}
          .dash-donuts{grid-template-columns:1fr!important;}
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize: isMobile ? 24 : 30, fontWeight: 700, margin:'0 0 4px' }}>📊 Dashboard</h1>
          <p style={{ fontSize: 13, color: '#a08060', margin: 0 }}>Farm overview and analytics</p>
        </div>
        {/* Toggle */}
        <div style={{ display: 'flex', background: '#f0e8d8', borderRadius: 10, padding: 3, gap: 2 }}>
          {[['pnl','💰 P & L'],['animals','🐾 Animals']].map(([key, label]) => (
            <button key={key} onClick={() => setView(key)}
              style={{ ...S.btn, padding: '7px 16px', fontSize: 13, borderRadius: 8,
                background: view === key ? '#5a3e1b' : 'transparent',
                color: view === key ? '#fff' : '#7a6648', border: 'none',
                transition: 'all 0.2s' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── P&L View ────────────────────────────────────────────────────── */}
      {view === 'pnl' && (
        <>
          {/* Summary stats */}
          <div className="dash-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Total Income',   value: fmt(totalIncome), color: '#2e7d32', bg: '#f1f8f1' },
              { label: 'Total Expenses', value: fmt(totalCosts),  color: '#c62828', bg: '#fff3f3' },
              { label: 'Net P & L',      value: (netPnL>=0?'+':'')+fmt(netPnL), color: netPnL>=0?'#2e7d32':'#c62828', bg: netPnL>=0?'#e8f5e9':'#fff3f3' },
            ].map(s => (
              <div key={s.label} style={{ ...S.card, padding: '14px 12px', textAlign: 'center', background: s.bg, border: `1px solid ${s.color}22` }}>
                <div style={{ fontSize: isMobile ? 16 : 22, fontWeight: 700, color: s.color, fontFamily:"'Playfair Display',serif" }}>{s.value}</div>
                <div style={{ fontSize: 10, color: '#a08060', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Bar chart */}
          <div style={card}>
            <p style={sectionTitle}>Income vs Expenses by Month</p>
            {last6.length === 0
              ? <p style={{ color: '#a08060', fontSize: 13 }}>No data yet — log some income or expenses to see your chart.</p>
              : <BarChart months={last6} incomeByMonth={incomeByMonth} costsByMonth={costsByMonth} />
            }
            {/* Legend */}
            <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: 2, background: '#4caf50' }} />
                <span style={{ fontSize: 12, color: '#4a3c28', fontWeight: 600 }}>Income</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: 2, background: '#c62828' }} />
                <span style={{ fontSize: 12, color: '#4a3c28', fontWeight: 600 }}>Expenses</span>
              </div>
            </div>
          </div>

          {/* Donut charts */}
          <div className="dash-donuts" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={card}>
              <p style={sectionTitle}>Income Breakdown</p>
              <DonutChart segments={incomeSegments} centerLabel="Total" centerValue={fmt(totalIncome)} />
            </div>
            <div style={card}>
              <p style={sectionTitle}>Expense Breakdown</p>
              <DonutChart segments={expSegments} centerLabel="Total" centerValue={fmt(totalCosts)} />
            </div>
          </div>
        </>
      )}

      {/* ── Animals View ─────────────────────────────────────────────────── */}
      {view === 'animals' && (
        <>
          {/* Summary */}
          <div className="dash-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Total Sheep',    value: sheep.length,    emoji: '🐑' },
              { label: 'Total Chickens', value: chickens.length, emoji: '🐔' },
              { label: 'Total Animals',  value: sheep.length + chickens.length, emoji: '🐾' },
            ].map(s => (
              <div key={s.label} style={{ ...S.card, padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{s.emoji}</div>
                <div style={{ fontSize: isMobile ? 20 : 26, fontWeight: 700, fontFamily:"'Playfair Display',serif" }}>{s.value}</div>
                <div style={{ fontSize: 10, color: '#a08060', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Sheep charts */}
          {sheep.length > 0 && (
            <div className="dash-donuts" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 0 }}>
              <div style={card}>
                <p style={sectionTitle}>🐑 Sheep by Sex</p>
                <DonutChart segments={sheepSegments} centerLabel="Total" centerValue={sheep.length} />
              </div>
              <div style={card}>
                <p style={sectionTitle}>🐑 Sheep by Status</p>
                <DonutChart segments={sheepStatusSegments} centerLabel="Total" centerValue={sheep.length} />
              </div>
            </div>
          )}

          {/* Chickens charts */}
          {chickens.length > 0 && (
            <div className="dash-donuts" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={card}>
                <p style={sectionTitle}>🐔 Chickens by Sex</p>
                <DonutChart segments={chickenSexSegments} centerLabel="Total" centerValue={chickens.length} />
              </div>
              <div style={card}>
                <p style={sectionTitle}>🐔 Chickens by Breed</p>
                <DonutChart segments={chickenBreedSegments} centerLabel="Breeds" centerValue={Object.keys(chickenByBreed).length} />
              </div>
            </div>
          )}

          {sheep.length === 0 && chickens.length === 0 && (
            <div style={{ ...S.card, padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🐾</div>
              <p style={{ color: '#a08060', fontSize: 15 }}>Add some animals to see your breakdown charts.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
