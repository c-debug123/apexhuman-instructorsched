import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useSlots } from '../../hooks/useSlots'
import { formatDate, formatDateShort } from '../../data/courses'
import BottomSheet from '../../components/BottomSheet'
import SlotCard from '../../components/SlotCard'
import InstructorNameChip from '../../components/InstructorNameChip'

function isCancellable(slot) {
  if (!slot?.date) return false
  const timeStr = slot.startTime || '09:00'
  const courseDateTime = new Date(`${slot.date}T${timeStr.length === 5 ? timeStr : '09:00'}:00Z`)
  const deadline = new Date(courseDateTime.getTime() - 72 * 60 * 60 * 1000)
  return new Date() < deadline
}

export default function MySchedule() {
  const navigate = useNavigate()
  const { removeClaim, cancelClaim, currentInstructor, signOut } = useApp()
  const name = currentInstructor?.name || ''
  const slots = useSlots()
  const [pendingUnclaim, setPendingUnclaim]   = useState(null)
  const [cancelling,     setCancelling]       = useState(false)
  const [sheetError,     setSheetError]       = useState(null)
  const [toast,          setToast]            = useState(null)

  const mySlots = slots.filter(s => s.claim?.instructorName === name)
  const uniqueCourses = new Set(mySlots.map(s => s.courseId)).size
  const earliest = mySlots.length > 0 ? mySlots.reduce((min, s) => s.date < min ? s.date : min, mySlots[0].date) : null

  // Group by date
  const grouped = mySlots.reduce((acc, s) => {
    if (!acc[s.date]) acc[s.date] = []
    acc[s.date].push(s)
    return acc
  }, {})
  const dates = Object.keys(grouped).sort()

  function unclaimWithinWindow() {
    if (pendingUnclaim?.claim) removeClaim(pendingUnclaim.claim.id)
    setPendingUnclaim(null)
  }

  function isWithinUnclaimWindow(slot) {
    const claimedAt = slot?.claim?.claimedAt
    return claimedAt && (Date.now() - new Date(claimedAt).getTime()) < 30000
  }

  async function handleCancel() {
    if (!pendingUnclaim?.claim) return
    setCancelling(true)
    setSheetError(null)
    const { error } = await cancelClaim(pendingUnclaim.claim.id, name)
    setCancelling(false)
    if (error) {
      setSheetError(error)
    } else {
      setPendingUnclaim(null)
      setToast('Booking cancelled. The slot is now available for other instructors.')
      setTimeout(() => setToast(null), 4000)
    }
  }

  function closeSheet() {
    setPendingUnclaim(null)
    setSheetError(null)
  }

  return (
    <div className="instructor-bg">
      <div className="z1 page">
        <div className="safe-top" style={{ padding: '0 16px', paddingTop: 'max(16px, env(safe-area-inset-top))' }}>
          <div style={{ paddingTop: 8, paddingBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 22, color: 'var(--text-1)', margin: 0 }}>
                My Schedule
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <InstructorNameChip />
                <button
                  onClick={signOut}
                  title="Sign out"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'var(--surface-xs)', border: '1px solid var(--border-dim)', cursor: 'pointer', color: 'var(--text-3)', transition: 'background 150ms, color 150ms' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = 'var(--red)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-xs)'; e.currentTarget.style.color = 'var(--text-3)' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Stats */}
            {mySlots.length > 0 && (
              <div className="card" style={{ display: 'flex', marginBottom: 8, overflow: 'hidden' }}>
                {[
                  { label: 'Days Booked', value: mySlots.length, color: 'var(--teal)' },
                  { label: 'Courses',     value: uniqueCourses,  color: 'var(--accent)' },
                  { label: 'Next Slot',   value: earliest ? formatDateShort(earliest) : '—', color: 'var(--text-1)', small: true },
                ].map((s, i, arr) => (
                  <div key={s.label} style={{
                    flex: 1, padding: '14px 8px', textAlign: 'center',
                    borderRight: i < arr.length - 1 ? '1px solid var(--border-dim)' : 'none',
                  }}>
                    <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: s.small ? 16 : 24, color: s.color, lineHeight: 1, marginBottom: 4 }}>
                      {s.value}
                    </div>
                    <div style={{ fontFamily: 'Space Grotesk', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)' }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: '0 16px' }}>
          {mySlots.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 15, color: 'var(--text-2)', marginBottom: 6 }}>
                No slots claimed yet
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>
                Browse available slots to add teaching days to your schedule.
              </div>
              <button className="btn btn-teal" onClick={() => navigate('/schedule/slots')} style={{ margin: '0 auto' }}>
                Browse Slots
              </button>
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
                      onUnclaim={() => setPendingUnclaim(slot)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Unclaim / Cancel confirmation sheet */}
      {pendingUnclaim && (() => {
        const withinWindow = isWithinUnclaimWindow(pendingUnclaim)
        const cancellable  = !withinWindow && isCancellable(pendingUnclaim)
        const blocked      = !withinWindow && !cancellable

        return (
          <BottomSheet
            isOpen
            onClose={closeSheet}
            title={withinWindow ? 'Remove this slot?' : cancellable ? 'Cancel booking?' : 'Cannot cancel'}
          >
            {withinWindow ? (
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20, lineHeight: 1.5 }}>
                  {pendingUnclaim.course?.name} — Module {pendingUnclaim.day}, Section {pendingUnclaim.section}<br />
                  {formatDate(pendingUnclaim.date)}<br /><br />
                  This slot will become available for other instructors.
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-danger" style={{ flex: 1 }} onClick={unclaimWithinWindow}>Remove</button>
                  <button className="btn btn-ghost" style={{ flex: 1 }} onClick={closeSheet}>Keep It</button>
                </div>
              </div>
            ) : cancellable ? (
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16, lineHeight: 1.6 }}>
                  <span style={{ fontFamily: 'Space Grotesk', fontWeight: 600, color: 'var(--text-1)' }}>
                    {pendingUnclaim.course?.name} — Module {pendingUnclaim.day}
                  </span><br />
                  {formatDate(pendingUnclaim.date)} · Section {pendingUnclaim.section}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20, lineHeight: 1.5 }}>
                  This booking will be cancelled and the slot will become available for other instructors.
                </div>
                {sheetError && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 16, padding: '12px 14px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-sm)' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <div style={{ fontSize: 13, color: 'var(--red)', lineHeight: 1.5 }}>{sheetError}</div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    className="btn btn-danger"
                    style={{ flex: 1, opacity: cancelling ? 0.6 : 1 }}
                    onClick={handleCancel}
                    disabled={cancelling}
                  >
                    {cancelling ? 'Cancelling…' : 'Cancel Booking'}
                  </button>
                  <button className="btn btn-ghost" style={{ flex: 1 }} onClick={closeSheet} disabled={cancelling}>
                    Keep It
                  </button>
                </div>
              </div>
            ) : (
              /* blocked — within 72-hour window */
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 16, padding: '12px 14px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-sm)' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <div style={{ fontSize: 13, color: 'var(--amber)', lineHeight: 1.5 }}>
                    Bookings can only be cancelled at least 72 hours before the scheduled course.
                  </div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 6, lineHeight: 1.6 }}>
                  <span style={{ fontFamily: 'Space Grotesk', fontWeight: 600, color: 'var(--text-1)' }}>
                    {pendingUnclaim.course?.name} — Module {pendingUnclaim.day}
                  </span><br />
                  {formatDate(pendingUnclaim.date)} · Section {pendingUnclaim.section}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20, lineHeight: 1.6 }}>
                  The course is within the 72-hour window. Please contact the program coordinator if you need urgent assistance.
                </div>
                <button className="btn btn-secondary" style={{ width: '100%' }} onClick={closeSheet}>Got it</button>
              </div>
            )}
          </BottomSheet>
        )
      })()}

      {/* Success toast */}
      {toast && (
        <div
          className="anim-fade"
          style={{
            position: 'fixed', bottom: 'max(88px, calc(72px + env(safe-area-inset-bottom)))',
            left: 16, right: 16, zIndex: 60,
            background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 'var(--radius-md)', padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: 10,
            backdropFilter: 'blur(12px)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>
          <span style={{ fontSize: 13, color: 'var(--green)', lineHeight: 1.4 }}>{toast}</span>
        </div>
      )}

    </div>
  )
}
