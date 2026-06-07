import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useIsMobile } from '../../hooks/useIsMobile'
import { calcAge, formatDate, fmt, STATUS_STYLES, STATUS_DOT, Badge, S, EVENT_COLORS } from '../ui/shared'
import { DEMO_SHEEP, DEMO_CHICKENS, DEMO_HORSES, DEMO_EVENTS, DEMO_COSTS, DEMO_INCOME, DEMO_CUSTOMERS } from './demoData'

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
  const isHorse = animal.species==='horses'
  return (
    <div style={{ width:size,height:size,borderRadius:'50%',overflow:'hidden',background:isChicken?'#fff9e6':isHorse?'#f3ede7':'#f0ebe4',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center' }}>
      {animal.photo_url&&!err
        ?<img src={animal.photo_url} alt={animal.name} style={{ width:'100%',height:'100%',objectFit:'cover' }} onError={()=>setErr(true)}/>
        :isChicken?<span style={{ fontSize:size*0.55 }}>🐔</span>:isHorse?<span style={{ fontSize:size*0.55 }}>🐴</span>:<SheepSVG sex={animal.sex} size={size*0.9}/>
      }
    </div>
  )
}

const DEMO_SPECIES = {
  sheep: { emoji:'🐑', label:'Sheep', singular:'Sheep', group:'flock', animals:DEMO_SHEEP, defaultName:'Bella', sub:'Merino · Suffolk · Dorset' },
  chickens: { emoji:'🐔', label:'Chickens', singular:'Chicken', group:'chickens', animals:DEMO_CHICKENS, defaultName:'Goldie', sub:'Layers · Broilers · Mixed' },
  horses: { emoji:'🐴', label:'Horses', singular:'Horse', group:'herd', animals:DEMO_HORSES, defaultName:'Willow', sub:'Mares · Geldings · Foals' },
}

const demoMeta = (species) => DEMO_SPECIES[species] || DEMO_SPECIES.sheep
const demoAnimals = (species) => demoMeta(species).animals

function buildSteps(species) {
  const isSheep = species==='sheep'
  const isHorse = species==='horses'
  const animal  = isSheep ? 'sheep' : isHorse ? 'horse' : 'chicken'
  const flock   = isSheep ? 'flock' : isHorse ? 'herd' : 'chickens'
  const eventExamples = isSheep ? 'lambing, shearing' : isHorse ? 'farrier visits, dental floats, training sessions' : 'egg production, moulting'
  const lineageTip = isSheep
    ? 'Before breeding season, check here. FarmHand shows who\'s related to who across 4 generations — and flags shared ancestors automatically. This used to cost thousands in herd management software.'
    : isHorse
      ? 'Track sire and dam lines across 4 generations. FarmHand keeps pedigrees clear and flags shared ancestors before you make breeding decisions.'
      : 'Track your rooster\'s bloodlines across hatches. 4 generations, built automatically as you record sires and hens.'
  const pnlExamples = isSheep ? 'wool sales, lamb sales, feed bills' : isHorse ? 'training income, farrier costs, feed bills' : 'egg sales, feed costs'
  return [
    {
      screen:'hero_profiles',
      label:'Animal Profiles',
      tip:`Every ${animal} on your farm — photo, status, breed, age — in one place. No more trying to remember which one had the bad leg last spring.`,
    },
    {
      screen:'hero_events',
      label:'Health Timeline',
      tip:`Every health event logged with a date, notes, and a photo. Vaccinations, ${eventExamples} — all searchable. Your whole history, never lost.`,
    },
    {
      screen:'hero_lineage',
      label:'Bloodlines',
      tip: lineageTip,
    },
    {
      screen:'hero_pnl',
      label:'Profit & Loss',
      tip:`Every dollar in and out — ${pnlExamples} — tracked as you go. See exactly what your farm makes. No spreadsheet needed.`,
    },
    {
      screen:'hero_dashboard',
      label:'Dashboard',
      tip:`Income vs expenses at a glance. See your trends by month, by animal type, by customer. Know what's working before it's too late to act on it.`,
    },
    {
      screen:'hero_bulkadd',
      label:'Quick Setup',
      tip:`Getting started? Add your whole ${flock} in one go — name, breed, date of birth. Most farms are set up in under 10 minutes. Ready to try it on your real farm?`,
      isLast: true,
    },
  ]
}

function Nav({ screen, species, isMobile, onExit, name }) {
  const meta = demoMeta(species)
  const labels = {
    hero_profiles: `${meta.emoji} ${meta.label}`,
    hero_events:   `${meta.emoji} Health Timeline`,
    hero_lineage:  '🌳 Lineage',
    hero_pnl:      '💰 Profit & Loss',
    hero_dashboard:'📊 Dashboard',
    hero_bulkadd:  '⚡ Quick Setup',
  }
  const activeLabel = labels[screen] || '🌾 FarmHand'
  return (
    <div style={{ background:'#12251c', height:isMobile?38:42,
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'0 16px', flexShrink:0, position:'sticky', top:0, zIndex:200 }}>
      <span style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?14:16,
        fontWeight:700, color:'#f0e6cc' }}>🌾 FarmHand</span>
      <span style={{ fontSize:11, color:'#c8a060', fontWeight:600 }}>{activeLabel}</span>
      {onExit
        ? <button onClick={onExit}
            style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)',
              color:'#f0e6cc', borderRadius:6, padding:'4px 12px', cursor:'pointer',
              fontSize:11, fontFamily:"'Lato',sans-serif" }}>Exit</button>
        : <span style={{ fontSize:10, color:'#6a5040' }}>demo</span>
      }
    </div>
  )
}

function Tip({ step, stepIdx, total, onNext, onSkip, name, isMobile }) {
  const text    = (step.tip||'').replace(/{name}/g,name)
  const isLast  = !!step.isLast
  const [idle,  setIdle]    = useState(0)   // seconds since last Next tap
  const [pulse, setPulse]   = useState(false)
  const idleRef = useRef(null)
  const ready = idle >= 5

  // Reset idle counter whenever step changes
  useEffect(()=>{
    setIdle(0); setPulse(false)
    clearInterval(idleRef.current)
    idleRef.current = setInterval(()=>{
      setIdle(prev=>{
        const next = prev + 1
        if (next >= 5) setPulse(true)   // start pulsing after the reminder delay
        return next
      })
    }, 1000)
    return ()=>clearInterval(idleRef.current)
  }, [stepIdx])

  const handleNext = ()=>{ setIdle(0); setPulse(false); onNext() }

  return (
    <>
      {/* Tooltip card */}
      <div style={{ position:isMobile?'fixed':'sticky', bottom:isMobile?'calc(14px + env(safe-area-inset-bottom))':undefined,
        top:isMobile?undefined:72, left:isMobile?'50%':undefined, transform:isMobile?'translateX(-50%)':undefined,
        width:isMobile?'calc(100% - 24px)':'340px', maxWidth:'95vw', background:'#12251c',
        borderRadius:12, padding:isMobile?'14px 16px':'18px 18px', boxShadow:'0 12px 34px rgba(8,28,18,0.3)',
        zIndex:1000, border:`1px solid ${pulse?'rgba(91,190,139,0.7)':'rgba(255,255,255,0.1)'}`,
        transition:'border-color 0.3s',
        animation: pulse ? 'tipPulse 1.8s ease-in-out infinite' : 'none',
      }}>
        <style>{`
          @keyframes tipPulse {
            0%,100% { box-shadow: 0 8px 32px rgba(0,0,0,0.28); }
            50%      { box-shadow: 0 8px 32px rgba(0,0,0,0.28), 0 0 0 4px rgba(200,160,96,0.24); }
          }
          @keyframes nextPulse {
            0%,100% { transform: scale(1); }
            50%      { transform: scale(1.025); }
          }
          @keyframes readyNudgeIn {
            from { opacity:0; transform:translateY(4px) scale(0.96); }
            to   { opacity:1; transform:translateY(0) scale(1); }
          }
          @keyframes readyNudgePulse {
            0%,100% { box-shadow:0 0 0 0 rgba(226,176,95,0.4), 0 6px 16px rgba(226,176,95,0.24); }
            50% { box-shadow:0 0 0 7px rgba(226,176,95,0.14), 0 9px 22px rgba(226,176,95,0.34); }
          }
          @keyframes readyCuePulse {
            0%,100% { opacity:0.72; transform:translateX(0); }
            50% { opacity:1; transform:translateX(4px); }
          }
          @keyframes heroFadeIn {
            from { opacity:0; transform:translateY(14px); }
            to   { opacity:1; transform:translateY(0); }
          }
          @media (min-width: 768px) {
            .demo-animal-strip {
              scrollbar-width: thin;
              scrollbar-color: rgba(240,230,204,0.34) rgba(255,255,255,0.07);
            }
            .demo-animal-strip::-webkit-scrollbar { height: 6px; }
            .demo-animal-strip::-webkit-scrollbar-track {
              background: rgba(255,255,255,0.07);
              border-radius: 999px;
            }
            .demo-animal-strip::-webkit-scrollbar-thumb {
              background: rgba(240,230,204,0.34);
              border-radius: 999px;
            }
            .demo-animal-strip::-webkit-scrollbar-thumb:hover {
              background: rgba(240,230,204,0.48);
            }
          }
        `}</style>

        {/* Progress dots + counter */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
          <div style={{ display:'flex', gap:3, flex:1 }}>
            {Array.from({length:total},(_,i)=>(
              <div key={i} style={{ height:3, borderRadius:2, flex:1,
                background:i<=stepIdx?'#55b887':'rgba(255,255,255,0.1)',
                transition:'background 0.3s' }}/>
            ))}
          </div>
          <span style={{ fontSize:10, color:'#91cbae', fontWeight:700,
            letterSpacing:'0.05em', whiteSpace:'nowrap' }}>
            {stepIdx+1} / {total}
          </span>
        </div>

        {/* Feature name */}
        {step.label && (
          <p style={{ fontSize:11, fontWeight:700, color:'#77c49e', textTransform:'uppercase',
            letterSpacing:'0.09em', margin:'0 0 7px' }}>
            {step.label}
          </p>
        )}

        <p style={{ fontSize:14, color:'#edf5f0', margin:'0 0 12px', lineHeight:1.6 }}>{text}</p>

        {isLast ? (
          /* Last step — full-width green CTA */
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <button onClick={handleNext}
              style={{ width:'100%', padding:'14px', borderRadius:10, border:'none',
                cursor:'pointer', fontFamily:"'Lato',sans-serif", fontSize:16, fontWeight:700,
                background:'#21845a', color:'#fff',
                boxShadow:'0 4px 16px rgba(33,132,90,0.35)',
                animation: pulse ? 'nextPulse 1.8s ease-in-out infinite' : 'none' }}>
              🌾 Get Started Free
            </button>
            <button onClick={onSkip} style={{ background:'none', border:'none',
              color:'rgba(255,255,255,0.25)', cursor:'pointer', fontSize:11,
              fontFamily:"'Lato',sans-serif", padding:0, textAlign:'center', width:'100%' }}>
              Skip — I'll create my account later
            </button>
          </div>
        ) : (
          /* Mid-tour — skip left, Next right */
          <div style={{ position:'relative', display:'flex', alignItems:'center', gap:8, minHeight:40 }}>
            <button onClick={onSkip} style={{ background:'none', border:'none',
              color:'rgba(255,255,255,0.3)', cursor:'pointer', fontSize:12,
              fontFamily:"'Lato',sans-serif", padding:0 }}>
              Skip tour
            </button>
            <div style={{ flex:1 }}/>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
              <span aria-hidden="true" style={{
                width:18,
                display:'inline-flex',
                alignItems:'center',
                justifyContent:'center',
                color:'#f0c16e',
                fontSize:18,
                fontWeight:700,
                opacity:ready?1:0,
                visibility:ready?'visible':'hidden',
                transition:'opacity 0.2s ease, visibility 0.2s ease',
                animation:ready?'readyCuePulse 1.1s ease-in-out infinite':'none',
              }}>
                →
              </span>
              <button onClick={handleNext}
                aria-label="Continue tour"
                tabIndex={ready ? 0 : -1}
                style={{
                ...S.btn,
                display:'inline-flex',
                alignItems:'center',
                justifyContent:'center',
                minWidth:isMobile?114:126,
                height:36,
                padding:'9px 16px',
                borderRadius:8,
                background:ready?'#d8f1e5':'transparent',
                border:`1px solid ${ready?'rgba(119,196,158,0.8)':'transparent'}`,
                color:ready?'#123d2b':'transparent',
                fontSize:14,
                fontWeight:700,
                fontFamily:"'Lato',sans-serif",
                whiteSpace:'nowrap',
                opacity:ready?1:0,
                visibility:ready?'visible':'hidden',
                transition:'opacity 0.2s ease, visibility 0.2s ease',
                pointerEvents:ready?'auto':'none',
                cursor:ready?'pointer':'default',
                boxShadow:ready?'0 5px 14px rgba(226,176,95,0.18)':'none',
                animation:ready?'readyNudgeIn 0.24s ease-out, readyNudgePulse 2s ease-in-out 0.24s infinite':'none',
              }}>
                Ready? Continue
              </button>
              <button onClick={handleNext}
                aria-label={ready?'Continue tour':'Next tour step'}
                style={{ ...S.btn,
                  background:ready?'#55b887':'#21845a',
                  color:'#fff', fontWeight:700,
                  height:36, padding:'9px 22px', fontSize:14, borderRadius:8,
                  boxShadow:ready?'0 0 0 1px rgba(200,160,96,0.22), 0 6px 18px rgba(200,160,96,0.28)':'none',
                  transition:'background 0.2s ease, box-shadow 0.2s ease',
                  animation: pulse ? 'nextPulse 1.8s ease-in-out infinite' : 'none' }}>
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function FlockScreen({ name, species, highlight, isMobile }) {
  const meta = demoMeta(species)
  const animals  = demoAnimals(species)
  const isSheep  = species==='sheep'
  const display  = animals.map((a,i) => i===0 ? {...a, name} : a)
  const active   = display.filter(a => a.status==='alive' || a.status==='rented')
  const inactive = display.filter(a => a.status!=='alive' && a.status!=='rented')
  const hero     = [...active, ...inactive]
  const [filter, setFilter] = useState('alive')
  const listItems = filter==='alive' ? active : filter==='sold' ? display.filter(a=>a.status==='sold') : filter==='deceased' ? display.filter(a=>a.status==='deceased') : display

  return (
    <div>
      <div style={{ background:'#12251c', width:'100%' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:isMobile?'18px 14px 0':'28px 24px 0' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div>
                <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?24:34, fontWeight:700, color:'#f0e6cc', margin:'0 0 3px' }}>{meta.emoji} Your {meta.label}</h1>
                <p style={{ fontSize:12, color:'#a08060', margin:0 }}>{active.length} active{inactive.length>0?` · ${inactive.filter(a=>a.status==='sold').length} sold`:''}</p>
              </div>
              <div style={{ background:'rgba(200,160,96,0.2)', border:'1px solid rgba(200,160,96,0.4)', borderRadius:12, padding:isMobile?'8px 12px':'10px 16px', textAlign:'center', flexShrink:0 }}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?22:28, fontWeight:700, color:'#c8a060', lineHeight:1 }}>{active.length}</div>
                <div style={{ fontSize:9, color:'#a08060', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginTop:2 }}>Active</div>
              </div>
            </div>
            <button style={{ ...S.btn, background:'#c8a060', color:'#2c2416', fontWeight:700, padding:'9px 16px', fontSize:13, flexShrink:0 }}>+ Add {meta.singular}</button>
          </div>
          {/* Hero strip — active first, inactive greyed with red dot */}
          <div className="demo-animal-strip" style={{ display:'flex', gap:isMobile?10:14, paddingBottom:20, overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
            {hero.map(a => {
              const isInactive = a.status!=='alive' && a.status!=='rented'
              return (
                <div key={a.id} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flexShrink:0, opacity:isInactive?0.45:1 }}>
                  <div style={{ position:'relative' }}>
                    <div style={{ width:isMobile?50:60, height:isMobile?50:60, borderRadius:'50%', overflow:'hidden', border:`3px solid ${isInactive?'#666':(STATUS_DOT[a.status]||'#9e9e9e')}`, filter:isInactive?'grayscale(0.7)':'none' }}>
                      <Avatar animal={a} size={isMobile?50:60}/>
                    </div>
                    <div style={{ width:9, height:9, borderRadius:'50%', background:isInactive?'#c62828':(STATUS_DOT[a.status]||'#9e9e9e'), position:'absolute', bottom:1, right:1, border:'2px solid #2c2416' }}/>
                  </div>
                  <span style={{ fontSize:9, fontWeight:700, color:isInactive?'#6a5040':'#c8a878', textTransform:'uppercase', whiteSpace:'nowrap', maxWidth:60, overflow:'hidden', textOverflow:'ellipsis', textAlign:'center' }}>{a.name}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <div style={{ maxWidth:1100, margin:'0 auto', padding:isMobile?'12px':'16px 24px' }}>
        <div style={{ display:'flex', gap:6, marginBottom:12, flexWrap:'wrap' }}>
          {[['alive',`Active ${active.length}`],['all',`All ${display.length}`],...(inactive.filter(a=>a.status==='sold').length>0?[['sold',`Sold ${inactive.filter(a=>a.status==='sold').length}`]]:[])].map(([k,l])=>(
            <button key={k} onClick={()=>setFilter(k)} style={{ ...S.btn, padding:'5px 12px', fontSize:12, background:filter===k?'#5a3e1b':'#fff', color:filter===k?'#fff':'#7a6648', border:'1px solid #d0c4b0' }}>{l}</button>
          ))}
        </div>
        {listItems.map((a,i) => {
          const st = STATUS_STYLES[a.status]||STATUS_STYLES.alive
          const isActive = a.status==='alive'||a.status==='rented'
          const isYours  = i===0 && filter==='alive'
          const sexLabel = { ewe:'Ewe', ram:'Ram', wether:'Wether', hen:'Hen', rooster:'Rooster', chick:'Chick', mare:'Mare', stallion:'Stallion', gelding:'Gelding', foal:'Foal' }[a.sex] || a.sex
          const sub = `${sexLabel} · ${a.breed} · ${calcAge(a.birth_date)}`
          return (
            <div key={a.id} id={isYours?'your-animal':undefined}
              style={{ ...S.card, padding:isMobile?'10px 12px':'14px 18px', marginBottom:8, display:'flex', gap:12, alignItems:'center', cursor:'pointer',
                opacity:!isActive?0.65:1,
                outline:highlight==='your-animal'&&isYours?'3px solid #c8a060':'none',
                boxShadow:highlight==='your-animal'&&isYours?'0 0 0 6px rgba(200,160,96,0.2)':'none', transition:'all 0.25s' }}>
              <div style={{ width:isMobile?44:52, height:isMobile?44:52, borderRadius:'50%', overflow:'hidden', border:'2px solid #e8e0d0', flexShrink:0, filter:!isActive?'grayscale(0.5)':'none' }}>
                <Avatar animal={a} size={isMobile?44:52}/>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
                  <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:isMobile?14:16, margin:0 }}>{a.name}</p>
                  <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10, background:st.bg, color:st.text, textTransform:'uppercase' }}>{a.status}</span>
                </div>
                <p style={{ fontSize:11, color:'#a08060', margin:0 }}>{sub}</p>
              </div>
              <span style={{ color:'#c8b89a', fontSize:18 }}>›</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ProfileScreen({ name, species, highlight, isMobile }) {
  const isSheep  = species==='sheep'
  const animal   = {...(isSheep?DEMO_SHEEP[0]:DEMO_CHICKENS[0]), name}

  const events = isSheep ? [
    { id:'e1', event_type:'sickness',      event_date:'2024-09-14', notes:'Limping on left front. Penicillin 3ml. Monitor 5 days.', photo_url:null },
    { id:'e2', event_type:'lambing',       event_date:'2024-04-02', notes:'Twins born — Rosie and Clover. Both healthy, strong latches.', photo_url:DEMO_SHEEP[2]?.photo_url||null },
    { id:'e3', event_type:'shearing',      event_date:'2024-05-15', notes:'Fleece 4.2kg. Good staple length.', photo_url:null },
    { id:'e4', event_type:'vaccination',   event_date:'2024-03-10', notes:'Annual CD&T booster.', photo_url:null },
    { id:'e5', event_type:'hoof_trimming', event_date:'2023-11-20', notes:'All four hooves. No issues.', photo_url:null },
  ] : [
    { id:'e1', event_type:'egg_production', event_date:'2025-01-15', notes:'Averaging 6 eggs/week through winter. Consistent layer.', photo_url:null },
    { id:'e2', event_type:'vaccination',    event_date:'2024-11-10', notes:'Newcastle disease vaccine. Group treatment.', photo_url:null },
    { id:'e3', event_type:'moulting',       event_date:'2024-10-01', notes:'Moulting started. Egg production dipped ~3 weeks.', photo_url:null },
    { id:'e4', event_type:'sickness',       event_date:'2024-08-20', notes:'Lethargic, not eating. Recovered after 2 days — heat stress.', photo_url:null },
  ]

  const monthGroups = events.reduce((acc, ev) => {
    const d   = new Date(ev.event_date+'T00:00:00')
    const key = d.toLocaleDateString('en-US',{month:'long',year:'numeric'})
    if (!acc[key]) acc[key] = []
    acc[key].push(ev)
    return acc
  }, {})

  const EVENT_ICONS = { vaccination:'💉', worming:'💊', hoof_trimming:'🪛', shearing:'✂️', lambing:'🐣', sickness:'🤒', injury:'🩹', egg_production:'🥚', moulting:'🪶', breeding:'❤️', weight_check:'⚖️', custom:'📝' }
  const EC = { vaccination:{color:'#1565c0',bg:'#e3f2fd',border:'#90caf9'}, worming:{color:'#6a1b9a',bg:'#f3e5f5',border:'#ce93d8'}, hoof_trimming:{color:'#4e342e',bg:'#efebe9',border:'#bcaaa4'}, shearing:{color:'#2e7d32',bg:'#e8f5e9',border:'#a5d6a7'}, lambing:{color:'#e65100',bg:'#fff3e0',border:'#ffcc80'}, sickness:{color:'#c62828',bg:'#fff3f3',border:'#f5c6c6'}, egg_production:{color:'#f57f17',bg:'#fff9e6',border:'#ffe082'}, moulting:{color:'#5d4037',bg:'#efebe9',border:'#bcaaa4'} }

  function TimelineEvent({ ev }) {
    const [expanded, setExpanded] = useState(false)
    const [imgErr,   setImgErr]   = useState(false)
    const em    = EVENT_ICONS[ev.event_type] || '📝'
    const ec    = EC[ev.event_type] || { color:'#5a3e1b', bg:'#fdfaf6', border:'#d0c4b0' }
    const isAlert = ev.event_type==='sickness'||ev.event_type==='injury'
    const d     = new Date(ev.event_date+'T00:00:00')
    const day   = d.getDate()
    const mon   = d.toLocaleDateString('en-US',{month:'short'})
    const label = ev.event_type.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())
    const hasPhoto = ev.photo_url && !imgErr

    return (
      <div style={{ display:'flex', gap:0, position:'relative', marginBottom:4 }}>
        {/* Date */}
        <div style={{ width:isMobile?44:52, flexShrink:0, paddingTop:4, textAlign:'center' }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?15:19, fontWeight:700, color:'#2c2416', lineHeight:1 }}>{day}</div>
          <div style={{ fontSize:9, fontWeight:700, color:'#a08060', textTransform:'uppercase' }}>{mon}</div>
        </div>
        {/* Icon */}
        <div style={{ width:isMobile?44:52, flexShrink:0, display:'flex', justifyContent:'center', paddingTop:2, zIndex:1 }}>
          {hasPhoto ? (
            <div onClick={()=>setExpanded(v=>!v)} style={{ width:isMobile?38:46, height:isMobile?38:46, borderRadius:9, overflow:'hidden', border:`2px solid ${ec.border}`, cursor:'pointer' }}>
              <img src={ev.photo_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={()=>setImgErr(true)} alt={label}/>
            </div>
          ) : (
            <div onClick={()=>setExpanded(v=>!v)}
              style={{ width:isMobile?38:46, height:isMobile?38:46, borderRadius:9, background:ec.bg, border:`2px solid ${ec.border}`,
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:isMobile?17:21,
                cursor:'pointer', boxShadow:isAlert?'0 0 0 3px rgba(198,40,40,0.2)':'none' }}>
              {em}
            </div>
          )}
        </div>
        {/* Content */}
        <div style={{ flex:1, paddingLeft:isMobile?10:14, paddingBottom:16, minWidth:0 }}>
          <div onClick={()=>setExpanded(v=>!v)}
            style={{ cursor:'pointer', background:expanded?ec.bg:'transparent',
              border:expanded?`1px solid ${ec.border}`:'1px solid transparent',
              borderRadius:10, padding:expanded?(isMobile?'10px 12px':'12px 16px'):'4px 0',
              transition:'all 0.2s' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
              <span style={{ fontSize:isMobile?12:13, fontWeight:700, color:ec.color }}>{label}</span>
              {isAlert && <span style={{ fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:8, background:'#c62828', color:'#fff', textTransform:'uppercase' }}>⚠ Alert</span>}
              <span style={{ fontSize:11, color:'#a08060', marginLeft:'auto' }}>{expanded?'▲':'▾'}</span>
            </div>
            {!expanded && ev.notes && (
              <p style={{ fontSize:12, color:'#7a6648', margin:'3px 0 0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ev.notes}</p>
            )}
            {expanded && (
              <div style={{ marginTop:10 }}>
                {ev.notes && <p style={{ fontSize:13, color:'#4a3c28', margin:'0 0 8px', lineHeight:1.6 }}>{ev.notes}</p>}
                {hasPhoto && <div style={{ borderRadius:8, overflow:'hidden', marginBottom:8, maxWidth:260 }}><img src={ev.photo_url} style={{ width:'100%', height:'auto' }} alt={label} onError={()=>setImgErr(true)}/></div>}
              </div>
            )}
          </div>
          {!expanded && !hasPhoto && (
            <span style={{ fontSize:10, color:'#c8b89a', fontStyle:'italic', cursor:'pointer', opacity:0.7 }}>📷 add photo</span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ background:'#12251c', width:'100%' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:isMobile?'14px 14px 20px':'22px 24px 28px' }}>
          <button style={{ ...S.btn,background:'rgba(255,255,255,0.1)',color:'#f0e6cc',border:'1px solid rgba(255,255,255,0.2)',padding:'6px 12px',fontSize:12,marginBottom:14 }}>
            ← {isSheep?'Flock':'Chickens'}
          </button>
          <div style={{ display:'flex', gap:isMobile?12:18, alignItems:'flex-start' }}>
            <div style={{ width:isMobile?64:80, height:isMobile?64:80, borderRadius:'50%', overflow:'hidden', border:'3px solid rgba(255,255,255,0.25)', flexShrink:0 }}>
              <Avatar animal={animal} size={isMobile?64:80}/>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?20:28, fontWeight:700, color:'#f0e6cc', margin:0 }}>{name}</h1>
                <span style={{ padding:'3px 10px', borderRadius:20, fontSize:10, fontWeight:700, background:'#4caf50', color:'#fff', textTransform:'uppercase' }}>alive</span>
              </div>
              <p style={{ fontSize:12, color:'#c8a878', margin:'0 0 8px', fontStyle:'italic' }}>
                {isSheep?'Merino · Ewe · TAG-001':'Rhode Island Red · Hen · CHK-001'}
              </p>
              <div style={{ display:'flex', gap:isMobile?12:20, flexWrap:'wrap' }}>
                {[['Age',calcAge(isSheep?'2021-03-15':'2023-06-01')],['Events',events.length+'']].map(([l,v])=>(
                  <div key={l}><p style={{ fontSize:9,color:'#7a6040',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',margin:'0 0 1px' }}>{l}</p><p style={{ fontSize:12,color:'#c8a878',margin:0 }}>{v}</p></div>
                ))}
              </div>
            </div>
            {!isMobile&&(
              <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                {isSheep&&<button style={{ ...S.btn, background:'rgba(76,175,80,0.2)', color:'#a5d6a7', border:'1px solid rgba(76,175,80,0.35)', padding:'7px 14px', fontSize:13, fontWeight:700 }}>🌳 Lineage</button>}
                <button style={{ ...S.btn,background:'rgba(255,255,255,0.1)',color:'#f0e6cc',border:'1px solid rgba(255,255,255,0.2)',padding:'7px 14px',fontSize:13 }}>Edit</button>
              </div>
            )}
          </div>
          {isMobile&&(
            <div style={{ marginTop:12, display:'flex', gap:8 }}>
              {isSheep&&<button style={{ ...S.btn,flex:1,justifyContent:'center',background:'rgba(76,175,80,0.2)',color:'#a5d6a7',border:'1px solid rgba(76,175,80,0.35)',fontWeight:700 }}>🌳 Lineage</button>}
              <button style={{ ...S.btn,flex:1,justifyContent:'center',background:'rgba(255,255,255,0.1)',color:'#f0e6cc',border:'1px solid rgba(255,255,255,0.2)' }}>✎ Edit</button>
            </div>
          )}
        </div>
      </div>
      <div style={{ maxWidth:1100, margin:'0 auto', padding:isMobile?'12px 12px':'16px 24px' }}>
        {/* Mini lineage */}
        {isSheep && (
          <div style={{ ...S.card, padding:isMobile?'12px 14px':'16px 20px', marginBottom:14 }}>
            <div style={{ display:'flex', alignItems:'center', marginBottom:12 }}>
              <span style={{ fontSize:10, fontWeight:700, color:'#a08060', textTransform:'uppercase', letterSpacing:'0.06em' }}>🌳 Lineage</span>
              <button style={{ ...S.btn, marginLeft:'auto', background:'#f0ebe4', color:'#5a3e1b', border:'1px solid #d0c4b0', padding:'5px 10px', fontSize:11, fontWeight:600 }}>View Full Tree →</button>
            </div>
            <div style={{ display:'flex', gap:14, alignItems:'center' }}>
              {[['Duke','Sire',DEMO_SHEEP[1]],['Iris','Dam',null]].map(([pname,role,a])=>(
                <div key={role} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                  <div style={{ width:38, height:38, borderRadius:'50%', overflow:'hidden', border:'2px solid #e8e0d0', background:'#f0ebe4' }}>
                    {a?<Avatar animal={a} size={38}/>:<div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🐑</div>}
                  </div>
                  <span style={{ fontSize:8, fontWeight:700, color:'#2c2416', textTransform:'uppercase' }}>{pname}</span>
                  <span style={{ fontSize:7, color:'#a08060' }}>{role}</span>
                </div>
              ))}
              <span style={{ fontSize:16, color:'#c8b89a' }}>→</span>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                <div style={{ width:42, height:42, borderRadius:'50%', overflow:'hidden', border:'3px solid #c8a060', background:'#f0ebe4' }}>
                  <Avatar animal={animal} size={42}/>
                </div>
                <span style={{ fontSize:8, fontWeight:700, color:'#2c2416', textTransform:'uppercase' }}>{name}</span>
                <span style={{ fontSize:7, color:'#c8a060', fontWeight:700 }}>This Animal</span>
              </div>
            </div>
          </div>
        )}
        {/* Timeline */}
        <div id="events" style={{ ...S.card, padding:isMobile?'14px 12px':'22px 24px',
          outline:highlight==='events'?'3px solid #c8a060':'none',
          boxShadow:highlight==='events'?'0 0 0 8px rgba(200,160,96,0.15)':'none',
          borderRadius:10, transition:'all 0.25s' }}>
          <div style={{ display:'flex', alignItems:'center', marginBottom:18 }}>
            <div>
              <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:16, margin:'0 0 1px' }}>Health Timeline</p>
              <p style={{ fontSize:12, color:'#a08060', margin:0 }}>{events.length} events recorded</p>
            </div>
            <button style={{ ...S.btn, ...S.btnPrimary, marginLeft:'auto', padding:isMobile?'8px 14px':'9px 18px', fontSize:12 }}>+ Log Event</button>
          </div>
          {Object.entries(monthGroups).map(([month, monthEvents]) => (
            <div key={month} style={{ marginBottom:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12, padding:'4px 0' }}>
                <span style={{ fontSize:10, fontWeight:700, color:'#a08060', textTransform:'uppercase', letterSpacing:'0.08em', whiteSpace:'nowrap' }}>{month}</span>
                <div style={{ flex:1, height:1, background:'#e8e0d0' }}/>
                <span style={{ fontSize:10, color:'#c8b89a' }}>{monthEvents.length}</span>
              </div>
              <div style={{ position:'relative' }}>
                <div style={{ position:'absolute', left:isMobile?66:78, top:0, bottom:0, width:2, background:'linear-gradient(to bottom,#e8e0d0,#f7f4ef)', borderRadius:1 }}/>
                {monthEvents.map(ev => <TimelineEvent key={ev.id} ev={ev}/>)}
              </div>
            </div>
          ))}
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
      <div style={{ background:'#12251c',width:'100%' }}>
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

// ─── LINEAGE DEMO SCREEN ──────────────────────────────────────────────────────
// Full 4-generation tree — top=great-grandparents, bottom=animal. Species-aware.
function LineageDemoScreen({ name, species, highlight, isMobile }) {
  const isSheep  = species !== 'chickens'
  const sexBg    = isSheep
    ? { ram:'#5d4037', ewe:'#a1887f', wether:'#d7ccc8' }
    : { rooster:'#c62828', hen:'#f9a825', chick:'#ffcc80' }

  // ── Sheep tree ──
  const sheepTree = {
    name, breed:'Merino', sex:'ewe', status:'alive', photo: DEMO_SHEEP[0].photo_url,
    sire: {
      name:'Duke', breed:'Dorset', sex:'ram', status:'alive', photo: DEMO_SHEEP[1].photo_url,
      sire: {
        name:'Magnus', breed:'Dorset', sex:'ram', status:'deceased', photo:null,
        sire: { name:'Old Rex',    breed:'Dorset', sex:'ram', status:'deceased', photo:null },
        dam:  { name:'Heather',    breed:'Dorset', sex:'ewe', status:'deceased', photo:null },
      },
      dam: {
        name:'Fern', breed:'Merino', sex:'ewe', status:'sold', photo:null,
        sire: { name:'Brook',      breed:'Merino', sex:'ram', status:'deceased', photo:null },
        dam:  { name:'Clementine', breed:'Merino', sex:'ewe', status:'deceased', photo:null },
      },
    },
    dam: {
      name:'Iris', breed:'Merino', sex:'ewe', status:'alive', photo:null,
      sire: {
        name:'Chester', breed:'Suffolk', sex:'ram', status:'sold', photo:null,
        sire: { name:'Grayson',   breed:'Suffolk', sex:'ram', status:'deceased', photo:null },
        dam:  { name:'Pippa',     breed:'Suffolk', sex:'ewe', status:'deceased', photo:null },
      },
      dam: {
        name:'Pearl', breed:'Merino', sex:'ewe', status:'deceased', photo:null,
        sire: { name:'Victor',    breed:'Merino', sex:'ram', status:'deceased', photo:null },
        dam:  { name:'Dolly',     breed:'Merino', sex:'ewe', status:'deceased', photo:null },
      },
    },
  }

  // ── Chicken tree ──
  const chickenTree = {
    name, breed:'Rhode Island Red', sex:'hen', status:'alive', photo: DEMO_CHICKENS[0].photo_url,
    sire: {
      name:'Redford', breed:'Rhode Island Red', sex:'rooster', status:'alive', photo: DEMO_CHICKENS[1]?.photo_url||null,
      sire: {
        name:'Colonel', breed:'Rhode Island Red', sex:'rooster', status:'deceased', photo:null,
        sire: { name:'General',  breed:'RIR',     sex:'rooster', status:'deceased', photo:null },
        dam:  { name:'Henrietta',breed:'RIR',     sex:'hen',     status:'deceased', photo:null },
      },
      dam: {
        name:'Maple', breed:'Buff Orpington', sex:'hen', status:'sold', photo:null,
        sire: { name:'Biscuit',  breed:'Buff Orp',sex:'rooster', status:'deceased', photo:null },
        dam:  { name:'Butternut',breed:'Buff Orp',sex:'hen',     status:'deceased', photo:null },
      },
    },
    dam: {
      name:'Goldie', breed:'Buff Orpington', sex:'hen', status:'alive', photo: DEMO_CHICKENS[2]?.photo_url||null,
      sire: {
        name:'Rex', breed:'Plymouth Rock', sex:'rooster', status:'sold', photo:null,
        sire: { name:'Rocky',    breed:'Plymouth',sex:'rooster', status:'deceased', photo:null },
        dam:  { name:'Pebble',   breed:'Plymouth',sex:'hen',     status:'deceased', photo:null },
      },
      dam: {
        name:'Clover', breed:'Buff Orpington', sex:'hen', status:'deceased', photo:null,
        sire: { name:'Sunny',    breed:'Buff Orp',sex:'rooster', status:'deceased', photo:null },
        dam:  { name:'Daisy',    breed:'Buff Orp',sex:'hen',     status:'deceased', photo:null },
      },
    },
  }

  const tree = isSheep ? sheepTree : chickenTree

  function getRow(node, depth, maxDepth) {
    if (depth === maxDepth) return [node || null]
    if (!node) return Array(Math.pow(2, maxDepth - depth)).fill(null)
    return [...getRow(node.sire, depth+1, maxDepth), ...getRow(node.dam, depth+1, maxDepth)]
  }

  const rows = [
    { label:'Great-Grandparents', nodes: getRow(tree, 0, 3) },
    { label:'Grandparents',       nodes: getRow(tree, 0, 2) },
    { label:'Parents',            nodes: getRow(tree, 0, 1) },
    { label:'Your Animal',        nodes: [tree] },
  ]

  const nodeW  = isMobile ? 58 : 72
  const gapX   = isMobile ? 4  : 8
  const connH  = isMobile ? 22 : 30
  const totalW = 8 * nodeW + 7 * gapX

  function DemoNode({ node, isRoot }) {
    const sz = isRoot ? (isMobile?50:62) : (isMobile?34:42)
    if (!node) return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, opacity:0.3 }}>
        <div style={{ width:sz, height:sz, borderRadius:'50%', border:'2px dashed #c8b89a', background:'#f7f4ef', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>?</div>
        <span style={{ fontSize:7, color:'#a08060', fontStyle:'italic' }}>Unknown</span>
      </div>
    )
    const sb  = sexBg[node.sex] || (isSheep ? '#d7ccc8' : '#ffcc80')
    const em  = isSheep ? (node.sex==='ram'?'🐏':'🐑') : (node.sex==='rooster'?'🐓':'🐔')
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
        <div style={{ position:'relative' }}>
          <div style={{ width:sz, height:sz, borderRadius:'50%', overflow:'hidden', background:'#f0ebe4',
            border: isRoot ? '3px solid #c8a060' : '2px solid #e8e0d0',
            boxShadow: isRoot ? '0 0 0 4px rgba(200,160,96,0.2)' : 'none',
            filter: node.status==='deceased' ? 'grayscale(0.6)' : 'none',
            opacity: node.status==='deceased' ? 0.7 : 1 }}>
            {node.photo
              ? <img src={node.photo} alt={node.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
              : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:sz*0.42 }}>{em}</div>
            }
          </div>
          <div style={{ width:8, height:8, borderRadius:'50%', background:sb, position:'absolute', bottom:1, right:1, border:'2px solid #fff' }}/>
        </div>
        <span style={{ fontSize:isRoot?(isMobile?11:13):(isMobile?8:9), fontWeight:700, color:'#2c2416',
          whiteSpace:'nowrap', maxWidth:nodeW-4, overflow:'hidden', textOverflow:'ellipsis', textAlign:'center',
          fontFamily:"'Playfair Display',serif" }}>{node.name}</span>
        {!isMobile && node.breed && (
          <span style={{ fontSize:7, color:'#a08060', whiteSpace:'nowrap', maxWidth:nodeW-4, overflow:'hidden', textOverflow:'ellipsis', textAlign:'center' }}>{node.breed}</span>
        )}
      </div>
    )
  }

  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:isMobile?'16px 12px':'28px 24px' }}>

      {/* Nav breadcrumb */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
        <button style={{ ...S.btn, background:'#fff', color:'#5a3e1b', border:'1px solid #d0c4b0', padding:'6px 12px', fontSize:12 }}>
          ← {name}'s Profile
        </button>
        <span style={{ fontSize:12, color:'#a08060' }}>🌳 Lineage</span>
      </div>

      <div id="lineage-intro" style={{ marginBottom:16,
        outline:highlight==='lineage-intro'?'3px solid #c8a060':'none',
        borderRadius:highlight==='lineage-intro'?10:0,
        boxShadow:highlight==='lineage-intro'?'0 0 0 8px rgba(200,160,96,0.15)':'none',
        transition:'all 0.25s', padding:highlight==='lineage-intro'?4:0 }}>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?22:28, fontWeight:700, margin:'0 0 6px' }}>
          🌳 {name}'s Family Tree
        </h2>
        <p style={{ fontSize:14, color:'#7a6648', margin:0, lineHeight:1.5 }}>
          4 generations — built automatically as you record {isSheep?'sires and dams':'roosters and hens'}.
        </p>
      </div>

      <div style={{ background:'#fff9e6', border:'1px solid #ffe082', borderRadius:10, padding:'12px 16px', marginBottom:16, fontSize:13, color:'#7a5c10', lineHeight:1.55 }}>
        {isSheep
          ? <><strong>💡 Before breeding season:</strong> Rosie and Clover are both daughters of Duke and {name}. Before putting any new ram with them, check here first. FarmHand flags shared ancestors automatically.</>
          : <><strong>💡 Tracking chicken bloodlines:</strong> Redford is the rooster behind {name}'s hatch. Record his lineage and FarmHand builds the tree — useful when managing multiple breeding flocks or selecting for traits.</>
        }
      </div>

      {/* Pedigree — horizontal top to bottom */}
      <div id="lineage-tree" style={{ ...S.card, padding:isMobile?'14px 10px':'24px 20px',
        outline:highlight==='lineage-tree'?'3px solid #c8a060':'none',
        boxShadow:highlight==='lineage-tree'?'0 0 0 8px rgba(200,160,96,0.15)':'none',
        borderRadius:12, transition:'all 0.25s', overflowX:'auto', WebkitOverflowScrolling:'touch' }}>

        <div style={{ minWidth:isMobile?480:620 }}>
          {rows.map((row, rowIdx) => {
            const count      = row.nodes.length
            const isRoot     = rowIdx===3
            const mySlotW    = totalW / count
            const nextRow    = rows[rowIdx+1]
            const nextSlotW  = nextRow ? totalW / nextRow.nodes.length : 0

            return (
              <div key={rowIdx}>
                {/* Row label */}
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, marginTop:rowIdx===0?0:2 }}>
                  <span style={{ fontSize:isMobile?8:10, fontWeight:700, color:'#a08060', textTransform:'uppercase',
                    letterSpacing:'0.07em', background:'#f7f4ef', padding:'3px 10px', borderRadius:20, whiteSpace:'nowrap' }}>
                    {row.label}
                  </span>
                  <div style={{ flex:1, height:1, background:'#f0ebe4' }}/>
                </div>

                {/* ── NODES first — icons sit above their lines ── */}
                <div style={{ display:'flex', width:'100%', marginBottom:0 }}>
                  {row.nodes.map((node, ni) => (
                    <div key={ni} style={{ flex:1, display:'flex', justifyContent:'center', padding:`0 ${gapX/2}px` }}>
                      <DemoNode node={node} isRoot={isRoot}/>
                    </div>
                  ))}
                </div>

                {/* ── CONNECTORS below — lines drop down from nodes and converge ── */}
                {rowIdx < 3 && (
                  <svg width="100%" viewBox={`0 0 ${totalW} ${connH}`} style={{ display:'block', marginBottom:4 }} preserveAspectRatio="xMidYMid meet">
                    {nextRow.nodes.map((_, childIdx) => {
                      const par0X  = mySlotW   * (childIdx*2)     + mySlotW/2
                      const par1X  = mySlotW   * (childIdx*2 + 1) + mySlotW/2
                      const midX   = (par0X + par1X) / 2
                      const childX = nextSlotW * childIdx + nextSlotW / 2
                      const juncY  = connH * 0.55
                      return (
                        <g key={childIdx}>
                          <line x1={par0X} y1={0}     x2={par0X}  y2={juncY}  stroke="#d0c4b0" strokeWidth={1.5}/>
                          <line x1={par1X} y1={0}     x2={par1X}  y2={juncY}  stroke="#d0c4b0" strokeWidth={1.5}/>
                          <line x1={par0X} y1={juncY} x2={par1X}  y2={juncY}  stroke="#d0c4b0" strokeWidth={1.5}/>
                          <line x1={midX}  y1={juncY} x2={childX} y2={connH}  stroke="#d0c4b0" strokeWidth={1.5}/>
                        </g>
                      )
                    })}
                  </svg>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Inbreeding check */}
      <div id="lineage-warn" style={{ ...S.card, padding:isMobile?'14px 16px':'16px 20px', marginTop:14,
        outline:highlight==='lineage-warn'?'3px solid #c8a060':'none',
        boxShadow:highlight==='lineage-warn'?'0 0 0 8px rgba(200,160,96,0.15)':'none',
        borderRadius:12, transition:'all 0.25s', background:'#f1f8f1', border:'1px solid #a5d6a7' }}>
        <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
          <span style={{ fontSize:20 }}>✓</span>
          <div>
            <p style={{ fontSize:13, fontWeight:700, color:'#2e7d32', margin:'0 0 3px' }}>No shared ancestors detected</p>
            <p style={{ fontSize:13, color:'#4a7a4a', margin:0, lineHeight:1.5 }}>
              Safe to breed. FarmHand checks both sides of the tree every time.
            </p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display:'flex', gap:14, flexWrap:'wrap', marginTop:12, alignItems:'center' }}>
        <span style={{ fontSize:11, color:'#a08060', fontWeight:700 }}>Sex dot:</span>
        {isSheep
          ? [['#5d4037','Ram'],['#a1887f','Ewe']].map(([c,l])=>(
              <div key={l} style={{ display:'flex', alignItems:'center', gap:5 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:c }}/><span style={{ fontSize:11, color:'#7a6648' }}>{l}</span>
              </div>
            ))
          : [['#c62828','Rooster'],['#f9a825','Hen']].map(([c,l])=>(
              <div key={l} style={{ display:'flex', alignItems:'center', gap:5 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:c }}/><span style={{ fontSize:11, color:'#7a6648' }}>{l}</span>
              </div>
            ))
        }
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

// ─── HERO SCREEN 1: Animal Profiles ───────────────────────────────────────────
function HeroProfiles({ name, species, isMobile }) {
  const isSheep = species==='sheep'
  const meta = demoMeta(species)
  const animals = demoAnimals(species)
    .slice(0,isMobile?3:4)
    .map((a,i)=>i===0?{...a,name}:a)
  const statusColors = { alive:'#4caf50', sold:'#9c27b0', deceased:'#9e9e9e', rented:'#f9a825' }

  return (
    <div style={{ minHeight:'calc(100vh - 40px)', display:'flex', flexDirection:'column', justifyContent:'flex-start',
      padding:isMobile?'18px 16px 170px':'34px 40px 48px', maxWidth:1100, margin:'0 auto' }}>
      <p style={{ fontSize:isMobile?11:12, fontWeight:700, color:'#c8a060', textTransform:'uppercase',
        letterSpacing:'0.1em', margin:'0 0 10px' }}>Animal Profiles</p>
      <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?26:38, fontWeight:700,
        color:'#2c2416', margin:'0 0 8px', lineHeight:1.2 }}>
        Know every animal on your farm
      </h2>
      <p style={{ fontSize:isMobile?14:17, color:'#7a6648', margin:'0 0 20px', lineHeight:1.5 }}>
        Photo, status, breed, age — at a glance. No more guessing which one had the bad leg last spring.
      </p>

      {/* Animal cards — above the fold, no scroll */}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {animals.map((a,i)=>{
          const isActive = a.status==='alive'||a.status==='rented'
          const sc = statusColors[a.status]||'#9e9e9e'
          return (
            <div key={a.id} style={{ display:'flex', alignItems:'center', gap:14, padding:isMobile?'14px 16px':'16px 22px',
              background:'#fff', borderRadius:12, border:'1px solid #e8e0d0',
              boxShadow: i===0?'0 4px 24px rgba(44,36,22,0.1)':'none',
              transform: i===0?'scale(1.01)':'scale(1)',
              opacity: !isActive ? 0.6 : 1 }}>
              <div style={{ position:'relative', flexShrink:0 }}>
                <div style={{ width:isMobile?48:60, height:isMobile?48:60, borderRadius:'50%', overflow:'hidden',
                  border:`3px solid ${sc}`, background:'#f0ebe4' }}>
                  {a.photo_url
                    ? <img src={a.photo_url} alt={a.name} style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
                    : <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:isMobile?22:26 }}>
                        {meta.emoji}
                      </div>
                  }
                </div>
                <div style={{ width:10,height:10,borderRadius:'50%',background:sc,
                  position:'absolute',bottom:0,right:0,border:'2px solid #fff' }}/>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                  <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
                    fontSize:isMobile?15:17, color:'#2c2416' }}>{a.name}</span>
                  <span style={{ fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:8,
                    background:sc, color:'#fff', textTransform:'uppercase' }}>{a.status}</span>
                </div>
                <span style={{ fontSize:isMobile?11:13, color:'#a08060' }}>
                  {a.breed||'Unknown'} · {a.sex==='ewe'||a.sex==='hen'?'Female':'Male'} · {calcAge(a.birth_date)}
                </span>
              </div>
              <span style={{ color:'#c8b89a', fontSize:20 }}>›</span>
            </div>
          )
        })}
        {/* "and more" hint */}
        <p style={{ fontSize:12, color:'#c8b89a', textAlign:'center', margin:'4px 0 0', fontStyle:'italic' }}>
          + {demoAnimals(species).length - animals.length} more {demoMeta(species).label.toLowerCase()} in your {demoMeta(species).group}
        </p>
      </div>
    </div>
  )
}

// ─── HERO SCREEN 2: Health Timeline ───────────────────────────────────────────
function HeroEvents({ name, species, isMobile }) {
  const isSheep = species==='sheep'
  const isHorse = species==='horses'
  const animal = {...demoAnimals(species)[0], name}
  const events = isSheep ? [
    { type:'lambing',     date:'Apr 2, 2024',  notes:'Twins born — Rosie and Clover. Both healthy.', icon:'🐣', color:'#e65100', bg:'#fff3e0' },
    { type:'Illness',     date:'Sep 14, 2024', notes:'Limping on left front. Penicillin 3ml.', icon:'🤒', color:'#c62828', bg:'#fff3f3', alert:true },
    { type:'Shearing',    date:'May 15, 2024', notes:'Fleece 4.2kg. Good staple length.', icon:'✂️', color:'#2e7d32', bg:'#e8f5e9' },
  ] : isHorse ? [
    { type:'Farrier Visit', date:'Feb 18, 2025', notes:'Routine farrier visit. Balanced front feet.', icon:'🧲', color:'#4e342e', bg:'#efebe9' },
    { type:'Dental Float',  date:'Mar 8, 2025',  notes:'Dental float completed. Eating well after.', icon:'🦷', color:'#00695c', bg:'#e0f2f1' },
    { type:'Vet Check',     date:'Apr 5, 2026',  notes:'New foal exam. Strong nursing and clean joints.', icon:'🩺', color:'#1565c0', bg:'#e3f2fd' },
  ] : [
    { type:'Egg Production', date:'Jan 15, 2025', notes:'Averaging 6 eggs/week. Consistent through winter.', icon:'🥚', color:'#f57f17', bg:'#fff9e6' },
    { type:'Illness',        date:'Aug 20, 2024', notes:'Lethargic, not eating. Heat stress — recovered in 2 days.', icon:'🤒', color:'#c62828', bg:'#fff3f3', alert:true },
    { type:'Vaccination',    date:'Nov 10, 2024', notes:'Newcastle disease vaccine.', icon:'💉', color:'#1565c0', bg:'#e3f2fd' },
  ]

  return (
    <div style={{ minHeight:'calc(100vh - 40px)', display:'flex', flexDirection:'column', justifyContent:'flex-start',
      padding:isMobile?'18px 16px 170px':'34px 40px 48px', maxWidth:1100, margin:'0 auto' }}>
      <p style={{ fontSize:isMobile?11:12, fontWeight:700, color:'#c8a060', textTransform:'uppercase',
        letterSpacing:'0.1em', margin:'0 0 10px' }}>Health Timeline</p>
      <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?26:38, fontWeight:700,
        color:'#2c2416', margin:'0 0 8px', lineHeight:1.2 }}>
        Never lose a health record again
      </h2>
      <p style={{ fontSize:isMobile?14:17, color:'#7a6648', margin:'0 0 18px', lineHeight:1.5 }}>
        Every event dated, noted, and photographed. Your whole history in one place — searchable, forever.
      </p>

      <div style={{ background:'#fff', border:'1px solid #e8e0d0', borderRadius:14,
        boxShadow:'0 4px 24px rgba(44,36,22,0.08)', overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:isMobile?'12px 14px':'14px 18px',
          background:'#12251c' }}>
          <Avatar animal={animal} size={isMobile?46:54}/>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
              <span style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?18:22,
                fontWeight:700, color:'#f0e6cc' }}>{name}</span>
              <span style={{ fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:10,
                background:'#4caf50', color:'#fff', textTransform:'uppercase' }}>Alive</span>
            </div>
            <p style={{ fontSize:11, color:'#c8a878', margin:'2px 0 0' }}>
              {isSheep?'Merino ewe':isHorse?'Quarter Horse mare':'Rhode Island Red hen'} · {events.length} health records
            </p>
          </div>
        </div>
      <div style={{ padding:isMobile?'14px 12px 10px':'16px 18px 12px' }}>
        {events.map((ev,i)=>(
          <div key={i} style={{ display:'flex', gap:0, alignItems:'stretch',
            marginBottom:i<events.length-1?isMobile?10:12:0 }}>
            {/* Date col */}
            <div style={{ width:isMobile?28:36, flexShrink:0, paddingTop:isMobile?8:10,
              textAlign:'right', paddingRight:8 }}>
              <span style={{ fontSize:8, color:'#a08060', fontWeight:700, lineHeight:1.2,
                display:'block', whiteSpace:'nowrap' }}>
                {ev.date.split(' ').slice(0,2).join('\n')}
              </span>
            </div>
            {/* Icon */}
            <div style={{ width:isMobile?42:50, flexShrink:0, display:'flex',
              justifyContent:'center', paddingTop:2, position:'relative' }}>
              {i > 0 && <div style={{ position:'absolute', top:0,
                left:'50%', transform:'translateX(-50%)', width:2, height:isMobile?14:16,
                background:'#e8e0d0', borderRadius:1 }}/>}
              {i < events.length-1 && <div style={{ position:'absolute', top:isMobile?38:46,
                bottom:-1 * (isMobile?10:12), left:'50%', transform:'translateX(-50%)',
                width:2, background:'#e8e0d0', borderRadius:1 }}/>}
              <div style={{ width:isMobile?36:44, height:isMobile?36:44, borderRadius:9,
                background:ev.bg, border:`2px solid ${ev.color}33`, display:'flex',
                alignItems:'center', justifyContent:'center', fontSize:isMobile?18:20,
                boxShadow:ev.alert?`0 0 0 3px rgba(198,40,40,0.2)`:'none',
                position:'relative', zIndex:1 }}>
                {ev.icon}
              </div>
            </div>
            {/* Content */}
            <div style={{ flex:1, minWidth:0, paddingLeft:isMobile?8:10,
              paddingBottom:isMobile?10:12, paddingTop:4,
              borderBottom:i<events.length-1?'1px solid #f7f4ef':'none' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3, flexWrap:'wrap' }}>
                <span style={{ fontSize:isMobile?12:14, fontWeight:700, color:ev.color }}>{ev.type}</span>
                {ev.alert && <span style={{ fontSize:9, fontWeight:700, padding:'1px 6px',
                  borderRadius:8, background:'#c62828', color:'#fff', textTransform:'uppercase' }}>⚠ Alert</span>}
                <span style={{ fontSize:10, color:'#a08060' }}>{ev.date}</span>
              </div>
              <p style={{ fontSize:isMobile?12:13, color:'#4a3c28', margin:0, lineHeight:1.5 }}>{ev.notes}</p>
              <span style={{ fontSize:10, color:'#c8b89a', fontStyle:'italic', marginTop:3, display:'block' }}>📷 add photo</span>
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  )
}

// ─── HERO SCREEN 3: Bloodlines ─────────────────────────────────────────────────
function HeroLineage({ name, species, isMobile }) {
  const isSheep = species==='sheep'
  const isHorse = species==='horses'
  const em = isSheep ? { root:'🐑', male:'🐏', female:'🐑' } : isHorse ? { root:'🐴', male:'🐴', female:'🐴' } : { root:'🐔', male:'🐓', female:'🐔' }
  const sexBg = { male:'#5d4037', female:'#a1887f' }
  const tree = isSheep ? {
    root: { name, sex:'female', status:'alive' },
    parents: [{ name:'Duke', sex:'male', status:'alive' }, { name:'Iris', sex:'female', status:'alive' }],
    grandparents: [{ name:'Magnus', sex:'male', status:'deceased' }, { name:'Fern', sex:'female', status:'sold' }, { name:'Chester', sex:'male', status:'sold' }, { name:'Pearl', sex:'female', status:'deceased' }],
  } : isHorse ? {
    root: { name, sex:'female', status:'alive' },
    parents: [{ name:'Ranger', sex:'male', status:'alive' }, { name:'Juniper', sex:'female', status:'alive' }],
    grandparents: [{ name:'Dakota', sex:'male', status:'deceased' }, { name:'Sage', sex:'female', status:'sold' }, { name:'Atlas', sex:'male', status:'sold' }, { name:'Ruby', sex:'female', status:'deceased' }],
  } : {
    root: { name, sex:'female', status:'alive' },
    parents: [{ name:'Redford', sex:'male', status:'alive' }, { name:'Goldie', sex:'female', status:'alive' }],
    grandparents: [{ name:'Colonel', sex:'male', status:'deceased' }, { name:'Maple', sex:'female', status:'sold' }, { name:'Rex', sex:'male', status:'sold' }, { name:'Clover', sex:'female', status:'deceased' }],
  }

  const nodeSize = isMobile ? 40 : 52
  const slotW    = isMobile ? 70 : 90
  const connH    = isMobile ? 22 : 30
  const totalW   = 4 * slotW

  function Node({ node, isRoot }) {
    const sz = isRoot ? nodeSize + 10 : nodeSize
    const sd = sexBg[node.sex]||'#d7ccc8'
    const dimmed = node.status!=='alive'
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, opacity:dimmed?0.55:1 }}>
        <div style={{ position:'relative' }}>
          <div style={{ width:sz, height:sz, borderRadius:'50%', background:'#f0ebe4',
            border:isRoot?'3px solid #c8a060':'2px solid #e8e0d0',
            boxShadow:isRoot?'0 0 0 4px rgba(200,160,96,0.2)':'none',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:sz*0.4 }}>
            {node.sex==='male' ? em.male : em.female}
          </div>
          <div style={{ width:8, height:8, borderRadius:'50%', background:sd,
            position:'absolute', bottom:0, right:0, border:'2px solid #fff' }}/>
        </div>
        <span style={{ fontSize:isRoot?(isMobile?11:12):(isMobile?8:9), fontWeight:700,
          color:'#2c2416', whiteSpace:'nowrap', fontFamily:"'Playfair Display',serif",
          maxWidth:slotW-8, overflow:'hidden', textOverflow:'ellipsis', textAlign:'center' }}>
          {node.name}
        </span>
      </div>
    )
  }

  const rows = [
    { label:'Grandparents', nodes: tree.grandparents },
    { label:'Parents',      nodes: tree.parents      },
    { label:'Your Animal',  nodes: [tree.root]        },
  ]

  return (
    <div style={{ minHeight:'calc(100vh - 40px)', display:'flex', flexDirection:'column', justifyContent:'flex-start',
      padding:isMobile?'18px 16px 170px':'34px 40px 48px', maxWidth:1100, margin:'0 auto' }}>
      <p style={{ fontSize:isMobile?11:12, fontWeight:700, color:'#c8a060', textTransform:'uppercase',
        letterSpacing:'0.1em', margin:'0 0 10px' }}>Bloodlines</p>
      <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?26:38, fontWeight:700,
        color:'#2c2416', margin:'0 0 8px', lineHeight:1.2 }}>
        Know who's related to who
      </h2>
      <p style={{ fontSize:isMobile?14:17, color:'#7a6648', margin:'0 0 18px', lineHeight:1.5 }}>
        {isSheep
          ? 'Before breeding season — check here. FarmHand builds the family tree automatically and flags shared ancestors. No more accidental inbreeding.'
          : isHorse
            ? 'Track sire and dam lines across generations. FarmHand keeps pedigrees clear and flags shared ancestors before breeding decisions.'
            : 'Track your rooster\'s bloodlines across hatches. Built automatically as you record sires and hens. 4 generations, always up to date.'
        }
      </p>

      {/* Compact 3-gen tree — fits above fold */}
      <div style={{ background:'#fff', borderRadius:14, padding:isMobile?'16px 12px':'24px 20px',
        border:'1px solid #e8e0d0', boxShadow:'0 4px 24px rgba(44,36,22,0.08)', overflowX:'auto' }}>
        <div style={{ minWidth:isMobile?260:350 }}>
          {rows.map((row, ri)=>{
            const count   = row.nodes.length
            const mySlotW = totalW / count
            const nextRow = rows[ri+1]
            const nextSlotW = nextRow ? totalW / nextRow.nodes.length : 0
            return (
              <div key={ri}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, marginTop:ri===0?0:2 }}>
                  <span style={{ fontSize:isMobile?8:9, fontWeight:700, color:'#a08060',
                    textTransform:'uppercase', letterSpacing:'0.06em', whiteSpace:'nowrap',
                    background:'#f7f4ef', padding:'2px 8px', borderRadius:20 }}>
                    {row.label}
                  </span>
                  <div style={{ flex:1, height:1, background:'#f0ebe4' }}/>
                </div>
                <div style={{ display:'flex', width:'100%', marginBottom:0 }}>
                  {row.nodes.map((n,ni)=>(
                    <div key={ni} style={{ flex:1, display:'flex', justifyContent:'center' }}>
                      <Node node={n} isRoot={ri===rows.length-1}/>
                    </div>
                  ))}
                </div>
                {ri < rows.length-1 && (
                  <svg width="100%" viewBox={`0 0 ${totalW} ${connH}`}
                    style={{ display:'block', marginBottom:2 }} preserveAspectRatio="xMidYMid meet">
                    {nextRow.nodes.map((_,ci)=>{
                      const par0X = mySlotW*(ci*2)   + mySlotW/2
                      const par1X = mySlotW*(ci*2+1) + mySlotW/2
                      const midX  = (par0X+par1X)/2
                      const childX= nextSlotW*ci     + nextSlotW/2
                      const jY    = connH*0.55
                      return (
                        <g key={ci}>
                          <line x1={par0X} y1={0}   x2={par0X}  y2={jY}    stroke="#d0c4b0" strokeWidth={1.5}/>
                          <line x1={par1X} y1={0}   x2={par1X}  y2={jY}    stroke="#d0c4b0" strokeWidth={1.5}/>
                          <line x1={par0X} y1={jY}  x2={par1X}  y2={jY}    stroke="#d0c4b0" strokeWidth={1.5}/>
                          <line x1={midX}  y1={jY}  x2={childX} y2={connH} stroke="#d0c4b0" strokeWidth={1.5}/>
                        </g>
                      )
                    })}
                  </svg>
                )}
              </div>
            )
          })}
        </div>
        {/* Inbreeding check */}
        <div style={{ marginTop:14, padding:'10px 14px', borderRadius:8,
          background:'#f1f8f1', border:'1px solid #a5d6a7', display:'flex', gap:8, alignItems:'center' }}>
          <span style={{ fontSize:16 }}>✓</span>
          <span style={{ fontSize:12, color:'#2e7d32', fontWeight:600 }}>
            No shared ancestors detected — safe to breed.
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── HERO SCREEN 4: P&L ────────────────────────────────────────────────────────
function HeroPnL({ name, species, isMobile }) {
  const isSheep = species==='sheep'
  const isHorse = species==='horses'
  const totalIn  = isSheep ? 2840 : isHorse ? 1560 : 1240
  const totalOut = isSheep ? 1120 : isHorse ? 780 : 480
  const net      = totalIn - totalOut
  const entries  = isSheep ? [
    { desc:'Wool sale — spring clip', type:'Wool Sale', amount:680, income:true,  date:'May 12' },
    { desc:'Lamb sale × 3',           type:'Animal Sale', amount:900, income:true, date:'Apr 28' },
    { desc:'Hay bales × 40',          type:'Hay',       amount:480, income:false, date:'Apr 10' },
  ] : isHorse ? [
    { desc:'Training sessions × 8',    type:'Training', amount:680, income:true,  date:'May 10' },
    { desc:'Trail lessons × 6',        type:'Lessons',  amount:390, income:true,  date:'Apr 29' },
    { desc:'Farrier and shoeing',      type:'Farrier',  amount:260, income:false, date:'Apr 18' },
  ] : [
    { desc:'Egg sale — 12 dozen',  type:'Egg Sales', amount:60,  income:true,  date:'May 11' },
    { desc:'Egg sale — 8 dozen',   type:'Egg Sales', amount:40,  income:true,  date:'May 4'  },
    { desc:'Feed bags × 4',        type:'Feed',      amount:80,  income:false, date:'May 1'  },
  ]

  return (
    <div style={{ minHeight:'calc(100vh - 40px)', display:'flex', flexDirection:'column', justifyContent:'flex-start',
      padding:isMobile?'18px 16px 170px':'34px 40px 48px', maxWidth:1100, margin:'0 auto' }}>
      <p style={{ fontSize:isMobile?11:12, fontWeight:700, color:'#c8a060', textTransform:'uppercase',
        letterSpacing:'0.1em', margin:'0 0 10px' }}>Profit & Loss</p>
      <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?26:38, fontWeight:700,
        color:'#2c2416', margin:'0 0 8px', lineHeight:1.2 }}>
        See exactly what your farm makes
      </h2>
      <p style={{ fontSize:isMobile?14:17, color:'#7a6648', margin:'0 0 14px', lineHeight:1.5 }}>
        Every dollar in and out — tracked as you go. No spreadsheet. Just log it and the numbers update.
      </p>

      {/* Summary tiles */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
        {[
          { label:'Income',   value:'+'+fmt(totalIn),  color:'#2e7d32', bg:'#f1f8f1' },
          { label:'Expenses', value:'-'+fmt(totalOut), color:'#c62828', bg:'#fff3f3' },
          { label:'Net P&L',  value:'+'+fmt(net),      color:'#2e7d32', bg:'#e8f5e9' },
        ].map(s=>(
          <div key={s.label} style={{ padding:isMobile?'12px 8px':'16px 14px', borderRadius:10,
            background:s.bg, textAlign:'center' }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?16:22,
              fontWeight:700, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:9, color:'#a08060', fontWeight:700,
              textTransform:'uppercase', marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent entries */}
      <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e8e0d0',
        boxShadow:'0 4px 24px rgba(44,36,22,0.06)', overflow:'hidden' }}>
        {entries.map((e,i)=>(
          <div key={i} style={{ display:'flex', alignItems:'center', gap:12,
            padding:isMobile?'12px 14px':'13px 18px',
            borderBottom: i<entries.length-1?'1px solid #f7f4ef':'none',
            background: e.income ? '#fafffe' : '#fffafa' }}>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:isMobile?12:14, fontWeight:600, margin:'0 0 2px',
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.desc}</p>
              <p style={{ fontSize:10, color:'#a08060', margin:0 }}>{e.type} · {e.date}</p>
            </div>
            <span style={{ fontSize:isMobile?13:15, fontWeight:700, flexShrink:0,
              color:e.income?'#2e7d32':'#c62828' }}>
              {e.income?'+':'-'}{fmt(e.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── HERO SCREEN 5: Dashboard ──────────────────────────────────────────────────
function HeroDashboard({ species, isMobile }) {
  const isSheep = species==='sheep'
  const isHorse = species==='horses'

  // Full year data
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const inc = isSheep
    ? [0,   200, 340, 280, 520, 460, 390, 480, 320, 560, 410, 380]
    : isHorse
      ? [120, 180, 260, 220, 360, 420, 390, 450, 340, 380, 300, 260]
      : [60,  80,  120, 100, 160, 140, 130, 150, 110, 170, 130, 120]
  const exp = isSheep
    ? [220, 180, 260, 200, 310, 240, 280, 220, 190, 300, 250, 200]
    : isHorse
      ? [180, 210, 240, 260, 300, 280, 320, 260, 230, 290, 240, 220]
      : [80,  80,  100, 90,  120, 100, 95,  110, 85,  125, 100, 90 ]
  const maxV = Math.max(...inc,...exp,1)

  // Bar chart dimensions — fixed height, scaled to fit 12 months
  const chartH = isMobile ? 70 : 90
  const barW   = isMobile ? 8  : 14
  const gap    = isMobile ? 2  : 4
  const groupW = barW*2+gap
  const colGap = isMobile ? 4  : 8
  const padL   = 24
  const totalW = padL + months.length*(groupW+colGap) + 8

  // Donut — proper arc path calculation with viewBox="0 0 100 100"
  const donutSegs = isSheep
    ? [{ label:'Wool',  v:680, color:'#90caf9' },
       { label:'Lambs', v:900, color:'#5d4037' },
       { label:'Other', v:260, color:'#78909c' }]
    : isHorse
      ? [{ label:'Training', v:680, color:'#6d4c41' },
         { label:'Lessons',  v:520, color:'#8d6e63' },
         { label:'Other',    v:360, color:'#78909c' }]
    : [{ label:'Eggs',  v:960, color:'#f9a825' },
       { label:'Other', v:280, color:'#78909c' }]
  const total = donutSegs.reduce((s,sg)=>s+sg.v, 0)

  // Build arc paths correctly
  let cumAngle = -90
  const arcs = donutSegs.map(sg => {
    const pct   = sg.v / total
    const start = cumAngle
    const end   = cumAngle + pct * 360
    cumAngle    = end
    const sRad  = start * Math.PI / 180
    const eRad  = end   * Math.PI / 180
    const cx=50, cy=50, r=38, ri=24
    const x1=cx+r*Math.cos(sRad), y1=cy+r*Math.sin(sRad)
    const x2=cx+r*Math.cos(eRad), y2=cy+r*Math.sin(eRad)
    const large = (end-start) > 180 ? 1 : 0
    // Donut arc (not pie) — draw outer arc then inner arc back
    const d = `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} L ${(cx+ri*Math.cos(eRad)).toFixed(2)} ${(cy+ri*Math.sin(eRad)).toFixed(2)} A ${ri} ${ri} 0 ${large} 0 ${(cx+ri*Math.cos(sRad)).toFixed(2)} ${(cy+ri*Math.sin(sRad)).toFixed(2)} Z`
    return { ...sg, d, pct }
  })

  return (
    <div style={{ minHeight:'calc(100vh - 42px)', display:'flex', flexDirection:'column',
      justifyContent:'flex-start', padding:isMobile?'18px 16px 170px':'34px 40px 48px',
      maxWidth:1100, margin:'0 auto' }}>
      <p style={{ fontSize:isMobile?11:12, fontWeight:700, color:'#c8a060',
        textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 6px' }}>Dashboard</p>
      <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?24:34,
        fontWeight:700, color:'#2c2416', margin:'0 0 6px', lineHeight:1.2 }}>
        Your whole farm in one view
      </h2>
      <p style={{ fontSize:isMobile?13:15, color:'#7a6648', margin:'0 0 14px', lineHeight:1.5 }}>
        Income vs expenses by month. See your trends before they become problems.
      </p>

      <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'3fr 2fr',
        gap:12, alignItems:'stretch' }}>

        {/* Bar chart — fixed height card */}
        <div style={{ background:'#fff', borderRadius:12,
          padding:isMobile?'12px 10px':'16px 16px',
          border:'1px solid #e8e0d0', boxShadow:'0 4px 20px rgba(44,36,22,0.06)' }}>
          <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
            fontSize:13, margin:'0 0 10px' }}>Income vs Expenses — Full Year</p>
          <svg width="100%" viewBox={`0 0 ${totalW} ${chartH+22}`}
            style={{ display:'block', height:isMobile?100:130 }}>
            {months.map((mo,i)=>{
              const x    = padL + i*(groupW+colGap)
              const incH = Math.max((inc[i]/maxV)*chartH, inc[i]>0?2:0)
              const expH = Math.max((exp[i]/maxV)*chartH, 2)
              return (
                <g key={mo}>
                  <rect x={x}          y={chartH-incH} width={barW} height={incH} fill="#4caf50" rx={2} opacity={0.85}/>
                  <rect x={x+barW+gap} y={chartH-expH} width={barW} height={expH} fill="#c62828" rx={2} opacity={0.75}/>
                  <text x={x+barW} y={chartH+14} textAnchor="middle"
                    fontSize={isMobile?6:8} fill="#7a6648" fontWeight={600}>{mo}</text>
                </g>
              )
            })}
            <line x1={padL} x2={totalW-4} y1={chartH} y2={chartH}
              stroke="#e8e0d0" strokeWidth={1}/>
          </svg>
          <div style={{ display:'flex', gap:14, marginTop:4 }}>
            {[['#4caf50','Income'],['#c62828','Expenses']].map(([c,l])=>(
              <div key={l} style={{ display:'flex', alignItems:'center', gap:5 }}>
                <div style={{ width:8, height:8, borderRadius:2, background:c }}/>
                <span style={{ fontSize:10, color:'#4a3c28', fontWeight:600 }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Donut chart */}
        <div style={{ background:'#fff', borderRadius:12,
          padding:isMobile?'12px 10px':'16px 16px',
          border:'1px solid #e8e0d0', boxShadow:'0 4px 20px rgba(44,36,22,0.06)',
          display:'flex', flexDirection:'column' }}>
          <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
            fontSize:13, margin:'0 0 10px' }}>Income Breakdown</p>
          <div style={{ flex:1, display:'flex', alignItems:'center', gap:16 }}>
            {/* Fixed viewBox so donut is never cropped */}
            <svg viewBox="0 0 100 100" width={isMobile?80:100} height={isMobile?80:100}
              style={{ flexShrink:0 }}>
              {arcs.map((a,i)=>(
                <path key={i} d={a.d} fill={a.color} opacity={0.92}/>
              ))}
              <text x={50} y={46} textAnchor="middle" fontSize={7}
                fill="#a08060" fontWeight={600}>Total</text>
              <text x={50} y={57} textAnchor="middle" fontSize={9}
                fill="#2c2416" fontWeight={700}>{fmt(total)}</text>
            </svg>
            <div style={{ flex:1 }}>
              {arcs.map((a,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center',
                  gap:7, marginBottom:8 }}>
                  <div style={{ width:10, height:10, borderRadius:'50%',
                    background:a.color, flexShrink:0 }}/>
                  <span style={{ fontSize:12, color:'#4a3c28', fontWeight:600, flex:1 }}>
                    {a.label}
                  </span>
                  <span style={{ fontSize:12, fontWeight:700, color:'#2c2416' }}>
                    {Math.round(a.pct*100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── HERO SCREEN 6: Bulk Add ───────────────────────────────────────────────────
function HeroBulkAdd({ name, species, isMobile }) {
  const isSheep = species==='sheep'
  const isHorse = species==='horses'
  const rows = [
    { name, sex:isSheep?'Ewe':isHorse?'Mare':'Hen', dob:isSheep?'03/15/2021':isHorse?'05/12/2018':'06/01/2023', filled:true },
    { name:isSheep?'Rosie':isHorse?'Copper':'Goldie', sex:isSheep?'Ewe':isHorse?'Gelding':'Hen', dob:isSheep?'04/02/2022':isHorse?'03/02/2020':'05/15/2023', filled:true },
    { name:isSheep?'Duke':isHorse?'Ranger':'Big Red', sex:isSheep?'Ram':isHorse?'Stallion':'Rooster', dob:isSheep?'01/10/2020':isHorse?'04/08/2015':'04/01/2023', filled:true },
    { name:'', sex:isSheep?'Ewe':isHorse?'Mare':'Hen', dob:'', filled:false },
  ]
  const inp = { padding:'7px 10px', borderRadius:6, border:'1px solid #d0c4b0',
    background:'#fdfaf6', fontSize:isMobile?12:13, width:'100%', boxSizing:'border-box' }

  return (
    <div style={{ minHeight:'calc(100vh - 40px)', display:'flex', flexDirection:'column', justifyContent:'flex-start',
      padding:isMobile?'18px 16px 170px':'34px 40px 48px', maxWidth:1100, margin:'0 auto' }}>
      <p style={{ fontSize:isMobile?11:12, fontWeight:700, color:'#c8a060', textTransform:'uppercase',
        letterSpacing:'0.1em', margin:'0 0 10px' }}>Getting Started</p>
      <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?26:38, fontWeight:700,
        color:'#2c2416', margin:'0 0 8px', lineHeight:1.2 }}>
        Your whole {isHorse?'herd':'flock'} — set up in minutes
      </h2>
      <p style={{ fontSize:isMobile?14:17, color:'#7a6648', margin:'0 0 14px', lineHeight:1.5 }}>
        Add every animal at once. Name is all you need. Most farms are up and running in under 10 minutes.
      </p>

      <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e8e0d0',
        boxShadow:'0 4px 24px rgba(44,36,22,0.08)', overflow:'hidden' }}>
        {/* Header */}
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:8,
          padding:isMobile?'10px 12px':'12px 16px', borderBottom:'2px solid #e8e0d0', background:'#fdfaf6' }}>
          {['Name','Sex','Date of Birth'].map(h=>(
            <span key={h} style={{ fontSize:9, fontWeight:700, color:'#a08060',
              textTransform:'uppercase', letterSpacing:'0.06em' }}>{h}</span>
          ))}
        </div>
        {/* Rows */}
        {rows.map((row,i)=>(
          <div key={i} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:8,
            padding:isMobile?'8px 12px':'10px 16px', borderBottom:'1px solid #f7f4ef',
            background: i%2===0?'#fff':'#fdfaf6', alignItems:'center' }}>
            <input style={{ ...inp, borderColor:row.filled?'#a5d6a7':'#d0c4b0' }}
              defaultValue={row.name} placeholder="Name…" readOnly/>
            <input style={inp} defaultValue={row.sex} readOnly/>
            <input style={inp} defaultValue={row.dob} placeholder="mm/dd/yyyy" readOnly/>
          </div>
        ))}
        <div style={{ padding:isMobile?'10px 12px':'12px 16px', display:'flex',
          alignItems:'center', justifyContent:'space-between', background:'#fdfaf6',
          borderTop:'1px solid #e8e0d0' }}>
          <span style={{ fontSize:12, color:'#a08060' }}>3 of 4 rows filled</span>
          <div style={{ background:'#c8a060', color:'#2c2416', fontWeight:700,
            padding:'8px 20px', borderRadius:8, fontSize:13 }}>
            Save 3 Animals
          </div>
        </div>
      </div>
    </div>
  )
}

function Personalise({ species, setSpecies, onStart, isMobile }) {
  const features = [
    { icon:'📋', label:'Animal Profiles' },
    { icon:'📅', label:'Health Timeline' },
    { icon:'🌳', label:'Bloodlines' },
    { icon:'💰', label:'P&L Tracker' },
    { icon:'📊', label:'Dashboard' },
    { icon:'⚡', label:'Bulk Setup' },
  ]

  return (
    <div style={{ minHeight:'80vh', display:'flex', alignItems:'center',
      justifyContent:'center', padding:isMobile?'24px 16px':'40px 24px' }}>
      <div style={{ maxWidth:420, width:'100%' }}>
        <div style={{ textAlign:'center', marginBottom:22 }}>
          <div style={{ width:54, height:54, margin:'0 auto 14px', borderRadius:12, background:'#21845a', color:'#fff', display:'grid', placeItems:'center', fontFamily:"'Manrope',sans-serif", fontWeight:800, fontSize:20 }}>FH</div>
          <h1 style={{ fontFamily:"'Manrope',sans-serif", fontSize:isMobile?24:32,
            fontWeight:750, color:'#fff', margin:'0 0 8px', lineHeight:1.2 }}>
            Farm records, health history, bloodlines, and profit in one place
          </h1>
          <p style={{ fontSize:isMobile?13:14, color:'#b9c9c0', margin:0, lineHeight:1.6 }}>
            Pick what's on your farm and take a guided 2-minute tour built around real daily decisions.
          </p>
        </div>

        <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:16,
          padding:isMobile?20:28, border:'1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr 1fr', gap:10, marginBottom:18 }}>
            {[['sheep','🐑','Sheep','Merino · Suffolk · Dorset'],
              ['chickens','🐔','Chickens','Layers · Broilers · Mixed'],
              ['horses','🐴','Horses','Mares · Geldings · Foals']].map(([k,e,l,sub])=>(
              <button key={k} onClick={()=>setSpecies(k)}
                style={{ padding:isMobile?'14px 10px':'18px 14px', borderRadius:12,
                  border:`2px solid ${species===k?'#55b887':'rgba(255,255,255,0.15)'}`,
                  background:species===k?'rgba(85,184,135,0.14)':'rgba(255,255,255,0.05)',
                  cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
                  display:'flex', flexDirection:'column', alignItems:'center',
                  gap:5, transition:'all 0.15s' }}>
                <span style={{ fontSize:34 }}>{e}</span>
                <span style={{ fontSize:14, fontWeight:700,
                  color:species===k?'#fff':'#c8d4cd' }}>{l}</span>
                <span style={{ fontSize:10, color:'#82968b' }}>{sub}</span>
                {species===k && (
                  <span style={{ fontSize:9, color:'#77c49e', fontWeight:700, marginTop:1 }}>✓ Selected</span>
                )}
              </button>
            ))}
          </div>
          <button onClick={onStart}
            style={{ width:'100%', padding:'14px', borderRadius:10, border:'none',
              cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontSize:16, fontWeight:700,
              background:'#21845a', color:'#fff',
              boxShadow:'0 4px 16px rgba(33,132,90,0.34)' }}>
            Show me the app →
          </button>
          <p style={{ fontSize:11, color:'rgba(255,255,255,0.2)', textAlign:'center', margin:'10px 0 0' }}>
            No sign-up required · 2 minute tour
          </p>
        </div>

        {/* Feature preview strip */}
        <div style={{ marginTop:20 }}>
          <p style={{ fontSize:10, color:'rgba(255,255,255,0.25)', textAlign:'center',
            textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 10px', fontWeight:700 }}>
            You'll see
          </p>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center' }}>
            {features.map(f=>(
              <div key={f.label} style={{ display:'flex', alignItems:'center', gap:5,
                padding:'5px 11px', borderRadius:20,
                background:'rgba(255,255,255,0.05)',
                border:'1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ fontSize:12 }}>{f.icon}</span>
                <span style={{ fontSize:11, color:'#c8b89a', fontWeight:600 }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}


export function DemoPage() {
  const navigate=useNavigate(), isMobile=useIsMobile()
  const [phase,  setPhase]   = useState('name')
  const [species,setSpecies] = useState('sheep')
  const [step,   setStep]    = useState(0)
  // Always use default name based on species — no user input needed
  const name  = demoMeta(species).defaultName
  const steps = buildSteps(species), cur = steps[step]
  const next  = ()=>{ if(cur.isLast) navigate('/'); else setStep(i=>i+1) }
  const skip  = ()=>navigate('/')

  // Reset step when species changes on personalise screen
  const handleSpecies = (s) => { setSpecies(s); setStep(0) }

  useEffect(()=>{
    if(phase!=='tour') return
    window.scrollTo({ top:0, behavior:'auto' })
  },[step,phase])

  const screens={
    hero_profiles:  <HeroProfiles  key={`profiles-${step}`}  name={name} species={species} isMobile={isMobile}/>,
    hero_events:    <HeroEvents    key={`events-${step}`}    name={name} species={species} isMobile={isMobile}/>,
    hero_lineage:   <HeroLineage   key={`lineage-${step}`}   name={name} species={species} isMobile={isMobile}/>,
    hero_pnl:       <HeroPnL       key={`pnl-${step}`}       name={name} species={species} isMobile={isMobile}/>,
    hero_dashboard: <HeroDashboard key={`dashboard-${step}`} species={species} isMobile={isMobile}/>,
    hero_bulkadd:   <HeroBulkAdd   key={`bulkadd-${step}`}   name={name} species={species} isMobile={isMobile}/>,
  }

  if(phase==='name') return (
    <div style={{ minHeight:'100vh', background:'#10251b', fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ padding:'12px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontFamily:"'Manrope',sans-serif", fontSize:16, fontWeight:750, color:'#fff', display:'flex', alignItems:'center', gap:8 }}><span style={{ width:28, height:28, borderRadius:7, background:'#21845a', display:'grid', placeItems:'center', fontSize:11 }}>FH</span>FarmHand</span>
        <button onClick={skip} style={{ background:'none', border:'1px solid rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.5)', borderRadius:6, padding:'5px 12px', cursor:'pointer', fontSize:12, fontFamily:"'Lato',sans-serif" }}>Skip</button>
      </div>
      <Personalise species={species} setSpecies={handleSpecies} onStart={()=>setPhase('tour')} isMobile={isMobile}/>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#f5f7f6', fontFamily:"'DM Sans',sans-serif",
      color:'#17211c', paddingBottom:isMobile?168:0, display:'flex', flexDirection:'column' }}>
      <Nav screen={cur.screen} species={species} isMobile={isMobile} onExit={skip} name={name}/>
      <div style={{ display:isMobile?'block':'grid', gridTemplateColumns:isMobile?undefined:'minmax(0, 1fr) 372px',
        gap:isMobile?0:20, maxWidth:1320, margin:'0 auto', width:'100%', flex:1,
        padding:isMobile?0:'0 24px 32px' }}>
        <div key={`screen-${step}`} style={{ minWidth:0, width:'100%',
          animation:'heroFadeIn 0.35s ease-out' }}>
          {screens[cur.screen]||screens.hero_profiles}
        </div>
        {!isMobile && (
          <aside style={{ paddingTop:24 }}>
            <Tip step={cur} stepIdx={step} total={steps.length} onNext={next} onSkip={skip} name={name} isMobile={isMobile}/>
          </aside>
        )}
      </div>
      {isMobile && <Tip step={cur} stepIdx={step} total={steps.length} onNext={next} onSkip={skip} name={name} isMobile={isMobile}/>}
    </div>
  )
}


