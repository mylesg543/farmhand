import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAnimals, useSingleAnimal } from '../../hooks/useAnimals'
import { useAnimalEvents } from '../../hooks/useAnimalEvents'
import { useIsMobile } from '../../hooks/useIsMobile'
import { S, AnimalIllustration, STATUS_STYLES, STATUS_DOT, SEX_LABELS, ANIMAL_META, formatDate, calcAge, fmt, Badge, EVENT_COLORS, Spinner, ErrorMsg } from '../ui/shared'

// ─── Mini lineage preview ──────────────────────────────────────────────────────
function MiniLineage({ animal, allAnimals, navigate, isMobile }) {
  const sire = animal.sire_id ? allAnimals.find(a=>a.id===animal.sire_id) : null
  const dam  = animal.dam_id  ? allAnimals.find(a=>a.id===animal.dam_id)  : null
  const hasParents = sire || dam
  const goLineage  = () => navigate(`/lineage?id=${animal.id}&species=${animal.species||'sheep'}`)

  return (
    <div style={{ ...S.card, padding:isMobile?16:22, marginBottom:16 }}>
      <div style={{ display:'flex', alignItems:'center', marginBottom:hasParents?14:0 }}>
        <span style={S.sectionLabel}>🌳 Lineage</span>
        <button onClick={goLineage}
          style={{ marginLeft:'auto', ...S.btn, background:'#f0ebe4', color:'#5a3e1b', border:'1px solid #d0c4b0', padding:'6px 12px', fontSize:12, fontWeight:600 }}>
          View Full Tree →
        </button>
      </div>

      {!hasParents ? (
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <p style={{ fontSize:13, color:'#a08060', margin:0, flex:1 }}>
            No parents recorded yet.
          </p>
          <button onClick={()=>navigate(`/animals/${animal.id}/edit`)}
            style={{ ...S.btn, ...S.btnSecondary, padding:'5px 12px', fontSize:12 }}>
            + Add Parents
          </button>
        </div>
      ) : (
        <div style={{ display:'flex', gap:isMobile?16:28, alignItems:'center', flexWrap:'wrap' }}>
          {/* Parents */}
          <div style={{ display:'flex', gap:12, alignItems:'center' }}>
            {[['Sire (Father)', sire], ['Dam (Mother)', dam]].map(([role, parent])=>(
              <div key={role} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                <div style={{ width:isMobile?44:52, height:isMobile?44:52, borderRadius:'50%', overflow:'hidden',
                  border:'2px solid #e8e0d0', background:'#f0ebe4',
                  opacity: !parent ? 0.35 : 1 }}>
                  {parent
                    ? parent.photo_url
                      ? <img src={parent.photo_url} alt={parent.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                      : <AnimalIllustration animal={parent} size={isMobile?44:52}/>
                    : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, border:'2px dashed #c8b89a', borderRadius:'50%' }}>?</div>
                  }
                </div>
                <span style={{ fontSize:9, fontWeight:700, color:parent?'#2c2416':'#a08060', textTransform:'uppercase', letterSpacing:'0.04em', textAlign:'center', maxWidth:60, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {parent ? parent.name : 'Unknown'}
                </span>
                <span style={{ fontSize:8, color:'#a08060' }}>{role.split(' ')[0]}</span>
              </div>
            ))}
            {/* Arrow → animal */}
            <div style={{ fontSize:18, color:'#c8b89a', margin:'0 4px' }}>→</div>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <div style={{ width:isMobile?44:52, height:isMobile?44:52, borderRadius:'50%', overflow:'hidden', border:'3px solid #c8a060', background:'#f0ebe4' }}>
                {animal.photo_url
                  ? <img src={animal.photo_url} alt={animal.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                  : <AnimalIllustration animal={animal} size={isMobile?44:52}/>
                }
              </div>
              <span style={{ fontSize:9, fontWeight:700, color:'#2c2416', textTransform:'uppercase', letterSpacing:'0.04em', textAlign:'center', maxWidth:60, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {animal.name}
              </span>
              <span style={{ fontSize:8, color:'#c8a060', fontWeight:700 }}>This Animal</span>
            </div>
          </div>

          {/* Tap prompt */}
          <p style={{ fontSize:12, color:'#a08060', margin:0, fontStyle:'italic', flex:1, minWidth:140 }}>
            Tap "View Full Tree" to see 4 generations and check for shared ancestors before breeding.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Animal Detail ─────────────────────────────────────────────────────────────
export function AnimalDetailPage() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const isMobile   = useIsMobile()
  const { animal, loading, error } = useSingleAnimal(id)
  const { animals: allAnimals, deleteAnimal, updateAnimal } = useAnimals(animal?.species || 'sheep')
  const { events, loading: evLoading, addEvent, deleteEvent } = useAnimalEvents(id)
  const meta = (() => {
    const sp = animal?.species || 'sheep'
    return { sheep:{ emoji:'🐑', label:'Sheep', singular:'Sheep' }, chickens:{ emoji:'🐔', label:'Chickens', singular:'Chicken' } }[sp] || { emoji:'🐾', label:'Animals', singular:'Animal' }
  })()

  const [showEventForm, setShowEventForm] = useState(false)
  const [eventForm, setEventForm] = useState({ event_type:'vaccination', event_date: new Date().toISOString().split('T')[0], notes:'' })
  const [saving, setSaving] = useState(false)

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${animal.name}? This also deletes all their events.`)) return
    try { await deleteAnimal(id); navigate(animal.species==='chickens'?'/chickens':'/') }
    catch (err) { alert(err.message) }
  }

  const handleAddEvent = async () => {
    setSaving(true)
    try { await addEvent(eventForm); setShowEventForm(false); setEventForm({ event_type:'vaccination', event_date: new Date().toISOString().split('T')[0], notes:'' }) }
    catch (err) { alert(err.message) }
    setSaving(false)
  }

  if (loading) return <div style={S.page}><Spinner/></div>
  if (error||!animal) return <div style={S.page}><ErrorMsg message={error||'Animal not found.'}/></div>

  const sire = allAnimals.find(a=>a.id===animal.sire_id)
  const dam  = allAnimals.find(a=>a.id===animal.dam_id)
  const st   = STATUS_STYLES[animal.status]||STATUS_STYLES.alive
  const backPath = animal.species==='chickens'?'/chickens':'/'

  const EVENT_TYPES = [
    'vaccination','worming','hoof_trimming','shearing','lambing','weaning',
    'sickness','injury','weight_check','pregnancy_check','egg_production',
    'moulting','breeding','sale','custom'
  ]

  return (
    <div>
      {/* Hero */}
      <div style={{ background:'linear-gradient(160deg,#2c2416 0%,#4a3520 60%,#6b4f2e 100%)', width:'100%' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:isMobile?'14px 14px 20px':'22px 24px 28px' }}>
          <button onClick={()=>navigate(backPath)}
            style={{ ...S.btn, background:'rgba(255,255,255,0.1)', color:'#f0e6cc', border:'1px solid rgba(255,255,255,0.2)', padding:'6px 12px', fontSize:12, marginBottom:14 }}>
            ← {meta.label}
          </button>
          <div style={{ display:'flex', gap:isMobile?12:18, alignItems:'flex-start' }}>
            <div style={{ width:isMobile?64:80, height:isMobile?64:80, borderRadius:'50%', overflow:'hidden', border:'3px solid rgba(255,255,255,0.25)', flexShrink:0, background:'rgba(255,255,255,0.08)' }}>
              {animal.photo_url
                ? <img src={animal.photo_url} alt={animal.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                : <AnimalIllustration animal={animal} size={isMobile?64:80}/>
              }
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?20:28, fontWeight:700, color:'#f0e6cc', margin:0 }}>{animal.name}</h1>
                <span style={{ padding:'3px 10px', borderRadius:20, fontSize:10, fontWeight:700, background:STATUS_DOT[animal.status]||'#9e9e9e', color:'#fff', textTransform:'uppercase' }}>{animal.status}</span>
              </div>
              <p style={{ fontSize:12, color:'#c8a878', margin:'0 0 2px', fontStyle:'italic' }}>
                {animal.breed||'Unknown breed'} · {SEX_LABELS[animal.sex]||animal.sex}
                {animal.tag_number&&!animal.tag_number.startsWith('AUTO-')?' · '+animal.tag_number:''}
              </p>
              <div style={{ display:'flex', gap:isMobile?12:20, flexWrap:'wrap', marginTop:6 }}>
                {[
                  ['Age', animal.birth_date?calcAge(animal.birth_date):'Unknown'],
                  ['Sire', sire?.name||'Unknown'],
                  ['Dam',  dam?.name ||'Unknown'],
                ].map(([l,v])=>(
                  <div key={l}>
                    <p style={{ fontSize:9, color:'#7a6040', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 1px' }}>{l}</p>
                    <p style={{ fontSize:12, color:'#c8a878', margin:0 }}>{v}</p>
                  </div>
                ))}
              </div>
            </div>
            {!isMobile && (
              <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                <button onClick={()=>navigate(`/animals/${id}/edit`)}
                  style={{ ...S.btn, background:'rgba(255,255,255,0.1)', color:'#f0e6cc', border:'1px solid rgba(255,255,255,0.2)', padding:'7px 14px', fontSize:13 }}>Edit</button>
                <button onClick={handleDelete}
                  style={{ ...S.btn, background:'rgba(255,80,80,0.15)', color:'#ef9a9a', border:'1px solid rgba(255,80,80,0.25)', padding:'7px 14px', fontSize:13 }}>Delete</button>
              </div>
            )}
          </div>
          {isMobile && (
            <div style={{ display:'flex', gap:8, marginTop:12 }}>
              <button onClick={()=>navigate(`/animals/${id}/edit`)} style={{ ...S.btn, flex:1, justifyContent:'center', background:'rgba(255,255,255,0.1)', color:'#f0e6cc', border:'1px solid rgba(255,255,255,0.2)' }}>✎ Edit</button>
              <button onClick={handleDelete} style={{ ...S.btn, flex:1, justifyContent:'center', background:'rgba(255,80,80,0.15)', color:'#ef9a9a', border:'1px solid rgba(255,80,80,0.25)' }}>🗑 Delete</button>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth:1100, margin:'0 auto', padding:isMobile?'12px 12px':'16px 24px' }}>
        {/* Notes */}
        {animal.notes && (
          <div style={{ ...S.card, padding:isMobile?14:20, marginBottom:14 }}>
            <span style={S.sectionLabel}>Notes</span>
            <p style={{ fontSize:14, lineHeight:1.7, margin:0, color:'#4a3c28' }}>{animal.notes}</p>
          </div>
        )}

        {/* Rented dates */}
        {animal.status==='rented' && (animal.arrival_date||animal.departure_date) && (
          <div style={{ ...S.card, padding:isMobile?14:20, marginBottom:14, background:'#fff9e6', border:'1px solid #ffe082' }}>
            <span style={S.sectionLabel}>Rental Period</span>
            <div style={{ display:'flex', gap:20 }}>
              {animal.arrival_date && <div><p style={{ fontSize:10, color:'#f57f17', fontWeight:700, textTransform:'uppercase', margin:'0 0 2px' }}>Arrived</p><p style={{ fontSize:14, margin:0, fontWeight:600 }}>{formatDate(animal.arrival_date)}</p></div>}
              {animal.departure_date && <div><p style={{ fontSize:10, color:'#f57f17', fontWeight:700, textTransform:'uppercase', margin:'0 0 2px' }}>Departed</p><p style={{ fontSize:14, margin:0, fontWeight:600 }}>{formatDate(animal.departure_date)}</p></div>}
            </div>
          </div>
        )}

        {/* Lineage mini-preview */}
        <MiniLineage animal={animal} allAnimals={allAnimals} navigate={navigate} isMobile={isMobile}/>

        {/* Event history */}
        <div style={{ ...S.card, padding:isMobile?14:22 }}>
          <div style={{ display:'flex', alignItems:'center', marginBottom:16 }}>
            <div>
              <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:16, margin:'0 0 2px' }}>Health & Events</p>
              <p style={{ fontSize:12, color:'#a08060', margin:0 }}>{events.length} event{events.length!==1?'s':''} logged</p>
            </div>
            <button onClick={()=>setShowEventForm(v=>!v)}
              style={{ ...S.btn, ...S.btnPrimary, marginLeft:'auto', padding:'7px 14px', fontSize:12 }}>
              {showEventForm?'✕ Cancel':'+ Log Event'}
            </button>
          </div>

          {/* Event form */}
          {showEventForm && (
            <div style={{ background:'#f7f4ef', borderRadius:10, padding:16, marginBottom:16, border:'1px solid #e8e0d0' }}>
              <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:12, marginBottom:12 }}>
                <div>
                  <label style={S.label}>Event Type</label>
                  <select style={{ ...S.input, cursor:'pointer' }} value={eventForm.event_type}
                    onChange={e=>setEventForm(f=>({...f,event_type:e.target.value}))}>
                    {EVENT_TYPES.map(t=><option key={t} value={t}>{t.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Date</label>
                  <input type="date" style={S.input} value={eventForm.event_date}
                    onChange={e=>setEventForm(f=>({...f,event_date:e.target.value}))}/>
                </div>
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={S.label}>Notes (optional)</label>
                <input style={S.input} value={eventForm.notes} placeholder="Any notes…"
                  onChange={e=>setEventForm(f=>({...f,notes:e.target.value}))}/>
              </div>
              <button onClick={handleAddEvent} disabled={saving}
                style={{ ...S.btn, ...S.btnPrimary, opacity:saving?0.7:1 }}>
                {saving?'Saving…':'Save Event'}
              </button>
            </div>
          )}

          {evLoading && <Spinner/>}
          {!evLoading && events.length===0 && (
            <p style={{ color:'#a08060', fontSize:14, textAlign:'center', padding:'20px 0' }}>
              No events yet. Log the first one above.
            </p>
          )}
          {events.map(ev=>{
            const ec    = EVENT_COLORS[ev.event_type]||EVENT_COLORS.custom
            const label = ev.event_type.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())
            const sick  = ev.event_type==='sickness'||ev.event_type==='injury'
            return (
              <div key={ev.id} style={{ display:'flex', gap:10, padding:'11px 13px', borderRadius:9,
                background:sick?'#fff3f3':ec.bg, border:`1px solid ${sick?'#f5c6c6':ec.border}`,
                marginBottom:8, position:'relative' }}>
                {sick&&<div style={{ position:'absolute', top:-7, right:10, background:'#c62828', color:'#fff', fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:8, textTransform:'uppercase' }}>⚠ {label}</div>}
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3, flexWrap:'wrap' }}>
                    <Badge bg={sick?'#f5c6c6':ec.border} color={sick?'#c62828':ec.text}>{label}</Badge>
                    <span style={{ fontSize:11, color:'#7a6648' }}>{formatDate(ev.event_date)}</span>
                  </div>
                  {ev.notes&&<p style={{ fontSize:13, margin:0, color:'#4a3c28', lineHeight:1.5 }}>{ev.notes}</p>}
                </div>
                <button onClick={()=>deleteEvent(ev.id)}
                  style={{ background:'none', border:'none', color:'#c0a080', cursor:'pointer', fontSize:16, padding:'0 4px', flexShrink:0, alignSelf:'flex-start' }}>×</button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
