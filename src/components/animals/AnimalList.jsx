import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAnimals } from '../../hooks/useAnimals'
import { useIsMobile } from '../../hooks/useIsMobile'
import { S, AnimalIllustration, STATUS_STYLES, STATUS_DOT, calcAge, SEX_LABELS } from '../ui/shared'

const SPECIES_META = {
  sheep:    { emoji:'🐑', singular:'Sheep',   plural:'Sheep',    label:'Flock' },
  chickens: { emoji:'🐔', singular:'Chicken', plural:'Chickens', label:'Chickens' },
}

// ─── Compact sticky strip ──────────────────────────────────────────────────────
function FlockStrip({ animals, species, activeCount, isMobile, onAdd, onBulkEvent, navigate }) {
  const meta     = SPECIES_META[species] || SPECIES_META.sheep
  const active   = animals.filter(a => a.status==='alive'||a.status==='rented')
  const inactive = animals.filter(a => a.status!=='alive'&&a.status!=='rented')
  const all      = [...active, ...inactive]

  return (
    <div style={{ background:'linear-gradient(160deg,#2c2416 0%,#4a3520 100%)',
      padding:'8px 14px', display:'flex', alignItems:'center', gap:10,
      borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
      {/* Active count badge */}
      <div style={{ background:'rgba(200,160,96,0.2)', border:'1px solid rgba(200,160,96,0.4)',
        borderRadius:8, padding:'4px 10px', textAlign:'center', flexShrink:0 }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700,
          color:'#c8a060', lineHeight:1 }}>{activeCount}</div>
        <div style={{ fontSize:8, color:'#a08060', fontWeight:700, textTransform:'uppercase',
          letterSpacing:'0.05em' }}>Active</div>
      </div>

      {/* Scrollable avatars */}
      <div style={{ display:'flex', gap:6, overflowX:'auto', flex:1,
        WebkitOverflowScrolling:'touch', scrollbarWidth:'none' }}>
        {all.map(a => {
          const isInactive = a.status!=='alive'&&a.status!=='rented'
          return (
            <div key={a.id} onClick={()=>navigate(`/animals/${a.id}`)}
              style={{ display:'flex', flexDirection:'column', alignItems:'center',
                gap:2, flexShrink:0, cursor:'pointer', opacity:isInactive?0.4:1 }}>
              <div style={{ position:'relative' }}>
                <div style={{ width:32, height:32, borderRadius:'50%', overflow:'hidden',
                  border:`2px solid ${isInactive?'#666':(STATUS_DOT[a.status]||'#9e9e9e')}`,
                  filter:isInactive?'grayscale(0.7)':'none', background:'#f0ebe4' }}>
                  {a.photo_url
                    ? <img src={a.photo_url} alt={a.name} style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
                    : <AnimalIllustration animal={a} size={32}/>
                  }
                </div>
                {isInactive && <div style={{ width:6,height:6,borderRadius:'50%',
                  background:'#c62828',position:'absolute',bottom:0,right:0,
                  border:'1px solid #2c2416' }}/>}
              </div>
              <span style={{ fontSize:7, fontWeight:700, color:isInactive?'#6a5040':'#c8a878',
                textTransform:'uppercase', whiteSpace:'nowrap', maxWidth:36,
                overflow:'hidden', textOverflow:'ellipsis', textAlign:'center' }}>
                {a.name}
              </span>
            </div>
          )
        })}
      </div>

      {/* Action buttons */}
      <div style={{ display:'flex', gap:6, flexShrink:0 }}>
        <button onClick={onAdd}
          style={{ ...S.btn, background:'#c8a060', color:'#2c2416',
            fontWeight:700, padding:'6px 10px', fontSize:11, borderRadius:7 }}>
          ＋ Add
        </button>
        <button onClick={onBulkEvent}
          style={{ ...S.btn, background:'rgba(255,255,255,0.12)', color:'#f0e6cc',
            border:'1px solid rgba(255,255,255,0.2)', padding:'6px 10px', fontSize:11, borderRadius:7 }}>
          ☑ Bulk Event
        </button>
      </div>
    </div>
  )
}

// ─── Main AnimalList ───────────────────────────────────────────────────────────
export function AnimalList({ species = 'sheep' }) {
  const navigate  = useNavigate()
  const isMobile  = useIsMobile()
  const { animals = [], loading, error } = useAnimals(species)
  const meta      = SPECIES_META[species] || SPECIES_META.sheep
  const [filter,     setFilter]     = useState('alive')
  const [search,     setSearch]     = useState('')
  const [selecting,  setSelecting]  = useState(false)
  const [selected,   setSelected]   = useState(new Set())
  const [showBulkMenu, setShowBulkMenu] = useState(false)
  const bulkMenuRef = useRef()

  const newPath       = species==='chickens' ? '/chickens/new'  : '/animals/new'
  const bulkPath      = species==='chickens' ? '/chickens/bulk' : '/animals/bulk'
  const bulkEventPath = (ids) => species==='chickens'
    ? `/chickens/bulk-event?ids=${ids}`
    : `/animals/bulk-event?ids=${ids}`

  const activeAnimals   = animals.filter(a => a.status==='alive'||a.status==='rented')
  const soldAnimals     = animals.filter(a => a.status==='sold')
  const deceasedAnimals = animals.filter(a => a.status==='deceased')

  const baseList = filter==='alive'    ? activeAnimals
    : filter==='sold'     ? soldAnimals
    : filter==='deceased' ? deceasedAnimals
    : animals

  const filteredList = baseList.filter(a => {
    if (!search) return true
    const s = search.toLowerCase()
    return (a.name||'').toLowerCase().includes(s)
      || (a.tag_number||'').toLowerCase().includes(s)
      || (a.breed||'').toLowerCase().includes(s)
  })

  const toggleSelect = (id) => setSelected(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n
  })
  const cancelSelect = () => { setSelecting(false); setSelected(new Set()) }

  // Close bulk menu on outside click
  useEffect(() => {
    const fn = (e) => { if (bulkMenuRef.current && !bulkMenuRef.current.contains(e.target)) setShowBulkMenu(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const filterBtns = [
    { key:'alive',    label:`Active (${activeAnimals.length})` },
    { key:'all',      label:`All (${animals.length})` },
    ...(soldAnimals.length     > 0 ? [{ key:'sold',     label:`Sold (${soldAnimals.length})` }]     : []),
    ...(deceasedAnimals.length > 0 ? [{ key:'deceased', label:`Deceased (${deceasedAnimals.length})` }] : []),
  ]

  if (loading) return <div style={S.page}><p style={{ color:'#a08060', padding:40, textAlign:'center' }}>Loading…</p></div>
  if (error)   return <div style={S.page}><p style={{ color:'#c62828', padding:40, textAlign:'center' }}>{error}</p></div>

  return (
    <div>
      {/* ── Hero header ─────────────────────────────────────────────────── */}
      <div style={{ background:'linear-gradient(160deg,#2c2416 0%,#4a3520 40%,#6b4f2e 100%)', width:'100%' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:isMobile?'16px 14px 0':'24px 24px 0' }}>
          {/* Title row */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div>
                <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?22:30,
                  fontWeight:700, color:'#f0e6cc', margin:'0 0 2px' }}>
                  {meta.emoji} Your {meta.label}
                </h1>
                <p style={{ fontSize:11, color:'#a08060', margin:0 }}>
                  {activeAnimals.length} active
                  {soldAnimals.length>0?` · ${soldAnimals.length} sold`:''}
                  {deceasedAnimals.length>0?` · ${deceasedAnimals.length} deceased`:''}
                </p>
              </div>
              <div style={{ background:'rgba(200,160,96,0.2)', border:'1px solid rgba(200,160,96,0.4)',
                borderRadius:10, padding:isMobile?'6px 10px':'8px 14px', textAlign:'center', flexShrink:0 }}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?20:26,
                  fontWeight:700, color:'#c8a060', lineHeight:1 }}>{activeAnimals.length}</div>
                <div style={{ fontSize:8, color:'#a08060', fontWeight:700, textTransform:'uppercase',
                  letterSpacing:'0.06em', marginTop:2 }}>Active</div>
              </div>
            </div>

            {/* Action buttons — desktop */}
            {!selecting && !isMobile && (
              <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                {/* Bulk Event button with dropdown */}
                <div style={{ position:'relative' }} ref={bulkMenuRef}>
                  <button onClick={()=>setShowBulkMenu(v=>!v)}
                    style={{ ...S.btn, background:'rgba(255,255,255,0.12)', color:'#f0e6cc',
                      border:'1px solid rgba(255,255,255,0.25)', padding:'8px 14px', fontSize:13 }}>
                    ☑ Bulk Event ▾
                  </button>
                  {showBulkMenu && (
                    <div style={{ position:'absolute', top:'calc(100% + 6px)', right:0,
                      background:'#2c2416', borderRadius:10, padding:8, minWidth:220,
                      boxShadow:'0 8px 32px rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.1)',
                      zIndex:100 }}>
                      <p style={{ fontSize:10, color:'#6a5040', fontWeight:700, textTransform:'uppercase',
                        letterSpacing:'0.06em', margin:'4px 8px 8px', padding:0 }}>Log an event for…</p>
                      <button onClick={()=>{ setShowBulkMenu(false); setSelecting(true) }}
                        style={{ ...S.btn, width:'100%', justifyContent:'flex-start',
                          background:'rgba(255,255,255,0.06)', color:'#f0e6cc', border:'none',
                          padding:'9px 12px', fontSize:13, marginBottom:4, borderRadius:7 }}>
                        <div>
                          <div style={{ fontWeight:700, marginBottom:1 }}>☑ Multiple {meta.plural}</div>
                          <div style={{ fontSize:11, color:'#a08060' }}>Select animals — same event type for all</div>
                        </div>
                      </button>
                      <button onClick={()=>{ setShowBulkMenu(false); navigate(species==='chickens'?'/chickens':'/') }}
                        style={{ ...S.btn, width:'100%', justifyContent:'flex-start',
                          background:'rgba(255,255,255,0.06)', color:'#f0e6cc', border:'none',
                          padding:'9px 12px', fontSize:13, borderRadius:7 }}>
                        <div>
                          <div style={{ fontWeight:700, marginBottom:1 }}>＋ Single {meta.singular}</div>
                          <div style={{ fontSize:11, color:'#a08060' }}>Tap a {meta.singular.toLowerCase()} below, then tap Add Event on their profile</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
                <button onClick={()=>navigate(newPath)}
                  style={{ ...S.btn, background:'#c8a060', color:'#2c2416',
                    fontWeight:700, padding:'8px 18px', fontSize:13 }}>
                  ＋ Add {meta.singular}
                </button>
              </div>
            )}

            {/* Mobile selecting cancel */}
            {selecting && (
              <div style={{ display:'flex', gap:8, flexShrink:0, alignItems:'center' }}>
                <span style={{ fontSize:13, color:'#c8a878' }}>{selected.size} selected</span>
                <button onClick={cancelSelect}
                  style={{ ...S.btn, background:'rgba(255,255,255,0.1)', color:'#f0e6cc',
                    border:'1px solid rgba(255,255,255,0.2)', padding:'7px 12px', fontSize:12 }}>
                  ✕ Cancel
                </button>
              </div>
            )}
          </div>

          {/* Avatar strip */}
          <div style={{ display:'flex', gap:isMobile?8:12, paddingBottom:16,
            overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
            {[...activeAnimals,...soldAnimals,...deceasedAnimals].map(a => {
              const isInactive = a.status!=='alive'&&a.status!=='rented'
              return (
                <div key={a.id} onClick={()=>!selecting&&navigate(`/animals/${a.id}`)}
                  style={{ display:'flex', flexDirection:'column', alignItems:'center',
                    gap:3, flexShrink:0, cursor:'pointer', opacity:isInactive?0.45:1 }}>
                  <div style={{ position:'relative' }}>
                    <div style={{ width:isMobile?44:54, height:isMobile?44:54, borderRadius:'50%',
                      overflow:'hidden', border:`2px solid ${isInactive?'#666':(STATUS_DOT[a.status]||'#9e9e9e')}`,
                      filter:isInactive?'grayscale(0.7)':'none', background:'#f0ebe4' }}>
                      {a.photo_url
                        ? <img src={a.photo_url} alt={a.name} style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
                        : <AnimalIllustration animal={a} size={isMobile?44:54}/>
                      }
                    </div>
                    <div style={{ width:8,height:8,borderRadius:'50%',
                      background:isInactive?'#c62828':(STATUS_DOT[a.status]||'#9e9e9e'),
                      position:'absolute',bottom:0,right:0,border:'2px solid #2c2416' }}/>
                  </div>
                  <span style={{ fontSize:8, fontWeight:700, color:isInactive?'#6a5040':'#c8a878',
                    textTransform:'uppercase', whiteSpace:'nowrap', maxWidth:isMobile?46:58,
                    overflow:'hidden', textOverflow:'ellipsis', textAlign:'center' }}>
                    {a.name}
                  </span>
                </div>
              )
            })}
            {animals.length===0 && (
              <p style={{ fontSize:13, color:'#a08060', alignSelf:'center', padding:'0 4px' }}>
                No {meta.plural.toLowerCase()} yet — add your first one!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile sticky compact strip ──────────────────────────────────── */}
      {isMobile && (
        <div style={{ position:'sticky', top:0, zIndex:50,
          background:'linear-gradient(160deg,#2c2416 0%,#3a2c16 100%)',
          borderBottom:'1px solid rgba(255,255,255,0.08)',
          display:'flex', alignItems:'center', gap:8, padding:'6px 12px' }}>
          {/* Count */}
          <div style={{ background:'rgba(200,160,96,0.2)', border:'1px solid rgba(200,160,96,0.4)',
            borderRadius:7, padding:'3px 8px', textAlign:'center', flexShrink:0 }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:14, fontWeight:700,
              color:'#c8a060', lineHeight:1 }}>{activeAnimals.length}</div>
            <div style={{ fontSize:7, color:'#a08060', fontWeight:700, textTransform:'uppercase' }}>Active</div>
          </div>
          {/* Tiny avatar strip */}
          <div style={{ display:'flex', gap:5, flex:1, overflowX:'auto',
            WebkitOverflowScrolling:'touch', scrollbarWidth:'none' }}>
            {[...activeAnimals,...soldAnimals,...deceasedAnimals].map(a=>{
              const isInactive = a.status!=='alive'&&a.status!=='rented'
              return (
                <div key={a.id} onClick={()=>navigate(`/animals/${a.id}`)}
                  style={{ flexShrink:0, opacity:isInactive?0.4:1 }}>
                  <div style={{ width:28,height:28,borderRadius:'50%',overflow:'hidden',
                    border:`2px solid ${isInactive?'#555':(STATUS_DOT[a.status]||'#9e9e9e')}`,
                    filter:isInactive?'grayscale(0.7)':'none', background:'#f0ebe4' }}>
                    {a.photo_url
                      ? <img src={a.photo_url} alt={a.name} style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
                      : <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',
                          justifyContent:'center',fontSize:14 }}>{meta.emoji}</div>
                    }
                  </div>
                </div>
              )
            })}
          </div>
          {/* Compact buttons */}
          <button onClick={()=>navigate(newPath)}
            style={{ ...S.btn, background:'#c8a060', color:'#2c2416',
              fontWeight:700, padding:'5px 9px', fontSize:11, borderRadius:6, flexShrink:0 }}>
            ＋ Add
          </button>
          <button onClick={()=>setSelecting(true)}
            style={{ ...S.btn, background:'rgba(255,255,255,0.12)', color:'#f0e6cc',
              border:'1px solid rgba(255,255,255,0.2)', padding:'5px 9px', fontSize:11,
              borderRadius:6, flexShrink:0 }}>
            ☑ Bulk
          </button>
        </div>
      )}

      {/* ── List area ────────────────────────────────────────────────────── */}
      <div style={{ maxWidth:1100, margin:'0 auto', padding:isMobile?'12px 12px':'16px 24px' }}>

        {/* Mobile add/bulk row */}
        {isMobile && !selecting && (
          <div style={{ display:'flex', gap:8, marginBottom:12 }}>
            <button onClick={()=>navigate(newPath)}
              style={{ ...S.btn, ...S.btnPrimary, flex:1, justifyContent:'center' }}>
              ＋ Add {meta.singular}
            </button>
            <button onClick={()=>setSelecting(true)}
              style={{ ...S.btn, ...S.btnSecondary, flex:1, justifyContent:'center' }}>
              ☑ Bulk Event
            </button>
          </div>
        )}

        {/* Filters */}
        <div style={{ display:'flex', gap:6, marginBottom:10, flexWrap:'wrap' }}>
          {filterBtns.map(btn=>(
            <button key={btn.key} onClick={()=>setFilter(btn.key)}
              style={{ ...S.btn, padding:isMobile?'5px 10px':'6px 14px', fontSize:isMobile?12:13,
                background:filter===btn.key?'#5a3e1b':'#fff',
                color:filter===btn.key?'#fff':'#7a6648',
                border:filter===btn.key?'none':'1px solid #d0c4b0' }}>
              {btn.label}
            </button>
          ))}
          {selecting && (
            <button onClick={()=>setSelected(selected.size===filteredList.length
              ? new Set() : new Set(filteredList.map(a=>a.id)))}
              style={{ ...S.btn, ...S.btnSecondary, padding:'5px 10px', fontSize:12, marginLeft:'auto' }}>
              {selected.size===filteredList.length?'Deselect All':'Select All'}
            </button>
          )}
        </div>

        {/* Search */}
        <input style={{ ...S.input, marginBottom:12 }}
          placeholder={`Search ${meta.plural.toLowerCase()}…`}
          value={search} onChange={e=>setSearch(e.target.value)}/>

        {/* Selecting instruction banner */}
        {selecting && (
          <div style={{ background:'#fdfaf0', border:'1px solid #e8d8a0', borderRadius:10,
            padding:'10px 14px', marginBottom:12, fontSize:13, color:'#5a3e1b' }}>
            <strong>☑ Bulk Event</strong> — Tap animals below, then choose an event type to log for all of them.
            One event type applies to every selected animal.
          </div>
        )}

        {/* Empty state */}
        {animals.length===0 && (
          <div style={{ ...S.card, padding:isMobile?24:48, textAlign:'center' }}>
            <div style={{ fontSize:44, marginBottom:12 }}>{meta.emoji}</div>
            <p style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, margin:'0 0 8px' }}>
              No {meta.plural.toLowerCase()} yet
            </p>
            <p style={{ fontSize:14, color:'#a08060', margin:'0 0 16px' }}>
              Add your first {meta.singular.toLowerCase()} to get started.
            </p>
            <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
              <button onClick={()=>navigate(newPath)}
                style={{ ...S.btn,...S.btnPrimary, padding:'10px 20px' }}>
                ＋ Add {meta.singular}
              </button>
              <button onClick={()=>navigate(bulkPath)}
                style={{ ...S.btn,...S.btnSecondary, padding:'10px 20px' }}>
                ⚡ Bulk Add
              </button>
            </div>
          </div>
        )}

        {/* No results */}
        {animals.length>0 && filteredList.length===0 && (
          <p style={{ color:'#a08060', fontSize:14, textAlign:'center', padding:'32px 0' }}>
            No {filter==='alive'?'active':filter} {meta.plural.toLowerCase()} found.
            {filter!=='all' && (
              <button onClick={()=>setFilter('all')}
                style={{ background:'none', border:'none', color:'#5a3e1b', cursor:'pointer',
                  fontSize:14, fontWeight:700, marginLeft:6, textDecoration:'underline' }}>
                Show all
              </button>
            )}
          </p>
        )}

        {/* Animal rows */}
        {filteredList.map(a => {
          const st       = STATUS_STYLES[a.status] || STATUS_STYLES.alive
          const isActive = a.status==='alive'||a.status==='rented'
          const isSel    = selected.has(a.id)
          const age      = calcAge(a.birth_date)
          const sexLabel = SEX_LABELS[a.sex] || a.sex || ''

          return (
            <div key={a.id}
              onClick={()=>selecting ? toggleSelect(a.id) : navigate(`/animals/${a.id}`)}
              style={{ ...S.card, padding:isMobile?'10px 12px':'14px 18px', marginBottom:8,
                display:'flex', gap:12, alignItems:'center', cursor:'pointer',
                opacity:!isActive?0.65:1,
                border:isSel?'2px solid #c8a060':'1px solid #e8e0d0',
                background:isSel?'#fdfaf0':'#fff', transition:'all 0.15s' }}>
              {selecting && (
                <div style={{ width:20, height:20, borderRadius:5,
                  border:`2px solid ${isSel?'#c8a060':'#d0c4b0'}`,
                  background:isSel?'#c8a060':'#fff',
                  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  {isSel && <span style={{ color:'#fff', fontSize:12, fontWeight:700 }}>✓</span>}
                </div>
              )}
              <div style={{ width:isMobile?42:52, height:isMobile?42:52, borderRadius:'50%',
                overflow:'hidden', border:'2px solid #e8e0d0', flexShrink:0,
                filter:!isActive?'grayscale(0.5)':'none', background:'#f0ebe4' }}>
                {a.photo_url
                  ? <img src={a.photo_url} alt={a.name} style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
                  : <AnimalIllustration animal={a} size={isMobile?42:52}/>
                }
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2, flexWrap:'wrap' }}>
                  <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
                    fontSize:isMobile?14:16, margin:0 }}>{a.name}</p>
                  <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10,
                    background:st.bg, color:st.text, textTransform:'uppercase' }}>{a.status}</span>
                  {a.tag_number&&!a.tag_number.startsWith('AUTO-')&&(
                    <span style={{ fontSize:10, color:'#a08060', fontFamily:'monospace' }}>{a.tag_number}</span>
                  )}
                </div>
                <p style={{ fontSize:11, color:'#a08060', margin:0 }}>
                  {[sexLabel,a.breed,age].filter(Boolean).join(' · ')}
                </p>
              </div>
              {!selecting && <span style={{ color:'#c8b89a', fontSize:18, flexShrink:0 }}>›</span>}
            </div>
          )
        })}

        {/* Bulk action bar */}
        {selecting && selected.size>0 && (
          <div style={{ position:'fixed', bottom:isMobile?70:20, left:'50%',
            transform:'translateX(-50%)', background:'#2c2416', borderRadius:12,
            padding:'14px 20px', display:'flex', alignItems:'center', gap:12,
            boxShadow:'0 8px 32px rgba(0,0,0,0.4)', zIndex:100,
            border:'1px solid rgba(255,255,255,0.1)', flexWrap:'wrap', maxWidth:'90vw' }}>
            <div>
              <span style={{ fontSize:13, fontWeight:700, color:'#c8a878' }}>
                {selected.size} {meta.plural.toLowerCase()} selected
              </span>
              <p style={{ fontSize:10, color:'#6a5040', margin:0 }}>
                One event type will apply to all
              </p>
            </div>
            <button onClick={()=>navigate(bulkEventPath([...selected].join(',')))}
              style={{ ...S.btn, background:'#c8a060', color:'#2c2416',
                fontWeight:700, padding:'10px 18px', fontSize:13 }}>
              ☑ Log Event for {selected.size}
            </button>
            <button onClick={cancelSelect}
              style={{ ...S.btn, background:'rgba(255,255,255,0.1)', color:'#f0e6cc',
                border:'1px solid rgba(255,255,255,0.2)', padding:'10px 12px', fontSize:13 }}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export { AnimalList as AnimalListPage }
