import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useIsMobile } from '../../hooks/useIsMobile'
import { calcAge, formatDate, fmt, STATUS_STYLES, STATUS_DOT, Badge, S, EVENT_COLORS } from '../ui/shared'
import { DEMO_SHEEP, DEMO_CHICKENS, DEMO_EVENTS, DEMO_COSTS, DEMO_INCOME, DEMO_CUSTOMERS } from './demoData'

function SheepSVG({ sex='ewe', size=52 }) {
  const wool='#e8ddd0', face='#c8a87a', isRam=sex==='ram'
  return (
    <svg viewBox="0 0 72 72" width={size} height={size}>
      <ellipse cx="36" cy="46" rx="22" ry="16" fill={wool}/>
      <circle cx="20" cy="44" r="10" fill={wool}/><circle cx="52" cy="44" r="10" fill={wool}/>
      <circle cx="26" cy="38" r="11" fill={wool}/><circle cx="46" cy="38" r="11" fill={wool}/>
      <circle cx="36" cy="36" r="12" fill={wool}/>
      <rect x="24" y="58" width="5" height="10" rx="2" fill={face}/><rect x="43" y="58" width="5" height="10" rx="2" fill={face}/>
      <ellipse cx="36" cy="22" rx="11" ry="10" fill={face}/>
      {isRam?<><path d="M25 20 Q18 14 20 22" stroke={face} strokeWidth="4" strokeLinecap="round" fill="none"/><path d="M47 20 Q54 14 52 22" stroke={face} strokeWidth="4" strokeLinecap="round" fill="none"/></>:<><ellipse cx="23" cy="17" rx="4" ry="6" fill={face} transform="rotate(-20 23 17)"/><ellipse cx="49" cy="17" rx="4" ry="6" fill={face} transform="rotate(20 49 17)"/></>}
      <circle cx="31" cy="20" r="2.5" fill="#2c2416"/><circle cx="41" cy="20" r="2.5" fill="#2c2416"/>
      <circle cx="31.8" cy="19.2" r="0.8" fill="#fff"/><circle cx="41.8" cy="19.2" r="0.8" fill="#fff"/>
    </svg>
  )
}

function Avatar({ animal, size=56 }) {
  const [err, setErr] = useState(false)
  if (!animal) return <div style={{ width:size,height:size,borderRadius:'50%',background:'#f0ebe4',display:'flex',alignItems:'center',justifyContent:'center' }}><SheepSVG size={size}/></div>
  const isChicken = animal.species==='chickens'
  return (
    <div style={{ width:size,height:size,borderRadius:'50%',overflow:'hidden',background:isChicken?'#fff9e6':'#f0ebe4',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center' }}>
      {animal.photo_url&&!err
        ?<img src={animal.photo_url} alt={animal.name} style={{ width:'100%',height:'100%',objectFit:'cover' }} onError={()=>setErr(true)}/>
        :isChicken?<span style={{ fontSize:size*0.55 }}>🐔</span>:<SheepSVG sex={animal.sex} size={size*0.9}/>
      }
    </div>
  )
}

function buildSteps(species) {
  const isSheep=species==='sheep', label=isSheep?'flock':'chickens'
  return [
    { screen:'flock',   scrollTo:null,              tip:`Welcome to FarmHand. This is your ${label} — every animal you raise, in one place.` },
    { screen:'flock',   scrollTo:'your-animal',     tip:`That's {name} at the top. Photo, status, breed, and age — all at a glance.` },
    { screen:'profile', scrollTo:null,              tip:`{name}'s full profile — age, breed, tag, and ${isSheep?'health events':'egg history'}. Everything in one place.` },
    { screen:'profile', scrollTo:'events',          tip:`Every event logged here with dates and notes. ${isSheep?'Vaccinations, lambing, shearing':'Egg production, illness, moulting'} — all searchable.` },
    { screen:'event',   scrollTo:'event-form',      tip:`Log an event for {name} — pick what happened, add a note, save it.`, eventTypes:isSheep?['vaccination','worming','hoof_trimming','shearing','sickness','lambing']:['vaccination','egg_production','moulting','sickness','custom'] },
    { screen:'bulk',    scrollTo:'bulk-chips',      tip:`${isSheep?'Trimmed hooves on a few today?':'Wormed the whole flock?'} Tap which ones — log it once for all of them.` },
    { screen:'bulk',    scrollTo:'bulk-save',       tip:`One save, logged on every selected animal. Whether it's 2 or 20.` },
    { screen:'pnl',     scrollTo:'pnl-top',         tip:`Every dollar tracked as you go. No spreadsheet — just log it and the P&L updates instantly.` },
    { screen:'dash1',   scrollTo:'dash-chart',      tip:`The dashboard shows income vs expenses month by month. See your trends before they become problems.` },
    { screen:'dash2',   scrollTo:'dash-animals',    tip:`See your ${isSheep?'sheep':'chickens'} broken down by sex, status, and ${isSheep?'breed — how many ewes vs rams, alive vs sold':'breed — hens vs roosters, how the flock is composed'}.` },
    { screen:'dash3',   scrollTo:'dash-donuts',     tip:`Income breakdown and expense breakdown as pie charts — see at a glance what's driving your revenue and your costs.` },
    { screen:'dash4',   scrollTo:'dash-cust-pie',   tip:`Revenue by customer as a pie chart. See who your best buyers are and exactly how much each has spent.` },
    { screen:'plants',  scrollTo:'plants-list',     tip:`Got an orchard or a veggie garden? Plants and trees get their own page too — location, planted date, and care events. Quick look, then we'll wrap up.` },
    { screen:'bulkadd', scrollTo:'bulk-rows',       tip:`Getting started? Add your whole existing ${label} in one go. Name is all you need. Done in minutes.` },
    { screen:'flock',   scrollTo:null,              tip:`That's FarmHand. Ready to set up your real farm?`, isLast:true },
  ]
}

function Nav({ screen, species, isMobile }) {
  const isAnimals=['flock','profile','event','bulk','bulkadd'].includes(screen)
  const isPnL=screen==='pnl', isDash=screen.startsWith('dash'), isPlants=screen==='plants'
  return (
    <div style={{ background:'#2c2416' }}>
      <div style={{ display:'flex',alignItems:'center',padding:'0 16px',height:isMobile?44:52,gap:10 }}>
        <span style={{ fontFamily:"'Playfair Display',serif",fontSize:isMobile?16:20,fontWeight:700,color:'#f0e6cc' }}>🌾 FarmHand</span>
        <div style={{ marginLeft:'auto',fontSize:11,color:'#a08060' }}>demo farm</div>
      </div>
      <div style={{ display:'flex',borderTop:'1px solid rgba(255,255,255,0.07)',padding:'0 8px' }}>
        {[[`${species==='sheep'?'🐑':'🐔'} ${species==='sheep'?'Sheep':'Chickens'}`,isAnimals],['🌱 Plants',isPlants],['💰 P & L',isPnL],['📊 Dashboard',isDash]].map(([l,a])=>(
          <div key={l} style={{ padding:isMobile?'8px 8px':'10px 14px',fontSize:isMobile?10:13,fontWeight:600,color:a?'#f0e6cc':'#6a5040',borderBottom:a?'2px solid #c8a060':'2px solid transparent',whiteSpace:'nowrap' }}>{l}</div>
        ))}
      </div>
    </div>
  )
}

function Tip({ step, stepIdx, total, onNext, onSkip, name, isMobile }) {
  const text=(step.tip||'').replace(/{name}/g,name), isLast=!!step.isLast
  return (
    <div style={{ position:'fixed',bottom:isMobile?82:28,left:'50%',transform:'translateX(-50%)',width:isMobile?'calc(100% - 24px)':'440px',maxWidth:'95vw',background:'#2c2416',borderRadius:12,padding:'16px 18px',boxShadow:'0 8px 32px rgba(0,0,0,0.4)',zIndex:1000,border:'1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ display:'flex',gap:3,marginBottom:12 }}>
        {Array.from({length:total},(_,i)=><div key={i} style={{ height:2,borderRadius:1,flex:1,background:i<=stepIdx?'#c8a060':'rgba(255,255,255,0.1)' }}/>)}
      </div>
      <p style={{ fontSize:14,color:'#f0e6cc',margin:'0 0 14px',lineHeight:1.6 }}>{text}</p>
      <div style={{ display:'flex',alignItems:'center',gap:10 }}>
        <button onClick={onSkip} style={{ background:'none',border:'none',color:'rgba(255,255,255,0.3)',cursor:'pointer',fontSize:12,fontFamily:"'Lato',sans-serif",padding:0 }}>Skip</button>
        <button onClick={onNext} style={{ ...S.btn,marginLeft:'auto',background:isLast?'#4caf50':'#c8a060',color:isLast?'#fff':'#2c2416',fontWeight:700,padding:'9px 22px',fontSize:14 }}>
          {isLast?'🌾 Get Started Free':'Next →'}
        </button>
      </div>
    </div>
  )
}

function FlockScreen({ name, species, highlight, isMobile }) {
  const animals=species==='sheep'?DEMO_SHEEP:DEMO_CHICKENS
  const isSheep=species==='sheep'
  const display=animals.map((a,i)=>i===0?{...a,name}:a)
  const alive=animals.filter(a=>a.status==='alive').length, sold=animals.filter(a=>a.status==='sold').length
  return (
    <div>
      <div style={{ background:'linear-gradient(160deg,#2c2416 0%,#4a3520 40%,#6b4f2e 100%)',width:'100%' }}>
        <div style={{ maxWidth:1100,margin:'0 auto',padding:isMobile?'18px 14px 0':'28px 24px 0' }}>
          <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:16 }}>
            <div>
              <h1 style={{ fontFamily:"'Playfair Display',serif",fontSize:isMobile?24:34,fontWeight:700,color:'#f0e6cc',margin:'0 0 4px' }}>{isSheep?'🐑':'🐔'} Your {isSheep?'Flock':'Chickens'}</h1>
              <p style={{ fontSize:12,color:'#a08060',margin:0 }}>{alive} alive{sold>0?` · ${sold} sold`:''}</p>
            </div>
            <button style={{ ...S.btn,background:'#c8a060',color:'#2c2416',fontWeight:700,padding:'9px 16px',fontSize:13 }}>+ Add {isSheep?'Sheep':'Chicken'}</button>
          </div>
          <div style={{ display:'flex',gap:12,paddingBottom:20,overflowX:'auto',WebkitOverflowScrolling:'touch' }}>
            {display.map(a=>(
              <div key={a.id} style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:4,flexShrink:0 }}>
                <div style={{ position:'relative' }}>
                  <div style={{ width:isMobile?50:60,height:isMobile?50:60,borderRadius:'50%',overflow:'hidden',border:`3px solid ${STATUS_DOT[a.status]||'#9e9e9e'}` }}><Avatar animal={a} size={isMobile?50:60}/></div>
                  <div style={{ width:8,height:8,borderRadius:'50%',background:STATUS_DOT[a.status]||'#9e9e9e',position:'absolute',bottom:1,right:1,border:'2px solid #2c2416' }}/>
                </div>
                <span style={{ fontSize:9,fontWeight:700,color:'#c8a878',textTransform:'uppercase',maxWidth:60,textAlign:'center',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{a.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ maxWidth:1100,margin:'0 auto',padding:isMobile?'12px':'16px 24px' }}>
        <div style={{ display:'flex',gap:6,marginBottom:12,flexWrap:'wrap' }}>
          {['All '+animals.length,'Alive '+alive,...(sold>0?['Sold '+sold]:[])].map((f,i)=>(
            <button key={f} style={{ ...S.btn,padding:'5px 12px',fontSize:12,background:i===0?'#5a3e1b':'#fff',color:i===0?'#fff':'#7a6648',border:'1px solid #d0c4b0' }}>{f}</button>
          ))}
        </div>
        {display.map((a,i)=>{
          const st=STATUS_STYLES[a.status]||STATUS_STYLES.alive, isYours=i===0
          const sub=isSheep?`${a.sex==='ewe'?'Ewe':a.sex==='ram'?'Ram':'Wether'} · ${a.breed} · ${calcAge(a.birth_date)}`:`${a.sex==='hen'?'Hen':a.sex==='rooster'?'Rooster':'Chick'} · ${a.breed} · ${calcAge(a.birth_date)}`
          return (
            <div key={a.id} id={isYours?'your-animal':undefined}
              style={{ ...S.card,padding:isMobile?'10px 12px':'14px 18px',marginBottom:8,display:'flex',gap:12,alignItems:'center',cursor:'pointer',
                outline:highlight==='your-animal'&&isYours?'3px solid #c8a060':'none',
                boxShadow:highlight==='your-animal'&&isYours?'0 0 0 6px rgba(200,160,96,0.2)':'none',transition:'all 0.25s' }}>
              <div style={{ width:isMobile?44:52,height:isMobile?44:52,borderRadius:'50%',overflow:'hidden',border:'2px solid #e8e0d0',flexShrink:0 }}><Avatar animal={a} size={isMobile?44:52}/></div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:2 }}>
                  <p style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:isMobile?14:16,margin:0 }}>{a.name}</p>
                  <span style={{ fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:10,background:st.bg,color:st.text,textTransform:'uppercase' }}>{a.status}</span>
                </div>
                <p style={{ fontSize:11,color:'#a08060',margin:0 }}>{sub}</p>
              </div>
              <span style={{ color:'#c8b89a',fontSize:18 }}>›</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ProfileScreen({ name, species, highlight, isMobile }) {
  const isSheep=species==='sheep'
  const animal={...(isSheep?DEMO_SHEEP[0]:DEMO_CHICKENS[0]),name}
  const events=isSheep?[
    {id:'s',event_type:'sickness',event_date:'2024-09-14',notes:'Limping on left front. Penicillin 3ml. Monitor 5 days.'},
    {id:'e1',event_type:'vaccination',event_date:'2024-03-10',notes:'Annual CD&T.'},
    {id:'e2',event_type:'lambing',event_date:'2024-04-02',notes:'Twins — Rosie and Clover. Both healthy.'},
    {id:'e3',event_type:'shearing',event_date:'2024-05-15',notes:'Fleece 4.2kg. Good quality.'},
  ]:[
    {id:'e1',event_type:'egg_production',event_date:'2025-01-15',notes:'Averaging 6 eggs/week. Consistent through winter.'},
    {id:'e2',event_type:'vaccination',event_date:'2024-11-10',notes:'Newcastle disease vaccine.'},
    {id:'e3',event_type:'moulting',event_date:'2024-10-01',notes:'Moulting started. Production dipped ~3 weeks.'},
    {id:'e4',event_type:'sickness',event_date:'2024-08-20',notes:'Lethargic, not eating. Recovered after 2 days — heat stress likely.'},
  ]
  const subtitle=isSheep?'Merino · Ewe · TAG-001':'Rhode Island Red · Hen · CHK-001'
  return (
    <div>
      <div style={{ background:'linear-gradient(160deg,#2c2416 0%,#4a3520 60%,#6b4f2e 100%)',width:'100%' }}>
        <div style={{ maxWidth:1100,margin:'0 auto',padding:isMobile?'14px 14px 20px':'22px 24px 28px' }}>
          <button style={{ ...S.btn,background:'rgba(255,255,255,0.1)',color:'#f0e6cc',border:'1px solid rgba(255,255,255,0.2)',padding:'6px 12px',fontSize:12,marginBottom:14 }}>← {isSheep?'Flock':'Chickens'}</button>
          <div style={{ display:'flex',gap:isMobile?12:18,alignItems:'flex-start' }}>
            <div style={{ width:isMobile?64:80,height:isMobile?64:80,borderRadius:'50%',overflow:'hidden',border:'3px solid rgba(255,255,255,0.25)',flexShrink:0 }}><Avatar animal={animal} size={isMobile?64:80}/></div>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap' }}>
                <h1 style={{ fontFamily:"'Playfair Display',serif",fontSize:isMobile?20:28,fontWeight:700,color:'#f0e6cc',margin:0 }}>{name}</h1>
                <span style={{ padding:'3px 10px',borderRadius:20,fontSize:10,fontWeight:700,background:'#4caf50',color:'#fff',textTransform:'uppercase' }}>alive</span>
              </div>
              <p style={{ fontSize:12,color:'#c8a878',margin:'0 0 8px',fontStyle:'italic' }}>{subtitle}</p>
              <div style={{ display:'flex',gap:isMobile?12:20,flexWrap:'wrap' }}>
                {[['Age',calcAge(isSheep?'2021-03-15':'2023-06-01')],['Events',events.length+'']].map(([l,v])=>(
                  <div key={l}><p style={{ fontSize:9,color:'#7a6040',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',margin:'0 0 1px' }}>{l}</p><p style={{ fontSize:12,color:'#c8a878',margin:0 }}>{v}</p></div>
                ))}
              </div>
            </div>
            {!isMobile&&<button style={{ ...S.btn,background:'rgba(255,255,255,0.1)',color:'#f0e6cc',border:'1px solid rgba(255,255,255,0.2)',padding:'7px 14px',fontSize:13,flexShrink:0 }}>Edit</button>}
          </div>
          {isMobile&&<div style={{ marginTop:12 }}><button style={{ ...S.btn,width:'100%',justifyContent:'center',background:'rgba(255,255,255,0.1)',color:'#f0e6cc',border:'1px solid rgba(255,255,255,0.2)' }}>✎ Edit</button></div>}
        </div>
      </div>
      <div style={{ maxWidth:1100,margin:'0 auto',padding:isMobile?'12px':'16px 24px' }}>
        <div id="events" style={{ ...S.card,padding:isMobile?14:22,outline:highlight==='events'?'3px solid #c8a060':'none',boxShadow:highlight==='events'?'0 0 0 8px rgba(200,160,96,0.15)':'none',borderRadius:10,transition:'all 0.25s' }}>
          <div style={{ display:'flex',alignItems:'center',marginBottom:16 }}>
            <p style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:16,margin:0 }}>Health & Events</p>
            <button style={{ ...S.btn,...S.btnPrimary,marginLeft:'auto',padding:'7px 14px',fontSize:12 }}>+ Log Event</button>
          </div>
          {events.map(ev=>{
            const ec=EVENT_COLORS[ev.event_type]||EVENT_COLORS.custom
            const label=ev.event_type.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())
            const sick=ev.event_type==='sickness'
            return (
              <div key={ev.id} style={{ display:'flex',gap:10,padding:'11px 13px',borderRadius:9,background:sick?'#fff3f3':ec.bg,border:`1px solid ${sick?'#f5c6c6':ec.border}`,marginBottom:7,position:'relative' }}>
                {sick&&<div style={{ position:'absolute',top:-7,right:10,background:'#c62828',color:'#fff',fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:8,textTransform:'uppercase' }}>⚠ Illness</div>}
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:3,flexWrap:'wrap' }}>
                    <Badge bg={sick?'#f5c6c6':ec.border} color={sick?'#c62828':ec.text}>{label}</Badge>
                    <span style={{ fontSize:11,color:'#7a6648' }}>{formatDate(ev.event_date)}</span>
                  </div>
                  {ev.notes&&<p style={{ fontSize:13,margin:0,color:'#4a3c28',lineHeight:1.5 }}>{ev.notes}</p>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function EventScreen({ name, species, step, highlight, isMobile }) {
  const isSheep=species==='sheep'
  const animal={...(isSheep?DEMO_SHEEP[0]:DEMO_CHICKENS[0]),name}
  const types=step.eventTypes||['vaccination','worming']
  const [type,setType]=useState(types[0])
  const [notes,setNotes]=useState('')
  const [saved,setSaved]=useState(false)
  return (
    <div>
      <div style={{ background:'linear-gradient(160deg,#2c2416 0%,#4a3520 60%,#6b4f2e 100%)',width:'100%' }}>
        <div style={{ maxWidth:1100,margin:'0 auto',padding:isMobile?'14px 14px 20px':'22px 24px 28px' }}>
          <button style={{ ...S.btn,background:'rgba(255,255,255,0.1)',color:'#f0e6cc',border:'1px solid rgba(255,255,255,0.2)',padding:'6px 12px',fontSize:12,marginBottom:14 }}>← {name}</button>
          <div style={{ display:'flex',gap:12,alignItems:'center' }}>
            <div style={{ width:52,height:52,borderRadius:'50%',overflow:'hidden',border:'2px solid rgba(255,255,255,0.25)',flexShrink:0 }}><Avatar animal={animal} size={52}/></div>
            <div>
              <h1 style={{ fontFamily:"'Playfair Display',serif",fontSize:isMobile?18:22,fontWeight:700,color:'#f0e6cc',margin:'0 0 2px' }}>Log Event — {name}</h1>
              <p style={{ fontSize:12,color:'#a08060',margin:0 }}>Adds to {name}'s history with today's date</p>
            </div>
          </div>
        </div>
      </div>
      <div style={{ maxWidth:1100,margin:'0 auto',padding:isMobile?'12px':'16px 24px' }}>
        <div id="event-form" style={{ ...S.card,padding:isMobile?16:28,outline:highlight==='event-form'?'3px solid #c8a060':'none',boxShadow:highlight==='event-form'?'0 0 0 8px rgba(200,160,96,0.15)':'none',borderRadius:10,transition:'all 0.25s' }}>
          {saved?(
            <div style={{ textAlign:'center',padding:'32px 0' }}>
              <div style={{ fontSize:48,marginBottom:12 }}>✓</div>
              <p style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:20,margin:'0 0 8px',color:'#2e7d32' }}>Logged for {name}</p>
              <p style={{ fontSize:14,color:'#a08060',margin:0 }}>Timestamped and saved to the event history.</p>
            </div>
          ):(
            <>
              <div style={{ display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:14,marginBottom:16 }}>
                <div>
                  <label style={S.label}>What happened?</label>
                  <select style={{ ...S.input,cursor:'pointer' }} value={type} onChange={e=>setType(e.target.value)}>
                    {types.map(t=><option key={t} value={t}>{t.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>)}
                    <option value="custom">Other</option>
                  </select>
                </div>
                <div>
                  <label style={S.label}>Date</label>
                  <input type="date" style={S.input} defaultValue={new Date().toISOString().split('T')[0]}/>
                </div>
              </div>
              <div style={{ marginBottom:20 }}>
                <label style={S.label}>Notes (optional)</label>
                <input style={S.input} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Anything worth remembering…"/>
              </div>
              <button onClick={()=>setSaved(true)} style={{ ...S.btn,...S.btnPrimary,padding:'12px 28px',fontSize:15,width:isMobile?'100%':undefined,justifyContent:'center' }}>
                Save to {name}'s history
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function BulkScreen({ name, species, highlight, isMobile }) {
  const isSheep=species==='sheep'
  const animals=isSheep?DEMO_SHEEP:DEMO_CHICKENS
  const [selected,setSelected]=useState(new Set(animals.slice(0,isSheep?3:4).map(a=>a.id)))
  const [type,setType]=useState(isSheep?'hoof_trimming':'worming')
  const [notes,setNotes]=useState(isSheep?'All trimmed, no issues':'Ivermectin dose — routine')
  const [saved,setSaved]=useState(false)
  const toggle=id=>setSelected(p=>{ const n=new Set(p); n.has(id)?n.delete(id):n.add(id); return n })
  return (
    <div style={{ maxWidth:1100,margin:'0 auto',padding:isMobile?'16px 12px':'28px 24px' }}>
      <div style={{ marginBottom:18 }}>
        <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:isMobile?22:28,fontWeight:700,margin:'0 0 6px' }}>
          {isSheep?'Trimmed hooves today?':'Wormed the flock today?'}
        </h2>
        <p style={{ fontSize:14,color:'#7a6648',margin:0 }}>Select who you worked with — log it once for all of them.</p>
      </div>
      <div id="bulk-chips" style={{ marginBottom:14,outline:highlight==='bulk-chips'?'3px solid #c8a060':'none',borderRadius:highlight==='bulk-chips'?10:0,boxShadow:highlight==='bulk-chips'?'0 0 0 8px rgba(200,160,96,0.15)':'none',transition:'all 0.25s',padding:highlight==='bulk-chips'?4:0 }}>
        <p style={{ fontSize:11,fontWeight:700,color:'#a08060',textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 10px' }}>Tap to select / deselect</p>
        <div style={{ display:'flex',gap:10,flexWrap:'wrap' }}>
          {animals.map((a,i)=>{
            const isSel=selected.has(a.id)
            return (
              <div key={a.id} onClick={()=>toggle(a.id)}
                style={{ display:'flex',alignItems:'center',gap:9,padding:'9px 14px',borderRadius:10,cursor:'pointer',
                  border:isSel?'2px solid #c8a060':'1px solid #e8e0d0',background:isSel?'#2c2416':'#fff',transition:'all 0.15s' }}>
                <div style={{ width:30,height:30,borderRadius:'50%',overflow:'hidden',border:`2px solid ${isSel?'#c8a060':'#e8e0d0'}`,flexShrink:0 }}><Avatar animal={{...a,name:i===0?name:a.name}} size={30}/></div>
                <span style={{ fontSize:13,fontWeight:700,color:isSel?'#f0e6cc':'#2c2416',whiteSpace:'nowrap' }}>{i===0?name:a.name}</span>
                {isSel&&<span style={{ color:'#c8a060',fontSize:13 }}>✓</span>}
              </div>
            )
          })}
        </div>
        <div style={{ display:'flex',gap:8,marginTop:10,alignItems:'center' }}>
          <button onClick={()=>setSelected(new Set(animals.map(a=>a.id)))} style={{ ...S.btn,...S.btnSecondary,fontSize:12,padding:'5px 12px' }}>Select All {animals.length}</button>
          <button onClick={()=>setSelected(new Set())} style={{ ...S.btn,...S.btnSecondary,fontSize:12,padding:'5px 12px' }}>Clear</button>
          <span style={{ fontSize:13,color:'#a08060',fontWeight:600 }}>{selected.size} of {animals.length} selected</span>
        </div>
      </div>
      <div style={{ ...S.card,padding:isMobile?16:24,marginBottom:14 }}>
        <div style={{ display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:14,marginBottom:14 }}>
          <div>
            <label style={S.label}>Event Type</label>
            <select style={{ ...S.input,cursor:'pointer' }} value={type} onChange={e=>setType(e.target.value)}>
              {(isSheep?['hoof_trimming','vaccination','worming','shearing']:['worming','vaccination','egg_production','moulting']).map(t=><option key={t} value={t}>{t.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>)}
            </select>
          </div>
          <div><label style={S.label}>Date</label><input type="date" style={S.input} defaultValue={new Date().toISOString().split('T')[0]}/></div>
        </div>
        <div style={{ marginBottom:16 }}><label style={S.label}>Notes</label><input style={S.input} value={notes} onChange={e=>setNotes(e.target.value)}/></div>
        <div id="bulk-save" style={{ outline:highlight==='bulk-save'?'3px solid #c8a060':'none',borderRadius:highlight==='bulk-save'?10:0,boxShadow:highlight==='bulk-save'?'0 0 0 8px rgba(200,160,96,0.15)':'none',transition:'all 0.25s',padding:highlight==='bulk-save'?4:0 }}>
          {selected.size>0&&!saved&&<div style={{ background:'#f0faf0',border:'1px solid #a5d6a7',borderRadius:8,padding:'10px 14px',marginBottom:12,fontSize:13,color:'#2e7d32',fontWeight:600 }}>✓ Logs on {selected.size} animals at once — not {selected.size} separate entries.</div>}
          {saved
            ?<div style={{ background:'#f0faf0',border:'1px solid #a5d6a7',borderRadius:8,padding:'14px 16px',textAlign:'center' }}><p style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:16,color:'#2e7d32',margin:'0 0 4px' }}>✓ Saved for {selected.size} animals</p><p style={{ fontSize:13,color:'#4a7a4a',margin:0 }}>Each one has it in their history now.</p></div>
            :<button disabled={selected.size===0} onClick={()=>setSaved(true)} style={{ ...S.btn,...S.btnPrimary,padding:'12px 28px',fontSize:15,opacity:selected.size?1:0.4,width:isMobile?'100%':undefined,justifyContent:'center' }}>Save for {selected.size||'—'} Animals</button>
          }
        </div>
      </div>
    </div>
  )
}

function PnLScreen({ species, highlight, isMobile }) {
  const isSheep=species==='sheep'
  const totalIn=DEMO_INCOME.filter(i=>isSheep?i.species==='sheep':i.species==='chickens').reduce((s,i)=>s+i.amount,0)
  const totalOut=DEMO_COSTS.filter(c=>isSheep?c.species==='sheep':c.species==='chickens').reduce((s,c)=>s+c.amount,0)
  const net=totalIn-totalOut
  return (
    <div style={{ maxWidth:1100,margin:'0 auto',padding:isMobile?'16px 12px':'28px 24px' }}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18,flexWrap:'wrap',gap:10 }}>
        <div><h1 style={{ fontFamily:"'Playfair Display',serif",fontSize:isMobile?22:30,fontWeight:700,margin:'0 0 4px' }}>Profit & Loss</h1><p style={{ fontSize:13,color:'#a08060',margin:0 }}>{isSheep?'Sheep':'Chickens'} · Spring 2025</p></div>
        <div style={{ display:'flex',gap:8 }}>
          <button style={{ ...S.btn,background:'#e8f5e9',color:'#2e7d32',border:'1px solid #c8e6c9',fontSize:13 }}>+ Income</button>
          <button style={{ ...S.btn,...S.btnPrimary,fontSize:13 }}>+ Expense</button>
        </div>
      </div>
      <div id="pnl-top" style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16,outline:highlight==='pnl-top'?'3px solid #c8a060':'none',borderRadius:highlight==='pnl-top'?10:0,boxShadow:highlight==='pnl-top'?'0 0 0 8px rgba(200,160,96,0.15)':'none',transition:'all 0.25s' }}>
        {[{l:'Income',v:'+'+fmt(totalIn),c:'#2e7d32',bg:'#f1f8f1'},{l:'Expenses',v:'-'+fmt(totalOut),c:'#c62828',bg:'#fff3f3'},{l:'Net',v:(net>=0?'+':'')+fmt(net),c:net>=0?'#2e7d32':'#c62828',bg:net>=0?'#e8f5e9':'#fff3f3'}].map(s=>(
          <div key={s.l} style={{ ...S.card,padding:isMobile?'12px 8px':'18px 14px',textAlign:'center',background:s.bg }}>
            <div style={{ fontSize:isMobile?15:22,fontWeight:700,color:s.c,fontFamily:"'Playfair Display',serif" }}>{s.v}</div>
            <div style={{ fontSize:9,color:'#a08060',fontWeight:700,textTransform:'uppercase',marginTop:3 }}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{ ...S.card,padding:isMobile?14:22 }}>
        <p style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:15,margin:'0 0 14px' }}>Recent</p>
        {DEMO_INCOME.filter(i=>isSheep?i.species==='sheep':i.species==='chickens').slice(0,3).map(i=>(
          <div key={i.id} style={{ display:'flex',alignItems:'center',gap:10,padding:'9px 11px',borderRadius:8,background:'#f1f8f1',marginBottom:7 }}>
            <span style={{ fontSize:16 }}>{isSheep?'🐑':'🥚'}</span>
            <div style={{ flex:1,minWidth:0 }}><p style={{ fontSize:13,fontWeight:600,margin:'0 0 1px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{i.description}</p><p style={{ fontSize:11,color:'#a08060',margin:0 }}>{i.income_type.replace(/_/g,' ')}{i.customer?.name?` · ${i.customer.name}`:''} · {formatDate(i.date)}</p></div>
            <span style={{ fontWeight:700,fontSize:13,color:'#2e7d32',flexShrink:0 }}>+{fmt(i.amount)}</span>
          </div>
        ))}
        {DEMO_COSTS.filter(c=>isSheep?c.species==='sheep':c.species==='chickens').slice(0,2).map(c=>(
          <div key={c.id} style={{ display:'flex',alignItems:'center',gap:10,padding:'9px 11px',borderRadius:8,background:'#fff3f3',marginBottom:7 }}>
            <span style={{ fontSize:16 }}>🌾</span>
            <div style={{ flex:1,minWidth:0 }}><p style={{ fontSize:13,fontWeight:600,margin:'0 0 1px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{c.description}</p><p style={{ fontSize:11,color:'#a08060',margin:0 }}>{c.category} · {formatDate(c.date)}</p></div>
            <span style={{ fontWeight:700,fontSize:13,color:'#c62828',flexShrink:0 }}>-{fmt(c.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DashChartScreen({ highlight, isMobile }) {
  const months=['Jan','Feb','Mar','Apr'],inc=[20,205,120,30],exp=[220,192,285,80],maxV=300
  const chartH=isMobile?80:110,barW=isMobile?14:20,gap=6,groupW=barW*2+gap,padL=32,padT=8,totalW=padL+months.length*(groupW+12)+12
  const totalIn=DEMO_INCOME.reduce((s,i)=>s+i.amount,0),totalOut=DEMO_COSTS.reduce((s,c)=>s+c.amount,0)
  return (
    <div style={{ maxWidth:1100,margin:'0 auto',padding:isMobile?'16px 12px':'28px 24px' }}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:8 }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif",fontSize:isMobile?22:30,fontWeight:700,margin:0 }}>📊 Dashboard</h1>
        <div style={{ display:'flex',background:'#f0e8d8',borderRadius:10,padding:3,gap:2 }}>
          {['💰 P&L','🐾 Animals','👥 Customers'].map((t,i)=>(
            <button key={t} style={{ ...S.btn,padding:isMobile?'5px 8px':'6px 12px',fontSize:isMobile?10:12,borderRadius:8,background:i===0?'#5a3e1b':'transparent',color:i===0?'#fff':'#7a6648',border:'none' }}>{t}</button>
          ))}
        </div>
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16 }}>
        {[{l:'Income',v:'+'+fmt(totalIn),c:'#2e7d32',bg:'#f1f8f1'},{l:'Expenses',v:'-'+fmt(totalOut),c:'#c62828',bg:'#fff3f3'},{l:'Net',v:'+'+fmt(totalIn-totalOut),c:'#2e7d32',bg:'#e8f5e9'}].map(s=>(
          <div key={s.l} style={{ ...S.card,padding:isMobile?'10px 8px':'14px 12px',textAlign:'center',background:s.bg }}>
            <div style={{ fontSize:isMobile?13:18,fontWeight:700,color:s.c,fontFamily:"'Playfair Display',serif" }}>{s.v}</div>
            <div style={{ fontSize:8,color:'#a08060',fontWeight:700,textTransform:'uppercase',marginTop:2 }}>{s.l}</div>
          </div>
        ))}
      </div>
      <div id="dash-chart" style={{ ...S.card,padding:isMobile?14:22,outline:highlight==='dash-chart'?'3px solid #c8a060':'none',boxShadow:highlight==='dash-chart'?'0 0 0 8px rgba(200,160,96,0.15)':'none',borderRadius:10,transition:'all 0.25s' }}>
        <p style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:15,margin:'0 0 12px' }}>Income vs Expenses by Month</p>
        <svg width="100%" viewBox={`0 0 ${totalW} ${chartH+34}`} style={{ display:'block' }}>
          {months.map((mo,i)=>{ const x=padL+i*(groupW+12),incH=Math.max((inc[i]/maxV)*chartH,2),expH=Math.max((exp[i]/maxV)*chartH,2); return(<g key={mo}><rect x={x} y={padT+chartH-incH} width={barW} height={incH} fill="#4caf50" rx={3} opacity={0.85}/><rect x={x+barW+gap} y={padT+chartH-expH} width={barW} height={expH} fill="#c62828" rx={3} opacity={0.75}/><text x={x+barW+gap/2} y={padT+chartH+14} textAnchor="middle" fontSize={isMobile?9:10} fill="#7a6648" fontWeight={600}>{mo}</text></g>) })}
          <line x1={padL} x2={totalW-8} y1={padT+chartH} y2={padT+chartH} stroke="#e8e0d0" strokeWidth={1.5}/>
        </svg>
        <div style={{ display:'flex',gap:14,marginTop:8 }}>
          {[['#4caf50','Income'],['#c62828','Expenses']].map(([c,l])=>(
            <div key={l} style={{ display:'flex',alignItems:'center',gap:5 }}><div style={{ width:8,height:8,borderRadius:2,background:c }}/><span style={{ fontSize:11,color:'#4a3c28',fontWeight:600 }}>{l}</span></div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Donut helper ──────────────────────────────────────────────────────────────
function MiniDonut({ segments, size=100, centerLabel, centerValue }) {
  const total=segments.reduce((s,sg)=>s+sg.value,0)
  if(!total) return null
  const cx=size/2,cy=size/2,r=size*0.42,hole=size*0.28
  if(segments.filter(s=>s.value>0).length===1){
    const sg=segments.find(s=>s.value>0)
    return(<svg width={size} height={size}><circle cx={cx} cy={cy} r={r} fill={sg.color} opacity={0.9}/><circle cx={cx} cy={cy} r={hole} fill="#fff"/>{centerLabel&&<text x={cx} y={cy-4} textAnchor="middle" fontSize={8} fill="#a08060" fontWeight={600}>{centerLabel}</text>}{centerValue&&<text x={cx} y={cy+10} textAnchor="middle" fontSize={11} fill="#2c2416" fontWeight={700}>{centerValue}</text>}</svg>)
  }
  let angle=-90
  const paths=segments.filter(s=>s.value>0).map(sg=>{
    const pct=sg.value/total,start=angle,end=angle+pct*360;angle=end
    const sR=(start*Math.PI)/180,eR=(end*Math.PI)/180,large=end-start>180?1:0
    const x1=cx+r*Math.cos(sR),y1=cy+r*Math.sin(sR),x2=cx+r*Math.cos(eR),y2=cy+r*Math.sin(eR)
    return {...sg,d:`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`,pct}
  })
  return(
    <svg width={size} height={size}>
      {paths.map((p,i)=><path key={i} d={p.d} fill={p.color} opacity={0.9}/>)}
      <circle cx={cx} cy={cy} r={hole} fill="#fff"/>
      {centerLabel&&<text x={cx} y={cy-4} textAnchor="middle" fontSize={8} fill="#a08060" fontWeight={600}>{centerLabel}</text>}
      {centerValue&&<text x={cx} y={cy+10} textAnchor="middle" fontSize={11} fill="#2c2416" fontWeight={700}>{centerValue}</text>}
    </svg>
  )
}

function DonutCard({ title, segments, centerLabel, centerValue, isMobile }) {
  const size=isMobile?90:108
  return(
    <div style={{ ...S.card,padding:isMobile?12:18 }}>
      <p style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:13,margin:'0 0 10px' }}>{title}</p>
      <div style={{ display:'flex',alignItems:'center',gap:12 }}>
        <MiniDonut segments={segments} size={size} centerLabel={centerLabel} centerValue={centerValue}/>
        <div style={{ flex:1,minWidth:0 }}>
          {segments.filter(s=>s.value>0).map((s,i)=>(
            <div key={i} style={{ display:'flex',alignItems:'center',gap:6,marginBottom:5 }}>
              <div style={{ width:8,height:8,borderRadius:'50%',background:s.color,flexShrink:0 }}/>
              <span style={{ fontSize:isMobile?10:11,color:'#4a3c28',fontWeight:600,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{s.label}</span>
              <span style={{ fontSize:isMobile?10:11,color:'#2c2416',fontWeight:700,flexShrink:0 }}>{s.isCount?s.value:fmt(s.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── DASH 2: Animal breakdown ──────────────────────────────────────────────────
function DashAnimalsScreen({ species, highlight, isMobile }) {
  const isSheep=species==='sheep'
  const animals=isSheep?DEMO_SHEEP:DEMO_CHICKENS

  const bySex={};   animals.forEach(a=>{bySex[a.sex]=(bySex[a.sex]||0)+1})
  const byStatus={}; animals.forEach(a=>{byStatus[a.status]=(byStatus[a.status]||0)+1})
  const byBreed={}; animals.forEach(a=>{const b=a.breed||'Unknown';byBreed[b]=(byBreed[b]||0)+1})

  const sexColors   = isSheep?{ram:'#5d4037',ewe:'#a1887f',wether:'#d7ccc8'}:{hen:'#f9a825',rooster:'#c62828',chick:'#ffcc80'}
  const statusColors= {alive:'#4caf50',sold:'#9c27b0',deceased:'#9e9e9e',rented:'#f9a825'}
  const breedColors = ['#f57f17','#e65100','#ff8f00','#f9a825','#ef6c00']

  const sexSegs    = Object.entries(bySex).map(([k,v])=>({label:k.charAt(0).toUpperCase()+k.slice(1),value:v,color:sexColors[k]||'#999',isCount:true}))
  const statusSegs = Object.entries(byStatus).map(([k,v])=>({label:k.charAt(0).toUpperCase()+k.slice(1),value:v,color:statusColors[k]||'#999',isCount:true}))
  const breedSegs  = Object.entries(byBreed).map(([k,v],i)=>({label:k.length>14?k.slice(0,13)+'…':k,value:v,color:breedColors[i%breedColors.length],isCount:true}))

  return(
    <div style={{ maxWidth:1100,margin:'0 auto',padding:isMobile?'16px 12px':'28px 24px' }}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:8 }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif",fontSize:isMobile?22:30,fontWeight:700,margin:0 }}>📊 Dashboard</h1>
        <div style={{ display:'flex',background:'#f0e8d8',borderRadius:10,padding:3,gap:2 }}>
          {['💰 P&L','🐾 Animals','👥 Customers'].map((t,i)=>(
            <button key={t} style={{ ...S.btn,padding:isMobile?'5px 8px':'6px 12px',fontSize:isMobile?10:12,borderRadius:8,background:i===1?'#5a3e1b':'transparent',color:i===1?'#fff':'#7a6648',border:'none' }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:16 }}>
        {[{e:isSheep?'🐑':'🐔',l:isSheep?'Sheep':'Chickens',v:animals.filter(a=>a.status==='alive').length+' alive'},{e:'📅',l:'Events logged',v:DEMO_EVENTS.length+''},{e:'🏷️',l:'Breeds tracked',v:Object.keys(byBreed).length+''}].map(s=>(
          <div key={s.l} style={{ ...S.card,padding:isMobile?'10px 8px':'14px 12px',textAlign:'center' }}>
            <div style={{ fontSize:isMobile?20:24,marginBottom:3 }}>{s.e}</div>
            <div style={{ fontFamily:"'Playfair Display',serif",fontSize:isMobile?16:20,fontWeight:700,marginBottom:2 }}>{s.v}</div>
            <div style={{ fontSize:9,color:'#a08060',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.04em' }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div id="dash-animals" style={{ display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr 1fr',gap:10,outline:highlight==='dash-animals'?'3px solid #c8a060':'none',borderRadius:highlight==='dash-animals'?10:0,boxShadow:highlight==='dash-animals'?'0 0 0 8px rgba(200,160,96,0.15)':'none',transition:'all 0.25s' }}>
        <DonutCard title={`${isSheep?'🐑':'🐔'} By Sex`} segments={sexSegs} centerLabel="Total" centerValue={animals.length+''} isMobile={isMobile}/>
        <DonutCard title="By Status" segments={statusSegs} centerLabel="Total" centerValue={animals.length+''} isMobile={isMobile}/>
        <DonutCard title="By Breed" segments={breedSegs} centerLabel="Breeds" centerValue={Object.keys(byBreed).length+''} isMobile={isMobile}/>
      </div>
    </div>
  )
}

// ─── DASH 3: Income + expense breakdown donuts ─────────────────────────────────
function DashDonutsScreen({ highlight, isMobile }) {
  const totalIn  = DEMO_INCOME.reduce((s,i)=>s+i.amount,0)
  const totalOut = DEMO_COSTS.reduce((s,c)=>s+c.amount,0)

  const incomeColors={ sale_animal:'#795548',sale_produce:'#4caf50',sale_eggs:'#f9a825',sale_wool:'#90caf9',sale_meat:'#ef5350',breeding:'#ab47bc',other:'#78909c' }
  const incomeLabels={ sale_animal:'Animal Sale',sale_produce:'Produce',sale_eggs:'Eggs',sale_wool:'Wool',sale_meat:'Meat',breeding:'Breeding',other:'Other' }
  const expColors={ hay:'#f9a825',feed:'#795548',medicine:'#ef5350',infrastructure:'#546e7a',equipment:'#1565c0',bedding:'#66bb6a',supplements:'#ab47bc',labour:'#8d6e63',other:'#78909c' }
  const expLabels={ hay:'Hay',feed:'Feed',medicine:'Medicine',infrastructure:'Infrastructure',equipment:'Equipment',bedding:'Bedding',supplements:'Supplements',labour:'Labour',other:'Other' }

  const byType={};  DEMO_INCOME.forEach(i=>{byType[i.income_type]=(byType[i.income_type]||0)+i.amount})
  const byCat={};   DEMO_COSTS.forEach(c=>{byCat[c.category||'other']=(byCat[c.category||'other']||0)+c.amount})

  const incSegs = Object.entries(byType).map(([k,v])=>({label:incomeLabels[k]||k,value:v,color:incomeColors[k]||'#78909c'})).filter(s=>s.value>0).sort((a,b)=>b.value-a.value)
  const expSegs = Object.entries(byCat).map(([k,v])=>({label:expLabels[k]||k,value:v,color:expColors[k]||'#78909c'})).filter(s=>s.value>0).sort((a,b)=>b.value-a.value)

  return(
    <div style={{ maxWidth:1100,margin:'0 auto',padding:isMobile?'16px 12px':'28px 24px' }}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:8 }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif",fontSize:isMobile?22:30,fontWeight:700,margin:0 }}>📊 Dashboard</h1>
        <div style={{ display:'flex',background:'#f0e8d8',borderRadius:10,padding:3,gap:2 }}>
          {['💰 P&L','🐾 Animals','👥 Customers'].map((t,i)=>(
            <button key={t} style={{ ...S.btn,padding:isMobile?'5px 8px':'6px 12px',fontSize:isMobile?10:12,borderRadius:8,background:i===0?'#5a3e1b':'transparent',color:i===0?'#fff':'#7a6648',border:'none' }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:16 }}>
        {[{l:'Income',v:'+'+fmt(totalIn),c:'#2e7d32',bg:'#f1f8f1'},{l:'Expenses',v:'-'+fmt(totalOut),c:'#c62828',bg:'#fff3f3'},{l:'Net P&L',v:'+'+fmt(totalIn-totalOut),c:'#2e7d32',bg:'#e8f5e9'}].map(s=>(
          <div key={s.l} style={{ ...S.card,padding:isMobile?'10px 8px':'14px 12px',textAlign:'center',background:s.bg }}>
            <div style={{ fontSize:isMobile?13:18,fontWeight:700,color:s.c,fontFamily:"'Playfair Display',serif" }}>{s.v}</div>
            <div style={{ fontSize:8,color:'#a08060',fontWeight:700,textTransform:'uppercase',marginTop:2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div id="dash-donuts" style={{ display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:12,outline:highlight==='dash-donuts'?'3px solid #c8a060':'none',borderRadius:highlight==='dash-donuts'?10:0,boxShadow:highlight==='dash-donuts'?'0 0 0 8px rgba(200,160,96,0.15)':'none',transition:'all 0.25s' }}>
        <DonutCard title="💰 Income Breakdown" segments={incSegs} centerLabel="Total" centerValue={fmt(totalIn)} isMobile={isMobile}/>
        <DonutCard title="📦 Expense Breakdown" segments={expSegs} centerLabel="Total" centerValue={fmt(totalOut)} isMobile={isMobile}/>
      </div>
    </div>
  )
}

// ─── DASH 4: Customer pie ──────────────────────────────────────────────────────
function DashCustomerPieScreen({ highlight, isMobile }) {
  const custColors=['#5a3e1b','#795548','#a1887f']
  const custStats=DEMO_CUSTOMERS.map((c,i)=>({...c,spent:DEMO_INCOME.filter(i=>i.customer_id===c.id).reduce((s,i)=>s+i.amount,0),eggs:DEMO_INCOME.filter(i=>i.customer_id===c.id&&i.income_type==='sale_eggs').reduce((s,i)=>s+(i.quantity||0),0),txns:DEMO_INCOME.filter(i=>i.customer_id===c.id).length,color:custColors[i]})).sort((a,b)=>b.spent-a.spent)
  const untagged=DEMO_INCOME.filter(i=>!i.customer_id).reduce((s,i)=>s+i.amount,0)
  const custSegs=[...custStats.map(c=>({label:c.name.split(' ')[0],value:c.spent,color:c.color})),...(untagged>0?[{label:'Untagged',value:untagged,color:'#e0e0e0'}]:[]) ]
  const totalRevenue=custStats.reduce((s,c)=>s+c.spent,0)

  return(
    <div style={{ maxWidth:1100,margin:'0 auto',padding:isMobile?'16px 12px':'28px 24px' }}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:8 }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif",fontSize:isMobile?22:30,fontWeight:700,margin:0 }}>📊 Dashboard</h1>
        <div style={{ display:'flex',background:'#f0e8d8',borderRadius:10,padding:3,gap:2 }}>
          {['💰 P&L','🐾 Animals','👥 Customers'].map((t,i)=>(
            <button key={t} style={{ ...S.btn,padding:isMobile?'5px 8px':'6px 12px',fontSize:isMobile?10:12,borderRadius:8,background:i===2?'#5a3e1b':'transparent',color:i===2?'#fff':'#7a6648',border:'none' }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ ...S.card,padding:isMobile?'14px 16px':'18px 22px',marginBottom:14,background:'#f1f8f1' }}>
        <p style={{ fontSize:10,color:'#2e7d32',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',margin:'0 0 2px' }}>Total Customer Revenue</p>
        <p style={{ fontFamily:"'Playfair Display',serif",fontSize:isMobile?24:30,fontWeight:700,color:'#2e7d32',margin:0 }}>{fmt(totalRevenue)}</p>
      </div>

      <div id="dash-cust-pie" style={{ ...S.card,padding:isMobile?14:22,outline:highlight==='dash-cust-pie'?'3px solid #c8a060':'none',borderRadius:10,boxShadow:highlight==='dash-cust-pie'?'0 0 0 8px rgba(200,160,96,0.15)':'none',transition:'all 0.25s',marginBottom:12 }}>
        <p style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:14,margin:'0 0 14px' }}>👥 Revenue by Customer</p>
        <div style={{ display:'flex',alignItems:'center',gap:16,flexWrap:'wrap',marginBottom:16 }}>
          <MiniDonut segments={custSegs} size={isMobile?90:110} centerLabel="Revenue" centerValue={fmt(totalRevenue)}/>
          <div style={{ flex:1,minWidth:120 }}>
            {custSegs.map((c,i)=>(
              <div key={i} style={{ display:'flex',alignItems:'center',gap:6,marginBottom:6 }}>
                <div style={{ width:9,height:9,borderRadius:'50%',background:c.color,flexShrink:0 }}/>
                <span style={{ fontSize:12,fontWeight:600,flex:1,color:'#4a3c28' }}>{c.label}</span>
                <span style={{ fontSize:12,fontWeight:700,color:'#2e7d32' }}>{fmt(c.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
        {custStats.map((c,i)=>(
          <div key={c.id} style={{ ...S.card,padding:isMobile?'12px 14px':'14px 18px',display:'flex',alignItems:'center',gap:12 }}>
            <div style={{ width:36,height:36,borderRadius:'50%',background:c.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'#fff',flexShrink:0 }}>{c.name[0]}</div>
            <div style={{ flex:1,minWidth:0 }}>
              <p style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:isMobile?14:15,margin:'0 0 2px' }}>{c.name}</p>
              <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
                <span style={{ fontSize:11,color:'#a08060' }}>{c.txns} purchase{c.txns!==1?'s':''}</span>
                {c.eggs>0&&<span style={{ fontSize:11,color:'#f57f17',fontWeight:600 }}>🥚 {c.eggs} dozen{c.eggs!==1?'s':''}</span>}
              </div>
            </div>
            <p style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:isMobile?15:18,color:'#2e7d32',margin:0,flexShrink:0 }}>{fmt(c.spent)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── PLANTS: quick shoutout ────────────────────────────────────────────────────
const DEMO_PLANTS_QUICK=[
  {id:'p1',name:'Honeycrisp Apple',emoji:'🍎',cat:'Fruit Tree',location:'North fence',planted:'2015',notes:'~40kg per season.'},
  {id:'p2',name:'Bartlett Pear',   emoji:'🍐',cat:'Fruit Tree',location:'Back paddock',planted:'2017',notes:'Late summer harvest.'},
  {id:'p3',name:'Herb Garden',     emoji:'🌿',cat:'Herb Garden',location:'Side of house',planted:'2023',notes:'Rosemary, thyme, oregano.'},
]

function PlantsScreen({ highlight, isMobile }) {
  return(
    <div>
      <div style={{ background:'linear-gradient(160deg,#1a2e1a 0%,#2d4a2d 50%,#3d6b3d 100%)',width:'100%' }}>
        <div style={{ maxWidth:1100,margin:'0 auto',padding:isMobile?'18px 14px 20px':'28px 24px' }}>
          <h1 style={{ fontFamily:"'Playfair Display',serif",fontSize:isMobile?24:32,fontWeight:700,color:'#d4f0d4',margin:'0 0 4px' }}>🌱 Plants & Trees</h1>
          <p style={{ fontSize:12,color:'#7ab87a',margin:'0 0 16px' }}>{DEMO_PLANTS_QUICK.length} plants · 2 categories</p>
          <div style={{ display:'flex',gap:14,overflowX:'auto',WebkitOverflowScrolling:'touch',paddingBottom:4 }}>
            {DEMO_PLANTS_QUICK.map(p=>(
              <div key={p.id} style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:4,flexShrink:0 }}>
                <div style={{ width:isMobile?48:56,height:isMobile?48:56,borderRadius:'50%',border:'2px solid rgba(255,255,255,0.2)',background:'rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:isMobile?22:26 }}>{p.emoji}</div>
                <span style={{ fontSize:9,fontWeight:700,color:'#a0d4a0',textTransform:'uppercase',whiteSpace:'nowrap',maxWidth:64,textAlign:'center',overflow:'hidden',textOverflow:'ellipsis' }}>{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ maxWidth:1100,margin:'0 auto',padding:isMobile?'12px 12px':'16px 24px' }}>
        <div id="plants-list" style={{ display:'flex',flexDirection:'column',gap:8,outline:highlight==='plants-list'?'3px solid #4caf50':'none',borderRadius:highlight==='plants-list'?10:0,boxShadow:highlight==='plants-list'?'0 0 0 8px rgba(76,175,80,0.15)':'none',transition:'all 0.25s' }}>
          {DEMO_PLANTS_QUICK.map(p=>(
            <div key={p.id} style={{ ...S.card,padding:isMobile?'12px 14px':'14px 20px',display:'flex',gap:14,alignItems:'center',cursor:'pointer' }}>
              <div style={{ width:isMobile?44:52,height:isMobile?44:52,borderRadius:10,background:'#e8f5e9',border:'2px solid #c8e6c9',display:'flex',alignItems:'center',justifyContent:'center',fontSize:isMobile?22:26,flexShrink:0 }}>{p.emoji}</div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:3 }}>
                  <p style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:isMobile?14:15,margin:0 }}>{p.name}</p>
                  <span style={{ fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:8,background:'#e8f5e9',color:'#2e7d32',textTransform:'uppercase' }}>{p.cat}</span>
                </div>
                <p style={{ fontSize:11,color:'#a08060',margin:0 }}>{p.location} · Planted {p.planted} · {p.notes}</p>
              </div>
              <span style={{ color:'#c8b89a',fontSize:18 }}>›</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function BulkAddScreen({ name, species, highlight, isMobile }) {
  const isSheep=species==='sheep'
  const rows=[{name,sex:isSheep?'Ewe (Female)':'Hen',dob:isSheep?'03/15/2021':'06/01/2023'},{name:'Rosie',sex:isSheep?'Ewe (Female)':'Hen',dob:isSheep?'04/02/2022':'06/01/2023'},{name:'Duke',sex:isSheep?'Ram (Male)':'Rooster',dob:isSheep?'01/10/2020':'05/15/2023'},{name:'',sex:isSheep?'Ewe':'Hen',dob:''},{name:'',sex:isSheep?'Ewe':'Hen',dob:''}]
  const inp={ padding:'7px 10px',borderRadius:6,border:'1px solid #d0c4b0',background:'#fdfaf6',fontSize:isMobile?13:14,color:'#2c2416',width:'100%',boxSizing:'border-box' }
  return (
    <div style={{ maxWidth:1100,margin:'0 auto',padding:isMobile?'16px 12px':'28px 24px' }}>
      <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:20,flexWrap:'wrap' }}>
        <button style={{ ...S.btn,...S.btnSecondary,padding:'7px 14px' }}>← {isSheep?'Sheep':'Chickens'}</button>
        <div>
          <h1 style={{ fontFamily:"'Playfair Display',serif",fontSize:isMobile?20:26,fontWeight:700,margin:'0 0 2px' }}>⚡ Bulk Add {isSheep?'Sheep':'Chickens'}</h1>
          <p style={{ fontSize:12,color:'#a08060',margin:0 }}>Add your whole existing {isSheep?'flock':'flock'} at once. Only Name required.</p>
        </div>
        <button style={{ ...S.btn,...S.btnPrimary,marginLeft:'auto',padding:'9px 20px' }}>Save 3 Animals</button>
      </div>
      <div id="bulk-rows" style={{ ...S.card,overflow:'hidden',outline:highlight==='bulk-rows'?'3px solid #c8a060':'none',borderRadius:12,boxShadow:highlight==='bulk-rows'?'0 0 0 8px rgba(200,160,96,0.15)':'none',transition:'all 0.25s' }}>
        <div style={{ display:'flex',gap:8,padding:isMobile?'10px 12px':'12px 16px',borderBottom:'2px solid #e8e0d0',background:'#fdfaf6' }}>
          {(isMobile?['Name *','Sex','Date of Birth']:['Name *','Tag / ID','Sex','Date of Birth','Notes']).map(h=>(
            <div key={h} style={{ flex:h==='Name *'?2:1,fontSize:10,fontWeight:700,color:'#a08060',textTransform:'uppercase',letterSpacing:'0.06em',minWidth:0 }}>{h}</div>
          ))}
          <div style={{ width:24 }}/>
        </div>
        {rows.map((row,idx)=>(
          <div key={idx} style={{ display:'flex',gap:8,padding:isMobile?'8px 12px':'9px 16px',borderBottom:'1px solid #f7f4ef',alignItems:'center',background:idx%2===0?'#fff':'#fdfaf6' }}>
            <div style={{ flex:2,minWidth:0 }}><input style={{ ...inp,borderColor:row.name?'#a5d6a7':'#d0c4b0' }} defaultValue={row.name} placeholder="Name…"/></div>
            {!isMobile&&<div style={{ flex:1,minWidth:0 }}><input style={inp} placeholder="Optional"/></div>}
            <div style={{ flex:1,minWidth:0 }}><input style={inp} defaultValue={row.sex}/></div>
            <div style={{ flex:1,minWidth:0 }}><input style={inp} defaultValue={row.dob} placeholder="mm/dd/yyyy"/></div>
            {!isMobile&&<div style={{ flex:1,minWidth:0 }}><input style={inp} placeholder="Notes…"/></div>}
            <div style={{ width:24,textAlign:'center',color:'#c0a080',fontSize:18,cursor:'pointer' }}>×</div>
          </div>
        ))}
        <div style={{ padding:isMobile?'10px 12px':'12px 16px',borderTop:'1px solid #e8e0d0',display:'flex',alignItems:'center',gap:12,background:'#fdfaf6',flexWrap:'wrap' }}>
          <button style={{ ...S.btn,...S.btnSecondary,padding:'6px 14px',fontSize:13 }}>+ Add Row</button>
          <span style={{ fontSize:12,color:'#a08060' }}>3 of 5 rows filled</span>
          <button style={{ ...S.btn,...S.btnPrimary,marginLeft:'auto' }}>Save 3 Animals</button>
        </div>
      </div>
      <p style={{ fontSize:12,color:'#c8b89a',marginTop:10,textAlign:'center' }}>Your whole existing flock — in the app in minutes.</p>
    </div>
  )
}

function Personalise({ name, setName, species, setSpecies, onStart, isMobile }) {
  const ref=useRef()
  useEffect(()=>{ setTimeout(()=>ref.current?.focus(),300) },[])
  const demo=species==='sheep'?DEMO_SHEEP[0]:DEMO_CHICKENS[0]
  return (
    <div style={{ minHeight:'80vh',display:'flex',alignItems:'center',justifyContent:'center',padding:isMobile?'24px 16px':'40px 24px' }}>
      <div style={{ maxWidth:440,width:'100%' }}>
        <div style={{ textAlign:'center',marginBottom:28 }}>
          <div style={{ fontSize:48,marginBottom:10 }}>🌾</div>
          <h1 style={{ fontFamily:"'Playfair Display',serif",fontSize:isMobile?24:32,fontWeight:700,color:'#f0e6cc',margin:'0 0 10px',lineHeight:1.2 }}>Set up a quick demo farm</h1>
          <p style={{ fontSize:isMobile?14:15,color:'#c8b89a',margin:0,lineHeight:1.6 }}>Tell us what you raise and give one animal a name.</p>
        </div>
        <div style={{ background:'rgba(255,255,255,0.06)',borderRadius:16,padding:isMobile?24:32,border:'1px solid rgba(255,255,255,0.1)' }}>
          <label style={{ fontSize:12,fontWeight:700,color:'#c8a060',textTransform:'uppercase',letterSpacing:'0.1em',display:'block',marginBottom:10 }}>What do you raise?</label>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:20 }}>
            {[['sheep','🐑','Sheep'],['chickens','🐔','Chickens']].map(([k,e,l])=>(
              <button key={k} onClick={()=>setSpecies(k)}
                style={{ padding:'14px',borderRadius:10,border:`2px solid ${species===k?'#c8a060':'rgba(255,255,255,0.15)'}`,background:species===k?'rgba(200,160,96,0.15)':'rgba(255,255,255,0.05)',cursor:'pointer',fontFamily:"'Lato',sans-serif",display:'flex',flexDirection:'column',alignItems:'center',gap:6,transition:'all 0.15s' }}>
                <span style={{ fontSize:28 }}>{e}</span>
                <span style={{ fontSize:14,fontWeight:700,color:species===k?'#f0e6cc':'#c8b89a' }}>{l}</span>
                {species===k&&<span style={{ fontSize:10,color:'#c8a060',fontWeight:700 }}>✓ Selected</span>}
              </button>
            ))}
          </div>
          <label style={{ fontSize:12,fontWeight:700,color:'#c8a060',textTransform:'uppercase',letterSpacing:'0.1em',display:'block',marginBottom:10 }}>
            Name one of your {species==='sheep'?'sheep':'chickens'}
          </label>
          <input ref={ref} value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&onStart()}
            placeholder={species==='sheep'?'e.g. Bella, Daisy, Duke…':'e.g. Goldie, Pepper, Big Red…'}
            style={{ width:'100%',padding:'13px 16px',borderRadius:10,border:`2px solid ${name.trim()?'#c8a060':'rgba(255,255,255,0.15)'}`,background:'rgba(255,255,255,0.07)',fontFamily:"'Lato',sans-serif",fontSize:16,color:'#f0e6cc',outline:'none',boxSizing:'border-box',marginBottom:16,transition:'border-color 0.2s' }}/>
          <div style={{ background:'rgba(200,160,96,0.1)',border:'1px solid rgba(200,160,96,0.25)',borderRadius:10,padding:'12px 14px',marginBottom:18,display:'flex',gap:12,alignItems:'center' }}>
            <div style={{ width:44,height:44,borderRadius:'50%',overflow:'hidden',border:'2px solid #c8a060',flexShrink:0 }}>
              <img src={demo.photo_url} alt={name||demo.name} style={{ width:'100%',height:'100%',objectFit:'cover' }} onError={e=>{ e.target.style.display='none' }}/>
            </div>
            <div>
              <p style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:16,color:'#f0e6cc',margin:'0 0 2px' }}>{name.trim()||demo.name}</p>
              <p style={{ fontSize:12,color:'#c8a878',margin:0 }}>{species==='sheep'?'Merino · Ewe · 4 years old':'Rhode Island Red · Hen · 1 year old'}</p>
            </div>
          </div>
          <button onClick={onStart} style={{ width:'100%',padding:'14px',borderRadius:10,border:'none',cursor:'pointer',fontFamily:"'Lato',sans-serif",fontSize:16,fontWeight:700,background:'#c8a060',color:'#2c2416' }}>Show me the app →</button>
          <button onClick={onStart} style={{ background:'none',border:'none',color:'rgba(255,255,255,0.25)',cursor:'pointer',fontSize:12,fontFamily:"'Lato',sans-serif",display:'block',margin:'10px auto 0',textDecoration:'underline' }}>Skip — use demo data</button>
        </div>
      </div>
    </div>
  )
}

export function DemoPage() {
  const navigate=useNavigate(), isMobile=useIsMobile()
  const [phase,setPhase]=useState('name')
  const [rawName,setRawName]=useState('')
  const [species,setSpecies]=useState('sheep')
  const [step,setStep]=useState(0)
  const name=rawName.trim()||(species==='sheep'?DEMO_SHEEP[0].name:DEMO_CHICKENS[0].name)
  const steps=buildSteps(species), cur=steps[step]
  const next=()=>{ if(cur.isLast) navigate('/'); else setStep(i=>i+1) }
  const skip=()=>navigate('/')

  useEffect(()=>{
    if(phase!=='tour') return
    window.scrollTo({ top:0,behavior:'instant' })
    if(cur.scrollTo){
      const t=setTimeout(()=>{ const el=document.getElementById(cur.scrollTo); if(el) el.scrollIntoView({ behavior:'smooth',block:'center' }) },300)
      return ()=>clearTimeout(t)
    }
  },[step,phase])

  const screens={
    flock:   <FlockScreen    name={name} species={species} highlight={cur.scrollTo} isMobile={isMobile}/>,
    profile: <ProfileScreen  name={name} species={species} highlight={cur.scrollTo} isMobile={isMobile}/>,
    event:   <EventScreen    name={name} species={species} step={cur} highlight={cur.scrollTo} isMobile={isMobile}/>,
    bulk:    <BulkScreen     name={name} species={species} highlight={cur.scrollTo} isMobile={isMobile}/>,
    pnl:     <PnLScreen      name={name} species={species} highlight={cur.scrollTo} isMobile={isMobile}/>,
    dash1:   <DashChartScreen    highlight={cur.scrollTo} isMobile={isMobile}/>,
    dash2:   <DashAnimalsScreen  species={species} highlight={cur.scrollTo} isMobile={isMobile}/>,
    dash3:   <DashDonutsScreen   highlight={cur.scrollTo} isMobile={isMobile}/>,
    dash4:   <DashCustomerPieScreen highlight={cur.scrollTo} isMobile={isMobile}/>,
    plants:  <PlantsScreen       highlight={cur.scrollTo} isMobile={isMobile}/>,
    bulkadd: <BulkAddScreen  name={name} species={species} highlight={cur.scrollTo} isMobile={isMobile}/>,
  }

  if(phase==='name') return (
    <div style={{ minHeight:'100vh',background:'linear-gradient(160deg,#2c2416 0%,#4a3520 50%,#6b4f2e 100%)',fontFamily:"'Lato',sans-serif" }}>
      <div style={{ padding:'12px 20px',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
        <span style={{ fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:'#f0e6cc' }}>🌾 FarmHand</span>
        <button onClick={skip} style={{ background:'none',border:'1px solid rgba(255,255,255,0.15)',color:'rgba(255,255,255,0.5)',borderRadius:6,padding:'5px 12px',cursor:'pointer',fontSize:12,fontFamily:"'Lato',sans-serif" }}>Skip</button>
      </div>
      <Personalise name={rawName} setName={setRawName} species={species} setSpecies={setSpecies} onStart={()=>setPhase('tour')} isMobile={isMobile}/>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh',background:'#f7f4ef',fontFamily:"'Lato',sans-serif",color:'#2c2416',paddingBottom:isMobile?200:160 }}>
      <div style={{ background:'#5a3e1b',padding:'8px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:200 }}>
        <span style={{ fontSize:11,fontWeight:700,color:'#c8a060',textTransform:'uppercase',letterSpacing:'0.06em' }}>🌾 FarmHand · {name}'s Farm</span>
        <button onClick={skip} style={{ background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.15)',color:'#f0e6cc',borderRadius:6,padding:'5px 12px',cursor:'pointer',fontSize:11,fontFamily:"'Lato',sans-serif" }}>Exit</button>
      </div>
      <Nav screen={cur.screen} species={species} isMobile={isMobile}/>
      <div style={{ maxWidth:1100,margin:'0 auto' }}>{screens[cur.screen]||screens.flock}</div>
      <Tip step={cur} stepIdx={step} total={steps.length} onNext={next} onSkip={skip} name={name} isMobile={isMobile}/>
      {cur.scrollTo&&<div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.15)',pointerEvents:'none',zIndex:500 }}/>}
    </div>
  )
}
