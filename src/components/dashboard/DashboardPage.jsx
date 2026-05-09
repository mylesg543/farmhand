import { useState } from 'react'
import { useFeedCosts } from '../../hooks/useFeedCosts'
import { useIncome } from '../../hooks/useIncome'
import { useAnimals } from '../../hooks/useAnimals'
import { useCustomers } from '../../hooks/useCustomers'
import { useIsMobile } from '../../hooks/useIsMobile'
import { S, fmt, ANIMAL_META } from '../ui/shared'

// ─── Bar Chart (Income vs Expenses) ──────────────────────────────────────────
function BarChart({ months, incomeByMonth, costsByMonth }) {
  const isMobile = useIsMobile()
  const maxVal   = Math.max(...months.map(m => Math.max(incomeByMonth[m]||0, costsByMonth[m]||0)), 1)
  const chartH   = isMobile ? 140 : 200
  const barW     = isMobile ? 16 : 24
  const gap      = isMobile ? 6  : 12
  const groupW   = barW * 2 + gap
  const spacing  = isMobile ? 8 : 16
  const padL = 52, padB = 40, padT = 12
  const totalW   = padL + months.length * (groupW + spacing) + 16
  const ticks    = 4
  const monthNames = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  return (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <svg width={Math.max(totalW, 280)} height={chartH + padB + padT} style={{ display: 'block' }}>
        {Array.from({ length: ticks+1 }, (_,i) => {
          const val = (maxVal/ticks)*i
          const y   = padT + chartH - (chartH*i/ticks)
          return (
            <g key={i}>
              <line x1={padL} x2={totalW-8} y1={y} y2={y} stroke="#f0ebe4" strokeWidth={1}/>
              <text x={padL-5} y={y+4} textAnchor="end" fontSize={isMobile?8:10} fill="#a08060">
                {val >= 1000 ? `${(val/1000).toFixed(0)}k` : val.toFixed(0)}
              </text>
            </g>
          )
        })}
        {months.map((mo, idx) => {
          const x    = padL + idx*(groupW+spacing)
          const incH = Math.max((incomeByMonth[mo]||0)/maxVal*chartH, 1)
          const expH = Math.max((costsByMonth[mo]||0)/maxVal*chartH, 1)
          const mon  = monthNames[parseInt(mo.slice(5))]
          return (
            <g key={mo}>
              <rect x={x} y={padT+chartH-incH} width={barW} height={incH} fill="#4caf50" rx={3} opacity={0.85}/>
              <rect x={x+barW+gap} y={padT+chartH-expH} width={barW} height={expH} fill="#c62828" rx={3} opacity={0.75}/>
              <text x={x+barW+gap/2} y={padT+chartH+16} textAnchor="middle" fontSize={isMobile?9:11} fill="#7a6648" fontWeight={600}>{mon}</text>
              {mo.slice(5)==='01' && (
                <text x={x+barW+gap/2} y={padT+chartH+28} textAnchor="middle" fontSize={8} fill="#c8b89a">{mo.slice(0,4)}</text>
              )}
            </g>
          )
        })}
        <line x1={padL} x2={totalW-8} y1={padT+chartH} y2={padT+chartH} stroke="#e8e0d0" strokeWidth={1.5}/>
      </svg>
    </div>
  )
}

// ─── Line Chart (Eggs over time) ──────────────────────────────────────────────
function EggLineChart({ eggsByMonth }) {
  const isMobile  = useIsMobile()
  const months    = Object.keys(eggsByMonth).sort()
  if (months.length === 0) return <p style={{ color:'#a08060', fontSize:13 }}>No egg sales recorded yet.</p>
  const maxVal    = Math.max(...months.map(m => eggsByMonth[m]), 1)
  const chartH    = isMobile ? 120 : 160
  const padL = 44, padB = 36, padT = 12
  const w         = isMobile ? 60 : 80
  const totalW    = padL + months.length * w + 16
  const monthNames = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  const pts = months.map((mo, i) => ({
    x: padL + i * w + w/2,
    y: padT + chartH - (eggsByMonth[mo]/maxVal)*chartH,
    val: eggsByMonth[mo],
    label: monthNames[parseInt(mo.slice(5))],
  }))

  const pathD = pts.map((p,i) => `${i===0?'M':'L'} ${p.x} ${p.y}`).join(' ')

  return (
    <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
      <svg width={Math.max(totalW,260)} height={chartH+padB+padT} style={{ display:'block' }}>
        {[0,0.5,1].map((frac,i) => {
          const y = padT + chartH - frac*chartH
          const v = maxVal*frac
          return (
            <g key={i}>
              <line x1={padL} x2={totalW-8} y1={y} y2={y} stroke="#f0ebe4" strokeWidth={1}/>
              <text x={padL-4} y={y+4} textAnchor="end" fontSize={isMobile?8:9} fill="#a08060">{v.toFixed(1)}</text>
            </g>
          )
        })}
        {/* Area fill */}
        <path d={`${pathD} L ${pts[pts.length-1].x} ${padT+chartH} L ${pts[0].x} ${padT+chartH} Z`}
          fill="#f57f17" opacity={0.1}/>
        {/* Line */}
        <path d={pathD} fill="none" stroke="#f57f17" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
        {/* Dots */}
        {pts.map((p,i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={4} fill="#f57f17"/>
            <circle cx={p.x} cy={p.y} r={2} fill="#fff"/>
            <text x={p.x} y={p.y-8} textAnchor="middle" fontSize={isMobile?8:9} fill="#f57f17" fontWeight={700}>{p.val}</text>
            <text x={p.x} y={padT+chartH+16} textAnchor="middle" fontSize={isMobile?8:10} fill="#7a6648" fontWeight={600}>{p.label}</text>
          </g>
        ))}
        <line x1={padL} x2={totalW-8} y1={padT+chartH} y2={padT+chartH} stroke="#e8e0d0" strokeWidth={1.5}/>
      </svg>
    </div>
  )
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────
function DonutChart({ segments, centerLabel, centerValue }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  if (total === 0) return <div style={{ textAlign:'center', padding:'28px 0', color:'#a08060', fontSize:13 }}>No data yet</div>

  const size = 150, r = 55, cx = size/2, cy = size/2

  if (segments.filter(s=>s.value>0).length === 1) {
    const seg = segments.find(s=>s.value>0)
    return (
      <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
        <svg width={size} height={size} style={{ flexShrink:0 }}>
          <circle cx={cx} cy={cy} r={r} fill={seg.color} opacity={0.9}/>
          <circle cx={cx} cy={cy} r={35} fill="#fff"/>
          <text x={cx} y={cy-4} textAnchor="middle" fontSize={10} fill="#a08060" fontWeight={600}>{centerLabel}</text>
          <text x={cx} y={cy+13} textAnchor="middle" fontSize={13} fill="#2c2416" fontWeight={700}>{centerValue}</text>
        </svg>
        <div style={{ flex:1, minWidth:120 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <div style={{ width:10, height:10, borderRadius:'50%', background:seg.color }}/>
            <span style={{ fontSize:12, color:'#4a3c28', flex:1, fontWeight:600 }}>{seg.label}</span>
            <span style={{ fontSize:12, color:'#a08060' }}>100%</span>
            <span style={{ fontSize:12, color:'#2c2416', fontWeight:700 }}>{seg.isCount ? seg.value : fmt(seg.value)}</span>
          </div>
        </div>
      </div>
    )
  }

  let angle = -90
  const paths = segments.filter(s=>s.value>0).map(seg => {
    const pct=seg.value/total, start=angle, end=angle+pct*360
    angle=end
    const sR=(start*Math.PI)/180, eR=(end*Math.PI)/180
    const large=end-start>180?1:0
    const x1=cx+r*Math.cos(sR),y1=cy+r*Math.sin(sR),x2=cx+r*Math.cos(eR),y2=cy+r*Math.sin(eR)
    return {...seg, d:`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`, pct}
  })

  return (
    <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
      <svg width={size} height={size} style={{ flexShrink:0 }}>
        {paths.map((p,i) => <path key={i} d={p.d} fill={p.color} opacity={0.9}/>)}
        <circle cx={cx} cy={cy} r={35} fill="#fff"/>
        <text x={cx} y={cy-4} textAnchor="middle" fontSize={10} fill="#a08060" fontWeight={600}>{centerLabel}</text>
        <text x={cx} y={cy+13} textAnchor="middle" fontSize={13} fill="#2c2416" fontWeight={700}>{centerValue}</text>
      </svg>
      <div style={{ flex:1, minWidth:120 }}>
        {paths.map((p,i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <div style={{ width:10, height:10, borderRadius:'50%', background:p.color, flexShrink:0 }}/>
            <span style={{ fontSize:12, color:'#4a3c28', flex:1, fontWeight:600 }}>{p.label}</span>
            <span style={{ fontSize:11, color:'#a08060' }}>{Math.round(p.pct*100)}%</span>
            <span style={{ fontSize:12, color:'#2c2416', fontWeight:700 }}>{p.isCount ? p.value : fmt(p.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export function DashboardPage() {
  const { costs }     = useFeedCosts()
  const { income }    = useIncome()
  const { animals: sheep }    = useAnimals('sheep')
  const { animals: chickens } = useAnimals('chickens')
  const { customers } = useCustomers()
  const isMobile      = useIsMobile()

  const [view,          setView]          = useState('pnl')       // pnl | animals | customers
  const [speciesFilter, setSpeciesFilter] = useState('all')       // all | sheep | chickens

  // ── Filter by species ───────────────────────────────────────────────────
  const filteredCosts  = speciesFilter === 'all' ? costs  : costs.filter(c  => c.species === speciesFilter)
  const filteredIncome = speciesFilter === 'all' ? income : income.filter(i => i.species === speciesFilter)

  // ── P&L by month ────────────────────────────────────────────────────────
  const incomeByMonth = {}, costsByMonth = {}
  filteredIncome.forEach(i => { const m=i.date.slice(0,7); incomeByMonth[m]=(incomeByMonth[m]||0)+Number(i.amount) })
  filteredCosts.forEach(c  => { const m=c.date.slice(0,7); costsByMonth[m] =(costsByMonth[m] ||0)+Number(c.amount) })
  const allMonths = [...new Set([...Object.keys(incomeByMonth),...Object.keys(costsByMonth)])].sort()
  const last6     = allMonths.slice(-6)

  const totalIncome = filteredIncome.reduce((s,i)=>s+Number(i.amount),0)
  const totalCosts  = filteredCosts.reduce((s,c) =>s+Number(c.amount),0)
  const netPnL      = totalIncome - totalCosts

  // ── Egg line chart data ──────────────────────────────────────────────────
  const eggsByMonth = {}
  income.filter(i=>i.income_type==='sale_eggs'&&i.quantity).forEach(i => {
    const m=i.date.slice(0,7); eggsByMonth[m]=(eggsByMonth[m]||0)+Number(i.quantity)
  })

  // ── Income breakdown ─────────────────────────────────────────────────────
  const incomeTypeColors = { sale_animal:'#795548',sale_produce:'#4caf50',sale_eggs:'#f9a825',sale_wool:'#90caf9',sale_meat:'#ef5350',breeding:'#ab47bc',other:'#78909c' }
  const incomeTypeLabels = { sale_animal:'Animal Sale',sale_produce:'Produce',sale_eggs:'Eggs',sale_wool:'Wool',sale_meat:'Meat',breeding:'Breeding',other:'Other' }
  const byType = {}
  filteredIncome.forEach(i=>{ byType[i.income_type]=(byType[i.income_type]||0)+Number(i.amount) })
  const incomeSegments = Object.entries(byType).map(([k,v])=>({ label:incomeTypeLabels[k]||k, value:v, color:incomeTypeColors[k]||'#78909c' })).filter(s=>s.value>0).sort((a,b)=>b.value-a.value)

  // ── Expense breakdown ────────────────────────────────────────────────────
  const expCatColors = { hay:'#f9a825',feed:'#795548',medicine:'#ef5350',infrastructure:'#546e7a',equipment:'#1565c0',bedding:'#66bb6a',supplements:'#ab47bc',labour:'#8d6e63',other:'#78909c' }
  const expCatLabels = { hay:'Hay',feed:'Feed',medicine:'Medicine',infrastructure:'Infrastructure',equipment:'Equipment',bedding:'Bedding',supplements:'Supplements',labour:'Labour',other:'Other' }
  const byCat = {}
  filteredCosts.forEach(c=>{ byCat[c.category||'other']=(byCat[c.category||'other']||0)+Number(c.amount) })
  const expSegments = Object.entries(byCat).map(([k,v])=>({ label:expCatLabels[k]||k, value:v, color:expCatColors[k]||'#78909c' })).filter(s=>s.value>0).sort((a,b)=>b.value-a.value)

  // ── Animal breakdown ─────────────────────────────────────────────────────
  const sheepBySex    = {}; sheep.forEach(a=>{ sheepBySex[a.sex]=(sheepBySex[a.sex]||0)+1 })
  const sheepByStatus = {}; sheep.forEach(a=>{ sheepByStatus[a.status]=(sheepByStatus[a.status]||0)+1 })
  const chickenByBreed= {}; chickens.forEach(c=>{ const b=c.breed||'Unknown'; chickenByBreed[b]=(chickenByBreed[b]||0)+1 })
  const chickenBySex  = {}; chickens.forEach(c=>{ chickenBySex[c.sex]=(chickenBySex[c.sex]||0)+1 })
  const breedColors   = ['#f57f17','#e65100','#ff8f00','#f9a825','#ef6c00','#d84315','#bf360c','#e64a19','#ff7043']

  const sheepSegments      = Object.entries(sheepBySex).map(([k,v])=>({ label:k.charAt(0).toUpperCase()+k.slice(1), value:v, color:k==='ram'?'#5d4037':k==='ewe'?'#a1887f':'#d7ccc8', isCount:true }))
  const sheepStatusSegments= Object.entries(sheepByStatus).map(([k,v])=>({ label:k.charAt(0).toUpperCase()+k.slice(1), value:v, color:k==='alive'?'#4caf50':k==='sold'?'#9c27b0':'#9e9e9e', isCount:true }))
  const chickenBreedSegments=Object.entries(chickenByBreed).map(([k,v],i)=>({ label:k, value:v, color:breedColors[i%breedColors.length], isCount:true })).sort((a,b)=>b.value-a.value)
  const chickenSexSegments  =Object.entries(chickenBySex).map(([k,v])=>({ label:k.charAt(0).toUpperCase()+k.slice(1), value:v, color:k==='hen'?'#f9a825':k==='rooster'?'#c62828':'#ffcc80', isCount:true }))

  // ── Customer stats ───────────────────────────────────────────────────────
  const customerStats = {}
  income.forEach(i => {
    if (!i.customer_id) return
    if (!customerStats[i.customer_id]) customerStats[i.customer_id] = { totalSpent:0, eggDozens:0, transactions:0 }
    customerStats[i.customer_id].totalSpent   += Number(i.amount)
    customerStats[i.customer_id].transactions += 1
    if (i.income_type==='sale_eggs'&&i.quantity) customerStats[i.customer_id].eggDozens += Number(i.quantity)
  })
  const customersWithStats = customers
    .map(c => ({ ...c, stats: customerStats[c.id] || { totalSpent:0, eggDozens:0, transactions:0 } }))
    .filter(c => c.stats.transactions > 0)
    .sort((a,b) => b.stats.totalSpent - a.stats.totalSpent)
  const totalCustomerRevenue = customersWithStats.reduce((s,c)=>s+c.stats.totalSpent,0)

  const card = { ...S.card, padding: isMobile ? 14 : 22, marginBottom: 14 }
  const sectionTitle = { fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, marginBottom:14, color:'#2c2416' }
  const cols2 = { display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:14 }

  return (
    <div style={{ ...S.page, padding: isMobile ? '14px 12px' : '32px 24px' }}>

      {/* Header + toggle */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18, flexWrap:'wrap', gap:10 }}>
        <div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?22:28, fontWeight:700, margin:'0 0 2px' }}>📊 Dashboard</h1>
          <p style={{ fontSize:12, color:'#a08060', margin:0 }}>Farm overview and analytics</p>
        </div>
        <div style={{ display:'flex', background:'#f0e8d8', borderRadius:10, padding:3, gap:2 }}>
          {[['pnl','💰 P&L'],['animals','🐾 Animals'],['customers','👥 Customers']].map(([key,label]) => (
            <button key={key} onClick={()=>setView(key)}
              style={{ ...S.btn, padding: isMobile?'6px 10px':'7px 14px', fontSize:isMobile?11:13, borderRadius:8,
                background:view===key?'#5a3e1b':'transparent', color:view===key?'#fff':'#7a6648', border:'none', transition:'all 0.2s' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── P&L View ── */}
      {view === 'pnl' && (
        <>
          {/* Species filter */}
          <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
            {[['all','🌾 All'],['sheep','🐑 Sheep'],['chickens','🐔 Chickens']].map(([key,label]) => (
              <button key={key} onClick={()=>setSpeciesFilter(key)}
                style={{ ...S.btn, padding:'6px 14px', fontSize:13,
                  background:speciesFilter===key?'#5a3e1b':'#fff',
                  color:speciesFilter===key?'#fff':'#7a6648',
                  border:'1px solid #d0c4b0' }}>
                {label}
              </button>
            ))}
          </div>

          {/* Summary tiles */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:14 }}>
            {[
              { label:'Income',   value:fmt(totalIncome), color:'#2e7d32', bg:'#f1f8f1' },
              { label:'Expenses', value:fmt(totalCosts),  color:'#c62828', bg:'#fff3f3' },
              { label:'Net P&L',  value:(netPnL>=0?'+':'')+fmt(netPnL), color:netPnL>=0?'#2e7d32':'#c62828', bg:netPnL>=0?'#e8f5e9':'#fff3f3' },
            ].map(s => (
              <div key={s.label} style={{ ...S.card, padding:'12px 10px', textAlign:'center', background:s.bg, border:`1px solid ${s.color}22` }}>
                <div style={{ fontSize:isMobile?15:20, fontWeight:700, color:s.color, fontFamily:"'Playfair Display',serif" }}>{s.value}</div>
                <div style={{ fontSize:9, color:'#a08060', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', marginTop:2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Bar chart */}
          <div style={card}>
            <p style={sectionTitle}>Income vs Expenses by Month</p>
            {last6.length===0
              ? <p style={{ color:'#a08060', fontSize:13 }}>No data yet.</p>
              : <BarChart months={last6} incomeByMonth={incomeByMonth} costsByMonth={costsByMonth} />
            }
            <div style={{ display:'flex', gap:16, marginTop:10 }}>
              {[['#4caf50','Income'],['#c62828','Expenses']].map(([color,label]) => (
                <div key={label} style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <div style={{ width:10, height:10, borderRadius:2, background:color }}/>
                  <span style={{ fontSize:11, color:'#4a3c28', fontWeight:600 }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Egg chart — bar if 1 month, line if 2+ */}
          {(speciesFilter==='all'||speciesFilter==='chickens') && Object.keys(eggsByMonth).length>0 && (
            <div style={card}>
              <p style={sectionTitle}>🥚 Egg Sales — Dozens per Month</p>
              {Object.keys(eggsByMonth).length === 1
                ? (() => {
                    const [mo, val] = Object.entries(eggsByMonth)[0]
                    const monthNames = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
                    const label = monthNames[parseInt(mo.slice(5))]
                    return (
                      <div style={{ display:'flex', alignItems:'center', gap:16, padding:'12px 0' }}>
                        <div style={{ background:'#fff9e6', borderRadius:10, padding:'16px 24px', textAlign:'center' }}>
                          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:32, fontWeight:700, color:'#f57f17' }}>{val}</div>
                          <div style={{ fontSize:11, color:'#a08060', fontWeight:700, textTransform:'uppercase', marginTop:2 }}>Dozens in {label}</div>
                        </div>
                        <p style={{ fontSize:13, color:'#a08060', fontStyle:'italic' }}>Line chart will appear once you have egg sales across multiple months.</p>
                      </div>
                    )
                  })()
                : <EggLineChart eggsByMonth={eggsByMonth} />
              }
            </div>
          )}

          {/* Donut charts — income, expense, customers */}
          <div style={cols2}>
            <div style={card}>
              <p style={sectionTitle}>Income Breakdown</p>
              <DonutChart segments={incomeSegments} centerLabel="Total" centerValue={fmt(totalIncome)} />
            </div>
            <div style={card}>
              <p style={sectionTitle}>Expense Breakdown</p>
              <DonutChart segments={expSegments} centerLabel="Total" centerValue={fmt(totalCosts)} />
            </div>
          </div>

          {/* Customer revenue breakdown — only if customers have sales */}
          {customersWithStats.length > 0 && (() => {
            const custColors = ['#5a3e1b','#795548','#a1887f','#c8a060','#d7ccc8','#8d6e63','#6d4c41','#4e342e']
            const custSegments = customersWithStats.map((c,i) => ({
              label: c.name, value: c.stats.totalSpent, color: custColors[i % custColors.length],
            }))
            const untagged = filteredIncome.filter(i => !i.customer_id).reduce((s,i)=>s+Number(i.amount),0)
            if (untagged > 0) custSegments.push({ label:'Untagged', value:untagged, color:'#ccc' })
            return (
              <div style={card}>
                <p style={sectionTitle}>👥 Revenue by Customer</p>
                <DonutChart segments={custSegments} centerLabel="Revenue" centerValue={fmt(totalIncome)} />
              </div>
            )
          })()}
        </>
      )}

      {/* ── Animals View ── */}
      {view === 'animals' && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:14 }}>
            {[
              { label:'Sheep',    value:sheep.length,    emoji:'🐑' },
              { label:'Chickens', value:chickens.length, emoji:'🐔' },
              { label:'Total',    value:sheep.length+chickens.length, emoji:'🐾' },
            ].map(s => (
              <div key={s.label} style={{ ...S.card, padding:'12px 10px', textAlign:'center' }}>
                <div style={{ fontSize:22, marginBottom:3 }}>{s.emoji}</div>
                <div style={{ fontSize:isMobile?18:24, fontWeight:700, fontFamily:"'Playfair Display',serif" }}>{s.value}</div>
                <div style={{ fontSize:9, color:'#a08060', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em', marginTop:2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {sheep.length>0 && (
            <div style={cols2}>
              <div style={card}><p style={sectionTitle}>🐑 Sheep by Sex</p><DonutChart segments={sheepSegments} centerLabel="Total" centerValue={sheep.length}/></div>
              <div style={card}><p style={sectionTitle}>🐑 Sheep by Status</p><DonutChart segments={sheepStatusSegments} centerLabel="Total" centerValue={sheep.length}/></div>
            </div>
          )}
          {chickens.length>0 && (
            <div style={cols2}>
              <div style={card}><p style={sectionTitle}>🐔 Chickens by Sex</p><DonutChart segments={chickenSexSegments} centerLabel="Total" centerValue={chickens.length}/></div>
              <div style={card}><p style={sectionTitle}>🐔 Chickens by Breed</p><DonutChart segments={chickenBreedSegments} centerLabel="Breeds" centerValue={Object.keys(chickenByBreed).length}/></div>
            </div>
          )}
          {sheep.length===0&&chickens.length===0 && (
            <div style={{ ...S.card, padding:48, textAlign:'center' }}>
              <div style={{ fontSize:40, marginBottom:10 }}>🐾</div>
              <p style={{ color:'#a08060', fontSize:14 }}>Add some animals to see your breakdown.</p>
            </div>
          )}
        </>
      )}

      {/* ── Customers View ── */}
      {view === 'customers' && (
        <>
          {customersWithStats.length === 0 ? (
            <div style={{ ...S.card, padding:48, textAlign:'center' }}>
              <div style={{ fontSize:40, marginBottom:10 }}>👥</div>
              <p style={{ color:'#a08060', fontSize:14 }}>No customer sales yet. Tag customers when logging income in P&L.</p>
            </div>
          ) : (
            <>
              {/* Total revenue tile */}
              <div style={{ ...S.card, padding:'14px 18px', marginBottom:14, display:'flex', alignItems:'center', gap:14, background:'#f1f8f1' }}>
                <div>
                  <p style={{ fontSize:11, color:'#a08060', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 2px' }}>Total Customer Revenue</p>
                  <p style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:700, color:'#2e7d32', margin:0 }}>{fmt(totalCustomerRevenue)}</p>
                </div>
                <div style={{ marginLeft:'auto', textAlign:'right' }}>
                  <p style={{ fontSize:11, color:'#a08060', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 2px' }}>Customers</p>
                  <p style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:700, color:'#2c2416', margin:0 }}>{customersWithStats.length}</p>
                </div>
              </div>

              {/* Customer list */}
              {customersWithStats.map((c,idx) => (
                <div key={c.id} style={{ ...S.card, padding:'14px 16px', marginBottom:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
                    <div style={{ width:36, height:36, borderRadius:'50%', background:'#5a3e1b', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'#f0e6cc', flexShrink:0, fontFamily:"'Playfair Display',serif" }}>
                      {c.name[0].toUpperCase()}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:15, margin:'0 0 1px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</p>
                      <p style={{ fontSize:11, color:'#a08060', margin:0 }}>{c.phone||c.email||'No contact'}</p>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <p style={{ fontSize:16, fontWeight:700, color:'#2e7d32', margin:0, fontFamily:"'Playfair Display',serif" }}>{fmt(c.stats.totalSpent)}</p>
                      <p style={{ fontSize:10, color:'#a08060', margin:0 }}>{c.stats.transactions} sale{c.stats.transactions!==1?'s':''}</p>
                    </div>
                  </div>
                  {/* Stats pills */}
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    <div style={{ background:'#f7f4ef', borderRadius:6, padding:'5px 12px', fontSize:12, color:'#5a3e1b', fontWeight:600 }}>
                      💰 {fmt(c.stats.totalSpent)} total
                    </div>
                    {c.stats.eggDozens>0 && (
                      <div style={{ background:'#fff9e6', borderRadius:6, padding:'5px 12px', fontSize:12, color:'#f57f17', fontWeight:600 }}>
                        🥚 {c.stats.eggDozens} dozen{c.stats.eggDozens!==1?'s':''}
                      </div>
                    )}
                    <div style={{ background:'#f7f4ef', borderRadius:6, padding:'5px 12px', fontSize:12, color:'#7a6648', fontWeight:600 }}>
                      🧾 {c.stats.transactions} transaction{c.stats.transactions!==1?'s':''}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  )
}
