import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useIsMobile } from '../../hooks/useIsMobile'
import { SEX_LABELS, calcAge, formatDate, fmt, STATUS_STYLES, STATUS_DOT, Badge, S, EVENT_COLORS, ANIMAL_META } from '../ui/shared'
import { DEMO_SHEEP, DEMO_CHICKENS, DEMO_EVENTS, DEMO_COSTS, DEMO_INCOME, DEMO_CUSTOMERS } from './demoData'

// ─── Tour steps ───────────────────────────────────────────────────────────────
const STEPS = [
  { screen:'sheep',        scrollTo:null,           title:'🌾 Welcome to FarmHand!',        body:"A complete farm management app — animals, P&L, customers, and analytics. This is what a real sheep flock looks like in FarmHand." },
  { screen:'sheep',        scrollTo:'animal-strip', title:'🐑 Quick Animal Strip',          body:"Every animal across the top with a live status dot — green for alive, purple for sold. Tap any avatar to jump straight to their profile." },
  { screen:'sheep',        scrollTo:'animal-list',  title:'📋 Full Flock List',            body:"Each animal in a full-width row — photo, name, status badge, breed, sex and age. Everything at a glance, nothing hidden." },
  { screen:'detail',       scrollTo:null,           title:'👆 Bella\'s Full Profile',       body:"Tap any animal for their full profile — photo, tag number, breed, age, and who their parents are. All in one place." },
  { screen:'detail',       scrollTo:'events',       title:'📅 Full Event History',          body:"Every vaccination, shearing, lambing, and worming is logged with the date and notes. Nothing ever gets forgotten." },
  { screen:'status',       scrollTo:'status-form',  title:'✏️ Update Animal Status',        body:"When an animal is sold or passes away, tap Edit and change their status. The history is always preserved — you'll always know what happened." },
  { screen:'bulk_event',   scrollTo:'bulk-event',   title:'⚡ Bulk Events — 1, a Few, or All', body:"Trimmed just 5 of your 10 sheep today? Select exactly those 5 and log it once. Or select all for vaccinations. You choose how many — one tap per animal, one save for all of them." },
  { screen:'chickens',     scrollTo:null,           title:'🐔 Chickens Module',             body:"Chickens get their own page with breed tracking and events like egg production and moulting. Separate from sheep, always organised." },
  { screen:'pnl',          scrollTo:'pnl-tiles',    title:'💰 Profit & Loss',               body:"Filter by All, Sheep, or Chickens to see exactly which part of your farm earns the most. Every dollar in and out is tracked automatically." },
  { screen:'pnl',          scrollTo:'pnl-income',   title:'🥚 Egg Sales in Seconds',        body:"Select the dozen quantity and the price auto-fills — $5/dozen by default but fully adjustable to whatever you charge. Tag the customer and you're done." },
  { screen:'dash_bar',     scrollTo:'dash-filter',  title:'📊 Dashboard — Filter by Animal',body:"The dashboard filters your whole farm by animal type. Switch to Sheep-only or Chickens-only to see exactly what each part of your farm contributes." },
  { screen:'dash_bar',     scrollTo:'dash-bar',     title:'📈 P&L Chart Over Time',         body:"Income vs expenses month by month as a bar chart. You can instantly see trends — is revenue growing? Are feed costs spiking? It's all visible at a glance." },
  { screen:'dash_animals', scrollTo:'dash-sheep',   title:'🐑 Sheep Breakdown',             body:"Your sheep split by sex and by status. Know exactly how many ewes, rams, and wethers you have — and how many are alive vs sold." },
  { screen:'dash_animals', scrollTo:'dash-chickens',title:'🐔 Chicken Breakdown',           body:"Chickens split by sex and breed. Running multiple breeds? See exactly how your flock is composed without digging through every record." },
  { screen:'dash_customers',scrollTo:'dash-customers',title:'👥 Who\'s Buying Most',        body:"Your top customers ranked by spend, with egg dozens tracked per buyer. Sarah buys eggs every week — you can see her total right here." },
  { screen:'bulk',         scrollTo:'bulk-rows',    title:'📋 Bulk Add at Lambing Time',   body:"10 new lambs arriving? Fill in the spreadsheet rows and save them all at once. No clicking through 10 individual forms." },
  { screen:'sheep',        scrollTo:null,           title:'🌾 Ready to Start?',             body:"Create your free account and have your farm set up in minutes. Your data stays private — only you can see it.", isLast:true },
]

// ─── Sheep SVG fallback ───────────────────────────────────────────────────────
function SheepSVG({ sex, size=52 }) {
  const wool='#e8ddd0', face='#c8a87a', isRam=sex==='ram'
  return (
    <svg viewBox="0 0 72 72" width={size} height={size}>
      <ellipse cx="36" cy="46" rx="22" ry="16" fill={wool}/>
      <circle cx="20" cy="44" r="10" fill={wool}/><circle cx="52" cy="44" r="10" fill={wool}/>
      <circle cx="26" cy="38" r="11" fill={wool}/><circle cx="46" cy="38" r="11" fill={wool}/>
      <circle cx="36" cy="36" r="12" fill={wool}/>
      <rect x="24" y="58" width="5" height="10" rx="2" fill={face}/><rect x="43" y="58" width="5" height="10" rx="2" fill={face}/>
      <ellipse cx="36" cy="22" rx="11" ry="10" fill={face}/>
      {isRam
        ? <><path d="M25 20 Q18 14 20 22" stroke={face} strokeWidth="4" strokeLinecap="round" fill="none"/><path d="M47 20 Q54 14 52 22" stroke={face} strokeWidth="4" strokeLinecap="round" fill="none"/></>
        : <><ellipse cx="23" cy="17" rx="4" ry="6" fill={face} transform="rotate(-20 23 17)"/><ellipse cx="49" cy="17" rx="4" ry="6" fill={face} transform="rotate(20 49 17)"/></>
      }
      <circle cx="31" cy="20" r="2.5" fill="#2c2416"/><circle cx="41" cy="20" r="2.5" fill="#2c2416"/>
      <circle cx="31.8" cy="19.2" r="0.8" fill="#fff"/><circle cx="41.8" cy="19.2" r="0.8" fill="#fff"/>
    </svg>
  )
}

function AnimalAvatar({ animal, size=56 }) {
  const [err, setErr] = useState(false)
  const bg = animal.species === 'chickens' ? '#fff9e6' : '#f0ebe4'
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', overflow:'hidden', background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      {animal.photo_url && !err
        ? <img src={animal.photo_url} alt={animal.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={()=>setErr(true)}/>
        : animal.species === 'chickens'
          ? <span style={{ fontSize:size*0.55 }}>🐔</span>
          : <SheepSVG sex={animal.sex} size={size*0.9}/>
      }
    </div>
  )
}

// ─── Fake Nav ─────────────────────────────────────────────────────────────────
function FakeNav({ screen, isMobile }) {
  const isAnimals   = !['pnl','dash_bar','dash_animals','dash_customers'].includes(screen)
  const isPnL       = screen==='pnl'
  const isDashboard = screen.startsWith('dash')
  return (
    <div style={{ background:'#2c2416' }}>
      <div style={{ display:'flex', alignItems:'center', padding:'0 16px', height:isMobile?44:52, gap:10 }}>
        <span style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?16:20, fontWeight:700, color:'#f0e6cc' }}>🌾 FarmHand</span>
        {!isMobile && <span style={{ fontSize:10, color:'#6a5040', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.1em' }}>Farm Management</span>}
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:'#4caf50' }}/>
          <span style={{ fontSize:11, color:'#a08060' }}>demo farm</span>
          {!isMobile && <span style={{ fontSize:11, color:'#6a5040', margin:'0 4px' }}>·</span>}
          {!isMobile && <span style={{ fontSize:11, color:'#a08060' }}>Sign Out</span>}
        </div>
      </div>
      <div style={{ display:'flex', borderTop:'1px solid rgba(255,255,255,0.06)', padding:'0 12px' }}>
        {[['🐾','Animals',isAnimals,false],['🌱','Plants',false,false],['💰','P & L',isPnL,false],['📊','Dashboard',isDashboard,false]].map(([emoji,label,active])=>(
          <div key={label} style={{ padding:isMobile?'8px 10px':'10px 16px', display:'flex', alignItems:'center', gap:5, fontSize:isMobile?11:13, fontWeight:600, color:active?'#f0e6cc':'#6a5040', borderBottom:active?'2px solid #c8a060':'2px solid transparent', whiteSpace:'nowrap', cursor:'default' }}>
            <span>{emoji}</span><span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Highlight wrapper ────────────────────────────────────────────────────────
function Hl({ id, active, children, style={} }) {
  return (
    <div id={id} style={{ ...style, outline:active?'3px solid #c8a060':'none', borderRadius:active?10:0, boxShadow:active?'0 0 0 8px rgba(200,160,96,0.15)':'none', transition:'outline 0.25s, box-shadow 0.25s' }}>
      {children}
    </div>
  )
}

// ─── Sheep / Chickens List Screen ─────────────────────────────────────────────
function AnimalListScreen({ highlight, isMobile, species='sheep' }) {
  const animals = species==='sheep' ? DEMO_SHEEP : DEMO_CHICKENS
  const meta     = species==='sheep' ? { emoji:'🐑', label:'Sheep', alive:4, sold:1 } : { emoji:'🐔', label:'Chickens', alive:5, sold:0 }
  return (
    <div>
      {/* Hero — full width gradient, matches real app exactly */}
      <div style={{ background:'linear-gradient(160deg,#2c2416 0%,#4a3520 40%,#6b4f2e 100%)', width:'100%' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:isMobile?'16px 14px 0':'28px 24px 0' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
            <div>
              <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?24:36, fontWeight:700, color:'#f0e6cc', margin:'0 0 4px' }}>{meta.emoji} {meta.label}</h1>
              <p style={{ fontSize:12, color:'#a08060', margin:0 }}>{meta.alive} alive · {meta.sold} sold · 0 deceased</p>
            </div>
            <div style={{ display:'flex', gap:8, flexShrink:0 }}>
              {!isMobile && <button style={{ ...S.btn, background:'rgba(255,255,255,0.1)', color:'#f0e6cc', border:'1px solid rgba(255,255,255,0.2)', padding:'7px 14px', fontSize:13 }}>☰ Bulk Add</button>}
              <button style={{ ...S.btn, background:'#c8a060', color:'#2c2416', fontWeight:700, padding:isMobile?'8px 14px':'9px 20px', fontSize:isMobile?12:14 }}>+ Add {species==='sheep'?'Sheep':'Chicken'}</button>
            </div>
          </div>
          {/* Avatar strip */}
          <Hl id="animal-strip" active={highlight==='animal-strip'}>
            <div style={{ display:'flex', gap:isMobile?10:14, paddingBottom:20, overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
              {animals.map(a=>(
                <div key={a.id} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flexShrink:0, cursor:'pointer' }}>
                  <div style={{ position:'relative' }}>
                    <div style={{ width:isMobile?52:60, height:isMobile?52:60, borderRadius:'50%', border:`3px solid ${STATUS_DOT[a.status]||'#9e9e9e'}`, overflow:'hidden' }}>
                      <AnimalAvatar animal={a} size={isMobile?52:60}/>
                    </div>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:STATUS_DOT[a.status]||'#9e9e9e', position:'absolute', bottom:2, right:2, border:'2px solid #2c2416' }}/>
                  </div>
                  <span style={{ fontSize:9, fontWeight:700, color:'#c8a878', textTransform:'uppercase', whiteSpace:'nowrap', maxWidth:isMobile?56:64, overflow:'hidden', textOverflow:'ellipsis', textAlign:'center' }}>{a.name}</span>
                </div>
              ))}
            </div>
          </Hl>
        </div>
      </div>

      {/* Filters + list */}
      <div style={{ maxWidth:1100, margin:'0 auto', padding:isMobile?'12px 12px':'16px 24px' }}>
        <div style={{ display:'flex', gap:6, marginBottom:10, flexWrap:'wrap' }}>
          {['All','Alive','Sold','Deceased'].map((f,i)=>(
            <button key={f} style={{ ...S.btn, padding:isMobile?'5px 10px':'6px 14px', fontSize:isMobile?12:13, background:i===0?'#5a3e1b':'#fff', color:i===0?'#fff':'#7a6648', border:'1px solid #d0c4b0' }}>{f}</button>
          ))}
          <button style={{ ...S.btn, background:'#fff', color:'#5a3e1b', border:'1px solid #c8b89a', padding:isMobile?'5px 10px':'6px 14px', fontSize:isMobile?12:13, marginLeft:'auto' }}>☑ Select</button>
        </div>
        <input style={{ ...S.input, marginBottom:12 }} placeholder={`Search ${meta.label.toLowerCase()}…`} readOnly/>
        <Hl id="animal-list" active={highlight==='animal-list'}>
          {animals.map(a=>{
            const st=STATUS_STYLES[a.status]||STATUS_STYLES.alive
            return (
              <div key={a.id} style={{ ...S.card, padding:isMobile?'10px 12px':'14px 18px', marginBottom:8, display:'flex', gap:12, alignItems:'center', cursor:'pointer' }}>
                <div style={{ width:isMobile?44:52, height:isMobile?44:52, borderRadius:'50%', overflow:'hidden', flexShrink:0, border:'2px solid #e8e0d0' }}>
                  <AnimalAvatar animal={a} size={isMobile?44:52}/>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
                    <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:isMobile?14:16, margin:0 }}>{a.name}</p>
                    <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10, background:st.bg, color:st.text, textTransform:'uppercase', flexShrink:0 }}>{a.status}</span>
                  </div>
                  <p style={{ fontSize:11, color:'#a08060', margin:0 }}>{SEX_LABELS[a.sex]||a.sex} · {a.breed} · {calcAge(a.birth_date)}</p>
                </div>
                <span style={{ color:'#c8b89a', fontSize:18 }}>›</span>
              </div>
            )
          })}
        </Hl>
      </div>
    </div>
  )
}

// ─── Detail Screen ────────────────────────────────────────────────────────────
function DetailScreen({ highlight, isMobile }) {
  const a=DEMO_SHEEP[0]
  const events=DEMO_EVENTS.filter(e=>e.animal_id===a.id)
  return (
    <div>
      <div style={{ background:'linear-gradient(160deg,#2c2416 0%,#4a3520 60%,#6b4f2e 100%)', width:'100%' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:isMobile?'14px 14px 20px':'22px 24px 28px' }}>
          <button style={{ ...S.btn, background:'rgba(255,255,255,0.1)', color:'#f0e6cc', border:'1px solid rgba(255,255,255,0.2)', padding:'6px 12px', fontSize:12, marginBottom:14 }}>← Sheep</button>
          <div style={{ display:'flex', gap:isMobile?12:20, alignItems:'flex-start' }}>
            <div style={{ width:isMobile?64:84, height:isMobile?64:84, borderRadius:'50%', overflow:'hidden', border:'3px solid rgba(255,255,255,0.25)', flexShrink:0 }}>
              <AnimalAvatar animal={a} size={isMobile?64:84}/>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?20:28, fontWeight:700, color:'#f0e6cc', margin:0 }}>{a.name}</h1>
                <span style={{ padding:'3px 10px', borderRadius:20, fontSize:10, fontWeight:700, background:'#4caf50', color:'#fff', textTransform:'uppercase' }}>alive</span>
              </div>
              <p style={{ fontSize:12, color:'#c8a878', margin:'0 0 2px', fontStyle:'italic' }}>Merino · Ewe</p>
              <p style={{ fontSize:11, color:'#a08060', margin:'0 0 10px', fontFamily:'monospace' }}>TAG-001</p>
              <div style={{ display:'flex', gap:isMobile?14:24, flexWrap:'wrap' }}>
                {[['Born','03/15/2021'],['Age',calcAge(a.birth_date)],['Sire','Unknown'],['Dam','Unknown']].map(([l,v])=>(
                  <div key={l}>
                    <p style={{ fontSize:9, color:'#7a6040', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 1px' }}>{l}</p>
                    <p style={{ fontSize:isMobile?12:13, color:'#c8a878', margin:0 }}>{v}</p>
                  </div>
                ))}
              </div>
            </div>
            {!isMobile && (
              <div style={{ display:'flex', gap:8 }}>
                <button style={{ ...S.btn, background:'rgba(255,255,255,0.1)', color:'#f0e6cc', border:'1px solid rgba(255,255,255,0.2)', padding:'7px 14px', fontSize:13 }}>Edit</button>
                <button style={{ ...S.btn, background:'rgba(255,80,80,0.15)', color:'#ef9a9a', border:'1px solid rgba(255,80,80,0.25)', padding:'7px 14px', fontSize:13 }}>Delete</button>
              </div>
            )}
          </div>
          {isMobile && (
            <div style={{ display:'flex', gap:8, marginTop:12 }}>
              <button style={{ ...S.btn, flex:1, justifyContent:'center', background:'rgba(255,255,255,0.1)', color:'#f0e6cc', border:'1px solid rgba(255,255,255,0.2)', padding:'10px' }}>✎ Edit</button>
              <button style={{ ...S.btn, flex:1, justifyContent:'center', background:'rgba(255,80,80,0.15)', color:'#ef9a9a', border:'1px solid rgba(255,80,80,0.25)', padding:'10px' }}>🗑 Delete</button>
            </div>
          )}
        </div>
      </div>
      <div style={{ maxWidth:1100, margin:'0 auto', padding:isMobile?'12px 12px':'16px 24px' }}>
        <Hl id="events" active={highlight==='events'} style={{ ...S.card, padding:isMobile?14:22 }}>
          <div style={{ display:'flex', alignItems:'center', marginBottom:14 }}>
            <span style={{ ...S.sectionLabel, margin:0 }}>Event History ({events.length})</span>
            <button style={{ ...S.btn, ...S.btnPrimary, marginLeft:'auto', padding:'6px 12px', fontSize:12 }}>+ Add Event</button>
          </div>
          {events.map(ev=>{
            const ec=EVENT_COLORS[ev.event_type]||EVENT_COLORS.custom
            const label=ev.event_type.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())
            return (
              <div key={ev.id} style={{ display:'flex', gap:10, padding:'10px 12px', borderRadius:8, background:ec.bg, border:'1px solid '+ec.border, marginBottom:6 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3, flexWrap:'wrap' }}>
                    <Badge bg={ec.border} color={ec.text}>{label}</Badge>
                    <span style={{ fontSize:11, color:'#7a6648' }}>{formatDate(ev.event_date)}</span>
                  </div>
                  {ev.notes&&<p style={{ fontSize:12, margin:0, color:'#4a3c28', lineHeight:1.5 }}>{ev.notes}</p>}
                </div>
              </div>
            )
          })}
        </Hl>
      </div>
    </div>
  )
}

// ─── Status Screen ────────────────────────────────────────────────────────────
function StatusScreen({ highlight, isMobile }) {
  const a=DEMO_SHEEP[4]
  const [status,setStatus]=useState('alive')
  return (
    <div>
      <div style={{ background:'linear-gradient(160deg,#2c2416 0%,#4a3520 60%,#6b4f2e 100%)', width:'100%' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:isMobile?'14px 14px 20px':'22px 24px 28px' }}>
          <button style={{ ...S.btn, background:'rgba(255,255,255,0.1)', color:'#f0e6cc', border:'1px solid rgba(255,255,255,0.2)', padding:'6px 12px', fontSize:12, marginBottom:14 }}>← Sheep</button>
          <div style={{ display:'flex', gap:12, alignItems:'center' }}>
            <div style={{ width:60, height:60, borderRadius:'50%', overflow:'hidden', border:'3px solid rgba(255,255,255,0.25)', flexShrink:0 }}>
              <AnimalAvatar animal={a} size={60}/>
            </div>
            <div>
              <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?20:26, fontWeight:700, color:'#f0e6cc', margin:'0 0 3px' }}>{a.name} — Edit</h1>
              <p style={{ fontSize:12, color:'#a08060', margin:0 }}>Merino Wether · TAG-005</p>
            </div>
          </div>
        </div>
      </div>
      <div style={{ maxWidth:1100, margin:'0 auto', padding:isMobile?'12px 12px':'16px 24px' }}>
        <Hl id="status-form" active={highlight==='status-form'} style={{ ...S.card, padding:isMobile?16:24 }}>
          <span style={S.sectionLabel}>Edit Animal</span>
          <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:14, marginBottom:14 }}>
            <div><label style={S.label}>Name</label><input style={S.input} value={a.name} readOnly/></div>
            <div><label style={S.label}>Tag / ID</label><input style={S.input} value={a.tag_number} readOnly/></div>
            <div><label style={S.label}>Breed</label><input style={S.input} value={a.breed} readOnly/></div>
            <div>
              <label style={{ ...S.label, color:highlight==='status-form'?'#c8a060':undefined }}>
                Status {highlight==='status-form'&&'← change this when sold or deceased'}
              </label>
              <select style={{ ...S.input, cursor:'pointer', borderColor:highlight==='status-form'?'#c8a060':'#d0c4b0', background:highlight==='status-form'?'#fdfaf0':'#fdfaf6' }}
                value={status} onChange={e=>setStatus(e.target.value)}>
                <option value="alive">Alive</option>
                <option value="sold">Sold</option>
                <option value="deceased">Deceased</option>
              </select>
            </div>
          </div>
          {status!=='alive'&&(
            <div style={{ marginBottom:14, padding:'10px 14px', borderRadius:8, background:status==='sold'?'#f3e5f5':'#fff3f3', border:`1px solid ${status==='sold'?'#ce93d8':'#f5c6c6'}`, fontSize:13, color:status==='sold'?'#6a1b9a':'#c62828' }}>
              {status==='sold'?'✓ Animal will be marked as Sold':'⚠️ Animal will be marked as Deceased'}
            </div>
          )}
          <div style={{ display:'flex', gap:10 }}>
            <button style={{ ...S.btn, ...S.btnPrimary, flex:isMobile?1:0, justifyContent:'center' }}>Save Changes</button>
            <button style={{ ...S.btn, ...S.btnSecondary }}>Cancel</button>
          </div>
        </Hl>
      </div>
    </div>
  )
}

// ─── P&L Screen ───────────────────────────────────────────────────────────────
function PnLScreen({ highlight, isMobile }) {
  const totalIncome=DEMO_INCOME.reduce((s,i)=>s+i.amount,0)
  const totalExpense=DEMO_COSTS.reduce((s,c)=>s+c.amount,0)
  const net=totalIncome-totalExpense

  // Per-animal P&L tiles matching real app — profitable numbers
  const animalPnL = {
    all:      { emoji:'🌾', label:'All Animals', net: 187, spent: 369, earned: 556 },
    sheep:    { emoji:'🐑', label:'Sheep',       net: 193, spent: 237, earned: 430 },
    chickens: { emoji:'🐔', label:'Chickens',    net:  -6, spent: 132, earned: 126 },
  }

  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:isMobile?'14px 12px':'24px 24px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:8 }}>
        <div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?22:30, fontWeight:700, margin:'0 0 3px' }}>Profit & Loss</h1>
          <p style={{ fontSize:12, color:'#a08060', margin:0 }}>Track what you spend and earn</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button style={{ ...S.btn, background:'#e8f5e9', color:'#2e7d32', border:'1px solid #c8e6c9', fontSize:12 }}>+ Income</button>
          <button style={{ ...S.btn, ...S.btnPrimary, fontSize:12 }}>+ Expense</button>
        </div>
      </div>

      {/* Animal filter tiles — matches real app */}
      <Hl id="pnl-tiles" active={highlight==='pnl-tiles'} style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:14 }}>
        {Object.entries(animalPnL).map(([k,a],i)=>{
          const isActive=i===0
          const netColor=a.net>=0?'#2e7d32':'#c62828'
          const netBg=a.net>=0?'#e8f5e9':'#fff3f3'
          return (
            <div key={k} style={{ ...S.card, padding:isMobile?'10px 8px':'14px 10px', cursor:'pointer', textAlign:'center', border:isActive?`2px solid ${netColor}`:'1px solid #e8e0d0', background:isActive?netBg:'#fff' }}>
              <div style={{ fontSize:isMobile?18:22, marginBottom:3 }}>{a.emoji}</div>
              <div style={{ fontSize:9, color:'#a08060', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:4 }}>{a.label}</div>
              <div style={{ fontSize:isMobile?13:16, fontWeight:700, color:netColor, fontFamily:"'Playfair Display',serif" }}>{(a.net>=0?'+':'')+fmt(a.net)}</div>
              {!isMobile && (
                <div style={{ fontSize:10, color:'#a08060', marginTop:3, display:'flex', justifyContent:'center', gap:4 }}>
                  <span style={{ color:'#2e7d32', fontWeight:600 }}>+{fmt(a.earned)}</span>
                  <span style={{ color:'#bbb' }}>·</span>
                  <span style={{ color:'#c62828', fontWeight:600 }}>-{fmt(a.spent)}</span>
                </div>
              )}
            </div>
          )
        })}
      </Hl>

      {/* Tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:14, alignItems:'center', flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:6 }}>
          {['Overview','Income','Expenses'].map((t,i)=>(
            <button key={t} style={{ ...S.btn, padding:'7px 16px', fontSize:13, background:i===0?'#5a3e1b':'#fff', color:i===0?'#fff':'#7a6648', border:'1px solid #d0c4b0' }}>{t}</button>
          ))}
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:14, alignItems:'center' }}>
          <div style={{ textAlign:'center' }}><p style={{ fontSize:10, color:'#2e7d32', fontWeight:700, textTransform:'uppercase', margin:'0 0 1px' }}>In</p><p style={{ fontSize:16, fontWeight:700, color:'#2e7d32', margin:0 }}>+{fmt(totalIncome)}</p></div>
          <div style={{ textAlign:'center' }}><p style={{ fontSize:10, color:'#c62828', fontWeight:700, textTransform:'uppercase', margin:'0 0 1px' }}>Out</p><p style={{ fontSize:16, fontWeight:700, color:'#c62828', margin:0 }}>-{fmt(totalExpense)}</p></div>
          <div style={{ textAlign:'center', borderLeft:'1px solid #e8e0d0', paddingLeft:14 }}><p style={{ fontSize:10, color:'#a08060', fontWeight:700, textTransform:'uppercase', margin:'0 0 1px' }}>Net</p><p style={{ fontSize:18, fontWeight:700, color:'#2e7d32', fontFamily:"'Playfair Display',serif", margin:0 }}>+{fmt(net)}</p></div>
        </div>
      </div>

      {/* Income entries */}
      <Hl id="pnl-income" active={highlight==='pnl-income'} style={{ ...S.card, padding:isMobile?12:18, marginBottom:10 }}>
        <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:14, margin:'0 0 10px' }}>May 2025</p>
        {DEMO_INCOME.slice(0,4).map(i=>(
          <div key={i.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:8, background:'#f1f8f1', marginBottom:6 }}>
            <span style={{ fontSize:16 }}>{ANIMAL_META[i.species]?.emoji}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:13, fontWeight:600, margin:'0 0 1px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{i.description}</p>
              <p style={{ fontSize:11, color:'#a08060', margin:0 }}>{i.income_type.replace(/_/g,' ')}{i.customer?.name?' · 👤 '+i.customer.name:''} · {formatDate(i.date)}</p>
            </div>
            <span style={{ fontWeight:700, fontSize:13, color:'#2e7d32', flexShrink:0 }}>+{fmt(i.amount)}</span>
          </div>
        ))}
      </Hl>
    </div>
  )
}

// ─── Dashboard — shared sub-components ───────────────────────────────────────
function MiniDonut({ segments, size=100 }) {
  const total=segments.reduce((s,sg)=>s+sg.value,0)
  if(!total) return null
  const cx=size/2,cy=size/2,r=size*0.42,hole=size*0.27
  if(segments.filter(s=>s.value>0).length===1){
    const sg=segments.find(s=>s.value>0)
    return(<svg width={size} height={size}><circle cx={cx} cy={cy} r={r} fill={sg.color} opacity={0.9}/><circle cx={cx} cy={cy} r={hole} fill="#fff"/></svg>)
  }
  let angle=-90
  const paths=segments.filter(s=>s.value>0).map(sg=>{
    const pct=sg.value/total,start=angle,end=angle+pct*360;angle=end
    const sR=(start*Math.PI)/180,eR=(end*Math.PI)/180,large=end-start>180?1:0
    const x1=cx+r*Math.cos(sR),y1=cy+r*Math.sin(sR),x2=cx+r*Math.cos(eR),y2=cy+r*Math.sin(eR)
    return{...sg,d:`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`}
  })
  return(<svg width={size} height={size}>{paths.map((p,i)=><path key={i} d={p.d} fill={p.color} opacity={0.9}/>)}<circle cx={cx} cy={cy} r={hole} fill="#fff"/></svg>)
}

function DonutRow({ segments, size=90, isMobile }) {
  const s=isMobile?Math.min(size,72):size
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <MiniDonut segments={segments} size={s}/>
      <div>{segments.filter(sg=>sg.value>0).map((sg,i)=>(
        <div key={i} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:sg.color, flexShrink:0 }}/>
          <span style={{ fontSize:isMobile?10:11, color:'#4a3c28', fontWeight:600, flex:1 }}>{sg.label}</span>
          <span style={{ fontSize:isMobile?10:11, fontWeight:700 }}>{sg.value}</span>
        </div>
      ))}</div>
    </div>
  )
}

// ─── Dashboard Bar screen ─────────────────────────────────────────────────────
function DashBarScreen({ highlight, isMobile }) {
  const totalIncome=DEMO_INCOME.reduce((s,i)=>s+i.amount,0)
  const totalExpense=DEMO_COSTS.reduce((s,c)=>s+c.amount,0)
  const months=['Jan','Feb','Mar','Apr'],inc=[20,205,120,30],exp=[220,192,285,80],maxV=300
  const chartH=isMobile?90:130,barW=isMobile?14:22,gap=6,groupW=barW*2+gap,padL=36,padT=8
  const totalW=padL+months.length*(groupW+14)+12
  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:isMobile?'14px 12px':'24px 24px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:8 }}>
        <div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?22:30, fontWeight:700, margin:'0 0 3px' }}>📊 Dashboard</h1>
          <p style={{ fontSize:12, color:'#a08060', margin:0 }}>Farm overview and analytics</p>
        </div>
        <div style={{ display:'flex', background:'#f0e8d8', borderRadius:10, padding:3, gap:2 }}>
          {['💰 P&L','🐾 Animals','👥 Customers'].map((t,i)=>(
            <button key={t} style={{ ...S.btn, padding:isMobile?'5px 8px':'6px 12px', fontSize:isMobile?10:12, borderRadius:8, background:i===0?'#5a3e1b':'transparent', color:i===0?'#fff':'#7a6648', border:'none' }}>{t}</button>
          ))}
        </div>
      </div>
      {/* Filter tabs — at top matching real app */}
      <Hl id="dash-filter" active={highlight==='dash-filter'} style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
        {[['all','🌾 All',true],['sheep','🐑 Sheep',false],['chickens','🐔 Chickens',false]].map(([k,l,active])=>(
          <button key={k} style={{ ...S.btn, padding:'7px 16px', fontSize:13, background:active?'#5a3e1b':'#fff', color:active?'#fff':'#7a6648', border:'1px solid #d0c4b0' }}>{l}</button>
        ))}
      </Hl>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:14 }}>
        {[{l:'Income',v:'+'+fmt(totalIncome),c:'#2e7d32',bg:'#f1f8f1'},{l:'Expenses',v:'-'+fmt(totalExpense),c:'#c62828',bg:'#fff3f3'},{l:'Net P&L',v:'+'+fmt(totalIncome-totalExpense),c:'#2e7d32',bg:'#e8f5e9'}].map(s=>(
          <div key={s.l} style={{ ...S.card, padding:isMobile?'10px 8px':'14px 12px', textAlign:'center', background:s.bg }}>
            <div style={{ fontSize:isMobile?13:18, fontWeight:700, color:s.c, fontFamily:"'Playfair Display',serif" }}>{s.v}</div>
            <div style={{ fontSize:8, color:'#a08060', fontWeight:700, textTransform:'uppercase', marginTop:2 }}>{s.l}</div>
          </div>
        ))}
      </div>
      {/* Bar chart */}
      <Hl id="dash-bar" active={highlight==='dash-bar'} style={{ ...S.card, padding:isMobile?12:20, marginBottom:12 }}>
        <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:isMobile?13:15, margin:'0 0 10px' }}>Income vs Expenses by Month</p>
        <svg width="100%" viewBox={`0 0 ${totalW} ${chartH+36}`} style={{ display:'block' }}>
          {months.map((mo,i)=>{
            const x=padL+i*(groupW+14),incH=Math.max((inc[i]/maxV)*chartH,2),expH=Math.max((exp[i]/maxV)*chartH,2)
            return(<g key={mo}><rect x={x} y={padT+chartH-incH} width={barW} height={incH} fill="#4caf50" rx={3} opacity={0.85}/><rect x={x+barW+gap} y={padT+chartH-expH} width={barW} height={expH} fill="#c62828" rx={3} opacity={0.75}/><text x={x+barW+gap/2} y={padT+chartH+14} textAnchor="middle" fontSize={isMobile?9:11} fill="#7a6648" fontWeight={600}>{mo}</text></g>)
          })}
          <line x1={padL} x2={totalW-8} y1={padT+chartH} y2={padT+chartH} stroke="#e8e0d0" strokeWidth={1.5}/>
        </svg>
        <div style={{ display:'flex', gap:16, marginTop:8 }}>
          {[['#4caf50','Income'],['#c62828','Expenses']].map(([c,l])=>(
            <div key={l} style={{ display:'flex', alignItems:'center', gap:5 }}><div style={{ width:10, height:10, borderRadius:2, background:c }}/><span style={{ fontSize:11, color:'#4a3c28', fontWeight:600 }}>{l}</span></div>
          ))}
        </div>
      </Hl>
    </div>
  )
}

// ─── Dashboard Animals screen ─────────────────────────────────────────────────
function DashAnimalsScreen({ highlight, isMobile }) {
  const sheepBySex={};DEMO_SHEEP.forEach(a=>{sheepBySex[a.sex]=(sheepBySex[a.sex]||0)+1})
  const sheepByStatus={};DEMO_SHEEP.forEach(a=>{sheepByStatus[a.status]=(sheepByStatus[a.status]||0)+1})
  const breedCount={};DEMO_CHICKENS.forEach(c=>{breedCount[c.breed]=(breedCount[c.breed]||0)+1})
  const chickenBySex={};DEMO_CHICKENS.forEach(c=>{chickenBySex[c.sex]=(chickenBySex[c.sex]||0)+1})
  const sexSegs=Object.entries(sheepBySex).map(([k,v])=>({label:k.charAt(0).toUpperCase()+k.slice(1),value:v,color:k==='ram'?'#5d4037':k==='ewe'?'#a1887f':'#d7ccc8'}))
  const stSegs=Object.entries(sheepByStatus).map(([k,v])=>({label:k.charAt(0).toUpperCase()+k.slice(1),value:v,color:k==='alive'?'#4caf50':k==='sold'?'#9c27b0':'#9e9e9e'}))
  const breedSegs=Object.entries(breedCount).map(([k,v],i)=>({label:k.length>14?k.slice(0,13)+'…':k,value:v,color:['#f57f17','#e65100','#ff8f00'][i%3]}))
  const cSexSegs=Object.entries(chickenBySex).map(([k,v])=>({label:k.charAt(0).toUpperCase()+k.slice(1),value:v,color:k==='hen'?'#f9a825':k==='rooster'?'#c62828':'#ffcc80'}))
  const cols2={display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:10}
  const card={...S.card,padding:isMobile?12:18,marginBottom:10}
  const title={fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:isMobile?13:14,margin:'0 0 10px'}
  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:isMobile?'14px 12px':'24px 24px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:8 }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?22:30, fontWeight:700, margin:0 }}>📊 Dashboard — Animals</h1>
        <div style={{ display:'flex', background:'#f0e8d8', borderRadius:10, padding:3, gap:2 }}>
          {['💰 P&L','🐾 Animals','👥 Customers'].map((t,i)=>(
            <button key={t} style={{ ...S.btn, padding:isMobile?'5px 8px':'6px 12px', fontSize:isMobile?10:12, borderRadius:8, background:i===1?'#5a3e1b':'transparent', color:i===1?'#fff':'#7a6648', border:'none' }}>{t}</button>
          ))}
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:14 }}>
        {[{l:'Sheep',v:DEMO_SHEEP.length,e:'🐑'},{l:'Chickens',v:DEMO_CHICKENS.length,e:'🐔'},{l:'Total',v:DEMO_SHEEP.length+DEMO_CHICKENS.length,e:'🐾'}].map(s=>(
          <div key={s.l} style={{ ...S.card, padding:isMobile?'10px 8px':'14px 12px', textAlign:'center' }}>
            <div style={{ fontSize:isMobile?20:26, marginBottom:3 }}>{s.e}</div>
            <div style={{ fontSize:isMobile?16:22, fontWeight:700, fontFamily:"'Playfair Display',serif" }}>{s.v}</div>
            <div style={{ fontSize:9, color:'#a08060', fontWeight:700, textTransform:'uppercase', marginTop:2 }}>{s.l}</div>
          </div>
        ))}
      </div>
      <Hl id="dash-sheep" active={highlight==='dash-sheep'}>
        <p style={{ fontSize:10, fontWeight:700, color:'#a08060', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 8px' }}>🐑 Sheep Breakdown</p>
        <div style={cols2}>
          <div style={card}><p style={title}>By Sex</p><DonutRow segments={sexSegs} isMobile={isMobile}/></div>
          <div style={card}><p style={title}>By Status</p><DonutRow segments={stSegs} isMobile={isMobile}/></div>
        </div>
      </Hl>
      <Hl id="dash-chickens" active={highlight==='dash-chickens'}>
        <p style={{ fontSize:10, fontWeight:700, color:'#a08060', textTransform:'uppercase', letterSpacing:'0.08em', margin:'10px 0 8px' }}>🐔 Chicken Breakdown</p>
        <div style={cols2}>
          <div style={card}><p style={title}>By Sex</p><DonutRow segments={cSexSegs} isMobile={isMobile}/></div>
          <div style={card}><p style={title}>By Breed</p><DonutRow segments={breedSegs} isMobile={isMobile}/></div>
        </div>
      </Hl>
    </div>
  )
}

// ─── Dashboard Customers screen ───────────────────────────────────────────────
function DashCustomersScreen({ highlight, isMobile }) {
  const totalIncome=DEMO_INCOME.reduce((s,i)=>s+i.amount,0)
  const custColors=['#5a3e1b','#795548','#a1887f']
  const custStats=DEMO_CUSTOMERS.map((c,i)=>({...c,spent:DEMO_INCOME.filter(inc=>inc.customer_id===c.id).reduce((s,inc)=>s+inc.amount,0),eggs:DEMO_INCOME.filter(inc=>inc.customer_id===c.id&&inc.income_type==='sale_eggs').reduce((s,inc)=>s+(inc.quantity||0),0),color:custColors[i]}))
  const custSegs=custStats.map(c=>({label:c.name.split(' ')[0],value:c.spent,color:c.color}))
  const untagged=DEMO_INCOME.filter(i=>!i.customer_id).reduce((s,i)=>s+i.amount,0)
  if(untagged>0) custSegs.push({label:'Untagged',value:untagged,color:'#e0e0e0'})
  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:isMobile?'14px 12px':'24px 24px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:8 }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?22:30, fontWeight:700, margin:0 }}>📊 Dashboard — Customers</h1>
        <div style={{ display:'flex', background:'#f0e8d8', borderRadius:10, padding:3, gap:2 }}>
          {['💰 P&L','🐾 Animals','👥 Customers'].map((t,i)=>(
            <button key={t} style={{ ...S.btn, padding:isMobile?'5px 8px':'6px 12px', fontSize:isMobile?10:12, borderRadius:8, background:i===2?'#5a3e1b':'transparent', color:i===2?'#fff':'#7a6648', border:'none' }}>{t}</button>
          ))}
        </div>
      </div>
      <div style={{ ...S.card, padding:isMobile?12:18, marginBottom:12, background:'#f1f8f1', display:'flex', gap:16, alignItems:'center', flexWrap:'wrap' }}>
        <div>
          <p style={{ fontSize:10, color:'#a08060', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 2px' }}>Total Customer Revenue</p>
          <p style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?22:28, fontWeight:700, color:'#2e7d32', margin:0 }}>{fmt(custStats.reduce((s,c)=>s+c.spent,0))}</p>
        </div>
        <div style={{ marginLeft:isMobile?0:'auto' }}>
          <p style={{ fontSize:10, color:'#a08060', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 2px' }}>Active Customers</p>
          <p style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?22:28, fontWeight:700, margin:0 }}>{custStats.filter(c=>c.spent>0).length}</p>
        </div>
      </div>
      <Hl id="dash-customers" active={highlight==='dash-customers'} style={{ ...S.card, padding:isMobile?14:22 }}>
        <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:isMobile?14:16, margin:'0 0 14px' }}>👥 Revenue by Customer</p>
        <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap', marginBottom:16 }}>
          <MiniDonut segments={custSegs} size={isMobile?90:110}/>
          <div style={{ flex:1, minWidth:140 }}>
            {custSegs.map((c,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:c.color }}/>
                <span style={{ fontSize:12, fontWeight:600, flex:1, color:'#4a3c28' }}>{c.label}</span>
                <span style={{ fontSize:12, fontWeight:700, color:'#2e7d32' }}>{fmt(c.value)}</span>
              </div>
            ))}
          </div>
        </div>
        {custStats.filter(c=>c.spent>0).map((c,i)=>(
          <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:isMobile?'10px 12px':'12px 16px', borderRadius:10, background:'#fdfaf6', border:'1px solid #e8e0d0', marginBottom:8 }}>
            <div style={{ width:36, height:36, borderRadius:'50%', background:c.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'#fff', flexShrink:0 }}>{c.name[0]}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:14, margin:'0 0 1px' }}>{c.name}</p>
              <p style={{ fontSize:11, color:'#a08060', margin:0 }}>{c.eggs>0?`🥚 ${c.eggs} dozen${c.eggs!==1?'s':''} bought · `:''}{c.notes}</p>
            </div>
            <div style={{ textAlign:'right', flexShrink:0 }}>
              <p style={{ fontSize:16, fontWeight:700, color:'#2e7d32', margin:0, fontFamily:"'Playfair Display',serif" }}>{fmt(c.spent)}</p>
              <p style={{ fontSize:10, color:'#a08060', margin:0 }}>total spent</p>
            </div>
          </div>
        ))}
      </Hl>
    </div>
  )
}

// ─── Bulk Add Screen ──────────────────────────────────────────────────────────
function BulkScreen({ highlight, isMobile }) {
  const rows=[{name:'Spring Lamb 1',tag:'TAG-010',sex:'Ewe (Female)',dob:'2025-04-01'},{name:'Spring Lamb 2',tag:'TAG-011',sex:'Ram (Male)',dob:'2025-04-01'},{name:'Spring Lamb 3',tag:'TAG-012',sex:'Ewe (Female)',dob:'2025-04-02'},{name:'',tag:'',sex:'Ewe (Female)',dob:''},{name:'',tag:'',sex:'Ewe (Female)',dob:''}]
  const inp={padding:'7px 10px',borderRadius:6,border:'1px solid #d0c4b0',background:'#fdfaf6',fontSize:isMobile?13:14,color:'#2c2416',width:'100%',boxSizing:'border-box'}
  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:isMobile?'14px 12px':'24px 24px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <button style={{ ...S.btn, ...S.btnSecondary, padding:'7px 14px' }}>← Sheep</button>
        <div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?20:26, fontWeight:700, margin:'0 0 2px' }}>⚡ Bulk Add Sheep</h1>
          <p style={{ fontSize:12, color:'#a08060', margin:0 }}>Only Name is required. Blank rows are skipped.</p>
        </div>
        <button style={{ ...S.btn, ...S.btnPrimary, marginLeft:'auto', padding:'9px 20px' }}>Save 3 Sheep</button>
      </div>
      <Hl id="bulk-rows" active={highlight==='bulk-rows'} style={{ ...S.card, overflow:'hidden' }}>
        <div style={{ display:'flex', gap:8, padding:isMobile?'10px 12px':'12px 16px', borderBottom:'2px solid #e8e0d0', background:'#fdfaf6' }}>
          {(isMobile?['Name *','Sex','Date']:['Name *','Tag / ID','Sex','Date of Birth','Notes']).map((h,i)=>(
            <div key={h} style={{ flex:i===0?2:1, fontSize:10, fontWeight:700, color:'#a08060', textTransform:'uppercase', letterSpacing:'0.06em', minWidth:0 }}>{h}</div>
          ))}
          <div style={{ width:24 }}/>
        </div>
        {rows.map((row,idx)=>(
          <div key={idx} style={{ display:'flex', gap:8, padding:isMobile?'8px 12px':'9px 16px', borderBottom:'1px solid #f7f4ef', alignItems:'center', background:idx%2===0?'#fff':'#fdfaf6' }}>
            <div style={{ flex:2, minWidth:0 }}><input style={{ ...inp, borderColor:row.name?'#a5d6a7':'#d0c4b0' }} defaultValue={row.name} placeholder="Sheep name"/></div>
            {!isMobile&&<div style={{ flex:1, minWidth:0 }}><input style={inp} defaultValue={row.tag} placeholder="Optional"/></div>}
            <div style={{ flex:1, minWidth:0 }}><input style={inp} defaultValue={row.sex}/></div>
            <div style={{ flex:1, minWidth:0 }}><input style={inp} defaultValue={row.dob} placeholder="mm/dd/yyyy"/></div>
            {!isMobile&&<div style={{ flex:1, minWidth:0 }}><input style={inp} placeholder="Notes"/></div>}
            <div style={{ width:24, textAlign:'center', color:'#c0a080', fontSize:18, cursor:'pointer' }}>×</div>
          </div>
        ))}
        <div style={{ padding:isMobile?'10px 12px':'12px 16px', borderTop:'1px solid #e8e0d0', display:'flex', alignItems:'center', gap:12, background:'#fdfaf6', flexWrap:'wrap' }}>
          <button style={{ ...S.btn, ...S.btnSecondary, padding:'6px 14px', fontSize:13 }}>+ Add Row</button>
          <span style={{ fontSize:12, color:'#a08060' }}>3 of 5 rows filled</span>
          <button style={{ ...S.btn, ...S.btnPrimary, marginLeft:'auto' }}>Save 3 Sheep</button>
        </div>
      </Hl>
      <p style={{ fontSize:12, color:'#c8b89a', marginTop:10, textAlign:'center' }}>Tip: Press Tab to move between fields quickly.</p>
    </div>
  )
}

// ─── Bulk Event Screen ────────────────────────────────────────────────────────
function BulkEventScreen({ highlight, isMobile }) {
  const eventTypes = ['Hoof Trimming','Vaccination','Worming','Shearing','Custom']
  const allAnimals = [...DEMO_SHEEP, ...DEMO_CHICKENS.slice(0,5)]
  const selectedIds = ['s1','s2','s3','s4','s5'] // 5 of 10 selected

  return (
    <div>
      <div style={{ background:'linear-gradient(160deg,#2c2416 0%,#4a3520 40%,#6b4f2e 100%)', width:'100%' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:isMobile?'16px 14px 20px':'28px 24px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
            <div style={{ background:'rgba(200,160,96,0.2)', border:'1px solid rgba(200,160,96,0.4)', borderRadius:8, padding:'6px 12px', fontSize:13, fontWeight:700, color:'#c8a060' }}>
              5 of 10 selected
            </div>
            <span style={{ fontSize:13, color:'#a08060' }}>— select 1, a few, or all</span>
            <button style={{ ...S.btn, background:'rgba(255,255,255,0.1)', color:'#ef9a9a', border:'1px solid rgba(255,80,80,0.3)', padding:'5px 10px', fontSize:12, marginLeft:'auto' }}>✕ Cancel</button>
          </div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?22:28, fontWeight:700, color:'#f0e6cc', margin:'0 0 4px' }}>⚡ Bulk Add Event</h1>
          <p style={{ fontSize:12, color:'#a08060', margin:0 }}>Logging for: <strong style={{ color:'#c8a878' }}>Bella, Duke, Rosie, Clover, Biscuit</strong></p>
        </div>
      </div>
      <div style={{ maxWidth:1100, margin:'0 auto', padding:isMobile?'12px 12px':'16px 24px' }}>

        {/* Animal selection grid */}
        <div style={{ marginBottom:16 }}>
          <p style={{ fontSize:11, fontWeight:700, color:'#a08060', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 8px' }}>Tap to select / deselect</p>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {[...DEMO_SHEEP, ...DEMO_CHICKENS.slice(0,5)].map(a=>{
              const isSel = selectedIds.includes(a.id)
              const st = STATUS_STYLES[a.status]||STATUS_STYLES.alive
              return (
                <div key={a.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:isSel?'#2c2416':'#fff', borderRadius:8, border:isSel?'2px solid #c8a060':'1px solid #e8e0d0', cursor:'pointer', transition:'all 0.15s' }}>
                  <div style={{ width:28, height:28, borderRadius:'50%', overflow:'hidden', flexShrink:0, border:`2px solid ${isSel?'#c8a060':'#e8e0d0'}` }}>
                    <AnimalAvatar animal={a} size={28}/>
                  </div>
                  <span style={{ fontSize:13, fontWeight:600, color:isSel?'#f0e6cc':'#2c2416', whiteSpace:'nowrap' }}>{a.name}</span>
                  {isSel && <span style={{ fontSize:12, color:'#c8a060' }}>✓</span>}
                </div>
              )
            })}
          </div>
        </div>

        <Hl id="bulk-event" active={highlight==='bulk-event'} style={{ ...S.card, padding:isMobile?16:24 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:8 }}>
            <span style={S.sectionLabel}>Log Event for 5 Animals</span>
            <div style={{ display:'flex', gap:8 }}>
              <button style={{ ...S.btn, ...S.btnSecondary, padding:'5px 10px', fontSize:12 }}>Select All 10</button>
              <button style={{ ...S.btn, background:'#f0e8d8', color:'#5a3e1b', border:'1px solid #d0c4b0', padding:'5px 10px', fontSize:12 }}>Clear</button>
            </div>
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={S.label}>Event Type</label>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {eventTypes.map((t,i)=>(
                <button key={t} style={{ ...S.btn, padding:'8px 14px', fontSize:13, background:i===0?'#5a3e1b':'#fff', color:i===0?'#fff':'#7a6648', border:i===0?'none':'1px solid #d0c4b0' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:14, marginBottom:14 }}>
            <div>
              <label style={S.label}>Date</label>
              <input style={S.input} value="05/09/2025" readOnly/>
            </div>
            <div>
              <label style={S.label}>Notes</label>
              <input style={S.input} placeholder="e.g. All trimmed, no issues" readOnly/>
            </div>
          </div>
          <div style={{ background:'#fff9e6', border:'1px solid #ffe082', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#f57f17' }}>
            ✓ This event will be logged for <strong>5 sheep</strong> at once — the other 5 are unaffected.
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button style={{ ...S.btn, ...S.btnPrimary, flex:isMobile?1:0, justifyContent:'center', padding:'10px 24px' }}>Save for 5 Animals</button>
            <button style={{ ...S.btn, ...S.btnSecondary }}>Cancel</button>
          </div>
        </Hl>
      </div>
    </div>
  )
}

// ─── Tour Tooltip ─────────────────────────────────────────────────────────────
function TourTooltip({ step, stepIndex, total, onNext, onSkip, isMobile }) {
  const isLast=!!step.isLast
  return (
    <div style={{ position:'fixed', bottom:isMobile?82:28, left:'50%', transform:'translateX(-50%)', width:isMobile?'calc(100% - 24px)':'500px', maxWidth:'95vw', background:'#2c2416', borderRadius:14, padding:'18px 20px', boxShadow:'0 8px 40px rgba(0,0,0,0.45)', zIndex:1000, border:'1px solid rgba(255,255,255,0.1)' }}>
      <div style={{ display:'flex', gap:4, marginBottom:12 }}>
        {Array.from({length:total},(_,i)=>(
          <div key={i} style={{ height:3, borderRadius:2, flex:1, background:i<=stepIndex?'#c8a060':'rgba(255,255,255,0.15)', transition:'background 0.3s' }}/>
        ))}
      </div>
      <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, color:'#f0e6cc', margin:'0 0 6px' }}>{step.title}</h3>
      <p style={{ fontSize:13, color:'#c8b89a', margin:'0 0 16px', lineHeight:1.6 }}>{step.body}</p>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        {!isLast&&(
          <button onClick={onSkip} style={{ background:'none', border:'1px solid rgba(255,255,255,0.15)', color:'#a08060', cursor:'pointer', fontSize:12, fontFamily:"'Lato',sans-serif", borderRadius:6, padding:'6px 12px' }}>
            Skip Tour
          </button>
        )}
        <button onClick={onNext} style={{ ...S.btn, marginLeft:'auto', background:isLast?'#4caf50':'#c8a060', color:isLast?'#fff':'#2c2416', fontWeight:700, padding:'10px 24px', fontSize:14 }}>
          {isLast?'🌾 Create Free Account':'Next →'}
        </button>
      </div>
    </div>
  )
}

// ─── Main Demo Page ───────────────────────────────────────────────────────────
export function DemoPage() {
  const navigate  = useNavigate()
  const isMobile  = useIsMobile()
  const [stepIndex, setStepIndex] = useState(0)
  const step = STEPS[stepIndex]

  const handleNext = () => {
    if (step.isLast) navigate('/')
    else setStepIndex(i=>i+1)
  }
  const handleSkip = () => navigate('/')

  useEffect(() => {
    window.scrollTo({ top:0, behavior:'instant' })
    if (step.scrollTo) {
      const timer = setTimeout(() => {
        const el = document.getElementById(step.scrollTo)
        if (el) el.scrollIntoView({ behavior:'smooth', block:'center' })
      }, 350)
      return () => clearTimeout(timer)
    }
  }, [stepIndex])

  const screenMap = {
    sheep:          <AnimalListScreen   highlight={step.scrollTo} isMobile={isMobile} species="sheep"/>,
    chickens:       <AnimalListScreen   highlight={step.scrollTo} isMobile={isMobile} species="chickens"/>,
    detail:         <DetailScreen       highlight={step.scrollTo} isMobile={isMobile}/>,
    status:         <StatusScreen       highlight={step.scrollTo} isMobile={isMobile}/>,
    bulk_event:     <BulkEventScreen    highlight={step.scrollTo} isMobile={isMobile}/>,
    pnl:            <PnLScreen          highlight={step.scrollTo} isMobile={isMobile}/>,
    dash_bar:       <DashBarScreen      highlight={step.scrollTo} isMobile={isMobile}/>,
    dash_animals:   <DashAnimalsScreen  highlight={step.scrollTo} isMobile={isMobile}/>,
    dash_customers: <DashCustomersScreen highlight={step.scrollTo} isMobile={isMobile}/>,
    bulk:           <BulkScreen         highlight={step.scrollTo} isMobile={isMobile}/>,
  }

  return (
    <div style={{ minHeight:'100vh', background:'#f7f4ef', fontFamily:"'Lato',sans-serif", color:'#2c2416', paddingBottom:isMobile?200:160 }}>
      {/* Demo banner — sticky */}
      <div style={{ background:'#5a3e1b', padding:'8px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:200 }}>
        <span style={{ fontSize:isMobile?11:12, fontWeight:700, color:'#c8a060', textTransform:'uppercase', letterSpacing:'0.06em' }}>🌾 FarmHand — Interactive Demo</span>
        <button onClick={handleSkip} style={{ background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', color:'#f0e6cc', borderRadius:6, padding:'5px 14px', cursor:'pointer', fontSize:12, fontFamily:"'Lato',sans-serif", fontWeight:600 }}>
          Exit Demo
        </button>
      </div>

      <FakeNav screen={step.screen} isMobile={isMobile}/>

      {screenMap[step.screen] || screenMap.sheep}

      <TourTooltip step={step} stepIndex={stepIndex} total={STEPS.length} onNext={handleNext} onSkip={handleSkip} isMobile={isMobile}/>

      {/* Dim overlay when highlighting */}
      {step.scrollTo && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.2)', pointerEvents:'none', zIndex:500 }}/>
      )}
    </div>
  )
}
