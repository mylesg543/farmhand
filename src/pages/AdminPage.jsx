import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { mergeAnimalEventData } from '../lib/animalEventHydration'
import { useNavigate } from 'react-router-dom'
import { S, AnimalAvatar, fmt, formatDate, getEventMeta, hasBreedingRestriction, DoNotBreedBadge } from '../components/ui/shared'

// ─── Auth guard — only your UID gets in ───────────────────────────────────────
const ADMIN_UIDS = ['d1b58a87-b815-47aa-8d8d-33c3eedb1e57']

function useAdmin() {
  const { user } = useAuth()
  return user && ADMIN_UIDS.includes(user.id)
}

// ─── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color='#2c2416', bg='#fff', trend, emoji }) {
  return (
    <div style={{ ...S.card, padding:'18px 20px', background:bg, display:'flex', flexDirection:'column', gap:4 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
        {emoji && <span style={{ fontSize:20 }}>{emoji}</span>}
        <span style={{ fontSize:11, fontWeight:700, color:'#a08060', textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</span>
      </div>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:700, color, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:'#a08060', marginTop:2 }}>{sub}</div>}
      {trend !== undefined && (
        <div style={{ fontSize:12, color: trend >= 0 ? '#2e7d32' : '#c62828', fontWeight:600, marginTop:2 }}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last month
        </div>
      )}
    </div>
  )
}

// ─── Mini bar chart ────────────────────────────────────────────────────────────
function MiniBarChart({ data, color='#5a3e1b', height=60 }) {
  if (!data || data.length === 0) return null
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:4, height }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
          <div style={{ width:'100%', background:color, borderRadius:'3px 3px 0 0', opacity:0.85,
            height: Math.max((d.value / max) * height, d.value > 0 ? 3 : 0) }}/>
          <span style={{ fontSize:8, color:'#a08060', whiteSpace:'nowrap' }}>{d.label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Activity badge ────────────────────────────────────────────────────────────
function ActivityBadge({ daysSince }) {
  if (daysSince === null) return <span style={{ fontSize:10, padding:'2px 8px', borderRadius:8, background:'#f0ebe4', color:'#a08060' }}>Never</span>
  if (daysSince <= 1)  return <span style={{ fontSize:10, padding:'2px 8px', borderRadius:8, background:'#e8f5e9', color:'#2e7d32', fontWeight:700 }}>Today</span>
  if (daysSince <= 7)  return <span style={{ fontSize:10, padding:'2px 8px', borderRadius:8, background:'#e3f2fd', color:'#1565c0', fontWeight:700 }}>{daysSince}d ago</span>
  if (daysSince <= 30) return <span style={{ fontSize:10, padding:'2px 8px', borderRadius:8, background:'#fff9e6', color:'#f57f17', fontWeight:700 }}>{daysSince}d ago</span>
  return <span style={{ fontSize:10, padding:'2px 8px', borderRadius:8, background:'#fff3f3', color:'#c62828', fontWeight:700 }}>{daysSince}d ago</span>
}

// ─── Event type icons (same as EventTimeline) ─────────────────────────────────
const EV_ICONS = {
  vaccination:'💉', worming:'💊', hoof_trimming:'✂️', hoof_treatment:'🩺', shearing:'✂️', tail_banding:'⭕',
  lambing:'🐣', weaning:'🍼', sickness:'🤒', injury:'🩹',
  weight_check:'⚖️', pregnancy_check:'🔍', egg_production:'🥚',
  moulting:'🪶', breeding:'❤️', sale:'💰', custom:'📝',
}
const EV_COLORS = {
  vaccination:  '#1565c0', worming:'#6a1b9a', hoof_trimming:'#4e342e', hoof_treatment:'#4e342e',
  shearing:     '#2e7d32', tail_banding:'#6d4c41', lambing:'#e65100', sickness:'#c62828',
  injury:       '#c62828', egg_production:'#f57f17', moulting:'#5d4037',
  pregnancy_check:'#ad1457', breeding:'#ad1457', weight_check:'#00695c',
  custom:       '#5a3e1b',
}

// ─── Read-only animal events panel ────────────────────────────────────────────
function AnimalDetailPanel({ animal, events, animals, onOpenAnimal }) {
  const animalEvents = events
    .filter(e => e.animal_id === animal.id)
    .sort((a,b) => b.event_date > a.event_date ? 1 : -1)
  const offspring = (animals || [])
    .filter(a => a.id !== animal.id && (a.sire_id === animal.id || a.dam_id === animal.id))
    .sort((a,b) => (b.birth_date || '').localeCompare(a.birth_date || '') || (a.name || '').localeCompare(b.name || '', undefined, { sensitivity:'base' }))
  const sire = animal.sire_id ? animals.find(a => a.id === animal.sire_id) : null
  const dam = animal.dam_id ? animals.find(a => a.id === animal.dam_id) : null
  const hasParents = sire || dam
  const st = { alive:'#4caf50', sold:'#9c27b0', deceased:'#9e9e9e', rented:'#f9a825' }

  return (
    <div className="admin-animal-detail-panel" style={{ background:'#fdfaf6', borderRadius:10, border:'1px solid #e8e0d0', overflow:'hidden', marginTop:6 }}>
      {/* Animal header */}
      <div style={{ background:'#202326', padding:'14px 16px', display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ width:44, height:44, borderRadius:'50%', overflow:'hidden', border:'2px solid rgba(255,255,255,0.25)', background:'rgba(255,255,255,0.1)', flexShrink:0 }}>
          <AnimalAvatar animal={animal} size={44}/>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2, flexWrap:'wrap' }}>
            <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:16, color:'#f0e6cc' }}>{animal.name}</span>
            <span style={{ fontSize:9, padding:'2px 7px', borderRadius:8, background:st[animal.status]||'#9e9e9e', color:'#fff', fontWeight:700, textTransform:'uppercase' }}>{animal.status}</span>
            {hasBreedingRestriction(animal) && <DoNotBreedBadge compact reason={animal.breeding_restriction_reason}/>}
          </div>
          <span style={{ fontSize:11, color:'#c8a878' }}>
            {animal.breed||'Unknown breed'} · {animal.sex} · {animal.tag_number&&!animal.tag_number.startsWith('AUTO-')?animal.tag_number:'No tag'}
            {animal.birth_date ? ` · Born ${formatDate(animal.birth_date)}` : ''}
          </span>
        </div>
        <span style={{ fontSize:11, color:'#c8a878', flexShrink:0 }}>{animalEvents.length} event{animalEvents.length!==1?'s':''}</span>
      </div>

      {hasParents && (
        <div style={{ padding:'12px 16px', borderBottom:'1px solid #f0ebe4', background:'#fff' }}>
          <p style={{ fontSize:10, fontWeight:700, color:'#a08060', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 10px' }}>
            Lineage
          </p>
          <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
            {[['Sire', sire], ['Dam', dam]].map(([role, parent]) => (
              <button key={role} type="button" onClick={() => parent && onOpenAnimal?.(parent.id)}
                disabled={!parent}
                style={{ display:'grid', gridTemplateColumns:'34px minmax(0, 1fr)', alignItems:'center',
                  gap:8, border:'1px solid #e8e0d0', borderRadius:8, background:'#fdfaf6',
                  padding:'7px 9px', minWidth:150, cursor:parent?'pointer':'default',
                  fontFamily:"'Lato',sans-serif", textAlign:'left', opacity:parent?1:0.55 }}>
                <div style={{ width:34, height:34, borderRadius:'50%', overflow:'hidden',
                  border:'2px solid #e8e0d0', background:'#f0ebe4' }}>
                  {parent ? <AnimalAvatar animal={parent} size={34}/> : null}
                </div>
                <span style={{ minWidth:0 }}>
                  <span style={{ display:'block', fontFamily:"'Playfair Display',serif", fontSize:13,
                    fontWeight:700, color:'#2c2416', overflow:'hidden', textOverflow:'ellipsis',
                    whiteSpace:'nowrap' }}>
                    {parent?.name || 'Unknown'}
                  </span>
                  <span style={{ display:'block', fontSize:10, color:'#a08060' }}>{role}</span>
                </span>
              </button>
            ))}
            <span style={{ color:'#c8b89a', fontSize:18 }}>→</span>
            <div style={{ display:'grid', gridTemplateColumns:'34px minmax(0, 1fr)', alignItems:'center',
              gap:8, border:'1px solid #e8e0d0', borderRadius:8, background:'#f0ebe4',
              padding:'7px 9px', minWidth:150 }}>
              <div style={{ width:34, height:34, borderRadius:'50%', overflow:'hidden',
                border:'2px solid #c8a060', background:'#f0ebe4' }}>
                <AnimalAvatar animal={animal} size={34}/>
              </div>
              <span style={{ minWidth:0 }}>
                <span style={{ display:'block', fontFamily:"'Playfair Display',serif", fontSize:13,
                  fontWeight:700, color:'#2c2416', overflow:'hidden', textOverflow:'ellipsis',
                  whiteSpace:'nowrap' }}>
                  {animal.name}
                </span>
                <span style={{ display:'block', fontSize:10, color:'#c8a060', fontWeight:700 }}>This Animal</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {offspring.length > 0 && (
        <div style={{ padding:'12px 16px', borderBottom:'1px solid #f0ebe4', background:'#fff' }}>
          <p style={{ fontSize:10, fontWeight:700, color:'#a08060', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 10px' }}>
            Offspring
          </p>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            {offspring.map(child => (
              <div key={child.id} style={{ display:'grid', gridTemplateColumns:'34px minmax(0, 1fr)', alignItems:'center',
                gap:8, border:'1px solid #e8e0d0', borderRadius:8, background:'#fdfaf6',
                padding:'7px 9px', minWidth:180, maxWidth:260 }}>
                <div style={{ width:34, height:34, borderRadius:'50%', overflow:'hidden', border:'2px solid #e8e0d0',
                  background:'#f0ebe4', flexShrink:0 }}>
                  <AnimalAvatar animal={child} size={34}/>
                </div>
                <span style={{ minWidth:0 }}>
                  <span style={{ display:'block', fontFamily:"'Playfair Display',serif", fontSize:13, fontWeight:700,
                    color:'#2c2416', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {child.name}
                  </span>
                  <span style={{ display:'block', fontSize:10, color:'#a08060', overflow:'hidden',
                    textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    Sire: {animals.find(a => a.id === child.sire_id)?.name || 'Unknown'} · Dam: {animals.find(a => a.id === child.dam_id)?.name || 'Unknown'}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Events timeline — read only */}
      {animalEvents.length === 0 ? (
        <p style={{ fontSize:13, color:'#a08060', padding:'16px 16px', margin:0, fontStyle:'italic' }}>No events logged for this animal.</p>
      ) : (
        <div style={{ padding:'12px 16px' }}>
          {animalEvents.map((ev, i) => {
            const icon  = EV_ICONS[ev.event_type] || '📝'
            const color = EV_COLORS[ev.event_type] || '#5a3e1b'
            const label = ev.event_type === 'lambing'
              ? 'Birth'
              : (ev.event_type||'').replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())
            const isAlert = ev.event_type==='sickness'||ev.event_type==='injury'
            return (
              <div key={ev.id} style={{ display:'flex', gap:10, paddingBottom:12,
                borderBottom: i < animalEvents.length-1 ? '1px solid #f0ebe4' : 'none', marginBottom: i < animalEvents.length-1 ? 12 : 0 }}>
                {/* Icon */}
                <div style={{ width:36, height:36, borderRadius:8, background:isAlert?'#fff3f3':'#f7f4ef',
                  border:`1px solid ${isAlert?'#f5c6c6':'#e8e0d0'}`, display:'flex', alignItems:'center',
                  justifyContent:'center', fontSize:18, flexShrink:0 }}>
                  {icon}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3, flexWrap:'wrap' }}>
                    <span style={{ fontSize:13, fontWeight:700, color }}>{label}</span>
                    {isAlert && <span style={{ fontSize:9, padding:'1px 6px', borderRadius:6, background:'#c62828', color:'#fff', fontWeight:700 }}>⚠ ALERT</span>}
                    <span style={{ fontSize:11, color:'#a08060', marginLeft:'auto' }}>{formatDate((ev.event_date||'').slice(0,10))}</span>
                  </div>
                  {ev.notes && <p style={{ fontSize:12, color:'#4a3c28', margin:0, lineHeight:1.5 }}>{ev.notes}</p>}
                  {ev.photo_url && (
                    <div style={{ marginTop:6, borderRadius:6, overflow:'hidden', maxWidth:200 }}>
                      <img src={ev.photo_url} alt={label} style={{ width:'100%', height:'auto', display:'block' }}/>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Emulation context ────────────────────────────────────────────────────────
// Stored in localStorage so it survives page reloads
const EMULATION_KEY = 'fh_emulated_user'

export function setEmulatedUser(user) {
  if (user) localStorage.setItem(EMULATION_KEY, JSON.stringify(user))
  else localStorage.removeItem(EMULATION_KEY)
}
export function getEmulatedUser() {
  try { return JSON.parse(localStorage.getItem(EMULATION_KEY)) } catch { return null }
}

// ─── Emulation banner (shown at top of page when emulating) ───────────────────
export function EmulationBanner() {
  const eu = getEmulatedUser()
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [expanded, setExpanded] = useState(window.innerWidth >= 768)

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) setExpanded(true)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  if (!eu) return null

  const switchMode = (writeMode) => {
    setEmulatedUser({ ...eu, writeMode })
    window.location.reload()
  }
  const exit = () => {
    setEmulatedUser(null)
    window.location.href = '/admin'
  }

  if (isMobile && !expanded) {
    return (
      <button onClick={()=>setExpanded(true)}
        className="admin-emulation-pill"
        style={{ position:'fixed', right:12, bottom:'var(--fh-mobile-float-bottom)',
          zIndex:9999, maxWidth:'calc(100vw - 20px)', display:'flex', alignItems:'center', gap:7,
          background:eu.writeMode ? '#9f2d2d' : '#244f87', color:'#fff',
          border:'1px solid rgba(255,255,255,0.28)', borderRadius:999,
          padding:'8px 11px', boxShadow:'0 8px 24px rgba(10,32,22,0.24)',
          cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
        <span style={{ fontSize:13 }}>{eu.writeMode ? '✏️' : '👁'}</span>
        <span style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.04em' }}>
          {eu.writeMode ? 'Editing' : 'Viewing'}
        </span>
        <span style={{ maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
          fontSize:11, opacity:0.86 }}>
          {eu.email}
        </span>
        <span style={{ fontSize:13, opacity:0.9 }}>▴</span>
      </button>
    )
  }

  return (
    <div className="admin-emulation-banner" style={{ position:'fixed', top:0, left:0, right:0, zIndex:9999,
      ...(isMobile ? { top:'auto', bottom:'var(--fh-mobile-float-bottom)', left:'auto', right:10, width:'calc(100vw - 20px)', maxWidth:340, borderRadius:14 } : {}),
      background: eu.writeMode ? '#9f2d2d' : '#244f87',
      color:'#fff', padding:isMobile?'8px 10px':'8px 16px', display:'flex', alignItems:'center',
      flexWrap:isMobile?'wrap':'nowrap', gap:isMobile?6:12, fontSize:isMobile?11:13, fontFamily:"'DM Sans',sans-serif",
      boxShadow:isMobile?'0 8px 26px rgba(10,32,22,0.26)':'0 2px 10px rgba(10,32,22,0.22)' }}>
      <span className="admin-emulation-icon" style={{ fontSize:isMobile?13:16 }}>{eu.writeMode ? '✏️' : '👁'}</span>
      <span className="admin-emulation-label" style={{ fontWeight:700, fontSize:isMobile?10:13 }}>{eu.writeMode ? 'EDITING AS' : 'VIEWING AS'}:</span>
      <span className="admin-emulation-email" style={{ opacity:0.9, flex:isMobile?'1 1 130px':'0 1 auto', minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{eu.email}</span>
      <span className="admin-emulation-mode" style={{ display:isMobile?'none':'inline', fontSize:11, background:'rgba(255,255,255,0.2)', padding:'2px 8px', borderRadius:6, marginLeft:4 }}>
        {eu.writeMode ? 'Write mode — changes affect their real data' : 'Read-only'}
      </span>
      {isMobile && (
        <button onClick={()=>setExpanded(false)}
          className="admin-emulation-btn"
          style={{ marginLeft:'auto', background:'rgba(255,255,255,0.14)', border:'1px solid rgba(255,255,255,0.28)',
            color:'#fff', borderRadius:6, padding:'4px 9px', cursor:'pointer', fontSize:11,
            fontFamily:"'Lato',sans-serif", fontWeight:800 }}>
          Collapse
        </button>
      )}
      <div className="admin-emulation-actions" style={{ marginLeft:isMobile?0:'auto', display:isMobile?'grid':'flex', gridTemplateColumns:isMobile?'1fr auto':undefined, gap:isMobile?6:8, width:isMobile?'100%':'auto' }}>
        {!eu.writeMode
          ? <button onClick={()=>switchMode(true)}
              className="admin-emulation-btn"
              style={{ background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)',
                color:'#fff', borderRadius:6, padding:isMobile?'5px 8px':'4px 12px', cursor:'pointer', fontSize:isMobile?11:12,
                fontFamily:"'Lato',sans-serif", fontWeight:600 }}>
              Switch to Write Mode
            </button>
          : <button onClick={()=>switchMode(false)}
              className="admin-emulation-btn"
              style={{ background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)',
                color:'#fff', borderRadius:6, padding:isMobile?'5px 8px':'4px 12px', cursor:'pointer', fontSize:isMobile?11:12,
                fontFamily:"'Lato',sans-serif", fontWeight:600 }}>
              Switch to Read-Only
            </button>
        }
        <button onClick={exit}
          className="admin-emulation-btn"
          style={{ background:'rgba(255,255,255,0.25)', border:'1px solid rgba(255,255,255,0.4)',
            color:'#fff', borderRadius:6, padding:isMobile?'5px 8px':'4px 12px', cursor:'pointer', fontSize:isMobile?11:12,
            fontFamily:"'Lato',sans-serif", fontWeight:700, whiteSpace:'nowrap' }}>
          ✕ Exit Emulation
        </button>
      </div>
    </div>
  )
}

// ─── Expandable user row ───────────────────────────────────────────────────────
function UserRow({ u, allEvents }) {
  const [open,        setOpen]        = useState(false)
  const [openAnimal,  setOpenAnimal]  = useState(null)

  const flagColor = u.animalCount===0||u.eventCount===0 ? '#c62828'
    : u.daysSinceActive!==null&&u.daysSinceActive>30 ? '#f57f17' : '#2e7d32'
  const flagLabel = u.animalCount===0 ? 'No animals'
    : u.eventCount===0 ? 'No events'
    : u.daysSinceActive!==null&&u.daysSinceActive>30 ? 'Inactive'
    : 'Active ✓'

  return (
    <div className="admin-user-card" style={{ ...S.card, overflow:'hidden' }}>
      {/* Header row — click to expand */}
      <div className="admin-user-row" onClick={()=>{ setOpen(v=>!v); setOpenAnimal(null) }}
        style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 18px', cursor:'pointer',
          background: open ? '#fdfaf0' : '#fff', userSelect:'none', transition:'background 0.15s' }}>

        {/* User info */}
        <div className="admin-user-info" style={{ flex:1, minWidth:0 }}>
          <p style={{ fontSize:14, fontWeight:600, color:'#2c2416', margin:'0 0 2px',
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {u.email || <span style={{ color:'#a08060', fontStyle:'italic' }}>No email</span>}
          </p>
          <div style={{ display:'flex', gap:5, flexWrap:'wrap', alignItems:'center' }}>
            {u.hasSheep    && <span style={{ fontSize:9, padding:'1px 5px', borderRadius:6, background:'#efebe9', color:'#5d4037', fontWeight:700 }}>🐑 Sheep</span>}
            {u.hasChickens && <span style={{ fontSize:9, padding:'1px 5px', borderRadius:6, background:'#fff9e6', color:'#f57f17', fontWeight:700 }}>🐔 Chickens</span>}
            {u.hasHorses   && <span style={{ fontSize:9, padding:'1px 5px', borderRadius:6, background:'#f3ede7', color:'#6d4c41', fontWeight:700 }}>🐴 Horses</span>}
            <span style={{ fontSize:10, color:'#a08060' }}>joined {u.signedUpAt ? formatDate(u.signedUpAt.slice(0,10)) : '—'}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="admin-user-stats" style={{ display:'flex', gap:20, alignItems:'center', flexShrink:0 }}>
          <div style={{ textAlign:'center' }}>
            <p style={{ fontSize:16, fontWeight:700, color:'#2c2416', margin:'0 0 1px' }}>{u.animalCount}</p>
            <p style={{ fontSize:9, color:'#a08060', fontWeight:700, textTransform:'uppercase', margin:0 }}>Animals</p>
          </div>
          <div style={{ textAlign:'center' }}>
            <p style={{ fontSize:16, fontWeight:700, color:'#1565c0', margin:'0 0 1px' }}>{u.eventCount}</p>
            <p style={{ fontSize:9, color:'#a08060', fontWeight:700, textTransform:'uppercase', margin:0 }}>Events</p>
          </div>
          <div style={{ textAlign:'center' }}>
            <p style={{ fontSize:16, fontWeight:700, color:'#2e7d32', margin:'0 0 1px' }}>{u.incomeTotal>0?fmt(u.incomeTotal):'—'}</p>
            <p style={{ fontSize:9, color:'#a08060', fontWeight:700, textTransform:'uppercase', margin:0 }}>Income</p>
          </div>
          <ActivityBadge daysSince={u.daysSinceActive}/>
          <span style={{ fontSize:9, padding:'2px 8px', borderRadius:8,
            background:flagColor==='#2e7d32'?'#e8f5e9':flagColor==='#f57f17'?'#fff9e6':'#fff3f3',
            color:flagColor, fontWeight:700 }}>{flagLabel}</span>
        </div>

        {/* Expand arrow */}
        <span className="admin-user-arrow" style={{ color:'#c8b89a', fontSize:16, transition:'transform 0.2s', transform:open?'rotate(90deg)':'none', flexShrink:0 }}>›</span>

        {/* Emulation buttons */}
        <div className="admin-user-actions" style={{ display:'flex', gap:6, flexShrink:0 }} onClick={e=>e.stopPropagation()}>
          <button onClick={()=>{ setEmulatedUser({ uid:u.id, email:u.email, writeMode:false }); window.location.href='/' }}
            className="admin-user-action-btn"
            style={{ background:'#e3f2fd', border:'1px solid #90caf9', color:'#1565c0',
              borderRadius:6, padding:'4px 10px', cursor:'pointer', fontSize:11,
              fontFamily:"'Lato',sans-serif", fontWeight:700, whiteSpace:'nowrap' }}>
            👁 View as
          </button>
          <button onClick={()=>{ setEmulatedUser({ uid:u.id, email:u.email, writeMode:true }); window.location.href='/' }}
            className="admin-user-action-btn"
            style={{ background:'#fce4ec', border:'1px solid #f48fb1', color:'#ad1457',
              borderRadius:6, padding:'4px 10px', cursor:'pointer', fontSize:11,
              fontFamily:"'Lato',sans-serif", fontWeight:700, whiteSpace:'nowrap' }}>
            ✏️ Edit as
          </button>
        </div>
      </div>

      {/* Expanded — animal list */}
      {open && (
        <div className="admin-user-expanded" style={{ borderTop:'1px solid #f0ebe4', background:'#fafaf8', padding:'14px 18px' }}>
          {u.animals.length === 0 ? (
            <p style={{ fontSize:13, color:'#a08060', margin:0, fontStyle:'italic' }}>This user hasn't added any animals yet.</p>
          ) : (
            <>
              <p style={{ fontSize:11, fontWeight:700, color:'#a08060', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 12px' }}>
                Flock — {u.animals.length} animal{u.animals.length!==1?'s':''}
              </p>
              <div className="admin-user-animal-list" style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {u.animals.map(a => {
                  const isOpen = openAnimal===a.id
                  const statusColors = { alive:'#4caf50', sold:'#9c27b0', deceased:'#9e9e9e', rented:'#f9a825' }
                  const evCount = allEvents.filter(e=>e.animal_id===a.id).length

                  const handleAdminDelete = async (e) => {
                    e.stopPropagation()
                    if (!window.confirm(`Delete ${a.name} from ${u.email}'s account? This cannot be undone.`)) return
                    const { error } = await supabase.from('fh_animals').delete().eq('id', a.id).eq('user_id', u.id)
                    if (error) { alert('Delete failed: ' + error.message); return }
                    // Remove from local state
                    u.animals = u.animals.filter(x => x.id !== a.id)
                    setOpenAnimal(null)
                    window.location.reload()
                  }

                  return (
                    <div key={a.id}>
                      {/* Animal row */}
                      <div onClick={()=>setOpenAnimal(isOpen?null:a.id)}
                        style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:9,
                          background: isOpen ? '#f0ebe4' : '#fff', border:'1px solid #e8e0d0',
                          cursor:'pointer', userSelect:'none', transition:'background 0.15s' }}>
                        <div style={{ width:38, height:38, borderRadius:'50%', overflow:'hidden',
                          border:`2px solid ${statusColors[a.status]||'#9e9e9e'}`, background:'#f0ebe4', flexShrink:0 }}>
                          <AnimalAvatar animal={a} size={38}/>
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
                            <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:14, color:'#2c2416' }}>{a.name}</span>
                            <span style={{ fontSize:9, padding:'1px 6px', borderRadius:6, background:statusColors[a.status]||'#9e9e9e', color:'#fff', fontWeight:700, textTransform:'uppercase' }}>{a.status}</span>
                          </div>
                          <span style={{ fontSize:11, color:'#a08060' }}>
                            {a.breed||'Unknown'} · {a.sex} · {evCount} event{evCount!==1?'s':''}
                          </span>
                        </div>
                        <button onClick={handleAdminDelete}
                          style={{ background:'#fff3f3', border:'1px solid #ffcdd2', color:'#c62828',
                            borderRadius:6, padding:'4px 10px', cursor:'pointer', fontSize:11,
                            fontFamily:"'Lato',sans-serif", fontWeight:700, flexShrink:0 }}>
                          🗑 Delete
                        </button>
                        <span style={{ color:'#c8b89a', fontSize:14, transition:'transform 0.2s', transform:isOpen?'rotate(90deg)':'none' }}>›</span>
                      </div>

                      {/* Animal events drill-down */}
                      {isOpen && <AnimalDetailPanel animal={a} animals={u.animals} events={allEvents} onOpenAnimal={setOpenAnimal}/>}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Admin Page ───────────────────────────────────────────────────────────
export function AdminPage() {
  const isAdmin  = useAdmin()
  const navigate = useNavigate()
  const [tab,     setTab]     = useState('overview')
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [data,    setData]    = useState({
    users:         [],
    totalAnimals:  0,
    totalEvents:   0,
    totalIncome:   0,
    totalCosts:    0,
    signupsByDay:  [],
    eventsByType:  [],
    recentEvents:  [],
    speciesBreakdown: {},
  })

  useEffect(() => {
    if (!isAdmin) return
    loadAll()
  }, [isAdmin])

  const loadAll = async () => {
    setLoading(true)
    try {
      // ── Fetch all users from auth (via a service-role workaround using public profiles)
      // We use fh_animals grouped by user_id to infer users + activity
      const [animals, events, income, costs, emailsRes] = await Promise.all([
        supabase.from('fh_animals').select('*'),
        supabase.from('fh_animal_events').select('id, user_id, animal_id, event_type, event_date, notes, photo_url, created_at'),
        supabase.from('fh_income').select('id, user_id, amount, date, created_at'),
        supabase.from('fh_feed_costs').select('id, user_id, amount, date, created_at'),
        supabase.rpc('get_admin_user_emails'),
      ])

      // Build email lookup map
      const emailMap = {}
      ;(emailsRes.data || []).forEach(u => { emailMap[u.id] = { email: u.email, signedUpAt: u.created_at, lastSignIn: u.last_sign_in_at } })

      const eventsData  = (events.data  || []).filter(e => e.user_id)
      const animalsData = mergeAnimalEventData(
        (animals.data || []).filter(a => a.user_id),
        eventsData,
      )
      const incomeData  = (income.data  || []).filter(i => i.user_id)
      const costsData   = (costs.data   || []).filter(c => c.user_id)

      // ── Build user map from all activity
      const userMap = {}
      const addUser = (uid, extra={}) => {
        if (!userMap[uid]) userMap[uid] = {
          id: uid, animals:[], events:[], income:[], costs:[],
          firstSeen: null, lastActive: null,
        }
        Object.assign(userMap[uid], extra)
      }

      animalsData.forEach(a => {
        addUser(a.user_id)
        userMap[a.user_id].animals.push(a)
        const d = new Date(a.created_at)
        if (!userMap[a.user_id].firstSeen || d < new Date(userMap[a.user_id].firstSeen))
          userMap[a.user_id].firstSeen = a.created_at
      })

      eventsData.forEach(e => {
        addUser(e.user_id)
        userMap[e.user_id].events.push(e)
        const d = new Date(e.created_at)
        if (!userMap[e.user_id].lastActive || d > new Date(userMap[e.user_id].lastActive))
          userMap[e.user_id].lastActive = e.created_at
      })

      incomeData.forEach(i => {
        addUser(i.user_id)
        userMap[i.user_id].income.push(i)
        const d = new Date(i.created_at)
        if (!userMap[i.user_id].lastActive || d > new Date(userMap[i.user_id].lastActive))
          userMap[i.user_id].lastActive = i.created_at
      })

      costsData.forEach(c => {
        addUser(c.user_id)
        userMap[c.user_id].costs.push(c)
      })

      animalsData.forEach(a => {
        const d = new Date(a.created_at)
        if (!userMap[a.user_id].lastActive || d > new Date(userMap[a.user_id].lastActive))
          userMap[a.user_id].lastActive = a.created_at
      })

      // ── Compute days since last active
      const now = new Date()
      const users = Object.values(userMap).map(u => ({
        ...u,
        email:      emailMap[u.id]?.email        || null,
        signedUpAt: emailMap[u.id]?.signedUpAt   || u.firstSeen,
        lastSignIn: emailMap[u.id]?.lastSignIn   || null,
        daysSinceActive: u.lastActive
          ? Math.floor((now - new Date(u.lastActive)) / 86400000)
          : null,
        animalCount:  u.animals.length,
        eventCount:   u.events.length,
        incomeTotal:  u.income.reduce((s,i) => s + Number(i.amount), 0),
        hasSheep:     u.animals.some(a => a.species === 'sheep'),
        hasChickens:  u.animals.some(a => a.species === 'chickens'),
        hasHorses:    u.animals.some(a => a.species === 'horses'),
        activeAnimals:u.animals.filter(a => a.status === 'alive' || a.status === 'rented').length,
      })).sort((a,b) => (b.lastActive||'') > (a.lastActive||'') ? 1 : -1)

      // ── Signups by day (last 14 days) — approximate from first animal added
      const signupDays = {}
      for (let i = 13; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i)
        const key = d.toISOString().slice(0,10)
        signupDays[key] = 0
      }
      users.forEach(u => {
        if (u.firstSeen) {
          const key = u.firstSeen.slice(0,10)
          if (signupDays[key] !== undefined) signupDays[key]++
        }
      })
      const signupsByDay = Object.entries(signupDays).map(([date, value]) => ({
        label: new Date(date+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'}),
        value,
      }))

      // ── Events by type
      const typeMap = {}
      eventsData.forEach(e => {
        typeMap[e.event_type] = (typeMap[e.event_type]||0) + 1
      })
      const eventsByType = Object.entries(typeMap)
        .map(([type, count]) => ({ type, count }))
        .sort((a,b) => b.count - a.count)
        .slice(0, 8)

      // ── Most recently created events across every farm
      const animalMap = Object.fromEntries(animalsData.map(animal => [animal.id, animal]))
      const recentEvents = [...eventsData]
        .sort((a, b) => new Date(b.created_at || b.event_date || 0) - new Date(a.created_at || a.event_date || 0))
        .slice(0, 30)
        .map(event => ({
          ...event,
          animal: animalMap[event.animal_id] || null,
          email: emailMap[event.user_id]?.email || null,
        }))

      // ── Species breakdown
      const speciesBreakdown = {
        sheep:    animalsData.filter(a => a.species==='sheep').length,
        chickens: animalsData.filter(a => a.species==='chickens').length,
        horses:   animalsData.filter(a => a.species==='horses').length,
      }

      // Also add users who signed up but have zero farm data
      ;(emailsRes.data || []).forEach(authUser => {
        if (!userMap[authUser.id]) {
          users.push({
            id: authUser.id, email: authUser.email,
            signedUpAt: authUser.created_at, lastSignIn: authUser.last_sign_in_at,
            animals:[], events:[], income:[], costs:[],
            firstSeen: authUser.created_at, lastActive: authUser.last_sign_in_at,
            daysSinceActive: authUser.last_sign_in_at
              ? Math.floor((now - new Date(authUser.last_sign_in_at)) / 86400000)
              : null,
            animalCount:0, eventCount:0, incomeTotal:0, activeAnimals:0,
            hasSheep:false, hasChickens:false, hasHorses:false,
          })
        }
      })

      setData({
        users,
        totalAnimals:  animalsData.length,
        totalEvents:   eventsData.length,
        totalIncome:   incomeData.reduce((s,i) => s+Number(i.amount), 0),
        totalCosts:    costsData.reduce((s,c) => s+Number(c.amount), 0),
        signupsByDay,
        eventsByType,
        recentEvents,
        speciesBreakdown,
      })
    } catch (err) {
      console.error('Admin load error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isAdmin) return (
    <div style={{ ...S.page, display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🔒</div>
        <p style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, marginBottom:8 }}>Admin Access Only</p>
        <button onClick={()=>navigate('/')} style={{ ...S.btn, ...S.btnPrimary }}>Go Home</button>
      </div>
    </div>
  )

  // ── Derived stats
  const activeThisWeek  = data.users.filter(u => u.daysSinceActive !== null && u.daysSinceActive <= 7).length
  const activeThisMonth = data.users.filter(u => u.daysSinceActive !== null && u.daysSinceActive <= 30).length
  const neverActive     = data.users.filter(u => u.eventCount === 0 && u.animalCount === 0).length
  const atRisk          = data.users.filter(u => u.daysSinceActive !== null && u.daysSinceActive > 14).length
  const avgAnimals      = data.users.length ? (data.totalAnimals / data.users.length).toFixed(1) : 0
  const avgEvents       = data.users.length ? (data.totalEvents / data.users.length).toFixed(1) : 0

  const filteredUsers = data.users.filter(u =>
    !search ||
    (u.email||'').toLowerCase().includes(search.toLowerCase()) ||
    (u.id||'').toLowerCase().includes(search.toLowerCase()) ||
    u.animals.some(a => (a.name||'').toLowerCase().includes(search.toLowerCase()))
  )

  const tabs = [
    { key:'overview',  label:'📊 Overview' },
    { key:'users',     label:'👥 Users' },
    { key:'activity',  label:'⚡ Activity' },
    { key:'health',    label:'🌾 Farm Health' },
  ]

  return (
    <div className="admin-page-root" style={{ ...S.page, padding:'24px', background:'#f7f4ef', minHeight:'100vh' }}>
      <style>{`
        @media(max-width:767px){
          .admin-page-root{padding:12px!important;padding-bottom:calc(var(--fh-mobile-page-bottom) + 36px)!important;max-width:none!important;}
          .admin-grid-3{grid-template-columns:1fr!important;}
          .admin-grid-3 > *{grid-column:auto!important;}
          .admin-grid-4{grid-template-columns:1fr 1fr!important;gap:8px!important;}
          .admin-grid-2{grid-template-columns:1fr!important;gap:10px!important;}
          .admin-header{align-items:flex-start!important;margin-bottom:14px!important;}
          .admin-header-actions{width:100%!important;display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important;}
          .admin-header-actions button{justify-content:center!important;padding:8px 10px!important;font-size:12px!important;}
          .admin-tabs{width:calc(100vw - 24px)!important;max-width:100%!important;overflow-x:auto!important;flex-wrap:nowrap!important;margin-bottom:14px!important;-webkit-overflow-scrolling:touch;}
          .admin-tabs button{flex:0 0 auto!important;white-space:nowrap!important;padding:7px 12px!important;font-size:12px!important;}
          .admin-user-card{border-radius:10px!important;}
          .admin-user-row{display:grid!important;grid-template-columns:1fr auto!important;gap:10px!important;padding:12px!important;align-items:start!important;}
          .admin-user-info{grid-column:1 / -1!important;width:100%!important;}
          .admin-user-info p{white-space:normal!important;overflow-wrap:anywhere!important;line-height:1.25!important;}
          .admin-user-stats{grid-column:1 / -1!important;display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:8px!important;width:100%!important;padding:8px 0!important;border-top:1px solid #f0ebe4!important;border-bottom:1px solid #f0ebe4!important;}
          .admin-user-stats > span{justify-self:center!important;align-self:center!important;text-align:center!important;}
          .admin-user-arrow{position:absolute!important;top:12px!important;right:12px!important;}
          .admin-user-actions{grid-column:1 / -1!important;display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important;width:100%!important;}
          .admin-user-action-btn{width:100%!important;justify-content:center!important;padding:9px 10px!important;font-size:12px!important;}
          .admin-user-expanded{padding:12px!important;padding-bottom:calc(22px + env(safe-area-inset-bottom))!important;max-height:calc(100vh - 190px)!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;}
          .admin-user-animal-list{padding-bottom:calc(88px + env(safe-area-inset-bottom))!important;}
          .admin-animal-detail-panel{max-height:calc(100vh - 260px)!important;overflow-y:auto!important;}
          .admin-recent-events button{grid-template-columns:38px minmax(0,1fr) auto!important;gap:9px!important;padding:11px 2px!important;}
          .admin-recent-events button > span:nth-child(3){grid-column:2 / -1!important;}
          .admin-recent-events button > span:nth-child(4){grid-column:3!important;grid-row:1!important;font-size:10px!important;}
          .admin-emulation-banner{top:auto!important;bottom:var(--fh-mobile-float-bottom)!important;left:auto!important;right:10px!important;width:calc(100vw - 20px)!important;max-width:340px!important;border-radius:14px!important;padding:8px 10px!important;gap:6px!important;font-size:11px!important;box-shadow:0 8px 26px rgba(0,0,0,0.30)!important;flex-wrap:wrap!important;align-items:center!important;}
          .admin-emulation-icon{font-size:13px!important;}
          .admin-emulation-label{font-size:10px!important;}
          .admin-emulation-email{flex:1 1 130px!important;min-width:0!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;}
          .admin-emulation-mode{display:none!important;}
          .admin-emulation-actions{margin-left:0!important;display:grid!important;grid-template-columns:1fr auto!important;gap:6px!important;width:100%!important;}
          .admin-emulation-btn{padding:5px 8px!important;font-size:11px!important;white-space:nowrap!important;}
        }
      `}</style>

      {/* Header */}
      <div className="admin-header" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:700, margin:'0 0 4px' }}>
            🌾 FarmHand Admin
          </h1>
          <p style={{ fontSize:13, color:'#a08060', margin:0 }}>
            Platform overview · {data.users.length} registered users
          </p>
        </div>
        <div className="admin-header-actions" style={{ display:'flex', gap:10, alignItems:'center' }}>
          <button onClick={loadAll} style={{ ...S.btn, ...S.btnSecondary, padding:'7px 14px', fontSize:13 }}>
            ↻ Refresh
          </button>
          <button onClick={()=>navigate('/')} style={{ ...S.btn, ...S.btnPrimary, padding:'7px 14px', fontSize:13 }}>
            ← Back to App
          </button>
        </div>
      </div>

      {/* Tab nav */}
      <div className="admin-tabs" style={{ display:'flex', background:'#f0e8d8', borderRadius:10, padding:3, gap:2, marginBottom:24, width:'fit-content', flexWrap:'wrap' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={()=>setTab(t.key)}
            style={{ ...S.btn, padding:'7px 16px', fontSize:13, borderRadius:8,
              background:tab===t.key?'#5a3e1b':'transparent',
              color:tab===t.key?'#fff':'#7a6648', border:'none', transition:'all 0.2s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'80px 0' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>⏳</div>
          <p style={{ color:'#a08060', fontSize:15 }}>Loading platform data…</p>
        </div>
      ) : (
        <>
          {/* ── OVERVIEW TAB ────────────────────────────────────────────── */}
          {tab==='overview' && (
            <>
              {/* Top KPIs */}
              <div className="admin-grid-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
                <StatCard emoji="👥" label="Total Users"    value={data.users.length}    sub={`${activeThisMonth} active this month`} color="#2c2416"/>
                <StatCard emoji="🐾" label="Total Animals"  value={data.totalAnimals}    sub={`avg ${avgAnimals} per farm`}           color="#5a3e1b"/>
                <StatCard emoji="📋" label="Total Events"   value={data.totalEvents}     sub={`avg ${avgEvents} per farm`}            color="#1565c0"/>
                <StatCard emoji="💰" label="Income Tracked" value={fmt(data.totalIncome)} sub={`${fmt(data.totalCosts)} expenses`}    color="#2e7d32" bg="#f1f8f1"/>
              </div>

              {/* Engagement KPIs */}
              <div className="admin-grid-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
                <StatCard emoji="🟢" label="Active (7d)"    value={activeThisWeek}   sub="logged in last 7 days"  color="#2e7d32" bg="#f1f8f1"/>
                <StatCard emoji="🟡" label="Active (30d)"   value={activeThisMonth}  sub="logged in last 30 days" color="#f57f17" bg="#fff9e6"/>
                <StatCard emoji="🔴" label="At Risk (14d+)" value={atRisk}           sub="no activity in 2 weeks" color="#c62828" bg="#fff3f3"/>
                <StatCard emoji="⚪" label="Never Active"   value={neverActive}      sub="signed up, no activity" color="#9e9e9e"/>
              </div>

              {/* Species + signups charts side by side */}
              <div className="admin-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
                {/* Signups over time */}
                <div style={{ ...S.card, padding:'18px 20px' }}>
                  <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:15, margin:'0 0 16px' }}>
                    New Farms — Last 14 Days
                  </p>
                  <MiniBarChart data={data.signupsByDay} color="#5a3e1b" height={80}/>
                </div>

                {/* Species breakdown */}
                <div style={{ ...S.card, padding:'18px 20px' }}>
                  <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:15, margin:'0 0 16px' }}>
                    Species on Platform
                  </p>
                  {[
                    { label:'🐑 Sheep farms',    count: data.users.filter(u=>u.hasSheep).length,    color:'#5d4037', total:data.users.length },
                    { label:'🐔 Chicken farms',  count: data.users.filter(u=>u.hasChickens).length, color:'#f9a825', total:data.users.length },
                    { label:'🐴 Horse farms',    count: data.users.filter(u=>u.hasHorses).length,   color:'#6d4c41', total:data.users.length },
                    { label:'Mixed species',     count: data.users.filter(u=>[u.hasSheep,u.hasChickens,u.hasHorses].filter(Boolean).length>1).length, color:'#2e7d32', total:data.users.length },
                  ].map(s => (
                    <div key={s.label} style={{ marginBottom:12 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                        <span style={{ fontSize:13, fontWeight:600, color:'#2c2416' }}>{s.label}</span>
                        <span style={{ fontSize:13, fontWeight:700, color:'#2c2416' }}>{s.count}</span>
                      </div>
                      <div style={{ height:8, borderRadius:4, background:'#f0ebe4', overflow:'hidden' }}>
                        <div style={{ height:'100%', borderRadius:4, background:s.color, width:`${s.total ? (s.count/s.total)*100 : 0}%`, transition:'width 0.4s' }}/>
                      </div>
                    </div>
                  ))}
                  <div style={{ marginTop:16 }}>
                    <p style={{ fontSize:11, fontWeight:700, color:'#a08060', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 10px' }}>Total Animals</p>
                    {[
                      { label:'🐑 Sheep',    count:data.speciesBreakdown.sheep    || 0, color:'#5d4037' },
                      { label:'🐔 Chickens', count:data.speciesBreakdown.chickens || 0, color:'#f9a825' },
                      { label:'🐴 Horses',   count:data.speciesBreakdown.horses   || 0, color:'#6d4c41' },
                    ].map(s => (
                      <div key={s.label} style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                        <span style={{ fontSize:13, color:'#4a3c28' }}>{s.label}</span>
                        <span style={{ fontSize:13, fontWeight:700, color:s.color }}>{s.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top event types */}
              <div style={{ ...S.card, padding:'18px 20px' }}>
                <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:15, margin:'0 0 16px' }}>
                  Most Used Event Types
                </p>
                {data.eventsByType.length === 0
                  ? <p style={{ color:'#a08060', fontSize:13 }}>No events logged yet.</p>
                  : data.eventsByType.map((e, i) => {
                    const max = data.eventsByType[0]?.count || 1
                    return (
                      <div key={e.type} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
                        <span style={{ fontSize:12, color:'#a08060', width:16, textAlign:'right' }}>#{i+1}</span>
                        <span style={{ fontSize:13, fontWeight:600, color:'#2c2416', width:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {e.type.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
                        </span>
                        <div style={{ flex:1, height:10, borderRadius:5, background:'#f0ebe4', overflow:'hidden' }}>
                          <div style={{ height:'100%', borderRadius:5, background:'#5a3e1b', width:`${(e.count/max)*100}%`, transition:'width 0.4s' }}/>
                        </div>
                        <span style={{ fontSize:13, fontWeight:700, color:'#2c2416', width:32, textAlign:'right' }}>{e.count}</span>
                      </div>
                    )
                  })
                }
              </div>
            </>
          )}

          {/* ── USERS TAB ────────────────────────────────────────────────── */}
          {tab==='users' && (
            <>
              <input style={{ ...S.input, marginBottom:16, maxWidth:400 }}
                placeholder="Search by email, user ID or animal name…"
                value={search} onChange={e=>setSearch(e.target.value)}/>

              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {filteredUsers.length === 0
                  ? <p style={{ color:'#a08060', fontSize:14, padding:'32px 0', textAlign:'center' }}>No users found.</p>
                  : filteredUsers.map((u, idx) => (
                    <UserRow key={u.id||idx} u={u} allEvents={u.events||[]}/>
                  ))
                }
              </div>
            </>
          )}

          {/* ── ACTIVITY TAB ─────────────────────────────────────────────── */}
          {tab==='activity' && (
            <>
              <div style={{ ...S.card, padding:'18px 20px', marginBottom:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start',
                  gap:12, marginBottom:14, flexWrap:'wrap' }}>
                  <div>
                    <p style={{ fontFamily:"'Manrope',sans-serif", fontWeight:800, fontSize:16, margin:'0 0 3px' }}>
                      Recent Events Across All Farms
                    </p>
                    <p style={{ fontSize:12, color:'#66736c', margin:0 }}>
                      Newest activity first. Select an event to open that user in Admin.
                    </p>
                  </div>
                  <span style={{ fontSize:11, fontWeight:800, color:'#176b47', background:'#e8f4ee',
                    border:'1px solid #cfe4d9', borderRadius:999, padding:'4px 9px' }}>
                    Latest {data.recentEvents.length}
                  </span>
                </div>

                {data.recentEvents.length === 0 ? (
                  <p style={{ color:'#66736c', fontSize:13, padding:'16px 0', margin:0 }}>No events logged yet.</p>
                ) : (
                  <div className="admin-recent-events" style={{ display:'flex', flexDirection:'column',
                    borderTop:'1px solid #e6ece8', maxHeight:560, overflowY:'auto' }}>
                    {data.recentEvents.map(event => {
                      const eventMeta = getEventMeta(event.event_type)
                      const ownerLabel = event.email || `${(event.user_id || 'Unknown user').slice(0, 14)}…`
                      const createdLabel = event.created_at
                        ? new Date(event.created_at).toLocaleString('en-US', {
                            month:'short', day:'numeric', hour:'numeric', minute:'2-digit',
                          })
                        : null
                      return (
                        <button key={event.id} type="button"
                          onClick={() => { setSearch(event.email || event.user_id || ''); setTab('users') }}
                          style={{ display:'grid', gridTemplateColumns:'42px minmax(0, 1.5fr) minmax(150px, 1fr) auto',
                            alignItems:'center', gap:12, width:'100%', padding:'11px 4px',
                            border:'none', borderBottom:'1px solid #edf1ef', background:'transparent',
                            color:'#17211c', textAlign:'left', cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                          <span style={{ width:38, height:38, display:'grid', placeItems:'center',
                            borderRadius:9, background:eventMeta.bg, border:`1px solid ${eventMeta.border}`,
                            color:eventMeta.color, fontSize:18 }}>
                            {eventMeta.icon}
                          </span>
                          <span style={{ minWidth:0 }}>
                            <span style={{ display:'block', fontWeight:800, fontSize:13,
                              color:eventMeta.color, marginBottom:2 }}>
                              {eventMeta.label}
                            </span>
                            <span style={{ display:'block', fontSize:12, color:'#536259',
                              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {event.animal?.name || 'Unknown animal'}
                              {event.animal?.species ? ` · ${event.animal.species}` : ''}
                              {event.notes ? ` · ${event.notes}` : ''}
                            </span>
                          </span>
                          <span style={{ minWidth:0 }}>
                            <span style={{ display:'block', fontSize:12, fontWeight:700, color:'#26352d',
                              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {ownerLabel}
                            </span>
                            <span style={{ display:'block', fontSize:11, color:'#89948e', marginTop:2 }}>
                              Event date: {formatDate(event.event_date)}
                            </span>
                          </span>
                          <span style={{ fontSize:11, color:'#66736c', whiteSpace:'nowrap', textAlign:'right' }}>
                            {createdLabel || formatDate(event.event_date)}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="admin-grid-3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20 }}>
                {/* Most active farms */}
                <div style={{ ...S.card, padding:'18px 20px', gridColumn:'span 2' }}>
                  <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:15, margin:'0 0 14px' }}>
                    🏆 Most Active Farms
                  </p>
                  {data.users
                    .filter(u => u.eventCount > 0)
                    .slice(0, 8)
                    .map((u, i) => (
                      <div key={u.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 0',
                        borderBottom:'1px solid #f0ebe4' }}>
                        <span style={{ fontSize:13, fontWeight:700, color:'#c8a060', width:20 }}>#{i+1}</span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ fontSize:13, fontWeight:600, color:'#5a3e1b', margin:'0 0 2px',
                            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {u.email || (u.id||'unknown').slice(0,22)+'…'}
                          </p>
                          <p style={{ fontSize:11, color:'#a08060', margin:0 }}>
                            {u.animalCount} animals · {u.hasSheep?'🐑':''}  {u.hasChickens?'🐔':''} {u.hasHorses?'🐴':''}
                          </p>
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <p style={{ fontSize:15, fontWeight:700, color:'#1565c0', margin:'0 0 2px' }}>{u.eventCount} events</p>
                          <ActivityBadge daysSince={u.daysSinceActive}/>
                        </div>
                      </div>
                    ))
                  }
                  {data.users.filter(u => u.eventCount > 0).length === 0 &&
                    <p style={{ color:'#a08060', fontSize:13 }}>No events logged yet.</p>}
                </div>

                {/* At-risk users */}
                <div style={{ ...S.card, padding:'18px 20px' }}>
                  <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:15, margin:'0 0 14px' }}>
                    ⚠️ At Risk (14d+)
                  </p>
                  {data.users
                    .filter(u => u.daysSinceActive !== null && u.daysSinceActive > 14)
                    .slice(0, 8)
                    .map(u => (
                      <div key={u.id} style={{ padding:'8px 0', borderBottom:'1px solid #f0ebe4' }}>
                        <p style={{ fontSize:13, fontWeight:600, color:'#c62828', margin:'0 0 2px',
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {u.email || (u.id||'unknown').slice(0,20)+'…'}
                        </p>
                        <p style={{ fontSize:11, color:'#a08060', margin:0 }}>
                          {u.animalCount} animals · last active {u.daysSinceActive}d ago
                        </p>
                      </div>
                    ))
                  }
                  {atRisk === 0 && <p style={{ color:'#2e7d32', fontSize:13 }}>✓ No at-risk users.</p>}
                </div>
              </div>

              {/* Never active */}
              {neverActive > 0 && (
                <div style={{ ...S.card, padding:'18px 20px', background:'#fff3f3', border:'1px solid #f5c6c6' }}>
                  <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:15, margin:'0 0 4px', color:'#c62828' }}>
                    ⚪ {neverActive} User{neverActive!==1?'s':''} — Never Active
                  </p>
                  <p style={{ fontSize:13, color:'#7a3030', margin:'0 0 12px' }}>
                    These users registered but have never added an animal or logged an event. Prime candidates for an onboarding follow-up.
                  </p>
                  {data.users.filter(u => u.eventCount===0 && u.animalCount===0).map(u => (
                    <div key={u.id} style={{ fontSize:11, fontFamily:'monospace', color:'#c62828', marginBottom:4,
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {u.id} · joined {u.firstSeen ? formatDate(u.firstSeen.slice(0,10)) : 'unknown'}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── FARM HEALTH TAB ──────────────────────────────────────────── */}
          {tab==='health' && (
            <>
              <div className="admin-grid-3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
                <StatCard emoji="📊" label="Avg Animals/Farm"    value={avgAnimals}   color="#5a3e1b"/>
                <StatCard emoji="📋" label="Avg Events/Farm"     value={avgEvents}    color="#1565c0"/>
                <StatCard emoji="💰" label="Avg Income/Farm"     value={fmt(data.users.length ? data.totalIncome/data.users.length : 0)} color="#2e7d32" bg="#f1f8f1"/>
              </div>

              {/* Engagement funnel */}
              <div style={{ ...S.card, padding:'18px 20px', marginBottom:14 }}>
                <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:15, margin:'0 0 16px' }}>
                  Engagement Funnel
                </p>
                {[
                  { label:'Registered',             count:data.users.length,                                                           color:'#5a3e1b' },
                  { label:'Added at least 1 animal', count:data.users.filter(u=>u.animalCount>0).length,                               color:'#795548' },
                  { label:'Logged at least 1 event', count:data.users.filter(u=>u.eventCount>0).length,                                color:'#1565c0' },
                  { label:'Logged P&L entry',        count:data.users.filter(u=>u.incomeTotal>0).length,                               color:'#2e7d32' },
                  { label:'Active this week',        count:activeThisWeek,                                                             color:'#4caf50' },
                ].map((step, i) => {
                  const pct = data.users.length ? Math.round((step.count/data.users.length)*100) : 0
                  return (
                    <div key={step.label} style={{ marginBottom:14 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                        <span style={{ fontSize:13, fontWeight:600, color:'#2c2416' }}>{step.label}</span>
                        <span style={{ fontSize:13, fontWeight:700, color:step.color }}>{step.count} <span style={{ color:'#a08060', fontWeight:400 }}>({pct}%)</span></span>
                      </div>
                      <div style={{ height:12, borderRadius:6, background:'#f0ebe4', overflow:'hidden' }}>
                        <div style={{ height:'100%', borderRadius:6, background:step.color, width:`${pct}%`, transition:'width 0.4s', opacity:0.85 }}/>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Farms with most income tracked */}
              <div style={{ ...S.card, padding:'18px 20px' }}>
                <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:15, margin:'0 0 14px' }}>
                  💰 Top Farms by Income Tracked
                </p>
                {data.users
                  .filter(u => u.incomeTotal > 0)
                  .sort((a,b) => b.incomeTotal - a.incomeTotal)
                  .slice(0, 8)
                  .map((u, i) => (
                    <div key={u.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 0', borderBottom:'1px solid #f0ebe4' }}>
                      <span style={{ fontSize:13, fontWeight:700, color:'#c8a060', width:20 }}>#{i+1}</span>
                      <p style={{ fontSize:13, fontWeight:600, color:'#5a3e1b', flex:1, margin:0,
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {u.email || (u.id||'unknown').slice(0,26)+'…'}
                      </p>
                      <span style={{ fontSize:14, fontWeight:700, color:'#2e7d32' }}>{fmt(u.incomeTotal)}</span>
                    </div>
                  ))
                }
                {data.users.filter(u => u.incomeTotal > 0).length === 0 &&
                  <p style={{ color:'#a08060', fontSize:13 }}>No income logged yet.</p>}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
