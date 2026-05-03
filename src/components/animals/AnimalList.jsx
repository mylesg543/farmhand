import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAnimals } from '../../hooks/useAnimals'
import { useFeedCosts } from '../../hooks/useFeedCosts'
import { S, Badge, Spinner, ErrorMsg, Checkbox, AnimalIllustration, STATUS_STYLES, STATUS_DOT, SEX_LABELS, calcAge, ANIMAL_META } from '../ui/shared'

function BulkEventModal({ selectedIds, allAnimals, onSave, onClose }) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({ event_type: 'vaccination', event_date: today, notes: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const names = selectedIds.map(id => allAnimals.find(a => a.id === id)?.name).filter(Boolean)
  const EVENT_TYPES = ['hoof_trimming','vaccination','sickness','lambing','sale','death','custom']
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(44,36,22,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 32, width: 480, maxWidth: '95vw', boxShadow: '0 8px 40px rgba(44,36,22,0.2)' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Bulk Add Event</h2>
        <p style={{ fontSize: 13, color: '#a08060', marginBottom: 22 }}>Adding to {selectedIds.length} animals: <strong style={{ color: '#5a3e1b' }}>{names.join(', ')}</strong></p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={S.label}>Event Type</label>
            <select style={{ ...S.input, cursor: 'pointer' }} value={form.event_type} onChange={e => set('event_type', e.target.value)}>
              {EVENT_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>Date</label>
            <input type="date" style={S.input} value={form.event_date} onChange={e => set('event_date', e.target.value)} />
          </div>
        </div>
        {form.event_type === 'death' && <div style={{ background: '#fff3f3', border: '1px solid #f5c6c6', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#c62828' }}>⚠️ This will update all selected animals to <strong>Deceased</strong>.</div>}
        <div style={{ marginBottom: 20 }}>
          <label style={S.label}>Notes</label>
          <textarea style={{ ...S.input, minHeight: 70, resize: 'vertical' }} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Details..." />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => onSave(form)} style={{ ...S.btn, ...S.btnPrimary, padding: '10px 22px' }}>Add to {selectedIds.length} Animals</button>
          <button onClick={onClose} style={{ ...S.btn, ...S.btnSecondary }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

function BulkStatusModal({ selectedIds, allAnimals, onSave, onClose }) {
  const [status, setStatus] = useState('sold')
  const names = selectedIds.map(id => allAnimals.find(a => a.id === id)?.name).filter(Boolean)
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(44,36,22,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 32, width: 420, maxWidth: '95vw', boxShadow: '0 8px 40px rgba(44,36,22,0.2)' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Bulk Update Status</h2>
        <p style={{ fontSize: 13, color: '#a08060', marginBottom: 22 }}>Updating {selectedIds.length} animals: <strong style={{ color: '#5a3e1b' }}>{names.join(', ')}</strong></p>
        <div style={{ marginBottom: 22 }}>
          <label style={S.label}>New Status</label>
          <select style={{ ...S.input, cursor: 'pointer' }} value={status} onChange={e => setStatus(e.target.value)}>
            <option value="alive">Alive</option>
            <option value="sold">Sold</option>
            <option value="deceased">Deceased</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => onSave(status)} style={{ ...S.btn, ...S.btnPrimary, padding: '10px 22px' }}>Update {selectedIds.length} Animals</button>
          <button onClick={onClose} style={{ ...S.btn, ...S.btnSecondary }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

export function AnimalListPage({ species = 'sheep' }) {
  const { animals, loading, error, updateAnimal } = useAnimals(species)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState([])
  const [showBulkEvent, setShowBulkEvent] = useState(false)
  const [showBulkStatus, setShowBulkStatus] = useState(false)
  const navigate = useNavigate()
  const meta = ANIMAL_META[species] || ANIMAL_META.sheep

  const counts = { all: animals.length, alive: 0, sold: 0, deceased: 0 }
  animals.forEach(a => { if (counts[a.status] !== undefined) counts[a.status]++ })

  const filtered = animals.filter(a => {
    const ms = filter === 'all' || a.status === filter
    const q = search.toLowerCase()
    return ms && (!q || a.name.toLowerCase().includes(q) || a.tag_number.toLowerCase().includes(q))
  })

  const allSelected = filtered.length > 0 && selected.length === filtered.length
  const toggleOne = id => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  const toggleAll = () => allSelected ? setSelected([]) : setSelected(filtered.map(a => a.id))
  const exitSelect = () => { setSelectMode(false); setSelected([]) }

  const handleBulkEvent = async (form) => {
    // In production: insert events for all selected animals
    if (form.event_type === 'death') {
      await Promise.all(selected.map(id => updateAnimal(id, { status: 'deceased' })))
    }
    setShowBulkEvent(false); exitSelect()
  }

  const handleBulkStatus = async (status) => {
    await Promise.all(selected.map(id => updateAnimal(id, { status })))
    setShowBulkStatus(false); exitSelect()
  }

  return (
    <>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(160deg,#2c2416 0%,#4a3520 40%,#6b4f2e 100%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 0', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 36, fontWeight: 700, color: '#f0e6cc', margin: '0 0 4px' }}>{meta.emoji} {meta.label}</h1>
              <p style={{ fontSize: 13, color: '#a08060' }}>{counts.alive} alive · {counts.sold} sold · {counts.deceased} deceased</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {!selectMode
                ? <><button onClick={() => setSelectMode(true)} style={{ ...S.btn, background: 'rgba(255,255,255,0.1)', color: '#f0e6cc', border: '1px solid rgba(255,255,255,0.2)', padding: '7px 14px', fontSize: 13 }}>☑ Select</button>
                    <button onClick={() => navigate('/animals/new')} style={{ ...S.btn, background: '#c8a060', color: '#2c2416', fontWeight: 700, padding: '9px 20px' }}>+ Add {meta.singular}</button></>
                : <button onClick={exitSelect} style={{ ...S.btn, background: 'rgba(255,255,255,0.1)', color: '#ef9a9a', border: '1px solid rgba(255,80,80,0.3)', padding: '7px 14px', fontSize: 13 }}>✕ Cancel</button>}
            </div>
          </div>
          {/* Animal strip */}
          <div style={{ display: 'flex', gap: 14, paddingBottom: 24, overflowX: 'auto' }}>
            {animals.map(a => {
              const isSel = selected.includes(a.id)
              return (
                <div key={a.id} onClick={() => selectMode ? toggleOne(a.id) : navigate(`/animals/${a.id}`)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', flexShrink: 0 }}>
                  <div style={{ width: 68, height: 68, borderRadius: '50%', border: `3px solid ${isSel ? '#f0c060' : 'rgba(255,255,255,0.15)'}`, overflow: 'hidden', background: '#3a2a16', position: 'relative', boxShadow: isSel ? '0 0 0 3px rgba(240,192,96,0.25)' : 'none' }}>
                    <AnimalIllustration animal={a} size={68} />
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_DOT[a.status] || '#9e9e9e', position: 'absolute', bottom: 3, right: 3, border: '2px solid #2c2416' }} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#c8a878', letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{a.name}</span>
                  <span style={{ fontSize: 9, color: '#7a6040', fontFamily: 'monospace' }}>{a.tag_number}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div style={S.page}>
        {/* Bulk bar */}
        {selectMode && (
          <div style={{ background: '#2c2416', borderRadius: 12, padding: '12px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div onClick={toggleAll} style={{ cursor: 'pointer' }}><Checkbox checked={allSelected} /></div>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#f0e6cc' }}>{selected.length === 0 ? 'Click animals to select' : `${selected.length} selected`}</span>
            {selected.length > 0 && (
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
                <button onClick={() => setShowBulkEvent(true)} style={{ ...S.btn, background: 'rgba(255,255,255,0.12)', color: '#f0e6cc', border: '1px solid rgba(255,255,255,0.2)', padding: '7px 14px', fontSize: 13 }}>+ Add Event</button>
                <button onClick={() => setShowBulkStatus(true)} style={{ ...S.btn, background: 'rgba(255,255,255,0.12)', color: '#f0e6cc', border: '1px solid rgba(255,255,255,0.2)', padding: '7px 14px', fontSize: 13 }}>✎ Update Status</button>
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {['all','alive','sold','deceased'].map(k => (
              <button key={k} onClick={() => setFilter(k)} style={{ ...S.btn, padding: '6px 14px', fontSize: 13, background: filter === k ? '#5a3e1b' : '#fff', color: filter === k ? '#fff' : '#7a6648', border: '1px solid #d0c4b0' }}>
                {k[0].toUpperCase() + k.slice(1)} {counts[k]}
              </button>
            ))}
          </div>
          <input style={{ ...S.input, maxWidth: 220, marginLeft: 'auto' }} placeholder="Search name or tag…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Grid */}
        {loading ? <Spinner /> : error ? <ErrorMsg message={error} /> :
          filtered.length === 0 ? (
            <div style={{ ...S.card, padding: 60, textAlign: 'center' }}><p style={{ color: '#a08060' }}>No animals found. Add your first one!</p></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: 14 }}>
              {filtered.map(a => {
                const st = STATUS_STYLES[a.status] || STATUS_STYLES.alive
                const isSel = selected.includes(a.id)
                return (
                  <div key={a.id} onClick={() => selectMode ? toggleOne(a.id) : navigate(`/animals/${a.id}`)}
                    style={{ ...S.card, padding: 18, cursor: 'pointer', display: 'flex', gap: 14, alignItems: 'center', transition: 'transform 0.12s,box-shadow 0.12s', border: isSel ? '2px solid #5a3e1b' : '1px solid #e8e0d0', position: 'relative' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(44,36,22,0.12)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
                    {selectMode && <div style={{ position: 'absolute', top: 12, right: 12 }}><Checkbox checked={isSel} /></div>}
                    <div style={{ width: 54, height: 54, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#f0ebe4', border: '2px solid #e8e0d0' }}>
                      <AnimalIllustration animal={a} size={54} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <p style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 16, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</p>
                        <Badge bg={st.bg} color={st.text}>{a.status}</Badge>
                      </div>
                      <p style={{ fontSize: 11, color: '#a08060', margin: '0 0 5px', fontFamily: 'monospace' }}>{a.tag_number}</p>
                      <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                        <Badge bg="#f0e8d8" color="#7a5c2e">{SEX_LABELS[a.sex] || a.sex}</Badge>
                        {a.birth_date && <span style={{ fontSize: 11, color: '#a08060' }}>{calcAge(a.birth_date)}</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        }
      </div>

      {showBulkEvent && <BulkEventModal selectedIds={selected} allAnimals={animals} onSave={handleBulkEvent} onClose={() => setShowBulkEvent(false)} />}
      {showBulkStatus && <BulkStatusModal selectedIds={selected} allAnimals={animals} onSave={handleBulkStatus} onClose={() => setShowBulkStatus(false)} />}
    </>
  )
}
