import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getEmulated, useAnimals } from '../../hooks/useAnimals'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { S, AnimalIllustration, STATUS_STYLES, STATUS_DOT, calcAge, SEX_LABELS, NEWBORN_DAYS, isNewbornAnimal, getEventTypes, getEventMeta, statusFromEventType, animalNewPath, animalBulkPath, animalDetailPath, animalBulkEventPath, speciesBasePath } from '../ui/shared'

const SPECIES_META = {
  sheep:    { emoji:'🐑', singular:'Sheep',   plural:'Sheep',    label:'Flock' },
  chickens: { emoji:'🐔', singular:'Chicken', plural:'Chickens', label:'Chickens' },
  horses:   { emoji:'🐴', singular:'Horse',   plural:'Horses',   label:'Horses' },
}

const SORT_OPTIONS = [
  { value:'name_asc', icon:'sortAsc', label:'Name A-Z' },
  { value:'name_desc', icon:'sortDesc', label:'Name Z-A' },
  { value:'birth_newest', icon:'calendarDown', label:'Birthdate newest' },
  { value:'birth_oldest', icon:'calendarUp', label:'Birthdate oldest' },
  { value:'recently_added', icon:'clock', label:'Recently added' },
  { value:'status', icon:'status', label:'Status' },
]

const dateValue = (value, fallback = 0) => {
  if (!value) return fallback
  const t = new Date(value).getTime()
  return Number.isNaN(t) ? fallback : t
}

const compareName = (a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity:'base' })

function SortIcon({ type, selected = false }) {
  const stroke = selected ? '#fff' : '#5a3e1b'
  const fill = selected ? '#fff' : '#5a3e1b'
  if (type === 'clock') return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>
    </svg>
  )
  if (type === 'status') return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none">
      <circle cx="7" cy="7" r="3" fill={fill} opacity="0.9"/><circle cx="17" cy="12" r="3" fill={fill} opacity="0.65"/><circle cx="9" cy="18" r="3" fill={fill} opacity="0.4"/>
    </svg>
  )
  if (type === 'calendarDown' || type === 'calendarUp') {
    const up = type === 'calendarUp'
    return (
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4M16 3v4M4 10h16"/>
        <path d={up ? 'M12 17v-4M9.5 15.5 12 13l2.5 2.5' : 'M12 13v4M9.5 14.5 12 17l2.5-2.5'}/>
      </svg>
    )
  }
  const desc = type === 'sortDesc'
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={desc ? 'M6 7h9M6 12h7M6 17h4' : 'M6 7h4M6 12h7M6 17h9'}/>
      <path d={desc ? 'M18 6v12M15 15l3 3 3-3' : 'M18 18V6M15 9l3-3 3 3'}/>
    </svg>
  )
}

function MenuOptionCard({ icon, title, description, onClick }) {
  return (
    <button onClick={onClick}
      className="animal-menu-option-card"
      style={{ width:'100%', display:'grid', gridTemplateColumns:'42px 1fr', gap:12,
        alignItems:'center', textAlign:'left', border:'1px solid rgba(255,255,255,0.09)',
        background:'rgba(255,255,255,0.06)', color:'#f0e6cc', borderRadius:9,
        padding:'11px 12px', cursor:'pointer', fontFamily:"'Lato',sans-serif",
        transition:'background 0.16s ease, border-color 0.16s ease, transform 0.16s ease',
        marginBottom:6 }}>
      <span style={{ width:42, height:42, borderRadius:9, background:'rgba(200,160,96,0.14)',
        border:'1px solid rgba(200,160,96,0.22)', display:'flex', alignItems:'center',
        justifyContent:'center', fontSize:23, lineHeight:1 }}>
        {icon}
      </span>
      <span style={{ minWidth:0 }}>
        <span style={{ display:'block', fontSize:13, fontWeight:800, color:'#f0e6cc', marginBottom:3 }}>
          {title}
        </span>
        <span style={{ display:'block', fontSize:11, lineHeight:1.35, color:'#b49a74', fontWeight:400 }}>
          {description}
        </span>
      </span>
    </button>
  )
}

// ─── Mobile inline event panel ──────────────────────────────────────────────
function MobileEventPanel({ animals, species, user, onDone, onCancel, onStatusUpdate }) {
  const meta          = SPECIES_META[species] || SPECIES_META.sheep
  const eventTypes    = getEventTypes(species)
  const today2      = new Date().toISOString().split('T')[0]
  const active      = animals.filter(a => a.status==='alive' || (a.status==='rented' && (!a.departure_date || a.departure_date >= today2)))
  const [picked,      setPicked]    = useState(new Set())
  const [eventType,   setEventType] = useState('')
  const [eventDate,   setEventDate] = useState(new Date().toISOString().split('T')[0])
  const [notes,       setNotes]     = useState('')
  const [saving,      setSaving]    = useState(false)
  const [done,        setDone]      = useState(false)
  const [selectionFilter, setSelectionFilter] = useState('all')
  const [formError, setFormError] = useState('')
  const newbornActive = active.filter(a => isNewbornAnimal(a))
  const visibleAnimals = selectionFilter === 'newborn' ? newbornActive : active
  const visibleSelected = visibleAnimals.filter(a => picked.has(a.id)).length

  const toggle = (id) => setPicked(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n
  })
  const toggleAll = () => setPicked(prev => {
    const visibleIds = visibleAnimals.map(a => a.id)
    if (visibleIds.length === 0) return prev
    const allVisiblePicked = visibleIds.every(id => prev.has(id))
    const n = new Set(prev)
    visibleIds.forEach(id => allVisiblePicked ? n.delete(id) : n.add(id))
    return n
  })

  const handleSave = async () => {
    const emulated = getEmulated()
    const effectiveUid = emulated ? emulated.uid : user?.id
    const canWrite = !emulated || emulated.writeMode
    if (picked.size===0) { setFormError(`Select at least one ${meta.singular.toLowerCase()}.`); return }
    if (!eventType)      { setFormError('Select an event type.'); return }
    if (!effectiveUid)   { setFormError('Not logged in.'); return }
    if (!canWrite)       { setFormError('Read-only mode - switch to write mode to make changes.'); return }
    setSaving(true)
    setFormError('')
    try {
      const rows = [...picked].map(animal_id => ({
        animal_id, event_type: eventType, event_date: eventDate,
        notes: notes || null, user_id: effectiveUid,
      }))
      if (emulated) {
        for (const row of rows) {
          const { error } = await supabase.rpc('add_event_admin', {
            target_user_id: effectiveUid,
            payload: row,
          })
          if (error) throw error
        }
      } else {
        const { error } = await supabase.from('fh_animal_events').insert(rows)
        if (error) throw error
      }
      const nextStatus = statusFromEventType(eventType)
      if (nextStatus && onStatusUpdate) {
        await Promise.all([...picked].map(animalId => onStatusUpdate(animalId, { status: nextStatus })))
      }
      setDone(true)
      setTimeout(() => onDone(), 1000)
    } catch(err) {
      setFormError('Failed to save event: ' + err.message)
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

      {formError && (
        <div style={{ background:'#fff3f3', border:'1px solid #f5c6c6', color:'#c62828',
          borderRadius:9, padding:'9px 11px', fontSize:12, fontWeight:700, marginBottom:12 }}>
          {formError}
        </div>
      )}

      {/* Step 1: pick animals */}
      <p style={{ fontSize:11, fontWeight:700, color:'#a08060', textTransform:'uppercase',
        letterSpacing:'0.06em', margin:'0 0 8px' }}>1. Select {meta.plural}</p>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
        {[
          { key:'all', label:`All active (${active.length})`, disabled:false },
          { key:'newborn', label:`🐣 Newborn (${newbornActive.length})`, disabled:newbornActive.length===0 },
        ].map(btn => (
          <button key={btn.key} onClick={()=>!btn.disabled&&setSelectionFilter(btn.key)}
            disabled={btn.disabled}
            style={{ ...S.btn, fontSize:11, padding:'5px 10px', borderRadius:20,
              background:selectionFilter===btn.key?'#5a3e1b':btn.key==='newborn'?'#fff9e6':'#fff',
              color:selectionFilter===btn.key?'#fff':btn.disabled?'#c8b89a':btn.key==='newborn'?'#ad6500':'#7a6648',
              border:selectionFilter===btn.key?'none':btn.key==='newborn'?'1px solid #f0c16e':'1px solid #d0c4b0',
              opacity:btn.disabled?0.55:1, cursor:btn.disabled?'not-allowed':'pointer' }}>
            {btn.label}
          </button>
        ))}
      </div>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:4 }}>
        <button onClick={toggleAll}
          style={{ ...S.btn, fontSize:11, padding:'4px 10px',
            background:visibleAnimals.length>0&&visibleSelected===visibleAnimals.length?'#5a3e1b':'#f0ebe4',
            color:visibleAnimals.length>0&&visibleSelected===visibleAnimals.length?'#fff':'#5a3e1b',
            border:'1px solid #d0c4b0', borderRadius:20 }}>
          {visibleAnimals.length>0&&visibleSelected===visibleAnimals.length?'✓ Visible selected':'Select visible'}
        </button>
        {visibleAnimals.map(a => (
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
      {visibleAnimals.length===0 && (
        <p style={{ fontSize:12, color:'#a08060', margin:'2px 0 12px', fontStyle:'italic' }}>
          No {selectionFilter} {meta.plural.toLowerCase()} to select.
        </p>
      )}
      {picked.size>0 && (
        <p style={{ fontSize:11, color:'#5a3e1b', margin:'4px 0 12px', fontWeight:600 }}>
          {picked.size} {picked.size===1?meta.singular.toLowerCase():meta.plural.toLowerCase()} selected
        </p>
      )}

      {/* Step 2: event type */}
      <p style={{ fontSize:11, fontWeight:700, color:'#a08060', textTransform:'uppercase',
        letterSpacing:'0.06em', margin:'12px 0 8px' }}>2. Event Type</p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:12 }}>
        {eventTypes.map(et => {
          const eventMeta = getEventMeta(et.value, et.label)
          const selected = eventType === et.value
          return (
            <button key={et.value} onClick={()=>setEventType(et.value)}
              style={{ ...S.btn, fontSize:12, padding:'7px 9px', textAlign:'left',
                background:selected?'#5a3e1b':'#f7f4ef',
                color:selected?'#fff':'#2c2416',
                border:selected?'1px solid #5a3e1b':'1px solid #e0d8cc',
                borderRadius:8, fontWeight:selected?700:600, minHeight:38,
                display:'flex', alignItems:'center', gap:7 }}>
              <span style={{ width:22, height:22, borderRadius:6, display:'inline-flex',
                alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:13,
                background:selected?'rgba(255,255,255,0.14)':eventMeta.bg,
                border:selected?'1px solid rgba(255,255,255,0.18)':`1px solid ${eventMeta.border}`,
                color:selected?'#fff':eventMeta.color }}>
                {eventMeta.icon}
              </span>
              <span style={{ lineHeight:1.15 }}>{eventMeta.label}</span>
            </button>
          )
        })}
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
  const { animals = [], loading, error, updateAnimal } = useAnimals(species)
  const meta      = SPECIES_META[species] || SPECIES_META.sheep
  const [filter,        setFilter]        = useState('alive')
  const [search,        setSearch]        = useState('')
  const [sortBy,        setSortBy]        = useState('name_asc')
  const [selecting,     setSelecting]     = useState(false)
  const [selected,      setSelected]      = useState(new Set())
  const [showBulkMenu,  setShowBulkMenu]  = useState(false)
  const [showAddMenu,   setShowAddMenu]   = useState(false)
  const [showSortMenu,  setShowSortMenu]  = useState(false)
  const [showEventPanel,setShowEventPanel]= useState(false)
  const bulkMenuRef = useRef()
  const addMenuRef  = useRef()
  const sortMenuRef = useRef()

  const newPath       = animalNewPath(species)
  const bulkPath      = animalBulkPath(species)
  const detailPath    = (id) => animalDetailPath(species, id)
  const bulkEventPath = (ids) => animalBulkEventPath(species, ids)

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
  const newbornAnimals  = animals.filter(a => isNewbornAnimal(a))

  const baseList = filter==='alive'    ? activeAnimals
    : filter==='sold'     ? soldAnimals
    : filter==='deceased' ? deceasedAnimals
    : filter==='rented'   ? expiredRented
    : filter==='newborn'  ? newbornAnimals
    : animals

  const filteredList = useMemo(() => {
    const s = search.trim().toLowerCase()
    const searched = baseList.filter(a => {
      if (!s) return true
      return (a.name||'').toLowerCase().includes(s)
        || (a.tag_number||'').toLowerCase().includes(s)
        || (a.breed||'').toLowerCase().includes(s)
    })

    return [...searched].sort((a, b) => {
      if (sortBy === 'name_desc') return compareName(b, a)
      if (sortBy === 'birth_newest') return dateValue(b.birth_date, -Infinity) - dateValue(a.birth_date, -Infinity) || compareName(a, b)
      if (sortBy === 'birth_oldest') return dateValue(a.birth_date, Infinity) - dateValue(b.birth_date, Infinity) || compareName(a, b)
      if (sortBy === 'recently_added') return dateValue(b.created_at, -Infinity) - dateValue(a.created_at, -Infinity) || compareName(a, b)
      if (sortBy === 'status') return (a.status || '').localeCompare(b.status || '', undefined, { sensitivity:'base' }) || compareName(a, b)
      return compareName(a, b)
    })
  }, [baseList, search, sortBy])

  const toggleSelect = (id) => setSelected(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n
  })
  const cancelSelect = () => { setSelecting(false); setSelected(new Set()) }

  // Close menus on outside click
  useEffect(() => {
    const fn = (e) => {
      if (bulkMenuRef.current && !bulkMenuRef.current.contains(e.target)) setShowBulkMenu(false)
      if (addMenuRef.current  && !addMenuRef.current.contains(e.target))  setShowAddMenu(false)
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target)) setShowSortMenu(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const filterBtns = [
    { key:'alive',    label:`Active (${activeAnimals.length})` },
    { key:'all',      label:`All (${animals.length})` },
    ...(newbornAnimals.length  > 0 ? [{ key:'newborn',  label:`Newborn (${newbornAnimals.length})` }]      : []),
    ...(soldAnimals.length     > 0 ? [{ key:'sold',     label:`Sold (${soldAnimals.length})` }]           : []),
    ...(deceasedAnimals.length > 0 ? [{ key:'deceased', label:`Deceased (${deceasedAnimals.length})` }]   : []),
    ...(expiredRented.length   > 0 ? [{ key:'rented',   label:`Rented/Returned (${expiredRented.length})` }] : []),
  ]
  const currentSort = SORT_OPTIONS.find(opt => opt.value === sortBy) || SORT_OPTIONS[0]

  if (loading) return <div style={S.page}><p style={{ color:'#a08060', padding:40, textAlign:'center' }}>Loading…</p></div>
  if (error)   return <div style={S.page}><p style={{ color:'#c62828', padding:40, textAlign:'center' }}>{error}</p></div>

  return (
    <div>
      <style>{`
        .animal-menu-option-card:hover,
        .animal-menu-option-card:focus-visible {
          background: rgba(200,160,96,0.14) !important;
          border-color: rgba(200,160,96,0.36) !important;
          transform: translateY(-1px);
          outline: none;
        }
        .animal-sort-option:hover,
        .animal-sort-option:focus-visible {
          background: #f7f4ef !important;
          outline: none;
        }
        @media (min-width: 768px) {
          .animal-avatar-strip {
            scrollbar-width: thin;
            scrollbar-color: rgba(240,230,204,0.34) rgba(255,255,255,0.07);
          }
          .animal-avatar-strip::-webkit-scrollbar {
            height: 6px;
          }
          .animal-avatar-strip::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.07);
            border-radius: 999px;
          }
          .animal-avatar-strip::-webkit-scrollbar-thumb {
            background: rgba(240,230,204,0.34);
            border-radius: 999px;
          }
          .animal-avatar-strip::-webkit-scrollbar-thumb:hover {
            background: rgba(240,230,204,0.48);
          }
        }
      `}</style>
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
                      background:'#2c2416', borderRadius:10, padding:8, minWidth:320,
                      boxShadow:'0 8px 32px rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.1)',
                      zIndex:100 }}>
                      <p style={{ fontSize:10, color:'#6a5040', fontWeight:700, textTransform:'uppercase',
                        letterSpacing:'0.06em', margin:'4px 8px 8px', padding:0 }}>Log an event for…</p>
                      <MenuOptionCard
                        icon={meta.emoji}
                        title={`Single ${meta.singular.toLowerCase()}`}
                        description={`Use this when adding an event for one ${meta.singular.toLowerCase()}.`}
                        onClick={()=>{ setShowBulkMenu(false); navigate(speciesBasePath(species)) }}
                      />
                      <MenuOptionCard
                        icon="☑"
                        title={`Multiple ${meta.plural.toLowerCase()}`}
                        description="Apply the same event to more than one animal."
                        onClick={()=>{ setShowBulkMenu(false); setSelecting(true) }}
                      />
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
                      background:'#2c2416', borderRadius:10, padding:8, minWidth:320,
                      boxShadow:'0 8px 32px rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.1)',
                      zIndex:100 }}>
                      <p style={{ fontSize:10, color:'#6a5040', fontWeight:700, textTransform:'uppercase',
                        letterSpacing:'0.06em', margin:'4px 8px 8px', padding:0 }}>Add {meta.plural}…</p>
                      <MenuOptionCard
                        icon="＋"
                        title={`Single ${meta.singular.toLowerCase()}`}
                        description="Add one animal with detailed individual information."
                        onClick={()=>{ setShowAddMenu(false); navigate(newPath) }}
                      />
                      <MenuOptionCard
                        icon="⚡"
                        title={`Bulk add ${meta.plural.toLowerCase()}`}
                        description="Add multiple animals quickly when you have a group to enter."
                        onClick={()=>{ setShowAddMenu(false); navigate(bulkPath) }}
                      />
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
          <div className="animal-avatar-strip" style={{ display:'flex', gap:isMobile?8:12, paddingBottom:16,
            overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
            {[...activeAnimals,...soldAnimals,...deceasedAnimals].map(a => {
              const isInactive = !isActive(a)
              return (
                <div key={a.id} onClick={()=>!selecting&&navigate(detailPath(a.id))}
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
            onStatusUpdate={updateAnimal}
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
                background:filter===btn.key?'#5a3e1b':btn.key==='newborn'?'#fff9e6':'#fff',
                color:filter===btn.key?'#fff':btn.key==='newborn'?'#ad6500':'#7a6648',
                border:filter===btn.key?'none':btn.key==='newborn'?'1px solid #f0c16e':'1px solid #d0c4b0' }}>
              {btn.key==='newborn' ? '🐣 ' : ''}{btn.label}
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

        {/* Search and sort */}
        <div style={{ display:'flex', gap:isMobile?8:10, marginBottom:12, flexDirection:isMobile?'column':'row', alignItems:'stretch' }}>
          <input style={{ ...S.input, flex:1 }}
            placeholder={`Search ${meta.plural.toLowerCase()}…`}
            value={search} onChange={e=>setSearch(e.target.value)}/>
          <div ref={sortMenuRef} style={{ position:'relative', display:isMobile?'grid':'flex', gridTemplateColumns:isMobile?'86px minmax(0, 1fr)':undefined,
            alignItems:'center', gap:isMobile?10:12, flexShrink:0,
            background:'#fff', border:'1px solid #d8ccb8', borderRadius:8,
            padding:isMobile?'8px 10px':'0 8px 0 12px', minHeight:38,
            boxShadow:'0 1px 3px rgba(44,36,22,0.04)', width:isMobile?'100%':undefined,
            boxSizing:'border-box' }}>
            <span style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:11,
              fontWeight:800, color:'#7a6648', whiteSpace:'nowrap',
              textTransform:'uppercase', letterSpacing:'0.04em', paddingRight:isMobile?0:2 }}>
              <span aria-hidden="true" style={{ fontSize:13, color:'#a08060', lineHeight:1 }}>↕</span>
              Sort by
            </span>
            <button type="button" onClick={()=>setShowSortMenu(v=>!v)}
              aria-haspopup="listbox"
              aria-expanded={showSortMenu}
              style={{ display:'grid', gridTemplateColumns:'34px minmax(0, 1fr) auto',
                alignItems:'center', gap:8, border:'1px solid #efe7d8', borderRadius:7,
                background:'#fdfaf6', color:'#2c2416', fontFamily:"'Lato',sans-serif",
                fontSize:13, width:isMobile?'100%':220, minWidth:0, cursor:'pointer',
                padding:'5px 9px', minHeight:32, textAlign:'left' }}>
              <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center',
                width:28, height:22, borderRadius:6, background:'#f0e8d8', color:'#5a3e1b',
                fontSize:10, fontWeight:900, letterSpacing:'0.01em' }}>
                <SortIcon type={currentSort.icon} />
              </span>
              <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight:700 }}>
                {currentSort.label}
              </span>
              <span style={{ color:'#a08060', fontSize:10 }}>{showSortMenu?'▲':'▼'}</span>
            </button>
            {showSortMenu && (
              <div role="listbox" aria-label="Sort animals"
                style={{ position:'absolute', top:'calc(100% + 6px)', right:0, zIndex:80,
                  width:isMobile?'100%':220, background:'#fff', border:'1px solid #d8ccb8',
                  borderRadius:9, boxShadow:'0 8px 28px rgba(44,36,22,0.16)', padding:5 }}>
                {SORT_OPTIONS.map(opt => {
                  const selectedOpt = sortBy === opt.value
                  return (
                    <button key={opt.value} type="button" role="option" aria-selected={selectedOpt}
                      className="animal-sort-option"
                      onClick={()=>{ setSortBy(opt.value); setShowSortMenu(false) }}
                      style={{ display:'grid', gridTemplateColumns:'34px minmax(0, 1fr) 18px',
                        alignItems:'center', gap:8, width:'100%', border:'none', borderRadius:7,
                        background:selectedOpt?'#fdfaf0':'transparent', color:'#2c2416',
                        padding:'8px 9px', cursor:'pointer', fontFamily:"'Lato',sans-serif",
                        textAlign:'left' }}>
                      <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center',
                        width:28, height:22, borderRadius:6, background:selectedOpt?'#5a3e1b':'#f0e8d8',
                        color:selectedOpt?'#fff':'#5a3e1b', fontSize:10, fontWeight:900,
                        letterSpacing:'0.01em' }}>
                        <SortIcon type={opt.icon} selected={selectedOpt} />
                      </span>
                      <span style={{ fontSize:13, fontWeight:selectedOpt?800:600, overflow:'hidden',
                        textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {opt.label}
                      </span>
                      <span style={{ color:selectedOpt?'#c8a060':'transparent', fontSize:13, fontWeight:900 }}>✓</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

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
          const isNewborn = isNewbornAnimal(a)

          return (
            <div key={a.id}
              onClick={()=>selecting ? toggleSelect(a.id) : navigate(detailPath(a.id))}
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
                  {isNewborn && (
                    <span title={`Birthdate within the last ${NEWBORN_DAYS} days`} style={{ fontSize:10, fontWeight:700,
                      padding:'2px 8px', borderRadius:10, background:'#fff9e6', color:'#ad6500',
                      border:'1px solid #f0c16e', textTransform:'uppercase' }}>
                      🐣 Newborn
                    </span>
                  )}
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
