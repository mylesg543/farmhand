import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAnimals } from '../../hooks/useAnimals'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { S, getEventTypes, speciesBasePath } from '../ui/shared'

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

  const { animals }  = useAnimals(species)
  const { user }     = useAuth()

  const selectedAnimals = animals.filter(a => ids.includes(a.id))

  const today = new Date().toISOString().split('T')[0]
  const [eventType, setEventType] = useState('')
  const [eventDate, setEventDate] = useState(today)
  const [notes,     setNotes]     = useState('')
  const [saving,    setSaving]    = useState(false)
  const [done,      setDone]      = useState(false)

  const backPath = speciesBasePath(species)

  const handleSave = async () => {
    if (!eventType) { alert('Please select an event type.'); return }
    if (!eventDate) { alert('Please select a date.'); return }
    if (!user) { alert('Not logged in.'); return }
    setSaving(true)
    try {
      const rows = ids.map(animal_id => ({
        animal_id,
        event_type: eventType,
        event_date: eventDate,
        notes: notes || null,
        user_id: user.id,
      }))
      const { error } = await supabase.from('fh_animal_events').insert(rows)
      if (error) throw error
      setDone(true)
      setTimeout(() => navigate(backPath), 1200)
    } catch (err) {
      alert('Failed to save events: ' + err.message)
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
          {eventTypes.map(et => (
            <button key={et.value} onClick={() => setEventType(et.value)}
              style={{ padding: '8px 12px', fontSize: 13, textAlign: 'left', borderRadius: 8, cursor: 'pointer',
                background: eventType === et.value ? '#5a3e1b' : '#f7f4ef',
                color:      eventType === et.value ? '#fff' : '#5a3e1b',
                border:     eventType === et.value ? 'none' : '1px solid #e8ddd0',
                fontWeight: eventType === et.value ? 700 : 500,
                fontFamily: "'Lato',sans-serif" }}>
              {et.label}
            </button>
          ))}
        </div>
      </div>

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
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={handleSave} disabled={saving || !eventType}
          style={{ flex: 1, background: saving || !eventType ? '#c8b89a' : '#c8a060', color: '#2c2416', border: 'none', borderRadius: 8, padding: '12px 20px', fontSize: 15, fontWeight: 700, cursor: saving || !eventType ? 'default' : 'pointer', fontFamily: "'Lato',sans-serif" }}>
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
