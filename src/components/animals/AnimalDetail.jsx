import { useParams, useNavigate } from 'react-router-dom'
import { useSingleAnimal, useAnimals } from '../../hooks/useAnimals'
import { EventList } from '../events/EventList'
import { S, Badge, AnimalIllustration, Spinner, ErrorMsg, STATUS_STYLES, STATUS_DOT, SEX_LABELS, formatDate, calcAge, ANIMAL_META } from '../ui/shared'

export function AnimalDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { animal, loading, error } = useSingleAnimal(id)
  const { animals: allAnimals, deleteAnimal, updateAnimal } = useAnimals(animal?.species || 'sheep')
  const meta = ANIMAL_META[animal?.species] || ANIMAL_META.sheep

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${animal.name}? This also deletes all their events and cannot be undone.`)) return
    try { await deleteAnimal(id); navigate('/') }
    catch (err) { alert(err.message) }
  }

  const handleStatusChange = async (newStatus) => {
    try { await updateAnimal(id, { status: newStatus }) }
    catch (err) { alert(err.message) }
  }

  if (loading) return <div style={S.page}><Spinner /></div>
  if (error || !animal) return <div style={S.page}><ErrorMsg message={error || 'Animal not found.'} /></div>

  const sire = allAnimals.find(a => a.id === animal.sire_id)
  const dam  = allAnimals.find(a => a.id === animal.dam_id)
  const st   = STATUS_STYLES[animal.status] || STATUS_STYLES.alive

  return (
    <div>
      <style>{`
        @media (max-width: 640px) {
          .detail-hero-inner { flex-direction: column !important; align-items: flex-start !important; gap: 16px !important; }
          .detail-hero-avatar { width: 64px !important; height: 64px !important; }
          .detail-hero-name { font-size: 22px !important; }
          .detail-hero-meta { flex-wrap: wrap !important; gap: 12px 20px !important; }
          .detail-hero-actions { width: 100% !important; justify-content: flex-end !important; }
          .detail-back { margin-bottom: 0 !important; }
        }
      `}</style>
      {/* Detail hero */}
      <div style={{ background: 'linear-gradient(160deg,#2c2416 0%,#4a3520 60%,#6b4f2e 100%)', padding: '20px 20px 28px' }}>
        <div className="detail-hero-inner" style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <button className="detail-back" onClick={() => navigate(animal.species === 'chickens' ? '/chickens' : '/')}
            style={{ ...S.btn, background: 'rgba(255,255,255,0.1)', color: '#f0e6cc', border: '1px solid rgba(255,255,255,0.2)', padding: '7px 14px', fontSize: 13, flexShrink: 0 }}>
            ← {meta.label}
          </button>
          <div className="detail-hero-avatar" style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '3px solid rgba(255,255,255,0.2)', overflow: 'hidden', flexShrink: 0 }}>
            <AnimalIllustration animal={animal} size={80} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
              <h1 className="detail-hero-name" style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: '#f0e6cc', margin: 0 }}>{animal.name}</h1>
              <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: STATUS_DOT[animal.status], color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{animal.status}</span>
              <span style={{ fontSize: 12, color: '#a08060' }}>{SEX_LABELS[animal.sex] || animal.sex}</span>
            </div>
            {animal.tag_number && !animal.tag_number.startsWith('AUTO-') && (
              <p style={{ fontSize: 13, color: '#a08060', margin: '0 0 4px', fontFamily: 'monospace' }}>{animal.tag_number}</p>
            )}
            {animal.breed && <p style={{ fontSize: 13, color: '#c8a878', margin: '0 0 10px', fontStyle: 'italic' }}>{animal.breed}</p>}
            <div className="detail-hero-meta" style={{ display: 'flex', gap: 20 }}>
              {[
                ['Born', animal.birth_date ? `${formatDate(animal.birth_date)} (${calcAge(animal.birth_date)})` : '—'],
                ['Sire', sire ? sire.name : 'Unknown'],
                ['Dam',  dam  ? dam.name  : 'Unknown'],
              ].map(([l, v]) => (
                <div key={l}>
                  <p style={{ fontSize: 10, color: '#7a6040', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 2px' }}>{l}</p>
                  <p style={{ fontSize: 13, color: '#c8a878', margin: 0 }}>{v}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="detail-hero-actions" style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button onClick={() => navigate(`/animals/${id}/edit`)} style={{ ...S.btn, background: 'rgba(255,255,255,0.1)', color: '#f0e6cc', border: '1px solid rgba(255,255,255,0.2)', padding: '7px 14px', fontSize: 13 }}>Edit</button>
            <button onClick={handleDelete} style={{ ...S.btn, background: 'rgba(255,80,80,0.15)', color: '#ef9a9a', border: '1px solid rgba(255,80,80,0.25)', padding: '7px 14px', fontSize: 13 }}>Delete</button>
          </div>
        </div>
      </div>

      <div style={S.page}>
        {animal.notes && (
          <div style={{ ...S.card, padding: 22, marginBottom: 22 }}>
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
