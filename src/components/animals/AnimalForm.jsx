import { useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAnimals, useSingleAnimal } from '../../hooks/useAnimals'
import { usePhotoUpload } from '../../hooks/usePhotoUpload'
import { S, Field, Spinner, ErrorMsg, AnimalIllustration, SEX_LABELS } from '../ui/shared'

function FormInner({ existing, allAnimals, onSave }) {
  const [form, setForm] = useState({
    name:       existing?.name       || '',
    tag_number: existing?.tag_number || '',
    sex:        existing?.sex        || 'ewe',
    birth_date: existing?.birth_date || '',
    status:     existing?.status     || 'alive',
    notes:      existing?.notes      || '',
    sire_id:    existing?.sire_id    || '',
    dam_id:     existing?.dam_id     || '',
    photo_url:  existing?.photo_url  || null,
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const { uploadPhoto, uploading } = usePhotoUpload()
  const fileRef = useRef()
  const navigate = useNavigate()
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const loadPhoto = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    // In prototype: base64 preview. In production: upload to Supabase Storage
    const reader = new FileReader()
    reader.onload = e => set('photo_url', e.target.result)
    reader.readAsDataURL(file)
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim())       e.name       = 'Name is required'
    if (!form.tag_number.trim()) e.tag_number = 'Tag number is required'
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setSaving(true); setSaveErr(null)
    try {
      const payload = { ...form, sire_id: form.sire_id || null, dam_id: form.dam_id || null }
      const saved = await onSave(payload)
      navigate(`/animals/${saved.id}`)
    } catch (err) { setSaveErr(err.message); setSaving(false) }
  }

  const rams = allAnimals.filter(a => a.sex === 'ram'  && a.id !== existing?.id)
  const ewes = allAnimals.filter(a => a.sex === 'ewe'  && a.id !== existing?.id)
  const previewAnimal = { ...existing, ...form, id: existing?.id || 'preview' }

  return (
    <div style={S.page}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button style={{ ...S.btn, ...S.btnSecondary, padding: '7px 14px' }} onClick={() => navigate(-1)}>← Back</button>
        <div style={{ width: 54, height: 54, borderRadius: '50%', overflow: 'hidden', background: '#f0ebe4', border: '2px solid #e8e0d0', flexShrink: 0 }}>
          <AnimalIllustration animal={previewAnimal} size={54} />
        </div>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 700, margin: 0 }}>
          {existing ? `Edit ${existing.name}` : 'Add New Animal'}
        </h1>
      </div>

      {saveErr && <ErrorMsg message={saveErr} />}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ ...S.card, padding: 26 }}>
            <span style={S.sectionLabel}>Identity</span>
            <Field label="Name *" error={errors.name}>
              <input style={S.input} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Bella" />
            </Field>
            <Field label="Tag Number *" error={errors.tag_number}>
              <input style={S.input} value={form.tag_number} onChange={e => set('tag_number', e.target.value)} placeholder="e.g. TAG-001" />
            </Field>
            <Field label="Sex">
              <select style={{ ...S.input, cursor: 'pointer' }} value={form.sex} onChange={e => set('sex', e.target.value)}>
                <option value="ewe">Ewe (Female)</option>
                <option value="ram">Ram (Male)</option>
                <option value="wether">Wether (Castrated Male)</option>
              </select>
            </Field>
            <Field label="Birth Date">
              <input type="date" style={S.input} value={form.birth_date} onChange={e => set('birth_date', e.target.value)} />
            </Field>
            <Field label="Status">
              <select style={{ ...S.input, cursor: 'pointer' }} value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="alive">Alive</option>
                <option value="sold">Sold</option>
                <option value="deceased">Deceased</option>
              </select>
            </Field>
          </div>

          {/* Photo upload */}
          <div style={{ ...S.card, padding: 26 }}>
            <span style={S.sectionLabel}>Profile Photo</span>
            <input ref={fileRef} type="file" accept="image/*" onChange={e => loadPhoto(e.target.files[0])} style={{ display: 'none' }} />
            {form.photo_url ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 88, height: 88, borderRadius: '50%', overflow: 'hidden', border: '3px solid #e8e0d0', flexShrink: 0 }}>
                  <img src={form.photo_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, color: '#5a3e1b', fontWeight: 600, marginBottom: 8 }}>✓ Photo uploaded</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => fileRef.current.click()} style={{ ...S.btn, ...S.btnSecondary, padding: '6px 12px', fontSize: 12 }}>Change</button>
                    <button onClick={() => set('photo_url', null)} style={{ ...S.btn, ...S.btnDanger, padding: '6px 12px', fontSize: 12 }}>Remove</button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileRef.current.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); loadPhoto(e.dataTransfer.files[0]) }}
                style={{ border: `2px dashed ${dragOver ? '#5a3e1b' : '#c8b89a'}`, borderRadius: 10, padding: '28px 20px', textAlign: 'center', cursor: 'pointer', background: dragOver ? '#f5ede0' : '#fdfaf6', transition: 'all 0.15s' }}>
                <div style={{ fontSize: 30, marginBottom: 8 }}>📷</div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#5a3e1b', marginBottom: 4 }}>Click to upload a photo</p>
                <p style={{ fontSize: 11, color: '#a08060' }}>or drag and drop · JPG, PNG, WEBP</p>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ ...S.card, padding: 26 }}>
            <span style={S.sectionLabel}>Parentage</span>
            <Field label="Sire (Father)">
              <select style={{ ...S.input, cursor: 'pointer' }} value={form.sire_id} onChange={e => set('sire_id', e.target.value)}>
                <option value="">— Unknown —</option>
                {rams.map(r => <option key={r.id} value={r.id}>{r.name} ({r.tag_number})</option>)}
              </select>
            </Field>
            <Field label="Dam (Mother)">
              <select style={{ ...S.input, cursor: 'pointer' }} value={form.dam_id} onChange={e => set('dam_id', e.target.value)}>
                <option value="">— Unknown —</option>
                {ewes.map(r => <option key={r.id} value={r.id}>{r.name} ({r.tag_number})</option>)}
              </select>
            </Field>
          </div>
          <div style={{ ...S.card, padding: 26, flex: 1 }}>
            <span style={S.sectionLabel}>Notes</span>
            <textarea style={{ ...S.input, minHeight: 140, resize: 'vertical' }} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any notes about this animal…" />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 22 }}>
        <button style={{ ...S.btn, ...S.btnPrimary, padding: '11px 26px', fontSize: 15, opacity: saving ? 0.7 : 1 }} onClick={handleSubmit} disabled={saving}>
          {saving ? 'Saving…' : existing ? 'Save Changes' : 'Add Animal'}
        </button>
        <button style={{ ...S.btn, ...S.btnSecondary }} onClick={() => navigate(-1)}>Cancel</button>
      </div>
    </div>
  )
}

export function AddAnimalPage() {
  const { animals, addAnimal } = useAnimals('sheep')
  return <FormInner allAnimals={animals} onSave={addAnimal} />
}

export function EditAnimalPage() {
  const { id } = useParams()
  const { animal, loading } = useSingleAnimal(id)
  const { animals: all, updateAnimal } = useAnimals(animal?.species || 'sheep')
  if (loading) return <div style={S.page}><Spinner /></div>
  if (!animal) return <div style={S.page}><ErrorMsg message="Animal not found." /></div>
  return <FormInner existing={animal} allAnimals={all} onSave={vals => updateAnimal(id, vals)} />
}
