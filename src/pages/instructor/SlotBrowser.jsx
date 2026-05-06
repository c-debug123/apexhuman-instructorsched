import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { useSlots } from '../../hooks/useSlots'
import { formatDate } from '../../data/courses'
import BottomNav from '../../components/BottomNav'
import BottomSheet from '../../components/BottomSheet'
import SlotCard from '../../components/SlotCard'
import InstructorNameChip from '../../components/InstructorNameChip'

export default function SlotBrowser() {
  const { claims, addClaim, removeClaim, instructors, courses, modules, currentInstructor } = useApp()
  const name         = currentInstructor?.name || ''
  const instructorId = currentInstructor?.id || null

  const [courseFilter, setCourseFilter]       = useState(null)
  const [eligibleOnly, setEligibleOnly]       = useState(false)
  const [myBookingsOnly, setMyBookingsOnly]   = useState(false)
  const [showCoursePicker, setShowCoursePicker] = useState(false)
  const [pendingClaim, setPendingClaim]       = useState(null)
  const [conflictSlot, setConflictSlot]       = useState(null)
  const [pendingUnclaim, setPendingUnclaim]   = useState(null)

  const slots = useSlots({ courseFilter })

  // Derive this instructor's eligible groups
  const eligibleGroups = useMemo(() => {
    if (!instructorId) return null // null = show all
    const inst = instructors.find(i => i.id === instructorId)
    if (!inst) return null
    return new Set(inst.eligibleGroups || [])
  }, [instructorId, instructors])

  function isEligible(slot) {
    if (!slot.moduleId) return true
    if (!eligibleGroups) return true
    if (eligibleGroups.size === 0) return false
    const mod = modules.find(m => m.id === slot.moduleId)
    if (!mod) return true
    return (mod.tags || []).some(tag => eligibleGroups.has(tag))
  }

  // Return all bundle-companion slots for a given slot (including itself), for the same section
  function getBundleSlots(slot) {
    if (!slot.bundleGroup) return [slot]
    return slots.filter(s =>
      s.cohortId === slot.cohortId &&
      s.section === slot.section &&
      slot.bundleGroup.dayIndexes.includes(s.day - 1)
    )
  }

  function handleClaim(slot) {
    const bundleSlots = getBundleSlots(slot)
    // Check for date conflicts across all slots in the bundle
    for (const bs of bundleSlots) {
      const conflict = claims.find(cl =>
        cl.instructorName === name && cl.date === bs.date && cl.id !== bs.claim?.id
      )
      if (conflict) {
        const conflictingSlot = slots.find(s => s.cohortId === conflict.cohortId && s.day === conflict.day && s.section === conflict.section)
        setConflictSlot({ incoming: slot, existing: conflictingSlot || conflict })
        return
      }
    }
    setPendingClaim(slot)
  }

  function confirmClaim() {
    if (!pendingClaim) return
    const bundleSlots = getBundleSlots(pendingClaim)
    bundleSlots.forEach(bs => {
      if (!bs.claim) {
        addClaim({
          id: crypto.randomUUID(),
          cohortId: bs.cohortId,
          courseId: bs.courseId,
          day: bs.day,
          section: bs.section,
          date: bs.date,
          instructorType: bs.instructorType,
          instructorName: name,
          instructorId: instructorId || null,
          claimedAt: new Date().toISOString(),
        })
      }
    })
    setPendingClaim(null)
  }

  function confirmUnclaim() {
    if (!pendingUnclaim) return
    const bundleSlots = getBundleSlots(pendingUnclaim)
    bundleSlots.forEach(bs => {
      if (bs.claim?.instructorName === name) removeClaim(bs.claim.id)
    })
    setPendingUnclaim(null)
  }

  // Group by date — apply eligible/mine filters after eligibility is known
  const filteredSlots = slots.filter(slot => {
    if (eligibleOnly && !isEligible(slot)) return false
    if (myBookingsOnly && slot.claim?.instructorName !== name) return false
    return true
  })
  const grouped = filteredSlots.reduce((acc, slot) => {
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
            <div style={{ display: 'flex', gap: 6, paddingBottom: 4, flexWrap: 'wrap' }}>
              <button
                className={`filter-pill ${!courseFilter && !eligibleOnly && !myBookingsOnly ? 'on-instructor' : ''}`}
                onClick={() => { setCourseFilter(null); setEligibleOnly(false); setMyBookingsOnly(false) }}
              >
                All
              </button>
              {courses.length > 0 && (
                <button
                  className={`filter-pill ${courseFilter ? 'on-instructor' : ''}`}
                  onClick={() => setShowCoursePicker(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  {courseFilter
                    ? (() => { const c = courses.find(x => x.id === courseFilter); return <><span style={{ width: 6, height: 6, borderRadius: '50%', background: c?.color, display: 'inline-block' }} />{c?.code}{c?.shortName ? `: ${c.shortName}` : ''}</> })()
                    : 'Course'}
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
              )}
              <button
                className={`filter-pill ${eligibleOnly ? 'on-instructor' : ''}`}
                onClick={() => setEligibleOnly(v => !v)}
              >
                Eligible only
              </button>
              <button
                className={`filter-pill ${myBookingsOnly ? 'on-instructor' : ''}`}
                onClick={() => setMyBookingsOnly(v => !v)}
              >
                My bookings
              </button>
            </div>
          </div>
        </div>

        <div style={{ padding: '0 16px' }}>
          {dates.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 15, color: 'var(--text-2)', marginBottom: 6 }}>
                {(courseFilter || eligibleOnly || myBookingsOnly) ? 'No slots match your filters.' : 'No open slots right now.'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: (courseFilter || eligibleOnly || myBookingsOnly) ? 16 : 0 }}>
                {(courseFilter || eligibleOnly || myBookingsOnly) ? 'Try adjusting your filters.' : 'Check back later.'}
              </div>
              {(courseFilter || eligibleOnly || myBookingsOnly) && (
                <button className="btn btn-ghost" onClick={() => { setCourseFilter(null); setEligibleOnly(false); setMyBookingsOnly(false) }}>Clear Filters</button>
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
      <BottomSheet
        isOpen={!!pendingClaim}
        onClose={() => setPendingClaim(null)}
        title={pendingClaim?.bundleGroup ? 'Claim this bundle?' : 'Claim this slot?'}
      >
        {pendingClaim && (() => {
          const bundleSlots = getBundleSlots(pendingClaim)
          const isBundle    = !!pendingClaim.bundleGroup
          const bundleColor = pendingClaim.bundleGroup?.color || pendingClaim.course?.color
          return (
            <div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 0', marginBottom: 16, borderBottom: '1px solid var(--border-dim)' }}>
                <div style={{ width: 4, borderRadius: 2, background: bundleColor, flexShrink: 0, alignSelf: 'stretch', minHeight: 40 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 14, color: 'var(--text-1)', marginBottom: 4 }}>
                    {pendingClaim.course?.name}
                  </div>
                  {isBundle ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {bundleSlots.map(bs => (
                        <div key={bs.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            fontSize: 10, fontFamily: 'Space Grotesk', fontWeight: 700,
                            padding: '2px 7px', borderRadius: 'var(--radius-sm)',
                            background: bundleColor ? `${bundleColor}20` : 'var(--surface-xs)',
                            color: bundleColor || 'var(--text-3)',
                            border: `1px solid ${bundleColor ? `${bundleColor}55` : 'var(--border-dim)'}`,
                          }}>
                            M{bs.day}
                          </span>
                          <span style={{ fontSize: 13, color: 'var(--text-3)' }}>
                            {bs.moduleName} · {formatDate(bs.date)}
                          </span>
                        </div>
                      ))}
                      <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-3)' }}>
                        Section {pendingClaim.section}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Module {pendingClaim.day} · Section {pendingClaim.section} · {formatDate(pendingClaim.date)}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{pendingClaim.instructorType}</div>
                    </>
                  )}
                </div>
              </div>
              {isBundle && (
                <div style={{ marginBottom: 14, padding: '8px 12px', background: bundleColor ? `${bundleColor}10` : 'var(--surface-xs)', border: `1px solid ${bundleColor ? `${bundleColor}30` : 'var(--border-dim)'}`, borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>
                  All {bundleSlots.length} modules in this bundle will be claimed together.
                </div>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-teal" style={{ flex: 1 }} onClick={confirmClaim}>
                  {isBundle ? `Claim Bundle (${bundleSlots.length})` : 'Claim'}
                </button>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setPendingClaim(null)}>Cancel</button>
              </div>
            </div>
          )
        })()}
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
      <BottomSheet
        isOpen={!!pendingUnclaim}
        onClose={() => setPendingUnclaim(null)}
        title={pendingUnclaim?.bundleGroup ? 'Remove this bundle?' : 'Remove this slot?'}
      >
        {pendingUnclaim && (() => {
          const bundleSlots = getBundleSlots(pendingUnclaim)
          const isBundle    = !!pendingUnclaim.bundleGroup
          const bundleLabel = isBundle ? bundleSlots.map(bs => `M${bs.day}`).join(' + ') : null
          return (
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 16, lineHeight: 1.6 }}>
                {isBundle ? (
                  <>
                    <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 14, color: 'var(--text-1)', marginBottom: 6 }}>
                      {pendingUnclaim.course?.name} — Bundle {bundleLabel}
                    </div>
                    <div>Section {pendingUnclaim.section} · All {bundleSlots.length} modules will be released.</div>
                  </>
                ) : (
                  <>
                    {pendingUnclaim.course?.name} — Module {pendingUnclaim.day}, Section {pendingUnclaim.section}<br />
                    {formatDate(pendingUnclaim.date)}
                  </>
                )}
                <div style={{ marginTop: 8 }}>This slot{isBundle ? 's' : ''} will become available for other instructors.</div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-danger" style={{ flex: 1 }} onClick={confirmUnclaim}>
                  {isBundle ? `Remove Bundle (${bundleSlots.length})` : 'Remove'}
                </button>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setPendingUnclaim(null)}>Keep It</button>
              </div>
            </div>
          )
        })()}
      </BottomSheet>

      {/* Course picker */}
      <BottomSheet isOpen={showCoursePicker} onClose={() => setShowCoursePicker(false)} title="Filter by Course">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[{ id: null, code: 'All', name: 'All courses', color: null }].concat(courses).map(c => {
            const isSelected = courseFilter === c.id
            return (
              <button
                key={c.id ?? 'all'}
                onClick={() => { setCourseFilter(c.id); setShowCoursePicker(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 4px',
                  background: 'none', border: 'none', borderBottom: '1px solid var(--border-dim)',
                  cursor: 'pointer', textAlign: 'left', width: '100%',
                }}
              >
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.color || 'var(--border-md)', flexShrink: 0 }} />
                <span style={{ flex: 1, fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 14, color: isSelected ? 'var(--teal)' : 'var(--text-1)' }}>
                  {c.id ? `${c.code}${c.shortName ? `: ${c.shortName}` : c.name ? `: ${c.name}` : ''}` : 'All courses'}
                </span>
                {isSelected && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                )}
              </button>
            )
          })}
        </div>
      </BottomSheet>

      <BottomNav role="instructor" />
    </div>
  )
}
