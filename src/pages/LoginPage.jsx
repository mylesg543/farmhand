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
      } else {
        if (!email.trim()) throw new Error('Enter your email address')
        await resetPassword(email)
        setSuccess('Reset link sent! Check your inbox.')
        setMode('login')
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const inp = {
    width: '100%', padding: '11px 13px', borderRadius: 8,
    border: '1px solid #cbd6d0', background: '#fff',
    fontFamily: "'DM Sans',sans-serif", fontSize: 16, color: '#17211c',
    outline: 'none', boxSizing: 'border-box', marginBottom: 10,
  }
  const lbl = {
    fontSize: 12, fontWeight: 700, color: '#536259',
    display: 'block', marginBottom: 4,
    letterSpacing: '0',
  }
  const link = {
    background: 'none', border: 'none', color: '#176b47',
    cursor: 'pointer', fontSize: 13, fontWeight: 700,
    fontFamily: "'DM Sans',sans-serif", textDecoration: 'none', padding: 0,
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#191c1f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans',sans-serif", padding: 16,
    }}>
      <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:10,
            fontFamily: "'Manrope',sans-serif", fontSize: 27, fontWeight: 800, color: '#fff' }}>
            <span style={{ width:38, height:38, borderRadius:10, background:'#2f9e68',
              display:'inline-flex', alignItems:'center', justifyContent:'center',
              fontSize:13, fontWeight:800, boxShadow:'inset 0 0 0 1px rgba(255,255,255,0.15)' }}>FH</span>
            FarmHand
          </div>
          <div style={{ fontSize: 12, color: '#91a49a', marginTop: 7 }}>
            Clear records. Healthier animals. Better decisions.
          </div>
        </div>

        {/* ── Tour CTA — prominent at top ── */}
        {mode === 'login' && (
          <button
            onClick={() => window.location.href = '/demo'}
            style={{
              width: '100%', padding: '15px 20px',
              borderRadius: 10,
              border: '1px solid rgba(112,210,157,0.32)',
              background: 'rgba(47,158,104,0.12)',
              cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
              display: 'flex', alignItems: 'center', gap: 14,
              textAlign: 'left', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(47,158,104,0.2)'; e.currentTarget.style.borderColor='rgba(112,210,157,0.55)' }}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(47,158,104,0.12)'; e.currentTarget.style.borderColor='rgba(112,210,157,0.32)' }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 9, background: '#2f9e68',
              color:'#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight:800, flexShrink: 0 }}>
              DEMO
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 2 }}>
                Explore a working demo farm
              </div>
              <div style={{ fontSize: 12, color: '#a9bbb1' }}>
                No account needed · Guided product tour
              </div>
            </div>
            <div style={{ fontSize: 18, color: '#70d29d' }}>→</div>
          </button>
        )}

        {/* Divider */}
        {mode === 'login' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }}/>
            <span style={{ fontSize: 11, color: '#789084', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              or sign in
            </span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }}/>
          </div>
        )}

        {/* ── Sign in card ── */}
        <div style={{ background: '#fff', borderRadius: 12, padding: isMobile ? '22px 20px' : '28px 32px',
          border:'1px solid rgba(255,255,255,0.35)', boxShadow: '0 24px 70px rgba(4,18,11,0.32)' }}>
          <h2 style={{ fontFamily: "'Manrope',sans-serif", fontSize: 19, fontWeight: 800, color: '#17211c', margin: '0 0 4px', textAlign: 'center' }}>
            {mode === 'login' ? 'Sign in to your farm' : mode === 'signup' ? 'Create your account' : 'Reset password'}
          </h2>
          <p style={{ fontSize: 12, color: '#66736c', textAlign: 'center', margin: '0 0 18px' }}>
            {mode === 'login' ? 'Welcome back' : mode === 'signup' ? "Get started — it's free" : "We'll send you a reset link"}
          </p>

          {error   && <div style={{ background:'#fff3f3', border:'1px solid #f5c6c6', borderRadius:7, padding:'9px 13px', color:'#c62828', fontSize:13, marginBottom:12 }}>{error}</div>}
          {success && <div style={{ background:'#f1f8f1', border:'1px solid #a5d6a7', borderRadius:7, padding:'9px 13px', color:'#2e7d32', fontSize:13, marginBottom:12 }}>{success}</div>}

          <label style={lbl}>Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&handleSubmit()} placeholder="you@example.com"
            autoComplete="email" style={inp}/>

          {mode !== 'forgot' && (
            <>
              <label style={lbl}>Password</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&handleSubmit()}
                placeholder={mode==='signup'?'At least 6 characters':'••••••••'}
                autoComplete={mode==='signup'?'new-password':'current-password'} style={inp}/>
            </>
          )}

          {mode === 'signup' && (
            <>
              <label style={lbl}>Confirm Password</label>
              <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&handleSubmit()}
                placeholder="Repeat your password" autoComplete="new-password" style={inp}/>
            </>
          )}

          <button onClick={handleSubmit} disabled={loading}
            style={{ width:'100%', padding:'11px', borderRadius:8, border:'none', cursor:'pointer',
              fontFamily:"'DM Sans',sans-serif", fontSize:15, fontWeight:700,
              background:'#176b47', color:'#fff', opacity:loading?0.7:1,
              transition:'background 0.15s', marginTop:4, marginBottom:16 }}
            onMouseEnter={e=>{ if(!loading) e.currentTarget.style.background='#12563a' }}
            onMouseLeave={e=>{ e.currentTarget.style.background='#176b47' }}>
            {loading ? 'Please wait…' : mode==='login' ? 'Sign In' : mode==='signup' ? 'Create Account' : 'Send Reset Link'}
          </button>

          {mode === 'login' && (
            <div style={{ display:'flex', flexDirection:'column', gap:7, textAlign:'center' }}>
              <div style={{ fontSize:13, color:'#536259' }}>
                No account?{' '}<button onClick={()=>switchMode('signup')} style={link}>Create one free</button>
              </div>
              <button onClick={()=>switchMode('forgot')} style={{ background:'none', border:'none', color:'#66736c', cursor:'pointer', fontSize:12, fontFamily:"'DM Sans',sans-serif", padding:0 }}>
                Forgot password?
              </button>
            </div>
          )}
          {mode === 'signup' && (
            <div style={{ textAlign:'center', fontSize:13, color:'#536259' }}>
              Already have an account?{' '}<button onClick={()=>switchMode('login')} style={link}>Sign in</button>
            </div>
          )}
          {mode === 'forgot' && (
            <div style={{ textAlign:'center' }}>
              <button onClick={()=>switchMode('login')} style={{ background:'none', border:'none', color:'#66736c', cursor:'pointer', fontSize:13, fontFamily:"'DM Sans',sans-serif", padding:0 }}>← Back to sign in</button>
            </div>
          )}
        </div>

        <p style={{ textAlign:'center', fontSize:11, color:'rgba(255,255,255,0.2)', marginTop:2 }}>
          Free · Private · No credit card
        </p>
      </div>
    </div>
  )
}
