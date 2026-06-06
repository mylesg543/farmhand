import { useState, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAnimals, useSingleAnimal } from '../../hooks/useAnimals'
import { useAnimalEvents } from '../../hooks/useAnimalEvents'
import { usePhotoUpload } from '../../hooks/usePhotoUpload'
import { useIsMobile } from '../../hooks/useIsMobile'
import { S, AnimalAvatar, STATUS_DOT, SEX_LABELS, formatDate, calcAge, Spinner, ErrorMsg, ANIMAL_META, speciesBasePath, animalEditPath, animalDetailPath, statusFromEventType, breedingRestrictionPayload, hasBreedingRestriction, DoNotBreedBadge } from '../ui/shared'
import { EventTimeline } from './EventTimeline'
import { PhotoGallery } from './PhotoGallery'

// ─── Mini lineage preview ──────────────────────────────────────────────────────
function MiniLineage({ animal, allAnimals, navigate, isMobile }) {
  const sire = animal.sire_id ? allAnimals.find(a=>a.id===animal.sire_id) : null
  const dam  = animal.dam_id  ? allAnimals.find(a=>a.id===animal.dam_id)  : null
  const hasParents = sire || dam

  return (
    <div style={{ ...S.card, padding:isMobile?'14px 16px':'18px 22px', marginBottom:14 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:hasParents?14:16 }}>
        <span style={{ fontSize:10, fontWeight:700, color:'#a08060', textTransform:'uppercase', letterSpacing:'0.06em' }}>⑂ Lineage</span>
        <button onClick={()=>navigate(`/lineage?id=${animal.id}&species=${animal.species||'sheep'}`)}
          style={{ marginLeft:'auto', ...S.btn, background:'#f0ebe4', color:'#5a3e1b',
            border:'1px solid #d0c4b0', padding:'6px 12px', fontSize:12, fontWeight:600 }}>
          View Full Tree →
        </button>
      </div>
      {!hasParents ? (
        <div style={{ display:'flex', alignItems:isMobile?'stretch':'center', gap:isMobile?10:12, flexWrap:isMobile?'wrap':'nowrap', flexDirection:isMobile?'column':'row' }}>
          <p style={{ fontSize:13, color:'#a08060', margin:0, flex:1 }}>No parents recorded yet.</p>
          <button onClick={()=>navigate(animalEditPath(animal.species, animal.id))}
            style={{ ...S.btn, ...S.btnSecondary, justifyContent:isMobile?'center':undefined, padding:isMobile?'8px 12px':'7px 12px', fontSize:12, minHeight:isMobile?38:34 }}>+ Add Parents</button>
        </div>
      ) : (
        <div style={{ display:'flex', gap:isMobile?12:20, alignItems:'center', flexWrap:'wrap' }}>
          {[['Sire', sire], ['Dam', dam]].map(([role, parent])=>(
            <button key={role} type="button" onClick={()=>parent&&navigate(animalDetailPath(parent.species, parent.id))}
              disabled={!parent}
              style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, border:'none',
                background:'transparent', padding:0, fontFamily:"'Lato',sans-serif",
                cursor:parent?'pointer':'default' }}>
              <div style={{ width:44, height:44, borderRadius:'50%', overflow:'hidden',
                border:'2px solid #e8e0d0', background:'#f0ebe4', opacity:!parent?0.35:1 }}>
                {parent ? <AnimalAvatar animal={parent} size={44}/> : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:'#c8b89a' }}>?</div>}
              </div>
              <span style={{ fontSize:9, fontWeight:700, color:parent?'#2c2416':'#a08060', textTransform:'uppercase', textAlign:'center', maxWidth:60, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {parent ? parent.name : 'Unknown'}
              </span>
              <span style={{ fontSize:8, color:'#a08060' }}>{role}</span>
            </button>
          ))}
          <span style={{ fontSize:18, color:'#c8b89a' }}>→</span>
          <button type="button" onClick={()=>navigate(animalDetailPath(animal.species, animal.id))}
            style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, border:'none',
              background:'transparent', padding:0, fontFamily:"'Lato',sans-serif", cursor:'pointer' }}>
            <div style={{ width:48, height:48, borderRadius:'50%', overflow:'hidden', border:'3px solid #c8a060', background:'#f0ebe4' }}>
              <AnimalAvatar animal={animal} size={48}/>
            </div>
            <span style={{ fontSize:9, fontWeight:700, color:'#2c2416', textTransform:'uppercase', textAlign:'center', maxWidth:60, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{animal.name}</span>
            <span style={{ fontSize:8, color:'#c8a060', fontWeight:700 }}>This Animal</span>
          </button>
          <p style={{ fontSize:12, color:'#a08060', margin:0, fontStyle:'italic', flex:1, minWidth:100 }}>
            Tap "View Full Tree" to see 4 generations.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Animal Detail Page ────────────────────────────────────────────────────────
function OffspringPanel({ animal, offspring, allAnimals, navigate, isMobile }) {
  return (
    <div style={{ ...S.card, padding:isMobile?'14px 16px':'18px 22px', marginBottom:14 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:14 }}>
        <span style={{ fontSize:10, fontWeight:700, color:'#a08060', textTransform:'uppercase', letterSpacing:'0.06em' }}>Children</span>
        <span style={{ fontSize:12, color:'#a08060' }}>{offspring.length}</span>
      </div>
      <div style={{
        display:'grid',
        gridTemplateColumns:isMobile ? '1fr' : 'repeat(auto-fill, minmax(230px, 1fr))',
        gap:isMobile?10:12,
      }}>
        {offspring.map(child => {
          const sire = child.sire_id ? allAnimals.find(a => a.id === child.sire_id) : null
          const dam = child.dam_id ? allAnimals.find(a => a.id === child.dam_id) : null
          const currentRole = child.dam_id === animal.id ? 'Dam' : child.sire_id === animal.id ? 'Sire' : 'Parent'
          const detailLine = [SEX_LABELS[child.sex] || child.sex, child.breed].filter(Boolean).join(' · ')
          return (
            <button key={child.id}
              onClick={()=>navigate(animalDetailPath(child.species, child.id))}
              style={{ display:'grid', gridTemplateColumns:'52px minmax(0, 1fr)', gap:11, minWidth:0, width:'100%',
                textAlign:'left', background:'#fff', border:'1px solid #e8e0d0', borderRadius:8,
                padding:isMobile?'10px 11px':'12px 13px', cursor:'pointer',
                fontFamily:"'Lato',sans-serif", color:'#2c2416' }}>
              <span style={{ width:52, height:52, borderRadius:'50%',
                overflow:'hidden', border:'2px solid #e8e0d0', background:'#f0ebe4', flexShrink:0 }}>
                <AnimalAvatar animal={child} size={52}/>
              </span>
              <span style={{ minWidth:0 }}>
                <span style={{ display:'flex', alignItems:'center', gap:6, minWidth:0, marginBottom:2 }}>
                  <span style={{ display:'block', fontFamily:"'Playfair Display',serif",
                    fontSize:isMobile?15:16, fontWeight:700, overflow:'hidden',
                    textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {child.name}
                  </span>
                  <span style={{ fontSize:9, fontWeight:800, color:'#5a3e1b', background:'#f0ebe4',
                    border:'1px solid #e0d8cc', borderRadius:7, padding:'1px 6px', flexShrink:0 }}>
                    {currentRole}
                  </span>
                </span>
                {detailLine && (
                  <span style={{ display:'block', fontSize:11, color:'#a08060', overflow:'hidden',
                    textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:2 }}>
                    {detailLine}
                  </span>
                )}
                <span style={{ display:'block', fontSize:11, color:'#7a6648', marginBottom:2 }}>
                  {child.birth_date ? `Born ${formatDate(child.birth_date)}` : 'Birth date unknown'}
                </span>
                <span style={{ display:'block', fontSize:10, color:'#a08060', overflow:'hidden',
                  textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  Sire: {sire?.name || 'Unknown'} · Dam: {dam?.name || 'Unknown'}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function AnimalDetailPage() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const isMobile   = useIsMobile()
  const fileRef    = useRef()
  const eventSectionRef = useRef()
  const offspringSectionRef = useRef()
  const { animal, setAnimal, loading, error } = useSingleAnimal(id)
  const { animals: allAnimals, addAnimal, deleteAnimal, updateAnimal } = useAnimals(animal?.species || 'sheep')
  const { events, loading:evLoading, addEvent: _addEvent, addPhotoToEvent, deleteEvent, updateEvent } = useAnimalEvents(id)

  // Auto-update animal status when certain events are logged
  const addEvent = async (payload) => {
    const {
      breedingRestrictionReason,
      breeding_restriction_reason: _formReason,
      ...eventPayload
    } = payload
    await _addEvent(eventPayload)
    const nextStatus = statusFromEventType(eventPayload.event_type)
    if (nextStatus) {
      await updateAnimal(id, { status: nextStatus })
      setAnimal(prev => prev ? { ...prev, status: nextStatus } : prev)
    }
    if (eventPayload.event_type === 'do_not_breed') {
      const restriction = breedingRestrictionPayload(breedingRestrictionReason, eventPayload.event_date)
      await updateAnimal(id, restriction)
      setAnimal(prev => prev ? { ...prev, ...restriction } : prev)
    }
  }
  const { upload, uploading } = usePhotoUpload()
  const [showGallery,   setShowGallery]   = useState(false)
  const [captionPrompt, setCaptionPrompt] = useState(false)
  const [pendingPhoto,  setPendingPhoto]  = useState(null)  // { url, file }
  const [caption,       setCaption]       = useState('')
  const [savingPhoto,   setSavingPhoto]   = useState(false)
  const [logEventSignal, setLogEventSignal] = useState(0)
  const [clearingBreedingFlag, setClearingBreedingFlag] = useState(false)

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${animal.name}? This also deletes all their events.`)) return
    try { await deleteAnimal(id); navigate(speciesBasePath(animal.species)) }
    catch (err) { alert(err.message) }
  }

  // Profile photo upload — becomes avatar + auto-creates a photo_update event
  const handleProfilePhotoSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const url = await upload(file)
      setPendingPhoto({ url, file })
      setCaptionPrompt(true)  // ask for optional caption before saving
    } catch (err) { alert('Upload failed: ' + err.message) }
    e.target.value = ''  // reset input
  }

  const handlePhotoSave = async () => {
    if (!pendingPhoto) return
    setSavingPhoto(true)
    try {
      // 1. Update the animal's avatar
      await updateAnimal(id, { photo_url: pendingPhoto.url })
      setAnimal(prev => prev ? { ...prev, photo_url: pendingPhoto.url } : prev)
      // 2. Auto-create a photo_update event in the timeline
      await addEvent({
        event_type: 'photo_update',
        event_date: new Date().toISOString().split('T')[0],
        notes:      caption.trim() || '',
        photo_url:  pendingPhoto.url,
      })
      setCaptionPrompt(false)
      setPendingPhoto(null)
      setCaption('')
    } catch (err) { alert(err.message) }
    finally { setSavingPhoto(false) }
  }

  const handleLogEventClick = () => {
    setLogEventSignal(v => v + 1)
    window.setTimeout(() => {
      eventSectionRef.current?.scrollIntoView({ behavior:'smooth', block:'start' })
    }, 0)
  }

  const handleClearBreedingFlag = async () => {
    if (!window.confirm(`Remove the Do Not Breed flag from ${animal.name}? The original event will remain in the timeline.`)) return
    setClearingBreedingFlag(true)
    try {
      const cleared = {
        breeding_status: 'cleared',
        breeding_restriction_reason: null,
        breeding_restriction_date: null,
      }
      await updateAnimal(id, cleared)
      setAnimal(prev => prev ? { ...prev, ...cleared } : prev)
    } catch (err) {
      alert('Could not remove the flag: ' + err.message)
    } finally {
      setClearingBreedingFlag(false)
    }
  }

  const latestProfilePhotoFromEvents = (eventList) => [...eventList]
    .filter(e => e.event_type === 'photo_update' && e.photo_url)
    .sort((a,b) => {
      const bd = b.event_date || b.created_at || ''
      const ad = a.event_date || a.created_at || ''
      return bd.localeCompare(ad)
    })[0]?.photo_url || null

  const handleDeleteEvent = async (eventId) => {
    const target = events.find(e => e.id === eventId)
    const remainingEvents = events.filter(e => e.id !== eventId)
    const nextProfilePhoto = target?.event_type === 'photo_update'
      ? latestProfilePhotoFromEvents(remainingEvents)
      : null

    await deleteEvent(eventId)
    if (target?.event_type === 'photo_update') {
      await updateAnimal(id, { photo_url: nextProfilePhoto })
      setAnimal(prev => prev ? { ...prev, photo_url: nextProfilePhoto } : prev)
    }
  }

  const offspring = useMemo(() => {
    if (!animal?.id) return []
    return allAnimals
      .filter(a => a.id !== animal.id && (a.sire_id === animal.id || a.dam_id === animal.id))
      .sort((a, b) => {
        const ad = a.birth_date || ''
        const bd = b.birth_date || ''
        return bd.localeCompare(ad) || (a.name || '').localeCompare(b.name || '', undefined, { sensitivity:'base' })
      })
  }, [allAnimals, animal?.id])

  const hasOffspring = offspring.length > 0
  const handleOffspringClick = () => {
    window.setTimeout(() => {
      offspringSectionRef.current?.scrollIntoView({ behavior:'smooth', block:'start' })
    }, 0)
  }

  // Most recent photo = avatar (from profile updates only, not event photos)
  const latestProfilePhoto = latestProfilePhotoFromEvents(events) || animal?.photo_url

  if (loading) return <div style={S.page}><Spinner/></div>
  if (error||!animal) return <div style={S.page}><ErrorMsg message={error||'Animal not found.'}/></div>

  const meta    = ANIMAL_META[animal.species] || { emoji:'🐾', label:'Animals' }
  const backPath= speciesBasePath(animal.species)
  const profileStats = [
    { label:'Age', value:animal.birth_date ? calcAge(animal.birth_date) : 'Unknown' },
    ...(hasOffspring ? [{ label:'Children', value:offspring.length }] : []),
    { label:'Events', value:events.length },
    { label:'Status', value:animal.status || 'Unknown' },
  ]

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div style={{ background:'linear-gradient(160deg,#2c2416 0%,#4a3520 60%,#6b4f2e 100%)', width:'100%' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:isMobile?'14px 14px 20px':'22px 24px 28px' }}>
          <button onClick={()=>navigate(backPath)}
            style={{ ...S.btn, background:'rgba(255,255,255,0.1)', color:'#f0e6cc',
              border:'1px solid rgba(255,255,255,0.2)', padding:'6px 12px', fontSize:12, marginBottom:14 }}>
            ← {meta.label}
          </button>
          <div style={{ display:'flex', gap:isMobile?12:18, alignItems:'flex-start' }}>
            <div style={{ position:'relative', flexShrink:0 }}>
              <div style={{ width:isMobile?64:80, height:isMobile?64:80, borderRadius:'50%', overflow:'hidden',
                border:'3px solid rgba(255,255,255,0.25)', background:'rgba(255,255,255,0.08)' }}>
                <AnimalAvatar animal={{ ...animal, photo_url: latestProfilePhoto }} size={isMobile?64:80}/>
              </div>
              {/* Camera badge - clean circle, no emoji weirdness */}
              <label title="Update profile photo"
                style={{ position:'absolute', bottom:-2, right:-2, width:26, height:26, borderRadius:'50%',
                  background:'#c8a060', border:'2px solid #2c2416', display:'flex', alignItems:'center',
                  justifyContent:'center', cursor:'pointer', fontSize:13, lineHeight:1,
                  boxShadow:'0 2px 6px rgba(0,0,0,0.3)' }}>
                <span style={{ fontSize:13 }}>+</span>
                <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
                  onChange={handleProfilePhotoSelect} disabled={uploading}/>
              </label>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?20:28, fontWeight:700, color:'#f0e6cc', margin:0 }}>
                  {animal.name}
                </h1>
                <span style={{ padding:'3px 10px', borderRadius:20, fontSize:10, fontWeight:700,
                  background:STATUS_DOT[animal.status]||'#9e9e9e', color:'#fff', textTransform:'uppercase' }}>
                  {animal.status}
                </span>
                {hasBreedingRestriction(animal) && (
                  <DoNotBreedBadge reason={animal.breeding_restriction_reason}/>
                )}
              </div>
              <p style={{ fontSize:12, color:'#c8a878', margin:'0 0 2px', fontStyle:'italic' }}>
                {animal.breed||'Unknown breed'} · {SEX_LABELS[animal.sex]||animal.sex}
                {animal.tag_number&&!animal.tag_number.startsWith('AUTO-')?' · '+animal.tag_number:''}
              </p>
              <p style={{ fontSize:12, color:'#a08060', margin:0 }}>
                {animal.birth_date ? `Born ${formatDate(animal.birth_date)} · ${calcAge(animal.birth_date)}` : 'Birth date unknown'}
              </p>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:9 }}>
                {profileStats.map(stat => (
                  <span key={stat.label} style={{ display:'inline-flex', alignItems:'center', gap:5,
                    border:'1px solid rgba(255,255,255,0.14)', background:'rgba(255,255,255,0.08)',
                    color:'#f0e6cc', borderRadius:8, padding:'4px 8px', fontSize:11, fontWeight:700 }}>
                    <span style={{ color:'#c8a878', fontWeight:800, textTransform:'uppercase', fontSize:9 }}>{stat.label}</span>
                    {stat.value}
                  </span>
                ))}
              </div>
            </div>
            {!isMobile && (
              <div style={{ display:'flex', gap:8, flexShrink:0, alignItems:'center' }}>
                <button onClick={handleLogEventClick}
                  style={{ ...S.btn, background:'#c8a060', color:'#2c2416',
                    border:'1px solid rgba(255,255,255,0.18)', padding:'7px 14px',
                    fontSize:13, fontWeight:800, whiteSpace:'nowrap',
                    boxShadow:'0 4px 14px rgba(0,0,0,0.18)' }}>
                  + Log Event
                </button>
                <label style={{ ...S.btn, background:'rgba(200,160,96,0.25)', color:'#f0e6cc',
                  border:'1px solid rgba(200,160,96,0.4)', padding:'7px 14px', fontSize:13,
                  cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6, whiteSpace:'nowrap' }}>
                  📷 Add Photo
                  <input type="file" accept="image/*" style={{ display:'none' }}
                    onChange={handleProfilePhotoSelect} disabled={uploading}/>
                </label>
                <button onClick={()=>setShowGallery(true)}
                  style={{ ...S.btn, background:'rgba(255,255,255,0.1)', color:'#f0e6cc',
                    border:'1px solid rgba(255,255,255,0.2)', padding:'7px 14px', fontSize:13, whiteSpace:'nowrap' }}>
                  🔍 Photo History
                </button>
                <button onClick={()=>navigate(`/lineage?id=${id}&species=${animal.species||'sheep'}`)}
                  style={{ ...S.btn, background:'rgba(76,175,80,0.2)', color:'#a5d6a7',
                    border:'1px solid rgba(76,175,80,0.35)', padding:'7px 14px', fontSize:13, fontWeight:700, whiteSpace:'nowrap' }}>
                  ⑂ Lineage
                </button>
                {hasOffspring && (
                  <button onClick={handleOffspringClick}
                    style={{ ...S.btn, background:'rgba(200,160,96,0.2)', color:'#f0d8a8',
                      border:'1px solid rgba(200,160,96,0.35)', padding:'7px 14px',
                      fontSize:13, fontWeight:700, whiteSpace:'nowrap' }}>
                    Children
                  </button>
                )}
                <button onClick={()=>navigate(animalEditPath(animal.species, id))}
                  style={{ ...S.btn, background:'rgba(255,255,255,0.1)', color:'#f0e6cc',
                    border:'1px solid rgba(255,255,255,0.2)', padding:'7px 14px', fontSize:13, whiteSpace:'nowrap' }}>
                  ✏️ Edit
                </button>
                <button onClick={handleDelete}
                  style={{ ...S.btn, background:'rgba(255,80,80,0.15)', color:'#ef9a9a',
                    border:'1px solid rgba(255,80,80,0.25)', padding:'7px 14px', fontSize:13, whiteSpace:'nowrap' }}>
                  🗑 Delete
                </button>
              </div>
            )}
          </div>

          {/* Mobile action buttons — 4 equal tiles + full-width delete */}
          {isMobile && (
            <div style={{ marginTop:14 }}>
              <button onClick={handleLogEventClick}
                style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  background:'#c8a060', border:'1px solid rgba(255,255,255,0.18)',
                  borderRadius:10, padding:'12px', cursor:'pointer', color:'#2c2416',
                  fontFamily:"'Lato',sans-serif", fontSize:14, fontWeight:800,
                  boxShadow:'0 4px 14px rgba(0,0,0,0.18)', marginBottom:8 }}>
                <span style={{ fontSize:16, lineHeight:1 }}>+</span> Log Event
              </button>
              <div style={{ display:'grid', gridTemplateColumns:hasOffspring?'repeat(5, minmax(0, 1fr))':'1fr 1fr 1fr 1fr', gap:8, marginBottom:8 }}>
                <label style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5,
                  background:'rgba(200,160,96,0.25)', border:'1px solid rgba(200,160,96,0.4)',
                  borderRadius:10, padding:'12px 6px', cursor:'pointer', color:'#f0e6cc' }}>
                  <span style={{ fontSize:22, lineHeight:1 }}>📷</span>
                  <span style={{ fontSize:11, fontWeight:600 }}>Add Photo</span>
                  <input type="file" accept="image/*" style={{ display:'none' }}
                    onChange={handleProfilePhotoSelect} disabled={uploading}/>
                </label>
                <button onClick={()=>setShowGallery(true)}
                  style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5,
                    background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)',
                    borderRadius:10, padding:'12px 6px', cursor:'pointer', color:'#f0e6cc',
                    fontFamily:"'Lato',sans-serif" }}>
                  <span style={{ fontSize:22, lineHeight:1 }}>🔍</span>
                  <span style={{ fontSize:11, fontWeight:600 }}>Photos</span>
                </button>
                <button onClick={()=>navigate(`/lineage?id=${id}&species=${animal.species||'sheep'}`)}
                  style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5,
                    background:'rgba(76,175,80,0.2)', border:'1px solid rgba(76,175,80,0.35)',
                    borderRadius:10, padding:'12px 6px', cursor:'pointer', color:'#a5d6a7',
                    fontFamily:"'Lato',sans-serif" }}>
                  <span style={{ fontSize:22, lineHeight:1 }}>⑂</span>
                  <span style={{ fontSize:11, fontWeight:700 }}>Lineage</span>
                </button>
                {hasOffspring && (
                  <button onClick={handleOffspringClick}
                    style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5,
                      background:'rgba(200,160,96,0.2)', border:'1px solid rgba(200,160,96,0.35)',
                      borderRadius:10, padding:'12px 4px', cursor:'pointer', color:'#f0d8a8',
                      fontFamily:"'Lato',sans-serif", minWidth:0 }}>
                    <span style={{ fontSize:22, lineHeight:1 }}>O</span>
                    <span style={{ fontSize:10, fontWeight:700, maxWidth:'100%', overflow:'hidden', textOverflow:'ellipsis' }}>Children</span>
                  </button>
                )}
                <button onClick={()=>navigate(animalEditPath(animal.species, id))}
                  style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5,
                    background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)',
                    borderRadius:10, padding:'12px 6px', cursor:'pointer', color:'#f0e6cc',
                    fontFamily:"'Lato',sans-serif" }}>
                  <span style={{ fontSize:22, lineHeight:1 }}>✏️</span>
                  <span style={{ fontSize:11, fontWeight:600 }}>Edit</span>
                </button>
              </div>
              {/* Delete full width */}
              <button onClick={handleDelete}
                style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  background:'rgba(255,80,80,0.15)', border:'1px solid rgba(255,80,80,0.25)',
                  borderRadius:10, padding:'12px', cursor:'pointer', color:'#ef9a9a',
                  fontFamily:"'Lato',sans-serif", fontSize:14, fontWeight:600 }}>
                <span style={{ fontSize:18, lineHeight:1 }}>🗑</span> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth:1100, margin:'0 auto', padding:isMobile?'12px 12px':'16px 24px' }}>

        {hasBreedingRestriction(animal) && (
          <div style={{ ...S.card, padding:isMobile?'15px 14px':'18px 20px', marginBottom:14,
            background:'#fff5f5', border:'1px solid #ef9a9a',
            display:'flex', alignItems:isMobile?'stretch':'center', justifyContent:'space-between',
            gap:14, flexDirection:isMobile?'column':'row' }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <DoNotBreedBadge reason={animal.breeding_restriction_reason}/>
                <strong style={{ color:'#8e1515', fontSize:14 }}>This animal has been marked Do Not Breed.</strong>
              </div>
              <p style={{ margin:0, color:'#6d2424', fontSize:13, lineHeight:1.55 }}>
                {animal.breeding_restriction_reason && <>Reason: <strong>{animal.breeding_restriction_reason}</strong></>}
                {animal.breeding_restriction_reason && animal.breeding_restriction_date && <span> &middot; </span>}
                {animal.breeding_restriction_date && <>Marked: <strong>{formatDate(animal.breeding_restriction_date)}</strong></>}
              </p>
            </div>
            <button onClick={handleClearBreedingFlag} disabled={clearingBreedingFlag}
              style={{ ...S.btn, background:'#fff', color:'#a51d1d', border:'1px solid #d96b6b',
                padding:'8px 12px', fontSize:12, fontWeight:700, whiteSpace:'nowrap',
                justifyContent:'center', opacity:clearingBreedingFlag?0.6:1 }}>
              {clearingBreedingFlag ? 'Removing...' : 'Remove Do Not Breed Flag'}
            </button>
          </div>
        )}

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
            <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
              {animal.arrival_date && <div><p style={{ fontSize:10, color:'#f57f17', fontWeight:700, textTransform:'uppercase', margin:'0 0 2px' }}>Arrived</p><p style={{ fontSize:14, margin:0, fontWeight:600 }}>{formatDate(animal.arrival_date)}</p></div>}
              {animal.departure_date && <div><p style={{ fontSize:10, color:'#f57f17', fontWeight:700, textTransform:'uppercase', margin:'0 0 2px' }}>Departed</p><p style={{ fontSize:14, margin:0, fontWeight:600 }}>{formatDate(animal.departure_date)}</p></div>}
            </div>
          </div>
        )}

        {/* Mini lineage */}
        <MiniLineage animal={animal} allAnimals={allAnimals} navigate={navigate} isMobile={isMobile}/>

        {hasOffspring && (
          <div ref={offspringSectionRef}>
            <OffspringPanel animal={animal} offspring={offspring} allAnimals={allAnimals} navigate={navigate} isMobile={isMobile}/>
          </div>
        )}

        {/* Event timeline */}
        <div ref={eventSectionRef} style={{ ...S.card, padding:isMobile?'14px 12px':'22px 24px' }}>
          {evLoading ? <Spinner/> : (
            <EventTimeline
              events={events}
              loading={evLoading}
              onAddEvent={addEvent}
              onCreateLamb={addAnimal}
              animal={animal}
              allAnimals={allAnimals}
              onAddPhoto={addPhotoToEvent}
              onDelete={handleDeleteEvent}
              onUpdate={updateEvent}
              isMobile={isMobile}
              openSignal={logEventSignal}
            />
          )}
        </div>
      </div>

      {/* Caption prompt after profile photo upload */}
      {captionPrompt && pendingPhoto && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:8000,
          display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'#fff', borderRadius:14, padding:24, maxWidth:380, width:'100%',
            boxShadow:'0 20px 60px rgba(0,0,0,0.4)' }}>
            <div style={{ width:100, height:100, borderRadius:12, overflow:'hidden',
              margin:'0 auto 16px', border:'3px solid #c8a060' }}>
              <img src={pendingPhoto.url} alt="Preview"
                style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
            </div>
            <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17,
              margin:'0 0 4px', textAlign:'center' }}>
              Update {animal.name}'s photo
            </p>
            <p style={{ fontSize:13, color:'#a08060', margin:'0 0 16px', textAlign:'center', lineHeight:1.5 }}>
              This becomes the new avatar. The old photo is kept in the timeline.
            </p>
            <label style={S.label}>Add a caption (optional)</label>
            <input style={{ ...S.input, marginBottom:16 }}
              value={caption} onChange={e=>setCaption(e.target.value)}
              placeholder="e.g. Post-shearing, looking great"
              autoFocus
              onKeyDown={e=>e.key==='Enter'&&handlePhotoSave()}/>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={handlePhotoSave} disabled={savingPhoto}
                style={{ ...S.btn, ...S.btnPrimary, flex:1, justifyContent:'center',
                  opacity:savingPhoto?0.7:1 }}>
                {savingPhoto?'Saving…':'Save Photo'}
              </button>
              <button onClick={()=>{ setCaptionPrompt(false); setPendingPhoto(null); setCaption('') }}
                style={{ ...S.btn, ...S.btnSecondary }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo gallery overlay */}
      {showGallery && (
        <PhotoGallery
          events={events}
          animalName={animal.name}
          onClose={()=>setShowGallery(false)}
          onDeletePhoto={handleDeleteEvent}
          onUploadPhoto={async(file)=>{
            try {
              const url = await upload(file)
              setPendingPhoto({ url, file })
              setCaptionPrompt(true)
            } catch(err){ alert('Upload failed: '+err.message) }
          }}
        />
      )}
    </div>
  )
}
