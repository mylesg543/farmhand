import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAnimals } from '../../hooks/useAnimals'
import { useIsMobile } from '../../hooks/useIsMobile'
import { S, SEX_OPTIONS, speciesBasePath } from '../ui/shared'

const SPECIES_META = {
  sheep:    { emoji:'🐑', singular:'Sheep',   plural:'Sheep',    label:'Flock' },
  chickens: { emoji:'🐔', singular:'Chicken', plural:'Chickens', label:'Chickens' },
  horses:   { emoji:'🐴', singular:'Horse',   plural:'Horses',   label:'Horses' },
}

const emptyRow = () => ({ name:'', sex:'', birth_date:'', tag_number:'', breed:'' })

export function BulkAddPage({ species = 'sheep' }) {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const meta     = SPECIES_META[species] || SPECIES_META.sheep
  const { addAnimal } = useAnimals(species)

  const [rows,   setRows]   = useState([emptyRow(), emptyRow(), emptyRow()])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const backPath = speciesBasePath(species)
  const sexOpts  = SEX_OPTIONS[species] || SEX_OPTIONS.sheep

  const update = (i, field, value) => {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r))
    if (errors[`${i}_${field}`]) setErrors(prev => { const n = {...prev}; delete n[`${i}_${field}`]; return n })
  }

  const addRow = () => setRows(prev => [...prev, emptyRow()])
  const removeRow = (i) => setRows(prev => prev.filter((_, idx) => idx !== i))

  const validate = () => {
    const errs = {}
    rows.forEach((r, i) => {
      if (!r.name.trim()) errs[`${i}_name`] = true
    })
    return errs
  }

  const handleSave = async () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    const filledRows = rows.filter(r => r.name.trim())
    if (filledRows.length === 0) { alert('Add at least one animal name.'); return }

    setSaving(true)
    try {
      await Promise.all(
        filledRows.map(r =>
          addAnimal({
            name: r.name.trim(),
            species,
            sex: r.sex || null,
            birth_date: r.birth_date || null,
            tag_number: r.tag_number.trim() || null,
            breed: r.breed.trim() || null,
            status: 'alive',
          })
        )
      )
      navigate(backPath)
    } catch (err) {
      alert('Failed to save: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const filledCount = rows.filter(r => r.name.trim()).length

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px 48px' }}>
      {/* Dark hero header */}
      <div style={{ background: 'linear-gradient(160deg,#2c2416 0%,#4a3520 60%,#6b4f2e 100%)', margin: '0 -16px 28px', padding: '24px 24px 28px' }}>
        <button onClick={() => navigate(backPath)}
          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#f0e6cc', borderRadius: 7, padding: '7px 14px', cursor: 'pointer', fontSize: 13, marginBottom: 16, fontFamily: "'Lato',sans-serif", fontWeight: 600 }}>
          ← {meta.label}
        </button>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: '#f0e6cc', margin: '0 0 4px' }}>
          {meta.emoji} Bulk Add {meta.plural}
        </h1>
        <p style={{ fontSize: 13, color: '#a08060', margin: 0 }}>
          Fill in the names below — all other fields are optional
        </p>
      </div>

      {/* Spreadsheet table */}
      <div style={{ background: '#fff', border: '1px solid #e8e0d0', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
        {/* Header */}
        {!isMobile && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 130px 130px 130px 40px', background: '#f7f4ef', borderBottom: '2px solid #e8ddd0', padding: '10px 16px', gap: 8 }}>
            {['Name *', 'Sex', 'Birth Date', 'Tag / ID', 'Breed', ''].map(h => (
              <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#a08060', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
            ))}
          </div>
        )}

        {/* Rows */}
        {rows.map((row, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 130px 130px 130px 130px 40px', padding: isMobile ? '14px' : '8px 16px', gap: isMobile ? 10 : 8, borderBottom: '1px solid #f0ebe4', alignItems: 'center', background: isMobile ? '#fff' : 'transparent' }}>
            {isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#a08060', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
                  {meta.singular} {i + 1}
                </p>
                <button onClick={() => rows.length > 1 && removeRow(i)}
                  disabled={rows.length <= 1}
                  style={{ background: rows.length > 1 ? '#fff3f3' : '#f7f4ef', border: `1px solid ${rows.length > 1 ? '#f5c6c6' : '#e8e0d0'}`, color: rows.length > 1 ? '#c62828' : '#c8b89a', borderRadius: 8, cursor: rows.length > 1 ? 'pointer' : 'default', fontSize: 12, fontWeight: 700, padding: '7px 10px', fontFamily: "'Lato',sans-serif" }}>
                  Remove
                </button>
              </div>
            )}
            <input
              style={{ padding: isMobile ? '10px 12px' : '7px 10px', border: `1px solid ${errors[`${i}_name`] ? '#e53935' : '#d0c4b0'}`, borderRadius: 7, fontSize: isMobile ? 16 : 14, fontFamily: "'Lato',sans-serif", outline: 'none', width: '100%', boxSizing: 'border-box' }}
              placeholder={`${meta.singular} name`}
              value={row.name}
              onChange={e => update(i, 'name', e.target.value)}
            />
            <select
              style={{ padding: isMobile ? '10px 12px' : '7px 8px', border: '1px solid #d0c4b0', borderRadius: 7, fontSize: isMobile ? 16 : 13, fontFamily: "'Lato',sans-serif", background: '#fff', cursor: 'pointer', width: '100%', boxSizing: 'border-box' }}
              value={row.sex}
              onChange={e => update(i, 'sex', e.target.value)}
            >
              <option value="">—</option>
              {sexOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <input
              type="date"
              style={{ padding: isMobile ? '10px 12px' : '7px 8px', border: '1px solid #d0c4b0', borderRadius: 7, fontSize: isMobile ? 16 : 13, fontFamily: "'Lato',sans-serif", width: '100%', boxSizing: 'border-box' }}
              value={row.birth_date}
              onChange={e => update(i, 'birth_date', e.target.value)}
            />
            <input
              style={{ padding: isMobile ? '10px 12px' : '7px 8px', border: '1px solid #d0c4b0', borderRadius: 7, fontSize: isMobile ? 16 : 13, fontFamily: "'Lato',sans-serif", width: '100%', boxSizing: 'border-box' }}
              placeholder="optional"
              value={row.tag_number}
              onChange={e => update(i, 'tag_number', e.target.value)}
            />
            <input
              style={{ padding: isMobile ? '10px 12px' : '7px 8px', border: '1px solid #d0c4b0', borderRadius: 7, fontSize: isMobile ? 16 : 13, fontFamily: "'Lato',sans-serif", width: '100%', boxSizing: 'border-box' }}
              placeholder="optional"
              value={row.breed}
              onChange={e => update(i, 'breed', e.target.value)}
            />
            <button onClick={() => rows.length > 1 && removeRow(i)}
              style={{ display: isMobile ? 'none' : 'block', background: 'none', border: 'none', color: rows.length > 1 ? '#c62828' : '#d0c4b0', cursor: rows.length > 1 ? 'pointer' : 'default', fontSize: 18, lineHeight: 1, padding: 0 }}>
              ×
            </button>
          </div>
        ))}

        {/* Add row */}
        <div style={{ padding: '10px 16px' }}>
          <button onClick={addRow}
            style={{ background: 'none', border: 'none', color: '#5a3e1b', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: "'Lato',sans-serif", padding: 0 }}>
            + Add another row
          </button>
        </div>
      </div>

      {/* Save button */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={handleSave} disabled={saving || filledCount === 0}
          style={{ flex: 1, background: saving || filledCount === 0 ? '#c8b89a' : '#c8a060', color: '#2c2416', border: 'none', borderRadius: 8, padding: '12px 20px', fontSize: 15, fontWeight: 700, cursor: saving || filledCount === 0 ? 'default' : 'pointer', fontFamily: "'Lato',sans-serif" }}>
          {saving ? 'Saving…' : `Save ${filledCount} ${filledCount === 1 ? meta.singular : meta.plural}`}
        </button>
        <button onClick={() => navigate(backPath)}
          style={{ background: '#fff', color: '#5a3e1b', border: '1px solid #c8b89a', borderRadius: 8, padding: '12px 20px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: "'Lato',sans-serif" }}>
          Cancel
        </button>
      </div>
    </div>
  )
}
