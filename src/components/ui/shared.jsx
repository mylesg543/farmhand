// ─── Animal & Event Constants ─────────────────────────────────────────────────
export const ANIMAL_META = {
  sheep:    { label: 'Sheep',    emoji: '🐑', color: '#795548', light: '#efebe9' },
  chickens: { label: 'Chickens', emoji: '🐔', color: '#f57f17', light: '#fff9e6' },
  cows:     { label: 'Cows',     emoji: '🐄', color: '#37474f', light: '#eceff1' },
  pigs:     { label: 'Pigs',     emoji: '🐖', color: '#c2185b', light: '#fce4ec' },
  goats:    { label: 'Goats',    emoji: '🐐', color: '#558b2f', light: '#f1f8e9' },
}

export const EVENT_TYPES = [
  { value: 'hoof_trimming', label: 'Hoof Trimming' },
  { value: 'vaccination',   label: 'Vaccination'   },
  { value: 'sickness',      label: 'Sickness'      },
  { value: 'lambing',       label: 'Lambing'       },
  { value: 'sale',          label: 'Sale'          },
  { value: 'death',         label: 'Death'         },
  { value: 'custom',        label: 'Custom Event'  },
]

export const EVENT_COLORS = {
  hoof_trimming: { bg: '#e8f5e9', text: '#2e7d32', border: '#a5d6a7' },
  vaccination:   { bg: '#e3f2fd', text: '#1565c0', border: '#90caf9' },
  sickness:      { bg: '#fff3e0', text: '#e65100', border: '#ffcc80' },
  lambing:       { bg: '#fce4ec', text: '#880e4f', border: '#f48fb1' },
  sale:          { bg: '#f3e5f5', text: '#4a148c', border: '#ce93d8' },
  death:         { bg: '#fafafa', text: '#424242', border: '#bdbdbd' },
  custom:        { bg: '#e0f7fa', text: '#006064', border: '#80deea' },
}

export const STATUS_STYLES = {
  alive:    { bg: '#e8f5e9', text: '#2e7d32' },
  sold:     { bg: '#f3e5f5', text: '#6a1b9a' },
  deceased: { bg: '#fafafa', text: '#616161' },
}

export const STATUS_DOT = {
  alive: '#4caf50', sold: '#9c27b0', deceased: '#9e9e9e',
}

export const SEX_LABELS = { ram: 'Ram', ewe: 'Ewe', wether: 'Wether' }

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function formatDate(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

export function calcAge(b) {
  if (!b) return null
  const birth = new Date(b), now = new Date()
  const total = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth()
  if (total < 1) return 'Newborn'
  if (total < 12) return `${total}mo`
  const y = Math.floor(total / 12), mo = total % 12
  return mo > 0 ? `${y}y ${mo}mo` : `${y}y`
}

export function fmt(n) { return `$${Number(n).toFixed(2)}` }

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

// Sheep illustration SVG
export function AnimalIllustration({ animal, size = 52 }) {
  if (animal.photo_url) {
    return <img src={animal.photo_url} alt={animal.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
  }
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
