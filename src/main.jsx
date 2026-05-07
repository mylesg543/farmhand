import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

const style = document.createElement('style')
style.textContent = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #f7f4ef; }
  select { appearance: none; }
  button:disabled { opacity: 0.5; cursor: not-allowed !important; }
  input[type="date"]::-webkit-calendar-picker-indicator { opacity: 0.5; cursor: pointer; }

  /* ── Mobile overrides (< 768px) ── */
  @media (max-width: 767px) {
    /* Tighter page padding */
    [style*="padding: 32px 24px"] { padding: 16px 14px !important; }

    /* Hero sections — no horizontal scroll */
    [style*="overflow-x: auto"] { padding-bottom: 16px; }

    /* Cards full width */
    [style*="maxWidth: 1100"] { max-width: 100% !important; }
    [style*="maxWidth: 1060"] { max-width: 100% !important; }

    /* Two column grids → single column */
    [style*="gridTemplateColumns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
    [style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }

    /* Animal grid — 1 column on small phones, 2 on larger */
    [style*="minmax(270px"] { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)) !important; }
    [style*="minmax(260px"] { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)) !important; }
    [style*="minmax(280px"] { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)) !important; }

    /* Buttons — larger tap targets */
    button { min-height: 36px; }

    /* Inputs — prevent zoom on iOS */
    input, select, textarea { font-size: 16px !important; }

    /* Form row stacking */
    [style*="gridTemplateColumns: 1fr 1fr 1fr"] { grid-template-columns: 1fr !important; }
    [style*="gridTemplateColumns: 1fr 2fr 1fr"] { grid-template-columns: 1fr !important; }
    [style*="gridTemplateColumns: 1fr 1fr 1fr 1fr"] { grid-template-columns: 1fr 1fr !important; }

    /* P&L summary tiles — 2 col */
    [style*="minmax(145px"] { grid-template-columns: repeat(3, 1fr) !important; }
    [style*="minmax(150px"] { grid-template-columns: repeat(3, 1fr) !important; }

    /* Admin stats */
    [style*="repeat(3, 1fr)"] { grid-template-columns: repeat(2, 1fr) !important; }
    [style*="repeat(5, 1fr)"] { grid-template-columns: repeat(3, 1fr) !important; }

    /* Hero strips — touch scroll */
    .hero-strip { -webkit-overflow-scrolling: touch; }
  }
`
document.head.appendChild(style)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
