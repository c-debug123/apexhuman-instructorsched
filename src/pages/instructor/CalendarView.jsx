import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { addDays, formatDate } from '../../data/courses'
import BottomSheet from '../../components/BottomSheet'
import InstructorNameChip from '../../components/InstructorNameChip'

function ChevronLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  )
}
function ChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  )
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function getDayData(dateStr, cohorts, claims, myName, courses, modules, eligibleGroups) {
  function isEligible(mod) {
    if (!mod) return true
    if (!eligibleGroups) return true
    if (eligibleGroups.size === 0) return false
    return (mod.tags || []).some(tag => eligibleGroups.has(tag))
  }

  let mySlots = []
  let openSlots = []
  cohorts.forEach(cohort => {
    const d0 = new Date(cohort.startDate + 'T00:00:00')
    const d = new Date(dateStr + 'T00:00:00')
    const diff = Math.round((d - d0) / 86400000)
    const totalDays = (course => course?.days?.length || 5)(courses.find(c => c.id === cohort.courseId))
    if (diff < 0 || diff >= totalDays) return
    const day = diff + 1
    const course = courses.find(c => c.id === cohort.courseId)
    const dayDef = course?.days?.[diff]
    const mod = dayDef?.moduleId ? modules.find(m => m.id === dayDef.moduleId) : null
    const sd = (cohort.slotDates || [])[diff]
    const moduleName = mod?.name || dayDef?.label || null
    const startTime = sd?.startTime || null

    for (let section = 1; section <= cohort.sections; section++) {
      const claim = claims.find(cl => cl.cohortId === cohort.id && cl.day === day && cl.section === section)
      const slot = { cohort, day, totalDays, section, claim: claim || null, course, mod, moduleName, startTime }
      if (claim) {
        if (claim.instructorName === myName) mySlots.push(slot)
      } else if (isEligible(mod)) {
        openSlots.push(slot)
      }
    }
  })

  const byTime = (a, b) => (a.startTime || '99:99').localeCompare(b.startTime || '99:99') || a.section - b.section
  mySlots.sort(byTime)
  openSlots.sort(byTime)
  return { mySlots, openSlots }
}

export default function InstructorCalendarView() {
  const navigate = useNavigate()
  const { cohorts, claims, courses, modules, instructors, removeClaim, addClaim, currentInstructor } = useApp()
  const name         = currentInstructor?.name || ''
  const instructorId = currentInstructor?.id || null

  const eligibleGroups = useMemo(() => {
    if (!instructorId) return null
    const inst = instructors.find(i => i.id === instructorId)
    if (!inst) return null
    return new Set(inst.eligibleGroups || [])
  }, [instructorId, instructors])

  const today = new Date()
  today.setHours(0,0,0,0)
  const todayStr = toDateStr(today)

  const [monthDate, setMonthDate] = useState(() => {
    const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d
  })
  const [selectedDay, setSelectedDay] = useState(null)
  const [pendingUnclaim, setPendingUnclaim] = useState(null)
  const [pendingClaim, setPendingClaim] = useState(null)

  function prevMonth() { setMonthDate(d => { const n = new Date(d); n.setMonth(n.getMonth()-1); return n }) }
  function nextMonth() { setMonthDate(d => { const n = new Date(d); n.setMonth(n.getMonth()+1); return n }) }

  const cells = useMemo(() => {
    const year = monthDate.getFullYear()
    const month = monthDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrev = new Date(year, month, 0).getDate()
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7
    const grid = []
    for (let i = 0; i < totalCells; i++) {
      const offset = i - firstDay
      let date, inMonth
      if (offset < 0) { date = new Date(year, month - 1, daysInPrev + offset + 1); inMonth = false }
      else if (offset >= daysInMonth) { date = new Date(year, month + 1, offset - daysInMonth + 1); inMonth = false }
      else { date = new Date(year, month, offset + 1); inMonth = true }
      const dateStr = toDateStr(date)
      const { mySlots, openSlots } = getDayData(dateStr, cohorts, claims, name, courses, modules, eligibleGroups)
      grid.push({ date, dateStr, inMonth, mySlots, openSlots })
    }
    return grid
  }, [monthDate, cohorts, claims, name, courses, modules, eligibleGroups])

  const myClaimsThisMonth = useMemo(() => {
    const monthStr = `${monthDate.getFullYear()}-${String(monthDate.getMonth()+1).padStart(2,'0')}`
    return claims.filter(cl => {
      const cohort = cohorts.find(c => c.id === cl.cohortId)
      if (!cohort || cl.instructorName !== name) return false
      const date = addDays(cohort.startDate, cl.day - 1)
      return date.startsWith(monthStr)
    })
  }, [monthDate, cohorts, claims, name])

  const selectedData = selectedDay ? getDayData(selectedDay, cohorts, claims, name, courses, modules, eligibleGroups) : { mySlots: [], openSlots: [] }
  const selectedDateLabel = selectedDay
    ? new Date(selectedDay + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : ''

  const hasConflict = pendingClaim
    ? claims.some(cl => cl.instructorName === name && cl.date === pendingClaim.dateStr)
    : false

  function confirmClaim() {
    if (!pendingClaim || hasConflict) return
    addClaim({
      id: crypto.randomUUID(),
      cohortId: pendingClaim.cohort.id,
      courseId: pendingClaim.cohort.courseId,
      day: pendingClaim.day,
      section: pendingClaim.section,
      date: pendingClaim.dateStr,
      instructorType: pendingClaim.course ? (pendingClaim.day === 3 || pendingClaim.day === 4) && pendingClaim.cohort.courseId === 'c1' ? 'Roblox Expert' : ['AI Educator','Business Strategist','AI Educator','AI Educator','Growth Marketer'][pendingClaim.day - 1] : 'AI Educator',
      instructorName: name,
      claimedAt: new Date().toISOString(),
    })
    setPendingClaim(null)
    setSelectedDay(null)
  }

  function confirmUnclaim() {
    if (!pendingUnclaim) return
    removeClaim(pendingUnclaim.claim.id)
    setPendingUnclaim(null)
    setSelectedDay(null)
  }

  return (
    <div className="instructor-bg">
      <div className="z1 page">
        {/* Header */}
        <div className="safe-top" style={{ padding: '0 16px', paddingTop: 'max(16px, env(safe-area-inset-top))' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 16 }}>
            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 20, color: 'var(--text-1)' }}>
              My Calendar
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <InstructorNameChip />
            </div>
          </div>

          {/* Month navigator */}
          <div className="card" style={{ padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', padding: '4px 8px', borderRadius: 'var(--radius-sm)', display: 'flex' }}>
              <ChevronLeft />
            </button>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 16, color: 'var(--text-1)' }}>
                {MONTHS[monthDate.getMonth()]} {monthDate.getFullYear()}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, fontFamily: 'Space Grotesk' }}>
                {myClaimsThisMonth.length > 0
                  ? `${myClaimsThisMonth.length} teaching day${myClaimsThisMonth.length !== 1 ? 's' : ''} booked`
                  : 'No bookings this month'}
              </div>
            </div>
            <button onClick={nextMonth} style={{ background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', padding: '4px 8px', borderRadius: 'var(--radius-sm)', display: 'flex' }}>
              <ChevronRight />
            </button>
          </div>

          {/* Weekday labels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
            {WEEKDAYS.map(d => (
              <div key={d} style={{
                textAlign: 'center', fontFamily: 'Space Grotesk', fontSize: 10, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.06em',
                color: d === 'Sun' || d === 'Sat' ? 'var(--text-4)' : 'var(--text-3)', paddingBottom: 4,
              }}>
                {d[0]}
              </div>
            ))}
          </div>
        </div>

        {/* Calendar grid */}
        <div style={{ padding: '0 16px', paddingBottom: 100 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
            {cells.map(({ date, dateStr, inMonth, mySlots, openSlots }) => {
              const isToday = dateStr === todayStr
              const isSelected = dateStr === selectedDay
              const isMine = mySlots.length > 0
              const hasOpen = openSlots.length > 0
              const isActive = isMine || hasOpen
              const isWeekend = date.getDay() === 0 || date.getDay() === 6

              return (
                <button
                  key={dateStr}
                  onClick={() => isActive && setSelectedDay(isSelected ? null : dateStr)}
                  style={{
                    position: 'relative',
                    background: isSelected
                      ? 'rgba(45,212,191,0.15)'
                      : isMine
                        ? 'rgba(45,212,191,0.10)'
                        : 'transparent',
                    border: isSelected
                      ? '1px solid rgba(45,212,191,0.6)'
                      : isMine
                        ? '1px solid rgba(45,212,191,0.35)'
                        : isToday
                          ? '1px solid rgba(124,106,247,0.4)'
                          : hasOpen
                            ? '1px solid var(--border)'
                            : '1px solid transparent',
                    borderRadius: 'var(--radius-sm)',
                    cursor: isActive ? 'pointer' : 'default',
                    padding: '6px 4px 5px',
                    minHeight: 58,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                  }}
                >
                  {/* Date number */}
                  <div style={{
                    fontFamily: 'Space Grotesk',
                    fontWeight: isToday ? 700 : isMine ? 600 : 500,
                    fontSize: 13, lineHeight: 1,
                    color: isToday ? 'var(--accent)' : isMine ? 'var(--teal)' : inMonth ? (isWeekend ? 'var(--text-4)' : 'var(--text-3)') : 'rgba(255,255,255,0.12)',
                    marginBottom: 4,
                    width: 22, height: 22,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '50%',
                    background: isToday ? 'rgba(124,106,247,0.2)' : 'transparent',
                  }}>
                    {date.getDate()}
                  </div>

                  {/* My claimed course dots */}
                  {isMine && (
                    <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginBottom: 2, flexWrap: 'wrap' }}>
                      {[...new Map(mySlots.map(s => [s.course?.id, s.course])).values()].slice(0, 3).map(c => c && (
                        <div key={c.id} style={{ width: 6, height: 6, borderRadius: '50%', background: c.color }} />
                      ))}
                    </div>
                  )}

                  {/* Open slot indicator */}
                  {hasOpen && !isMine && (
                    <div style={{ marginBottom: 2 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--border-md)' }} />
                    </div>
                  )}

                  {/* Bottom indicator */}
                  {isActive && (
                    <div style={{
                      width: '100%', height: 3, borderRadius: 2, marginTop: 'auto',
                      background: isMine ? 'var(--teal)' : 'var(--border-md)',
                      opacity: isMine ? 0.7 : 0.4,
                    }} />
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="card" style={{ marginTop: 16, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { bar: 'var(--teal)', label: 'Your booked teaching days', dim: false },
              { bar: 'var(--border-md)', label: 'Days with open slots available to claim', dim: true },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 20, height: 3, borderRadius: 2, background: item.bar, opacity: item.dim ? 0.4 : 0.7, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--text-2)', fontFamily: 'Space Grotesk' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Day detail sheet */}
      <BottomSheet isOpen={!!selectedDay && !pendingUnclaim && !pendingClaim} onClose={() => setSelectedDay(null)} title={selectedDateLabel}>
        {selectedDay && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* My slots */}
            {selectedData.mySlots.length > 0 && (
              <div>
                <div style={{ fontFamily: 'Space Grotesk', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--teal)', marginBottom: 8 }}>
                  Your bookings
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selectedData.mySlots.map(s => (
                    <div key={`${s.cohort.id}-d${s.day}-s${s.section}`} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                      <div style={{ display: 'flex' }}>
                        <div style={{ width: 4, background: s.course?.color, flexShrink: 0 }} />
                        <div style={{ flex: 1, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontSize: 11, fontFamily: 'Space Grotesk', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                              {s.course ? `${s.course.code}: ${s.course.name}` : s.cohort.courseId}
                            </div>
                            {s.moduleName && (
                              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 14, color: 'var(--text-1)', marginBottom: 3 }}>
                                {s.moduleName}
                              </div>
                            )}
                            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                              M{s.day} of {s.totalDays} · Sec {s.section}
                              {s.startTime && <span style={{ marginLeft: 6, color: 'var(--teal)' }}>{s.startTime}</span>}
                            </div>
                          </div>
                          <button
                            onClick={() => setPendingUnclaim(s)}
                            className="btn btn-ghost"
                            style={{ fontSize: 11, padding: '4px 10px', minHeight: 28, color: 'var(--red)' }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Open slots */}
            {selectedData.openSlots.length > 0 && (
              <div>
                <div style={{ fontFamily: 'Space Grotesk', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 8 }}>
                  {selectedData.mySlots.length > 0 ? 'Other open slots' : 'Open slots — available to claim'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selectedData.openSlots.slice(0, 5).map(s => (
                    <div key={`${s.cohort.id}-d${s.day}-s${s.section}`} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                      <div style={{ display: 'flex' }}>
                        <div style={{ width: 4, background: s.course?.color, flexShrink: 0 }} />
                        <div style={{ flex: 1, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontSize: 11, fontFamily: 'Space Grotesk', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                              {s.course ? `${s.course.code}: ${s.course.name}` : s.cohort.courseId}
                            </div>
                            {s.moduleName && (
                              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 14, color: 'var(--text-1)', marginBottom: 3 }}>
                                {s.moduleName}
                              </div>
                            )}
                            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                              M{s.day} of {s.totalDays} · Sec {s.section}
                              {s.startTime && <span style={{ marginLeft: 6, color: 'var(--teal)' }}>{s.startTime}</span>}
                            </div>
                          </div>
                          <button
                            onClick={() => setPendingClaim({ ...s, dateStr: selectedDay })}
                            className="btn btn-teal"
                            style={{ fontSize: 11, padding: '4px 10px', minHeight: 28 }}
                          >
                            Claim
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {selectedData.openSlots.length > 5 && (
                    <button className="btn btn-ghost" onClick={() => { setSelectedDay(null); navigate('/schedule/slots') }} style={{ fontSize: 12 }}>
                      View all {selectedData.openSlots.length} open slots →
                    </button>
                  )}
                </div>
              </div>
            )}

            {selectedData.mySlots.length === 0 && selectedData.openSlots.length === 0 && (
              <p style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: '20px 0' }}>No teaching activity on this day.</p>
            )}
          </div>
        )}
      </BottomSheet>

      {/* Unclaim confirmation */}
      <BottomSheet isOpen={!!pendingUnclaim} onClose={() => setPendingUnclaim(null)} title="Remove this booking?">
        {pendingUnclaim && (
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20, lineHeight: 1.5 }}>
              {pendingUnclaim.course ? `${pendingUnclaim.course.code}: ${pendingUnclaim.course.name}` : ''}<br />
              Module {pendingUnclaim.day} of {pendingUnclaim.totalDays ?? 5} · Section {pendingUnclaim.section}<br />
              {formatDate(selectedDay || '')}<br /><br />
              This slot will become available for other instructors.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={confirmUnclaim}>Remove</button>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setPendingUnclaim(null)}>Keep It</button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Claim confirmation */}
      <BottomSheet isOpen={!!pendingClaim} onClose={() => setPendingClaim(null)} title="Claim this slot?">
        {pendingClaim && (
          <div>
            {hasConflict ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span style={{ fontSize: 13, color: 'var(--amber)' }}>You already have a booking on {formatDate(selectedDay || '')}.</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 16 }}>
                  You can only teach one session per day. Remove your existing booking first if you want to switch.
                </div>
                <button className="btn btn-ghost" style={{ width: '100%' }} onClick={() => setPendingClaim(null)}>Got it</button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 0', marginBottom: 16, borderBottom: '1px solid var(--border-dim)' }}>
                  <div style={{ width: 4, height: 40, borderRadius: 2, background: pendingClaim.course?.color, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 14, color: 'var(--text-1)' }}>
                      {pendingClaim.course ? `${pendingClaim.course.code}: ${pendingClaim.course.name}` : ''}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-3)' }}>
                      Module {pendingClaim.day} of {pendingClaim.totalDays ?? 5} · Section {pendingClaim.section} · {formatDate(selectedDay || '')}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-teal" style={{ flex: 1 }} onClick={confirmClaim}>Claim</button>
                  <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setPendingClaim(null)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}
      </BottomSheet>

    </div>
  )
}
