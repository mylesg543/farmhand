import { useState, useEffect, useRef } from 'react'
import { usePhotoUpload } from '../../hooks/usePhotoUpload'
import { S, Badge, formatDate } from '../ui/shared'

// ─── Event type metadata ───────────────────────────────────────────────────────
const EVENT_META = {
  vaccination:     { icon:'💉', label:'Vaccination',      color:'#1565c0', bg:'#e3f2fd', border:'#90caf9' },
  worming:         { icon:'💊', label:'Worming',           color:'#6a1b9a', bg:'#f3e5f5', border:'#ce93d8' },
  hoof_trimming:   { icon:'✂️',  label:'Hoof Trim',        color:'#4e342e', bg:'#efebe9', border:'#bcaaa4' },
  hoof_treatment:  { icon:'🩺', label:'Hoof Treatment',    color:'#4e342e', bg:'#efebe9', border:'#bcaaa4' },
  shearing:        { icon:'✂️',  label:'Shearing',         color:'#2e7d32', bg:'#e8f5e9', border:'#a5d6a7' },
  lambing:         { icon:'🐣', label:'Birth',             color:'#e65100', bg:'#fff3e0', border:'#ffcc80' },
  tail_banding:    { icon:'⭕', label:'Tail Banding',      color:'#6d4c41', bg:'#efebe9', border:'#bcaaa4' },
  weaning:         { icon:'🍼', label:'Weaning',           color:'#f57f17', bg:'#fff9e6', border:'#ffe082' },
  sickness:        { icon:'🤒', label:'Illness',           color:'#c62828', bg:'#fff3f3', border:'#f5c6c6' },
  injury:          { icon:'🩹', label:'Injury',            color:'#c62828', bg:'#fff3f3', border:'#f5c6c6' },
  weight_check:    { icon:'⚖️',  label:'Weight Check',     color:'#00695c', bg:'#e0f2f1', border:'#80cbc4' },
  pregnancy_check: { icon:'🔍', label:'Pregnancy Check',  color:'#ad1457', bg:'#fce4ec', border:'#f48fb1' },
  egg_production:  { icon:'🥚', label:'Egg Production',   color:'#f57f17', bg:'#fff9e6', border:'#ffe082' },
  moulting:        { icon:'🪶', label:'Moulting',          color:'#5d4037', bg:'#efebe9', border:'#bcaaa4' },
  breeding:        { icon:'❤️',  label:'Breeding',         color:'#ad1457', bg:'#fce4ec', border:'#f48fb1' },
  sale:            { icon:'💰', label:'Sale',               color:'#2e7d32', bg:'#e8f5e9', border:'#a5d6a7' },
  weight:          { icon:'⚖️',  label:'Weight',           color:'#00695c', bg:'#e0f2f1', border:'#80cbc4' },
  photo_update:    { icon:'📷', label:'New Photo',         color:'#5a3e1b', bg:'#fdfaf6', border:'#d0c4b0' },
  custom:          { icon:'📝', label:'Note',               color:'#5a3e1b', bg:'#fdfaf6', border:'#d0c4b0' },
}
const getMeta = (type) => EVENT_META[type] || EVENT_META.custom

// ─── Group events by year-month ────────────────────────────────────────────────
function groupByMonth(events) {
  const map = new Map()
  for (const ev of events) {
    const key = (ev.event_date || '').slice(0, 7) // 'YYYY-MM'
    if (!key || key.length < 7) continue
    if (!map.has(key)) {
      const [year, month] = key.split('-')
      const lbl = new Date(parseInt(year), parseInt(month) - 1, 1)
        .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      map.set(key, { key, label: lbl, events: [] })
    }
    map.get(key).events.push(ev)
  }
  // Sort groups newest first, events within each group newest first
  return Array.from(map.values())
    .sort((a, b) => b.key > a.key ? 1 : -1)
    .map(g => ({
      ...g,
      events: [...g.events].sort((a, b) =>
        (b.event_date||'').slice(0,10) > (a.event_date||'').slice(0,10) ? 1 : -1
      )
    }))
}

// ─── Single event card ─────────────────────────────────────────────────────────
function EventCard({ event, onAddPhoto, onDelete, onUpdate, isMobile }) {
  const [expanded,   setExpanded]   = useState(false)
  const [uploading,  setUploading]  = useState(false)
  const [photoErr,   setPhotoErr]   = useState(false)
  const { upload }  = usePhotoUpload()
  const fileRef     = useRef()
  const meta        = getMeta(event.event_type)
  const isAlert     = event.event_type==='sickness' || event.event_type==='injury'
  const hasPhoto    = !!event.photo_url && !photoErr
  const day         = new Date(event.event_date+'T00:00:00').getDate()
  const mon         = new Date(event.event_date+'T00:00:00').toLocaleDateString('en-US',{month:'short'})

  const [uploadErrMsg, setUploadErrMsg] = useState('')
  const [editing,      setEditing]      = useState(false)
  const [editNotes,    setEditNotes]    = useState(event.notes || '')
  const [editDate,     setEditDate]     = useState(event.event_date || '')
  const [saving,       setSaving]       = useState(false)

  const handleSaveEdit = async (e) => {
    e.stopPropagation()
    setSaving(true)
    try {
      await onUpdate(event.id, { notes: editNotes, event_date: editDate })
      setEditing(false)
    } catch (err) { alert('Save failed: ' + err.message) }
    finally { setSaving(false) }
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    setUploadErrMsg('')
    try {
      const url = await upload(file)
      await onAddPhoto(event.id, url)
    } catch (err) {
      console.error(err)
      setUploadErrMsg('Upload failed — check your connection and try again.')
    } finally { setUploading(false) }
  }

  return (
    <div style={{ display:'flex', gap:0, position:'relative' }}>
      {/* Date column */}
      <div style={{ width:isMobile?44:52, flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', paddingTop:4 }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?16:20, fontWeight:700, color:'#2c2416', lineHeight:1 }}>{day}</div>
        <div style={{ fontSize:9, fontWeight:700, color:'#a08060', textTransform:'uppercase', letterSpacing:'0.06em' }}>{mon}</div>
      </div>

      {/* Icon / photo */}
      <div style={{ width:isMobile?44:52, flexShrink:0, display:'flex', justifyContent:'center', paddingTop:2, position:'relative', zIndex:1 }}>
        {hasPhoto ? (
          <div style={{ width:isMobile?40:48, height:isMobile?40:48, borderRadius:10, overflow:'hidden', border:`2px solid ${meta.border}`, cursor:'pointer' }}
            onClick={()=>setExpanded(v=>!v)}>
            <img src={event.photo_url} alt={meta.label}
              style={{ width:'100%', height:'100%', objectFit:'cover' }}
              onError={()=>setPhotoErr(true)}/>
          </div>
        ) : (
          <div onClick={()=>setExpanded(v=>!v)}
            style={{ width:isMobile?40:48, height:isMobile?40:48, borderRadius:10, background:meta.bg,
              border:`2px solid ${meta.border}`, display:'flex', alignItems:'center',
              justifyContent:'center', fontSize:isMobile?18:22, cursor:'pointer',
              boxShadow: isAlert ? '0 0 0 3px rgba(198,40,40,0.2)' : 'none' }}>
            {meta.icon}
          </div>
        )}
      </div>

      {/* Card body */}
      <div style={{ flex:1, minWidth:0, paddingBottom:16, paddingLeft:isMobile?10:14 }}>
        <div onClick={()=>setExpanded(v=>!v)}
          style={{ cursor:'pointer', background:expanded?meta.bg:'transparent',
            border:expanded?`1px solid ${meta.border}`:'1px solid transparent',
            borderRadius:10, padding:expanded?(isMobile?'10px 12px':'12px 16px'):'4px 0',
            transition:'all 0.2s' }}>

          {/* Header row */}
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <span style={{ fontSize:isMobile?12:13, fontWeight:700, color:meta.color }}>{meta.label}</span>
            {isAlert && (
              <span style={{ fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:8,
                background:'#c62828', color:'#fff', textTransform:'uppercase' }}>⚠ Alert</span>
            )}
            <span style={{ fontSize:11, color:'#a08060', marginLeft:'auto' }}>
              {expanded ? '▲' : '▾'}
            </span>
          </div>

          {/* Notes preview when collapsed */}
          {!expanded && event.notes && (
            <p style={{ fontSize:12, color:'#7a6648', margin:'3px 0 0', overflow:'hidden',
              textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'100%' }}>
              {event.notes}
            </p>
          )}

          {/* Expanded content */}
          {expanded && (
            <div style={{ marginTop:10 }}>
              {editing ? (
                /* ── Inline edit form ── */
                <div onClick={e=>e.stopPropagation()}>
                  <div style={{ marginBottom:8 }}>
                    <label style={{ fontSize:11, fontWeight:700, color:'#a08060', textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:4 }}>Date</label>
                    <input type="date" value={editDate} onChange={e=>setEditDate(e.target.value)}
                      style={{ ...S.input, fontSize:13, padding:'6px 10px' }}/>
                  </div>
                  <div style={{ marginBottom:10 }}>
                    <label style={{ fontSize:11, fontWeight:700, color:'#a08060', textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:4 }}>Notes</label>
                    <textarea value={editNotes} onChange={e=>setEditNotes(e.target.value)}
                      style={{ ...S.input, height:72, resize:'vertical', fontSize:13 }}
                      placeholder="Add notes…"/>
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={handleSaveEdit} disabled={saving}
                      style={{ ...S.btn, ...S.btnPrimary, padding:'6px 14px', fontSize:12, opacity:saving?0.6:1 }}>
                      {saving ? 'Saving…' : '✓ Save'}
                    </button>
                    <button onClick={e=>{ e.stopPropagation(); setEditing(false) }}
                      style={{ ...S.btn, ...S.btnSecondary, padding:'6px 12px', fontSize:12 }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {event.notes && (
                    <p style={{ fontSize:13, color:'#4a3c28', margin:'0 0 10px', lineHeight:1.6 }}>{event.notes}</p>
                  )}

                  {/* Full photo when expanded */}
                  {hasPhoto && (
                    <div style={{ borderRadius:8, overflow:'hidden', marginBottom:10, maxWidth:300 }}>
                      <img src={event.photo_url} alt={meta.label}
                        style={{ width:'100%', height:'auto', display:'block' }}
                        onError={()=>setPhotoErr(true)}/>
                    </div>
                  )}

                  {/* Actions row */}
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', marginTop:6 }}>
                    <label style={{ ...S.btn, ...S.btnSecondary, padding:'5px 10px', fontSize:11, cursor:'pointer',
                      display:'inline-flex', alignItems:'center', gap:5, opacity:uploading?0.6:1 }}>
                      {uploading ? 'Uploading…' : hasPhoto ? '📷 Change Photo' : '📷 Add Photo'}
                      <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
                        onChange={handlePhotoUpload} disabled={uploading}/>
                    </label>
                    <button onClick={e=>{ e.stopPropagation(); setEditing(true) }}
                      style={{ ...S.btn, padding:'5px 10px', fontSize:11, background:'none',
                        border:'1px solid #d0c4b0', color:'#5a3e1b', cursor:'pointer' }}>
                      ✏️ Edit
                    </button>
                    <button onClick={(e)=>{ e.stopPropagation(); if(window.confirm('Delete this event?')) onDelete(event.id) }}
                      style={{ ...S.btn, padding:'5px 10px', fontSize:11, background:'none',
                        border:'1px solid #f5c6c6', color:'#c62828', cursor:'pointer' }}>
                      Delete
                    </button>
                  </div>
                  {uploadErrMsg && <p style={{ fontSize:11, color:'#c62828', margin:'6px 0 0' }}>{uploadErrMsg}</p>}
                </>
              )}
            </div>
          )}
        </div>

        {/* Add photo nudge — subtle, only when collapsed and no photo */}
        {!expanded && !hasPhoto && (
          <label style={{ display:'inline-flex', alignItems:'center', gap:4, marginTop:4,
            fontSize:10, color:'#c8b89a', cursor:'pointer', fontStyle:'italic',
            opacity:0.7, transition:'opacity 0.15s' }}
            onMouseEnter={e=>e.currentTarget.style.opacity='1'}
            onMouseLeave={e=>e.currentTarget.style.opacity='0.7'}>
            <span>📷</span> add photo
            <input type="file" accept="image/*" style={{ display:'none' }}
              onChange={handlePhotoUpload} disabled={uploading}/>
          </label>
        )}
      </div>
    </div>
  )
}

// ─── Log Event Form ────────────────────────────────────────────────────────────
const newLambRows = (count) => Array.from({ length: count }, () => ({ name: '', sire_id: '' }))

function LogEventForm({ onSave, onCancel, isMobile, animal, allAnimals=[] }) {
  const { upload, uploading } = usePhotoUpload()
  const [form, setForm] = useState({
    event_type: 'vaccination',
    event_date: new Date().toISOString().split('T')[0],
    notes: '',
    photo_url: null,
  })
  const [saving,   setSaving]   = useState(false)
  const [preview,  setPreview]  = useState(null)
  const [createLambs, setCreateLambs] = useState(false)
  const [lambCount, setLambCount] = useState(1)
  const [lambs, setLambs] = useState(newLambRows(1))
  const fileRef = useRef()
  const set = (k,v) => setForm(f=>({...f,[k]:v}))
  const isBirthForSheep = animal?.species === 'sheep' && form.event_type === 'lambing'
  const sireOptions = allAnimals.filter(a => a.species === 'sheep' && ['ram','male'].includes(a.sex) && a.id !== animal?.id)

  useEffect(() => {
    setLambs(prev => Array.from({ length: lambCount }, (_, i) => prev[i] || { name: '', sire_id: '' }))
  }, [lambCount])

  useEffect(() => {
    if (!isBirthForSheep) setCreateLambs(false)
  }, [isBirthForSheep])

  const setLamb = (idx, key, value) => {
    setLambs(prev => prev.map((row, i) => i === idx ? { ...row, [key]: value } : row))
  }

  const handlePhoto = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    try {
      const url = await upload(file)
      set('photo_url', url)
    } catch (err) { console.error(err) }
  }

  const handleSave = async () => {
    if (isBirthForSheep && createLambs) {
      const missingName = lambs.some(l => !l.name.trim())
      if (missingName) {
        alert('Name each lamb before saving, or turn off lamb record creation.')
        return
      }
    }
    setSaving(true)
    try {
      await onSave({
        ...form,
        lambsToCreate: isBirthForSheep && createLambs ? lambs.map(l => ({
          name: l.name.trim(),
          sire_id: l.sire_id || null,
        })) : [],
      })
    }
    catch (err) { alert(err.message); setSaving(false) }
  }

  const meta = getMeta(form.event_type)

  return (
    <div style={{ background:'#fdfaf6', border:'1px solid #e8e0d0', borderRadius:12,
      padding:isMobile?'14px 14px':'18px 20px', marginBottom:20 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
        <div style={{ width:36, height:36, borderRadius:8, background:meta.bg, border:`1px solid ${meta.border}`,
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{meta.icon}</div>
        <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:15 }}>Log an Event</span>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:12, marginBottom:12 }}>
        <div>
          <label style={S.label}>What happened?</label>
          <select style={{ ...S.input, cursor:'pointer' }} value={form.event_type}
            onChange={e=>set('event_type', e.target.value)}>
            {Object.entries(EVENT_META).map(([k,v])=>(
              <option key={k} value={k}>{v.icon} {v.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={S.label}>Date</label>
          <input type="date" style={S.input} value={form.event_date}
            onChange={e=>set('event_date', e.target.value)}/>
        </div>
      </div>

      <div style={{ marginBottom:12 }}>
        <label style={S.label}>Notes (optional)</label>
        <textarea style={{ ...S.input, minHeight:72, resize:'vertical', fontFamily:"'Lato',sans-serif" }}
          value={form.notes} onChange={e=>set('notes', e.target.value)}
          placeholder="Anything worth remembering…"/>
      </div>

      {isBirthForSheep && (
        <div style={{ background:'#fff9e6', border:'1px solid #ffe082', borderRadius:10, padding:isMobile?'12px':'14px 16px', marginBottom:14 }}>
          <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', marginBottom:createLambs?12:0 }}>
            <input type="checkbox" checked={createLambs} onChange={e=>setCreateLambs(e.target.checked)}/>
            <span style={{ fontSize:13, fontWeight:700, color:'#5a3e1b' }}>Create lamb records from this birth?</span>
          </label>

          {createLambs && (
            <>
              <div style={{ marginBottom:12 }}>
                <label style={S.label}>How many lambs?</label>
                <select style={{ ...S.input, cursor:'pointer', maxWidth:140 }} value={lambCount}
                  onChange={e=>setLambCount(Number(e.target.value))}>
                  {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {lambs.map((lamb, idx) => (
                  <div key={idx} style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:10 }}>
                    <div>
                      <label style={S.label}>Lamb {idx + 1} Name</label>
                      <input style={S.input} value={lamb.name}
                        onChange={e=>setLamb(idx, 'name', e.target.value)}
                        placeholder={`Lamb ${idx + 1}`}/>
                    </div>
                    <div>
                      <label style={S.label}>Father / Sire</label>
                      <select style={{ ...S.input, cursor:'pointer' }} value={lamb.sire_id}
                        onChange={e=>setLamb(idx, 'sire_id', e.target.value)}>
                        <option value="">Unknown</option>
                        {sireOptions.map(sire => (
                          <option key={sire.id} value={sire.id}>
                            {sire.name}{sire.tag_number && !sire.tag_number.startsWith('AUTO-') ? ` (${sire.tag_number})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize:11, color:'#a08060', margin:'10px 0 0' }}>
                Mother will be set to {animal?.name}. Birth date will use this event date.
              </p>
            </>
          )}
        </div>
      )}

      {/* Photo attach */}
      <div style={{ marginBottom:14 }}>
        <label style={S.label}>Photo (optional)</label>
        {preview ? (
          <div style={{ position:'relative', display:'inline-block' }}>
            <img src={preview} alt="Preview"
              style={{ width:80, height:80, borderRadius:8, objectFit:'cover', border:'2px solid #e8e0d0', display:'block' }}/>
            <button onClick={()=>{ setPreview(null); set('photo_url', null) }}
              style={{ position:'absolute', top:-6, right:-6, width:20, height:20, borderRadius:'50%',
                background:'#c62828', color:'#fff', border:'none', cursor:'pointer', fontSize:12,
                display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>×</button>
          </div>
        ) : (
          <label style={{ ...S.btn, ...S.btnSecondary, cursor:'pointer', display:'inline-flex',
            alignItems:'center', gap:6, padding:'7px 14px', opacity:uploading?0.6:1 }}>
            {uploading ? '⏳ Uploading…' : '📷 Attach Photo'}
            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
              onChange={handlePhoto} disabled={uploading}/>
          </label>
        )}
      </div>

      <div style={{ display:'flex', gap:10 }}>
        <button onClick={handleSave} disabled={saving||uploading}
          style={{ ...S.btn, ...S.btnPrimary, padding:'10px 22px', opacity:(saving||uploading)?0.7:1 }}>
          {saving ? 'Saving…' : 'Save Event'}
        </button>
        <button onClick={onCancel} style={{ ...S.btn, ...S.btnSecondary }}>Cancel</button>
      </div>
    </div>
  )
}

// ─── Main Timeline ─────────────────────────────────────────────────────────────
export function EventTimeline({ events=[], loading=false, onAddEvent, onCreateLamb, onAddPhoto, onDelete, onUpdate, isMobile, animal, allAnimals=[] }) {
  const [showForm, setShowForm] = useState(false)
  // Debug: log raw event_date values so we can see what Supabase returns

  const groups = groupByMonth(events)

  const handleSave = async (form) => {
    const { lambsToCreate = [], ...eventPayload } = form
    await onAddEvent(eventPayload)
    if (animal?.species === 'sheep' && eventPayload.event_type === 'lambing' && lambsToCreate.length > 0) {
      if (!onCreateLamb) throw new Error('Could not create lamb records from this birth.')
      for (let i = 0; i < lambsToCreate.length; i += 1) {
        const lamb = lambsToCreate[i]
        await onCreateLamb({
          name: lamb.name,
          species: 'sheep',
          sex: 'lamb',
          birth_date: eventPayload.event_date || null,
          status: 'alive',
          sire_id: lamb.sire_id || null,
          dam_id: animal.id,
          tag_number: `AUTO-${Date.now()}-${i}`,
          breed: animal.breed || null,
          notes: `Created from birth event for ${animal.name}.`,
        })
      }
    }
    setShowForm(false)
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', marginBottom:16 }}>
        <div>
          <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:16, margin:'0 0 1px' }}>
            Health Timeline
          </p>
          <p style={{ fontSize:12, color:'#a08060', margin:0 }}>
            {events.length} event{events.length!==1?'s':''} recorded
          </p>
        </div>
        <button onClick={()=>setShowForm(v=>!v)}
          style={{ ...S.btn, ...S.btnPrimary, marginLeft:'auto',
            padding:isMobile?'8px 14px':'9px 18px', fontSize:isMobile?12:13 }}>
          {showForm ? '✕ Cancel' : '+ Log Event'}
        </button>
      </div>

      {/* Log form */}
      {showForm && (
        <LogEventForm
          onSave={handleSave}
          onCancel={()=>setShowForm(false)}
          isMobile={isMobile}
          animal={animal}
          allAnimals={allAnimals}
        />
      )}

      {/* Empty state */}
      {!loading && events.length===0 && !showForm && (
        <div style={{ textAlign:'center', padding:'40px 0' }}>
          <div style={{ fontSize:44, marginBottom:12 }}>📋</div>
          <p style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, margin:'0 0 6px' }}>
            No events yet
          </p>
          <p style={{ fontSize:13, color:'#a08060', margin:'0 0 16px' }}>
            Start the health timeline by logging the first event.
          </p>
          <button onClick={()=>setShowForm(true)} style={{ ...S.btn, ...S.btnPrimary, padding:'10px 20px' }}>
            + Log First Event
          </button>
        </div>
      )}

      {/* Timeline groups */}
      {groups.map((group, gi) => (
        <div key={group.key} style={{ marginBottom:8 }}>
          {/* Month header */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12,
            position:'sticky', top:0, background:'#f7f4ef', zIndex:10, padding:'6px 0' }}>
            <span style={{ fontSize:11, fontWeight:700, color:'#a08060', textTransform:'uppercase',
              letterSpacing:'0.08em', whiteSpace:'nowrap' }}>{group.label}</span>
            <div style={{ flex:1, height:1, background:'#e8e0d0' }}/>
            <span style={{ fontSize:11, color:'#c8b89a' }}>{group.events.length}</span>
          </div>

          {/* Events in group */}
          <div style={{ position:'relative' }}>
            {/* Vertical timeline line */}
            <div style={{ position:'absolute', left:isMobile?66:78, top:0, bottom:0,
              width:2, background:'linear-gradient(to bottom, #e8e0d0, #f7f4ef)',
              borderRadius:1, zIndex:0 }}/>

            {group.events.map((ev, idx) => (
              <EventCard
                key={ev.id}
                event={ev}
                onAddPhoto={onAddPhoto}
                onDelete={onDelete}
                onUpdate={onUpdate}
                isMobile={isMobile}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
