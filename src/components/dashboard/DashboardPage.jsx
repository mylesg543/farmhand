import { useState, useEffect } from 'react'
import { useFeedCosts } from '../../hooks/useFeedCosts'
import { useIncome } from '../../hooks/useIncome'
import { useAnimals } from '../../hooks/useAnimals'
import { useCustomers } from '../../hooks/useCustomers'
import { S, fmt } from '../ui/shared'

function useIsMobile() {
  const [m, setM] = useState(window.innerWidth < 768)
  useEffect(() => { const fn = () => setM(window.innerWidth < 768); window.addEventListener('resize', fn); return () => window.removeEventListener('resize', fn) }, [])
  return m
}

// ─── Bar Chart ─────────────────────────────────────────────────────────────────
function BarChart({ months, incomeByMonth, costsByMonth }) {
  const isMobile = useIsMobile()
  const maxVal = Math.max(...months.map(m => Math.max(incomeByMonth[m]||0, costsByMonth[m]||0)), 1)
  const chartH=isMobile?160:220, barW=isMobile?18:28, gap=isMobile?8:16
  const groupW=barW*2+gap, padL=52, padT=16, totalW=padL+months.length*(groupW+(isMobile?10:20))+20
  const ticks=4
  return (
    <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch', paddingBottom:4 }}>
      <svg width={Math.max(totalW,300)} height={chartH+60} style={{ display:'block' }}>
        {Array.from({length:ticks+1},(_,i)=>{
          const val=(maxVal/ticks)*i, y=padT+chartH-(chartH*i/ticks)
          return(<g key={i}><line x1={padL} x2={totalW-10} y1={y} y2={y} stroke="#f0ebe4" strokeWidth={1}/><text x={padL-6} y={y+4} textAnchor="end" fontSize={isMobile?9:10} fill="#a08060">{fmt(val).replace('$','').replace('.00','')}</text></g>)
        })}
        {months.map((mo,idx)=>{
          const x=padL+idx*(groupW+(isMobile?10:20))
          const income=incomeByMonth[mo]||0, expense=costsByMonth[mo]||0
          const incH=(income/maxVal)*chartH, expH=(expense/maxVal)*chartH
          const label=mo.slice(5)
          const mn=['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
          return(<g key={mo}>
            <rect x={x} y={padT+chartH-incH} width={barW} height={Math.max(incH,1)} fill="#4caf50" rx={3} opacity={0.85}/>
            <rect x={x+barW+gap} y={padT+chartH-expH} width={barW} height={Math.max(expH,1)} fill="#c62828" rx={3} opacity={0.75}/>
            <text x={x+barW+gap/2} y={padT+chartH+16} textAnchor="middle" fontSize={isMobile?9:11} fill="#7a6648" fontWeight={600}>{mn[parseInt(label)]}</text>
            {label==='01'&&<text x={x+barW+gap/2} y={padT+chartH+30} textAnchor="middle" fontSize={8} fill="#c8b89a">{mo.slice(0,4)}</text>}
          </g>)
        })}
        <line x1={padL} x2={totalW-10} y1={padT+chartH} y2={padT+chartH} stroke="#e8e0d0" strokeWidth={1.5}/>
      </svg>
    </div>
  )
}

// ─── Donut Chart ───────────────────────────────────────────────────────────────
function DonutChart({ segments, centerLabel, centerValue }) {
  const total=segments.reduce((s,sg)=>s+sg.value,0)
  if(!total) return <div style={{ textAlign:'center', padding:'32px 0', color:'#a08060', fontSize:13 }}>No data yet</div>
  const size=160, r=60, cx=size/2, cy=size/2
  let angle=-90
  const paths=segments.map(sg=>{
    const pct=sg.value/total, start=angle, end=angle+pct*360; angle=end
    const sR=(start*Math.PI)/180, eR=(end*Math.PI)/180, large=end-start>180?1:0
    const x1=cx+r*Math.cos(sR),y1=cy+r*Math.sin(sR),x2=cx+r*Math.cos(eR),y2=cy+r*Math.sin(eR)
    return {...sg, d:`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`, pct}
  })
  return (
    <div style={{ display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
      <div style={{ flexShrink:0 }}>
        <svg width={size} height={size}>
          {paths.map((p,i)=><path key={i} d={p.d} fill={p.color} opacity={0.9}/>)}
          <circle cx={cx} cy={cy} r={38} fill="#fff"/>
          <text x={cx} y={cy-5} textAnchor="middle" fontSize={11} fill="#a08060" fontWeight={600}>{centerLabel}</text>
          <text x={cx} y={cy+12} textAnchor="middle" fontSize={14} fill="#2c2416" fontWeight={700} style={{ fontFamily:"'Playfair Display',serif" }}>{centerValue}</text>
        </svg>
      </div>
      <div style={{ flex:1, minWidth:140 }}>
        {paths.map((p,i)=>(
          <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <div style={{ width:10, height:10, borderRadius:'50%', background:p.color, flexShrink:0 }}/>
            <span style={{ fontSize:12, color:'#4a3c28', flex:1, fontWeight:600 }}>{p.label}</span>
            <span style={{ fontSize:11, color:'#a08060' }}>{Math.round(p.pct*100)}%</span>
            <span style={{ fontSize:12, color:'#2c2416', fontWeight:700 }}>{p.isCount?p.value:fmt(p.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Dashboard Page ────────────────────────────────────────────────────────────
export function DashboardPage() {
  const { costs }              = useFeedCosts()
  const { income }             = useIncome()
  const { animals: sheep }     = useAnimals('sheep')
  const { animals: chickens }  = useAnimals('chickens')
  const { customers }          = useCustomers()
  const isMobile = useIsMobile()

  const [view,      setView]      = useState('pnl')      // pnl | animals | customers
  const [animalSp,  setAnimalSp]  = useState('sheep')    // sheep | chickens — animal tab filter
  const [expanded,  setExpanded]  = useState(null)       // customer id

  // ── P&L by month ──────────────────────────────────────────────────────────────
  const incomeByMonth={}, costsByMonth={}
  income.forEach(i=>{ const m=i.date.slice(0,7); incomeByMonth[m]=(incomeByMonth[m]||0)+Number(i.amount) })
  costs.forEach(c=>{  const m=c.date.slice(0,7); costsByMonth[m] =(costsByMonth[m] ||0)+Number(c.amount) })
  const allMonths=[...new Set([...Object.keys(incomeByMonth),...Object.keys(costsByMonth)])].sort()
  const last6=allMonths.slice(-6)
  const totalIncome=income.reduce((s,i)=>s+Number(i.amount),0)
  const totalCosts =costs.reduce((s,c) =>s+Number(c.amount),0)
  const netPnL=totalIncome-totalCosts

  // ── Income breakdown ───────────────────────────────────────────────────────────
  const incomeTypeColors={ sale_animal:'#795548',sale_produce:'#4caf50',sale_eggs:'#f9a825',sale_wool:'#90caf9',sale_meat:'#ef5350',breeding:'#ab47bc',other:'#78909c' }
  const incomeTypeLabels={ sale_animal:'Animal Sale',sale_produce:'Produce',sale_eggs:'Eggs',sale_wool:'Wool',sale_meat:'Meat',breeding:'Breeding',other:'Other' }
  const byType={}; income.forEach(i=>{ byType[i.income_type]=(byType[i.income_type]||0)+Number(i.amount) })
  const incomeSegments=Object.entries(byType).map(([k,v])=>({ label:incomeTypeLabels[k]||k, value:v, color:incomeTypeColors[k]||'#78909c' })).filter(s=>s.value>0).sort((a,b)=>b.value-a.value)

  // ── Expense breakdown ──────────────────────────────────────────────────────────
  const expCatColors={ hay:'#f9a825',feed:'#795548',medicine:'#ef5350',infrastructure:'#546e7a',equipment:'#1565c0',bedding:'#66bb6a',supplements:'#ab47bc',labour:'#8d6e63',other:'#78909c' }
  const expCatLabels={ hay:'Hay',feed:'Feed',medicine:'Medicine',infrastructure:'Infrastructure',equipment:'Equipment',bedding:'Bedding',supplements:'Supplements',labour:'Labour',other:'Other' }
  const byCat={}; costs.forEach(c=>{ byCat[c.category||'other']=(byCat[c.category||'other']||0)+Number(c.amount) })
  const expSegments=Object.entries(byCat).map(([k,v])=>({ label:expCatLabels[k]||k, value:v, color:expCatColors[k]||'#78909c' })).filter(s=>s.value>0).sort((a,b)=>b.value-a.value)

  // ── Animal breakdowns ──────────────────────────────────────────────────────────
  const sheepBySex={};    sheep.forEach(a=>{ sheepBySex[a.sex]=(sheepBySex[a.sex]||0)+1 })
  const sheepByStatus={};  sheep.forEach(a=>{ sheepByStatus[a.status]=(sheepByStatus[a.status]||0)+1 })
  const sheepByBreed={};   sheep.forEach(a=>{ const b=a.breed||'Unknown'; sheepByBreed[b]=(sheepByBreed[b]||0)+1 })
  const chickenBySex={};   chickens.forEach(c=>{ chickenBySex[c.sex]=(chickenBySex[c.sex]||0)+1 })
  const chickenByBreed={}; chickens.forEach(c=>{ const b=c.breed||'Unknown'; chickenByBreed[b]=(chickenByBreed[b]||0)+1 })

  const sheepSexSegs    = Object.entries(sheepBySex).map(([k,v])=>({ label:k.charAt(0).toUpperCase()+k.slice(1), value:v, color:k==='ram'?'#5d4037':k==='ewe'?'#a1887f':'#d7ccc8', isCount:true }))
  const sheepStatusSegs = Object.entries(sheepByStatus).map(([k,v])=>({ label:k.charAt(0).toUpperCase()+k.slice(1), value:v, color:k==='alive'?'#4caf50':k==='sold'?'#9c27b0':k==='rented'?'#f9a825':'#9e9e9e', isCount:true }))
  const sheepBreedSegs  = Object.entries(sheepByBreed).map(([k,v],i)=>({ label:k, value:v, color:['#5d4037','#8d6e63','#bcaaa4','#795548','#a1887f'][i%5], isCount:true })).sort((a,b)=>b.value-a.value)
  const chickenSexSegs  = Object.entries(chickenBySex).map(([k,v])=>({ label:k.charAt(0).toUpperCase()+k.slice(1), value:v, color:k==='hen'?'#f9a825':k==='rooster'?'#c62828':'#ffcc80', isCount:true }))
  const chickenBreedSegs= Object.entries(chickenByBreed).map(([k,v],i)=>({ label:k, value:v, color:['#f57f17','#e65100','#ff8f00','#ef6c00','#d84315'][i%5], isCount:true })).sort((a,b)=>b.value-a.value)

  // ── Customer data ──────────────────────────────────────────────────────────────
  const custColors=['#5a3e1b','#795548','#a1887f','#8d6e63','#6d4c41','#4e342e','#3e2723','#bcaaa4']
  const custStats=customers.map((c,i)=>({
    ...c,
    spent:  income.filter(i=>i.customer_id===c.id).reduce((s,i)=>s+Number(i.amount),0),
    eggs:   income.filter(i=>i.customer_id===c.id&&i.income_type==='sale_eggs').reduce((s,i)=>s+(i.quantity||0),0),
    txns:   income.filter(i=>i.customer_id===c.id),
    color:  custColors[i%custColors.length],
  })).filter(c=>c.spent>0).sort((a,b)=>b.spent-a.spent)

  const untagged=income.filter(i=>!i.customer_id).reduce((s,i)=>s+Number(i.amount),0)
  const custPieSegs=[
    ...custStats.map(c=>({ label:c.name.split(' ')[0], value:c.spent, color:c.color })),
    ...(untagged>0?[{ label:'Untagged', value:untagged, color:'#e0e0e0' }]:[])
  ]
  const totalCustRevenue=custStats.reduce((s,c)=>s+c.spent,0)

  const card={ ...S.card, padding:isMobile?16:24, marginBottom:16 }
  const secTitle={ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, marginBottom:16, color:'#2c2416' }

  return (
    <div style={{ ...S.page, padding:isMobile?'16px 12px':'32px 24px' }}>
      <style>{`@media(max-width:767px){.dash-2col{grid-template-columns:1fr!important;}}`}</style>

      {/* Header + tabs */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?24:30, fontWeight:700, margin:'0 0 4px' }}>📊 Dashboard</h1>
          <p style={{ fontSize:13, color:'#a08060', margin:0 }}>Farm overview and analytics</p>
        </div>
        <div style={{ display:'flex', background:'#f0e8d8', borderRadius:10, padding:3, gap:2 }}>
          {[['pnl','💰 P & L'],['animals','🐾 Animals'],['customers','👥 Customers']].map(([key,label])=>(
            <button key={key} onClick={()=>setView(key)}
              style={{ ...S.btn, padding:isMobile?'6px 10px':'7px 16px', fontSize:isMobile?11:13, borderRadius:8,
                background:view===key?'#5a3e1b':'transparent', color:view===key?'#fff':'#7a6648', border:'none', transition:'all 0.2s' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── P&L View ─────────────────────────────────────────────────────────── */}
      {view==='pnl' && (
        <>
          <div className="dash-2col" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
            {[{label:'Total Income',value:fmt(totalIncome),color:'#2e7d32',bg:'#f1f8f1'},{label:'Total Expenses',value:fmt(totalCosts),color:'#c62828',bg:'#fff3f3'},{label:'Net P & L',value:(netPnL>=0?'+':'')+fmt(netPnL),color:netPnL>=0?'#2e7d32':'#c62828',bg:netPnL>=0?'#e8f5e9':'#fff3f3'}].map(s=>(
              <div key={s.label} style={{ ...S.card, padding:'14px 12px', textAlign:'center', background:s.bg, border:`1px solid ${s.color}22` }}>
                <div style={{ fontSize:isMobile?16:22, fontWeight:700, color:s.color, fontFamily:"'Playfair Display',serif" }}>{s.value}</div>
                <div style={{ fontSize:10, color:'#a08060', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', marginTop:3 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={card}>
            <p style={secTitle}>Income vs Expenses by Month</p>
            {last6.length===0
              ? <p style={{ color:'#a08060', fontSize:13 }}>No data yet — log some income or expenses to see your chart.</p>
              : <BarChart months={last6} incomeByMonth={incomeByMonth} costsByMonth={costsByMonth}/>
            }
            <div style={{ display:'flex', gap:20, marginTop:12 }}>
              {[['#4caf50','Income'],['#c62828','Expenses']].map(([c,l])=>(
                <div key={l} style={{ display:'flex', alignItems:'center', gap:6 }}><div style={{ width:12, height:12, borderRadius:2, background:c }}/><span style={{ fontSize:12, color:'#4a3c28', fontWeight:600 }}>{l}</span></div>
              ))}
            </div>
          </div>
          <div className="dash-2col" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div style={card}><p style={secTitle}>Income Breakdown</p><DonutChart segments={incomeSegments} centerLabel="Total" centerValue={fmt(totalIncome)}/></div>
            <div style={card}><p style={secTitle}>Expense Breakdown</p><DonutChart segments={expSegments} centerLabel="Total" centerValue={fmt(totalCosts)}/></div>
          </div>
        </>
      )}

      {/* ── Animals View ──────────────────────────────────────────────────────── */}
      {view==='animals' && (
        <>
          {/* Summary */}
          <div className="dash-2col" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
            {[{label:'Total Sheep',value:sheep.length,emoji:'🐑'},{label:'Total Chickens',value:chickens.length,emoji:'🐔'},{label:'Total Animals',value:sheep.length+chickens.length,emoji:'🐾'}].map(s=>(
              <div key={s.label} style={{ ...S.card, padding:'14px 12px', textAlign:'center' }}>
                <div style={{ fontSize:24, marginBottom:4 }}>{s.emoji}</div>
                <div style={{ fontSize:isMobile?20:26, fontWeight:700, fontFamily:"'Playfair Display',serif" }}>{s.value}</div>
                <div style={{ fontSize:10, color:'#a08060', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em', marginTop:2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Animal type toggle */}
          <div style={{ display:'flex', background:'#f0e8d8', borderRadius:10, padding:3, gap:2, marginBottom:16, width:'fit-content' }}>
            {[['sheep','🐑 Sheep'],['chickens','🐔 Chickens']].map(([k,l])=>(
              <button key={k} onClick={()=>setAnimalSp(k)}
                style={{ ...S.btn, padding:'6px 14px', fontSize:13, borderRadius:8,
                  background:animalSp===k?'#5a3e1b':'transparent', color:animalSp===k?'#fff':'#7a6648', border:'none', transition:'all 0.2s' }}>
                {l}
              </button>
            ))}
          </div>

          {/* Sheep charts */}
          {animalSp==='sheep' && (
            sheep.length===0
              ? <div style={{ ...S.card, padding:60, textAlign:'center' }}><div style={{ fontSize:48, marginBottom:12 }}>🐑</div><p style={{ color:'#a08060', fontSize:15 }}>Add sheep to see your breakdown.</p></div>
              : <div className="dash-2col" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  <div style={card}><p style={secTitle}>🐑 By Sex</p><DonutChart segments={sheepSexSegs} centerLabel="Total" centerValue={sheep.length}/></div>
                  <div style={card}><p style={secTitle}>🐑 By Status</p><DonutChart segments={sheepStatusSegs} centerLabel="Total" centerValue={sheep.length}/></div>
                  {Object.keys(sheepByBreed).length>1&&<div style={{ ...card, gridColumn:isMobile?undefined:'span 2' }}><p style={secTitle}>🐑 By Breed</p><DonutChart segments={sheepBreedSegs} centerLabel="Breeds" centerValue={Object.keys(sheepByBreed).length}/></div>}
                </div>
          )}

          {/* Chicken charts */}
          {animalSp==='chickens' && (
            chickens.length===0
              ? <div style={{ ...S.card, padding:60, textAlign:'center' }}><div style={{ fontSize:48, marginBottom:12 }}>🐔</div><p style={{ color:'#a08060', fontSize:15 }}>Add chickens to see your breakdown.</p></div>
              : <div className="dash-2col" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  <div style={card}><p style={secTitle}>🐔 By Sex</p><DonutChart segments={chickenSexSegs} centerLabel="Total" centerValue={chickens.length}/></div>
                  <div style={card}><p style={secTitle}>🐔 By Breed</p><DonutChart segments={chickenBreedSegs} centerLabel="Breeds" centerValue={Object.keys(chickenByBreed).length}/></div>
                </div>
          )}
        </>
      )}

      {/* ── Customers View ────────────────────────────────────────────────────── */}
      {view==='customers' && (
        <>
          {/* Revenue summary */}
          <div style={{ ...S.card, padding:isMobile?'14px 16px':'18px 22px', marginBottom:14, background:'#f1f8f1' }}>
            <p style={{ fontSize:10, color:'#2e7d32', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 2px' }}>Total Customer Revenue</p>
            <p style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?24:30, fontWeight:700, color:'#2e7d32', margin:0 }}>{fmt(totalCustRevenue)}</p>
          </div>

          {/* Pie chart */}
          {custPieSegs.length>0 && (
            <div style={card}>
              <p style={secTitle}>Revenue by Customer</p>
              <DonutChart segments={custPieSegs} centerLabel="Revenue" centerValue={fmt(totalCustRevenue)}/>
            </div>
          )}

          {/* Customer list with expand */}
          {custStats.length===0
            ? <div style={{ ...S.card, padding:60, textAlign:'center' }}><div style={{ fontSize:48, marginBottom:12 }}>👥</div><p style={{ color:'#a08060', fontSize:15 }}>No customer revenue yet. Tag customers on your income entries.</p></div>
            : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {custStats.map(c=>{
                  const isOpen=expanded===c.id
                  return (
                    <div key={c.id} style={{ ...S.card, overflow:'hidden' }}>
                      {/* Customer row */}
                      <div onClick={()=>setExpanded(isOpen?null:c.id)}
                        style={{ padding:isMobile?'14px 16px':'16px 20px', display:'flex', alignItems:'center', gap:14, cursor:'pointer', userSelect:'none' }}>
                        <div style={{ width:42, height:42, borderRadius:'50%', background:c.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:700, color:'#fff', flexShrink:0 }}>{c.name[0]}</div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:isMobile?14:16, margin:'0 0 3px' }}>{c.name}</p>
                          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                            <span style={{ fontSize:12, color:'#a08060' }}>{c.txns.length} purchase{c.txns.length!==1?'s':''}</span>
                            {c.eggs>0&&<span style={{ fontSize:12, color:'#f57f17', fontWeight:600 }}>🥚 {c.eggs} dozen{c.eggs!==1?'s':''}</span>}
                          </div>
                        </div>
                        <div style={{ textAlign:'right', flexShrink:0, marginRight:8 }}>
                          <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:isMobile?16:20, color:'#2e7d32', margin:0 }}>{fmt(c.spent)}</p>
                          <p style={{ fontSize:10, color:'#a08060', margin:0 }}>total spent</p>
                        </div>
                        <span style={{ color:'#c8b89a', fontSize:16, transition:'transform 0.2s', transform:isOpen?'rotate(90deg)':'none', flexShrink:0 }}>›</span>
                      </div>

                      {/* Expanded transactions */}
                      {isOpen && (
                        <div style={{ borderTop:'1px solid #f0ebe4', background:'#fdfaf6' }}>
                          <p style={{ fontSize:11, fontWeight:700, color:'#a08060', textTransform:'uppercase', letterSpacing:'0.08em', padding:'12px 20px 8px' }}>
                            Purchase History
                          </p>
                          {c.txns.length===0
                            ? <p style={{ fontSize:13, color:'#a08060', padding:'0 20px 16px' }}>No transactions yet.</p>
                            : c.txns.sort((a,b)=>b.date.localeCompare(a.date)).map(t=>(
                              <div key={t.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 20px', borderTop:'1px solid #f7f4ef' }}>
                                <div style={{ flex:1, minWidth:0 }}>
                                  <p style={{ fontSize:13, fontWeight:600, margin:'0 0 1px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.description}</p>
                                  <p style={{ fontSize:11, color:'#a08060', margin:0 }}>
                                    {t.income_type?.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
                                    {t.quantity&&t.unit?` · ${t.quantity} ${t.unit}`:''} · {t.date}
                                  </p>
                                </div>
                                <span style={{ fontSize:14, fontWeight:700, color:'#2e7d32', flexShrink:0 }}>+{fmt(Number(t.amount))}</span>
                              </div>
                            ))
                          }
                          <div style={{ padding:'10px 20px 14px', borderTop:'1px solid #f0ebe4' }}>
                            <p style={{ fontSize:12, color:'#a08060', margin:0, fontStyle:'italic' }}>
                              {c.txns.length} transaction{c.txns.length!==1?'s':''} · Total {fmt(c.spent)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          }
        </>
      )}
    </div>
  )
}
