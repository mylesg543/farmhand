import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

const style = document.createElement('style')
style.textContent = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { -webkit-text-size-adjust: 100%; }
  body { background: #f7f4ef; overflow-x: hidden; }
  select { appearance: none; -webkit-appearance: none; }
  button:disabled { opacity: 0.5; cursor: not-allowed !important; }
  input[type="date"]::-webkit-calendar-picker-indicator { opacity: 0.5; cursor: pointer; }

  /* Prevent iOS input zoom — font-size must be 16px+ */
  @media (max-width: 767px) {
    input, select, textarea { font-size: 16px !important; }
    /* Smooth scrolling for hero strips */
    * { -webkit-overflow-scrolling: touch; }
    /* Larger tap targets */
    button { min-height: 40px; }
  }
`
document.head.appendChild(style)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
