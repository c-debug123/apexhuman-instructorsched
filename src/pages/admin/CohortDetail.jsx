import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useSlotsForCohort } from '../../hooks/useSlots'
import { COURSES, formatDateShort } from '../../data/courses'
import BottomNav from '../../components/BottomNav'
import BottomSheet from '../../components/BottomSheet'
import CourseBadge from '../../components/CourseBadge'

function BackIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
}

export default function CohortDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { cohorts, claims, removeClaim, deleteCohort } = useApp()
  const cohort = cohorts.find(c => c.id === id)
  const slots = useSlotsForCohort(id)
  const [pendingUnclaim, setPendingUnclaim] = useState(null)
  const [showDelete, setShowDelete] = useState(false)

  if (!cohort) {
    return (
      <div className="admin-bg">
        <div className="z1" style={{ padding: '80px 16px', textAlign: 'center' }}>
          <div style={{ color: 'var(--text-3)' }}>Cohort not found.</div>
          <button className="btn btn-ghost" onClick={() => navigate('/admin')} style={{ marginTop: 16 }}>Back to Dashboard</button>
        </div>
        <BottomNav role="admin" />
      </div>
    )
  }

  const course = COURSES[cohort.courseId]
  const total = cohort.sections * 5
  const filled = claims.filter(cl => cl.cohortId === id).length
  const d5 = formatDateShort(new Date(cohort.startDate).toISOString().slice(0, 10).replace(/\d+$/, v => String(parseInt(v) + 4)))

  const instructorNames = [...new Set(claims.filter(cl => cl.cohortId === id).map(cl => cl.instructorName))]

  function getSlot(day, section) {
    return slots.find(s => s.day === day && s.section === section)
  }

  function handleCellTap(slot) {
    if (slot?.claim) setPendingUnclaim(slot)
  }

  function confirmUnclaim() {
    if (pendingUnclaim?.claim) {
      removeClaim(pendingUnclaim.claim.id)
    }
    setPendingUnclaim(null)
  }

  function confirmDelete() {
    deleteCohort(id)
    navigate('/admin')
  }

  const shortType = t => ({ 'AI Educator': 'AI Edu', 'Business Strategist': 'Biz', 'Growth Marketer': 'Growth', 'Roblox Expert': 'Roblox' }[t] || t)

  return (
    <div className="admin-bg">
      <div className="z1 page">
        <div className="safe-top" style={{ padding: '0 16px', paddingTop: 'max(16px, env(safe-area-inset-top))' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 8, paddingBottom: 6 }}>
            <button className="btn btn-ghost" style={{ padding: '8px 4px', minHeight: 40 }} onClick={() => navigate('/admin')}>
              <BackIcon />
            </button>
            <div style={{ flex: 1 }}>
              <CourseBadge courseId={cohort.courseId} size="sm" />
            </div>
            <button className="btn btn-ghost" style={{ fontSize: 12, color: 'var(--red)', padding: '8px 4px' }} onClick={() => setShowDelete(true)}>
              Delete
            </button>
          </div>

          {/* Summary */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '0 4px' }}>
            <span style={{ fontSize: 13, color: 'var(--text-3)' }}>
              {formatDateShort(cohort.startDate)} – {formatDateShort(new Date(new Date(cohort.startDate + 'T00:00:00').setDate(new Date(cohort.startDate + 'T00:00:00').getDate() + 4)).toISOString().slice(0,10))}
            </span>
            <span className="chip chip-muted">{cohort.sections} section{cohort.sections !== 1 ? 's' : ''}</span>
            <span className="chip" style={{ background: filled === total ? 'var(--green-dim)' : 'var(--amber-dim)', border: '1px solid rgba(245,158,11,0.3)', color: filled === total ? 'var(--green)' : 'var(--amber)' }}>
              {filled}/{total}
            </span>
          </div>
        </div>

        {/* Slot grid */}
        <div style={{ padding: '0 16px', marginBottom: 24 }}>
          <div className="section-label" style={{ marginBottom: 10 }}>Slot Grid</div>
          <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 320 }}>
              <thead>
                <tr style={{ background: 'var(--surface-xs)' }}>
                  <th style={{ padding: '8px 10px', fontSize: 10, fontFamily: 'Space Grotesk', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', textAlign: 'left', borderBottom: '1px solid var(--border-dim)' }}>
                    Sec
                  </th>
                  {[1,2,3,4,5].map(d => (
                    <th key={d} style={{ padding: '8px 8px', fontSize: 10, fontFamily: 'Space Grotesk', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', textAlign: 'center', borderBottom: '1px solid var(--border-dim)', whiteSpace: 'nowrap' }}>
                      D{d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: cohort.sections }, (_, si) => (
                  <tr key={si}>
                    <td style={{ padding: '10px 10px', fontSize: 12, color: 'var(--text-3)', borderBottom: si < cohort.sections - 1 ? '1px solid var(--border-dim)' : 'none', fontFamily: 'Space Grotesk', fontWeight: 600 }}>
                      {si + 1}
                    </td>
                    {[1,2,3,4,5].map(d => {
                      const slot = getSlot(d, si + 1)
                      const hasClaim = slot?.claim
                      return (
                        <td
                          key={d}
                          onClick={() => handleCellTap(slot)}
                          style={{
                            padding: '8px 6px', textAlign: 'center',
                            background: hasClaim ? 'var(--teal-dim)' : 'transparent',
                            cursor: hasClaim ? 'pointer' : 'default',
                            borderBottom: si < cohort.sections - 1 ? '1px solid var(--border-dim)' : 'none',
                            transition: 'background 0.15s',
                          }}
                        >
                          <div style={{ fontSize: 9, color: 'var(--text-4)', fontFamily: 'Space Grotesk', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>
                            {slot ? shortType(slot.instructorType) : ''}
                          </div>
                          {hasClaim ? (
                            <div style={{ fontSize: 10, color: 'var(--teal)', fontWeight: 500, lineHeight: 1.2 }}>
                              {slot.claim.instructorName.split(' ')[0]}
                            </div>
                          ) : (
                            <div style={{ fontSize: 10, color: 'var(--text-4)' }}>Open</div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filled === 0 && (
            <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text-3)', padding: '10px 14px', background: 'var(--surface-xs)', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius-sm)' }}>
              Share the instructor link so instructors can claim their slots.
            </div>
          )}
        </div>

        {/* Instructor list */}
        {instructorNames.length > 0 && (
          <div style={{ padding: '0 16px' }}>
            <div className="section-label" style={{ marginBottom: 10 }}>Instructors in this cohort</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {instructorNames.map(name => {
                const nameClaims = claims.filter(cl => cl.cohortId === id && cl.instructorName === name)
                return (
                  <div key={name} className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, color: 'var(--accent)', flexShrink: 0 }}>
                      {name[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 14, color: 'var(--text-1)' }}>{name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                        {nameClaims.map(cl => `D${cl.day} S${cl.section}`).join(' · ')}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Unclaim sheet */}
      <BottomSheet isOpen={!!pendingUnclaim} onClose={() => setPendingUnclaim(null)} title="Remove instructor?">
        {pendingUnclaim && (
          <div>
            <div style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 4 }}>
              {pendingUnclaim.claim?.instructorName} — {course?.name} D{pendingUnclaim.day}, Sec {pendingUnclaim.section}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>
              Remove this instructor from the slot?
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={confirmUnclaim}>Remove Claim</button>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setPendingUnclaim(null)}>Cancel</button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Delete cohort sheet */}
      <BottomSheet isOpen={showDelete} onClose={() => setShowDelete(false)} title="Delete cohort?">
        <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>
          This will remove the cohort and all {filled} claim{filled !== 1 ? 's' : ''} associated with it. This cannot be undone.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-danger" style={{ flex: 1 }} onClick={confirmDelete}>Delete Cohort</button>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowDelete(false)}>Cancel</button>
        </div>
      </BottomSheet>

      <BottomNav role="admin" />
    </div>
  )
}
