import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { useSlots } from '../../hooks/useSlots'
import { formatDate } from '../../data/courses'
import BottomNav from '../../components/BottomNav'
import BottomSheet from '../../components/BottomSheet'
import SlotCard from '../../components/SlotCard'
import InstructorNameChip from '../../components/InstructorNameChip'

export default function SlotBrowser() {
  const { claims, addClaim, removeClaim, instructors, courses } = useApp()
  const name        = localStorage.getItem('apex_instructor_name') || ''
  const instructorId = localStorage.getItem('apex_instructor_id') || null

  const [dayFilter, setDayFilter]       = useState(null)
  const [courseFilter, setCourseFilter] = useState(null)
  const [pendingClaim, setPendingClaim] = useState(null)
  const [conflictSlot, setConflictSlot] = useState(null)
  const [pendingUnclaim, setPendingUnclaim] = useState(null)

  const slots = useSlots({ dayFilter, courseFilter })

  // Derive this instructor's eligible module IDs
  const eligibleModuleIds = useMemo(() => {
    if (!instructorId) return null // null = no id stored, show all
    const inst = instructors.find(i => i.id === instructorId)
    if (!inst) return null
    return new Set(inst.eligibleModules || [])
  }, [instructorId, instructors])

  function isEligible(slot) {
    // If no moduleId on slot (course not fully configured), show to everyone
    if (!slot.moduleId) return true
    // If no instructor id matched, show all (graceful fallback)
    if (!eligibleModuleIds) return true
    return eligibleModuleIds.has(slot.moduleId)
  }

  function handleClaim(slot) {
    const conflict = claims.find(cl =>
      cl.instructorName === name && cl.date === slot.date && cl.id !== slot.claim?.id
    )
    if (conflict) {
      const conflictingSlot = slots.find(s => s.cohortId === conflict.cohortId && s.day === conflict.day && s.section === conflict.section)
      setConflictSlot({ incoming: slot, existing: conflictingSlot || conflict })
    } else {
      setPendingClaim(slot)
    }
  }

  function confirmClaim() {
    if (!pendingClaim) return
    const claim = {
      id: crypto.randomUUID(),
      cohortId: pendingClaim.cohortId,
      courseId: pendingClaim.courseId,
      day: pendingClaim.day,
      section: pendingClaim.section,
      date: pendingClaim.date,
      instructorType: pendingClaim.instructorType,
      instructorName: name,
      claimedAt: new Date().toISOString(),
    }
    addClaim(claim)
    setPendingClaim(null)
  }

  function confirmUnclaim() {
    if (pendingUnclaim?.claim) removeClaim(pendingUnclaim.claim.id)
    setPendingUnclaim(null)
  }

  // Group by date
  const grouped = slots.reduce((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = []
    acc[slot.date].push(slot)
    return acc
  }, {})
  const dates = Object.keys(grouped).sort()

  return (
    <div className="instructor-bg">
      <div className="z1 page">
        <div className="safe-top" style={{ padding: '0 16px', paddingTop: 'max(16px, env(safe-area-inset-top))' }}>
          <div style={{ paddingTop: 8, paddingBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8 }}>
              <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 20, color: 'var(--text-1)', whiteSpace: 'nowrap' }}>
                Available Slots
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <InstructorNameChip />
              </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8 }}>
              <button
                className={`filter-pill ${dayFilter === null && courseFilter === null ? 'on-instructor' : ''}`}
                onClick={() => { setDayFilter(null); setCourseFilter(null) }}
              >
                All
              </button>
              {[1, 2, 3, 4, 5].map(d => (
                <button
                  key={d}
                  className={`filter-pill ${dayFilter === d ? 'on-instructor' : ''}`}
                  onClick={() => setDayFilter(dayFilter === d ? null : d)}
                >
                  D{d}
                </button>
              ))}
              {courses.map(c => (
                <button
                  key={c.id}
                  className={`filter-pill ${courseFilter === c.id ? 'on-instructor' : ''}`}
                  onClick={() => setCourseFilter(courseFilter === c.id ? null : c.id)}
                >
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.color, display: 'inline-block', marginRight: 2 }} />
                  {c.code}{c.shortName ? `: ${c.shortName}` : ''}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: '0 16px' }}>
          {dates.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 15, color: 'var(--text-2)', marginBottom: 6 }}>
                {dayFilter || courseFilter ? 'No slots match your filters.' : 'No open slots right now.'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: dayFilter || courseFilter ? 16 : 0 }}>
                {dayFilter || courseFilter ? 'Try clearing filters to see more.' : 'Check back later.'}
              </div>
              {(dayFilter || courseFilter) && (
                <button className="btn btn-ghost" onClick={() => { setDayFilter(null); setCourseFilter(null) }}>Clear Filters</button>
              )}
            </div>
          ) : (
            dates.map(date => (
              <div key={date} style={{ marginBottom: 20 }}>
                <div style={{
                  fontSize: 12, fontFamily: 'Space Grotesk', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)',
                  marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid var(--border-dim)',
                }}>
                  {formatDate(date)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {grouped[date].map(slot => (
                    <SlotCard
                      key={slot.id}
                      slot={slot}
                      currentName={name}
                      eligible={isEligible(slot)}
                      onClaim={() => handleClaim(slot)}
                      onUnclaim={() => setPendingUnclaim(slot)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Claim confirmation */}
      <BottomSheet isOpen={!!pendingClaim} onClose={() => setPendingClaim(null)} title="Claim this slot?">
        {pendingClaim && (
          <div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 0', marginBottom: 16, borderBottom: '1px solid var(--border-dim)' }}>
              <div style={{ width: 4, height: 40, borderRadius: 2, background: pendingClaim.course?.color, flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 14, color: 'var(--text-1)' }}>{pendingClaim.course?.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Day {pendingClaim.day} · Section {pendingClaim.section} · {formatDate(pendingClaim.date)}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{pendingClaim.instructorType}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-teal" style={{ flex: 1 }} onClick={confirmClaim}>Claim</button>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setPendingClaim(null)}>Cancel</button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Conflict modal */}
      <BottomSheet isOpen={!!conflictSlot} onClose={() => setConflictSlot(null)} title="Scheduling Conflict">
        {conflictSlot && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span style={{ fontSize: 13, color: 'var(--amber)' }}>You already have a booking on {formatDate(conflictSlot.incoming?.date)}.</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20, lineHeight: 1.5 }}>
              You can only teach one session per day. Unclaim your existing slot first if you want to switch.
            </div>
            <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setConflictSlot(null)}>Got it</button>
          </div>
        )}
      </BottomSheet>

      {/* Unclaim confirmation */}
      <BottomSheet isOpen={!!pendingUnclaim} onClose={() => setPendingUnclaim(null)} title="Remove this slot?">
        {pendingUnclaim && (
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 16 }}>
              {pendingUnclaim.course?.name} — Day {pendingUnclaim.day}, Section {pendingUnclaim.section}<br />
              {formatDate(pendingUnclaim.date)}<br /><br />
              This slot will become available for other instructors.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={confirmUnclaim}>Remove</button>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setPendingUnclaim(null)}>Keep It</button>
            </div>
          </div>
        )}
      </BottomSheet>

      <BottomNav role="instructor" />
    </div>
  )
}
