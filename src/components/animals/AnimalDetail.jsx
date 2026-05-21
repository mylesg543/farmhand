import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAnimals, useSingleAnimal } from '../../hooks/useAnimals'
import { useAnimalEvents } from '../../hooks/useAnimalEvents'
import { usePhotoUpload } from '../../hooks/usePhotoUpload'
import { useIsMobile } from '../../hooks/useIsMobile'
import { S, AnimalIllustration, STATUS_STYLES, STATUS_DOT, SEX_LABELS, formatDate, calcAge, Spinner, ErrorMsg } from '../ui/shared'
import { EventTimeline } from './EventTimeline'
import { PhotoGallery } from './PhotoGallery'

// ─── Mini lineage preview ──────────────────────────────────────────────────────
function MiniLineage({ animal, allAnimals, navigate, isMobile }) {
  const sire = animal.sire_id ? allAnimals.find(a=>a.id===animal.sire_id) : null
  const dam  = animal.dam_id  ? allAnimals.find(a=>a.id===animal.dam_id)  : null
  const hasParents = sire || dam

  return (
    <div style={{ ...S.card, padding:isMobile?'14px 16px':'18px 22px', marginBottom:14 }}>
      <div style={{ display:'flex', alignItems:'center', marginBottom:hasParents?14:0 }}>
        <span style={{ fontSize:10, fontWeight:700, color:'#a08060', textTransform:'uppercase', letterSpacing:'0.06em' }}>⑂ Lineage</span>
        <button onClick={()=>navigate(`/lineage?id=${animal.id}&species=${animal.species||'sheep'}`)}
          style={{ marginLeft:'auto', ...S.btn, background:'#f0ebe4', color:'#5a3e1b',
            border:'1px solid #d0c4b0', padding:'6px 12px', fontSize:12, fontWeight:600 }}>
          View Full Tree →
        </button>
      </div>
      {!hasParents ? (
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <p style={{ fontSize:13, color:'#a08060', margin:0, flex:1 }}>No parents recorded yet.</p>
          <button onClick={()=>navigate(`/animals/${animal.id}/edit`)}
            style={{ ...S.btn, ...S.btnSecondary, padding:'5px 12px', fontSize:12 }}>+ Add Parents</button>
        </div>
      ) : (
        <div style={{ display:'flex', gap:isMobile?12:20, alignItems:'center', flexWrap:'wrap' }}>
          {[['Sire', sire], ['Dam', dam]].map(([role, parent])=>(
            <div key={role} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <div style={{ width:44, height:44, borderRadius:'50%', overflow:'hidden',
                border:'2px solid #e8e0d0', background:'#f0ebe4', opacity:!parent?0.35:1 }}>
                {parent?.photo_url
                  ? <img src={parent.photo_url} alt={parent.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                  : parent ? <AnimalIllustration animal={parent} size={44}/>
                  : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:'#c8b89a' }}>?</div>
                }
              </div>
              <span style={{ fontSize:9, fontWeight:700, color:parent?'#2c2416':'#a08060', textTransform:'uppercase', textAlign:'center', maxWidth:60, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {parent ? parent.name : 'Unknown'}
              </span>
              <span style={{ fontSize:8, color:'#a08060' }}>{role}</span>
            </div>
          ))}
          <span style={{ fontSize:18, color:'#c8b89a' }}>→</span>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
            <div style={{ width:48, height:48, borderRadius:'50%', overflow:'hidden', border:'3px solid #c8a060', background:'#f0ebe4' }}>
              {animal.photo_url
                ? <img src={animal.photo_url} alt={animal.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                : <AnimalIllustration animal={animal} size={48}/>
              }
            </div>
            <span style={{ fontSize:9, fontWeight:700, color:'#2c2416', textTransform:'uppercase', textAlign:'center', maxWidth:60, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{animal.name}</span>
            <span style={{ fontSize:8, color:'#c8a060', fontWeight:700 }}>This Animal</span>
          </div>
          <p style={{ fontSize:12, color:'#a08060', margin:0, fontStyle:'italic', flex:1, minWidth:100 }}>
            Tap "View Full Tree" to see 4 generations.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Animal Detail Page ────────────────────────────────────────────────────────
export function AnimalDetailPage() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const isMobile   = useIsMobile()
  const fileRef    = useRef()
  const { animal, loading, error } = useSingleAnimal(id)
  const { animals: allAnimals, deleteAnimal, updateAnimal } = useAnimals(animal?.species || 'sheep')
  const { events, loading:evLoading, addEvent, addPhotoToEvent, deleteEvent } = useAnimalEvents(id)
  const { upload, uploading } = usePhotoUpload()
  const [showGallery,   setShowGallery]   = useState(false)
  const [captionPrompt, setCaptionPrompt] = useState(false)
  const [pendingPhoto,  setPendingPhoto]  = useState(null)  // { url, file }
  const [caption,       setCaption]       = useState('')
  const [savingPhoto,   setSavingPhoto]   = useState(false)

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${animal.name}? This also deletes all their events.`)) return
    try { await deleteAnimal(id); navigate(animal.species==='chickens'?'/chickens':'/') }
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

  // Most recent photo = avatar (from profile updates only, not event photos)
  const latestProfilePhoto = [...events]
    .filter(e => e.event_type === 'photo_update' && e.photo_url)
    .sort((a,b) => b.event_date > a.event_date ? 1 : -1)[0]?.photo_url || animal?.photo_url

  if (loading) return <div style={S.page}><Spinner/></div>
  if (error||!animal) return <div style={S.page}><ErrorMsg message={error||'Animal not found.'}/></div>

  const metaMap = { sheep:{ emoji:'🐑', label:'Sheep' }, chickens:{ emoji:'🐔', label:'Chickens' } }
  const meta    = metaMap[animal.species] || { emoji:'🐾', label:'Animals' }
  const st      = STATUS_STYLES[animal.status] || STATUS_STYLES.alive
  const backPath= animal.species==='chickens' ? '/chickens' : '/'

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
                {latestProfilePhoto
                  ? <img src={latestProfilePhoto} alt={animal.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                  : <AnimalIllustration animal={animal} size={isMobile?64:80}/>
                }
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
              </div>
              <p style={{ fontSize:12, color:'#c8a878', margin:'0 0 2px', fontStyle:'italic' }}>
                {animal.breed||'Unknown breed'} · {SEX_LABELS[animal.sex]||animal.sex}
                {animal.tag_number&&!animal.tag_number.startsWith('AUTO-')?' · '+animal.tag_number:''}
              </p>
              <p style={{ fontSize:12, color:'#a08060', margin:0 }}>
                {animal.birth_date ? `Born ${formatDate(animal.birth_date)} · ${calcAge(animal.birth_date)}` : 'Birth date unknown'}
              </p>
            </div>
            {!isMobile && (
              <div style={{ display:'flex', gap:8, flexShrink:0, alignItems:'center' }}>
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
                  🖼️ Photo History
                </button>
                <button onClick={()=>navigate(`/lineage?id=${id}&species=${animal.species||'sheep'}`)}
                  style={{ ...S.btn, background:'rgba(76,175,80,0.2)', color:'#a5d6a7',
                    border:'1px solid rgba(76,175,80,0.35)', padding:'7px 14px', fontSize:13, fontWeight:700, whiteSpace:'nowrap' }}>
                  ⑂ Lineage
                </button>
                <button onClick={()=>navigate(`/animals/${id}/edit`)}
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
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:8, marginBottom:8 }}>
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
                  <span style={{ fontSize:22, lineHeight:1 }}>🖼️</span>
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
                <button onClick={()=>navigate(`/animals/${id}/edit`)}
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

        {/* Event timeline */}
        <div style={{ ...S.card, padding:isMobile?'14px 12px':'22px 24px' }}>
          {evLoading ? <Spinner/> : (
            <EventTimeline
              events={events}
              loading={evLoading}
              onAddEvent={addEvent}
              onAddPhoto={addPhotoToEvent}
              onDelete={deleteEvent}
              isMobile={isMobile}
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
