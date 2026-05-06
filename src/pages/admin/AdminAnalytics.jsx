import { useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { addDays } from '../../data/courses'
import BottomNav from '../../components/BottomNav'
import CourseBadge from '../../components/CourseBadge'

export default function AdminAnalytics() {
  const { cohorts, courses, modules, claims, instructors } = useApp()

  const now = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d }, [])

  const builtCourses = courses.filter(c => c.days?.length > 0)

  const totalSlots = cohorts.reduce(
    (s, c) => s + (courses.find(x => x.id === c.courseId)?.days?.length || 0) * c.sections, 0
  )
  const filled  = claims.length
  const open    = Math.max(0, totalSlots - filled)
  const fillPct = totalSlots > 0 ? Math.round((filled / totalSlots) * 100) : 0

  const urgentSlots = useMemo(() => {
    let count = 0
    for (const c of cohorts) {
      const course   = courses.find(x => x.id === c.courseId)
      const dayCount = course?.days?.length || 0
      const d1       = new Date(c.startDate + 'T00:00:00')
      const diff     = Math.ceil((d1 - now) / 86400000)
      if (diff < 0 || diff > 7) continue
      for (let day = 1; day <= dayCount; day++)
        for (let sec = 1; sec <= c.sections; sec++)
          if (!claims.some(cl => cl.cohortId === c.id && cl.day === day && cl.section === sec)) count++
    }
    return count
  }, [cohorts, courses, claims, now])

  const activeInstructors = useMemo(() =>
    instructors.filter(inst =>
      claims.some(cl => cl.instructorId === inst.id || cl.instructorName === inst.name)
    ), [instructors, claims])

  const unassigned = instructors.length - activeInstructors.length

  const leaderboard = useMemo(() =>
    instructors.map(inst => ({
      ...inst,
      count: claims.filter(cl => cl.instructorId === inst.id || cl.instructorName === inst.name).length,
    })).filter(i => i.count > 0).sort((a, b) => b.count - a.count).slice(0, 6)
  , [instructors, claims])

  const courseStats = useMemo(() =>
    builtCourses.map(course => {
      const cohortList = cohorts.filter(c => c.courseId === course.id)
      const slots  = cohortList.reduce((s, c) => s + (course.days?.length || 0) * c.sections, 0)
      const f      = claims.filter(cl => cohortList.some(c => c.id === cl.cohortId)).length
      return {
        course,
        slots,
        filled: f,
        pct: slots > 0 ? Math.round((f / slots) * 100) : 0,
        cohortCount: cohortList.length,
        moduleCount: course.days?.length || 0,
      }
    }).filter(s => s.slots > 0).sort((a, b) => a.pct - b.pct)
  , [builtCourses, cohorts, claims])

  const totalModuleSlots = cohorts.reduce(
    (s, c) => s + (courses.find(x => x.id === c.courseId)?.days?.length || 0), 0
  )

  const fillColor = fillPct === 100
    ? 'var(--green)'
    : fillPct >= 60
    ? 'var(--teal)'
    : fillPct >= 30
    ? 'var(--amber)'
    : 'var(--red)'

  const barGradient = fillPct === 100
    ? 'var(--green)'
    : fillPct >= 60
    ? 'linear-gradient(90deg, var(--teal), #22c55e)'
    : fillPct >= 30
    ? 'linear-gradient(90deg, var(--amber), var(--teal))'
    : 'var(--amber)'

  const isEmpty = cohorts.length === 0

  return (
    <div className="admin-bg">
      <div className="z1 page">
        <div style={{ padding: '0 16px', paddingTop: 'max(20px, env(safe-area-inset-top))', paddingBottom: 100 }}>

          {/* Header */}
          <div style={{ paddingTop: 8, paddingBottom: 24 }}>
            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 20, color: 'var(--text-1)' }}>
              Analytics
            </span>
          </div>

          {isEmpty ? (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="1.5" strokeLinecap="round" style={{ margin: '0 auto 16px', display: 'block' }}>
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 15, color: 'var(--text-2)', marginBottom: 6 }}>No data yet</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Schedule a course run to see analytics.</div>
            </div>
          ) : (
            <>
              {/* ── Capacity utilization ── */}
              <div className="section-label" style={{ marginBottom: 10 }}>Capacity</div>
              <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 48, lineHeight: 1, color: fillColor }}>
                      {fillPct}%
                    </div>
                    <div style={{ fontFamily: 'Space Grotesk', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-4)', marginTop: 4 }}>
                      Instructor slots filled
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18, color: 'var(--teal)', lineHeight: 1 }}>{filled}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-4)', fontFamily: 'Space Grotesk', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Filled</div>
                    <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18, color: urgentSlots > 0 ? 'var(--amber)' : 'var(--text-2)', lineHeight: 1 }}>{open}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-4)', fontFamily: 'Space Grotesk', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Open</div>
                  </div>
                </div>

                {/* Fill bar */}
                <div style={{ height: 10, borderRadius: 5, background: 'var(--surface-xs)', overflow: 'hidden', marginBottom: 8 }}>
                  {totalSlots > 0 && filled > 0 && (
                    <div style={{ width: `${(filled / totalSlots) * 100}%`, height: '100%', background: barGradient, borderRadius: 5, transition: 'width 0.4s ease' }} />
                  )}
                </div>

                {urgentSlots > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <span style={{ fontSize: 12, color: 'var(--amber)', fontFamily: 'Space Grotesk', fontWeight: 600 }}>
                      {urgentSlots} slot{urgentSlots !== 1 ? 's' : ''} need filling within 7 days
                    </span>
                  </div>
                )}
              </div>

              {/* ── Key metrics ── */}
              <div className="section-label" style={{ marginBottom: 10 }}>Overview</div>
              <div className="card" style={{ display: 'flex', marginBottom: 20, overflow: 'hidden', padding: 0 }}>
                {[
                  { value: instructors.length,        label: 'Instructors', color: 'var(--text-1)' },
                  { value: activeInstructors.length,  label: 'Active',       color: 'var(--teal)' },
                  { value: cohorts.length,            label: 'Schedules',   color: 'var(--accent)' },
                  { value: modules.length,            label: 'Modules',     color: 'var(--text-2)' },
                ].map((m, i, arr) => (
                  <div key={m.label} style={{
                    flex: 1, padding: '14px 6px', textAlign: 'center',
                    borderRight: i < arr.length - 1 ? '1px solid var(--border-dim)' : 'none',
                  }}>
                    <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 24, color: m.color, lineHeight: 1 }}>
                      {m.value}
                    </div>
                    <div style={{ fontFamily: 'Space Grotesk', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-4)', marginTop: 4 }}>
                      {m.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Per-course breakdown ── */}
              {courseStats.length > 0 && (
                <>
                  <div className="section-label" style={{ marginBottom: 10 }}>By Course</div>
                  <div className="card" style={{ marginBottom: 20, padding: '4px 0' }}>
                    {courseStats.map(({ course, slots, filled: f, pct, cohortCount, moduleCount }, i) => {
                      const color = pct === 100 ? 'var(--green)' : pct >= 60 ? 'var(--teal)' : pct >= 30 ? 'var(--amber)' : 'var(--red)'
                      return (
                        <div key={course.id} style={{
                          padding: '12px 14px',
                          borderBottom: i < courseStats.length - 1 ? '1px solid var(--border-dim)' : 'none',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <CourseBadge courseId={course.id} size="sm" />
                              <span style={{ fontSize: 11, color: 'var(--text-4)' }}>
                                {cohortCount} run{cohortCount !== 1 ? 's' : ''} · {moduleCount} module{moduleCount !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                              <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 16, color }}>{pct}%</span>
                              <span style={{ fontSize: 11, color: 'var(--text-4)' }}>{f}/{slots}</span>
                            </div>
                          </div>
                          <div style={{ height: 5, borderRadius: 3, background: 'var(--surface-xs)', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.4s ease' }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              {/* ── Instructor activity ── */}
              {instructors.length > 0 && (
                <>
                  <div className="section-label" style={{ marginBottom: 10 }}>Instructor Activity</div>
                  <div className="card" style={{ marginBottom: 20 }}>
                    {leaderboard.length === 0 ? (
                      <div style={{ fontSize: 13, color: 'var(--text-4)', padding: '4px 0' }}>
                        No instructors have claimed slots yet.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: unassigned > 0 ? 14 : 0 }}>
                        {leaderboard.map((inst, i) => {
                          const maxCount = leaderboard[0].count
                          return (
                            <div key={inst.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 11, color: 'var(--text-4)', width: 14, textAlign: 'right', flexShrink: 0 }}>
                                {i + 1}
                              </span>
                              <span style={{ fontSize: 13, color: 'var(--text-1)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {inst.name}
                              </span>
                              <div style={{ width: 72, height: 5, borderRadius: 3, background: 'var(--surface-xs)', overflow: 'hidden', flexShrink: 0 }}>
                                <div style={{ width: `${(inst.count / maxCount) * 100}%`, height: '100%', background: 'var(--teal)', borderRadius: 3 }} />
                              </div>
                              <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12, color: 'var(--teal)', width: 24, textAlign: 'right', flexShrink: 0 }}>
                                {inst.count}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    {unassigned > 0 && (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.25)',
                        borderRadius: 'var(--radius-full)', padding: '4px 10px',
                        fontSize: 11, fontFamily: 'Space Grotesk', fontWeight: 600, color: 'var(--amber)',
                      }}>
                        {unassigned} instructor{unassigned !== 1 ? 's' : ''} not yet assigned
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ── Modules summary ── */}
              <div className="section-label" style={{ marginBottom: 10 }}>Library</div>
              <div className="card" style={{ display: 'flex', marginBottom: 20, overflow: 'hidden', padding: 0 }}>
                {[
                  { value: modules.length,       label: 'Modules',       color: 'var(--text-1)' },
                  { value: builtCourses.length,  label: 'Courses',       color: 'var(--accent)' },
                  { value: totalModuleSlots,     label: 'Module Slots',  color: 'var(--text-2)' },
                ].map((m, i, arr) => (
                  <div key={m.label} style={{
                    flex: 1, padding: '14px 6px', textAlign: 'center',
                    borderRight: i < arr.length - 1 ? '1px solid var(--border-dim)' : 'none',
                  }}>
                    <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 24, color: m.color, lineHeight: 1 }}>
                      {m.value}
                    </div>
                    <div style={{ fontFamily: 'Space Grotesk', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-4)', marginTop: 4 }}>
                      {m.label}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <BottomNav role="admin" />
    </div>
  )
}
