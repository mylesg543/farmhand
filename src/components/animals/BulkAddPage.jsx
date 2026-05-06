import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAnimals } from '../../hooks/useAnimals'
import { S, ANIMAL_META, SEX_OPTIONS, CHICKEN_BREEDS } from '../ui/shared'

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36) }

function emptyRow(species) {
  const sexOptions = SEX_OPTIONS[species] || SEX_OPTIONS.sheep
  return { _id: uid(), name: '', tag_number: '', sex: sexOptions[0].value, birth_date: '', breed: '', status: 'alive', notes: '' }
}

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 700)
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 700)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return mobile
}

export function BulkAddPage({ species = 'sheep' }) {
  const navigate       = useNavigate()
  const { addAnimal }  = useAnimals(species)
  const meta           = ANIMAL_META[species] || ANIMAL_META.sheep
  const sexOptions     = SEX_OPTIONS[species] || SEX_OPTIONS.sheep
  const isChicken      = species === 'chickens'
  const isMobile       = useIsMobile()

  const [rows,   setRows]   = useState(() => Array.from({ length: 5 }, () => emptyRow(species)))
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [saved,  setSaved]  = useState([])
  const [failed, setFailed] = useState([])

  const setRow    = (id, key, val) => setRows(prev => prev.map(r => r._id === id ? { ...r, [key]: val } : r))
  const addRow    = () => setRows(prev => [...prev, emptyRow(species)])
  const removeRow = (id) => setRows(prev => prev.length > 1 ? prev.filter(r => r._id !== id) : prev)

  const filledRows = rows.filter(r => r.name.trim())

  const handleSave = async () => {
    if (filledRows.length === 0) { setErrors({ global: 'Enter at least one name to save.' }); return }
    setSaving(true); setErrors({}); setSaved([]); setFailed([])

    const results = await Promise.allSettled(
      filledRows.map(r => addAnimal({
        name:       r.name.trim(),
        tag_number: r.tag_number.trim() || `AUTO-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        sex:        r.sex,
        birth_date: r.birth_date || null,
        breed:      r.breed      || null,
        status:     r.status,
        notes:      r.notes      || null,
        species,
      }))
    )

    const ok  = results.filter(r => r.status === 'fulfilled').map(r => r.value.name)
    const err = results.filter(r => r.status === 'rejected').map((_, i) => filledRows[i].name)
    setSaved(ok); setFailed(err); setSaving(false)

    if (err.length === 0) {
      setTimeout(() => navigate(species === 'chickens' ? '/chickens' : '/'), 1500)
    } else {
      const savedSet = new Set(ok)
      setRows(prev => prev.filter(r => !savedSet.has(r.name.trim())))
    }
  }

  const inp = {
    padding: '8px 10px', borderRadius: 6, border: '1px solid #d0c4b0',
    background: '#fdfaf6', fontFamily: "'Lato',sans-serif", fontSize: 13,
    color: '#2c2416', outline: 'none', width: '100%', boxSizing: 'border-box',
  }
  const sel = { ...inp, cursor: 'pointer' }

  // Column definitions — each has a flex weight and label
  const cols = [
    { key: 'name',       label: 'Name *',       flex: 2.2 },
    { key: 'tag_number', label: 'Tag / ID',      flex: 1.2 },
    { key: 'sex',        label: 'Sex',           flex: 1.6 },
    ...(isChicken ? [{ key: 'breed', label: 'Breed', flex: 1.6 }] : []),
    { key: 'birth_date', label: 'Date of Birth', flex: 1.5 },
    { key: 'status',     label: 'Status',        flex: 1.2 },
    { key: 'notes',      label: 'Notes',         flex: 2   },
  ]

  return (
    <div style={{ ...S.page, padding: isMobile ? '20px 12px' : '32px 24px' }}>
      <style>{`
        @media (max-width: 700px) {
          .bulk-header { display: none !important; }
          .bulk-row { flex-direction: column !important; gap: 10px !important; padding: 16px !important; border-radius: 10px !important; margin-bottom: 10px !important; border: 1px solid #e8e0d0 !important; background: #fff !important; }
          .bulk-row > .bulk-cell { width: 100% !important; flex: none !important; }
          .bulk-row > .bulk-cell::before { content: attr(data-label); display: block; font-size: 10px; font-weight: 700; color: #a08060; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
          .bulk-remove { align-self: flex-end !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: 12, marginBottom: 20 }}>
        <div>
          <button style={{ ...S.btn, ...S.btnSecondary, padding: '7px 14px', marginBottom: 8 }}
            onClick={() => navigate(species === 'chickens' ? '/chickens' : '/')}>
            ← {meta.label}
          </button>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 22 : 26, fontWeight: 700, margin: '0 0 2px' }}>
            {meta.emoji} Bulk Add {meta.label}
          </h1>
          <p style={{ fontSize: 13, color: '#a08060', margin: 0 }}>Only Name is required. Blank rows are ignored.</p>
        </div>
        <div style={{ marginLeft: isMobile ? 0 : 'auto', display: 'flex', gap: 10, width: isMobile ? '100%' : 'auto' }}>
          <button onClick={addRow} style={{ ...S.btn, ...S.btnSecondary, flex: isMobile ? 1 : 'none' }}>+ Add Row</button>
          <button onClick={handleSave} disabled={saving || filledRows.length === 0}
            style={{ ...S.btn, ...S.btnPrimary, flex: isMobile ? 1 : 'none', opacity: saving || filledRows.length === 0 ? 0.6 : 1 }}>
            {saving ? 'Saving…' : `Save ${filledRows.length || ''} ${filledRows.length === 1 ? meta.singular : meta.label}`}
          </button>
        </div>
      </div>

      {/* Messages */}
      {errors.global && <div style={{ background: '#fff3f3', border: '1px solid #f5c6c6', borderRadius: 8, padding: '10px 16px', color: '#c62828', fontSize: 13, marginBottom: 16 }}>{errors.global}</div>}
      {saved.length > 0 && <div style={{ background: '#f1f8f1', border: '1px solid #a5d6a7', borderRadius: 8, padding: '10px 16px', color: '#2e7d32', fontSize: 13, marginBottom: 16 }}>✓ Saved: <strong>{saved.join(', ')}</strong>{failed.length === 0 && ' — redirecting…'}</div>}
      {failed.length > 0 && <div style={{ background: '#fff3f3', border: '1px solid #f5c6c6', borderRadius: 8, padding: '10px 16px', color: '#c62828', fontSize: 13, marginBottom: 16 }}>✕ Failed: <strong>{failed.join(', ')}</strong></div>}

      {/* Table */}
      <div style={{ ...S.card, overflow: 'hidden' }}>

        {/* Column headers — hidden on mobile via CSS */}
        <div className="bulk-header" style={{ display: 'flex', gap: 8, padding: '11px 16px 11px 16px', borderBottom: '2px solid #e8e0d0', background: '#fdfaf6', alignItems: 'center' }}>
          {cols.map(c => (
            <div key={c.key} style={{ flex: c.flex, fontSize: 11, fontWeight: 700, color: '#a08060', textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: 0 }}>
              {c.label}
            </div>
          ))}
          {/* Spacer for remove button */}
          <div style={{ width: 28, flexShrink: 0 }} />
        </div>

        {/* Rows */}
        <div style={{ padding: isMobile ? '8px' : 0 }}>
          {rows.map((row, idx) => (
            <div key={row._id} className="bulk-row"
              style={{ display: 'flex', gap: 8, padding: '8px 16px', borderBottom: idx < rows.length - 1 ? '1px solid #f7f4ef' : 'none', alignItems: 'center', background: idx % 2 === 0 ? '#fff' : '#fdfaf6' }}>

              {/* Name */}
              <div className="bulk-cell" data-label="Name *" style={{ flex: cols.find(c=>c.key==='name').flex, minWidth: 0 }}>
                <input style={{ ...inp, borderColor: row.name.trim() && '#a5d6a7' }}
                  value={row.name} onChange={e => setRow(row._id, 'name', e.target.value)}
                  placeholder={`${meta.singular} name`} autoFocus={idx === 0} />
              </div>

              {/* Tag */}
              <div className="bulk-cell" data-label="Tag / ID" style={{ flex: cols.find(c=>c.key==='tag_number').flex, minWidth: 0 }}>
                <input style={inp} value={row.tag_number} onChange={e => setRow(row._id, 'tag_number', e.target.value)} placeholder="Optional" />
              </div>

              {/* Sex */}
              <div className="bulk-cell" data-label="Sex" style={{ flex: cols.find(c=>c.key==='sex').flex, minWidth: 0 }}>
                <select style={sel} value={row.sex} onChange={e => setRow(row._id, 'sex', e.target.value)}>
                  {sexOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              {/* Breed — chickens only */}
              {isChicken && (
                <div className="bulk-cell" data-label="Breed" style={{ flex: 1.6, minWidth: 0 }}>
                  <select style={sel} value={row.breed} onChange={e => setRow(row._id, 'breed', e.target.value)}>
                    <option value="">Unknown</option>
                    {CHICKEN_BREEDS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              )}

              {/* DOB */}
              <div className="bulk-cell" data-label="Date of Birth" style={{ flex: cols.find(c=>c.key==='birth_date').flex, minWidth: 0 }}>
                <input type="date" style={inp} value={row.birth_date} onChange={e => setRow(row._id, 'birth_date', e.target.value)} />
              </div>

              {/* Status */}
              <div className="bulk-cell" data-label="Status" style={{ flex: cols.find(c=>c.key==='status').flex, minWidth: 0 }}>
                <select style={sel} value={row.status} onChange={e => setRow(row._id, 'status', e.target.value)}>
                  <option value="alive">Alive</option>
                  <option value="sold">Sold</option>
                  <option value="deceased">Deceased</option>
                </select>
              </div>

              {/* Notes */}
              <div className="bulk-cell" data-label="Notes" style={{ flex: cols.find(c=>c.key==='notes').flex, minWidth: 0 }}>
                <input style={inp} value={row.notes} onChange={e => setRow(row._id, 'notes', e.target.value)} placeholder="Optional" />
              </div>

              {/* Remove */}
              <button className="bulk-remove" onClick={() => removeRow(row._id)} disabled={rows.length === 1}
                style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'none', cursor: rows.length === 1 ? 'not-allowed' : 'pointer', color: '#c0a080', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: rows.length === 1 ? 0.3 : 1, padding: 0 }}>
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #e8e0d0', display: 'flex', alignItems: 'center', gap: 12, background: '#fdfaf6' }}>
          <button onClick={addRow} style={{ ...S.btn, ...S.btnSecondary, padding: '6px 14px', fontSize: 13 }}>+ Add Another Row</button>
          <span style={{ fontSize: 12, color: '#a08060' }}>{filledRows.length} of {rows.length} rows filled</span>
          <button onClick={handleSave} disabled={saving || filledRows.length === 0}
            style={{ ...S.btn, ...S.btnPrimary, marginLeft: 'auto', opacity: saving || filledRows.length === 0 ? 0.6 : 1 }}>
            {saving ? 'Saving…' : `Save ${filledRows.length || ''} ${filledRows.length === 1 ? meta.singular : meta.label}`}
          </button>
        </div>
      </div>

      <p style={{ fontSize: 12, color: '#c8b89a', marginTop: 12, textAlign: 'center' }}>
        Tip: Press Tab to move between fields quickly.
      </p>
    </div>
  )
}
