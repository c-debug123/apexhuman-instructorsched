import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { addDays, formatDate } from '../../data/courses'

function BackIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
}

export default function CreateCohort() {
  const navigate = useNavigate()
  const { courses, modules, addCohort } = useApp()
  const [courseId, setCourseId]   = useState('')
  const [startDate, setStartDate] = useState('')
  const [sections, setSections]   = useState(1)
  const [showMenu, setShowMenu]   = useState(false)

  const today = new Date().toISOString().slice(0, 10)
  const isWeekend = startDate ? ([0, 6].includes(new Date(startDate + 'T00:00:00').getDay())) : false
  const isPast    = startDate && startDate < today
  const canCreate = courseId && startDate && !isPast

  const selectedCourse = courses.find(c => c.id === courseId)
  const courseDays     = selectedCourse?.days || []
  const dayCount       = courseDays.length > 0 ? courseDays.length : 5

  function handleCreate() {
    addCohort({ id: crypto.randomUUID(), courseId, startDate, sections, createdAt: new Date().toISOString() })
    navigate('/admin')
  }

  return (
    <div className="admin-bg">
      <div className="z1" style={{ padding: '0 16px' }}>
        <div className="safe-top" style={{ paddingTop: 'max(16px, env(safe-area-inset-top))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 8, paddingBottom: 24 }}>
            <button className="btn btn-ghost" style={{ padding: '8px 4px', minHeight: 40 }} onClick={() => navigate('/admin')}>
              <BackIcon />
            </button>
            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18, color: 'var(--text-1)' }}>
              New Cohort
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Course select */}
          <div>
            <label style={labelStyle}>Course</label>
            <button
              onClick={() => setShowMenu(v => !v)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'var(--surface-sm)', border: '1px solid var(--border-md)',
                borderRadius: 'var(--radius-sm)', padding: '14px 16px', cursor: 'pointer',
                color: selectedCourse ? 'var(--text-1)' : 'var(--text-4)',
                fontFamily: 'Inter', fontSize: 16, minHeight: 44,
              }}
            >
              {selectedCourse ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: selectedCourse.color, flexShrink: 0 }} />
                  <span style={{ fontFamily: 'Space Grotesk', fontWeight: 600 }}>{selectedCourse.name}</span>
                </span>
              ) : 'Select a course'}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
            </button>

            {showMenu && (
              <div className="card anim-slide-up" style={{ marginTop: 4, overflow: 'hidden', zIndex: 10, position: 'relative' }}>
                {courses.length === 0 && (
                  <div style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-3)' }}>No courses yet — create one in the Course Builder.</div>
                )}
                {courses.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setCourseId(c.id); setShowMenu(false) }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '13px 16px', background: courseId === c.id ? 'var(--accent-dim)' : 'transparent',
                      border: 'none', cursor: 'pointer', textAlign: 'left',
                      borderBottom: '1px solid var(--border-dim)',
                    }}
                  >
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                    <span style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 14, color: 'var(--text-1)', flex: 1 }}>{c.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                      {(c.days?.length || 5)}d
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Start date */}
          <div>
            <label style={labelStyle}>Start Date (Day 1)</label>
            <input type="date" className="input" value={startDate} min={today} onChange={e => setStartDate(e.target.value)} />
            {isPast    && <div style={{ fontSize: 12, color: 'var(--red)',   marginTop: 6 }}>Start date cannot be in the past.</div>}
            {isWeekend && !isPast && <div style={{ fontSize: 12, color: 'var(--amber)', marginTop: 6 }}>This date falls on a weekend — confirm this is intentional.</div>}
          </div>

          {/* Sections */}
          <div>
            <label style={labelStyle}>Sections</label>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 10 }}>How many groups run simultaneously</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button className="btn btn-secondary" style={{ width: 44, padding: 0, fontSize: 20 }} onClick={() => setSections(s => Math.max(1, s - 1))}>−</button>
              <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 24, color: 'var(--text-1)', minWidth: 32, textAlign: 'center' }}>{sections}</span>
              <button className="btn btn-secondary" style={{ width: 44, padding: 0, fontSize: 20 }} onClick={() => setSections(s => Math.min(10, s + 1))}>+</button>
            </div>
          </div>

          {/* Preview */}
          {courseId && startDate && !isPast && (
            <div className="anim-slide-up">
              <div className="section-label" style={{ marginBottom: 12 }}>
                {dayCount}-Day Schedule Preview
                {selectedCourse?.days?.length === 0 && <span style={{ fontSize: 11, color: 'var(--amber)', marginLeft: 8 }}>— no days configured in Course Builder yet</span>}
              </div>
              <div className="card" style={{ overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 300 }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Section</th>
                      {Array.from({ length: dayCount }, (_, i) => (
                        <th key={i} style={thStyle}>D{i + 1}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: sections }, (_, si) => (
                      <tr key={si}>
                        <td style={{ padding: '8px 10px', fontSize: 12, color: 'var(--text-3)', borderBottom: si < sections - 1 ? '1px solid var(--border-dim)' : 'none' }}>
                          Sec {si + 1}
                        </td>
                        {Array.from({ length: dayCount }, (_, di) => {
                          const dayDef = courseDays[di]
                          const mod    = dayDef?.moduleId ? modules.find(m => m.id === dayDef.moduleId) : null
                          const label  = dayDef?.label || mod?.name || `Day ${di + 1}`
                          return (
                            <td key={di} style={{ padding: '8px 6px', textAlign: 'center', borderBottom: si < sections - 1 ? '1px solid var(--border-dim)' : 'none' }}>
                              <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 2 }}>{formatDate(addDays(startDate, di)).split(',')[0]}</div>
                              <div style={{ fontSize: 9, color: 'var(--text-4)', fontFamily: 'Space Grotesk', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                {label.split(' ')[0]}
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <button className="btn btn-primary" disabled={!canCreate} onClick={handleCreate} style={{ width: '100%', marginTop: 8, marginBottom: 32 }}>
            Create Cohort
          </button>
        </div>
      </div>
    </div>
  )
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 8, fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.08em' }
const thStyle    = { padding: '8px 10px', textAlign: 'center', fontSize: 10, fontFamily: 'Space Grotesk', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', borderBottom: '1px solid var(--border-dim)', whiteSpace: 'nowrap' }
