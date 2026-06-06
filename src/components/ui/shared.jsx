// ─── Animal & Event Constants ─────────────────────────────────────────────────
export const ANIMAL_META = {
  sheep:    { label: 'Sheep',    singular: 'Sheep',   emoji: '🐑', color: '#795548', light: '#efebe9' },
  chickens: { label: 'Chickens', singular: 'Chicken', emoji: '🐔', color: '#f57f17', light: '#fff9e6' },
  horses:   { label: 'Horses',   singular: 'Horse',   emoji: '🐴', color: '#6d4c41', light: '#f3ede7' },
  cows:     { label: 'Cows',     singular: 'Cow',     emoji: '🐄', color: '#37474f', light: '#eceff1' },
  pigs:     { label: 'Pigs',     singular: 'Pig',     emoji: '🐖', color: '#c2185b', light: '#fce4ec' },
  goats:    { label: 'Goats',    singular: 'Goat',    emoji: '🐐', color: '#558b2f', light: '#f1f8e9' },
}

// Sex options per species
export const SEX_OPTIONS = {
  sheep:    [{ value: 'ewe',     label: 'Ewe (Female)'           },
             { value: 'ram',     label: 'Ram (Male)'             },
             { value: 'wether',  label: 'Wether (Castrated)'     }],
  chickens: [{ value: 'hen',     label: 'Hen (Female)'           },
             { value: 'rooster', label: 'Rooster (Male)'         },
             { value: 'chick',   label: 'Chick (Unsexed)'        }],
  horses:   [{ value: 'mare',    label: 'Mare (Female)'          },
             { value: 'stallion',label: 'Stallion (Male)'        },
             { value: 'gelding', label: 'Gelding (Castrated)'    },
             { value: 'foal',    label: 'Foal'                   }],
  cows:     [{ value: 'cow',     label: 'Cow (Female)'           },
             { value: 'bull',    label: 'Bull (Male)'            },
             { value: 'steer',   label: 'Steer (Castrated)'      }],
  pigs:     [{ value: 'sow',     label: 'Sow (Female)'           },
             { value: 'boar',    label: 'Boar (Male)'            },
             { value: 'barrow',  label: 'Barrow (Castrated)'     }],
  goats:    [{ value: 'doe',     label: 'Doe (Female)'           },
             { value: 'buck',    label: 'Buck (Male)'            },
             { value: 'wether',  label: 'Wether (Castrated)'     }],
}

// Chicken breeds for the form
export const CHICKEN_BREEDS = [
  'Rhode Island Red','Leghorn','Plymouth Rock','Australorp','Orpington',
  'Sussex','Wyandotte','Silkie','Brahma','Cochin','Marans','Easter Egger',
  'Ameraucana','Barnevelder','Welsummer','Jersey Giant','Other',
]

// Event types per species
export const EVENT_TYPES_BY_SPECIES = {
  sheep: [
    { value: 'hoof_trimming', label: 'Hoof Trimming' },
    { value: 'vaccination',   label: 'Vaccination'   },
    { value: 'sickness',      label: 'Sickness'      },
    { value: 'do_not_breed',  label: 'Do Not Breed'  },
    { value: 'lambing',       label: 'Birth'         },
    { value: 'tail_banding',  label: '⭕ Tail Banding' },
    { value: 'shearing',      label: 'Shearing'      },
    { value: 'worming',       label: 'Worming'       },
    { value: 'sale',          label: 'Sale'          },
    { value: 'death',         label: 'Death'         },
    { value: 'custom',        label: 'Custom Event'  },
  ],
  chickens: [
    { value: 'vaccination',   label: 'Vaccination'   },
    { value: 'sickness',      label: 'Sickness'      },
    { value: 'worming',       label: 'Worming'       },
    { value: 'egg_production',label: 'Egg Production'},
    { value: 'moulting',      label: 'Moulting'      },
    { value: 'hatching',      label: 'Hatching'      },
    { value: 'sale',          label: 'Sale'          },
    { value: 'death',         label: 'Death'         },
    { value: 'custom',        label: 'Custom Event'  },
  ],
  horses: [
    { value: 'farrier_visit',    label: 'Farrier Visit'    },
    { value: 'hoof_trimming',    label: 'Hoof Trim'        },
    { value: 'shoeing',          label: 'Shoeing'          },
    { value: 'dental_float',     label: 'Dental Float'     },
    { value: 'coggins_test',     label: 'Coggins Test'     },
    { value: 'worming',          label: 'Deworming'        },
    { value: 'vaccination',      label: 'Vaccination'      },
    { value: 'training_session', label: 'Training Session' },
    { value: 'vet_check',        label: 'Vet Check'        },
    { value: 'injury',           label: 'Injury Check'     },
    { value: 'tack_fitting',     label: 'Tack Fitting'     },
    { value: 'sale',             label: 'Sale'             },
    { value: 'death',            label: 'Death'            },
    { value: 'custom',           label: 'Custom Event'     },
  ],
  default: [
    { value: 'vaccination',   label: 'Vaccination'   },
    { value: 'sickness',      label: 'Sickness'      },
    { value: 'sale',          label: 'Sale'          },
    { value: 'death',         label: 'Death'         },
    { value: 'custom',        label: 'Custom Event'  },
  ],
}

export function getEventTypes(species) {
  return EVENT_TYPES_BY_SPECIES[species] || EVENT_TYPES_BY_SPECIES.default
}

export const BREEDING_RESTRICTION_REASONS = [
  'No milk',
  'Prolapse',
  'Damaged udder',
  'Age',
  'Poor mothering',
  'Difficult lambing',
  'Genetic concern',
  'Vet recommendation',
  'Other',
]

export function breedingRestrictionPayload(reason, date) {
  return {
    breeding_status: 'do_not_breed',
    breeding_restriction_reason: reason,
    breeding_restriction_date: date,
  }
}

export function hasBreedingRestriction(animal) {
  return animal?.breeding_status === 'do_not_breed'
}

export function DoNotBreedBadge({ compact=false, reason }) {
  return (
    <span title={reason ? `Do Not Breed: ${reason}` : 'Do Not Breed'}
      style={{ display:'inline-flex', alignItems:'center', justifyContent:'center',
        padding:compact?'2px 5px':'3px 8px', borderRadius:6,
        background:'#c62828', color:'#fff', border:'1px solid #b71c1c',
        fontSize:compact?8:10, fontWeight:800, lineHeight:1.15,
        textTransform:'uppercase', whiteSpace:'nowrap' }}>
      {compact ? 'DNB' : 'Do Not Breed'}
    </span>
  )
}

export const EVENT_TYPE_META = {
  vaccination:      { icon:'💉', label:'Vaccination',      color:'#1565c0', bg:'#e3f2fd', border:'#90caf9' },
  worming:          { icon:'💊', label:'Worming',           color:'#6a1b9a', bg:'#f3e5f5', border:'#ce93d8' },
  hoof_trimming:    { icon:'✂️', label:'Hoof Trim',         color:'#4e342e', bg:'#efebe9', border:'#bcaaa4' },
  hoof_treatment:   { icon:'🩺', label:'Hoof Treatment',    color:'#4e342e', bg:'#efebe9', border:'#bcaaa4' },
  farrier_visit:    { icon:'🧲', label:'Farrier Visit',     color:'#4e342e', bg:'#efebe9', border:'#bcaaa4' },
  shoeing:          { icon:'🧲', label:'Shoeing',           color:'#37474f', bg:'#eceff1', border:'#b0bec5' },
  dental_float:     { icon:'🦷', label:'Dental Float',      color:'#00695c', bg:'#e0f2f1', border:'#80cbc4' },
  coggins_test:     { icon:'🧪', label:'Coggins Test',      color:'#283593', bg:'#e8eaf6', border:'#9fa8da' },
  training_session: { icon:'🎯', label:'Training Session',  color:'#33691e', bg:'#f1f8e9', border:'#aed581' },
  vet_check:        { icon:'🩺', label:'Vet Check',         color:'#0d47a1', bg:'#e3f2fd', border:'#90caf9' },
  tack_fitting:     { icon:'🎒', label:'Tack Fitting',      color:'#8d6e00', bg:'#fff8e1', border:'#ffe082' },
  shearing:         { icon:'✂️', label:'Shearing',          color:'#2e7d32', bg:'#e8f5e9', border:'#a5d6a7' },
  lambing:          { icon:'🐣', label:'Birth',             color:'#e65100', bg:'#fff3e0', border:'#ffcc80' },
  tail_banding:     { icon:'⭕', label:'Tail Banding',      color:'#6d4c41', bg:'#efebe9', border:'#bcaaa4' },
  weaning:          { icon:'🍼', label:'Weaning',           color:'#f57f17', bg:'#fff9e6', border:'#ffe082' },
  sickness:         { icon:'🤒', label:'Sickness',          color:'#c62828', bg:'#fff3f3', border:'#f5c6c6' },
  injury:           { icon:'🩹', label:'Injury Check',      color:'#c62828', bg:'#fff3f3', border:'#f5c6c6' },
  do_not_breed:     { icon:'!',  label:'Do Not Breed',      color:'#b71c1c', bg:'#ffebee', border:'#ef9a9a' },
  death:            { icon:'•',  label:'Death',             color:'#424242', bg:'#fafafa', border:'#bdbdbd' },
  weight_check:     { icon:'⚖️', label:'Weight Check',      color:'#00695c', bg:'#e0f2f1', border:'#80cbc4' },
  pregnancy_check:  { icon:'🔍', label:'Pregnancy Check',   color:'#ad1457', bg:'#fce4ec', border:'#f48fb1' },
  egg_production:   { icon:'🥚', label:'Egg Production',    color:'#f57f17', bg:'#fff9e6', border:'#ffe082' },
  hatching:         { icon:'🐣', label:'Hatching',          color:'#880e4f', bg:'#fce4ec', border:'#f48fb1' },
  moulting:         { icon:'🪶', label:'Moulting',          color:'#5d4037', bg:'#efebe9', border:'#bcaaa4' },
  breeding:         { icon:'♥',  label:'Breeding',          color:'#ad1457', bg:'#fce4ec', border:'#f48fb1' },
  sale:             { icon:'💰', label:'Sale',              color:'#2e7d32', bg:'#e8f5e9', border:'#a5d6a7' },
  weight:           { icon:'⚖️', label:'Weight',            color:'#00695c', bg:'#e0f2f1', border:'#80cbc4' },
  photo_update:     { icon:'📷', label:'New Photo',         color:'#5a3e1b', bg:'#fdfaf6', border:'#d0c4b0' },
  custom:           { icon:'📝', label:'Custom Event',      color:'#5a3e1b', bg:'#fdfaf6', border:'#d0c4b0' },
}

export function getEventMeta(type, fallbackLabel) {
  return EVENT_TYPE_META[type] || { ...EVENT_TYPE_META.custom, label: fallbackLabel || EVENT_TYPE_META.custom.label }
}

export function statusFromEventType(eventType) {
  if (eventType === 'death' || eventType === 'deceased') return 'deceased'
  if (eventType === 'sale') return 'sold'
  return null
}

// Keep legacy export for backward compat
export const EVENT_TYPES = EVENT_TYPES_BY_SPECIES.sheep

export const EVENT_COLORS = {
  hoof_trimming:  { bg: '#e8f5e9', text: '#2e7d32', border: '#a5d6a7' },
  vaccination:    { bg: '#e3f2fd', text: '#1565c0', border: '#90caf9' },
  sickness:       { bg: '#fff3e0', text: '#e65100', border: '#ffcc80' },
  lambing:        { bg: '#fce4ec', text: '#880e4f', border: '#f48fb1' },
  tail_banding:   { bg: '#efebe9', text: '#6d4c41', border: '#bcaaa4' },
  shearing:       { bg: '#f3e5f5', text: '#6a1b9a', border: '#ce93d8' },
  worming:        { bg: '#e8f5e9', text: '#1b5e20', border: '#81c784' },
  egg_production: { bg: '#fff9c4', text: '#f57f17', border: '#fff176' },
  moulting:       { bg: '#fbe9e7', text: '#bf360c', border: '#ffab91' },
  hatching:       { bg: '#fce4ec', text: '#880e4f', border: '#f48fb1' },
  farrier_visit:  { bg: '#efebe9', text: '#4e342e', border: '#bcaaa4' },
  shoeing:        { bg: '#eceff1', text: '#37474f', border: '#b0bec5' },
  dental_float:   { bg: '#e0f2f1', text: '#00695c', border: '#80cbc4' },
  coggins_test:   { bg: '#e8eaf6', text: '#283593', border: '#9fa8da' },
  training_session: { bg: '#f1f8e9', text: '#33691e', border: '#aed581' },
  vet_check:      { bg: '#e3f2fd', text: '#0d47a1', border: '#90caf9' },
  tack_fitting:   { bg: '#fff8e1', text: '#8d6e00', border: '#ffe082' },
  sale:           { bg: '#f3e5f5', text: '#4a148c', border: '#ce93d8' },
  death:          { bg: '#fafafa', text: '#424242', border: '#bdbdbd' },
  custom:         { bg: '#e0f7fa', text: '#006064', border: '#80deea' },
}

export const STATUS_STYLES = {
  alive:    { bg: '#e8f5e9', text: '#2e7d32' },
  sold:     { bg: '#f3e5f5', text: '#6a1b9a' },
  deceased: { bg: '#fafafa', text: '#616161' },
  rented:   { bg: '#fff9e6', text: '#f57f17' },
}

export const STATUS_DOT = {
  alive: '#4caf50', sold: '#9c27b0', deceased: '#9e9e9e', rented: '#f9a825',
}

// Legacy — kept for components that use it directly
export const SEX_LABELS = {
  ram: 'Ram', ewe: 'Ewe', wether: 'Wether',
  hen: 'Hen', rooster: 'Rooster', chick: 'Chick',
  mare: 'Mare', stallion: 'Stallion', gelding: 'Gelding', foal: 'Foal',
  cow: 'Cow', bull: 'Bull', steer: 'Steer',
  sow: 'Sow', boar: 'Boar', barrow: 'Barrow',
  doe: 'Doe', buck: 'Buck',
}

export function getSexLabel(sex) {
  return SEX_LABELS[sex] || sex || '—'
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function formatDate(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${m}/${day}/${y}`
}

export function calcAge(b) {
  if (!b) return null
  const birth = new Date(b), now = new Date()
  if (Number.isNaN(birth.getTime())) return null
  const days = daysSinceBirth(birth, now)
  if (days !== null && days >= 0 && days <= NEWBORN_DAYS) return 'Newborn'
  const total = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth()
  if (total < 12) return `${total}mo`
  const y = Math.floor(total / 12), mo = total % 12
  return mo > 0 ? `${y}y ${mo}mo` : `${y}y`
}

export const NEWBORN_DAYS = 60

export function daysSinceBirth(birthDate, now = new Date()) {
  if (!birthDate) return null
  const birth = birthDate instanceof Date ? birthDate : new Date(birthDate)
  if (Number.isNaN(birth.getTime())) return null
  return Math.floor((now - birth) / (1000 * 60 * 60 * 24))
}

export function isNewbornAnimal(animal, now = new Date()) {
  const days = daysSinceBirth(animal?.birth_date, now)
  return days !== null && days >= 0 && days <= NEWBORN_DAYS
}

export function fmt(n) { return `$${Number(n).toFixed(2)}` }

export function getAnimalPhotoUrl(animal) {
  if (!animal) return null
  return animal.photo_url || animal.photo || animal.image_url || animal.avatar_url || animal.profile_photo_url || null
}

export function speciesBasePath(species) {
  if (species === 'chickens') return '/chickens'
  if (species === 'horses') return '/horses'
  return '/'
}

export function animalNewPath(species) {
  if (species === 'chickens') return '/chickens/new'
  if (species === 'horses') return '/horses/new'
  return '/animals/new'
}

export function animalBulkPath(species) {
  if (species === 'chickens') return '/chickens/bulk'
  if (species === 'horses') return '/horses/bulk'
  return '/animals/bulk'
}

export function animalBulkEventPath(species, ids) {
  if (species === 'chickens') return `/chickens/bulk-event?ids=${ids}`
  if (species === 'horses') return `/horses/bulk-event?ids=${ids}`
  return `/animals/bulk-event?ids=${ids}`
}

export function animalDetailPath(species, id) {
  if (species === 'chickens') return `/chickens/${id}`
  if (species === 'horses') return `/horses/${id}`
  return `/animals/${id}`
}

export function animalEditPath(species, id) {
  if (species === 'chickens') return `/chickens/${id}/edit`
  if (species === 'horses') return `/horses/${id}/edit`
  return `/animals/${id}/edit`
}

// ─── Shared Styles ────────────────────────────────────────────────────────────
export const S = {
  card: { background: '#fff', borderRadius: 12, border: '1px solid #e8e0d0', boxShadow: '0 1px 4px rgba(44,36,22,0.06)' },
  btn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: "'Lato', sans-serif", fontSize: 14, fontWeight: 600, transition: 'all 0.15s' },
  btnPrimary:   { background: '#5a3e1b', color: '#fff' },
  btnSecondary: { background: '#fff', color: '#5a3e1b', border: '1px solid #c8b89a' },
  btnDanger:    { background: '#fff', color: '#c62828', border: '1px solid #ef9a9a' },
  input: { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #d0c4b0', background: '#fdfaf6', fontFamily: "'Lato', sans-serif", fontSize: 14, color: '#2c2416', outline: 'none', boxSizing: 'border-box' },
  label: { fontSize: 12, fontWeight: 700, color: '#7a6648', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' },
  sectionLabel: { fontSize: 11, fontWeight: 700, color: '#a08060', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16, display: 'block' },
  page: { maxWidth: 1100, margin: '0 auto', padding: '32px 24px' },
}

// ─── Reusable Components ──────────────────────────────────────────────────────
export function Badge({ children, bg, color, style }) {
  return <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', background: bg, color, ...style }}>{children}</span>
}

export function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #e8e0d0', borderTopColor: '#5a3e1b', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export function ErrorMsg({ message }) {
  return <div style={{ background: '#fff3f3', border: '1px solid #f5c6c6', borderRadius: 8, padding: '12px 16px', color: '#c62828', fontSize: 14, marginBottom: 20 }}>{message}</div>
}

export function Field({ label, error, hint, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={S.label}>{label}</label>
      {children}
      {hint  && <p style={{ color: '#a08060', fontSize: 11, marginTop: 4 }}>{hint}</p>}
      {error && <p style={{ color: '#c62828', fontSize: 12, marginTop: 4 }}>{error}</p>}
    </div>
  )
}

export function Checkbox({ checked }) {
  return (
    <div style={{ width: 18, height: 18, borderRadius: 4, border: checked ? '2px solid #5a3e1b' : '2px solid #c8b89a', background: checked ? '#5a3e1b' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
      {checked && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, lineHeight: 1 }}>✓</span>}
    </div>
  )
}

// Chicken illustration
function ChickenSVG({ animal, size }) {
  const isRooster = animal.sex === 'rooster'
  const colors = ['#f57f17','#e65100','#ff8f00','#f9a825','#ef6c00','#d84315']
  const idx = animal.tag_number ? animal.tag_number.charCodeAt(animal.tag_number.length-1) % colors.length : 0
  const bodyColor = colors[idx]
  const tailColor = isRooster ? '#1565c0' : '#795548'
  return (
    <svg viewBox="0 0 72 72" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      {/* Tail feathers */}
      {isRooster ? (
        <>
          <ellipse cx="58" cy="38" rx="10" ry="5" fill="#1565c0" transform="rotate(-30 58 38)"/>
          <ellipse cx="60" cy="44" rx="10" ry="5" fill="#6a1b9a" transform="rotate(-15 60 44)"/>
          <ellipse cx="59" cy="50" rx="10" ry="5" fill="#2e7d32" transform="rotate(5 59 50)"/>
        </>
      ) : (
        <ellipse cx="56" cy="44" rx="8" ry="5" fill={tailColor} transform="rotate(-20 56 44)"/>
      )}
      {/* Body */}
      <ellipse cx="36" cy="46" rx="18" ry="14" fill={bodyColor}/>
      {/* Wing */}
      <ellipse cx="40" cy="46" rx="10" ry="7" fill={bodyColor} opacity="0.7" transform="rotate(-10 40 46)"/>
      {/* Neck */}
      <ellipse cx="24" cy="34" rx="7" ry="10" fill={bodyColor}/>
      {/* Head */}
      <circle cx="22" cy="22" r="10" fill={bodyColor}/>
      {/* Comb */}
      {isRooster ? (
        <>
          <ellipse cx="18" cy="13" rx="3" ry="5" fill="#c62828"/>
          <ellipse cx="22" cy="11" rx="3" ry="5" fill="#c62828"/>
          <ellipse cx="26" cy="13" rx="3" ry="5" fill="#c62828"/>
        </>
      ) : (
        <ellipse cx="22" cy="13" rx="4" ry="4" fill="#c62828"/>
      )}
      {/* Wattle */}
      <ellipse cx="17" cy="28" rx="3" ry="4" fill="#c62828"/>
      {/* Beak */}
      <path d="M12 22 L8 25 L12 28 Z" fill="#f9a825"/>
      {/* Eye */}
      <circle cx="18" cy="20" r="3" fill="#fff"/>
      <circle cx="18" cy="20" r="1.5" fill="#1a1a1a"/>
      <circle cx="18.5" cy="19.5" r="0.5" fill="#fff"/>
      {/* Legs */}
      <line x1="30" y1="58" x2="26" y2="66" stroke="#f9a825" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="38" y1="58" x2="42" y2="66" stroke="#f9a825" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Feet */}
      <line x1="26" y1="66" x2="22" y2="68" stroke="#f9a825" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="26" y1="66" x2="26" y2="70" stroke="#f9a825" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="26" y1="66" x2="30" y2="68" stroke="#f9a825" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="42" y1="66" x2="38" y2="68" stroke="#f9a825" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="42" y1="66" x2="42" y2="70" stroke="#f9a825" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="42" y1="66" x2="46" y2="68" stroke="#f9a825" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

// Sheep illustration
function SheepSVG({ animal, size }) {
  const woolColors = ['#e8ddd0','#d4c8b8','#c8baa8','#ddd4c8','#e0d8cc','#ccc0b0']
  const faceColors = ['#c8a87a','#b89060','#a07848','#c09060','#b88858','#a87040']
  const idx = animal.tag_number ? animal.tag_number.charCodeAt(animal.tag_number.length - 1) % woolColors.length : 0
  const wool = woolColors[idx], face = faceColors[idx]
  const isRam = animal.sex === 'ram'
  return (
    <svg viewBox="0 0 72 72" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="36" cy="46" rx="22" ry="16" fill={wool}/>
      <circle cx="20" cy="44" r="10" fill={wool}/><circle cx="52" cy="44" r="10" fill={wool}/>
      <circle cx="26" cy="38" r="11" fill={wool}/><circle cx="46" cy="38" r="11" fill={wool}/>
      <circle cx="36" cy="36" r="12" fill={wool}/>
      <rect x="24" y="58" width="5" height="10" rx="2" fill={face}/>
      <rect x="32" y="60" width="5" height="8" rx="2" fill={face}/>
      <rect x="43" y="58" width="5" height="10" rx="2" fill={face}/>
      <rect x="35" y="60" width="5" height="8" rx="2" fill={face}/>
      <ellipse cx="36" cy="22" rx="11" ry="10" fill={face}/>
      {isRam ? (
        <><path d="M25 20 Q18 14 20 22" stroke={face} strokeWidth="4" strokeLinecap="round" fill="none"/><path d="M47 20 Q54 14 52 22" stroke={face} strokeWidth="4" strokeLinecap="round" fill="none"/></>
      ) : (
        <><ellipse cx="23" cy="17" rx="4" ry="6" fill={face} transform="rotate(-20 23 17)"/><ellipse cx="49" cy="17" rx="4" ry="6" fill={face} transform="rotate(20 49 17)"/></>
      )}
      <circle cx="31" cy="20" r="2.5" fill="#2c2416"/><circle cx="41" cy="20" r="2.5" fill="#2c2416"/>
      <circle cx="31.8" cy="19.2" r="0.8" fill="#fff"/><circle cx="41.8" cy="19.2" r="0.8" fill="#fff"/>
      <ellipse cx="36" cy="26" rx="3" ry="2" fill={wool} opacity="0.6"/>
      <circle cx="34.5" cy="26" r="0.8" fill="#2c2416" opacity="0.5"/><circle cx="37.5" cy="26" r="0.8" fill="#2c2416" opacity="0.5"/>
      {isRam && <><path d="M25 16 Q16 8 18 18" stroke="#8d6e63" strokeWidth="3" strokeLinecap="round" fill="none"/><path d="M47 16 Q56 8 54 18" stroke="#8d6e63" strokeWidth="3" strokeLinecap="round" fill="none"/></>}
    </svg>
  )
}

// Dispatcher — picks the right illustration per species
function HorseSVG({ animal, size }) {
  const coatColors = ['#8d6e63', '#6d4c41', '#4e342e', '#a1887f', '#5d4037', '#795548']
  const maneColors = ['#3e2723', '#2c2416', '#6d4c41', '#1f1710']
  const idx = animal.tag_number ? animal.tag_number.charCodeAt(animal.tag_number.length - 1) % coatColors.length : 0
  const coat = coatColors[idx]
  const mane = maneColors[idx % maneColors.length]
  return (
    <svg viewBox="0 0 72 72" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="38" cy="43" rx="22" ry="12" fill={coat}/>
      <path d="M22 41 Q20 28 30 20 Q38 15 45 23 Q36 26 32 36 L31 46 Z" fill={coat}/>
      <path d="M28 20 Q32 15 39 14 Q35 22 35 33 Q30 29 28 20Z" fill={mane}/>
      <path d="M34 18 L31 8 L39 17 Z" fill={coat}/>
      <path d="M45 23 L49 13 L51 26 Z" fill={coat}/>
      <path d="M57 40 Q65 35 66 28" stroke={mane} strokeWidth="4" strokeLinecap="round" fill="none"/>
      <rect x="25" y="51" width="5" height="14" rx="2" fill={coat}/>
      <rect x="36" y="52" width="5" height="13" rx="2" fill={coat}/>
      <rect x="48" y="51" width="5" height="14" rx="2" fill={coat}/>
      <path d="M21 47 Q17 53 17 64" stroke={coat} strokeWidth="5" strokeLinecap="round" fill="none"/>
      <circle cx="31" cy="27" r="2.2" fill="#1f1710"/>
      <circle cx="31.7" cy="26.2" r="0.7" fill="#fff"/>
      <ellipse cx="25" cy="35" rx="2" ry="1.2" fill="#2c2416" opacity="0.5"/>
      <path d="M22 40 Q26 43 31 41" stroke="#2c2416" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.35"/>
    </svg>
  )
}

export function AnimalIllustration({ animal, size = 52, forceIllustration = false }) {
  const photoUrl = getAnimalPhotoUrl(animal)
  if (photoUrl && !forceIllustration) {
    return <img src={photoUrl} alt={animal.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
  }
  if (animal.species === 'chickens') return <ChickenSVG animal={animal} size={size} />
  if (animal.species === 'horses') return <HorseSVG animal={animal} size={size} />
  return <SheepSVG animal={animal} size={size} />
}

export function AnimalAvatar({ animal, size = 52, style }) {
  const photoUrl = getAnimalPhotoUrl(animal)
  if (photoUrl) {
    return (
      <>
        <img
          src={photoUrl}
          alt={animal?.name || 'Animal'}
          style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', ...style }}
          onError={(e) => {
            e.currentTarget.style.display = 'none'
            const fallback = e.currentTarget.nextElementSibling
            if (fallback) fallback.style.display = 'flex'
          }}
        />
        <span style={{ display:'none', width:'100%', height:'100%', alignItems:'center', justifyContent:'center' }}>
          <AnimalIllustration animal={animal || { species:'sheep', name:'Animal' }} size={size} forceIllustration />
        </span>
      </>
    )
  }
  return <AnimalIllustration animal={animal || { species:'sheep', name:'Animal' }} size={size} forceIllustration />
}
