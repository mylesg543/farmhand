import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { AnimalListPage } from './components/animals/AnimalList'
import { AnimalDetailPage } from './components/animals/AnimalDetail'
import { AddAnimalPage, EditAnimalPage } from './components/animals/AnimalForm'
import { CostsPage } from './components/costs/CostsPage'

const NAV_ANIMALS = [
  { key: 'sheep',    label: 'Sheep',    emoji: '🐑', path: '/',        active: true  },
  { key: 'chickens', label: 'Chickens', emoji: '🐔', path: null,       active: false },
  { key: 'cows',     label: 'Cows',     emoji: '🐄', path: null,       active: false },
  { key: 'pigs',     label: 'Pigs',     emoji: '🐖', path: null,       active: false },
  { key: 'goats',    label: 'Goats',    emoji: '🐐', path: null,       active: false },
]

function Nav() {
  const navigate = useNavigate()
  const location = useLocation()
  const [toast, setToast] = React.useState(null)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const onAnimalTab = (a) => {
    if (a.active) navigate(a.path)
    else showToast(`${a.emoji} ${a.label} management coming soon!`)
  }

  const isHome = location.pathname === '/' || location.pathname.startsWith('/animals')
  const isCosts = location.pathname === '/costs'

  return (
    <>
      {toast && (
        <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 300, background: '#2c2416', color: '#f0e6cc', borderRadius: 10, padding: '12px 22px', fontSize: 13, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap' }}>
          {toast}
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: '#a08060', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
        </div>
      )}
      <nav style={{ background: '#2c2416', position: 'sticky', top: 0, zIndex: 100 }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 28px', height: 52, gap: 12 }}>
          <span onClick={() => navigate('/')} style={{ fontFamily: "'Playfair Display',serif", fontSize: 19, fontWeight: 700, color: '#f0e6cc', cursor: 'pointer', letterSpacing: '0.01em' }}>
            🌾 FarmHand
          </span>
          <span style={{ fontSize: 11, color: '#6a5040', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Farm Management</span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4caf50' }} />
            <span style={{ fontSize: 12, color: '#a08060' }}>Your Farm</span>
          </div>
        </div>
        {/* Tab bar */}
        <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '0 20px' }}>
          {NAV_ANIMALS.map(a => (
            <button key={a.key} onClick={() => onAnimalTab(a)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: (a.active && isHome) ? '#f0e6cc' : '#6a5040', borderBottom: (a.active && isHome) ? '2px solid #c8a060' : '2px solid transparent', transition: 'all 0.15s', fontFamily: "'Lato',sans-serif" }}>
              <span style={{ fontSize: 15 }}>{a.emoji}</span>
              {a.label}
              {!a.active && <span style={{ fontSize: 9, fontWeight: 700, background: 'rgba(255,255,255,0.07)', color: '#6a5040', padding: '1px 5px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Soon</span>}
            </button>
          ))}
          <div style={{ width: 1, background: 'rgba(255,255,255,0.08)', margin: '8px 8px', flexShrink: 0 }} />
          <button onClick={() => navigate('/costs')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: isCosts ? '#f0e6cc' : '#6a5040', borderBottom: isCosts ? '2px solid #c8a060' : '2px solid transparent', transition: 'all 0.15s', fontFamily: "'Lato',sans-serif" }}>
            <span style={{ fontSize: 15 }}>💰</span>
            Costs
          </button>
        </div>
      </nav>
    </>
  )
}

// Need React for useState in Nav
import React from 'react'

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', background: '#f7f4ef', fontFamily: "'Lato',sans-serif", color: '#2c2416' }}>
        <Nav />
        <Routes>
          <Route path="/"                element={<AnimalListPage species="sheep" />} />
          <Route path="/animals/new"     element={<AddAnimalPage />} />
          <Route path="/animals/:id"     element={<AnimalDetailPage />} />
          <Route path="/animals/:id/edit" element={<EditAnimalPage />} />
          <Route path="/costs"           element={<CostsPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
