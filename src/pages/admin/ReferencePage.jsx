import { useApp } from '../../context/AppContext'
import BottomNav from '../../components/BottomNav'

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
  const { courses, modules, instructors } = useApp()

  const totalModules = modules.length
  const totalCourses = courses.length
  const totalHoursAll = modules.reduce((s, m) => s + (m.durationHours || 0), 0)

  return (
    <div className="admin-bg">
      <div className="z1 page">
        {/* Header */}
        <div className="safe-top" style={{ padding: '0 16px', paddingTop: 'max(16px, env(safe-area-inset-top))' }}>
          <div style={{ paddingTop: 8, paddingBottom: 4 }}>
            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 20, color: 'var(--text-1)' }}>
              Curriculum Reference
            </span>
          </div>
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
        </div>

        <div style={{ padding: '0 16px', paddingBottom: 100, display: 'flex', flexDirection: 'column', gap: 24 }}>

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

                          {/* Course header */}
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                <span style={{
                                  fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 11,
                                  color: course.color, background: `${course.color}1a`,
                                  border: `1px solid ${course.color}33`,
                                  borderRadius: 'var(--radius-full)', padding: '1px 7px',
                                  flexShrink: 0,
                                }}>
                                  {course.code}
                                </span>
                                <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 14, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {course.name}
                                </span>
                              </div>
                              {course.fullTitle && (
                                <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.4 }}>
                                  {course.fullTitle}
                                </div>
                              )}
                            </div>
                            <div style={{ flexShrink: 0, textAlign: 'right' }}>
                              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, color: 'var(--text-2)' }}>
                                {courseHours > 0 ? `${courseHours}h` : '—'}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-4)' }}>
                                {courseModules.length} mod{courseModules.length !== 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>

                          {/* Module sequence */}
                          {courseModules.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {courseModules.map((mod, i) => (
                                <div key={mod.id} style={{
                                  display: 'flex', alignItems: 'center', gap: 8,
                                  padding: '6px 10px',
                                  background: 'var(--surface-xs)', borderRadius: 'var(--radius-sm)',
                                }}>
                                  <div style={{
                                    width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                                    background: `${course.color}20`, border: `1px solid ${course.color}40`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 8, color: course.color,
                                  }}>
                                    {i + 1}
                                  </div>
                                  <span style={{ fontSize: 12, color: 'var(--text-2)', fontFamily: 'Space Grotesk', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {mod.name}
                                  </span>
                                  <span style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'Space Grotesk', flexShrink: 0 }}>
                                    {mod.durationHours}h
                                  </span>
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
                    <div
                      key={mod.id}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 12,
                        padding: '11px 14px',
                        borderBottom: i < modules.length - 1 ? '1px solid var(--border-dim)' : 'none',
                      }}
                    >
                      {/* Duration badge */}
                      <div style={{
                        flexShrink: 0, minWidth: 36, textAlign: 'center',
                        fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12, color: 'var(--text-2)',
                        background: 'var(--surface-xs)', border: '1px solid var(--border-dim)',
                        borderRadius: 'var(--radius-sm)', padding: '4px 6px',
                      }}>
                        {mod.durationHours}h
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 13, color: 'var(--text-1)', marginBottom: 4 }}>
                          {mod.name}
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                          {/* Tags */}
                          {(mod.tags || []).map(tag => (
                            <span key={tag} style={{
                              fontSize: 10, fontFamily: 'Space Grotesk', fontWeight: 600,
                              padding: '1px 6px', borderRadius: 'var(--radius-full)',
                              background: 'var(--accent-dim)', color: 'var(--accent)',
                              border: '1px solid var(--accent-border)',
                            }}>
                              {tag}
                            </span>
                          ))}
                          {/* Used-in course badges */}
                          {usedIn.map(c => (
                            <span key={c.id} style={{
                              fontSize: 10, fontFamily: 'Space Grotesk', fontWeight: 600,
                              padding: '1px 6px', borderRadius: 'var(--radius-full)',
                              background: `${c.color}15`, color: c.color,
                              border: `1px solid ${c.color}30`,
                            }}>
                              {c.code}
                            </span>
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
                    const groupModules = modules.filter(m => (m.tags || []).includes(group))
                    const groupHours   = groupModules.reduce((s, m) => s + (m.durationHours || 0), 0)
                    const eligibleInst = instructors.filter(i => (i.eligibleGroups || []).includes(group))
                    return (
                      <div key={group} className="card" style={{ padding: '13px 14px' }}>
                        {/* Group header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                              fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13,
                              color: 'var(--accent)', background: 'var(--accent-dim)',
                              border: '1px solid var(--accent-border)',
                              borderRadius: 'var(--radius-full)', padding: '2px 10px',
                            }}>
                              {group}
                            </span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12, color: 'var(--text-2)' }}>
                              {groupModules.length} mod{groupModules.length !== 1 ? 's' : ''} · {groupHours}h
                            </div>
                          </div>
                        </div>

                        {/* Modules in group */}
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
                          {groupModules.map(m => (
                            <span key={m.id} style={{
                              fontSize: 11, fontFamily: 'Space Grotesk', fontWeight: 500,
                              padding: '2px 8px', borderRadius: 'var(--radius-full)',
                              background: 'var(--surface-xs)', color: 'var(--text-2)',
                              border: '1px solid var(--border-dim)',
                            }}>
                              {m.name}
                            </span>
                          ))}
                        </div>

                        {/* Eligible instructors */}
                        <div style={{ borderTop: '1px solid var(--border-dim)', paddingTop: 10 }}>
                          <div style={{ fontSize: 10, fontFamily: 'Space Grotesk', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-4)', marginBottom: 6 }}>
                            Eligible instructors
                          </div>
                          {eligibleInst.length === 0 ? (
                            <span style={{ fontSize: 12, color: 'var(--text-4)', fontStyle: 'italic' }}>None assigned yet</span>
                          ) : (
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {eligibleInst.map(i => (
                                <span key={i.id} style={{
                                  fontSize: 11, fontFamily: 'Space Grotesk', fontWeight: 600,
                                  padding: '2px 8px', borderRadius: 'var(--radius-full)',
                                  background: 'rgba(45,212,191,0.1)', color: 'var(--teal)',
                                  border: '1px solid rgba(45,212,191,0.25)',
                                }}>
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
      <BottomNav role="admin" />
    </div>
  )
}
