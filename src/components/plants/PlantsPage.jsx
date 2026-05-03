import { useState, useRef } from 'react'
import { usePlants, useSinglePlant, usePlantEvents } from '../../hooks/usePlants'
import { S, Spinner, ErrorMsg, Badge, formatDate } from '../ui/shared'

// ─── Plant Taxonomy ───────────────────────────────────────────────────────────
const PLANT_CATEGORIES = [
  { value: 'fruit_tree',  label: 'Fruit Trees',      emoji: '🍎' },
  { value: 'nut_tree',    label: 'Nut Trees',         emoji: '🌰' },
  { value: 'shade_tree',  label: 'Shade Trees',       emoji: '🌳' },
  { value: 'vegetable',   label: 'Vegetable Garden',  emoji: '🥕' },
  { value: 'herb',        label: 'Herb Garden',       emoji: '🌿' },
  { value: 'flower',      label: 'Flowers',           emoji: '🌸' },
  { value: 'other',       label: 'Other',             emoji: '🪴' },
]

// Sub-types per category. For fruit trees: specific fruits, each with optional subspecies
const FRUIT_TREE_TYPES = [
  { value: 'apple',  label: 'Apple Tree',  emoji: '🍎',
    subspecies: ['Honeycrisp','Fuji','Gala','Granny Smith','Pink Lady','McIntosh','Braeburn','Empire','Other'] },
  { value: 'pear',   label: 'Pear Tree',   emoji: '🍐',
    subspecies: ['Anjou','Bartlett','Bosc','Comice','Seckel','Asian Pear','Other'] },
  { value: 'pawpaw', label: 'Pawpaw Tree', emoji: '🫐',
    subspecies: ['Sunflower','Shenandoah','Susquehanna','Allegheny','NC-1','Other'] },
  { value: 'peach',  label: 'Peach Tree',  emoji: '🍑',
    subspecies: ['Elberta','Reliance','Contender','Red Haven','Other'] },
  { value: 'plum',   label: 'Plum Tree',   emoji: '🟣',
    subspecies: ['Stanley','Italian','Damson','Santa Rosa','Other'] },
  { value: 'cherry', label: 'Cherry Tree', emoji: '🍒',
    subspecies: ['Bing','Rainier','Montmorency','Black Tartarian','Other'] },
  { value: 'fig',    label: 'Fig Tree',    emoji: '🫐',
    subspecies: ['Brown Turkey','Chicago Hardy','Celeste','Black Mission','Other'] },
  { value: 'citrus', label: 'Citrus Tree', emoji: '🍋',
    subspecies: ['Lemon','Orange','Lime','Grapefruit','Meyer Lemon','Other'] },
  { value: 'other_fruit', label: 'Other Fruit Tree', emoji: '🍈', subspecies: [] },
]

const NUT_TREE_TYPES = [
  { value: 'walnut',   label: 'Walnut',   emoji: '🌰', subspecies: ['Black Walnut','English Walnut','Other'] },
  { value: 'pecan',    label: 'Pecan',    emoji: '🌰', subspecies: ['Desirable','Elliot','Stuart','Other'] },
  { value: 'chestnut', label: 'Chestnut', emoji: '🌰', subspecies: ['Chinese','American','Dunstan','Other'] },
  { value: 'hazelnut', label: 'Hazelnut', emoji: '🌰', subspecies: ['American','European','Other'] },
  { value: 'other_nut', label: 'Other Nut Tree', emoji: '🌰', subspecies: [] },
]

const SHADE_TREE_TYPES = [
  { value: 'oak',    label: 'Oak',    emoji: '🌳', subspecies: ['White Oak','Red Oak','Pin Oak','Other'] },
  { value: 'maple',  label: 'Maple',  emoji: '🍁', subspecies: ['Sugar Maple','Red Maple','Silver Maple','Other'] },
  { value: 'poplar', label: 'Poplar', emoji: '🌳', subspecies: [] },
  { value: 'willow', label: 'Willow', emoji: '🌿', subspecies: [] },
  { value: 'other_shade', label: 'Other Shade Tree', emoji: '🌳', subspecies: [] },
]

const SUBTYPES_BY_CATEGORY = {
  fruit_tree: FRUIT_TREE_TYPES,
  nut_tree:   NUT_TREE_TYPES,
  shade_tree: SHADE_TREE_TYPES,
}

const CARE_TYPES = [
  { value: 'watering',    label: 'Watering'             },
  { value: 'pruning',     label: 'Pruning'              },
  { value: 'fertilizing', label: 'Fertilizing'          },
  { value: 'spraying',    label: 'Spraying'             },
  { value: 'harvesting',  label: 'Harvesting'           },
  { value: 'replanting',  label: 'Replanting'           },
  { value: 'inspection',  label: 'Inspection'           },
  { value: 'treatment',   label: 'Disease/Pest Treatment'},
  { value: 'custom',      label: 'Custom'               },
]

const CARE_COLORS = {
  watering:    { bg: '#e3f2fd', text: '#1565c0', border: '#90caf9' },
  pruning:     { bg: '#f3e5f5', text: '#6a1b9a', border: '#ce93d8' },
  fertilizing: { bg: '#e8f5e9', text: '#2e7d32', border: '#a5d6a7' },
  spraying:    { bg: '#fff3e0', text: '#e65100', border: '#ffcc80' },
  harvesting:  { bg: '#fce4ec', text: '#880e4f', border: '#f48fb1' },
  replanting:  { bg: '#e0f7fa', text: '#006064', border: '#80deea' },
  inspection:  { bg: '#f5f5f5', text: '#424242', border: '#bdbdbd' },
  treatment:   { bg: '#fff8e1', text: '#f57f17', border: '#ffe082' },
  custom:      { bg: '#e8eaf6', text: '#283593', border: '#9fa8da' },
}

function calcAge(plantedDate) {
  if (!plantedDate) return null
  const planted = new Date(plantedDate), now = new Date()
  const totalMonths = (now.getFullYear() - planted.getFullYear()) * 12 + now.getMonth() - planted.getMonth()
  if (totalMonths < 1)  return 'Just planted'
  if (totalMonths < 12) return `${totalMonths} months old`
  const y = Math.floor(totalMonths / 12), m = totalMonths % 12
  return m > 0 ? `${y}yr ${m}mo old` : `${y} year${y > 1 ? 's' : ''} old`
}

function getPlantEmoji(cat, subType) {
  if (!cat) return '🪴'
  const catMeta = PLANT_CATEGORIES.find(c => c.value === cat)
  const subtypes = SUBTYPES_BY_CATEGORY[cat]
  if (subtypes && subType) {
    const st = subtypes.find(s => s.value === subType)
    if (st) return st.emoji
  }
  return catMeta?.emoji || '🪴'
}

function getPlantLabel(cat, subType) {
  if (!cat) return 'Plant'
  const catMeta = PLANT_CATEGORIES.find(c => c.value === cat)
  const subtypes = SUBTYPES_BY_CATEGORY[cat]
  if (subtypes && subType) {
    const st = subtypes.find(s => s.value === subType)
    if (st) return st.label
  }
  return catMeta?.label || 'Plant'
}

// ─── Plant care events ────────────────────────────────────────────────────────
function PlantEventSection({ plantId, plantName }) {
  const { events, loading, deleteEvent, addEvent } = usePlantEvents(plantId)
  const [showForm, setShowForm] = useState(false)
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({ care_type: 'watering', event_date: today, notes: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try { await addEvent(form); setShowForm(false); setForm({ care_type: 'watering', event_date: today, notes: '' }) }
    catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  return (
    <div style={{ ...S.card, padding: 26 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
        <span style={{ ...S.sectionLabel, margin: 0 }}>Care History ({loading ? '…' : events.length})</span>
        <button onClick={() => setShowForm(v => !v)} style={{ ...S.btn, ...S.btnPrimary, marginLeft: 'auto', padding: '7px 16px', fontSize: 13 }}>
          {showForm ? '✕ Cancel' : '+ Log Care'}
        </button>
      </div>

      {showForm && (
        <div style={{ ...S.card, padding: 20, marginBottom: 16, border: '1px dashed #c8b89a', background: '#fdfaf6' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={S.label}>Care Type</label>
              <select style={{ ...S.input, cursor: 'pointer' }} value={form.care_type} onChange={e => set('care_type', e.target.value)}>
                {CARE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Date</label>
              <input type="date" style={S.input} value={form.event_date} onChange={e => set('event_date', e.target.value)} />
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={S.label}>Notes</label>
            <textarea style={{ ...S.input, minHeight: 70, resize: 'vertical' }} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Details..." />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleSave} disabled={saving} style={{ ...S.btn, ...S.btnPrimary, opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving…' : 'Save'}</button>
            <button onClick={() => setShowForm(false)} style={{ ...S.btn, ...S.btnSecondary }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? <Spinner /> : events.length === 0 && !showForm ? (
        <p style={{ color: '#a08060', fontSize: 14, textAlign: 'center', padding: '28px 0' }}>No care logged yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {events.map(ev => {
            const cc    = CARE_COLORS[ev.care_type] || CARE_COLORS.custom
            const label = CARE_TYPES.find(t => t.value === ev.care_type)?.label || ev.care_type
            return (
              <div key={ev.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', borderRadius: 10, background: cc.bg, border: `1px solid ${cc.border}` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <Badge bg={cc.border} color={cc.text}>{label}</Badge>
                    <span style={{ fontSize: 12, color: '#7a6648' }}>{formatDate(ev.event_date)}</span>
                  </div>
                  {ev.notes && <p style={{ fontSize: 13, margin: 0, color: '#4a3c28', lineHeight: 1.5 }}>{ev.notes}</p>}
                </div>
                <button onClick={() => deleteEvent(ev.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c0a080', fontSize: 18, lineHeight: 1, padding: '0 2px' }}>×</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Plant Detail ─────────────────────────────────────────────────────────────
function PlantDetail({ plant, onBack, onEdit }) {
  const emoji = getPlantEmoji(plant.plant_category, plant.plant_subtype)
  const label = getPlantLabel(plant.plant_category, plant.plant_subtype)
  const catLabel = PLANT_CATEGORIES.find(c => c.value === plant.plant_category)?.label || ''

  return (
    <div>
      <div style={{ background: 'linear-gradient(160deg,#1a2e1a 0%,#2d4a2d 50%,#3d6b3d 100%)', padding: '28px 24px 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 20 }}>
          <button onClick={onBack} style={{ ...S.btn, background: 'rgba(255,255,255,0.1)', color: '#d4f0d4', border: '1px solid rgba(255,255,255,0.2)', padding: '7px 14px', fontSize: 13 }}>← Plants</button>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '3px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, flexShrink: 0 }}>
            {emoji}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: '#d4f0d4', margin: 0 }}>{plant.name}</h1>
              <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.15)', color: '#d4f0d4', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
            </div>
            {plant.plant_subspecies && (
              <p style={{ fontSize: 13, color: '#a0d4a0', margin: '0 0 8px', fontStyle: 'italic' }}>{plant.plant_subspecies}</p>
            )}
            <div style={{ display: 'flex', gap: 24 }}>
              {[
                ['Category',  catLabel || '—'],
                ['Location',  plant.location || '—'],
                ['Planted',   plant.planted_date ? formatDate(plant.planted_date) : '—'],
                ['Age',       calcAge(plant.planted_date) || '—'],
              ].map(([l, v]) => (
                <div key={l}>
                  <p style={{ fontSize: 10, color: '#7ab87a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 2px' }}>{l}</p>
                  <p style={{ fontSize: 13, color: '#d4f0d4', margin: 0 }}>{v}</p>
                </div>
              ))}
            </div>
          </div>
          <button onClick={onEdit} style={{ ...S.btn, background: 'rgba(255,255,255,0.1)', color: '#d4f0d4', border: '1px solid rgba(255,255,255,0.2)', padding: '7px 14px', fontSize: 13 }}>Edit</button>
        </div>
      </div>
      <div style={S.page}>
        {plant.notes && (
          <div style={{ ...S.card, padding: 22, marginBottom: 22 }}>
            <span style={S.sectionLabel}>Notes</span>
            <p style={{ fontSize: 14, lineHeight: 1.7, margin: 0, color: '#4a3c28' }}>{plant.notes}</p>
          </div>
        )}
        <PlantEventSection plantId={plant.id} plantName={plant.name} />
      </div>
    </div>
  )
}

// ─── Plant Form ───────────────────────────────────────────────────────────────
function PlantForm({ plant, onSave, onCancel }) {
  const [form, setForm] = useState({
    name:             plant?.name             || '',
    plant_category:   plant?.plant_category   || 'fruit_tree',
    plant_subtype:    plant?.plant_subtype     || '',
    plant_subspecies: plant?.plant_subspecies  || '',
    planted_date:     plant?.planted_date      || '',
    location:         plant?.location          || '',
    notes:            plant?.notes             || '',
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving]   = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const subtypes   = SUBTYPES_BY_CATEGORY[form.plant_category] || []
  const selSubtype = subtypes.find(s => s.value === form.plant_subtype)
  const emoji = getPlantEmoji(form.plant_category, form.plant_subtype)

  // When category changes, clear sub selections
  const handleCatChange = (val) => {
    setForm(f => ({ ...f, plant_category: val, plant_subtype: '', plant_subspecies: '' }))
  }
  const handleSubtypeChange = (val) => {
    setForm(f => ({ ...f, plant_subtype: val, plant_subspecies: '' }))
  }

  const submit = async () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (Object.keys(e).length) { setErrors(e); return }
    setSaving(true)
    try { await onSave({ ...form }) }
    catch (err) { alert(err.message); setSaving(false) }
  }

  return (
    <div style={S.page}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button onClick={onCancel} style={{ ...S.btn, ...S.btnSecondary, padding: '7px 14px' }}>← Back</button>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#e8f5e9', border: '2px solid #c8e6c9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
          {emoji}
        </div>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 700, margin: 0 }}>
          {plant ? `Edit ${plant.name}` : 'Add Plant or Tree'}
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
        <div style={{ ...S.card, padding: 26 }}>
          <span style={S.sectionLabel}>Identity</span>

          <div style={{ marginBottom: 18 }}>
            <label style={S.label}>Name *</label>
            <input style={S.input} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Old Apple Tree, Back Fence Rosemary" />
            {errors.name && <p style={{ color: '#c62828', fontSize: 12, marginTop: 4 }}>{errors.name}</p>}
          </div>

          {/* Step 1: Category */}
          <div style={{ marginBottom: 18 }}>
            <label style={S.label}>Category</label>
            <select style={{ ...S.input, cursor: 'pointer' }} value={form.plant_category} onChange={e => handleCatChange(e.target.value)}>
              {PLANT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
            </select>
          </div>

          {/* Step 2: Sub-type (only for tree categories) */}
          {subtypes.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <label style={S.label}>
                {form.plant_category === 'fruit_tree' ? 'Fruit Type' :
                 form.plant_category === 'nut_tree'   ? 'Nut Type'   : 'Tree Type'}
              </label>
              <select style={{ ...S.input, cursor: 'pointer' }} value={form.plant_subtype} onChange={e => handleSubtypeChange(e.target.value)}>
                <option value="">— Select type —</option>
                {subtypes.map(s => <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>)}
              </select>
            </div>
          )}

          {/* Step 3: Subspecies — dropdown if options exist, free text otherwise */}
          {form.plant_subtype && selSubtype && (
            <div style={{ marginBottom: 18 }}>
              <label style={S.label}>Variety / Subspecies</label>
              {selSubtype.subspecies && selSubtype.subspecies.length > 0 ? (
                <select style={{ ...S.input, cursor: 'pointer' }} value={form.plant_subspecies} onChange={e => set('plant_subspecies', e.target.value)}>
                  <option value="">— Select variety —</option>
                  {selSubtype.subspecies.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <input style={S.input} value={form.plant_subspecies} onChange={e => set('plant_subspecies', e.target.value)} placeholder="Describe the variety..." />
              )}
              {/* Always allow free text override */}
              {selSubtype.subspecies && selSubtype.subspecies.length > 0 && form.plant_subspecies === 'Other' && (
                <input style={{ ...S.input, marginTop: 8 }} value={form.plant_subspecies === 'Other' ? '' : form.plant_subspecies}
                  onChange={e => set('plant_subspecies', e.target.value)} placeholder="Describe the variety..." />
              )}
            </div>
          )}

          {/* Free text subspecies for non-tree categories */}
          {!subtypes.length && (
            <div style={{ marginBottom: 18 }}>
              <label style={S.label}>Variety (optional)</label>
              <input style={S.input} value={form.plant_subspecies} onChange={e => set('plant_subspecies', e.target.value)} placeholder="e.g. Cherry Belle, Italian Flat Leaf..." />
            </div>
          )}

          <div style={{ marginBottom: 18 }}>
            <label style={S.label}>Date Planted</label>
            <input type="date" style={S.input} value={form.planted_date} onChange={e => set('planted_date', e.target.value)} />
            {form.planted_date && <p style={{ fontSize: 12, color: '#5a3e1b', marginTop: 4, fontWeight: 600 }}>{calcAge(form.planted_date)}</p>}
          </div>

          <div>
            <label style={S.label}>Location on Farm</label>
            <input style={S.input} value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. North fence, Back paddock, Herb garden" />
          </div>
        </div>

        <div style={{ ...S.card, padding: 26 }}>
          <span style={S.sectionLabel}>Notes</span>
          <textarea style={{ ...S.input, minHeight: 220, resize: 'vertical' }} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Variety details, growing conditions, observations, history..." />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 22 }}>
        <button onClick={submit} disabled={saving} style={{ ...S.btn, ...S.btnPrimary, padding: '11px 26px', fontSize: 15, opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving…' : plant ? 'Save Changes' : 'Add Plant'}
        </button>
        <button onClick={onCancel} style={{ ...S.btn, ...S.btnSecondary }}>Cancel</button>
      </div>
    </div>
  )
}

// ─── Plants Main Page ─────────────────────────────────────────────────────────
export function PlantsPage() {
  const { plants, loading, error, addPlant, updatePlant, deletePlant } = usePlants()
  const [view, setView]           = useState('list')
  const [selectedId, setSelectedId] = useState(null)
  const [filterCat, setFilterCat] = useState('all')
  const selected = plants.find(p => p.id === selectedId)

  const goList   = () => { setView('list'); setSelectedId(null) }
  const goDetail = id => { setSelectedId(id); setView('detail') }
  const goAdd    = () => { setSelectedId(null); setView('add') }
  const goEdit   = id => { setSelectedId(id); setView('edit') }

  const handleAdd    = async data => { const saved = await addPlant(data); goDetail(saved.id) }
  const handleUpdate = async data => { await updatePlant(selectedId, data); goDetail(selectedId) }
  const handleDelete = async id => {
    if (!window.confirm('Delete this plant? All care history will also be deleted.')) return
    await deletePlant(id); goList()
  }

  if (view === 'detail' && selected) return <PlantDetail plant={selected} onBack={goList} onEdit={() => goEdit(selected.id)} />
  if (view === 'add')                return <PlantForm onSave={handleAdd} onCancel={goList} />
  if (view === 'edit' && selected)   return <PlantForm plant={selected} onSave={handleUpdate} onCancel={() => goDetail(selected.id)} />

  // Count per category
  const catCounts = {}
  plants.forEach(p => { catCounts[p.plant_category] = (catCounts[p.plant_category] || 0) + 1 })
  const filtered = plants.filter(p => filterCat === 'all' || p.plant_category === filterCat)

  return (
    <div>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(160deg,#1a2e1a 0%,#2d4a2d 50%,#3d6b3d 100%)', padding: '32px 24px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 36, fontWeight: 700, color: '#d4f0d4', margin: '0 0 4px' }}>🌱 Plants & Trees</h1>
              <p style={{ fontSize: 13, color: '#7ab87a' }}>{plants.length} total · {Object.keys(catCounts).length} categories</p>
            </div>
            <button onClick={goAdd} style={{ ...S.btn, background: '#4caf50', color: '#fff', fontWeight: 700, padding: '9px 20px' }}>+ Add Plant</button>
          </div>
          {/* Strip */}
          <div style={{ display: 'flex', gap: 14, paddingBottom: 24, overflowX: 'auto' }}>
            {plants.map(p => {
              const emoji = getPlantEmoji(p.plant_category, p.plant_subtype)
              const label = getPlantLabel(p.plant_category, p.plant_subtype)
              return (
                <div key={p.id} onClick={() => goDetail(p.id)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', flexShrink: 0, transition: 'transform 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = ''}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
                    {emoji}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#a0d4a0', letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap', maxWidth: 70, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                  <span style={{ fontSize: 9, color: '#5a8a5a', whiteSpace: 'nowrap' }}>{p.plant_subspecies || label}</span>
                </div>
              )
            })}
            {plants.length === 0 && <p style={{ color: '#5a8a5a', fontSize: 13, padding: '8px 0 24px' }}>No plants added yet</p>}
          </div>
        </div>
      </div>

      <div style={S.page}>
        {/* Category filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={() => setFilterCat('all')} style={{ ...S.btn, padding: '6px 14px', fontSize: 13, background: filterCat === 'all' ? '#2d4a2d' : '#fff', color: filterCat === 'all' ? '#fff' : '#7a6648', border: '1px solid #d0c4b0' }}>
            All {plants.length}
          </button>
          {PLANT_CATEGORIES.filter(c => catCounts[c.value]).map(c => (
            <button key={c.value} onClick={() => setFilterCat(filterCat === c.value ? 'all' : c.value)}
              style={{ ...S.btn, padding: '6px 14px', fontSize: 13, background: filterCat === c.value ? '#2d4a2d' : '#fff', color: filterCat === c.value ? '#fff' : '#7a6648', border: '1px solid #d0c4b0' }}>
              {c.emoji} {c.label} {catCounts[c.value]}
            </button>
          ))}
          <button onClick={goAdd} style={{ ...S.btn, background: '#e8f5e9', color: '#2e7d32', border: '1px solid #c8e6c9', padding: '6px 14px', fontSize: 13, marginLeft: 'auto' }}>+ Add Plant</button>
        </div>

        {loading ? <Spinner /> : error ? <ErrorMsg message={error} /> :
          filtered.length === 0 ? (
            <div style={{ ...S.card, padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🌱</div>
              <p style={{ color: '#a08060', fontSize: 15, marginBottom: 16 }}>No plants yet. Start tracking your trees and plants!</p>
              <button onClick={goAdd} style={{ ...S.btn, ...S.btnPrimary }}>+ Add Your First Plant</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
              {filtered.map(p => {
                const emoji = getPlantEmoji(p.plant_category, p.plant_subtype)
                const label = getPlantLabel(p.plant_category, p.plant_subtype)
                const catMeta = PLANT_CATEGORIES.find(c => c.value === p.plant_category)
                return (
                  <div key={p.id} onClick={() => goDetail(p.id)}
                    style={{ ...S.card, padding: 18, cursor: 'pointer', display: 'flex', gap: 14, alignItems: 'center', transition: 'transform 0.12s,box-shadow 0.12s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(44,36,22,0.12)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#e8f5e9', border: '2px solid #c8e6c9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                      {emoji}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 16, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                      <p style={{ fontSize: 11, color: '#a08060', margin: '0 0 3px' }}>
                        {catMeta?.label}{p.plant_subtype ? ` › ${label}` : ''}{p.plant_subspecies ? ` › ${p.plant_subspecies}` : ''}
                        {p.location ? ` · ${p.location}` : ''}
                      </p>
                      {p.planted_date && <p style={{ fontSize: 12, color: '#5a3e1b', fontWeight: 600, margin: 0 }}>{calcAge(p.planted_date)}</p>}
                    </div>
                    <button onClick={e => { e.stopPropagation(); handleDelete(p.id) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c0a080', fontSize: 18, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}>×</button>
                  </div>
                )
              })}
            </div>
          )
        }
      </div>
    </div>
  )
}
