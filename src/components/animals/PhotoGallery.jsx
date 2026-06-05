import { useState, useEffect, useRef, useCallback } from 'react'

const EVENT_LABELS = {
  vaccination:'Vaccination', worming:'Worming', hoof_trimming:'Hoof Trim',
  shearing:'Shearing', lambing:'Birth', tail_banding:'⭕ Tail Banding', weaning:'Weaning', sickness:'Illness',
  injury:'Injury', weight_check:'Weight Check', pregnancy_check:'Pregnancy Check',
  egg_production:'Egg Production', moulting:'Moulting', breeding:'Breeding',
  sale:'Sale', photo_update:'New Photo', custom:'Note',
}

const overlay = {
  position:'fixed', inset:0, background:'rgba(0,0,0,0.95)', zIndex:9000,
  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
}
const arrowBtn = {
  position:'absolute', top:'50%', transform:'translateY(-50%)',
  background:'rgba(255,255,255,0.12)', border:'none', color:'#fff',
  fontSize:40, fontWeight:300, cursor:'pointer', borderRadius:12,
  width:52, height:72, display:'flex', alignItems:'center', justifyContent:'center',
  transition:'background 0.15s', zIndex:10,
  fontFamily:'sans-serif', lineHeight:1,
}
const closeBtn = {
  background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)',
  color:'#fff', borderRadius:8, padding:'7px 14px', cursor:'pointer',
  fontSize:13, fontFamily:"'Lato',sans-serif", fontWeight:600,
}

export function PhotoGallery({ events, animalName, onClose, onUploadPhoto, onDeletePhoto }) {
  // Sort newest → oldest so left = most recent, right = oldest
  const photos = events
    .filter(e => e.photo_url)
    .sort((a,b) => {
      const da = (a.event_date||'').slice(0,10)
      const db = (b.event_date||'').slice(0,10)
      return db < da ? -1 : db > da ? 1 : 0
    })
    .map(e => ({
      id:        e.id,
      url:       e.photo_url,
      date:      (e.event_date||'').slice(0,10),
      eventType: EVENT_LABELS[e.event_type] || (e.event_type||'').replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()),
      notes:     e.notes || '',
      isProfileUpdate: e.event_type === 'photo_update',
    }))

  const [idx,       setIdx]      = useState(0) // 0 = most recent (left)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [deleting,  setDeleting]  = useState(false)
  const touchStartX = useRef(null)
  const touchStartY = useRef(null)

  const go = useCallback((dir) => {
    setImgLoaded(false)
    setIdx(i => Math.max(0, Math.min(photos.length-1, i+dir)))
  }, [photos.length])

  useEffect(() => {
    const fn = (e) => {
      if (e.key==='ArrowLeft')  go(-1)
      if (e.key==='ArrowRight') go(1)
      if (e.key==='Escape')     onClose()
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [go, onClose])

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }
  const onTouchEnd = (e) => {
    if (!touchStartX.current) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
    touchStartX.current = null
  }

  if (photos.length === 0) return (
    <div style={overlay} onClick={onClose}>
      <div style={{ textAlign:'center', color:'#fff', padding:40 }}>
        <div style={{ fontSize:52, marginBottom:16 }}>📷</div>
        <p style={{ fontSize:18, fontWeight:600, margin:'0 0 8px' }}>No photos yet for {animalName}</p>
        <p style={{ fontSize:14, color:'rgba(255,255,255,0.5)', margin:'0 0 24px' }}>
          Upload a profile photo or attach one when logging an event.
        </p>
        <button onClick={onClose} style={closeBtn}>Close</button>
      </div>
    </div>
  )

  const photo = photos[idx]
  const handleDelete = async () => {
    if (!photo?.id || !onDeletePhoto) return
    if (!window.confirm('Delete this photo?')) return
    setDeleting(true)
    try {
      await onDeletePhoto(photo.id)
      if (photos.length <= 1) onClose()
      else setIdx(i => Math.max(0, Math.min(photos.length - 2, i)))
    } catch (err) {
      alert('Delete failed: ' + err.message)
    } finally {
      setDeleting(false)
    }
  }
  const dateLabel = photo.date
    ? new Date(photo.date+'T12:00:00').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})
    : ''

  return (
    <div style={overlay} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

      {/* Top bar */}
      <div style={{ position:'absolute', top:0, left:0, right:0, zIndex:10,
        background:'linear-gradient(to bottom,rgba(0,0,0,0.8),transparent)',
        padding:'16px 20px', display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <p style={{ fontSize:15, fontWeight:700, color:'#fff', margin:'0 0 3px' }}>
            {animalName} — Photo History
          </p>
          <p style={{ fontSize:12, color:'rgba(255,255,255,0.55)', margin:0 }}>
            {photos.length} photo{photos.length!==1?'s':''} · {idx+1} of {photos.length} · {dateLabel}
          </p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {onDeletePhoto && (
            <button onClick={handleDelete} disabled={deleting}
              style={{ ...closeBtn, background:'rgba(255,80,80,0.18)', border:'1px solid rgba(255,80,80,0.35)',
                color:'#ffcdd2', opacity:deleting?0.6:1 }}>
              {deleting ? 'Deleting…' : 'Delete Photo'}
            </button>
          )}
          {onUploadPhoto && (
            <label style={{ ...closeBtn, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6 }}>
              📷 Upload New Photo
              <input type="file" accept="image/*" style={{ display:'none' }}
                onChange={e=>{ const f=e.target.files[0]; if(f){ onUploadPhoto(f); onClose() } }}/>
            </label>
          )}
          <button onClick={onClose} style={closeBtn}>✕ Close</button>
        </div>
      </div>

      {/* Left arrow */}
      {idx > 0 && (
        <button onClick={()=>go(-1)} style={{ ...arrowBtn, left:12 }}
          onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.25)'}
          onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.12)'}>
          ‹
        </button>
      )}

      {/* Photo */}
      <div style={{ flex:1, width:'100%', display:'flex', alignItems:'center',
        justifyContent:'center', padding:'72px 80px 160px', minHeight:0 }}>
        {!imgLoaded && (
          <div style={{ position:'absolute', color:'rgba(255,255,255,0.35)', fontSize:13 }}>Loading…</div>
        )}
        <img
          key={photo.url}
          src={photo.url}
          alt={`${animalName} — ${photo.eventType}`}
          onLoad={()=>setImgLoaded(true)}
          style={{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain', borderRadius:10,
            boxShadow:'0 12px 48px rgba(0,0,0,0.7)',
            opacity:imgLoaded?1:0, transition:'opacity 0.25s' }}
        />
      </div>

      {/* Right arrow */}
      {idx < photos.length-1 && (
        <button onClick={()=>go(1)} style={{ ...arrowBtn, right:12 }}
          onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.25)'}
          onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.12)'}>
          ›
        </button>
      )}

      {/* Bottom info */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, zIndex:10,
        background:'linear-gradient(to top,rgba(0,0,0,0.85),transparent)',
        padding:'40px 24px 24px' }}>

        {/* Caption / event info */}
        <div style={{ maxWidth:600, margin:'0 auto', textAlign:'center' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, marginBottom:photo.notes?8:0 }}>
            <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20,
              background: photo.isProfileUpdate ? 'rgba(200,160,96,0.4)' : 'rgba(255,255,255,0.15)',
              color: photo.isProfileUpdate ? '#f0e6cc' : 'rgba(255,255,255,0.8)',
              textTransform:'uppercase', letterSpacing:'0.06em' }}>
              {photo.isProfileUpdate ? '📷 Profile Photo' : photo.eventType}
            </span>
            {dateLabel && <span style={{ fontSize:12, color:'rgba(255,255,255,0.5)' }}>{dateLabel}</span>}
          </div>
          {photo.notes && (
            <p style={{ fontSize:14, color:'rgba(255,255,255,0.85)', margin:'6px 0 0',
              lineHeight:1.5, fontStyle:'italic' }}>
              "{photo.notes}"
            </p>
          )}
        </div>

        {/* Dot indicators */}
        <div style={{ display:'flex', justifyContent:'center', gap:6, marginTop:16 }}>
          {photos.map((_,i) => (
            <div key={i} onClick={()=>{ setImgLoaded(false); setIdx(i) }}
              style={{ width: i===idx ? 20 : 7, height:7, borderRadius:4, cursor:'pointer',
                background: i===idx ? '#c8a060' : 'rgba(255,255,255,0.3)',
                transition:'all 0.2s' }}/>
          ))}
        </div>
      </div>
    </div>
  )
}
