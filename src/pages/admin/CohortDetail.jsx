import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useSlotsForCohort } from '../../hooks/useSlots'
import BottomNav from '../../components/BottomNav'
import BottomSheet from '../../components/BottomSheet'
import CourseBadge from '../../components/CourseBadge'

function BackIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
}

function calcEndTime(startTime, durationHours) {
  if (!startTime || !durationHours) return ''
  const [h, m] = startTime.split(':').map(Number)
  const totalMins = h * 60 + m + Math.round(durationHours * 60)
  const endH = Math.floor(totalMins / 60) % 24
  const endM = totalMins % 60
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
}

function formatDateMed(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

export default function CohortDetail() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { cohorts, courses, modules, claims, removeClaim, deleteCohort } = useApp()
  const cohort = cohorts.find(c => c.id === id)
  const slots  = useSlotsForCohort(id)
  const [pendingUnclaim, setPendingUnclaim] = useState(null)
  const [showDelete, setShowDelete]         = useState(false)

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

  const course   = courses.find(c => c.id === cohort.courseId)
  const dayCount = course?.days?.length || 0
  const total    = cohort.sections * dayCount
  const filled   = claims.filter(cl => cl.cohortId === id).length

  const instructorNames = [...new Set(claims.filter(cl => cl.cohortId === id).map(cl => cl.instructorName))]

  function getSlot(day, section) { return slots.find(s => s.day === day && s.section === section) }
  function handleCellTap(slot)   { if (slot?.claim) setPendingUnclaim(slot) }
  function confirmUnclaim()      { if (pendingUnclaim?.claim) removeClaim(pendingUnclaim.claim.id); setPendingUnclaim(null) }
  function confirmDelete()       { deleteCohort(id); navigate('/admin') }

  const slotDates = cohort.slotDates || []

  return (
    <div className="admin-bg">
      <div className="z1 page">
        <div className="safe-top" style={{ padding: '0 16px', paddingTop: 'max(16px, env(safe-area-inset-top))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 8, paddingBottom: 6 }}>
            <button className="btn btn-ghost" style={{ padding: '8px 4px', minHeight: 40 }} onClick={() => navigate('/admin')}>
              <BackIcon />
            </button>
            <div style={{ flex: 1 }}><CourseBadge courseId={cohort.courseId} size="sm" /></div>
            <button className="btn btn-ghost" style={{ fontSize: 12, color: 'var(--red)', padding: '8px 4px' }} onClick={() => setShowDelete(true)}>Delete</button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, padding: '0 4px', flexWrap: 'wrap' }}>
            <span className="chip chip-muted">{cohort.sections} section{cohort.sections !== 1 ? 's' : ''}</span>
            <span className="chip" style={{
              background: filled === total ? 'var(--green-dim)' : 'var(--amber-dim)',
              border: '1px solid rgba(245,158,11,0.3)',
              color: filled === total ? 'var(--green)' : 'var(--amber)',
            }}>
              {filled}/{total} filled
            </span>
          </div>
        </div>

        {/* Module schedule with times */}
        {slotDates.length > 0 && (
          <div style={{ padding: '0 16px', marginBottom: 24 }}>
            <div className="section-label" style={{ marginBottom: 10 }}>Module Schedule</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(course?.days || []).map((courseSlot, i) => {
                const mod     = modules.find(m => m.id === courseSlot?.moduleId)
                const sd      = slotDates[i]
                const endTime = sd ? calcEndTime(sd.startTime, mod?.durationHours) : ''
                const label   = courseSlot?.label || mod?.name || `Module ${i + 1}`
                return (
                  <div
                    key={courseSlot?.id || i}
                    className="card"
                    style={{ padding: '12px 14px', display: 'flex', gap: 14, alignItems: 'flex-start' }}
                  >
                    {/* Index badge */}
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                      background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 10, color: 'var(--accent)',
                      marginTop: 1,
                    }}>
                      {i + 1}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 13, color: 'var(--text-1)', marginBottom: 4 }}>
                        {label}
                      </div>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        {sd?.date ? (
                          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{formatDateMed(sd.date)}</span>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--text-4)' }}>No date set</span>
                        )}
                        {sd?.startTime && (
                          <span style={{ fontSize: 12, color: 'var(--accent)', fontFamily: 'Space Grotesk', fontWeight: 600 }}>
                            {sd.startTime}{endTime ? ` – ${endTime}` : ''}
                          </span>
                        )}
                        {mod?.durationHours && (
                          <span style={{
                            fontSize: 10, fontFamily: 'Space Grotesk', fontWeight: 600,
                            padding: '2px 7px', borderRadius: 'var(--radius-full)',
                            background: 'var(--surface-xs)', color: 'var(--text-3)',
                            border: '1px solid var(--border-dim)',
                          }}>
                            {mod.durationHours}h
                          </span>
                        )}
                      </div>
                      {(sd?.room || sd?.address) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          <span style={{ fontSize: 11, color: 'var(--text-4)' }}>
                            {[sd.room, sd.address].filter(Boolean).join(' · ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Slot grid */}
        <div style={{ padding: '0 16px', marginBottom: 24 }}>
          <div className="section-label" style={{ marginBottom: 10 }}>Slot Grid</div>
          <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 280 }}>
              <thead>
                <tr style={{ background: 'var(--surface-xs)' }}>
                  <th style={thStyle('left')}>Sec</th>
                  {Array.from({ length: dayCount }, (_, i) => {
                    const dayDef = course?.days?.[i]
                    const mod    = modules.find(m => m.id === dayDef?.moduleId)
                    const name   = mod?.name || dayDef?.label || `D${i + 1}`
                    const abbr   = name.length > 8 ? name.slice(0, 7) + '…' : name
                    return (
                      <th key={i} style={thStyle('center')} title={name}>
                        {abbr}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: cohort.sections }, (_, si) => (
                  <tr key={si}>
                    <td style={{ padding: '10px 10px', fontSize: 12, color: 'var(--text-3)', borderBottom: si < cohort.sections - 1 ? '1px solid var(--border-dim)' : 'none', fontFamily: 'Space Grotesk', fontWeight: 600 }}>
                      {si + 1}
                    </td>
                    {Array.from({ length: dayCount }, (_, di) => {
                      const slot     = getSlot(di + 1, si + 1)
                      const hasClaim = !!slot?.claim
                      return (
                        <td
                          key={di}
                          onClick={() => handleCellTap(slot)}
                          style={{
                            padding: '10px 6px', textAlign: 'center',
                            background: hasClaim ? 'var(--teal-dim)' : 'transparent',
                            cursor: hasClaim ? 'pointer' : 'default',
                            borderBottom: si < cohort.sections - 1 ? '1px solid var(--border-dim)' : 'none',
                            transition: 'background 0.15s',
                          }}
                        >
                          {hasClaim
                            ? <div style={{ fontSize: 11, color: 'var(--teal)', fontWeight: 600, lineHeight: 1.2, fontFamily: 'Space Grotesk' }}>{slot.claim.instructorName.split(' ')[0]}</div>
                            : <div style={{ fontSize: 10, color: 'var(--text-4)' }}>Open</div>}
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
          <div style={{ padding: '0 16px', paddingBottom: 100 }}>
            <div className="section-label" style={{ marginBottom: 10 }}>Instructors</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {instructorNames.map(name => {
                const nameClaims = claims.filter(cl => cl.cohortId === id && cl.instructorName === name)
                return (
                  <div key={name} className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, color: 'var(--accent)', flexShrink: 0,
                    }}>
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

        {instructorNames.length === 0 && <div style={{ paddingBottom: 100 }} />}
      </div>

      <BottomSheet isOpen={!!pendingUnclaim} onClose={() => setPendingUnclaim(null)} title="Remove instructor?">
        {pendingUnclaim && (
          <div>
            <div style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 4 }}>
              {pendingUnclaim.claim?.instructorName} — {course?.name} D{pendingUnclaim.day}, Sec {pendingUnclaim.section}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>Remove this instructor from the slot?</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={confirmUnclaim}>Remove Claim</button>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setPendingUnclaim(null)}>Cancel</button>
            </div>
          </div>
        )}
      </BottomSheet>

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

const thStyle = (align) => ({
  padding: '8px 8px', fontSize: 10, fontFamily: 'Space Grotesk', fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)',
  textAlign: align, borderBottom: '1px solid var(--border-dim)', whiteSpace: 'nowrap',
})
