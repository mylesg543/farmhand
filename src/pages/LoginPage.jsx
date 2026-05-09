import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useIsMobile } from '../hooks/useIsMobile'

export function LoginPage() {
  const { signIn, signUp, resetPassword } = useAuth()
  const isMobile = useIsMobile()
  const [mode,     setMode]     = useState('login')
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
      } else if (mode === 'signup') {
        if (!email.trim())        throw new Error('Email is required')
        if (password.length < 6)  throw new Error('Password must be at least 6 characters')
        if (password !== confirm)  throw new Error('Passwords do not match')
        await signUp(email, password)
        setSuccess('Account created! Check your email to confirm, then sign in.')
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

  const inp = {
    width: '100%', padding: '11px 14px', borderRadius: 8,
    border: '1px solid #d0c4b0', background: '#fdfaf6',
    fontFamily: "'Lato',sans-serif", fontSize: 16, color: '#2c2416',
    outline: 'none', boxSizing: 'border-box', marginBottom: 14,
  }
  const lbl = {
    fontSize: 11, fontWeight: 700, color: '#7a6648', marginBottom: 5,
    display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em',
  }
  const link = {
    background: 'none', border: 'none', color: '#5a3e1b', cursor: 'pointer',
    fontSize: 13, fontWeight: 700, fontFamily: "'Lato',sans-serif",
    textDecoration: 'underline', padding: 0,
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg,#2c2416 0%,#4a3520 50%,#6b4f2e 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Lato',sans-serif",
      padding: isMobile ? 16 : 24,
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Lato:wght@400;600;700&display=swap" rel="stylesheet"/>

      <div style={{
        width: '100%',
        maxWidth: 420,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 4 }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 26 : 30, fontWeight: 700, color: '#f0e6cc' }}>
            🌾 FarmHand
          </div>
          <div style={{ fontSize: 11, color: '#a08060', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, marginTop: 3 }}>
            Farm Management
          </div>
        </div>

        {/* ── Tour CTA — hero button ── */}
        {mode === 'login' && (
          <button
            onClick={() => window.location.href = '/demo'}
            style={{
              width: '100%',
              padding: isMobile ? '18px 20px' : '20px 24px',
              borderRadius: 14,
              border: '2px solid rgba(200,160,96,0.5)',
              background: 'rgba(200,160,96,0.12)',
              cursor: 'pointer',
              fontFamily: "'Lato',sans-serif",
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              backdropFilter: 'blur(4px)',
              transition: 'all 0.2s',
              textAlign: 'left',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(200,160,96,0.2)'; e.currentTarget.style.borderColor = 'rgba(200,160,96,0.8)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(200,160,96,0.12)'; e.currentTarget.style.borderColor = 'rgba(200,160,96,0.5)'; e.currentTarget.style.transform = '' }}
          >
            <div style={{ width: isMobile ? 44 : 52, height: isMobile ? 44 : 52, borderRadius: 12, background: '#c8a060', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 22 : 26, flexShrink: 0 }}>
              🌾
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: isMobile ? 15 : 16, fontWeight: 700, color: '#f0e6cc', marginBottom: 3 }}>
                Take a Tour — See a Demo Farm
              </div>
              <div style={{ fontSize: 12, color: '#c8a878', lineHeight: 1.4 }}>
                No account needed · Walk through animals, P&L &amp; dashboard in 2 min
              </div>
            </div>
            <div style={{ fontSize: 20, color: '#c8a060', flexShrink: 0 }}>→</div>
          </button>
        )}

        {/* Divider */}
        {mode === 'login' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }}/>
            <span style={{ fontSize: 11, color: '#7a6040', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>or sign in</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }}/>
          </div>
        )}

        {/* Sign in / sign up card */}
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: isMobile ? '28px 22px' : '36px 40px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
        }}>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: '#2c2416', margin: '0 0 4px', textAlign: 'center' }}>
            {mode === 'login'  ? 'Sign in to your farm'  :
             mode === 'signup' ? 'Create your account'   :
                                 'Reset your password'}
          </h2>
          <p style={{ fontSize: 13, color: '#a08060', textAlign: 'center', margin: '0 0 22px' }}>
            {mode === 'login'  ? 'Welcome back'                          :
             mode === 'signup' ? "Get started — it's free"               :
                                 "We'll send you a reset link"}
          </p>

          {error   && <div style={{ background:'#fff3f3', border:'1px solid #f5c6c6', borderRadius:8, padding:'10px 14px', color:'#c62828', fontSize:13, marginBottom:14 }}>{error}</div>}
          {success && <div style={{ background:'#f1f8f1', border:'1px solid #a5d6a7', borderRadius:8, padding:'10px 14px', color:'#2e7d32', fontSize:13, marginBottom:14 }}>{success}</div>}

          <label style={lbl}>Email Address</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={handleKeyDown} placeholder="you@example.com" autoComplete="email" style={inp}/>

          {mode !== 'forgot' && (
            <>
              <label style={lbl}>Password</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={handleKeyDown} placeholder={mode==='signup'?'At least 6 characters':'••••••••'} autoComplete={mode==='signup'?'new-password':'current-password'} style={inp}/>
            </>
          )}

          {mode === 'signup' && (
            <>
              <label style={lbl}>Confirm Password</label>
              <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} onKeyDown={handleKeyDown} placeholder="Repeat your password" autoComplete="new-password" style={inp}/>
            </>
          )}

          <button onClick={handleSubmit} disabled={loading}
            style={{ width:'100%', padding:'13px', borderRadius:8, border:'none', cursor:'pointer', fontFamily:"'Lato',sans-serif", fontSize:15, fontWeight:700, background:'#5a3e1b', color:'#f0e6cc', opacity:loading?0.7:1, transition:'background 0.15s', marginBottom: 18, marginTop: 2 }}
            onMouseEnter={e=>{ if(!loading) e.currentTarget.style.background='#3d2910' }}
            onMouseLeave={e=>{ e.currentTarget.style.background='#5a3e1b' }}>
            {loading ? 'Please wait…' :
             mode==='login'  ? 'Sign In'        :
             mode==='signup' ? 'Create Account' :
                               'Send Reset Link'}
          </button>

          {mode === 'login' && (
            <div style={{ display:'flex', flexDirection:'column', gap:8, textAlign:'center' }}>
              <div style={{ fontSize:13, color:'#7a6648' }}>
                No account?{' '}<button onClick={()=>switchMode('signup')} style={link}>Create one free</button>
              </div>
              <button onClick={()=>switchMode('forgot')} style={{ background:'none', border:'none', color:'#a08060', cursor:'pointer', fontSize:12, fontFamily:"'Lato',sans-serif", padding:0 }}>Forgot password?</button>
            </div>
          )}
          {mode === 'signup' && (
            <div style={{ textAlign:'center', fontSize:13, color:'#7a6648' }}>
              Already have an account?{' '}<button onClick={()=>switchMode('login')} style={link}>Sign in</button>
            </div>
          )}
          {mode === 'forgot' && (
            <div style={{ textAlign:'center' }}>
              <button onClick={()=>switchMode('login')} style={{ background:'none', border:'none', color:'#a08060', cursor:'pointer', fontSize:13, fontFamily:"'Lato',sans-serif", padding:0 }}>← Back to sign in</button>
            </div>
          )}
        </div>

        <p style={{ textAlign:'center', fontSize:11, color:'rgba(255,255,255,0.25)', marginTop:4 }}>
          Free to use · Private &amp; secure · No credit card
        </p>
      </div>
    </div>
  )
}
