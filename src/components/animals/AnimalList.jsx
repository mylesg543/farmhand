import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAnimals } from '../../hooks/useAnimals'
import { useIsMobile } from '../../hooks/useIsMobile'
import { S, AnimalIllustration, STATUS_STYLES, STATUS_DOT, calcAge, SEX_LABELS } from '../ui/shared'

const SPECIES_META = {
  sheep:    { emoji:'🐑', singular:'Sheep',   plural:'Sheep',    label:'Flock' },
  chickens: { emoji:'🐔', singular:'Chicken', plural:'Chickens', label:'Chickens' },
}

export function AnimalList({ species = 'sheep' }) {
  const navigate  = useNavigate()
  const isMobile  = useIsMobile()
  const { animals = [], loading, error } = useAnimals(species)
  const meta = SPECIES_META[species] || SPECIES_META.sheep

  const [filter,    setFilter]    = useState('alive')
  const [search,    setSearch]    = useState('')
  const [selecting, setSelecting] = useState(false)
  const [selected,  setSelected]  = useState(new Set())

  const newPath   = species === 'chickens' ? '/chickens/new'  : '/animals/new'
  const bulkPath  = species === 'chickens' ? '/chickens/bulk' : '/animals/bulk'
  const bulkEventPath = (ids) => species === 'chickens'
    ? `/chickens/bulk-event?ids=${ids}`
    : `/animals/bulk-event?ids=${ids}`

  const activeAnimals   = animals.filter(a => a.status === 'alive' || a.status === 'rented')
  const soldAnimals     = animals.filter(a => a.status === 'sold')
  const deceasedAnimals = animals.filter(a => a.status === 'deceased')
  const heroAnimals     = [...activeAnimals, ...soldAnimals, ...deceasedAnimals]

  const baseList =
    filter === 'alive'    ? activeAnimals :
    filter === 'sold'     ? soldAnimals :
    filter === 'deceased' ? deceasedAnimals :
    animals

  const filteredList = baseList.filter(a => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      (a.name || '').toLowerCase().includes(s) ||
      (a.tag_number || '').toLowerCase().includes(s) ||
      (a.breed || '').toLowerCase().includes(s)
    )
  })

  const toggleSelect = (id) => setSelected(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n
  })
  const cancelSelect = () => { setSelecting(false); setSelected(new Set()) }

  const filterBtns = [
    { key:'alive',    label:`Active (${activeAnimals.length})` },
    { key:'all',      label:`All (${animals.length})` },
    ...(soldAnimals.length     > 0 ? [{ key:'sold',     label:`Sold (${soldAnimals.length})` }]     : []),
    ...(deceasedAnimals.length > 0 ? [{ key:'deceased', label:`Deceased (${deceasedAnimals.length})` }] : []),
  ]

  if (loading) return (
    <div style={{ ...S.page, display:'flex', alignItems:'center', justifyContent:'center', minHeight:200 }}>
      <p style={{ color:'#a08060' }}>Loading your {meta.plural.toLowerCase()}…</p>
    </div>
  )

  if (error) return (
    <div style={{ ...S.page, padding:40 }}>
      <p style={{ color:'#c62828' }}>{error}</p>
    </div>
  )

  return (
    <div>
      {/* ── Hero banner ──────────────────────────────────────────────────── */}
      <div style={{ background:'linear-gradient(160deg,#2c2416 0%,#4a3520 40%,#6b4f2e 100%)', width:'100%' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:isMobile?'18px 14px 0':'28px 24px 0' }}>

          {/* Title + count badge + button */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div>
                <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?24:34, fontWeight:700, color:'#f0e6cc', margin:'0 0 3px' }}>
                  {meta.emoji} Your {meta.label}
                </h1>
                <p style={{ fontSize:12, color:'#a08060', margin:0 }}>
                  {activeAnimals.length} active
                  {soldAnimals.length > 0 ? ` · ${soldAnimals.length} sold` : ''}
                  {deceasedAnimals.length > 0 ? ` · ${deceasedAnimals.length} deceased` : ''}
                </p>
              </div>
              {/* Active count badge */}
              <div style={{ background:'rgba(200,160,96,0.2)', border:'1px solid rgba(200,160,96,0.4)', borderRadius:12, padding:isMobile?'8px 12px':'10px 16px', textAlign:'center', flexShrink:0 }}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?22:28, fontWeight:700, color:'#c8a060', lineHeight:1 }}>{activeAnimals.length}</div>
                <div style={{ fontSize:9, color:'#a08060', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginTop:2 }}>Active</div>
              </div>
            </div>

            <div style={{ display:'flex', gap:8, flexShrink:0 }}>
              {!selecting && !isMobile && (
                <button onClick={()=>setSelecting(true)}
                  style={{ ...S.btn, background:'rgba(255,255,255,0.1)', color:'#f0e6cc', border:'1px solid rgba(255,255,255,0.2)', padding:'7px 14px', fontSize:13 }}>
                  ☑ Select
                </button>
              )}
              <button onClick={()=>navigate(newPath)}
                style={{ ...S.btn, background:'#c8a060', color:'#2c2416', fontWeight:700, padding:isMobile?'8px 14px':'9px 20px', fontSize:isMobile?13:14 }}>
                + Add {meta.singular}
              </button>
            </div>
          </div>

          {/* Avatar strip — active first, inactive greyed with red dot */}
          <div style={{ display:'flex', gap:isMobile?10:14, paddingBottom:20, overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
            {heroAnimals.length === 0 && (
              <p style={{ fontSize:13, color:'#a08060', alignSelf:'center' }}>No animals yet — add your first one!</p>
            )}
            {heroAnimals.map(a => {
              const isInactive = a.status !== 'alive' && a.status !== 'rented'
              return (
                <div key={a.id} onClick={() => !selecting && navigate(`/animals/${a.id}`)}
                  style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flexShrink:0, cursor:'pointer', opacity:isInactive?0.45:1 }}>
                  <div style={{ position:'relative' }}>
                    <div style={{ width:isMobile?50:60, height:isMobile?50:60, borderRadius:'50%', overflow:'hidden',
                      border:`3px solid ${isInactive?'#666':(STATUS_DOT[a.status]||'#9e9e9e')}`,
                      filter:isInactive?'grayscale(0.7)':'none', background:'#f0ebe4' }}>
                      {a.photo_url
                        ? <img src={a.photo_url} alt={a.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                        : <AnimalIllustration animal={a} size={isMobile?50:60}/>
                      }
                    </div>
                    <div style={{ width:9, height:9, borderRadius:'50%',
                      background: isInactive ? '#c62828' : (STATUS_DOT[a.status]||'#9e9e9e'),
                      position:'absolute', bottom:1, right:1, border:'2px solid #2c2416' }}/>
                  </div>
                  <span style={{ fontSize:9, fontWeight:700, color:isInactive?'#6a5040':'#c8a878',
                    textTransform:'uppercase', whiteSpace:'nowrap', maxWidth:isMobile?54:64,
                    overflow:'hidden', textOverflow:'ellipsis', textAlign:'center' }}>
                    {a.name}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── List area ──────────────────────────────────────────────────────── */}
      <div style={{ maxWidth:1100, margin:'0 auto', padding:isMobile?'12px 12px':'16px 24px' }}>

        {/* Filter buttons */}
        <div style={{ display:'flex', gap:6, marginBottom:10, flexWrap:'wrap', alignItems:'center' }}>
          {filterBtns.map(btn => (
            <button key={btn.key} onClick={()=>setFilter(btn.key)}
              style={{ ...S.btn, padding:isMobile?'5px 10px':'6px 14px', fontSize:isMobile?12:13,
                background: filter===btn.key?'#5a3e1b':'#fff',
                color:      filter===btn.key?'#fff':'#7a6648',
                border:     filter===btn.key?'none':'1px solid #d0c4b0' }}>
              {btn.label}
            </button>
          ))}
          {isMobile && !selecting && (
            <button onClick={()=>setSelecting(true)}
              style={{ ...S.btn, ...S.btnSecondary, padding:'5px 10px', fontSize:12, marginLeft:'auto' }}>
              ☑ Select
            </button>
          )}
          {selecting && (
            <button onClick={()=>setSelected(selected.size===filteredList.length?new Set():new Set(filteredList.map(a=>a.id)))}
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
        {animals.length === 0 && (
          <div style={{ ...S.card, padding:isMobile?24:48, textAlign:'center' }}>
            <div style={{ fontSize:44, marginBottom:12 }}>{meta.emoji}</div>
            <p style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, margin:'0 0 8px' }}>No {meta.plural.toLowerCase()} yet</p>
            <p style={{ fontSize:14, color:'#a08060', margin:'0 0 16px' }}>Add your first {meta.singular.toLowerCase()} to get started.</p>
            <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
              <button onClick={()=>navigate(newPath)} style={{ ...S.btn, ...S.btnPrimary, padding:'10px 20px' }}>+ Add {meta.singular}</button>
              <button onClick={()=>navigate(bulkPath)} style={{ ...S.btn, ...S.btnSecondary, padding:'10px 20px' }}>⚡ Bulk Add</button>
            </div>
          </div>
        )}

        {/* No results for filter */}
        {animals.length > 0 && filteredList.length === 0 && (
          <p style={{ color:'#a08060', fontSize:14, textAlign:'center', padding:'32px 0' }}>
            No {filter==='alive'?'active':filter} {meta.plural.toLowerCase()} found.
            {filter !== 'all' && (
              <button onClick={()=>setFilter('all')} style={{ background:'none', border:'none', color:'#5a3e1b', cursor:'pointer', fontSize:14, fontWeight:700, marginLeft:6, textDecoration:'underline' }}>
                Show all
              </button>
            )}
          </p>
        )}

        {/* Animal rows */}
        {filteredList.map(a => {
          const st       = STATUS_STYLES[a.status] || STATUS_STYLES.alive
          const isActive = a.status === 'alive' || a.status === 'rented'
          const isSel    = selected.has(a.id)
          const sexLabel = SEX_LABELS[a.sex] || a.sex || ''
          const age      = calcAge(a.birth_date)

          return (
            <div key={a.id}
              onClick={() => selecting ? toggleSelect(a.id) : navigate(`/animals/${a.id}`)}
              style={{ ...S.card, padding:isMobile?'10px 12px':'14px 18px', marginBottom:8,
                display:'flex', gap:12, alignItems:'center', cursor:'pointer',
                opacity: !isActive ? 0.65 : 1,
                border:  isSel ? '2px solid #c8a060' : '1px solid #e8e0d0',
                background: isSel ? '#fdfaf0' : '#fff',
                transition:'all 0.15s' }}>

              {selecting && (
                <div style={{ width:20, height:20, borderRadius:5, border:`2px solid ${isSel?'#c8a060':'#d0c4b0'}`,
                  background:isSel?'#c8a060':'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  {isSel && <span style={{ color:'#fff', fontSize:12, fontWeight:700 }}>✓</span>}
                </div>
              )}

              <div style={{ width:isMobile?44:52, height:isMobile?44:52, borderRadius:'50%', overflow:'hidden',
                border:'2px solid #e8e0d0', flexShrink:0, background:'#f0ebe4',
                filter:!isActive?'grayscale(0.5)':'none' }}>
                {a.photo_url
                  ? <img src={a.photo_url} alt={a.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                  : <AnimalIllustration animal={a} size={isMobile?44:52}/>
                }
              </div>

              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2, flexWrap:'wrap' }}>
                  <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:isMobile?14:16, margin:0 }}>
                    {a.name}
                  </p>
                  <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10,
                    background:st.bg, color:st.text, textTransform:'uppercase' }}>
                    {a.status}
                  </span>
                  {a.tag_number && !a.tag_number.startsWith('AUTO-') && (
                    <span style={{ fontSize:10, color:'#a08060', fontFamily:'monospace' }}>{a.tag_number}</span>
                  )}
                </div>
                <p style={{ fontSize:11, color:'#a08060', margin:0 }}>
                  {[sexLabel, a.breed, age].filter(Boolean).join(' · ')}
                </p>
              </div>

              {!selecting && <span style={{ color:'#c8b89a', fontSize:18, flexShrink:0 }}>›</span>}
            </div>
          )
        })}

        {/* Bulk action bar */}
        {selecting && selected.size > 0 && (
          <div style={{ position:'fixed', bottom:isMobile?70:20, left:'50%', transform:'translateX(-50%)',
            background:'#2c2416', borderRadius:12, padding:'14px 20px',
            display:'flex', alignItems:'center', gap:12,
            boxShadow:'0 8px 32px rgba(0,0,0,0.4)', zIndex:100,
            border:'1px solid rgba(255,255,255,0.1)', flexWrap:'wrap', maxWidth:'90vw' }}>
            <span style={{ fontSize:13, fontWeight:700, color:'#c8a878' }}>{selected.size} selected</span>
            <button onClick={()=>navigate(bulkEventPath([...selected].join(',')))}
              style={{ ...S.btn, background:'#c8a060', color:'#2c2416', fontWeight:700, padding:'8px 16px', fontSize:13 }}>
              + Log Event
            </button>
            <button onClick={cancelSelect}
              style={{ ...S.btn, background:'rgba(255,255,255,0.1)', color:'#f0e6cc', border:'1px solid rgba(255,255,255,0.2)', padding:'8px 12px', fontSize:13 }}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Alias for App.jsx import compatibility
export { AnimalList as AnimalListPage }
