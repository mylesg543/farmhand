import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

const S = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #2c2416 0%, #4a3520 50%, #6b4f2e 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Lato', sans-serif",
    padding: 24,
  },
  card: {
    background: '#fff',
    borderRadius: 16,
    padding: '40px 44px',
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  logo: {
    textAlign: 'center',
    marginBottom: 32,
  },
  logoText: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 28,
    fontWeight: 700,
    color: '#2c2416',
    display: 'block',
    marginBottom: 4,
  },
  logoSub: {
    fontSize: 12,
    color: '#a08060',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    fontWeight: 600,
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 22,
    fontWeight: 700,
    color: '#2c2416',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#a08060',
    textAlign: 'center',
    marginBottom: 28,
  },
  label: {
    fontSize: 12,
    fontWeight: 700,
    color: '#7a6648',
    marginBottom: 6,
    display: 'block',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  input: {
    width: '100%',
    padding: '11px 14px',
    borderRadius: 8,
    border: '1px solid #d0c4b0',
    background: '#fdfaf6',
    fontFamily: "'Lato', sans-serif",
    fontSize: 14,
    color: '#2c2416',
    outline: 'none',
    boxSizing: 'border-box',
    marginBottom: 16,
  },
  btn: {
    width: '100%',
    padding: '12px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    fontFamily: "'Lato', sans-serif",
    fontSize: 15,
    fontWeight: 700,
    transition: 'all 0.15s',
  },
  btnPrimary: {
    background: '#5a3e1b',
    color: '#fff',
  },
  error: {
    background: '#fff3f3',
    border: '1px solid #f5c6c6',
    borderRadius: 8,
    padding: '10px 14px',
    color: '#c62828',
    fontSize: 13,
    marginBottom: 16,
  },
  success: {
    background: '#f1f8f1',
    border: '1px solid #a5d6a7',
    borderRadius: 8,
    padding: '10px 14px',
    color: '#2e7d32',
    fontSize: 13,
    marginBottom: 16,
  },
  link: {
    background: 'none',
    border: 'none',
    color: '#5a3e1b',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "'Lato', sans-serif",
    textDecoration: 'underline',
    padding: 0,
  },
  divider: {
    textAlign: 'center',
    color: '#c8b89a',
    fontSize: 12,
    margin: '20px 0',
  },
}

export function LoginPage() {
  const { signIn, signUp, resetPassword } = useAuth()
  const [mode,     setMode]     = useState('login')   // login | signup | forgot
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')

  const reset = () => { setError(''); setSuccess(''); setPassword(''); setConfirm('') }
  const switchMode = (m) => { reset(); setMode(m) }

  const handleSubmit = async () => {
    setError(''); setSuccess(''); setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
        // Auth state change will redirect automatically
      } else if (mode === 'signup') {
        if (!email.trim())    throw new Error('Email is required')
        if (password.length < 6) throw new Error('Password must be at least 6 characters')
        if (password !== confirm)  throw new Error('Passwords do not match')
        await signUp(email, password)
        setSuccess('Account created! Check your email to confirm your address, then sign in.')
        setMode('login')
      } else if (mode === 'forgot') {
        if (!email.trim()) throw new Error('Enter your email address')
        await resetPassword(email)
        setSuccess('Password reset email sent! Check your inbox.')
        setMode('login')
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSubmit() }

  return (
    <div style={S.page}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Lato:wght@400;600;700&display=swap" rel="stylesheet" />
      <div style={S.card}>

        {/* Logo */}
        <div style={S.logo}>
          <span style={S.logoText}>🌾 FarmHand</span>
          <span style={S.logoSub}>Farm Management</span>
        </div>

        {/* Title */}
        <h2 style={S.title}>
          {mode === 'login'  ? 'Sign in to your farm'  :
           mode === 'signup' ? 'Create your account'   :
                               'Reset your password'}
        </h2>
        <p style={S.subtitle}>
          {mode === 'login'  ? 'Welcome back'                        :
           mode === 'signup' ? 'Set up your farm management account' :
                               'We\'ll send you a reset link'}
        </p>

        {/* Messages */}
        {error   && <div style={S.error}>{error}</div>}
        {success && <div style={S.success}>{success}</div>}

        {/* Form */}
        <div>
          <label style={S.label}>Email Address</label>
          <input
            style={S.input}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="you@example.com"
            autoComplete="email"
          />

          {mode !== 'forgot' && (
            <>
              <label style={S.label}>Password</label>
              <input
                style={S.input}
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
            </>
          )}

          {mode === 'signup' && (
            <>
              <label style={S.label}>Confirm Password</label>
              <input
                style={S.input}
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Repeat your password"
                autoComplete="new-password"
              />
            </>
          )}

          <button
            style={{ ...S.btn, ...S.btnPrimary, opacity: loading ? 0.7 : 1, marginTop: 4 }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Please wait…' :
             mode === 'login'  ? 'Sign In'         :
             mode === 'signup' ? 'Create Account'  :
                                 'Send Reset Link'}
          </button>
        </div>

        {/* Mode switchers */}
        <div style={S.divider}>─────────</div>

        {mode === 'login' && (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 13, color: '#7a6648' }}>
              Don't have an account?{' '}
              <button style={S.link} onClick={() => switchMode('signup')}>Create one</button>
            </div>
            <div>
              <button style={S.link} onClick={() => switchMode('forgot')}>Forgot password?</button>
            </div>
            <div style={{ marginTop: 4, paddingTop: 14, borderTop: '1px solid #f0ebe4' }}>
              <button
                onClick={() => window.location.href = '/demo'}
                style={{ width: '100%', padding: '11px', borderRadius: 8, border: '1px solid #c8b89a', background: '#fdfaf6', cursor: 'pointer', fontFamily: "'Lato', sans-serif", fontSize: 14, fontWeight: 600, color: '#5a3e1b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                🌾 Take a Tour — See a Demo Farm
              </button>
            </div>
          </div>
        )}

        {mode === 'signup' && (
          <div style={{ textAlign: 'center', fontSize: 13, color: '#7a6648' }}>
            Already have an account?{' '}
            <button style={S.link} onClick={() => switchMode('login')}>Sign in</button>
          </div>
        )}

        {mode === 'forgot' && (
          <div style={{ textAlign: 'center', fontSize: 13, color: '#7a6648' }}>
            <button style={S.link} onClick={() => switchMode('login')}>← Back to sign in</button>
          </div>
        )}
      </div>
    </div>
  )
}
