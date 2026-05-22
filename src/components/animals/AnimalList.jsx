import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAnimals } from '../../hooks/useAnimals'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { S, AnimalIllustration, STATUS_STYLES, STATUS_DOT, calcAge, SEX_LABELS } from '../ui/shared'

const SPECIES_META = {
  sheep:    { emoji:'🐑', singular:'Sheep',   plural:'Sheep',    label:'Flock' },
  chickens: { emoji:'🐔', singular:'Chicken', plural:'Chickens', label:'Chickens' },
}

const EVENT_TYPES = [
  { value:'vaccination',    label:'💉 Vaccination' },
  { value:'worming',        label:'🪱 Worming' },
  { value:'hoof_trimming',  label:'✂️ Hoof Trimming' },
  { value:'shearing',       label:'✂️ Shearing' },
  { value:'weight_check',   label:'⚖️ Weight Check' },
  { value:'pregnancy_check',label:'🔍 Pregnancy Check' },
  { value:'breeding',       label:'❤️ Breeding' },
  { value:'lambing',        label:'🐣 Lambing' },
  { value:'weaning',        label:'🍼 Weaning' },
  { value:'egg_production', label:'🥚 Egg Production' },
  { value:'injury',         label:'🩹 Injury' },
  { value:'sale',           label:'💸 Sale' },
  { value:'custom',         label:'📝 Custom / Note' },
]

// ─── Mobile inline event panel ──────────────────────────────────────────────
function MobileEventPanel({ animals, species, user, onDone, onCancel }) {
  const meta          = SPECIES_META[species] || SPECIES_META.sheep
  const today2      = new Date().toISOString().split('T')[0]
  const active      = animals.filter(a => a.status==='alive' || (a.status==='rented' && (!a.departure_date || a.departure_date >= today2)))
  const [picked,      setPicked]    = useState(new Set())
  const [eventType,   setEventType] = useState('')
  const [eventDate,   setEventDate] = useState(new Date().toISOString().split('T')[0])
  const [notes,       setNotes]     = useState('')
  const [saving,      setSaving]    = useState(false)
  const [done,        setDone]      = useState(false)

  const toggle = (id) => setPicked(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n
  })
  const toggleAll = () => setPicked(picked.size===active.length ? new Set() : new Set(active.map(a=>a.id)))

  const handleSave = async () => {
    if (picked.size===0) { alert(`Select at least one ${meta.singular.toLowerCase()}.`); return }
    if (!eventType)      { alert('Select an event type.'); return }
    setSaving(true)
    try {
      const rows = [...picked].map(animal_id => ({
        animal_id, event_type: eventType, event_date: eventDate,
        notes: notes || null, user_id: user.id,
      }))
      const { error } = await supabase.from('fh_animal_events').insert(rows)
      if (error) throw error
      setDone(true)
      setTimeout(() => onDone(), 1000)
    } catch(err) {
      alert('Failed: ' + err.message)
      setSaving(false)
    }
  }

  if (done) return (
    <div style={{ background:'#f0f9f0', border:'1px solid #a5d6a7', borderRadius:12,
      padding:20, marginBottom:12, textAlign:'center' }}>
      <div style={{ fontSize:32, marginBottom:6 }}>✅</div>
      <p style={{ fontWeight:700, color:'#2e7d32', margin:0, fontSize:14 }}>
        Event logged for {picked.size} {picked.size===1?meta.singular.toLowerCase():meta.plural.toLowerCase()}!
      </p>
    </div>
  )

  return (
    <div style={{ background:'#fff', border:'1px solid #e8e0d0', borderRadius:12,
      padding:'16px 14px', marginBottom:12, boxShadow:'0 2px 12px rgba(44,36,22,0.08)' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <p style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700,
          color:'#2c2416', margin:0 }}>Log an Event</p>
        <button onClick={onCancel}
          style={{ background:'none', border:'none', color:'#a08060', fontSize:20,
            cursor:'pointer', lineHeight:1, padding:0 }}>×</button>
      </div>

      {/* Step 1: pick animals */}
      <p style={{ fontSize:11, fontWeight:700, color:'#a08060', textTransform:'uppercase',
        letterSpacing:'0.06em', margin:'0 0 8px' }}>1. Select {meta.plural}</p>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:4 }}>
        <button onClick={toggleAll}
          style={{ ...S.btn, fontSize:11, padding:'4px 10px',
            background:picked.size===active.length?'#5a3e1b':'#f0ebe4',
            color:picked.size===active.length?'#fff':'#5a3e1b',
            border:'1px solid #d0c4b0', borderRadius:20 }}>
          {picked.size===active.length?'✓ All selected':'Select All'}
        </button>
        {active.map(a => (
          <button key={a.id} onClick={()=>toggle(a.id)}
            style={{ ...S.btn, fontSize:12, padding:'5px 11px',
              background:picked.has(a.id)?'#5a3e1b':'#f7f4ef',
              color:picked.has(a.id)?'#fff':'#2c2416',
              border:picked.has(a.id)?'none':'1px solid #d0c4b0',
              borderRadius:20, fontWeight:picked.has(a.id)?700:400 }}>
            {picked.has(a.id)?'✓ ':''}{a.name}
          </button>
        ))}
      </div>
      {picked.size>0 && (
        <p style={{ fontSize:11, color:'#5a3e1b', margin:'4px 0 12px', fontWeight:600 }}>
          {picked.size} {picked.size===1?meta.singular.toLowerCase():meta.plural.toLowerCase()} selected
        </p>
      )}

      {/* Step 2: event type */}
      <p style={{ fontSize:11, fontWeight:700, color:'#a08060', textTransform:'uppercase',
        letterSpacing:'0.06em', margin:'12px 0 8px' }}>2. Event Type</p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:12 }}>
        {EVENT_TYPES.map(et => (
          <button key={et.value} onClick={()=>setEventType(et.value)}
            style={{ ...S.btn, fontSize:12, padding:'7px 10px', textAlign:'left',
              background:eventType===et.value?'#5a3e1b':'#f7f4ef',
              color:eventType===et.value?'#fff':'#2c2416',
              border:eventType===et.value?'none':'1px solid #e0d8cc',
              borderRadius:8, fontWeight:eventType===et.value?700:400 }}>
            {et.label}
          </button>
        ))}
      </div>

      {/* Step 3: date + notes */}
      <p style={{ fontSize:11, fontWeight:700, color:'#a08060', textTransform:'uppercase',
        letterSpacing:'0.06em', margin:'0 0 6px' }}>3. Date</p>
      <input type="date"
        style={{ ...S.input, marginBottom:10 }}
        value={eventDate} onChange={e=>setEventDate(e.target.value)}/>
      <textarea
        style={{ ...S.input, height:60, resize:'none', marginBottom:14 }}
        placeholder="Notes (optional)…"
        value={notes} onChange={e=>setNotes(e.target.value)}/>

      {/* Save */}
      <button onClick={handleSave} disabled={saving||picked.size===0||!eventType}
        style={{ ...S.btn, ...S.btnPrimary, width:'100%', justifyContent:'center',
          opacity:saving||picked.size===0||!eventType?0.55:1,
          fontSize:14, padding:'11px 0', fontWeight:700 }}>
        {saving ? 'Saving…' : `Log Event for ${picked.size||'?'} ${picked.size===1?meta.singular:meta.plural}`}
      </button>
    </div>
  )
}

// ─── Main AnimalList ───────────────────────────────────────────────────────────
export function AnimalList({ species = 'sheep' }) {
  const navigate  = useNavigate()
  const isMobile  = useIsMobile()
  const { user }  = useAuth()
  const { animals = [], loading, error } = useAnimals(species)
  const meta      = SPECIES_META[species] || SPECIES_META.sheep
  const [filter,        setFilter]        = useState('alive')
  const [search,        setSearch]        = useState('')
  const [selecting,     setSelecting]     = useState(false)
  const [selected,      setSelected]      = useState(new Set())
  const [showBulkMenu,  setShowBulkMenu]  = useState(false)
  const [showAddMenu,   setShowAddMenu]   = useState(false)
  const [showEventPanel,setShowEventPanel]= useState(false)
  const bulkMenuRef = useRef()
  const addMenuRef  = useRef()

  const newPath       = species==='chickens' ? '/chickens/new'  : '/animals/new'
  const bulkPath      = species==='chickens' ? '/chickens/bulk' : '/animals/bulk'
  const bulkEventPath = (ids) => species==='chickens'
    ? `/chickens/bulk-event?ids=${ids}`
    : `/animals/bulk-event?ids=${ids}`

  const today = new Date().toISOString().split('T')[0]
  const isActive = (a) => {
    if (a.status === 'alive') return true
    if (a.status === 'rented') return !a.departure_date || a.departure_date >= today
    return false
  }
  const activeAnimals   = animals.filter(a => isActive(a))
  const soldAnimals     = animals.filter(a => a.status === 'sold')
  const deceasedAnimals = animals.filter(a => a.status === 'deceased')
  const expiredRented   = animals.filter(a => a.status === 'rented' && a.departure_date && a.departure_date < today)

  const baseList = filter==='alive'    ? activeAnimals
    : filter==='sold'     ? soldAnimals
    : filter==='deceased' ? deceasedAnimals
    : filter==='rented'   ? expiredRented
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

  // Close menus on outside click
  useEffect(() => {
    const fn = (e) => {
      if (bulkMenuRef.current && !bulkMenuRef.current.contains(e.target)) setShowBulkMenu(false)
      if (addMenuRef.current  && !addMenuRef.current.contains(e.target))  setShowAddMenu(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const filterBtns = [
    { key:'alive',    label:`Active (${activeAnimals.length})` },
    { key:'all',      label:`All (${animals.length})` },
    ...(soldAnimals.length     > 0 ? [{ key:'sold',     label:`Sold (${soldAnimals.length})` }]           : []),
    ...(deceasedAnimals.length > 0 ? [{ key:'deceased', label:`Deceased (${deceasedAnimals.length})` }]   : []),
    ...(expiredRented.length   > 0 ? [{ key:'rented',   label:`Rented/Returned (${expiredRented.length})` }] : []),
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

            {/* ── Desktop buttons ── */}
            {!selecting && !isMobile && (
              <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                {/* Add Event dropdown */}
                <div style={{ position:'relative' }} ref={bulkMenuRef}>
                  <button onClick={()=>setShowBulkMenu(v=>!v)}
                    style={{ ...S.btn, background:'rgba(255,255,255,0.12)', color:'#f0e6cc',
                      border:'1px solid rgba(255,255,255,0.25)', padding:'8px 14px', fontSize:13 }}>
                    ☑ Add Event ▾
                  </button>
                  {showBulkMenu && (
                    <div style={{ position:'absolute', top:'calc(100% + 6px)', right:0,
                      background:'#2c2416', borderRadius:10, padding:8, minWidth:260,
                      boxShadow:'0 8px 32px rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.1)',
                      zIndex:100 }}>
                      <p style={{ fontSize:10, color:'#6a5040', fontWeight:700, textTransform:'uppercase',
                        letterSpacing:'0.06em', margin:'4px 8px 8px', padding:0 }}>Log an event for…</p>
                      {/* Single first */}
                      <button onClick={()=>{ setShowBulkMenu(false); navigate(species==='chickens'?'/chickens':'/') }}
                        style={{ ...S.btn, width:'100%', justifyContent:'flex-start',
                          background:'rgba(255,255,255,0.06)', color:'#f0e6cc', border:'none',
                          padding:'9px 12px', fontSize:13, marginBottom:4, borderRadius:7 }}>
                        <div>
                          <div style={{ fontWeight:700, marginBottom:1 }}>＋ Single {meta.singular}</div>
                          <div style={{ fontSize:11, color:'#a08060' }}>Tap a {meta.singular.toLowerCase()} from the list, then log an event on their profile</div>
                        </div>
                      </button>
                      {/* Multiple second */}
                      <button onClick={()=>{ setShowBulkMenu(false); setSelecting(true) }}
                        style={{ ...S.btn, width:'100%', justifyContent:'flex-start',
                          background:'rgba(255,255,255,0.06)', color:'#f0e6cc', border:'none',
                          padding:'9px 12px', fontSize:13, borderRadius:7 }}>
                        <div>
                          <div style={{ fontWeight:700, marginBottom:1 }}>☑ Multiple {meta.plural}</div>
                          <div style={{ fontSize:11, color:'#a08060' }}>Select animals — same event type logged for all</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
                {/* Add Sheep button — same style as Add Event, with dropdown */}
                <div style={{ position:'relative' }} ref={addMenuRef}>
                  <button onClick={()=>setShowAddMenu(v=>!v)}
                    style={{ ...S.btn, background:'#c8a060', color:'#2c2416',
                      fontWeight:700, padding:'8px 14px', fontSize:13 }}>
                    ＋ Add {meta.singular} ▾
                  </button>
                  {showAddMenu && (
                    <div style={{ position:'absolute', top:'calc(100% + 6px)', right:0,
                      background:'#2c2416', borderRadius:10, padding:8, minWidth:240,
                      boxShadow:'0 8px 32px rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.1)',
                      zIndex:100 }}>
                      <p style={{ fontSize:10, color:'#6a5040', fontWeight:700, textTransform:'uppercase',
                        letterSpacing:'0.06em', margin:'4px 8px 8px', padding:0 }}>Add {meta.plural}…</p>
                      <button onClick={()=>{ setShowAddMenu(false); navigate(newPath) }}
                        style={{ ...S.btn, width:'100%', justifyContent:'flex-start',
                          background:'rgba(255,255,255,0.06)', color:'#f0e6cc', border:'none',
                          padding:'9px 12px', fontSize:13, marginBottom:4, borderRadius:7 }}>
                        <div>
                          <div style={{ fontWeight:700, marginBottom:1 }}>＋ Single {meta.singular}</div>
                          <div style={{ fontSize:11, color:'#a08060' }}>Add one {meta.singular.toLowerCase()} with a full profile</div>
                        </div>
                      </button>
                      <button onClick={()=>{ setShowAddMenu(false); navigate(bulkPath) }}
                        style={{ ...S.btn, width:'100%', justifyContent:'flex-start',
                          background:'rgba(255,255,255,0.06)', color:'#f0e6cc', border:'none',
                          padding:'9px 12px', fontSize:13, borderRadius:7 }}>
                        <div>
                          <div style={{ fontWeight:700, marginBottom:1 }}>⚡ Bulk Add {meta.plural}</div>
                          <div style={{ fontSize:11, color:'#a08060' }}>Add multiple {meta.plural.toLowerCase()} at once via spreadsheet</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Selecting cancel (desktop) */}
            {selecting && !isMobile && (
              <div style={{ display:'flex', gap:8, flexShrink:0, alignItems:'center' }}>
                <span style={{ fontSize:13, color:'#c8a878' }}>{selected.size} selected</span>
                <button onClick={cancelSelect}
                  style={{ ...S.btn, background:'rgba(255,255,255,0.1)', color:'#f0e6cc',
                    border:'1px solid rgba(255,255,255,0.2)', padding:'7px 12px', fontSize:12 }}>
                  ✕ Cancel
                </button>
              </div>
            )}

            {/* ── Mobile buttons (in hero) ── */}
            {isMobile && !selecting && (
              <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                <button onClick={()=>{ setShowEventPanel(v=>!v) }}
                  style={{ ...S.btn, background:'rgba(255,255,255,0.12)', color:'#f0e6cc',
                    border:'1px solid rgba(255,255,255,0.25)', padding:'7px 11px', fontSize:12, borderRadius:7 }}>
                  ☑ Add Event
                </button>
                <button onClick={()=>navigate(newPath)}
                  style={{ ...S.btn, background:'#c8a060', color:'#2c2416',
                    fontWeight:700, padding:'7px 11px', fontSize:12, borderRadius:7 }}>
                  ＋ Add
                </button>
              </div>
            )}
            {isMobile && selecting && (
              <button onClick={cancelSelect}
                style={{ ...S.btn, background:'rgba(255,255,255,0.1)', color:'#f0e6cc',
                  border:'1px solid rgba(255,255,255,0.2)', padding:'7px 10px', fontSize:12 }}>
                ✕ Cancel
              </button>
            )}
          </div>

          {/* Avatar strip */}
          <div style={{ display:'flex', gap:isMobile?8:12, paddingBottom:16,
            overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
            {[...activeAnimals,...soldAnimals,...deceasedAnimals].map(a => {
              const isInactive = !isActive(a)
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

      {/* ── List area ────────────────────────────────────────────────────── */}
      <div style={{ maxWidth:1100, margin:'0 auto', padding:isMobile?'12px 12px':'16px 24px' }}>

        {/* Mobile inline event panel */}
        {isMobile && showEventPanel && (
          <MobileEventPanel
            animals={animals}
            species={species}
            user={user}
            onDone={()=>setShowEventPanel(false)}
            onCancel={()=>setShowEventPanel(false)}
          />
        )}

        {/* Desktop selecting instruction */}
        {!isMobile && selecting && (
          <div style={{ background:'#fdfaf0', border:'1px solid #e8d8a0', borderRadius:10,
            padding:'10px 14px', marginBottom:12, fontSize:13, color:'#5a3e1b' }}>
            <strong>☑ Add Event</strong> — Tap {meta.plural.toLowerCase()} below to select them, then choose an event type to log for all selected.
            One event type applies to every selected animal.
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

        {/* Desktop bulk action bar */}
        {!isMobile && selecting && selected.size>0 && (
          <div style={{ position:'fixed', bottom:20, left:'50%',
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
