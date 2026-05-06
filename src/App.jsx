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

function Nav() {
  const navigate   = useNavigate()
  const location   = useLocation()
  const { user, signOut } = useAuth()
  const { isAdmin } = useAdminStatus()
  const [toast, setToast] = useState(null)
  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const isAnimals = location.pathname === '/' || location.pathname.startsWith('/animals') || location.pathname === '/chickens' || location.pathname === '/chickens/new'
  const isPlants  = location.pathname.startsWith('/plants')
  const isPnL     = location.pathname.startsWith('/pnl')
  const isAdmin_  = location.pathname.startsWith('/admin')

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

  const handleSignOut = async () => {
    try { await signOut() } catch (err) { alert(err.message) }
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
        {/* Top bar */}
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
            <button onClick={handleSignOut}
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#a08060', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontFamily: "'Lato',sans-serif", fontWeight: 600 }}>
              Sign Out
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '0 16px' }}>

          {/* Animals dropdown */}
          <Dropdown trigger={open => (
            <div style={tabStyle(isAnimals)}>
              <span style={{ fontSize: 15 }}>🐾</span>
              Animals
              <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 2 }}>{open ? '▲' : '▼'}</span>
            </div>
          )}>
            {close => (
              <>
                <div style={{ padding: '8px 16px 4px', fontSize: 10, fontWeight: 700, color: '#a08060', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Select Animal</div>
                {ANIMALS.map(a => (
                  <button key={a.key}
                    onClick={() => { close(); a.active ? navigate(a.path) : showToast(`${a.emoji} ${a.label} coming soon!`) }}
                    style={dropItemStyle}
                    onMouseEnter={e => e.currentTarget.style.background = '#f7f4ef'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}>
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

          {/* Plants dropdown */}
          <Dropdown trigger={open => (
            <div style={tabStyle(isPlants)}>
              <span style={{ fontSize: 15 }}>🌱</span>
              Plants
              <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 2 }}>{open ? '▲' : '▼'}</span>
            </div>
          )}>
            {close => (
              <>
                <div style={{ padding: '8px 16px 4px', fontSize: 10, fontWeight: 700, color: '#a08060', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Browse Plants</div>
                <button onClick={() => { close(); navigate('/plants') }}
                  style={{ ...dropItemStyle, borderBottom: '1px solid #f0ebe4', marginBottom: 4, paddingBottom: 12 }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f7f4ef'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <span style={{ fontSize: 18 }}>🌱</span>
                  <span style={{ flex: 1 }}>All Plants</span>
                  <span style={{ fontSize: 10, color: '#c8b89a' }}>→</span>
                </button>
                {PLANT_CATEGORIES.map(c => (
                  <button key={c.key} onClick={() => { close(); navigate('/plants') }}
                    style={dropItemStyle}
                    onMouseEnter={e => e.currentTarget.style.background = '#f7f4ef'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <span style={{ fontSize: 18 }}>{c.emoji}</span>
                    <span>{c.label}</span>
                  </button>
                ))}
              </>
            )}
          </Dropdown>

          <div style={{ width: 1, background: 'rgba(255,255,255,0.08)', margin: '8px 4px' }} />

          {/* P&L */}
          <button onClick={() => navigate('/pnl')} style={tabStyle(isPnL)}>
            <span style={{ fontSize: 15 }}>💰</span>
            P & L
          </button>

          {/* Admin tab — only visible to admins */}
          {isAdmin && (
            <>
              <div style={{ width: 1, background: 'rgba(255,80,0,0.3)', margin: '8px 8px' }} />
              <button onClick={() => navigate('/admin')} style={{ ...tabStyle(isAdmin_), color: isAdmin_ ? '#ffcc80' : '#8a5020', borderBottom: isAdmin_ ? '2px solid #ffcc80' : '2px solid transparent' }}>
                <span style={{ fontSize: 15 }}>🔒</span>
                Admin
              </button>
            </>
          )}
        </div>
      </nav>
    </>
  )
}

function FarmApp() {
  return (
    <div style={{ minHeight: '100vh', background: '#f7f4ef', fontFamily: "'Lato',sans-serif", color: '#2c2416' }}>
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
