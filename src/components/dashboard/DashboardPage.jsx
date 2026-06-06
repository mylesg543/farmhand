import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFeedCosts } from '../../hooks/useFeedCosts'
import { useIncome } from '../../hooks/useIncome'
import { useAnimals } from '../../hooks/useAnimals'
import { useRecentAnimalEvents } from '../../hooks/useAnimalEvents'
import { useCustomers } from '../../hooks/useCustomers'
import { useIsMobile } from '../../hooks/useIsMobile'
import { S, AnimalAvatar, ANIMAL_META, animalDetailPath, fmt, formatDate, getEventMeta, getEventTypes } from '../ui/shared'
import { PnLPage } from '../costs/PnLPage'

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
  const activeSegs=segments.filter(sg=>sg.value>0)

  // Single segment = full circle (SVG arc can't do 360°)
  const isSingle=activeSegs.length===1

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
          {isSingle
            ? <circle cx={cx} cy={cy} r={r} fill={activeSegs[0].color} opacity={0.9}/>
            : paths.map((p,i)=><path key={i} d={p.d} fill={p.color} opacity={0.9}/>)
          }
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

function RecentEventsDrawer({ open, onClose, events, loading, error, animals, isMobile, navigate }) {
  const [animalFilter, setAnimalFilter] = useState('all')
  const [eventTypeFilter, setEventTypeFilter] = useState('all')
  const [rangeFilter, setRangeFilter] = useState('30')

  if (!open) return null

  const eventTypes = [...new Map(animals.flatMap(a => getEventTypes(a.species)).map(t => [t.value, t])).values()]
    .sort((a, b) => a.label.localeCompare(b.label))
  const cutoff = rangeFilter === 'all' ? null : new Date(Date.now() - Number(rangeFilter) * 24 * 60 * 60 * 1000)
  const filteredEvents = events.filter(ev => {
    if (animalFilter !== 'all' && ev.animal_id !== animalFilter) return false
    if (eventTypeFilter !== 'all' && ev.event_type !== eventTypeFilter) return false
    if (cutoff) {
      const rawDate = ev.event_date || ev.created_at || ''
      const eventDate = new Date(rawDate.includes('T') ? rawDate : `${rawDate}T00:00:00`)
      if (Number.isNaN(eventDate.getTime()) || eventDate < cutoff) return false
    }
    return true
  })

  return (
    <div style={{ position:'fixed', inset:0, zIndex:5000, background:'rgba(44,36,22,0.42)', display:'flex', justifyContent:isMobile?'stretch':'flex-end', alignItems:'stretch' }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0 }} />
      <div style={{ position:'relative', width:isMobile?'100%':560, maxWidth:'100%', background:'#f7f4ef', boxShadow:'-12px 0 36px rgba(0,0,0,0.22)', display:'flex', flexDirection:'column' }}>
        <div style={{ padding:isMobile?'16px 14px':'20px 22px', background:'#2c2416', color:'#f0e6cc', display:'flex', alignItems:'flex-start', gap:12 }}>
          <div style={{ flex:1 }}>
            <p style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?20:24, fontWeight:700, margin:'0 0 4px' }}>Recent Events</p>
            <p style={{ fontSize:13, color:'#c8a878', margin:0, lineHeight:1.45 }}>Review recent health, care, breeding, and management activity across your animals.</p>
          </div>
          <button onClick={onClose} aria-label="Close recent events" style={{ background:'rgba(255,255,255,0.1)', color:'#f0e6cc', border:'1px solid rgba(255,255,255,0.18)', borderRadius:8, width:38, height:38, cursor:'pointer', fontSize:20, lineHeight:1 }}>×</button>
        </div>
        <div style={{ padding:isMobile?'12px 12px 8px':'14px 18px 10px', display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr 120px', gap:8, borderBottom:'1px solid #e8e0d0', background:'#fff' }}>
          <select value={animalFilter} onChange={e=>setAnimalFilter(e.target.value)} style={S.input}>
            <option value="all">All animals</option>
            {animals.map(a => {
              const meta = ANIMAL_META[a.species] || ANIMAL_META.sheep
              return <option key={a.id} value={a.id}>{meta.singular}: {a.name}</option>
            })}
          </select>
          <select value={eventTypeFilter} onChange={e=>setEventTypeFilter(e.target.value)} style={S.input}>
            <option value="all">All event types</option>
            {eventTypes.map(t => {
              const meta = getEventMeta(t.value, t.label)
              return <option key={t.value} value={t.value}>{meta.icon} {meta.label}</option>
            })}
          </select>
          <select value={rangeFilter} onChange={e=>setRangeFilter(e.target.value)} style={S.input}>
            <option value="7">Last 7d</option>
            <option value="30">Last 30d</option>
            <option value="all">All time</option>
          </select>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:isMobile?12:18 }}>
          {loading ? (
            <p style={{ color:'#a08060', fontSize:14, textAlign:'center', padding:'36px 0' }}>Loading events...</p>
          ) : error ? (
            <div style={{ background:'#fff3f3', border:'1px solid #f5c6c6', color:'#c62828', borderRadius:10, padding:14, fontSize:13 }}>{error}</div>
          ) : filteredEvents.length === 0 ? (
            <div style={{ ...S.card, padding:isMobile?24:40, textAlign:'center' }}>
              <div style={{ fontSize:38, marginBottom:10 }}>📋</div>
              <p style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, margin:'0 0 6px' }}>No recent events yet.</p>
              <p style={{ fontSize:13, color:'#a08060', margin:0 }}>Add events to start building your farm history.</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {filteredEvents.map(ev => {
                const animal = ev.animal
                const speciesMeta = ANIMAL_META[animal?.species] || ANIMAL_META.sheep
                const eventMeta = getEventMeta(ev.event_type)
                return (
                  <button key={ev.id} onClick={() => animal && navigate(animalDetailPath(animal.species, animal.id))}
                    style={{ ...S.card, padding:isMobile?'12px':'13px 14px', display:'grid', gridTemplateColumns:'42px minmax(0, 1fr) auto', gap:12, alignItems:'center', textAlign:'left', cursor:animal?'pointer':'default', fontFamily:"'Lato',sans-serif" }}>
                    <div style={{ width:42, height:42, borderRadius:'50%', overflow:'hidden', border:'2px solid #e8e0d0', background:'#f0ebe4' }}>
                      <AnimalAvatar animal={animal || { species:'sheep', name:'Animal' }} size={42}/>
                    </div>
                    <div style={{ minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:7, flexWrap:'wrap', marginBottom:2 }}>
                        <span style={{ fontSize:13, fontWeight:800, color:eventMeta.color }}>{eventMeta.icon} {eventMeta.label}</span>
                        <span style={{ fontSize:10, fontWeight:800, color:'#7a6648', background:speciesMeta.light, border:`1px solid ${speciesMeta.color}22`, borderRadius:999, padding:'2px 7px' }}>{speciesMeta.singular}</span>
                      </div>
                      <p style={{ fontFamily:"'Playfair Display',serif", fontSize:14, fontWeight:700, margin:'0 0 2px', color:'#2c2416' }}>{animal?.name || 'Unknown animal'}</p>
                      {ev.notes && <p style={{ fontSize:12, color:'#7a6648', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ev.notes}</p>}
                    </div>
                    <span style={{ fontSize:11, color:'#a08060', whiteSpace:'nowrap' }}>{formatDate((ev.event_date || ev.created_at || '').slice(0,10))}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Dashboard Page ────────────────────────────────────────────────────────────
export function DashboardPage() {
  const navigate = useNavigate()
  const { costs }              = useFeedCosts()
  const { income }             = useIncome()
  const { animals: sheep }     = useAnimals('sheep')
  const { animals: chickens }  = useAnimals('chickens')
  const { animals: horses }    = useAnimals('horses')
  const { customers }          = useCustomers()
  const isMobile = useIsMobile()
  const allAnimals = useMemo(() => [...sheep, ...chickens, ...horses], [sheep, chickens, horses])
  const { events: recentEvents, loading:recentEventsLoading, error:recentEventsError } = useRecentAnimalEvents(allAnimals)

  const [view,         setView]        = useState('animals')  // animals | customers
  const [animalSp,     setAnimalSp]    = useState('sheep')    // sheep | chickens | horses
  const [animalFilter, setAnimalFilter]= useState('active')   // active | all
  const [expanded,     setExpanded]    = useState(null)       // customer id
  const [showRecentEvents, setShowRecentEvents] = useState(false)
  const financialChartsRef = useRef(null)

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
  const expCatColors={ hay:'#f9a825',feed:'#795548',medicine:'#ef5350',infrastructure:'#546e7a',equipment:'#1565c0',bedding:'#66bb6a',supplements:'#ab47bc',shearing:'#00897b',labour:'#8d6e63',other:'#78909c' }
  const expCatLabels={ hay:'Hay',feed:'Feed',medicine:'Medicine',infrastructure:'Infrastructure',equipment:'Equipment',bedding:'Bedding',supplements:'Supplements',shearing:'Shearing',labour:'Labour',other:'Other' }
  const byCat={}; costs.forEach(c=>{ byCat[c.category||'other']=(byCat[c.category||'other']||0)+Number(c.amount) })
  const expSegments=Object.entries(byCat).map(([k,v])=>({ label:expCatLabels[k]||k, value:v, color:expCatColors[k]||'#78909c' })).filter(s=>s.value>0).sort((a,b)=>b.value-a.value)

  // ── Animal breakdowns ──────────────────────────────────────────────────────────
  // Active only for the animals tab (alive + rented) — matches AnimalList default
  const activeSheep    = sheep.filter(a => a.status==='alive' || a.status==='rented')
  const activeChickens = chickens.filter(a => a.status==='alive' || a.status==='rented')
  const activeHorses   = horses.filter(a => a.status==='alive' || a.status==='rented')

  // Which set to use based on filter toggle
  const displaySheep    = animalFilter==='active' ? activeSheep    : sheep
  const displayChickens = animalFilter==='active' ? activeChickens : chickens
  const displayHorses   = animalFilter==='active' ? activeHorses   : horses

  const sheepBySex={};    displaySheep.forEach(a=>{ sheepBySex[a.sex]=(sheepBySex[a.sex]||0)+1 })
  const sheepByStatus={};  sheep.forEach(a=>{ sheepByStatus[a.status]=(sheepByStatus[a.status]||0)+1 })
  const sheepByBreed={};   displaySheep.forEach(a=>{ const b=a.breed||'Unknown'; sheepByBreed[b]=(sheepByBreed[b]||0)+1 })
  const chickenBySex={};   displayChickens.forEach(c=>{ chickenBySex[c.sex]=(chickenBySex[c.sex]||0)+1 })
  const chickenByStatus={}; chickens.forEach(c=>{ chickenByStatus[c.status]=(chickenByStatus[c.status]||0)+1 })
  const chickenByBreed={}; displayChickens.forEach(c=>{ const b=c.breed||'Unknown'; chickenByBreed[b]=(chickenByBreed[b]||0)+1 })
  const horseBySex={};     displayHorses.forEach(h=>{ horseBySex[h.sex]=(horseBySex[h.sex]||0)+1 })
  const horseByStatus={};  horses.forEach(h=>{ horseByStatus[h.status]=(horseByStatus[h.status]||0)+1 })
  const horseByBreed={};   displayHorses.forEach(h=>{ const b=h.breed||'Unknown'; horseByBreed[b]=(horseByBreed[b]||0)+1 })

  const sheepSexSegs    = Object.entries(sheepBySex).map(([k,v])=>({ label:k.charAt(0).toUpperCase()+k.slice(1), value:v, color:k==='ram'?'#5d4037':k==='ewe'?'#a1887f':'#d7ccc8', isCount:true }))
  const sheepStatusSegs = Object.entries(sheepByStatus).map(([k,v])=>({ label:k.charAt(0).toUpperCase()+k.slice(1), value:v, color:k==='alive'?'#4caf50':k==='sold'?'#9c27b0':k==='rented'?'#f9a825':'#9e9e9e', isCount:true }))
  const sheepBreedSegs  = Object.entries(sheepByBreed).map(([k,v],i)=>({ label:k, value:v, color:['#5d4037','#8d6e63','#bcaaa4','#795548','#a1887f'][i%5], isCount:true })).sort((a,b)=>b.value-a.value)
  const chickenSexSegs  = Object.entries(chickenBySex).map(([k,v])=>({ label:k.charAt(0).toUpperCase()+k.slice(1), value:v, color:k==='hen'?'#f9a825':k==='rooster'?'#c62828':'#ffcc80', isCount:true }))
  const chickenStatusSegs = Object.entries(chickenByStatus).map(([k,v])=>({ label:k.charAt(0).toUpperCase()+k.slice(1), value:v, color:k==='alive'?'#4caf50':k==='sold'?'#9c27b0':k==='rented'?'#f9a825':'#9e9e9e', isCount:true }))
  const chickenBreedSegs= Object.entries(chickenByBreed).map(([k,v],i)=>({ label:k, value:v, color:['#f57f17','#e65100','#ff8f00','#ef6c00','#d84315'][i%5], isCount:true })).sort((a,b)=>b.value-a.value)
  const horseSexSegs    = Object.entries(horseBySex).map(([k,v])=>({ label:k.charAt(0).toUpperCase()+k.slice(1), value:v, color:k==='mare'?'#8d6e63':k==='stallion'?'#4e342e':k==='gelding'?'#795548':'#bcaaa4', isCount:true }))
  const horseStatusSegs = Object.entries(horseByStatus).map(([k,v])=>({ label:k.charAt(0).toUpperCase()+k.slice(1), value:v, color:k==='alive'?'#4caf50':k==='sold'?'#9c27b0':k==='rented'?'#f9a825':'#9e9e9e', isCount:true }))
  const horseBreedSegs  = Object.entries(horseByBreed).map(([k,v],i)=>({ label:k, value:v, color:['#6d4c41','#8d6e63','#4e342e','#a1887f','#bcaaa4'][i%5], isCount:true })).sort((a,b)=>b.value-a.value)

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
  const chartCard={ ...card, minHeight:isMobile?260:286, boxSizing:'border-box', transition:'box-shadow 0.2s ease, border-color 0.2s ease' }
  const secTitle={ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, marginBottom:16, color:'#2c2416' }
  return (
    <div style={{ ...S.page, padding:isMobile?'16px 12px':'32px 24px', scrollbarGutter:'stable' }}>
      <style>{`@media(max-width:767px){.dash-2col{grid-template-columns:1fr!important;}}`}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?24:30, fontWeight:700, margin:'0 0 4px' }}>Profit & Loss</h1>
          <p style={{ fontSize:13, color:'#a08060', margin:0 }}>Enter farm income and expenses, then see where the money is going.</p>
        </div>
        <button onClick={()=>setShowRecentEvents(true)}
          style={{ ...S.btn, ...S.btnSecondary, padding:isMobile?'8px 11px':'8px 14px', fontSize:isMobile?11:13 }}>
          📋 Recent Events
        </button>
      </div>

      <RecentEventsDrawer
        open={showRecentEvents}
        onClose={()=>setShowRecentEvents(false)}
        events={recentEvents}
        loading={recentEventsLoading}
        error={recentEventsError}
        animals={allAnimals}
        isMobile={isMobile}
        navigate={navigate}
      />

      <PnLPage embedded onViewCharts={()=>{
        financialChartsRef.current?.scrollIntoView({ behavior:'smooth', block:'start' })
      }} />

      <div ref={financialChartsRef} style={{ margin:'26px 0 14px', paddingTop:22,
        borderTop:'2px solid #e8e0d0', scrollMarginTop:isMobile?68:76 }}>
        <p style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?20:23,
          fontWeight:700, margin:'0 0 4px' }}>Financial Charts</p>
        <p style={{ fontSize:13, color:'#a08060', margin:0 }}>Your records update these charts automatically.</p>
      </div>
      <div style={card}>
        <p style={secTitle}>Income vs Expenses by Month</p>
        {last6.length===0
          ? <p style={{ color:'#a08060', fontSize:13 }}>Add income or an expense above to start this chart.</p>
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

      <div style={{ margin:'26px 0 14px', paddingTop:22, borderTop:'2px solid #e8e0d0',
        display:'flex', alignItems:isMobile?'stretch':'center', justifyContent:'space-between',
        flexDirection:isMobile?'column':'row', gap:12 }}>
        <div>
          <p style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?20:23,
            fontWeight:700, margin:'0 0 4px' }}>Farm Insights</p>
          <p style={{ fontSize:13, color:'#a08060', margin:0 }}>Animal and customer summaries.</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', background:'#f0e8d8',
          borderRadius:8, padding:3, gap:3, minWidth:isMobile?0:250 }}>
          {[['animals','🐾 Animals'],['customers','👥 Customers']].map(([key,label])=>(
            <button key={key} onClick={()=>setView(key)}
              style={{ ...S.btn, justifyContent:'center', padding:'8px 12px', fontSize:12, borderRadius:6,
                background:view===key?'#5a3e1b':'transparent', color:view===key?'#fff':'#7a6648',
                border:'none', fontWeight:800 }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Animals View ──────────────────────────────────────────────────────── */}
      {view==='animals' && (
        <>
          {/* Summary — active counts */}
          <div className="dash-2col" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
            {[
              {label:animalFilter==='active'?'Active Sheep':'All Sheep',       value:displaySheep.length,    total:sheep.length,    emoji:'🐑'},
              {label:animalFilter==='active'?'Active Chickens':'All Chickens', value:displayChickens.length, total:chickens.length, emoji:'🐔'},
              {label:animalFilter==='active'?'Active Horses':'All Horses',     value:displayHorses.length,   total:horses.length,   emoji:'🐴'},
              {label:animalFilter==='active'?'Active Total':'All Animals',     value:displaySheep.length+displayChickens.length+displayHorses.length, total:sheep.length+chickens.length+horses.length, emoji:'🐾'},
            ].map(s=>(
              <div key={s.label} style={{ ...S.card, padding:'14px 12px', textAlign:'center', minHeight:isMobile?126:136, boxSizing:'border-box' }}>
                <div style={{ fontSize:24, marginBottom:4 }}>{s.emoji}</div>
                <div style={{ fontSize:isMobile?20:26, fontWeight:700, fontFamily:"'Playfair Display',serif" }}>{s.value}</div>
                <div style={{ fontSize:10, color:'#a08060', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em', marginTop:2 }}>{s.label}</div>
                <div style={{ fontSize:10, color:'#c8b89a', marginTop:2, minHeight:14 }}>
                  {animalFilter==='active' && s.total > s.value ? `${s.total - s.value} sold/deceased` : ''}
                </div>
              </div>
            ))}
          </div>

          {/* Species + Active/All toggles */}
          <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
            <div style={{ display:'flex', background:'#f0e8d8', borderRadius:10, padding:3, gap:2 }}>
              {[['sheep','🐑 Sheep'],['chickens','🐔 Chickens'],['horses','🐴 Horses']].map(([k,l])=>(
                <button key={k} onClick={()=>setAnimalSp(k)}
                  style={{ ...S.btn, padding:'6px 14px', fontSize:13, borderRadius:8,
                    background:animalSp===k?'#5a3e1b':'transparent',
                    color:animalSp===k?'#fff':'#7a6648', border:'none', transition:'all 0.2s' }}>
                  {l}
                </button>
              ))}
            </div>
            <div style={{ display:'flex', background:'#f0e8d8', borderRadius:10, padding:3, gap:2 }}>
              {[['active','Active'],['all','All']].map(([k,l])=>(
                <button key={k} onClick={()=>setAnimalFilter(k)}
                  style={{ ...S.btn, padding:'6px 14px', fontSize:13, borderRadius:8,
                    background:animalFilter===k?'#5a3e1b':'transparent',
                    color:animalFilter===k?'#fff':'#7a6648', border:'none', transition:'all 0.2s' }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Sheep charts */}
          {animalSp==='sheep' && (
            displaySheep.length===0
              ? <div style={{ ...S.card, padding:60, textAlign:'center' }}><div style={{ fontSize:48, marginBottom:12 }}>🐑</div><p style={{ color:'#a08060', fontSize:15 }}>No {animalFilter==='active'?'active ':''} sheep to show.</p></div>
              : <div className="dash-2col" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, minHeight:isMobile?820:610 }}>
                  <div style={chartCard}><p style={secTitle}>🐑 By Sex</p><DonutChart segments={sheepSexSegs} centerLabel={animalFilter==='active'?'Active':'Total'} centerValue={displaySheep.length}/></div>
                  <div style={chartCard}><p style={secTitle}>🐑 By Status</p><DonutChart segments={sheepStatusSegs} centerLabel="All" centerValue={sheep.length}/></div>
                  <div style={{ ...chartCard, gridColumn:isMobile?undefined:'span 2' }}>
                    <p style={secTitle}>🐑 By Breed</p>
                    {Object.keys(sheepByBreed).length>1
                      ? <DonutChart segments={sheepBreedSegs} centerLabel="Breeds" centerValue={Object.keys(sheepByBreed).length}/>
                      : <div style={{ minHeight:160, display:'flex', alignItems:'center', justifyContent:'center', color:'#a08060', fontSize:13, textAlign:'center' }}>
                          Breed breakdown appears when more than one breed is shown.
                        </div>
                    }
                  </div>
                </div>
          )}

          {/* Chicken charts */}
          {animalSp==='chickens' && (
            displayChickens.length===0
              ? <div style={{ ...S.card, padding:60, textAlign:'center' }}><div style={{ fontSize:48, marginBottom:12 }}>🐔</div><p style={{ color:'#a08060', fontSize:15 }}>No {animalFilter==='active'?'active ':''} chickens to show.</p></div>
              : <div className="dash-2col" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, minHeight:isMobile?820:610 }}>
                  <div style={chartCard}><p style={secTitle}>🐔 By Sex</p><DonutChart segments={chickenSexSegs} centerLabel={animalFilter==='active'?'Active':'Total'} centerValue={displayChickens.length}/></div>
                  <div style={chartCard}><p style={secTitle}>🐔 By Status</p><DonutChart segments={chickenStatusSegs} centerLabel="All" centerValue={chickens.length}/></div>
                  <div style={{ ...chartCard, gridColumn:isMobile?undefined:'span 2' }}>
                    <p style={secTitle}>🐔 By Breed</p>
                    {Object.keys(chickenByBreed).length>1
                      ? <DonutChart segments={chickenBreedSegs} centerLabel="Breeds" centerValue={Object.keys(chickenByBreed).length}/>
                      : <div style={{ minHeight:160, display:'flex', alignItems:'center', justifyContent:'center', color:'#a08060', fontSize:13, textAlign:'center' }}>
                          Breed breakdown appears when more than one breed is shown.
                        </div>
                    }
                  </div>
                </div>
          )}

          {/* Horse charts */}
          {animalSp==='horses' && (
            displayHorses.length===0
              ? <div style={{ ...S.card, padding:60, textAlign:'center' }}><div style={{ fontSize:48, marginBottom:12 }}>🐴</div><p style={{ color:'#a08060', fontSize:15 }}>No {animalFilter==='active'?'active ':''} horses to show.</p></div>
              : <div className="dash-2col" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, minHeight:isMobile?820:610 }}>
                  <div style={chartCard}><p style={secTitle}>🐴 By Sex</p><DonutChart segments={horseSexSegs} centerLabel={animalFilter==='active'?'Active':'Total'} centerValue={displayHorses.length}/></div>
                  <div style={chartCard}><p style={secTitle}>🐴 By Status</p><DonutChart segments={horseStatusSegs} centerLabel="All" centerValue={horses.length}/></div>
                  <div style={{ ...chartCard, gridColumn:isMobile?undefined:'span 2' }}>
                    <p style={secTitle}>🐴 By Breed</p>
                    {Object.keys(horseByBreed).length>1
                      ? <DonutChart segments={horseBreedSegs} centerLabel="Breeds" centerValue={Object.keys(horseByBreed).length}/>
                      : <div style={{ minHeight:160, display:'flex', alignItems:'center', justifyContent:'center', color:'#a08060', fontSize:13, textAlign:'center' }}>
                          Breed breakdown appears when more than one breed is shown.
                        </div>
                    }
                  </div>
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
