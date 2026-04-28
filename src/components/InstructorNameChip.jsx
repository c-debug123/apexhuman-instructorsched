import { useNavigate } from 'react-router-dom'

export default function InstructorNameChip() {
  const navigate = useNavigate()
  const name = localStorage.getItem('apex_instructor_name') || ''

  function changeName() {
    localStorage.removeItem('apex_instructor_name')
    navigate('/schedule')
  }

  if (!name) return null

  return (
    <button
      onClick={changeName}
      title="Change name"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        background: 'var(--teal-dim)', border: '1px solid var(--teal-border)',
        borderRadius: 'var(--radius-full)', padding: '3px 8px 3px 10px',
        color: 'var(--teal)', fontFamily: 'Space Grotesk', fontWeight: 600,
        fontSize: 11, cursor: 'pointer', maxWidth: 130, overflow: 'hidden',
      }}
    >
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </button>
  )
}
