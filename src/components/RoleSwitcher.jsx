import { useNavigate } from 'react-router-dom'

const DEMO_NAME = 'Demo Instructor'

export default function RoleSwitcher({ role }) {
  const navigate = useNavigate()

  if (role === 'admin') {
    return (
      <button
        onClick={() => {
          if (!localStorage.getItem('apex_instructor_name')) {
            localStorage.setItem('apex_instructor_name', DEMO_NAME)
          }
          navigate('/schedule/slots')
        }}
        title="Switch to instructor view"
        style={{
          background: 'rgba(124,106,247,0.15)',
          border: '1px solid rgba(124,106,247,0.35)',
          borderRadius: 'var(--radius-full)',
          padding: '3px 10px 3px 8px',
          display: 'inline-flex', alignItems: 'center', gap: 5,
          cursor: 'pointer', color: 'var(--accent)',
          fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 11,
          textTransform: 'uppercase', letterSpacing: '0.08em',
          transition: 'background 150ms ease, border-color 150ms ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(124,106,247,0.25)'
          e.currentTarget.style.borderColor = 'rgba(124,106,247,0.6)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(124,106,247,0.15)'
          e.currentTarget.style.borderColor = 'rgba(124,106,247,0.35)'
        }}
      >
        Admin
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    )
  }

  return (
    <button
      onClick={() => navigate('/admin')}
      title="Switch to admin view"
      style={{
        background: 'rgba(45,212,191,0.12)',
        border: '1px solid rgba(45,212,191,0.3)',
        borderRadius: 'var(--radius-full)',
        padding: '3px 8px 3px 6px',
        display: 'inline-flex', alignItems: 'center', gap: 5,
        cursor: 'pointer', color: 'var(--teal)',
        fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 11,
        textTransform: 'uppercase', letterSpacing: '0.08em',
        transition: 'background 150ms ease, border-color 150ms ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(45,212,191,0.22)'
        e.currentTarget.style.borderColor = 'rgba(45,212,191,0.55)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(45,212,191,0.12)'
        e.currentTarget.style.borderColor = 'rgba(45,212,191,0.3)'
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
      Instructor
    </button>
  )
}
