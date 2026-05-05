import { useApp } from '../context/AppContext'

export default function InstructorNameChip() {
  const { currentInstructor } = useApp()
  const name = currentInstructor?.name || ''
  if (!name) return null
  return (
    <div
      style={{
        display: 'inline-flex', alignItems: 'center',
        background: 'var(--teal-dim)', border: '1px solid var(--teal-border)',
        borderRadius: 'var(--radius-full)', padding: '3px 10px',
        color: 'var(--teal)', fontFamily: 'Space Grotesk', fontWeight: 600,
        fontSize: 11, maxWidth: 130, overflow: 'hidden',
      }}
    >
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
    </div>
  )
}
