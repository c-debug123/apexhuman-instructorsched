import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { COURSES, addDays } from '../../data/courses'
import BottomNav from '../../components/BottomNav'
import BottomSheet from '../../components/BottomSheet'
import RoleSwitcher from '../../components/RoleSwitcher'

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

function getDayEvents(dateStr, cohorts, claims) {
  return cohorts.flatMap(cohort => {
    const d0 = new Date(cohort.startDate + 'T00:00:00')
    const d = new Date(dateStr + 'T00:00:00')
    const diff = Math.round((d - d0) / 86400000)
    if (diff < 0 || diff > 4) return []
    const day = diff + 1
    const filled = claims.filter(cl => cl.cohortId === cohort.id && cl.day === day).length
    const total = cohort.sections
    return [{ cohort, day, filled, total }]
  })
}

export default function CalendarView() {
  const navigate = useNavigate()
  const { cohorts, claims } = useApp()

  const today = new Date()
  today.setHours(0,0,0,0)
  const todayStr = toDateStr(today)

  const [monthDate, setMonthDate] = useState(() => {
    const d = new Date()
    d.setDate(1)
    d.setHours(0,0,0,0)
    return d
  })
  const [selectedDay, setSelectedDay] = useState(null)

  function prevMonth() {
    setMonthDate(d => { const n = new Date(d); n.setMonth(n.getMonth()-1); return n })
  }
  function nextMonth() {
    setMonthDate(d => { const n = new Date(d); n.setMonth(n.getMonth()+1); return n })
  }

  // Build 6-row calendar grid for current month
  const cells = useMemo(() => {
    const year = monthDate.getFullYear()
    const month = monthDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay() // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrev = new Date(year, month, 0).getDate()

    const grid = []
    let totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7

    for (let i = 0; i < totalCells; i++) {
      const offset = i - firstDay
      let date, inMonth
      if (offset < 0) {
        date = new Date(year, month - 1, daysInPrev + offset + 1)
        inMonth = false
      } else if (offset >= daysInMonth) {
        date = new Date(year, month + 1, offset - daysInMonth + 1)
        inMonth = false
      } else {
        date = new Date(year, month, offset + 1)
        inMonth = true
      }
      const dateStr = toDateStr(date)
      const events = getDayEvents(dateStr, cohorts, claims)
      grid.push({ date, dateStr, inMonth, events })
    }
    return grid
  }, [monthDate, cohorts, claims])

  // Monthly summary stats
  const monthStats = useMemo(() => {
    const monthStr = `${monthDate.getFullYear()}-${String(monthDate.getMonth()+1).padStart(2,'0')}`
    let activeDays = 0, totalSlots = 0, filledSlots = 0
    cohorts.forEach(cohort => {
      for (let day = 1; day <= 5; day++) {
        const dateStr = addDays(cohort.startDate, day - 1)
        if (!dateStr.startsWith(monthStr)) continue
        activeDays++
        totalSlots += cohort.sections
        filledSlots += claims.filter(cl => cl.cohortId === cohort.id && cl.day === day).length
      }
    })
    return { activeDays, totalSlots, filledSlots, openSlots: totalSlots - filledSlots }
  }, [monthDate, cohorts, claims])

  const selectedEvents = selectedDay ? getDayEvents(selectedDay, cohorts, claims) : []

  const selectedDateLabel = selectedDay
    ? new Date(selectedDay + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : ''

  return (
    <div className="admin-bg">
      <div className="z1 page">
        {/* Header */}
        <div className="safe-top" style={{ padding: '0 16px', paddingTop: 'max(16px, env(safe-area-inset-top))' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 16 }}>
            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 20, color: 'var(--text-1)' }}>
              Apex Humans
            </span>
            <RoleSwitcher role="admin" />
          </div>

          {/* Month navigator */}
          <div className="card" style={{ padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              onClick={prevMonth}
              style={{ background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', padding: '4px 8px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center' }}
            >
              <ChevronLeft />
            </button>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 16, color: 'var(--text-1)' }}>
                {MONTHS[monthDate.getMonth()]} {monthDate.getFullYear()}
              </div>
              {monthStats.activeDays > 0 && (
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, fontFamily: 'Space Grotesk' }}>
                  {monthStats.activeDays} teaching day{monthStats.activeDays !== 1 ? 's' : ''} · {monthStats.filledSlots}/{monthStats.totalSlots} slots filled
                </div>
              )}
            </div>
            <button
              onClick={nextMonth}
              style={{ background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', padding: '4px 8px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center' }}
            >
              <ChevronRight />
            </button>
          </div>

          {/* Weekday labels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
            {WEEKDAYS.map(d => (
              <div key={d} style={{
                textAlign: 'center', fontFamily: 'Space Grotesk', fontSize: 10, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.06em',
                color: d === 'Sun' || d === 'Sat' ? 'var(--text-4)' : 'var(--text-3)',
                paddingBottom: 4,
              }}>
                {d[0]}
              </div>
            ))}
          </div>
        </div>

        {/* Calendar grid */}
        <div style={{ padding: '0 16px', paddingBottom: 100 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
            {cells.map(({ date, dateStr, inMonth, events }) => {
              const isToday = dateStr === todayStr
              const isSelected = dateStr === selectedDay
              const isWeekend = date.getDay() === 0 || date.getDay() === 6
              const hasEvents = events.length > 0

              // Unique courses running this day (for color dots)
              const uniqueCourses = [...new Map(events.map(e => [e.cohort.courseId, COURSES[e.cohort.courseId]])).values()]

              // Overall fill for this day
              const dayTotal = events.reduce((s, e) => s + e.total, 0)
              const dayFilled = events.reduce((s, e) => s + e.filled, 0)
              const fillPct = dayTotal > 0 ? dayFilled / dayTotal : 0

              return (
                <button
                  key={dateStr}
                  onClick={() => hasEvents && setSelectedDay(isSelected ? null : dateStr)}
                  style={{
                    position: 'relative',
                    background: isSelected
                      ? 'rgba(124,106,247,0.15)'
                      : hasEvents
                        ? 'rgba(255,255,255,0.04)'
                        : 'transparent',
                    border: isSelected
                      ? '1px solid rgba(124,106,247,0.5)'
                      : isToday
                        ? '1px solid rgba(124,106,247,0.4)'
                        : hasEvents
                          ? '1px solid var(--border)'
                          : '1px solid transparent',
                    borderRadius: 'var(--radius-sm)',
                    cursor: hasEvents ? 'pointer' : 'default',
                    padding: '6px 4px 5px',
                    minHeight: 58,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                  }}
                >
                  {/* Date number */}
                  <div style={{
                    fontFamily: 'Space Grotesk', fontWeight: isToday ? 700 : 500,
                    fontSize: 13, lineHeight: 1,
                    color: isToday ? 'var(--accent)' : inMonth ? (hasEvents ? 'var(--text-1)' : isWeekend ? 'var(--text-4)' : 'var(--text-3)') : 'var(--text-5, rgba(255,255,255,0.12))',
                    marginBottom: 4,
                    width: 22, height: 22,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '50%',
                    background: isToday ? 'rgba(124,106,247,0.2)' : 'transparent',
                  }}>
                    {date.getDate()}
                  </div>

                  {/* Course dots */}
                  {hasEvents && (
                    <div style={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 3 }}>
                      {uniqueCourses.slice(0, 3).map(course => (
                        <div key={course.id} style={{ width: 6, height: 6, borderRadius: '50%', background: course.color, flexShrink: 0 }} />
                      ))}
                      {uniqueCourses.length > 3 && (
                        <div style={{ fontSize: 8, color: 'var(--text-4)', lineHeight: '6px', fontFamily: 'Space Grotesk', fontWeight: 600 }}>+{uniqueCourses.length - 3}</div>
                      )}
                    </div>
                  )}

                  {/* Fill bar */}
                  {hasEvents && (
                    <div style={{ width: '100%', height: 3, borderRadius: 2, background: 'var(--surface-lg)', overflow: 'hidden', marginTop: 'auto' }}>
                      <div style={{
                        height: '100%',
                        width: `${fillPct * 100}%`,
                        background: fillPct === 1 ? 'var(--green)' : fillPct >= 0.5 ? 'var(--amber)' : 'var(--red)',
                        borderRadius: 2,
                        transition: 'width 300ms ease',
                      }} />
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="card" style={{ marginTop: 16, padding: '12px 14px' }}>
            <div style={{ fontFamily: 'Space Grotesk', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 10 }}>
              Courses
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
              {Object.values(COURSES).map(course => (
                <div key={course.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: course.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--text-2)', fontFamily: 'Space Grotesk' }}>{course.code}: {course.shortName}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid var(--border-dim)', marginTop: 12, paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 7 }}>
              <div style={{ fontFamily: 'Space Grotesk', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 2 }}>
                Fill bar — instructor coverage per day
              </div>
              {[
                { label: 'All sections have an instructor assigned', color: 'var(--green)' },
                { label: 'Some sections still need an instructor', color: 'var(--amber)' },
                { label: 'No instructors assigned yet', color: 'var(--red)' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 20, height: 3, borderRadius: 2, background: item.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--text-2)', fontFamily: 'Space Grotesk' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Day detail sheet */}
      <BottomSheet isOpen={!!selectedDay} onClose={() => setSelectedDay(null)} title={selectedDateLabel}>
        {selectedDay && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {selectedEvents.map(({ cohort, day, filled, total }) => {
              const course = COURSES[cohort.courseId]
              const pct = total > 0 ? (filled / total) * 100 : 0
              const barColor = pct === 100 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--red)'
              return (
                <button
                  key={cohort.id}
                  onClick={() => { setSelectedDay(null); navigate(`/admin/cohorts/${cohort.id}`) }}
                  className="card card-hover"
                  style={{ padding: 0, overflow: 'hidden', textAlign: 'left', width: '100%', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex' }}>
                    <div style={{ width: 4, background: course.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 14, color: 'var(--text-1)' }}>
                          {course.name}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'Space Grotesk', fontWeight: 600 }}>
                          Day {day} of 5
                        </div>
                      </div>

                      {/* Section dots */}
                      <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                        {Array.from({ length: total }, (_, si) => {
                          const secFilled = si < filled
                          return (
                            <div key={si} style={{
                              width: 10, height: 10, borderRadius: '50%',
                              background: secFilled ? course.color : 'var(--surface-lg)',
                              border: secFilled ? 'none' : '1px solid var(--border-md)',
                              opacity: secFilled ? 1 : 0.6,
                            }} />
                          )
                        })}
                      </div>

                      {/* Fill bar + label */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-track" style={{ flex: 1 }}>
                          <div className="progress-fill" style={{ width: `${pct}%`, background: barColor }} />
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'Space Grotesk', fontWeight: 600 }}>
                          {filled}/{total} sections
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}

            <p style={{ fontSize: 12, color: 'var(--text-4)', textAlign: 'center', marginTop: 4 }}>
              Tap a cohort to view slot details
            </p>
          </div>
        )}
      </BottomSheet>

      <BottomNav role="admin" />
    </div>
  )
}
