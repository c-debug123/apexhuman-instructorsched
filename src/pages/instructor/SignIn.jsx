import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'

export default function SignIn() {
  const navigate = useNavigate()
  const { instructors } = useApp()
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  // Instructors already in the roster — quick pick
  const rosterNames = useMemo(
    () => instructors.map(i => ({ id: i.id, name: i.name })).sort((a, b) => a.name.localeCompare(b.name)),
    [instructors]
  )

  function signIn(instructorName, instructorId) {
    localStorage.setItem('apex_instructor_name', instructorName)
    if (instructorId) localStorage.setItem('apex_instructor_id', instructorId)
    else localStorage.removeItem('apex_instructor_id')
    navigate('/schedule/slots')
  }

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed.length < 2) return
    // Try to match to roster (case-insensitive)
    const match = instructors.find(i => i.name.toLowerCase() === trimmed.toLowerCase())
    if (match) {
      signIn(match.name, match.id)
    } else {
      // Allow sign-in but warn they won't see any slots if roster-based eligibility is enforced
      setError('This name is not on the instructor roster. You can still sign in, but no slots may be available to claim.')
    }
  }

  function handleForceSignIn() {
    const trimmed = name.trim()
    if (trimmed.length < 2) return
    signIn(trimmed, null)
  }

  return (
    <div className="instructor-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100svh', padding: '24px 24px' }}>
      <div className="z1" style={{ width: '100%', maxWidth: 400 }}>
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

        {/* Roster quick-pick */}
        {rosterNames.length > 0 && (
          <div className="card" style={{ padding: '16px 20px', marginBottom: 12 }}>
            <div style={{ fontFamily: 'Space Grotesk', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 12 }}>
              Sign in as
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {rosterNames.map(inst => (
                <button
                  key={inst.id}
                  onClick={() => signIn(inst.name, inst.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-sm)', border: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'background 150ms, border-color 150ms' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--teal-dim)'; e.currentTarget.style.borderColor = 'var(--teal-border)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-sm)'; e.currentTarget.style.borderColor = 'var(--border)' }}
                >
                  <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: 'var(--teal-dim)', border: '1px solid var(--teal-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, color: 'var(--teal)' }}>
                    {inst.name[0].toUpperCase()}
                  </div>
                  <span style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 14, color: 'var(--text-1)', flex: 1 }}>{inst.name}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Manual entry */}
        <div className="card" style={{ padding: 28 }}>
          <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 20, color: 'var(--text-1)', marginBottom: 6 }}>
            {rosterNames.length > 0 ? 'Or enter your name' : 'Welcome'}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 20, lineHeight: 1.5 }}>
            Enter your name to see and claim available teaching slots.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: error ? 12 : 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 8, fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Your name
              </label>
              <input
                className="input"
                type="text"
                placeholder="Full name"
                autoCapitalize="words"
                autoFocus={rosterNames.length === 0}
                value={name}
                onChange={e => { setName(e.target.value); setError('') }}
              />
            </div>

            {error && (
              <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--amber-dim)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--radius-sm)' }}>
                <p style={{ fontSize: 13, color: 'var(--amber)', marginBottom: 10, lineHeight: 1.5 }}>{error}</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn btn-ghost" style={{ flex: 1, fontSize: 12 }} onClick={handleForceSignIn}>
                    Continue anyway
                  </button>
                  <button type="button" className="btn btn-ghost" style={{ flex: 1, fontSize: 12 }} onClick={() => setError('')}>
                    Try again
                  </button>
                </div>
              </div>
            )}

            {!error && (
              <button type="submit" className="btn btn-teal" disabled={name.trim().length < 2} style={{ width: '100%' }}>
                Start Scheduling
              </button>
            )}
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--text-4)' }}>
          Your name will appear on slots you claim.
        </p>
      </div>
    </div>
  )
}
