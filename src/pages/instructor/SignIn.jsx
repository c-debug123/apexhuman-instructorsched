import { useApp } from '../../context/AppContext'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

export default function SignIn() {
  const { signInWithGoogle, authError, authLoading } = useApp()

  return (
    <div className="instructor-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100svh', padding: '24px' }}>
      <div className="z1" style={{ width: '100%', maxWidth: 380 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--teal-dim)', border: '1px solid var(--teal-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18, color: 'var(--text-1)', lineHeight: 1.1 }}>Apex Humans</div>
              <div style={{ fontFamily: 'Space Grotesk', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--teal)', lineHeight: 1.1 }}>Instructor Scheduling</div>
            </div>
          </div>
        </div>

        {/* Sign-in card */}
        <div className="card" style={{ padding: 32 }}>
          <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 20, color: 'var(--text-1)', marginBottom: 8 }}>
            Instructor sign-in
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 28, lineHeight: 1.5 }}>
            Sign in with the Google account registered to your instructor profile.
          </p>

          {authError && (
            <div style={{ marginBottom: 20, padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p style={{ fontSize: 13, color: 'var(--red)', lineHeight: 1.5, margin: 0 }}>{authError}</p>
              </div>
            </div>
          )}

          <button
            onClick={signInWithGoogle}
            disabled={authLoading}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              width: '100%', padding: '13px 20px',
              background: 'var(--surface-sm)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', cursor: authLoading ? 'not-allowed' : 'pointer',
              fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 15, color: 'var(--text-1)',
              transition: 'background 150ms, border-color 150ms',
              opacity: authLoading ? 0.6 : 1,
            }}
            onMouseEnter={e => { if (!authLoading) { e.currentTarget.style.background = 'var(--teal-dim)'; e.currentTarget.style.borderColor = 'var(--teal-border)' } }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-sm)'; e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            <GoogleIcon />
            Continue with Google
          </button>
        </div>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--text-4)', lineHeight: 1.5 }}>
          Access is restricted to verified instructors.<br />Contact your administrator if you need access.
        </p>
      </div>
    </div>
  )
}
