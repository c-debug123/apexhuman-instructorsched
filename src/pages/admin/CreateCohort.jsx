import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'

function BackIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
}

const TODAY = new Date().toISOString().slice(0, 10)

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function CreateCohort() {
  const navigate = useNavigate()
  const { courses, modules, addCohort } = useApp()

  const [courseId,  setCourseId]  = useState('')
  const [sections,  setSections]  = useState(1)
  const [showMenu,  setShowMenu]  = useState(false)
  const [slotDates, setSlotDates] = useState([])   // [{ slotIndex, date, startTime }]

  const selectedCourse = courses.find(c => c.id === courseId)
  const courseSlots    = selectedCourse?.days || []

  // Re-initialise slotDates whenever course changes
  useEffect(() => {
    if (!selectedCourse) { setSlotDates([]); return }
    setSlotDates(
      courseSlots.map((_, i) => ({ slotIndex: i, date: '', startTime: '09:00' }))
    )
  }, [courseId])

  function setSlotField(index, field, value) {
    setSlotDates(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s))
  }

  const allDatesSet = slotDates.length > 0 && slotDates.every(s => !!s.date)
  const canCreate   = !!courseId && allDatesSet

  function handleCreate() {
    const firstDate = slotDates[0]?.date || TODAY
    addCohort({
      id: crypto.randomUUID(),
      courseId,
      startDate: firstDate,
      sections,
      slotDates,
    })
    navigate('/admin')
  }

  return (
    <div className="admin-bg">
      <div className="z1" style={{ padding: '0 16px', paddingBottom: 48 }}>
        <div className="safe-top" style={{ paddingTop: 'max(16px, env(safe-area-inset-top))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 8, paddingBottom: 24 }}>
            <button className="btn btn-ghost" style={{ padding: '8px 4px', minHeight: 40 }} onClick={() => navigate('/admin')}>
              <BackIcon />
            </button>
            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18, color: 'var(--text-1)' }}>
              Schedule a Course
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Step 1 — Course */}
          <section>
            <div style={sectionHeader}>Step 1 — Choose a course</div>
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
                {courses.length === 0 ? (
                  <div style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-3)' }}>No courses yet — build one in the Course Builder first.</div>
                ) : courses.map(c => {
                  const hrs = (c.days || []).reduce((sum, slot) => {
                    const mod = modules.find(m => m.id === slot.moduleId)
                    return sum + (mod?.durationHours || 0)
                  }, 0)
                  return (
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
                        {(c.days?.length || 0)} module{(c.days?.length || 0) !== 1 ? 's' : ''}
                        {hrs > 0 && ` · ${hrs}h`}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </section>

          {/* Step 2 — Schedule per module */}
          {selectedCourse && courseSlots.length > 0 && (
            <section>
              <div style={sectionHeader}>Step 2 — Set dates &amp; times for each module</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {courseSlots.map((slot, i) => {
                  const mod       = modules.find(m => m.id === slot.moduleId)
                  const slotState = slotDates[i] || { date: '', startTime: '09:00' }
                  const isWeekend = slotState.date ? [0, 6].includes(new Date(slotState.date + 'T00:00:00').getDay()) : false

                  return (
                    <div key={slot.id || i} className="card" style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                          background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 11, color: 'var(--accent)',
                        }}>
                          {i + 1}
                        </div>
                        <div>
                          <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 14, color: 'var(--text-1)' }}>
                            {slot.label || mod?.name || `Module ${i + 1}`}
                          </div>
                          {mod && (
                            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{mod.durationHours}h</div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <label style={labelStyle}>Date</label>
                          <input
                            type="date"
                            className="input"
                            value={slotState.date}
                            min={TODAY}
                            onChange={e => setSlotField(i, 'date', e.target.value)}
                          />
                          {isWeekend && (
                            <div style={{ fontSize: 11, color: 'var(--amber)', marginTop: 4 }}>Weekend — confirm intentional</div>
                          )}
                          {slotState.date && (
                            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{formatDate(slotState.date)}</div>
                          )}
                        </div>
                        <div style={{ width: 110 }}>
                          <label style={labelStyle}>Start time</label>
                          <input
                            type="time"
                            className="input"
                            value={slotState.startTime}
                            onChange={e => setSlotField(i, 'startTime', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {selectedCourse && courseSlots.length === 0 && (
            <div className="card" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 13, color: 'var(--amber)' }}>
                This course has no modules yet. Go to <strong>Courses</strong> and add modules before scheduling.
              </div>
            </div>
          )}

          {/* Step 3 — Sections */}
          {selectedCourse && courseSlots.length > 0 && (
            <section>
              <div style={sectionHeader}>Step 3 — Sections</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 14 }}>
                How many groups run this course simultaneously
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <button className="btn btn-secondary" style={{ width: 44, padding: 0, fontSize: 20 }} onClick={() => setSections(s => Math.max(1, s - 1))}>−</button>
                <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 24, color: 'var(--text-1)', minWidth: 32, textAlign: 'center' }}>{sections}</span>
                <button className="btn btn-secondary" style={{ width: 44, padding: 0, fontSize: 20 }} onClick={() => setSections(s => Math.min(10, s + 1))}>+</button>
              </div>
            </section>
          )}

          {/* Summary */}
          {canCreate && (
            <div className="card anim-slide-up" style={{ padding: '14px 16px' }}>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 13, color: 'var(--text-2)', marginBottom: 10 }}>Schedule summary</div>
              {slotDates.map((s, i) => {
                const slot = courseSlots[i]
                const mod  = modules.find(m => m.id === slot?.moduleId)
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
                      {slot?.label || mod?.name || `Module ${i + 1}`}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'Space Grotesk' }}>
                      {formatDate(s.date)} · {s.startTime}
                    </span>
                  </div>
                )
              })}
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-dim)', fontSize: 12, color: 'var(--text-3)' }}>
                {sections} section{sections !== 1 ? 's' : ''} · {slotDates.length * sections} total slots
              </div>
            </div>
          )}

          <button
            className="btn btn-primary"
            disabled={!canCreate}
            onClick={handleCreate}
            style={{ width: '100%', marginTop: 4 }}
          >
            Create Schedule
          </button>
        </div>
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-3)',
  marginBottom: 6, fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.08em',
}

const sectionHeader = {
  fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12,
  textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)',
  marginBottom: 12,
}
