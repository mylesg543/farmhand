import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAnimals } from '../../hooks/useAnimals'
import { useIsMobile } from '../../hooks/useIsMobile'
import { supabase } from '../../lib/supabase'
import { S, Badge, Spinner, ErrorMsg, Checkbox, AnimalIllustration, STATUS_STYLES, STATUS_DOT, SEX_LABELS, calcAge, ANIMAL_META, getEventTypes } from '../ui/shared'

function BulkEventModal({ selectedIds, allAnimals, species, onSave, onClose }) {
  const today = new Date().toISOString().split('T')[0]
  const eventTypes = getEventTypes(species)
  const [form, setForm] = useState({ event_type: eventTypes[0].value, event_date: today, notes: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const names = selectedIds.map(id => allAnimals.find(a => a.id === id)?.name).filter(Boolean)
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(44,36,22,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 500 }}>
      <div style={{ background: '#fff', borderRadius: '16px 16px 0 0', padding: 24, width: '100%', maxWidth: 520, boxShadow: '0 -4px 40px rgba(44,36,22,0.2)' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Bulk Add Event</h2>
        <p style={{ fontSize: 13, color: '#a08060', marginBottom: 18 }}>Adding to: <strong style={{ color: '#5a3e1b' }}>{names.join(', ')}</strong></p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={S.label}>Event Type</label>
            <select style={{ ...S.input, cursor: 'pointer' }} value={form.event_type} onChange={e => set('event_type', e.target.value)}>
              {eventTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>Date</label>
            <input type="date" style={S.input} value={form.event_date} onChange={e => set('event_date', e.target.value)} />
          </div>
        </div>
        {form.event_type === 'death' && <div style={{ background: '#fff3f3', border: '1px solid #f5c6c6', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#c62828' }}>This will update all selected animals to Deceased.</div>}
        {form.event_type === 'sale'  && <div style={{ background: '#f3e5f5', border: '1px solid #ce93d8', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#6a1b9a' }}>This will update all selected animals to Sold.</div>}
        <div style={{ marginBottom: 16 }}>
          <label style={S.label}>Notes</label>
          <textarea style={{ ...S.input, minHeight: 64, resize: 'vertical' }} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Details..." />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => onSave(form)} style={{ ...S.btn, ...S.btnPrimary, flex: 1, justifyContent: 'center', padding: '12px' }}>Save Event</button>
          <button onClick={onClose} style={{ ...S.btn, ...S.btnSecondary, padding: '12px 20px' }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

function BulkStatusModal({ selectedIds, allAnimals, onSave, onClose }) {
  const [status, setStatus] = useState('sold')
  const names = selectedIds.map(id => allAnimals.find(a => a.id === id)?.name).filter(Boolean)
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(44,36,22,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 500 }}>
      <div style={{ background: '#fff', borderRadius: '16px 16px 0 0', padding: 24, width: '100%', maxWidth: 520, boxShadow: '0 -4px 40px rgba(44,36,22,0.2)' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Update Status</h2>
        <p style={{ fontSize: 13, color: '#a08060', marginBottom: 18 }}>Updating: <strong style={{ color: '#5a3e1b' }}>{names.join(', ')}</strong></p>
        <div style={{ marginBottom: 20 }}>
          <label style={S.label}>New Status</label>
          <select style={{ ...S.input, cursor: 'pointer' }} value={status} onChange={e => setStatus(e.target.value)}>
            <option value="alive">Alive</option>
            <option value="sold">Sold</option>
            <option value="deceased">Deceased</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => onSave(status)} style={{ ...S.btn, ...S.btnPrimary, flex: 1, justifyContent: 'center', padding: '12px' }}>Update</button>
          <button onClick={onClose} style={{ ...S.btn, ...S.btnSecondary, padding: '12px 20px' }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

export function AnimalListPage({ species = 'sheep' }) {
  const { animals, loading, error, updateAnimal } = useAnimals(species)
  const isMobile = useIsMobile()
  const [filter,         setFilter]         = useState('all')
  const [search,         setSearch]         = useState('')
  const [selectMode,     setSelectMode]     = useState(false)
  const [selected,       setSelected]       = useState([])
  const [showBulkEvent,  setShowBulkEvent]  = useState(false)
  const [showBulkStatus, setShowBulkStatus] = useState(false)
  const navigate = useNavigate()
  const meta = ANIMAL_META[species] || ANIMAL_META.sheep

  const counts = { all: animals.length, alive: 0, sold: 0, deceased: 0 }
  animals.forEach(a => { if (counts[a.status] !== undefined) counts[a.status]++ })

  const filtered = animals.filter(a => {
    const ms = filter === 'all' || a.status === filter
    const q  = search.toLowerCase()
    return ms && (!q || a.name.toLowerCase().includes(q) || (a.tag_number || '').toLowerCase().includes(q))
  })

  const allSelected = filtered.length > 0 && selected.length === filtered.length
  const toggleOne   = id => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  const toggleAll   = () => allSelected ? setSelected([]) : setSelected(filtered.map(a => a.id))
  const exitSelect  = () => { setSelectMode(false); setSelected([]) }

  const handleBulkEvent = async (form) => {
    try {
      const rows = selected.map(animal_id => ({
        animal_id, event_type: form.event_type, event_date: form.event_date, notes: form.notes || null,
      }))
      const { error } = await supabase.from('fh_animal_events').insert(rows)
      if (error) throw error
      if (form.event_type === 'death') await Promise.all(selected.map(id => updateAnimal(id, { status: 'deceased' })))
      if (form.event_type === 'sale')  await Promise.all(selected.map(id => updateAnimal(id, { status: 'sold' })))
    } catch (err) { alert('Failed to save events: ' + err.message) }
    setShowBulkEvent(false); exitSelect()
  }

  const handleBulkStatus = async (status) => {
    await Promise.all(selected.map(id => updateAnimal(id, { status })))
    setShowBulkStatus(false); exitSelect()
  }

  const newPath  = species === 'chickens' ? '/chickens/new'  : '/animals/new'
  const bulkPath = species === 'chickens' ? '/chickens/bulk' : '/animals/bulk'

  return (
    <>
      {/* ── Hero ── */}
      <div style={{ background: 'linear-gradient(160deg,#2c2416 0%,#4a3520 40%,#6b4f2e 100%)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '16px 14px 0' : '28px 24px 0' }}>

          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: isMobile ? 14 : 20 }}>
            <div>
              <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 24 : 34, fontWeight: 700, color: '#f0e6cc', margin: '0 0 3px' }}>
                {meta.emoji} {meta.label}
              </h1>
              <p style={{ fontSize: 12, color: '#a08060', margin: 0 }}>
                {counts.alive} alive · {counts.sold} sold · {counts.deceased} deceased
              </p>
            </div>

            {/* Buttons */}
            {!selectMode ? (
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {!isMobile && (
                  <button onClick={() => navigate(bulkPath)}
                    style={{ ...S.btn, background: 'rgba(255,255,255,0.1)', color: '#f0e6cc', border: '1px solid rgba(255,255,255,0.2)', padding: '7px 14px', fontSize: 13 }}>
                    ☰ Bulk
                  </button>
                )}
                <button onClick={() => navigate(newPath)}
                  style={{ ...S.btn, background: '#c8a060', color: '#2c2416', fontWeight: 700, padding: isMobile ? '9px 14px' : '9px 20px', fontSize: isMobile ? 13 : 14 }}>
                  + {isMobile ? 'Add' : `Add ${meta.singular}`}
                </button>
              </div>
            ) : (
              <button onClick={exitSelect}
                style={{ ...S.btn, background: 'rgba(255,255,255,0.1)', color: '#ef9a9a', border: '1px solid rgba(255,80,80,0.3)', padding: '7px 14px', fontSize: 13 }}>
                ✕ Cancel
              </button>
            )}
          </div>

          {/* Avatar strip — only on desktop */}
          {!isMobile && (
            <div style={{ display: 'flex', gap: 14, paddingBottom: 20, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              {animals.map(a => {
                const isSel = selected.includes(a.id)
                return (
                  <div key={a.id} onClick={() => selectMode ? toggleOne(a.id) : navigate(`/animals/${a.id}`)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer', flexShrink: 0 }}>
                    <div style={{ width: 60, height: 60, borderRadius: '50%', border: `3px solid ${isSel ? '#f0c060' : 'rgba(255,255,255,0.15)'}`, overflow: 'hidden', background: '#3a2a16', position: 'relative' }}>
                      <AnimalIllustration animal={a} size={60} />
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_DOT[a.status] || '#9e9e9e', position: 'absolute', bottom: 2, right: 2, border: '2px solid #2c2416' }} />
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#c8a878', textTransform: 'uppercase', whiteSpace: 'nowrap', maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '12px 12px' : '24px 24px' }}>

        {/* Bulk select bar */}
        {selectMode && (
          <div style={{ background: '#2c2416', borderRadius: 10, padding: isMobile ? '10px 14px' : '12px 20px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', gap: 10 }}>
            <div onClick={toggleAll} style={{ cursor: 'pointer' }}><Checkbox checked={allSelected} /></div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#f0e6cc', flex: 1 }}>
              {selected.length === 0 ? 'Tap animals to select' : `${selected.length} selected`}
            </span>
            {selected.length > 0 && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowBulkEvent(true)}
                  style={{ ...S.btn, background: 'rgba(255,255,255,0.12)', color: '#f0e6cc', border: '1px solid rgba(255,255,255,0.2)', padding: '7px 12px', fontSize: 12 }}>
                  + Event
                </button>
                <button onClick={() => setShowBulkStatus(true)}
                  style={{ ...S.btn, background: 'rgba(255,255,255,0.12)', color: '#f0e6cc', border: '1px solid rgba(255,255,255,0.2)', padding: '7px 12px', fontSize: 12 }}>
                  Status
                </button>
              </div>
            )}
          </div>
        )}

        {/* Filter row */}
        <div style={{ marginBottom: 14 }}>
          {/* Status filters */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
            {['all','alive','sold','deceased'].map(k => (
              <button key={k} onClick={() => setFilter(k)}
                style={{ ...S.btn, padding: isMobile ? '5px 10px' : '6px 14px', fontSize: isMobile ? 12 : 13,
                  background: filter === k ? '#5a3e1b' : '#fff',
                  color: filter === k ? '#fff' : '#7a6648',
                  border: '1px solid #d0c4b0' }}>
                {k[0].toUpperCase() + k.slice(1)} {counts[k]}
              </button>
            ))}
            {!selectMode && (
              <button onClick={() => setSelectMode(true)}
                style={{ ...S.btn, background: '#fff', color: '#5a3e1b', border: '1px solid #c8b89a', padding: isMobile ? '5px 10px' : '6px 14px', fontSize: isMobile ? 12 : 13, marginLeft: 'auto' }}>
                ☑ Select
              </button>
            )}
            {isMobile && (
              <button onClick={() => navigate(bulkPath)}
                style={{ ...S.btn, background: '#fff', color: '#5a3e1b', border: '1px solid #c8b89a', padding: '5px 10px', fontSize: 12 }}>
                ☰ Bulk Add
              </button>
            )}
          </div>
          {/* Search */}
          <input style={{ ...S.input }} placeholder={`Search ${meta.label.toLowerCase()}…`} value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Animal list */}
        {loading ? <Spinner /> : error ? <ErrorMsg message={error} /> :
          filtered.length === 0 ? (
            <div style={{ ...S.card, padding: 48, textAlign: 'center' }}>
              <p style={{ color: '#a08060', marginBottom: 16 }}>No animals found.</p>
              <button onClick={() => navigate(newPath)} style={{ ...S.btn, ...S.btnPrimary }}>+ Add {meta.singular}</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 8 : 0 }}>
              {!isMobile && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: 14 }}>
                  {filtered.map(a => {
                    const st   = STATUS_STYLES[a.status] || STATUS_STYLES.alive
                    const isSel = selected.includes(a.id)
                    return (
                      <div key={a.id} onClick={() => selectMode ? toggleOne(a.id) : navigate(`/animals/${a.id}`)}
                        style={{ ...S.card, padding: 18, cursor: 'pointer', display: 'flex', gap: 14, alignItems: 'center',
                          border: isSel ? '2px solid #5a3e1b' : '1px solid #e8e0d0', position: 'relative',
                          transition: 'transform 0.12s, box-shadow 0.12s' }}
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
                          {a.tag_number && !a.tag_number.startsWith('AUTO-') && (
                            <p style={{ fontSize: 11, color: '#a08060', margin: '0 0 5px', fontFamily: 'monospace' }}>{a.tag_number}</p>
                          )}
                          <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                            <Badge bg="#f0e8d8" color="#7a5c2e">{SEX_LABELS[a.sex] || a.sex}</Badge>
                            {a.birth_date && <span style={{ fontSize: 11, color: '#a08060' }}>{calcAge(a.birth_date)}</span>}
                          </div>
                        </div>
                        <span style={{ color: '#c8b89a', fontSize: 20 }}>›</span>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Mobile: full-width list rows */}
              {isMobile && filtered.map(a => {
                const st    = STATUS_STYLES[a.status] || STATUS_STYLES.alive
                const isSel = selected.includes(a.id)
                return (
                  <div key={a.id} onClick={() => selectMode ? toggleOne(a.id) : navigate(`/animals/${a.id}`)}
                    style={{ ...S.card, padding: '12px 14px', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center',
                      border: isSel ? '2px solid #5a3e1b' : '1px solid #e8e0d0' }}>
                    {selectMode && <Checkbox checked={isSel} />}
                    <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#f0ebe4', border: '2px solid #e8e0d0' }}>
                      <AnimalIllustration animal={a} size={44} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                        <p style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 15, margin: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</p>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: st.bg, color: st.text, textTransform: 'uppercase', flexShrink: 0 }}>{a.status}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: '#a08060' }}>{SEX_LABELS[a.sex] || a.sex}</span>
                        {a.birth_date && <span style={{ fontSize: 11, color: '#a08060' }}>{calcAge(a.birth_date)}</span>}
                        {a.breed && <span style={{ fontSize: 11, color: '#a08060', fontStyle: 'italic' }}>{a.breed}</span>}
                      </div>
                    </div>
                    <span style={{ color: '#c8b89a', fontSize: 18, flexShrink: 0 }}>›</span>
                  </div>
                )
              })}
            </div>
          )
        }
      </div>

      {showBulkEvent  && <BulkEventModal  selectedIds={selected} allAnimals={animals} species={species} onSave={handleBulkEvent}  onClose={() => setShowBulkEvent(false)}  />}
      {showBulkStatus && <BulkStatusModal selectedIds={selected} allAnimals={animals}                   onSave={handleBulkStatus} onClose={() => setShowBulkStatus(false)} />}
    </>
  )
}
