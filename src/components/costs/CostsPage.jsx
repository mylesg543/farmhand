import { useState } from 'react'
import { useFeedCosts } from '../../hooks/useFeedCosts'
import { S, Spinner, ErrorMsg, ANIMAL_META, formatDate, fmt } from '../ui/shared'

export function CostsPage() {
  const { costs, loading, error, addCost, deleteCost } = useFeedCosts()
  const [filterAnimal, setFilterAnimal] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({ species: 'sheep', description: '', amount: '', date: today })
  const [formError, setFormError] = useState('')
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const filtered = costs.filter(c => filterAnimal === 'all' || c.species === filterAnimal)
  const totalAll = costs.reduce((s, c) => s + Number(c.amount), 0)

  const animalTotals = {}
  costs.forEach(c => { animalTotals[c.species] = (animalTotals[c.species] || 0) + Number(c.amount) })

  const byMonth = {}
  filtered.forEach(c => { const mo = c.date.slice(0, 7); byMonth[mo] = (byMonth[mo] || 0) + Number(c.amount) })
  const months = Object.keys(byMonth).sort().reverse()

  const fmtMonth = m => {
    const [y, mo] = m.split('-')
    return new Date(y, mo - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
  }

  const handleAdd = async () => {
    if (!form.description.trim()) { setFormError('Description is required'); return }
    const amt = parseFloat(form.amount)
    if (!form.amount || isNaN(amt) || amt <= 0) { setFormError('Enter a valid amount'); return }
    try {
      await addCost({ species: form.species, description: form.description, amount: amt, date: form.date })
      setForm({ species: 'sheep', description: '', amount: '', date: today })
      setFormError(''); setShowForm(false)
    } catch (err) { setFormError(err.message) }
  }

  return (
    <div style={S.page}>
      <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 32, fontWeight: 700, margin: '0 0 4px' }}>Feed Costs</h1>
          <p style={{ fontSize: 14, color: '#a08060', margin: 0 }}>
            Total across all animals: <strong style={{ color: '#2c2416' }}>{fmt(totalAll)}</strong>
          </p>
        </div>
        <button onClick={() => setShowForm(v => !v)} style={{ ...S.btn, ...S.btnPrimary, marginLeft: 'auto', padding: '10px 22px' }}>
          {showForm ? '✕ Cancel' : '+ Log Cost'}
        </button>
      </div>

      {/* Add cost form */}
      {showForm && (
        <div style={{ ...S.card, padding: 26, marginBottom: 24, border: '1px dashed #c8b89a', background: '#fdfaf6' }}>
          <span style={S.sectionLabel}>Log a Feed Cost</span>
          {formError && <p style={{ color: '#c62828', fontSize: 13, marginBottom: 12 }}>{formError}</p>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={S.label}>Animal</label>
              <select style={{ ...S.input, cursor: 'pointer' }} value={form.species} onChange={e => setF('species', e.target.value)}>
                {Object.entries(ANIMAL_META).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Description</label>
              <input style={S.input} value={form.description} onChange={e => setF('description', e.target.value)} placeholder="e.g. Hay bale x10, Layer pellets 20kg" />
            </div>
            <div>
              <label style={S.label}>Date</label>
              <input type="date" style={S.input} value={form.date} onChange={e => setF('date', e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 14, alignItems: 'flex-end' }}>
            <div>
              <label style={S.label}>Amount ($)</label>
              <input type="number" min="0" step="0.01" style={S.input} value={form.amount} onChange={e => setF('amount', e.target.value)} placeholder="0.00" />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleAdd} style={{ ...S.btn, ...S.btnPrimary }}>Save Cost</button>
              <button onClick={() => { setShowForm(false); setFormError('') }} style={{ ...S.btn, ...S.btnSecondary }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Per-animal summary tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12, marginBottom: 28 }}>
        {Object.entries(ANIMAL_META).map(([k, v]) => {
          const total = animalTotals[k] || 0
          const isActive = filterAnimal === k
          return (
            <div key={k} onClick={() => setFilterAnimal(isActive ? 'all' : k)}
              style={{ ...S.card, padding: '18px 16px', cursor: 'pointer', textAlign: 'center', border: isActive ? `2px solid ${v.color}` : '1px solid #e8e0d0', background: isActive ? v.light : '#fff', transition: 'all 0.15s' }}>
              <div style={{ fontSize: 26, marginBottom: 6 }}>{v.emoji}</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: isActive ? v.color : '#2c2416', marginBottom: 2 }}>{fmt(total)}</div>
              <div style={{ fontSize: 11, color: '#a08060', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{v.label}</div>
              {total === 0 && <div style={{ fontSize: 10, color: '#c8b89a', marginTop: 4 }}>No costs yet</div>}
            </div>
          )
        })}
      </div>

      {/* Filter label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ ...S.sectionLabel, margin: 0 }}>
          {filterAnimal === 'all' ? 'All Entries' : `${ANIMAL_META[filterAnimal]?.emoji} ${ANIMAL_META[filterAnimal]?.label} Entries`}
          <span style={{ fontWeight: 400, opacity: 0.6, marginLeft: 6 }}>({filtered.length})</span>
        </span>
        {filterAnimal !== 'all' && (
          <button onClick={() => setFilterAnimal('all')} style={{ ...S.btn, background: '#fff', color: '#a08060', border: '1px solid #d0c4b0', padding: '4px 10px', fontSize: 12 }}>✕ Clear</button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 700, color: '#2c2416' }}>
          {filterAnimal === 'all' ? 'Total' : 'Filtered'}: {fmt(filtered.reduce((s, c) => s + Number(c.amount), 0))}
        </span>
      </div>

      {/* Entries */}
      {loading ? <Spinner /> : error ? <ErrorMsg message={error} /> :
        filtered.length === 0 ? (
          <div style={{ ...S.card, padding: 60, textAlign: 'center' }}>
            <p style={{ color: '#a08060', fontSize: 14 }}>No costs recorded yet. Click "+ Log Cost" to add one.</p>
          </div>
        ) : months.map(mo => {
          const monthEntries = filtered.filter(c => c.date.startsWith(mo)).sort((a, b) => b.date.localeCompare(a.date))
          const monthTotal = monthEntries.reduce((s, c) => s + Number(c.amount), 0)
          return (
            <div key={mo} style={{ ...S.card, padding: 22, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #f0ebe4' }}>
                <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700 }}>{fmtMonth(mo)}</span>
                <span style={{ marginLeft: 'auto', fontWeight: 700, fontSize: 15, color: '#5a3e1b' }}>{fmt(monthTotal)}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {monthEntries.map(c => {
                  const meta = ANIMAL_META[c.species] || ANIMAL_META.sheep
                  return (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, background: meta.light }}>
                      <span style={{ fontSize: 20, flexShrink: 0 }}>{meta.emoji}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description}</p>
                        <p style={{ fontSize: 11, color: '#a08060', margin: 0 }}>{meta.label} · {formatDate(c.date)}</p>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 14, color: meta.color, flexShrink: 0 }}>{fmt(c.amount)}</span>
                      <button onClick={() => deleteCost(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c0a080', fontSize: 18, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}>×</button>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })
      }
    </div>
  )
}
