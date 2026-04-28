import { useState } from 'react'
import CourseBadge from './CourseBadge'
import { formatDate } from '../data/courses'

export default function SlotCard({ slot, currentName, onClaim, onUnclaim, compact = false }) {
  const [justClaimed, setJustClaimed] = useState(false)
  const isMine = slot.claim && slot.claim.instructorName === currentName
  const isTaken = slot.claim && !isMine
  const isOpen = !slot.claim

  function handleClaim() {
    setJustClaimed(true)
    onClaim(slot)
    setTimeout(() => setJustClaimed(false), 600)
  }

  const borderColor = isMine ? 'var(--teal-border)' : isTaken ? 'var(--border-md)' : 'var(--border)'
  const bg = isMine ? 'var(--teal-dim)' : isTaken ? 'var(--surface-xs)' : 'var(--surface-sm)'

  return (
    <div
      className={justClaimed ? 'anim-claim' : ''}
      style={{
        display: 'flex', gap: 12, padding: compact ? '12px 14px' : '14px 16px',
        background: bg, border: `1px solid ${borderColor}`,
        borderRadius: 'var(--radius-md)', backdropFilter: 'blur(12px)',
        transition: 'background 0.25s, border-color 0.25s',
      }}
    >
      {/* Left: course color bar */}
      <div style={{ width: 3, borderRadius: 2, background: slot.course?.color || '#7c6af7', flexShrink: 0 }} />

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          <CourseBadge courseId={slot.courseId} size="sm" />
          <span style={{
            fontFamily: 'Space Grotesk', fontSize: 10, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.08em',
            color: 'var(--text-3)',
          }}>
            D{slot.day} · Sec {slot.section}/{slot.sections}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{formatDate(slot.date)}</span>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{slot.instructorType}</span>
        </div>
        {isTaken && (
          <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-3)' }}>
            {slot.claim.instructorName}
          </div>
        )}
      </div>

      {/* Action */}
      <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        {isOpen && onClaim && (
          <button className="btn btn-teal" style={{ fontSize: 12, padding: '8px 14px', minHeight: 36 }} onClick={handleClaim}>
            Claim
          </button>
        )}
        {isMine && onUnclaim && (
          <button
            className="btn btn-ghost"
            style={{ fontSize: 12, padding: '8px 10px', minHeight: 36, color: 'var(--teal)' }}
            onClick={() => onUnclaim(slot)}
          >
            Unclaim
          </button>
        )}
        {isTaken && (
          <span className="chip chip-muted" style={{ fontSize: 10 }}>Taken</span>
        )}
      </div>
    </div>
  )
}
