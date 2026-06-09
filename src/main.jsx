import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

const style = document.createElement('style')
style.textContent = `
  :root {
    color-scheme: light;
    --fh-bg: #f5f7f6;
    --fh-surface: #ffffff;
    --fh-surface-subtle: #f8faf9;
    --fh-surface-strong: #eef3f0;
    --fh-text: #17211c;
    --fh-text-muted: #66736c;
    --fh-text-soft: #89948e;
    --fh-border: #dfe6e2;
    --fh-border-strong: #cbd6d0;
    --fh-brand: #176b47;
    --fh-brand-hover: #12563a;
    --fh-brand-soft: #e8f4ee;
    --fh-accent: #d6a84b;
    --fh-danger: #c43d3d;
    --fh-radius-sm: 8px;
    --fh-radius-md: 10px;
    --fh-shadow-sm: 0 1px 2px rgba(18,38,27,0.04), 0 4px 12px rgba(18,38,27,0.04);
    --fh-shadow-md: 0 10px 30px rgba(18,38,27,0.09);
    --fh-focus: 0 0 0 3px rgba(23,107,71,0.18);
  }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html {
    -webkit-text-size-adjust: 100%;
    min-height: 100%;
    scroll-behavior: auto;
    overscroll-behavior-x: none;
  }
  body {
    min-height: 100%;
    background: var(--fh-bg);
    color: var(--fh-text);
    overflow-x: hidden;
    overscroll-behavior-x: none;
    font-family: 'DM Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }
  h1, h2, h3, h4 {
    font-family: 'Manrope', 'DM Sans', sans-serif !important;
    letter-spacing: 0 !important;
  }
  button, input, select, textarea { font: inherit; }
  button { -webkit-tap-highlight-color: transparent; }
  button:not(:disabled) {
    transition: transform 140ms ease, box-shadow 160ms ease, background-color 160ms ease,
      border-color 160ms ease, color 160ms ease;
  }
  button:not(:disabled):active { transform: translateY(1px) scale(0.99); }
  button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
    outline: none !important;
    border-color: var(--fh-brand) !important;
    box-shadow: var(--fh-focus) !important;
  }
  a:focus-visible {
    outline: 3px solid rgba(23,107,71,0.24);
    outline-offset: 3px;
    border-radius: 4px;
  }
  ::selection { background: #cde9dc; color: #10291e; }
  select { appearance: none; -webkit-appearance: none; }
  button:disabled { opacity: 0.5; cursor: not-allowed !important; }
  input[type="date"]::-webkit-calendar-picker-indicator { opacity: 0.5; cursor: pointer; }
  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb {
    background: #c8d3cd;
    border: 3px solid transparent;
    background-clip: padding-box;
    border-radius: 999px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #aebcb4;
    border: 3px solid transparent;
    background-clip: padding-box;
  }
  .fh-app-shell { min-height: 100vh; background: var(--fh-bg) !important; color: var(--fh-text) !important; }
  .fh-card-interactive {
    transition: transform 160ms ease, box-shadow 180ms ease, border-color 160ms ease;
  }
  @media (hover: hover) and (pointer: fine) {
    .fh-card-interactive:hover {
      transform: translateY(-1px);
      box-shadow: var(--fh-shadow-md) !important;
      border-color: var(--fh-border-strong) !important;
    }
  }
  .fh-skeleton {
    background: linear-gradient(90deg, #edf1ef 25%, #f8faf9 45%, #edf1ef 65%);
    background-size: 220% 100%;
    animation: fh-shimmer 1.25s ease-in-out infinite;
  }
  @keyframes fh-shimmer { to { background-position: -220% 0; } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      scroll-behavior: auto !important;
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
  @media (max-width: 767px) {
    input, select, textarea { font-size: 16px !important; }
    button { min-height: 40px; }
    body { background: #f3f6f4; }
    .fh-card-interactive {
      transform: none !important;
      transition: border-color 120ms ease, background-color 120ms ease;
    }
  }
`
document.head.appendChild(style)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
