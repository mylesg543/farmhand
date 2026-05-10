import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAnimals, useSingleAnimal } from '../../hooks/useAnimals'
import { usePhotoUpload } from '../../hooks/usePhotoUpload'
import { useIsMobile } from '../../hooks/useIsMobile'
import { S, Field, Spinner, ErrorMsg, AnimalIllustration, ANIMAL_META, SEX_OPTIONS, CHICKEN_BREEDS } from '../ui/shared'

function AnimalFormInner({ existing, species, onSave }) {
  const isMobile  = useIsMobile()
  const { animals: allAnimals } = useAnimals(species)
  const { upload, uploading }   = usePhotoUpload()
  const meta       = ANIMAL_META[species] || ANIMAL_META.sheep
  const isChicken  = species === 'chickens'
  const defaultSex = isChicken ? 'hen' : 'ewe'
  const sexOptions = SEX_OPTIONS[species] || SEX_OPTIONS.sheep

  const [form, setForm] = useState({
    name:           existing?.name           || '',
    tag_number:     existing?.tag_number     || '',
    sex:            existing?.sex            || defaultSex,
    birth_date:     existing?.birth_date     || '',
    status:         existing?.status         || 'alive',
    notes:          existing?.notes          || '',
    breed:          existing?.breed          || '',
    sire_id:        existing?.sire_id        || '',
    dam_id:         existing?.dam_id         || '',
    photo_url:      existing?.photo_url      || null,
    is_borrowed:    existing?.is_borrowed    || false,
    arrival_date:   existing?.arrival_date   || '',
    departure_date: existing?.departure_date || '',
  })
  const [errors,  setErrors]  = useState({})
  const [saveErr, setSaveErr] = useState('')
  const [saving,  setSaving]  = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const isRented = form.status === 'rented'

  // Include rented/borrowed rams in sire options
  const maleOptions   = allAnimals.filter(a => ['ram','rooster','bull','boar','buck'].includes(a.sex) && a.id !== existing?.id)
  const femaleOptions = allAnimals.filter(a => ['ewe','hen','cow','sow','doe'].includes(a.sex)         && a.id !== existing?.id)

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true); setSaveErr('')
    try {
      const payload = {
        ...form,
        species,
        tag_number:     form.tag_number.trim() || `AUTO-${Date.now()}`,
        sire_id:        form.sire_id        || null,
        dam_id:         form.dam_id         || null,
        breed:          form.breed          || null,
        birth_date:     form.birth_date     || null,
        arrival_date:   form.arrival_date   || null,
        departure_date: form.departure_date || null,
        photo_url:      form.photo_url      || null,
      }
      await onSave(payload)
    } catch (err) {
      setSaveErr(err.message || 'Failed to save. Please try again.')
      setSaving(false)
    }
  }

  const handlePhoto = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const url = await upload(file)
      set('photo_url', url)
    } catch (err) {
      setSaveErr('Photo upload failed: ' + err.message)
    }
  }

  const previewAnimal = { ...form, species }

  return (
    <div style={{ ...S.page, padding: isMobile ? '16px 12px' : '32px 24px' }}>
      <style>{`@media(max-width:767px){.form-grid{grid-template-columns:1fr!important;}.form-cols{grid-template-columns:1fr!important;}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <div style={{ width: 54, height: 54, borderRadius: '50%', background: '#f0ebe4', border: '2px solid #e8e0d0', overflow: 'hidden', flexShrink: 0 }}>
          {form.photo_url
            ? <img src={form.photo_url} alt={form.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
            : <AnimalIllustration animal={previewAnimal} size={54}/>
          }
        </div>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 20 : 24, fontWeight: 700, margin: 0 }}>
          {existing ? `Edit ${existing.name}` : `Add New ${meta.singular}`}
        </h1>
      </div>

      {saveErr && <ErrorMsg message={saveErr}/>}

      <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
        {/* Left col — Identity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ ...S.card, padding: 24 }}>
            <span style={S.sectionLabel}>Identity</span>

            <Field label="Name *" error={errors.name}>
              <input style={S.input} value={form.name} onChange={e => set('name', e.target.value)}
                placeholder={isChicken ? 'e.g. Big Red, Lady' : 'e.g. Bella'} autoFocus/>
            </Field>

            <Field label="Tag / ID Number (optional)">
              <input style={S.input} value={form.tag_number} onChange={e => set('tag_number', e.target.value)}
                placeholder={isChicken ? 'e.g. CHK-001 (optional)' : 'e.g. TAG-001 (optional)'}/>
            </Field>

            <Field label="Sex">
              <select style={{ ...S.input, cursor: 'pointer' }} value={form.sex} onChange={e => set('sex', e.target.value)}>
                {sexOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>

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
                  placeholder="e.g. Merino, Dorper, Suffolk…"/>
              </Field>
            )}

            <Field label="Date of Birth / Hatch Date">
              <input type="date" style={S.input} value={form.birth_date} onChange={e => set('birth_date', e.target.value)}/>
            </Field>

            <Field label="Status">
              <select style={{ ...S.input, cursor: 'pointer' }} value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="alive">Alive</option>
                <option value="rented">Rented / Borrowed</option>
                <option value="sold">Sold</option>
                <option value="deceased">Deceased</option>
              </select>
            </Field>

            {/* Rented fields */}
            {isRented && (
              <div style={{ background: '#fff9e6', border: '1px solid #ffe082', borderRadius: 10, padding: '14px 16px', marginBottom: 4 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#f57f17', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }}>
                  🐑 Rented Animal Dates
                </p>
                <Field label="Arrival Date">
                  <input type="date" style={S.input} value={form.arrival_date} onChange={e => set('arrival_date', e.target.value)}/>
                </Field>
                <Field label="Departure Date (leave blank if still here)">
                  <input type="date" style={S.input} value={form.departure_date} onChange={e => set('departure_date', e.target.value)}/>
                </Field>
                <p style={{ fontSize: 11, color: '#a08060', margin: '4px 0 0' }}>
                  This animal will still appear as a sire option for any offspring born during this period.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right col — Parentage + photo + notes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ ...S.card, padding: 24 }}>
            <span style={S.sectionLabel}>Parentage</span>

            <Field label={isChicken ? 'Sire / Father (optional)' : 'Sire (Father)'}>
              <select style={{ ...S.input, cursor: 'pointer' }} value={form.sire_id} onChange={e => set('sire_id', e.target.value)}>
                <option value="">— Unknown —</option>
                {maleOptions.filter(r => r.status !== 'rented').map(r => (
                  <option key={r.id} value={r.id}>{r.name}{r.tag_number && !r.tag_number.startsWith('AUTO-') ? ` (${r.tag_number})` : ''}</option>
                ))}
                {maleOptions.filter(r => r.status === 'rented').length > 0 && (
                  <optgroup label="Rented / Borrowed">
                    {maleOptions.filter(r => r.status === 'rented').map(r => (
                      <option key={r.id} value={r.id}>🐑 {r.name} (rented{r.arrival_date ? `, arrived ${r.arrival_date}` : ''})</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </Field>

            <Field label={isChicken ? 'Dam / Mother (optional)' : 'Dam (Mother)'}>
              <select style={{ ...S.input, cursor: 'pointer' }} value={form.dam_id} onChange={e => set('dam_id', e.target.value)}>
                <option value="">— Unknown —</option>
                {femaleOptions.map(r => <option key={r.id} value={r.id}>{r.name}{r.tag_number && !r.tag_number.startsWith('AUTO-') ? ` (${r.tag_number})` : ''}</option>)}
              </select>
            </Field>
          </div>

          <div style={{ ...S.card, padding: 24 }}>
            <span style={S.sectionLabel}>Photo</span>
            {form.photo_url && (
              <div style={{ width: 80, height: 80, borderRadius: 10, overflow: 'hidden', marginBottom: 14, border: '2px solid #e8e0d0' }}>
                <img src={form.photo_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
              </div>
            )}
            <label style={{ ...S.btn, ...S.btnSecondary, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, opacity: uploading ? 0.7 : 1 }}>
              {uploading ? 'Uploading…' : '📷 Upload Photo'}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} disabled={uploading}/>
            </label>
            {form.photo_url && (
              <button onClick={() => set('photo_url', null)} style={{ ...S.btn, color: '#c62828', background: 'none', border: 'none', fontSize: 13, cursor: 'pointer', marginLeft: 8 }}>
                Remove
              </button>
            )}
          </div>

          <div style={{ ...S.card, padding: 24 }}>
            <span style={S.sectionLabel}>Notes</span>
            <Field label="Notes (optional)">
              <textarea style={{ ...S.input, minHeight: 80, resize: 'vertical' }} value={form.notes}
                onChange={e => set('notes', e.target.value)} placeholder="Health notes, temperament, special care…"/>
            </Field>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <button onClick={handleSave} disabled={saving}
          style={{ ...S.btn, ...S.btnPrimary, padding: '12px 32px', fontSize: 15, opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving…' : existing ? 'Save Changes' : `Add ${meta.singular}`}
        </button>
        <button onClick={() => window.history.back()} style={{ ...S.btn, ...S.btnSecondary }}>Cancel</button>
      </div>
    </div>
  )
}

// ─── Add page ──────────────────────────────────────────────────────────────────
export function AddAnimalPage({ species }) {
  const navigate = useNavigate()
  const { addAnimal } = useAnimals(species)
  const handleSave = async (payload) => {
    await addAnimal(payload)
    navigate(species === 'chickens' ? '/chickens' : '/')
  }
  return <AnimalFormInner species={species} onSave={handleSave}/>
}

// ─── Edit page ─────────────────────────────────────────────────────────────────
export function EditAnimalPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { animal, loading, error } = useSingleAnimal(id)
  const { updateAnimal } = useAnimals(animal?.species || 'sheep')
  const handleSave = async (payload) => {
    await updateAnimal(id, payload)
    navigate(`/animals/${id}`)
  }
  if (loading) return <div style={S.page}><Spinner/></div>
  if (error || !animal) return <div style={S.page}><ErrorMsg message={error || 'Not found'}/></div>
  return <AnimalFormInner existing={animal} species={animal.species} onSave={handleSave}/>
}
