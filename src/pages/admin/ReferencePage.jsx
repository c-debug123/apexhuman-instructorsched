import { COURSES, COURSE_LIST, DAY_FRAMEWORK, getInstructorType } from '../../data/courses'
import BottomNav from '../../components/BottomNav'
import RoleSwitcher from '../../components/RoleSwitcher'

const INSTRUCTOR_TYPES = [
  {
    name: 'AI Educator',
    color: 'var(--accent)',
    colorDim: 'var(--accent-dim)',
    colorBorder: 'var(--accent-border)',
    days: 'Day 1 (all courses) · Day 3 & 4 (most courses)',
    desc: 'Covers AI fundamentals, prompt engineering, and course-specific AI tooling. Runs the bulk of teaching days across the curriculum.',
  },
  {
    name: 'Business Strategist',
    color: 'var(--green)',
    colorDim: 'var(--green-dim)',
    colorBorder: 'rgba(34,197,94,0.25)',
    days: 'Day 2 (all courses)',
    desc: 'Covers market validation, ICP definition, business models, and idea canvasses. Same Day 2 across all 6 courses.',
  },
  {
    name: 'Growth Marketer',
    color: 'var(--amber)',
    colorDim: 'var(--amber-dim)',
    colorBorder: 'rgba(245,158,11,0.25)',
    days: 'Day 5 (all courses)',
    desc: 'Covers launch strategy, distribution, content marketing, and student showcase facilitation. Same Day 5 across all 6 courses.',
  },
  {
    name: 'Roblox Expert',
    color: '#a78bfa',
    colorDim: 'rgba(167,139,250,0.12)',
    colorBorder: 'rgba(167,139,250,0.25)',
    days: 'Day 3 & 4 (C1: Roblox only)',
    desc: 'Specialised in Roblox Studio, Lua scripting, game mechanics, and monetisation. Only required for C1: Roblox Game Dev.',
  },
]

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

export default function ReferencePage() {
  return (
    <div className="admin-bg">
      <div className="z1 page">
        {/* Header */}
        <div className="safe-top" style={{ padding: '0 16px', paddingTop: 'max(16px, env(safe-area-inset-top))' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 4 }}>
            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 20, color: 'var(--text-1)' }}>
              Curriculum Reference
            </span>
            <RoleSwitcher role="admin" />
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20, lineHeight: 1.5 }}>
            Quick reference for the Apex Humans curriculum — 6 courses, 4 instructor types, 5-day structure.
          </p>
        </div>

        <div style={{ padding: '0 16px', paddingBottom: 100, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* === COURSES === */}
          <div>
            <SectionLabel>Courses</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {COURSE_LIST.map(course => (
                <div key={course.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ display: 'flex' }}>
                    <div style={{ width: 4, background: course.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, padding: '13px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                            <span style={{
                              fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 11,
                              color: course.color, background: `${course.color}1a`,
                              border: `1px solid ${course.color}33`,
                              borderRadius: 'var(--radius-full)', padding: '1px 7px',
                            }}>
                              {course.code}
                            </span>
                            <span style={{
                              fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 11,
                              color: course.track === 1 ? 'var(--accent)' : 'var(--teal)',
                              background: course.track === 1 ? 'var(--accent-dim)' : 'var(--teal-dim)',
                              border: `1px solid ${course.track === 1 ? 'var(--accent-border)' : 'var(--teal-border)'}`,
                              borderRadius: 'var(--radius-full)', padding: '1px 7px',
                            }}>
                              Track {course.track}
                            </span>
                          </div>
                          <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 14, color: 'var(--text-1)' }}>
                            {course.name}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>
                            {course.fullTitle}
                          </div>
                        </div>
                      </div>

                      {/* Day-by-day instructor breakdown */}
                      <div style={{ display: 'flex', gap: 3, marginTop: 10, flexWrap: 'wrap' }}>
                        {[1, 2, 3, 4, 5].map(day => {
                          const itype = getInstructorType(course.id, day)
                          const typeColor = {
                            'AI Educator': 'var(--accent)',
                            'Business Strategist': 'var(--green)',
                            'Growth Marketer': 'var(--amber)',
                            'Roblox Expert': '#a78bfa',
                          }[itype] || 'var(--text-3)'
                          return (
                            <div key={day} style={{
                              fontSize: 10, fontFamily: 'Space Grotesk', fontWeight: 600,
                              padding: '2px 7px', borderRadius: 'var(--radius-full)',
                              background: `${typeColor}12`,
                              border: `1px solid ${typeColor}28`,
                              color: typeColor,
                            }}>
                              D{day}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* === 5-DAY STRUCTURE === */}
          <div>
            <SectionLabel>5-Day Framework (all courses)</SectionLabel>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {DAY_FRAMEWORK.map((d, i, arr) => {
                const typeColor = {
                  'AI Educator': 'var(--accent)',
                  'Business Strategist': 'var(--green)',
                  'Growth Marketer': 'var(--amber)',
                  'Course Specialist': 'var(--text-3)',
                }[d.instructor] || 'var(--text-3)'
                return (
                  <div key={d.day} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '12px 14px',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--border-dim)' : 'none',
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      background: 'var(--surface-md)', border: '1px solid var(--border-md)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12, color: 'var(--text-2)',
                    }}>
                      {d.day}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, color: 'var(--text-1)' }}>
                          {d.label}
                        </span>
                        <span style={{
                          fontSize: 10, fontFamily: 'Space Grotesk', fontWeight: 600,
                          color: typeColor, background: `${typeColor}12`, border: `1px solid ${typeColor}28`,
                          borderRadius: 'var(--radius-full)', padding: '1px 6px',
                        }}>
                          {d.instructor}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.4 }}>
                        {d.desc}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 8, lineHeight: 1.4 }}>
              * Days 3 & 4 use a course-specific specialist — Roblox Expert for C1, AI Educator for all others.
            </p>
          </div>

          {/* === INSTRUCTOR TYPES === */}
          <div>
            <SectionLabel>Instructor Types</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {INSTRUCTOR_TYPES.map(t => (
                <div key={t.name} className="card" style={{ padding: '13px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                    <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 14, color: 'var(--text-1)' }}>
                      {t.name}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8, lineHeight: 1.5 }}>
                    {t.desc}
                  </div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    fontSize: 11, fontFamily: 'Space Grotesk', fontWeight: 600,
                    color: t.color, background: t.colorDim, border: `1px solid ${t.colorBorder}`,
                    borderRadius: 'var(--radius-full)', padding: '3px 10px',
                  }}>
                    {t.days}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* === TRACKS === */}
          <div>
            <SectionLabel>Tracks</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="card" style={{ padding: '13px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{
                    fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 11,
                    color: 'var(--accent)', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
                    borderRadius: 'var(--radius-full)', padding: '1px 8px',
                  }}>Track 1</span>
                  <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 14, color: 'var(--text-1)' }}>
                    Entrepreneurship
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>
                  Teaches students to build and launch an AI-powered product or business.
                </div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {COURSE_LIST.filter(c => c.track === 1).map(c => (
                    <span key={c.id} style={{
                      fontSize: 11, fontFamily: 'Space Grotesk', fontWeight: 600,
                      color: c.color, background: `${c.color}1a`, border: `1px solid ${c.color}33`,
                      borderRadius: 'var(--radius-full)', padding: '2px 8px',
                    }}>
                      {c.code}: {c.shortName}
                    </span>
                  ))}
                </div>
              </div>
              <div className="card" style={{ padding: '13px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{
                    fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 11,
                    color: 'var(--teal)', background: 'var(--teal-dim)', border: '1px solid var(--teal-border)',
                    borderRadius: 'var(--radius-full)', padding: '1px 8px',
                  }}>Track 2</span>
                  <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 14, color: 'var(--text-1)' }}>
                    Enterprise
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>
                  Teaches employees to automate workflows and scale operations with AI inside an organisation.
                </div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {COURSE_LIST.filter(c => c.track === 2).map(c => (
                    <span key={c.id} style={{
                      fontSize: 11, fontFamily: 'Space Grotesk', fontWeight: 600,
                      color: c.color, background: `${c.color}1a`, border: `1px solid ${c.color}33`,
                      borderRadius: 'var(--radius-full)', padding: '2px 8px',
                    }}>
                      {c.code}: {c.shortName}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* === FULL MATRIX LINK === */}
          <a
            href="https://apexhuman-matrix.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="card"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', textDecoration: 'none',
              background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
            }}
          >
            <div>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 14, color: 'var(--text-1)', marginBottom: 2 }}>
                Full Curriculum Matrix
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                Day-by-day content breakdown for all 6 courses
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>

        </div>
      </div>
      <BottomNav role="admin" />
    </div>
  )
}
