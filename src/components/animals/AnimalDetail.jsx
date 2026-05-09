import { useParams, useNavigate } from 'react-router-dom'
import { useSingleAnimal, useAnimals } from '../../hooks/useAnimals'
import { useIsMobile } from '../../hooks/useIsMobile'
import { EventList } from '../events/EventList'
import { S, AnimalIllustration, Spinner, ErrorMsg, STATUS_DOT, SEX_LABELS, formatDate, calcAge, ANIMAL_META } from '../ui/shared'

export function AnimalDetailPage() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const isMobile   = useIsMobile()
  const { animal, loading, error } = useSingleAnimal(id)
  const { animals: allAnimals, deleteAnimal, updateAnimal } = useAnimals(animal?.species || 'sheep')
  const meta = ANIMAL_META[animal?.species] || ANIMAL_META.sheep

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${animal.name}? This also deletes all their events and cannot be undone.`)) return
    try { await deleteAnimal(id); navigate(animal.species === 'chickens' ? '/chickens' : '/') }
    catch (err) { alert(err.message) }
  }

  const handleStatusChange = async (newStatus) => {
    try { await updateAnimal(id, { status: newStatus }) }
    catch (err) { alert(err.message) }
  }

  if (loading) return <div style={{ padding: 32 }}><Spinner /></div>
  if (error || !animal) return <div style={{ padding: 32 }}><ErrorMsg message={error || 'Animal not found.'} /></div>

  const sire = allAnimals.find(a => a.id === animal.sire_id)
  const dam  = allAnimals.find(a => a.id === animal.dam_id)

  const backPath = animal.species === 'chickens' ? '/chickens' : '/'

  return (
    <div>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(160deg,#2c2416 0%,#4a3520 60%,#6b4f2e 100%)', padding: isMobile ? '16px 16px 24px' : '24px 24px 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* Back button */}
          <button onClick={() => navigate(backPath)}
            style={{ ...S.btn, background: 'rgba(255,255,255,0.1)', color: '#f0e6cc', border: '1px solid rgba(255,255,255,0.2)', padding: '7px 14px', fontSize: 13, marginBottom: 16 }}>
            ← {meta.label}
          </button>

          {/* Main hero content */}
          <div style={{ display: 'flex', gap: isMobile ? 14 : 20, alignItems: isMobile ? 'flex-start' : 'center' }}>
            {/* Avatar */}
            <div style={{ width: isMobile ? 64 : 84, height: isMobile ? 64 : 84, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '3px solid rgba(255,255,255,0.2)', overflow: 'hidden', flexShrink: 0 }}>
              <AnimalIllustration animal={animal} size={isMobile ? 64 : 84} />
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 20 : 26, fontWeight: 700, color: '#f0e6cc', margin: 0 }}>
                  {animal.name}
                </h1>
                <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: STATUS_DOT[animal.status], color: '#fff', textTransform: 'uppercase' }}>
                  {animal.status}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: '#a08060' }}>{SEX_LABELS[animal.sex] || animal.sex}</span>
                {animal.tag_number && !animal.tag_number.startsWith('AUTO-') && (
                  <span style={{ fontSize: 12, color: '#a08060', fontFamily: 'monospace' }}>{animal.tag_number}</span>
                )}
                {animal.breed && <span style={{ fontSize: 12, color: '#c8a878', fontStyle: 'italic' }}>{animal.breed}</span>}
              </div>

              {/* Meta row */}
              <div style={{ display: 'flex', gap: isMobile ? 14 : 24, flexWrap: 'wrap' }}>
                {[
                  ['Born', animal.birth_date ? `${formatDate(animal.birth_date)}${isMobile ? '' : ` (${calcAge(animal.birth_date)})`}` : '—'],
                  animal.birth_date && isMobile ? ['Age', calcAge(animal.birth_date)] : null,
                  ['Sire', sire?.name || 'Unknown'],
                  ['Dam',  dam?.name  || 'Unknown'],
                ].filter(Boolean).map(([l, v]) => (
                  <div key={l}>
                    <p style={{ fontSize: 9, color: '#7a6040', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 1px' }}>{l}</p>
                    <p style={{ fontSize: isMobile ? 12 : 13, color: '#c8a878', margin: 0 }}>{v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions — right side on desktop, hidden on mobile (shown below) */}
            {!isMobile && (
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => navigate(`/animals/${id}/edit`)}
                  style={{ ...S.btn, background: 'rgba(255,255,255,0.1)', color: '#f0e6cc', border: '1px solid rgba(255,255,255,0.2)', padding: '7px 14px', fontSize: 13 }}>
                  Edit
                </button>
                <button onClick={handleDelete}
                  style={{ ...S.btn, background: 'rgba(255,80,80,0.15)', color: '#ef9a9a', border: '1px solid rgba(255,80,80,0.25)', padding: '7px 14px', fontSize: 13 }}>
                  Delete
                </button>
              </div>
            )}
          </div>

          {/* Mobile action buttons — full width below */}
          {isMobile && (
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={() => navigate(`/animals/${id}/edit`)}
                style={{ ...S.btn, flex: 1, justifyContent: 'center', background: 'rgba(255,255,255,0.12)', color: '#f0e6cc', border: '1px solid rgba(255,255,255,0.2)', padding: '10px' }}>
                ✎ Edit
              </button>
              <button onClick={handleDelete}
                style={{ ...S.btn, flex: 1, justifyContent: 'center', background: 'rgba(255,80,80,0.15)', color: '#ef9a9a', border: '1px solid rgba(255,80,80,0.25)', padding: '10px' }}>
                🗑 Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '16px 12px' : '32px 24px' }}>
        {animal.notes && (
          <div style={{ ...S.card, padding: isMobile ? 16 : 22, marginBottom: 16 }}>
            <span style={S.sectionLabel}>Notes</span>
            <p style={{ fontSize: 14, lineHeight: 1.7, margin: 0, color: '#4a3c28' }}>{animal.notes}</p>
          </div>
        )}
        <EventList
          animalId={id}
          animalName={animal.name}
          species={animal.species || 'sheep'}
          onStatusChange={handleStatusChange}
        />
      </div>
    </div>
  )
}
