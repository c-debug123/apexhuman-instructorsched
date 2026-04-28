import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useSlots } from '../../hooks/useSlots'
import { formatDate, formatDateShort } from '../../data/courses'
import BottomNav from '../../components/BottomNav'
import BottomSheet from '../../components/BottomSheet'
import SlotCard from '../../components/SlotCard'
import InstructorNameChip from '../../components/InstructorNameChip'

export default function MySchedule() {
  const navigate = useNavigate()
  const { removeClaim } = useApp()
  const name = localStorage.getItem('apex_instructor_name') || ''
  const slots = useSlots()
  const [pendingUnclaim, setPendingUnclaim] = useState(null)

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

  function confirmUnclaim() {
    if (pendingUnclaim?.claim) removeClaim(pendingUnclaim.claim.id)
    setPendingUnclaim(null)
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <InstructorNameChip />
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

      {/* Unclaim confirmation */}
      <BottomSheet isOpen={!!pendingUnclaim} onClose={() => setPendingUnclaim(null)} title="Remove this slot?">
        {pendingUnclaim && (
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20, lineHeight: 1.5 }}>
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
