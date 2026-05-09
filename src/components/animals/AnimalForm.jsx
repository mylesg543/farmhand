import { useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAnimals, useSingleAnimal } from '../../hooks/useAnimals'
import { usePhotoUpload } from '../../hooks/usePhotoUpload'
import { useIsMobile } from '../../hooks/useIsMobile'
import { S, Field, Spinner, ErrorMsg, AnimalIllustration, SEX_OPTIONS, CHICKEN_BREEDS, ANIMAL_META } from '../ui/shared'

function FormInner({ existing, allAnimals, onSave, species = 'sheep' }) {
  const sexOptions = SEX_OPTIONS[species] || SEX_OPTIONS.sheep
  const defaultSex = sexOptions[0].value

  const [form, setForm] = useState({
    name:       existing?.name       || '',
    tag_number: existing?.tag_number || '',
    sex:        existing?.sex        || defaultSex,
    birth_date: existing?.birth_date || '',
    status:     existing?.status     || 'alive',
    notes:      existing?.notes      || '',
    breed:      existing?.breed      || '',
    sire_id:    existing?.sire_id    || '',
    dam_id:     existing?.dam_id     || '',
    photo_url:  existing?.photo_url  || null,
  })
  const [errors,  setErrors]  = useState({})
  const [saving,  setSaving]  = useState(false)
  const [saveErr, setSaveErr] = useState(null)
  const [dragOver,setDragOver]= useState(false)
  const fileRef   = useRef()
  const navigate  = useNavigate()
  const isMobile  = useIsMobile()
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const meta = ANIMAL_META[species] || ANIMAL_META.sheep

  const loadPhoto = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = e => set('photo_url', e.target.result)
    reader.readAsDataURL(file)
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setSaving(true); setSaveErr(null)
    try {
      const payload = {
        ...form,
        species,
        tag_number: form.tag_number.trim() || `AUTO-${Date.now()}`,
        sire_id: form.sire_id || null,
        dam_id:  form.dam_id  || null,
        breed:   form.breed   || null,
      }
      const saved = await onSave(payload)
      navigate(`/animals/${saved.id}`)
    } catch (err) { setSaveErr(err.message); setSaving(false) }
  }

  // Parentage options per species sex
  const maleOptions   = allAnimals.filter(a => ['ram','rooster','bull','boar','buck'].includes(a.sex) && a.id !== existing?.id)
  const femaleOptions = allAnimals.filter(a => ['ewe','hen','cow','sow','doe'].includes(a.sex)         && a.id !== existing?.id)

  const isChicken  = species === 'chickens'
  const previewAnimal = { ...existing, ...form, id: existing?.id || 'preview', species }

  return (
    <div style={{ ...S.page, padding: isMobile ? '16px 12px' : '32px 24px' }}>
      <div className="form-header" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: isMobile ? 20 : 28 }}>
        <button style={{ ...S.btn, ...S.btnSecondary, padding: '7px 14px' }} onClick={() => navigate(-1)}>← Back</button>
        <div style={{ width: 54, height: 54, borderRadius: '50%', overflow: 'hidden', background: '#f0ebe4', border: '2px solid #e8e0d0', flexShrink: 0 }}>
          <AnimalIllustration animal={previewAnimal} size={54} />
        </div>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 700, margin: 0 }}>
          {existing ? `Edit ${existing.name}` : `Add New ${meta.singular}`}
        </h1>
      </div>

      {saveErr && <ErrorMsg message={saveErr} />}

      <div className="form-cols" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 22 }}>
        {/* Left col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ ...S.card, padding: 26 }}>
            <span style={S.sectionLabel}>Identity</span>

            <Field label="Name *" error={errors.name}>
              <input style={S.input} value={form.name} onChange={e => set('name', e.target.value)}
                placeholder={isChicken ? "e.g. Big Red, Lady" : "e.g. Bella"} />
            </Field>

            <Field label="Tag / ID Number (optional)" error={errors.tag_number}>
              <input style={S.input} value={form.tag_number} onChange={e => set('tag_number', e.target.value)}
                placeholder={isChicken ? "e.g. CHK-001 (optional)" : "e.g. TAG-001 (optional)"} />
            </Field>

            <Field label="Sex">
              <select style={{ ...S.input, cursor: 'pointer' }} value={form.sex} onChange={e => set('sex', e.target.value)}>
                {sexOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>

            {/* Breed — shown for chickens with a dropdown, optional text for others */}
            {isChicken ? (
              <Field label="Breed">
                <select style={{ ...S.input, cursor: 'pointer' }} value={form.breed} onChange={e => set('breed', e.target.value)}>
                  <option value="">— Unknown / Mixed —</option>
                  {CHICKEN_BREEDS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </Field>
            ) : (
              <Field label="Breed (optional)">
                <input style={S.input} value={form.breed} onChange={e => set('breed', e.target.value)}
                  placeholder="e.g. Merino, Dorper, Suffolk…" />
              </Field>
            )}

            <Field label="Date of Birth / Hatch Date">
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

          {/* Photo */}
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
              <div onClick={() => fileRef.current.click()}
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

        {/* Right col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ ...S.card, padding: 26 }}>
            <span style={S.sectionLabel}>Parentage {isChicken && <span style={{ fontSize: 10, fontWeight: 400, color: '#c8b89a' }}>(optional)</span>}</span>
            <Field label={isChicken ? "Sire / Father (optional)" : "Sire (Father)"}>
              <select style={{ ...S.input, cursor: 'pointer' }} value={form.sire_id} onChange={e => set('sire_id', e.target.value)}>
                <option value="">— Unknown —</option>
                {maleOptions.map(r => <option key={r.id} value={r.id}>{r.name} ({r.tag_number})</option>)}
              </select>
            </Field>
            <Field label={isChicken ? "Dam / Mother (optional)" : "Dam (Mother)"}>
              <select style={{ ...S.input, cursor: 'pointer' }} value={form.dam_id} onChange={e => set('dam_id', e.target.value)}>
                <option value="">— Unknown —</option>
                {femaleOptions.map(r => <option key={r.id} value={r.id}>{r.name} ({r.tag_number})</option>)}
              </select>
            </Field>
          </div>
          <div style={{ ...S.card, padding: 26, flex: 1 }}>
            <span style={S.sectionLabel}>Notes</span>
            <textarea style={{ ...S.input, minHeight: 160, resize: 'vertical' }}
              value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder={isChicken
                ? "Laying frequency, temperament, special care notes…"
                : "Any notes about this animal…"} />
          </div>
        </div>
      </div>

      <div className="form-actions" style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 12, marginTop: 22 }}>
        <button style={{ ...S.btn, ...S.btnPrimary, padding: '11px 26px', fontSize: 15, opacity: saving ? 0.7 : 1 }}
          onClick={handleSubmit} disabled={saving}>
          {saving ? 'Saving…' : existing ? 'Save Changes' : `Add ${meta.singular}`}
        </button>
        <button style={{ ...S.btn, ...S.btnSecondary }} onClick={() => navigate(-1)}>Cancel</button>
      </div>
    </div>
  )
}

export function AddAnimalPage({ species = 'sheep' }) {
  const { animals, addAnimal } = useAnimals(species)
  return <FormInner allAnimals={animals} onSave={addAnimal} species={species} />
}

export function EditAnimalPage() {
  const { id }   = useParams()
  const { animal, loading } = useSingleAnimal(id)
  const { animals: all, updateAnimal } = useAnimals(animal?.species || 'sheep')
  if (loading) return <div style={S.page}><Spinner /></div>
  if (!animal) return <div style={S.page}><ErrorMsg message="Animal not found." /></div>
  return <FormInner existing={animal} allAnimals={all} onSave={vals => updateAnimal(id, vals)} species={animal.species} />
}
