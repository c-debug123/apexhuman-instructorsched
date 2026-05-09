import { useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import CourseBadge from '../../components/CourseBadge'

function SectionLabel({ children }) {
  return (
    <div style={{
      fontFamily: 'Space Grotesk', fontSize: 10, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-4)',
      marginBottom: 10, marginTop: 4,
    }}>
      {children}
    </div>
  )
}

function EmptyCard({ text }) {
  return (
    <div className="card" style={{ padding: '20px 16px', textAlign: 'center', fontSize: 13, color: 'var(--text-4)' }}>
      {text}
    </div>
  )
}

export default function ReferencePage() {
  const { courses, modules, instructors, cohorts, claims } = useApp()

  // ── Analytics ─────────────────────────────────────────────────────────────────
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
    })).filter(i => i.count > 0).sort((a, b) => b.count - a.count).slice(0, 5)
  , [instructors, claims])

  const courseStats = useMemo(() =>
    builtCourses.map(course => {
      const cohortList = cohorts.filter(c => c.courseId === course.id)
      const slots  = cohortList.reduce((s, c) => s + (course.days?.length || 0) * c.sections, 0)
      const f      = claims.filter(cl => cohortList.some(c => c.id === cl.cohortId)).length
      return { course, slots, filled: f, pct: slots > 0 ? Math.round((f / slots) * 100) : 0 }
    }).filter(s => s.slots > 0).sort((a, b) => a.pct - b.pct)
  , [builtCourses, cohorts, claims])

  const fillColor = fillPct === 100 ? 'var(--green)' : fillPct >= 60 ? 'var(--teal)' : fillPct >= 30 ? 'var(--amber)' : 'var(--red)'
  const barGradient = fillPct === 100 ? 'var(--green)' : fillPct >= 60 ? 'linear-gradient(90deg, var(--teal), #22c55e)' : fillPct >= 30 ? 'linear-gradient(90deg, var(--amber), var(--teal))' : 'var(--amber)'

  // ── Reference ─────────────────────────────────────────────────────────────────
  const totalModules = modules.length
  const totalCourses = courses.length
  const totalHoursAll = modules.reduce((s, m) => s + (m.durationHours || 0), 0)

  const hasAnalyticsData = cohorts.length > 0

  return (
    <div className="admin-bg">
      <div className="z1 page">
        <div style={{ padding: '0 16px', paddingTop: 'max(20px, env(safe-area-inset-top))', paddingBottom: 100 }}>

          {/* Header */}
          <div style={{ paddingTop: 8, paddingBottom: 24 }}>
            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 20, color: 'var(--text-1)' }}>
              Reference
            </span>
          </div>

          {/* ══════════════════════════════════════════════════════════════════════
              ANALYTICS
          ══════════════════════════════════════════════════════════════════════ */}
          <SectionLabel>Analytics</SectionLabel>

          {!hasAnalyticsData ? (
            <div style={{ marginBottom: 32 }}>
              <EmptyCard text="Schedule a course run to see analytics." />
            </div>
          ) : (
            <div style={{ marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Capacity */}
              <div className="card" style={{ padding: '20px 18px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 48, lineHeight: 1, color: fillColor }}>
                      {fillPct}%
                    </div>
                    <div style={{ fontFamily: 'Space Grotesk', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-4)', marginTop: 6 }}>
                      Instructor slots filled
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 20, paddingTop: 4 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 22, color: 'var(--teal)', lineHeight: 1 }}>{filled}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-4)', fontFamily: 'Space Grotesk', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>Filled</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 22, color: urgentSlots > 0 ? 'var(--amber)' : 'var(--text-2)', lineHeight: 1 }}>{open}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-4)', fontFamily: 'Space Grotesk', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>Open</div>
                    </div>
                  </div>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: 'var(--surface-xs)', overflow: 'hidden', marginBottom: urgentSlots > 0 ? 12 : 0 }}>
                  {totalSlots > 0 && filled > 0 && (
                    <div style={{ width: `${(filled / totalSlots) * 100}%`, height: '100%', background: barGradient, borderRadius: 4 }} />
                  )}
                </div>
                {urgentSlots > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <span style={{ fontSize: 12, color: 'var(--amber)', fontFamily: 'Space Grotesk', fontWeight: 600 }}>
                      {urgentSlots} slot{urgentSlots !== 1 ? 's' : ''} need filling within 7 days
                    </span>
                  </div>
                )}
              </div>

              {/* Key metrics */}
              <div className="card" style={{ display: 'flex', padding: 0, overflow: 'hidden' }}>
                {[
                  { value: instructors.length,       label: 'Instructors', color: 'var(--text-1)' },
                  { value: activeInstructors.length, label: 'Active',      color: 'var(--teal)' },
                  { value: cohorts.length,           label: 'Schedules',   color: 'var(--accent)' },
                  { value: modules.length,           label: 'Modules',     color: 'var(--text-2)' },
                ].map((m, i, arr) => (
                  <div key={m.label} style={{
                    flex: 1, padding: '16px 8px', textAlign: 'center',
                    borderRight: i < arr.length - 1 ? '1px solid var(--border-dim)' : 'none',
                  }}>
                    <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 22, color: m.color, lineHeight: 1 }}>{m.value}</div>
                    <div style={{ fontFamily: 'Space Grotesk', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-4)', marginTop: 5 }}>{m.label}</div>
                  </div>
                ))}
              </div>

              {/* By course */}
              {courseStats.length > 0 && (
                <div className="card" style={{ overflow: 'hidden' }}>
                  {courseStats.map(({ course, slots, filled: f, pct }, i) => {
                    const color = pct === 100 ? 'var(--green)' : pct >= 60 ? 'var(--teal)' : pct >= 30 ? 'var(--amber)' : 'var(--red)'
                    return (
                      <div key={course.id} style={{ padding: '14px 18px', borderBottom: i < courseStats.length - 1 ? '1px solid var(--border-dim)' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <CourseBadge courseId={course.id} size="sm" />
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 15, color }}>{pct}%</span>
                            <span style={{ fontSize: 11, color: 'var(--text-4)' }}>{f}/{slots}</span>
                          </div>
                        </div>
                        <div style={{ height: 5, borderRadius: 3, background: 'var(--surface-xs)', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3 }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Instructor activity */}
              {instructors.length > 0 && (
                <div className="card" style={{ padding: '16px 18px' }}>
                  <div style={{ fontSize: 10, fontFamily: 'Space Grotesk', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-4)', marginBottom: 14 }}>
                    Instructor Activity
                  </div>
                  {leaderboard.length === 0 ? (
                    <div style={{ fontSize: 13, color: 'var(--text-4)' }}>No instructors have claimed slots yet.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: unassigned > 0 ? 16 : 0 }}>
                      {leaderboard.map((inst, i) => {
                        const maxCount = leaderboard[0].count
                        return (
                          <div key={inst.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 11, color: 'var(--text-4)', width: 16, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                            <span style={{ fontSize: 13, color: 'var(--text-1)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inst.name}</span>
                            <div style={{ width: 72, height: 5, borderRadius: 3, background: 'var(--surface-xs)', overflow: 'hidden', flexShrink: 0 }}>
                              <div style={{ width: `${(inst.count / maxCount) * 100}%`, height: '100%', background: 'var(--teal)', borderRadius: 3 }} />
                            </div>
                            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, color: 'var(--teal)', width: 24, textAlign: 'right', flexShrink: 0 }}>{inst.count}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  {unassigned > 0 && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 'var(--radius-full)', padding: '4px 12px', fontSize: 11, fontFamily: 'Space Grotesk', fontWeight: 600, color: 'var(--amber)' }}>
                      {unassigned} instructor{unassigned !== 1 ? 's' : ''} not yet assigned
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              CURRICULUM REFERENCE
          ══════════════════════════════════════════════════════════════════════ */}
          <SectionLabel>Curriculum Reference</SectionLabel>

          {(totalCourses > 0 || totalModules > 0) && (
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20, lineHeight: 1.5 }}>
              {totalCourses} course{totalCourses !== 1 ? 's' : ''} · {totalModules} module{totalModules !== 1 ? 's' : ''} · {totalHoursAll}h total
            </p>
          )}
          {totalCourses === 0 && totalModules === 0 && (
            <p style={{ fontSize: 13, color: 'var(--text-4)', marginBottom: 20, lineHeight: 1.5 }}>
              Build modules and courses to populate this reference.
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* === COURSES === */}
            <div>
              <SectionLabel>Courses ({totalCourses})</SectionLabel>
              {totalCourses === 0 ? (
                <EmptyCard text="No courses built yet." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {courses.map(course => {
                    const courseModules = (course.days || []).map(slot =>
                      modules.find(m => m.id === slot.moduleId)
                    ).filter(Boolean)
                    const courseHours = courseModules.reduce((s, m) => s + (m.durationHours || 0), 0)
                    return (
                      <div key={course.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ display: 'flex' }}>
                          <div style={{ width: 4, background: course.color, flexShrink: 0 }} />
                          <div style={{ flex: 1, padding: '13px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                  <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 11, color: course.color, background: `${course.color}1a`, border: `1px solid ${course.color}33`, borderRadius: 'var(--radius-full)', padding: '1px 7px', flexShrink: 0 }}>
                                    {course.code}
                                  </span>
                                  <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 14, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {course.name}
                                  </span>
                                </div>
                                {course.fullTitle && (
                                  <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.4 }}>{course.fullTitle}</div>
                                )}
                              </div>
                              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                                <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, color: 'var(--text-2)' }}>{courseHours > 0 ? `${courseHours}h` : '—'}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-4)' }}>{courseModules.length} mod{courseModules.length !== 1 ? 's' : ''}</div>
                              </div>
                            </div>
                            {courseModules.length > 0 && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {courseModules.map((mod, i) => (
                                  <div key={mod.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'var(--surface-xs)', borderRadius: 'var(--radius-sm)' }}>
                                    <div style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0, background: `${course.color}20`, border: `1px solid ${course.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 8, color: course.color }}>
                                      {i + 1}
                                    </div>
                                    <span style={{ fontSize: 12, color: 'var(--text-2)', fontFamily: 'Space Grotesk', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mod.name}</span>
                                    <span style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'Space Grotesk', flexShrink: 0 }}>{mod.durationHours}h</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {courseModules.length === 0 && (
                              <div style={{ fontSize: 12, color: 'var(--text-4)', fontStyle: 'italic' }}>No modules assigned yet.</div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* === MODULE LIBRARY === */}
            <div>
              <SectionLabel>Module Library ({totalModules})</SectionLabel>
              {totalModules === 0 ? (
                <EmptyCard text="No modules created yet." />
              ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  {modules.map((mod, i) => {
                    const usedIn = courses.filter(c => (c.days || []).some(d => d.moduleId === mod.id))
                    return (
                      <div key={mod.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '11px 14px', borderBottom: i < modules.length - 1 ? '1px solid var(--border-dim)' : 'none' }}>
                        <div style={{ flexShrink: 0, minWidth: 36, textAlign: 'center', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12, color: 'var(--text-2)', background: 'var(--surface-xs)', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius-sm)', padding: '4px 6px' }}>
                          {mod.durationHours}h
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 13, color: 'var(--text-1)', marginBottom: 4 }}>{mod.name}</div>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                            {(mod.tags || []).map(tag => (
                              <span key={tag} style={{ fontSize: 10, fontFamily: 'Space Grotesk', fontWeight: 600, padding: '1px 6px', borderRadius: 'var(--radius-full)', background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>{tag}</span>
                            ))}
                            {usedIn.map(c => (
                              <span key={c.id} style={{ fontSize: 10, fontFamily: 'Space Grotesk', fontWeight: 600, padding: '1px 6px', borderRadius: 'var(--radius-full)', background: `${c.color}15`, color: c.color, border: `1px solid ${c.color}30` }}>{c.code}</span>
                            ))}
                            {usedIn.length === 0 && (
                              <span style={{ fontSize: 10, color: 'var(--text-4)', fontStyle: 'italic' }}>not used in any course</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* === MODULE GROUPS === */}
            {(() => {
              const allGroups = [...new Set(modules.flatMap(m => m.tags || []))].sort()
              if (allGroups.length === 0) return null
              return (
                <div>
                  <SectionLabel>Module Groups ({allGroups.length})</SectionLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {allGroups.map(group => {
                      const groupModules  = modules.filter(m => (m.tags || []).includes(group))
                      const groupHours    = groupModules.reduce((s, m) => s + (m.durationHours || 0), 0)
                      const eligibleInst  = instructors.filter(i => (i.eligibleGroups || []).includes(group))
                      return (
                        <div key={group} className="card" style={{ padding: '13px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, color: 'var(--accent)', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 'var(--radius-full)', padding: '2px 10px' }}>
                              {group}
                            </span>
                            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12, color: 'var(--text-2)' }}>
                              {groupModules.length} mod{groupModules.length !== 1 ? 's' : ''} · {groupHours}h
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
                            {groupModules.map(m => (
                              <span key={m.id} style={{ fontSize: 11, fontFamily: 'Space Grotesk', fontWeight: 500, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--surface-xs)', color: 'var(--text-2)', border: '1px solid var(--border-dim)' }}>
                                {m.name}
                              </span>
                            ))}
                          </div>
                          <div style={{ borderTop: '1px solid var(--border-dim)', paddingTop: 10 }}>
                            <div style={{ fontSize: 10, fontFamily: 'Space Grotesk', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-4)', marginBottom: 6 }}>Eligible instructors</div>
                            {eligibleInst.length === 0 ? (
                              <span style={{ fontSize: 12, color: 'var(--text-4)', fontStyle: 'italic' }}>None assigned yet</span>
                            ) : (
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {eligibleInst.map(i => (
                                  <span key={i.id} style={{ fontSize: 11, fontFamily: 'Space Grotesk', fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'rgba(45,212,191,0.1)', color: 'var(--teal)', border: '1px solid rgba(45,212,191,0.25)' }}>
                                    {i.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}

          </div>
        </div>
      </div>
    </div>
  )
}
