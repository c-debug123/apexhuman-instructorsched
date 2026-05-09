import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'

function ChevronLeft()  { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg> }
function ChevronRight() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg> }

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS   = ['January','February','March','April','May','June','July','August','September','October','November','December']

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function calcEndTime(startTime, durationHours) {
  if (!startTime || !durationHours) return ''
  const [h, m] = startTime.split(':').map(Number)
  const totalMins = h * 60 + m + Math.round(durationHours * 60)
  const endH = Math.floor(totalMins / 60) % 24
  const endM = totalMins % 60
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
}

function formatDayLabel(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

function getDayEvents(dateStr, cohorts, courses, modules, claims) {
  const events = []
  for (const cohort of cohorts) {
    const course = courses.find(c => c.id === cohort.courseId)
    if (!course) continue
    const slotDates = cohort.slotDates || []
    for (let i = 0; i < slotDates.length; i++) {
      const sd = slotDates[i]
      if (sd.date !== dateStr) continue
      const courseSlot    = course.days?.[i]
      const mod           = modules.find(m => m.id === courseSlot?.moduleId)
      const durationHours = mod?.durationHours || 1
      const startTime     = sd.startTime || '09:00'
      const endTime       = calcEndTime(startTime, durationHours)
      const sectionClaims = claims.filter(cl => cl.cohortId === cohort.id && cl.day === i + 1)
      events.push({
        cohort,
        course,
        mod,
        slotIndex: sd.slotIndex,
        startTime,
        endTime,
        durationHours,
        label: courseSlot?.label || mod?.name || `Module ${sd.slotIndex + 1}`,
        filled: sectionClaims.length,
        total: cohort.sections,
        room: sd.room || '',
        address: sd.address || '',
      })
    }
  }
  return events.sort((a, b) => a.startTime.localeCompare(b.startTime))
}

function getDatesWithEvents(cohorts) {
  const dates = new Set()
  for (const cohort of cohorts) {
    for (const sd of cohort.slotDates || []) {
      if (sd.date) dates.add(sd.date)
    }
  }
  return dates
}

export default function CalendarView() {
  const navigate = useNavigate()
  const { cohorts, courses, modules, claims } = useApp()

  const today    = new Date(); today.setHours(0,0,0,0)
  const todayStr = toDateStr(today)

  const [monthDate,   setMonthDate]   = useState(() => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d })
  const [selectedDay, setSelectedDay] = useState(null)

  const prevMonth = () => setMonthDate(d => { const n = new Date(d); n.setMonth(n.getMonth()-1); return n })
  const nextMonth = () => setMonthDate(d => { const n = new Date(d); n.setMonth(n.getMonth()+1); return n })

  const eventDates = useMemo(() => getDatesWithEvents(cohorts), [cohorts])

  const cells = useMemo(() => {
    const year = monthDate.getFullYear(), month = monthDate.getMonth()
    const firstDay    = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrev  = new Date(year, month, 0).getDate()
    const totalCells  = Math.ceil((firstDay + daysInMonth) / 7) * 7
    return Array.from({ length: totalCells }, (_, i) => {
      const offset = i - firstDay
      let date, inMonth
      if (offset < 0)                 { date = new Date(year, month - 1, daysInPrev + offset + 1); inMonth = false }
      else if (offset >= daysInMonth) { date = new Date(year, month + 1, offset - daysInMonth + 1); inMonth = false }
      else                            { date = new Date(year, month, offset + 1); inMonth = true }
      const dateStr   = toDateStr(date)
      const hasEvents = eventDates.has(dateStr)
      const events    = hasEvents ? getDayEvents(dateStr, cohorts, courses, modules, claims) : []
      const uniqueCourses = hasEvents ? [...new Map(events.map(e => [e.cohort.courseId, e.course])).values()].filter(Boolean) : []
      const dayTotal      = events.reduce((s, e) => s + e.total, 0)
      const dayFilled     = events.reduce((s, e) => s + e.filled, 0)
      const fillPct       = dayTotal > 0 ? dayFilled / dayTotal : 0
      const dayTotalHours = events.reduce((s, e) => s + e.durationHours, 0)
      const sessionCount  = events.length
      return { date, dateStr, inMonth, hasEvents, events, uniqueCourses, dayTotal, dayFilled, fillPct, dayTotalHours, sessionCount }
    })
  }, [monthDate, cohorts, courses, modules, claims, eventDates])

  const monthStats = useMemo(() => {
    const year = monthDate.getFullYear(), month = monthDate.getMonth()
    const monthStr = `${year}-${String(month+1).padStart(2,'0')}`
    let sessionCount = 0, totalSlots = 0, filledSlots = 0
    for (const cohort of cohorts) {
      for (const sd of cohort.slotDates || []) {
        if (!sd.date?.startsWith(monthStr)) continue
        sessionCount++
        totalSlots  += cohort.sections
        const course    = courses.find(c => c.id === cohort.courseId)
        const dayCount  = course?.days?.length || 0
        filledSlots += claims.filter(cl => cl.cohortId === cohort.id && cl.day === sd.slotIndex + 1).length
      }
    }
    return { sessionCount, totalSlots, filledSlots }
  }, [monthDate, cohorts, courses, claims])

  const selectedEvents = useMemo(
    () => selectedDay ? getDayEvents(selectedDay, cohorts, courses, modules, claims) : [],
    [selectedDay, cohorts, courses, modules, claims]
  )

  return (
    <div className="admin-bg">
      <div className="z1 page">
        <div className="safe-top" style={{ padding: '0 16px', paddingTop: 'max(16px, env(safe-area-inset-top))' }}>
          <div style={{ paddingTop: 8, paddingBottom: 16 }}>
            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 20, color: 'var(--text-1)' }}>Calendar</span>
          </div>

          {/* Month nav */}
          <div className="card" style={{ padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center' }}><ChevronLeft /></button>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 16, color: 'var(--text-1)' }}>{MONTHS[monthDate.getMonth()]} {monthDate.getFullYear()}</div>
              {monthStats.sessionCount > 0 && (
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, fontFamily: 'Space Grotesk' }}>
                  {monthStats.sessionCount} session{monthStats.sessionCount !== 1 ? 's' : ''} · {monthStats.filledSlots}/{monthStats.totalSlots} slots filled
                </div>
              )}
            </div>
            <button onClick={nextMonth} style={{ background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center' }}><ChevronRight /></button>
          </div>

          {/* Weekday headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
            {WEEKDAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontFamily: 'Space Grotesk', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: d === 'Sun' || d === 'Sat' ? 'var(--text-4)' : 'var(--text-3)', paddingBottom: 4 }}>{d[0]}</div>
            ))}
          </div>
        </div>

        <div style={{ padding: '0 16px', paddingBottom: 100 }}>
          {/* Month grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 20 }}>
            {cells.map(({ date, dateStr, inMonth, hasEvents, uniqueCourses, fillPct, dayTotalHours, sessionCount }) => {
              const isToday    = dateStr === todayStr
              const isSelected = dateStr === selectedDay
              const isWeekend  = date.getDay() === 0 || date.getDay() === 6
              const hoursLabel = dayTotalHours > 0 ? (Number.isInteger(dayTotalHours) ? `${dayTotalHours}h` : `${dayTotalHours.toFixed(1)}h`) : ''
              return (
                <button
                  key={dateStr}
                  onClick={() => hasEvents && setSelectedDay(isSelected ? null : dateStr)}
                  style={{
                    position: 'relative',
                    background: isSelected ? 'rgba(124,106,247,0.15)' : hasEvents ? 'rgba(255,255,255,0.04)' : 'transparent',
                    border: isSelected ? '1px solid rgba(124,106,247,0.5)' : isToday ? '1px solid rgba(124,106,247,0.4)' : hasEvents ? '1px solid var(--border)' : '1px solid transparent',
                    borderRadius: 'var(--radius-sm)', cursor: hasEvents ? 'pointer' : 'default',
                    padding: '6px 4px 5px', minHeight: 58,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                  }}
                >
                  {/* Session count badge */}
                  {hasEvents && sessionCount > 1 && (
                    <div style={{
                      position: 'absolute', top: 4, right: 4,
                      background: 'rgba(124,106,247,0.25)', borderRadius: 'var(--radius-full)',
                      fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 8,
                      color: 'var(--accent)', lineHeight: 1, padding: '2px 4px',
                    }}>
                      {sessionCount}×
                    </div>
                  )}

                  {/* Date number */}
                  <div style={{
                    fontFamily: 'Space Grotesk', fontWeight: isToday ? 700 : 500, fontSize: 13, lineHeight: 1,
                    color: isToday ? 'var(--accent)' : inMonth ? (hasEvents ? 'var(--text-1)' : isWeekend ? 'var(--text-4)' : 'var(--text-3)') : 'rgba(255,255,255,0.12)',
                    marginBottom: 4, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '50%', background: isToday ? 'rgba(124,106,247,0.2)' : 'transparent',
                  }}>
                    {date.getDate()}
                  </div>

                  {/* Course dots */}
                  {hasEvents && (
                    <div style={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 2 }}>
                      {uniqueCourses.slice(0, 2).map(c => <div key={c.id} style={{ width: 5, height: 5, borderRadius: '50%', background: c.color }} />)}
                      {uniqueCourses.length > 2 && <div style={{ fontSize: 7, color: 'var(--text-4)', lineHeight: '5px', fontFamily: 'Space Grotesk', fontWeight: 700 }}>+{uniqueCourses.length - 2}</div>}
                    </div>
                  )}

                  {/* Total hours */}
                  {hasEvents && hoursLabel && (
                    <div style={{ fontSize: 8, color: 'var(--text-4)', fontFamily: 'Space Grotesk', fontWeight: 600, marginBottom: 3, lineHeight: 1 }}>
                      {hoursLabel}
                    </div>
                  )}

                  {/* Fill bar */}
                  {hasEvents && (
                    <div style={{ width: '100%', height: 3, borderRadius: 2, background: 'var(--surface-lg)', overflow: 'hidden', marginTop: 'auto' }}>
                      <div style={{ height: '100%', width: `${fillPct * 100}%`, background: fillPct === 1 ? 'var(--green)' : fillPct >= 0.5 ? 'var(--amber)' : 'var(--red)', borderRadius: 2, transition: 'width 300ms ease' }} />
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Day detail — Google Calendar agenda style */}
          {selectedDay ? (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 15, color: 'var(--text-1)' }}>
                  {formatDayLabel(selectedDay)}
                </div>
                <button
                  onClick={() => setSelectedDay(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-4)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '4px 8px' }}
                >×</button>
              </div>

              {selectedEvents.length === 0 ? (
                <div style={{ padding: '20px 0', fontSize: 13, color: 'var(--text-4)', textAlign: 'center' }}>No sessions on this day.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedEvents.map((ev, i) => {
                    const pct      = ev.total > 0 ? ev.filled / ev.total : 0
                    const barColor = pct === 1 ? 'var(--green)' : pct >= 0.5 ? 'var(--amber)' : 'var(--red)'
                    return (
                      <button
                        key={`${ev.cohort.id}-${ev.slotIndex}-${i}`}
                        onClick={() => navigate(`/admin/cohorts/${ev.cohort.id}`)}
                        className="card card-hover"
                        style={{ padding: 0, overflow: 'hidden', textAlign: 'left', width: '100%', cursor: 'pointer' }}
                      >
                        <div style={{ display: 'flex' }}>
                          <div style={{ width: 4, background: ev.course.color, flexShrink: 0 }} />
                          <div style={{ flex: 1, padding: '12px 14px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                            {/* Time column */}
                            <div style={{ flexShrink: 0, textAlign: 'right', minWidth: 52 }}>
                              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, color: 'var(--text-1)', lineHeight: 1.2 }}>
                                {ev.startTime}
                              </div>
                              {ev.endTime && (
                                <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>
                                  {ev.endTime}
                                </div>
                              )}
                              <div style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 3 }}>
                                {ev.durationHours}h
                              </div>
                            </div>

                            {/* Divider */}
                            <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--border-dim)', flexShrink: 0 }} />

                            {/* Content */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 14, color: 'var(--text-1)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {ev.label}
                              </div>
                              <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: ev.room || ev.address ? 4 : 8 }}>
                                {ev.course.name} · {ev.total} section{ev.total !== 1 ? 's' : ''}
                              </div>
                              {(ev.room || ev.address) && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                  <span style={{ fontSize: 11, color: 'var(--text-4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {[ev.room, ev.address].filter(Boolean).join(' · ')}
                                  </span>
                                </div>
                              )}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div className="progress-track" style={{ flex: 1 }}>
                                  <div className="progress-fill" style={{ width: `${pct * 100}%`, background: barColor }} />
                                </div>
                                <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'Space Grotesk', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                  {ev.filled}/{ev.total}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Course legend */
            <div className="card" style={{ padding: '12px 14px' }}>
              <div style={{ fontFamily: 'Space Grotesk', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 10 }}>Courses</div>
              {courses.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--text-4)' }}>No courses yet.</div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
                  {courses.map(c => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color }} />
                      <span style={{ fontSize: 12, color: 'var(--text-2)', fontFamily: 'Space Grotesk' }}>{c.code}: {c.shortName || c.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
