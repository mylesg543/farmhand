import React, { useState, useRef, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { useAdminStatus } from './hooks/useAdmin'
import { LoginPage } from './pages/LoginPage'
import { AdminPage } from './pages/AdminPage'
import { AnimalListPage } from './components/animals/AnimalList'
import { AnimalDetailPage } from './components/animals/AnimalDetail'
import { AddAnimalPage, EditAnimalPage } from './components/animals/AnimalForm'
import { BulkAddPage } from './components/animals/BulkAddPage'
import { PlantsPage } from './components/plants/PlantsPage'
import { PnLPage } from './components/costs/PnLPage'

// ─── Responsive hook ──────────────────────────────────────────────────────────
function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const ANIMALS = [
  { key: 'sheep',    label: 'Sheep',    emoji: '🐑', path: '/',         active: true  },
  { key: 'chickens', label: 'Chickens', emoji: '🐔', path: '/chickens', active: true  },
  { key: 'cows',     label: 'Cows',     emoji: '🐄', path: null,        active: false },
  { key: 'pigs',     label: 'Pigs',     emoji: '🐖', path: null,        active: false },
  { key: 'goats',    label: 'Goats',    emoji: '🐐', path: null,        active: false },
]

const PLANT_CATEGORIES = [
  { key: 'fruit_tree', label: 'Fruit Trees',     emoji: '🍎' },
  { key: 'nut_tree',   label: 'Nut Trees',        emoji: '🌰' },
  { key: 'shade_tree', label: 'Shade Trees',      emoji: '🌳' },
  { key: 'vegetable',  label: 'Vegetable Garden', emoji: '🥕' },
  { key: 'herb',       label: 'Herb Garden',      emoji: '🌿' },
  { key: 'flower',     label: 'Flowers',          emoji: '🌸' },
  { key: 'other',      label: 'Other',            emoji: '🪴' },
]

// ─── Desktop dropdown ─────────────────────────────────────────────────────────
function Dropdown({ trigger, children }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div onClick={() => setOpen(v => !v)}>{trigger(open)}</div>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 500, background: '#fff', borderRadius: 10, boxShadow: '0 8px 32px rgba(44,36,22,0.18)', border: '1px solid #e8e0d0', minWidth: 200, padding: '6px 0', marginTop: 6 }}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}

// ─── Mobile sheet (slides up from bottom) ─────────────────────────────────────
function MobileSheet({ title, children, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 800, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={onClose} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: '20px 20px 0 0', padding: '0 0 40px', maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 12px', borderBottom: '1px solid #f0ebe4' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#2c2416', fontFamily: "'Lato',sans-serif" }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, color: '#a08060', cursor: 'pointer', lineHeight: 1, padding: 0 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ─── Desktop nav ──────────────────────────────────────────────────────────────
function DesktopNav({ user, isAdmin, navigate, location, signOut }) {
  const [toast, setToast] = useState(null)
  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const isAnimals = location.pathname === '/' || location.pathname.startsWith('/animals') || location.pathname === '/chickens' || location.pathname === '/chickens/new' || location.pathname === '/chickens/bulk'
  const isPlants  = location.pathname.startsWith('/plants')
  const isPnL     = location.pathname.startsWith('/pnl')
  const isAdminP  = location.pathname.startsWith('/admin')

  const tabStyle = active => ({
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 13, fontWeight: 600,
    color: active ? '#f0e6cc' : '#6a5040',
    borderBottom: active ? '2px solid #c8a060' : '2px solid transparent',
    transition: 'all 0.15s', fontFamily: "'Lato',sans-serif", whiteSpace: 'nowrap',
  })

  const dropItemStyle = {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
    color: '#2c2416', width: '100%', border: 'none',
    background: 'none', fontFamily: "'Lato',sans-serif", textAlign: 'left',
  }

  return (
    <>
      {toast && (
        <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 600, background: '#2c2416', color: '#f0e6cc', borderRadius: 10, padding: '12px 22px', fontSize: 13, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap' }}>
          {toast}
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: '#a08060', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
        </div>
      )}
      <nav style={{ background: '#2c2416', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 24px', height: 52, gap: 12 }}>
          <span onClick={() => navigate('/')} style={{ fontFamily: "'Playfair Display',serif", fontSize: 19, fontWeight: 700, color: '#f0e6cc', cursor: 'pointer', letterSpacing: '0.01em' }}>
            🌾 FarmHand
          </span>
          <span style={{ fontSize: 11, color: '#6a5040', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Farm Management</span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4caf50' }} />
              <span style={{ fontSize: 12, color: '#a08060' }}>{user?.email?.split('@')[0]}</span>
              {isAdmin && <span style={{ fontSize: 9, fontWeight: 700, background: '#fff3e0', color: '#e65100', padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase' }}>Admin</span>}
            </div>
            <button onClick={signOut} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#a08060', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontFamily: "'Lato',sans-serif", fontWeight: 600 }}>Sign Out</button>
          </div>
        </div>
        <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '0 16px' }}>
          <Dropdown trigger={open => (
            <div style={tabStyle(isAnimals)}>
              <span style={{ fontSize: 15 }}>🐾</span>Animals
              <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 2 }}>{open ? '▲' : '▼'}</span>
            </div>
          )}>
            {close => (
              <>
                <div style={{ padding: '8px 16px 4px', fontSize: 10, fontWeight: 700, color: '#a08060', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Select Animal</div>
                {ANIMALS.map(a => (
                  <button key={a.key} onClick={() => { close(); a.active ? navigate(a.path) : showToast(`${a.emoji} ${a.label} coming soon!`) }}
                    style={dropItemStyle} onMouseEnter={e => e.currentTarget.style.background = '#f7f4ef'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <span style={{ fontSize: 18 }}>{a.emoji}</span>
                    <span style={{ flex: 1 }}>{a.label}</span>
                    {!a.active && <span style={{ fontSize: 9, fontWeight: 700, background: '#f0e8d8', color: '#a08060', padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase' }}>Soon</span>}
                    {a.active && <span style={{ fontSize: 10, color: '#c8b89a' }}>→</span>}
                  </button>
                ))}
              </>
            )}
          </Dropdown>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.08)', margin: '8px 4px' }} />
          <Dropdown trigger={open => (
            <div style={tabStyle(isPlants)}>
              <span style={{ fontSize: 15 }}>🌱</span>Plants
              <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 2 }}>{open ? '▲' : '▼'}</span>
            </div>
          )}>
            {close => (
              <>
                <div style={{ padding: '8px 16px 4px', fontSize: 10, fontWeight: 700, color: '#a08060', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Browse Plants</div>
                <button onClick={() => { close(); navigate('/plants') }}
                  style={{ ...dropItemStyle, borderBottom: '1px solid #f0ebe4', marginBottom: 4, paddingBottom: 12 }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f7f4ef'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <span style={{ fontSize: 18 }}>🌱</span><span style={{ flex: 1 }}>All Plants</span><span style={{ fontSize: 10, color: '#c8b89a' }}>→</span>
                </button>
                {PLANT_CATEGORIES.map(c => (
                  <button key={c.key} onClick={() => { close(); navigate('/plants') }}
                    style={dropItemStyle} onMouseEnter={e => e.currentTarget.style.background = '#f7f4ef'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <span style={{ fontSize: 18 }}>{c.emoji}</span><span>{c.label}</span>
                  </button>
                ))}
              </>
            )}
          </Dropdown>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.08)', margin: '8px 4px' }} />
          <button onClick={() => navigate('/pnl')} style={tabStyle(isPnL)}>
            <span style={{ fontSize: 15 }}>💰</span>P & L
          </button>
          {isAdmin && (
            <>
              <div style={{ width: 1, background: 'rgba(255,80,0,0.3)', margin: '8px 8px' }} />
              <button onClick={() => navigate('/admin')} style={{ ...tabStyle(isAdminP), color: isAdminP ? '#ffcc80' : '#8a5020', borderBottom: isAdminP ? '2px solid #ffcc80' : '2px solid transparent' }}>
                <span style={{ fontSize: 15 }}>🔒</span>Admin
              </button>
            </>
          )}
        </div>
      </nav>
    </>
  )
}

// ─── Mobile nav — bottom tab bar + top header ─────────────────────────────────
function MobileNav({ user, isAdmin, navigate, location, signOut }) {
  const [sheet, setSheet] = useState(null) // null | 'animals' | 'plants' | 'more'
  const [toast, setToast] = useState(null)
  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const isAnimals = location.pathname === '/' || location.pathname.startsWith('/animals') || location.pathname.startsWith('/chickens')
  const isPlants  = location.pathname.startsWith('/plants')
  const isPnL     = location.pathname.startsWith('/pnl')
  const isAdminP  = location.pathname.startsWith('/admin')

  const tabBtn = (active, emoji, label, onClick) => (
    <button onClick={onClick} style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
      background: 'none', border: 'none', cursor: 'pointer', padding: '8px 4px',
      fontFamily: "'Lato',sans-serif",
    }}>
      <span style={{ fontSize: 22 }}>{emoji}</span>
      <span style={{ fontSize: 10, fontWeight: 700, color: active ? '#c8a060' : '#6a5040', letterSpacing: '0.03em' }}>{label}</span>
      {active && <div style={{ width: 20, height: 2, borderRadius: 1, background: '#c8a060' }} />}
    </button>
  )

  const sheetItem = (emoji, label, sub, onClick, badge) => (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 14, width: '100%', border: 'none',
      background: 'none', padding: '14px 20px', cursor: 'pointer', fontFamily: "'Lato',sans-serif",
      borderBottom: '1px solid #f7f4ef', textAlign: 'left',
    }}>
      <span style={{ fontSize: 26, flexShrink: 0 }}>{emoji}</span>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: '#2c2416', margin: 0 }}>{label}</p>
        {sub && <p style={{ fontSize: 12, color: '#a08060', margin: '2px 0 0' }}>{sub}</p>}
      </div>
      {badge && <span style={{ fontSize: 9, fontWeight: 700, background: '#f0e8d8', color: '#a08060', padding: '2px 7px', borderRadius: 10, textTransform: 'uppercase' }}>{badge}</span>}
      {!badge && <span style={{ color: '#c8b89a', fontSize: 18 }}>›</span>}
    </button>
  )

  return (
    <>
      {toast && (
        <div style={{ position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)', zIndex: 700, background: '#2c2416', color: '#f0e6cc', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', whiteSpace: 'nowrap', zIndex: 900 }}>
          {toast}
        </div>
      )}

      {/* Mobile top header — compact */}
      <div style={{ background: '#2c2416', padding: '0 16px', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <span onClick={() => navigate('/')} style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 700, color: '#f0e6cc', cursor: 'pointer' }}>
          🌾 FarmHand
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: '#a08060' }}>{user?.email?.split('@')[0]}</span>
          {isAdmin && <span style={{ fontSize: 9, fontWeight: 700, background: '#fff3e0', color: '#e65100', padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase' }}>Admin</span>}
        </div>
      </div>

      {/* Bottom tab bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
        background: '#2c2416', borderTop: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {tabBtn(isAnimals,  '🐾', 'Animals', () => setSheet('animals'))}
        {tabBtn(isPlants,   '🌱', 'Plants',  () => setSheet('plants'))}
        {tabBtn(isPnL,      '💰', 'P & L',   () => navigate('/pnl'))}
        {tabBtn(isAdminP || sheet === 'more', '⚙️', 'More', () => setSheet('more'))}
      </div>

      {/* Animals sheet */}
      {sheet === 'animals' && (
        <MobileSheet title="Animals" onClose={() => setSheet(null)}>
          {ANIMALS.map(a => sheetItem(
            a.emoji, a.label,
            a.active ? 'Tap to view' : null,
            () => { setSheet(null); a.active ? navigate(a.path) : showToast(`${a.emoji} ${a.label} coming soon!`) },
            !a.active ? 'Soon' : null
          ))}
        </MobileSheet>
      )}

      {/* Plants sheet */}
      {sheet === 'plants' && (
        <MobileSheet title="Plants & Trees" onClose={() => setSheet(null)}>
          {sheetItem('🌱', 'All Plants', 'View and manage all plants', () => { setSheet(null); navigate('/plants') })}
          {PLANT_CATEGORIES.map(c => sheetItem(c.emoji, c.label, null, () => { setSheet(null); navigate('/plants') }))}
        </MobileSheet>
      )}

      {/* More sheet */}
      {sheet === 'more' && (
        <MobileSheet title="More" onClose={() => setSheet(null)}>
          {isAdmin && sheetItem('🔒', 'Admin Portal', 'View all farms', () => { setSheet(null); navigate('/admin') })}
          {sheetItem('👤', user?.email?.split('@')[0] || 'Account', user?.email, null)}
          <button onClick={() => { setSheet(null); signOut() }}
            style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', border: 'none', background: 'none', padding: '16px 20px', cursor: 'pointer', fontFamily: "'Lato',sans-serif", color: '#c62828' }}>
            <span style={{ fontSize: 22 }}>🚪</span>
            <span style={{ fontSize: 15, fontWeight: 700 }}>Sign Out</span>
          </button>
        </MobileSheet>
      )}
    </>
  )
}

// ─── Unified Nav ──────────────────────────────────────────────────────────────
function Nav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signOut } = useAuth()
  const { isAdmin } = useAdminStatus()
  const isMobile = useIsMobile()

  const handleSignOut = async () => {
    try { await signOut() } catch (err) { alert(err.message) }
  }

  if (isMobile) {
    return <MobileNav user={user} isAdmin={isAdmin} navigate={navigate} location={location} signOut={handleSignOut} />
  }
  return <DesktopNav user={user} isAdmin={isAdmin} navigate={navigate} location={location} signOut={handleSignOut} />
}

// ─── Farm App ─────────────────────────────────────────────────────────────────
function FarmApp() {
  const isMobile = useIsMobile()
  return (
    <div style={{
      minHeight: '100vh',
      background: '#f7f4ef',
      fontFamily: "'Lato',sans-serif",
      color: '#2c2416',
      paddingBottom: isMobile ? 80 : 0, // room for bottom tab bar
    }}>
      <Nav />
      <Routes>
        <Route path="/"                   element={<AnimalListPage species="sheep" />} />
        <Route path="/animals/new"        element={<AddAnimalPage species="sheep" />} />
        <Route path="/animals/bulk"       element={<BulkAddPage species="sheep" />} />
        <Route path="/animals/:id"        element={<AnimalDetailPage />} />
        <Route path="/animals/:id/edit"   element={<EditAnimalPage />} />
        <Route path="/chickens"           element={<AnimalListPage species="chickens" />} />
        <Route path="/chickens/new"       element={<AddAnimalPage species="chickens" />} />
        <Route path="/chickens/bulk"      element={<BulkAddPage species="chickens" />} />
        <Route path="/plants"             element={<PlantsPage />} />
        <Route path="/pnl"               element={<PnLPage />} />
        <Route path="/admin"             element={<AdminPage />} />
      </Routes>
    </div>
  )
}

// ─── Auth Gate ────────────────────────────────────────────────────────────────
function AuthGate() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#2c2416', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🌾</div>
          <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: '#f0e6cc' }}>FarmHand</p>
          <p style={{ fontSize: 13, color: '#a08060', marginTop: 8 }}>Loading your farm…</p>
        </div>
      </div>
    )
  }
  if (!user) return <LoginPage />
  return <FarmApp />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AuthGate />
      </BrowserRouter>
    </AuthProvider>
  )
}
