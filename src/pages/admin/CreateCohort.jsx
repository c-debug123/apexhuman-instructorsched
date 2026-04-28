import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { COURSE_LIST, getInstructorType, addDays, formatDate } from '../../data/courses'

function BackIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
}

export default function CreateCohort() {
  const navigate = useNavigate()
  const { addCohort } = useApp()
  const [courseId, setCourseId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [sections, setSections] = useState(1)
  const [showCourseMenu, setShowCourseMenu] = useState(false)

  const today = new Date().toISOString().slice(0, 10)
  const isWeekend = startDate ? ([0, 6].includes(new Date(startDate + 'T00:00:00').getDay())) : false
  const isPast = startDate && startDate < today
  const canCreate = courseId && startDate && !isPast

  const selectedCourse = COURSE_LIST.find(c => c.id === courseId)

  function handleCreate() {
    const cohort = {
      id: crypto.randomUUID(),
      courseId,
      startDate,
      sections,
      createdAt: new Date().toISOString(),
    }
    addCohort(cohort)
    navigate('/admin')
  }

  return (
    <div className="admin-bg">
      <div className="z1" style={{ padding: '0 16px' }}>
        {/* Header */}
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
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 8, fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Course
            </label>
            <button
              onClick={() => setShowCourseMenu(v => !v)}
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

            {showCourseMenu && (
              <div className="card anim-slide-up" style={{ marginTop: 4, overflow: 'hidden', zIndex: 10, position: 'relative' }}>
                {COURSE_LIST.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setCourseId(c.id); setShowCourseMenu(false) }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '13px 16px', background: courseId === c.id ? 'var(--accent-dim)' : 'transparent',
                      border: 'none', cursor: 'pointer', textAlign: 'left',
                      borderBottom: '1px solid var(--border-dim)',
                    }}
                  >
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                    <span style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 14, color: 'var(--text-1)' }}>{c.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 'auto' }}>C{c.num}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Start date */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 8, fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Start Date (Day 1)
            </label>
            <input
              type="date"
              className="input"
              value={startDate}
              min={today}
              onChange={e => setStartDate(e.target.value)}
            />
            {isPast && <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 6 }}>Start date cannot be in the past.</div>}
            {isWeekend && !isPast && <div style={{ fontSize: 12, color: 'var(--amber)', marginTop: 6 }}>⚠ This date falls on a weekend — confirm this is intentional.</div>}
          </div>

          {/* Sections */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 8, fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Sections
            </label>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 10 }}>How many groups run simultaneously</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button
                className="btn btn-secondary"
                style={{ width: 44, padding: 0, fontSize: 20 }}
                onClick={() => setSections(s => Math.max(1, s - 1))}
              >−</button>
              <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 24, color: 'var(--text-1)', minWidth: 32, textAlign: 'center' }}>
                {sections}
              </span>
              <button
                className="btn btn-secondary"
                style={{ width: 44, padding: 0, fontSize: 20 }}
                onClick={() => setSections(s => Math.min(10, s + 1))}
              >+</button>
            </div>
          </div>

          {/* Preview */}
          {courseId && startDate && !isPast && (
            <div className="anim-slide-up">
              <div className="section-label" style={{ marginBottom: 12 }}>5-Day Schedule Preview</div>
              <div className="card" style={{ overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 300 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, fontFamily: 'Space Grotesk', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', borderBottom: '1px solid var(--border-dim)' }}>Section</th>
                      {[1,2,3,4,5].map(d => (
                        <th key={d} style={{ padding: '8px 10px', textAlign: 'center', fontSize: 10, fontFamily: 'Space Grotesk', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', borderBottom: '1px solid var(--border-dim)', whiteSpace: 'nowrap' }}>
                          D{d}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: sections }, (_, si) => (
                      <tr key={si}>
                        <td style={{ padding: '8px 10px', fontSize: 12, color: 'var(--text-3)', borderBottom: si < sections - 1 ? '1px solid var(--border-dim)' : 'none' }}>
                          Sec {si + 1}
                        </td>
                        {[1,2,3,4,5].map(d => (
                          <td key={d} style={{ padding: '8px 6px', textAlign: 'center', borderBottom: si < sections - 1 ? '1px solid var(--border-dim)' : 'none' }}>
                            <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 2 }}>{formatDate(addDays(startDate, d-1)).split(',')[0]}</div>
                            <div style={{ fontSize: 9, color: 'var(--text-4)', fontFamily: 'Space Grotesk', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              {getInstructorType(courseId, d).split(' ')[0]}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <button
            className="btn btn-primary"
            disabled={!canCreate}
            onClick={handleCreate}
            style={{ width: '100%', marginTop: 8, marginBottom: 32 }}
          >
            Create Cohort
          </button>
        </div>
      </div>
    </div>
  )
}
