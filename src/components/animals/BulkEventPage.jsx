import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getEmulated, useAnimals } from '../../hooks/useAnimals'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { addBatchId, createEventBatchId, isBatchSchemaUnavailable, removeBatchId } from '../../lib/eventBatches'
import { S, getEventTypes, getEventMeta, statusFromEventType, speciesBasePath, BREEDING_RESTRICTION_REASONS, breedingRestrictionPayload } from '../ui/shared'

const SPECIES_META = {
  sheep:    { emoji:'🐑', singular:'Sheep',   plural:'Sheep',    label:'Flock' },
  chickens: { emoji:'🐔', singular:'Chicken', plural:'Chickens', label:'Chickens' },
  horses:   { emoji:'🐴', singular:'Horse',   plural:'Horses',   label:'Horses' },
}

export function BulkEventPage({ species = 'sheep' }) {
  const navigate    = useNavigate()
  const [params]    = useSearchParams()
  const ids         = (params.get('ids') || '').split(',').filter(Boolean)
  const meta        = SPECIES_META[species] || SPECIES_META.sheep
  const eventTypes  = getEventTypes(species)

  const { animals, updateAnimal }  = useAnimals(species)
  const { user }     = useAuth()

  const selectedAnimals = animals.filter(a => ids.includes(a.id))

  const today = new Date().toISOString().split('T')[0]
  const [eventType, setEventType] = useState('')
  const [eventDate, setEventDate] = useState(today)
  const [notes,     setNotes]     = useState('')
  const [breedingReason, setBreedingReason] = useState('')
  const [saving,    setSaving]    = useState(false)
  const [done,      setDone]      = useState(false)
  const [formError, setFormError] = useState('')

  const backPath = speciesBasePath(species)
  const emulated = getEmulated()
  const effectiveUid = emulated ? emulated.uid : user?.id
  const canWrite = !emulated || emulated.writeMode

  const handleSave = async () => {
    if (ids.length === 0) { setFormError(`Select at least one ${meta.singular.toLowerCase()} before logging an event.`); return }
    if (!eventType) { setFormError('Please select an event type.'); return }
    if (eventType === 'do_not_breed' && !breedingReason) { setFormError('Please select a reason for the Do Not Breed flag.'); return }
    if (!eventDate) { setFormError('Please select a date.'); return }
    if (!effectiveUid) { setFormError('Not logged in.'); return }
    if (!canWrite) { setFormError('Read-only mode - switch to write mode to make changes.'); return }
    setSaving(true)
    setFormError('')
    try {
      const baseRows = ids.map(animal_id => ({
        animal_id,
        event_type: eventType,
        event_date: eventDate,
        notes: eventType === 'do_not_breed'
          ? [`Reason: ${breedingReason}`, notes.trim()].filter(Boolean).join('\n')
          : notes || null,
        user_id: effectiveUid,
      }))
      const rows = addBatchId(baseRows, createEventBatchId(baseRows.length))
      if (emulated) {
        const batchResult = await supabase.rpc('add_event_batch_admin', {
          target_user_id: effectiveUid,
          payload: rows,
        })
        if (batchResult.error && !isBatchSchemaUnavailable(batchResult.error)) throw batchResult.error
        if (batchResult.error) {
          for (const row of removeBatchId(rows)) {
            const { error } = await supabase.rpc('add_event_admin', {
              target_user_id: effectiveUid,
              payload: row,
            })
            if (error) throw error
          }
        }
      } else {
        const { error } = await supabase.from('fh_animal_events').insert(rows)
        if (error && !isBatchSchemaUnavailable(error)) throw error
        if (error) {
          const fallback = await supabase.from('fh_animal_events').insert(removeBatchId(rows))
          if (fallback.error) throw fallback.error
        }
      }
      const nextStatus = statusFromEventType(eventType)
      if (nextStatus) {
        await Promise.all(ids.map(animalId => updateAnimal(animalId, { status: nextStatus })))
      }
      if (eventType === 'do_not_breed') {
        const restriction = breedingRestrictionPayload(breedingReason, eventDate)
        const updates = await Promise.allSettled(ids.map(animalId => updateAnimal(animalId, restriction)))
        updates.filter(result => result.status === 'rejected')
          .forEach(result => console.warn('Breeding warning field update fell back to event history:', result.reason))
      }
      setDone(true)
      setTimeout(() => navigate(backPath), 1200)
    } catch (err) {
      setFormError('Failed to save events: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (done) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: '#2c2416' }}>
            Event logged for {ids.length} {ids.length === 1 ? meta.singular.toLowerCase() : meta.plural.toLowerCase()}!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 16px 40px' }}>
      {/* Dark hero header */}
      <div style={{ background: 'linear-gradient(160deg,#2c2416 0%,#4a3520 60%,#6b4f2e 100%)', margin: '0 -16px 28px', padding: '24px 24px 28px' }}>
        <button onClick={() => navigate(backPath)}
          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#f0e6cc', borderRadius: 7, padding: '7px 14px', cursor: 'pointer', fontSize: 13, marginBottom: 16, fontFamily: "'Lato',sans-serif", fontWeight: 600 }}>
          ← {meta.label}
        </button>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: '#f0e6cc', margin: '0 0 4px' }}>
          Log Bulk Event
        </h1>
        <p style={{ fontSize: 13, color: '#a08060', margin: 0 }}>
          One event logged for all {ids.length} selected {ids.length === 1 ? meta.singular.toLowerCase() : meta.plural.toLowerCase()}
        </p>
      </div>

      {formError && (
        <div style={{ background:'#fff3f3', border:'1px solid #f5c6c6', color:'#c62828',
          borderRadius:10, padding:'11px 14px', fontSize:13, fontWeight:600, marginBottom:16 }}>
          {formError}
        </div>
      )}

      {/* Selected animals */}
      {selectedAnimals.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e8e0d0', borderRadius: 12, padding: '18px 20px', marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#a08060', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 10px' }}>
            Selected {meta.plural}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {selectedAnimals.map(a => (
              <span key={a.id} style={{ background: '#f0e8d8', color: '#5a3e1b', borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 600 }}>
                {a.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Event type grid */}
      <div style={{ background: '#fff', border: '1px solid #e8e0d0', borderRadius: 12, padding: '20px 20px', marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#a08060', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 14px' }}>
          Event Type *
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
          {eventTypes.map(et => {
            const eventMeta = getEventMeta(et.value, et.label)
            const selected = eventType === et.value
            return (
              <button key={et.value} onClick={() => setEventType(et.value)}
                style={{ padding: '9px 11px', fontSize: 13, textAlign: 'left', borderRadius: 9, cursor: 'pointer',
                  background: selected ? '#5a3e1b' : '#f7f4ef',
                  color:      selected ? '#fff' : '#5a3e1b',
                  border:     selected ? '1px solid #5a3e1b' : '1px solid #e8ddd0',
                  fontWeight: selected ? 700 : 600,
                  fontFamily: "'Lato',sans-serif", display:'flex', alignItems:'center', gap:9, minHeight:44 }}>
                <span style={{ width:26, height:26, borderRadius:7, display:'inline-flex',
                  alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:15,
                  background:selected?'rgba(255,255,255,0.14)':eventMeta.bg,
                  border:selected?'1px solid rgba(255,255,255,0.18)':`1px solid ${eventMeta.border}`,
                  color:selected?'#fff':eventMeta.color }}>
                  {eventMeta.icon}
                </span>
                <span style={{ lineHeight:1.2 }}>{eventMeta.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {eventType === 'do_not_breed' && (
        <div style={{ background:'#fff', border:'1px solid #ef9a9a', borderRadius:12,
          padding:'18px 20px', marginBottom:20 }}>
          <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#a51d1d',
            textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>
            Reason *
          </label>
          <select value={breedingReason} onChange={e=>setBreedingReason(e.target.value)}
            style={{ width:'100%', padding:'10px 12px', border:'1px solid #d96b6b',
              borderRadius:8, fontSize:14, fontFamily:"'Lato',sans-serif", boxSizing:'border-box' }}>
            <option value="">Select a reason</option>
            {BREEDING_RESTRICTION_REASONS.map(reason => (
              <option key={reason} value={reason}>{reason}</option>
            ))}
          </select>
        </div>
      )}

      {/* Date + Notes */}
      <div style={{ background: '#fff', border: '1px solid #e8e0d0', borderRadius: 12, padding: '20px 20px', marginBottom: 24 }}>
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#a08060', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
            Date *
          </label>
          <input type="date"
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0c4b0', borderRadius: 8, fontSize: 14, fontFamily: "'Lato',sans-serif", boxSizing: 'border-box' }}
            value={eventDate} onChange={e => setEventDate(e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#a08060', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
            Notes (optional)
          </label>
          <textarea
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0c4b0', borderRadius: 8, fontSize: 14, fontFamily: "'Lato',sans-serif", height: 80, resize: 'vertical', boxSizing: 'border-box' }}
            placeholder="e.g. CDT booster, 1ml per animal…"
            value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
        <button onClick={handleSave}
          disabled={saving || !eventType || ids.length === 0 || (eventType === 'do_not_breed' && !breedingReason)}
          style={{ flex:'1 1 220px',
            background:saving || !eventType || ids.length === 0 || (eventType === 'do_not_breed' && !breedingReason) ? '#c8b89a' : '#c8a060',
            color:'#2c2416', border:'none', borderRadius:8, padding:'12px 20px', fontSize:15,
            fontWeight:700, cursor:saving || !eventType || ids.length === 0 || (eventType === 'do_not_breed' && !breedingReason) ? 'default' : 'pointer',
            fontFamily:"'Lato',sans-serif" }}>
          {saving ? 'Saving…' : `Save for ${ids.length} ${ids.length === 1 ? meta.singular : meta.plural}`}
        </button>
        <button onClick={() => navigate(backPath)}
          style={{ background: '#fff', color: '#5a3e1b', border: '1px solid #c8b89a', borderRadius: 8, padding: '12px 20px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: "'Lato',sans-serif" }}>
          Cancel
        </button>
      </div>
    </div>
  )
}
