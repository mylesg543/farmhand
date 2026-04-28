import { useState } from 'react'
import { useAnimalEvents } from '../../hooks/useAnimalEvents'
import { EVENT_TYPES, EVENT_COLORS, S, Badge, Spinner, ErrorMsg, formatDate } from '../ui/shared'

function EventForm({ animalId, animalName, onDone }) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({ event_type: 'vaccination', event_date: today, notes: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const { addEvent } = useAnimalEvents(animalId)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    setSaving(true); setError(null)
    try { await addEvent(form); onDone() }
    catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  return (
    <div style={{ ...S.card, padding: 22, marginTop: 20, border: '1px dashed #c8b89a', background: '#fdfaf6' }}>
      <span style={{ ...S.sectionLabel }}>New Event for {animalName}</span>
      {error && <p style={{ color: '#c62828', fontSize: 13, marginBottom: 10 }}>{error}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div>
          <label style={S.label}>Event Type</label>
          <select style={{ ...S.input, cursor: 'pointer' }} value={form.event_type} onChange={e => set('event_type', e.target.value)}>
            {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label style={S.label}>Date</label>
          <input type="date" style={S.input} value={form.event_date} onChange={e => set('event_date', e.target.value)} />
        </div>
      </div>
      {form.event_type === 'death' && (
        <div style={{ background: '#fff3f3', border: '1px solid #f5c6c6', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#c62828' }}>
          ⚠️ Adding a Death event will automatically update this animal's status to <strong>Deceased</strong>.
        </div>
      )}
      <div style={{ marginBottom: 14 }}>
        <label style={S.label}>Notes</label>
        <textarea style={{ ...S.input, minHeight: 72, resize: 'vertical' }} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Details..." />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button style={{ ...S.btn, ...S.btnPrimary, opacity: saving ? 0.7 : 1 }} onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Event'}</button>
        <button style={{ ...S.btn, ...S.btnSecondary }} onClick={onDone}>Cancel</button>
      </div>
    </div>
  )
}

export function EventList({ animalId, animalName, onStatusChange }) {
  const { events, loading, error, deleteEvent } = useAnimalEvents(animalId)
  const [showForm, setShowForm] = useState(false)

  const handleDone = () => setShowForm(false)
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return
    try { await deleteEvent(id) } catch (err) { alert(err.message) }
  }

  return (
    <div style={{ ...S.card, padding: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        <span style={{ ...S.sectionLabel, margin: 0 }}>
          Event History {!loading && <span style={{ fontWeight: 400, opacity: 0.7 }}>({events.length})</span>}
        </span>
        <button style={{ ...S.btn, ...S.btnPrimary, marginLeft: 'auto', padding: '7px 16px', fontSize: 13 }} onClick={() => setShowForm(v => !v)}>
          {showForm ? '✕ Cancel' : '+ Add Event'}
        </button>
      </div>
      {showForm && <EventForm animalId={animalId} animalName={animalName} onDone={handleDone} />}
      {loading ? <Spinner /> : error ? <ErrorMsg message={error} /> :
        events.length === 0 && !showForm ? (
          <p style={{ color: '#a08060', fontSize: 14, textAlign: 'center', padding: '32px 0' }}>No events yet. Add the first one!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: showForm ? 16 : 0 }}>
            {events.map(ev => {
              const ec = EVENT_COLORS[ev.event_type] || EVENT_COLORS.custom
              const label = EVENT_TYPES.find(t => t.value === ev.event_type)?.label || ev.event_type
              return (
                <div key={ev.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 16px', borderRadius: 10, background: ec.bg, border: `1px solid ${ec.border}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <Badge bg={ec.border} color={ec.text}>{label}</Badge>
                      <span style={{ fontSize: 13, color: '#7a6648' }}>{formatDate(ev.event_date)}</span>
                    </div>
                    {ev.notes && <p style={{ fontSize: 13, margin: 0, color: '#4a3c28', lineHeight: 1.6 }}>{ev.notes}</p>}
                  </div>
                  <button onClick={() => handleDelete(ev.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c0a080', fontSize: 20, padding: '0 2px', lineHeight: 1 }}>×</button>
                </div>
              )
            })}
          </div>
        )
      }
    </div>
  )
}
