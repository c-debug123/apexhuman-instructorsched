import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'

const TODAY = new Date().toISOString().slice(0, 10)

function calcEndTime(startTime, durationHours) {
  if (!startTime || !durationHours) return ''
  const [h, m] = startTime.split(':').map(Number)
  const totalMins = h * 60 + m + Math.round(durationHours * 60)
  const endH = Math.floor(totalMins / 60) % 24
  const endM = totalMins % 60
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
}

function formatDateShort(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function isWeekend(dateStr) {
  if (!dateStr) return false
  return [0, 6].includes(new Date(dateStr + 'T00:00:00').getDay())
}

function toMins(timeStr) {
  if (!timeStr) return -1
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

function getOverlapIndices(slotDates, courseSlots, modules) {
  const conflicting = new Set()
  for (let i = 0; i < slotDates.length; i++) {
    const si = slotDates[i]
    if (!si?.date || !si?.startTime) continue
    const modI   = modules.find(m => m.id === courseSlots[i]?.moduleId)
    const startI = toMins(si.startTime)
    const endI   = startI + Math.round((modI?.durationHours || 1) * 60)
    for (let j = i + 1; j < slotDates.length; j++) {
      const sj = slotDates[j]
      if (!sj?.date || !sj?.startTime || sj.date !== si.date) continue
      const modJ   = modules.find(m => m.id === courseSlots[j]?.moduleId)
      const startJ = toMins(sj.startTime)
      const endJ   = startJ + Math.round((modJ?.durationHours || 1) * 60)
      if (startI < endJ && startJ < endI) {
        conflicting.add(i)
        conflicting.add(j)
      }
    }
  }
  return conflicting
}

export default function CreateCohort() {
  const navigate = useNavigate()
  const { courses, modules, addCohort } = useApp()

  const [courseId,  setCourseId]  = useState('')
  const [sections,  setSections]  = useState(1)
  const [showMenu,  setShowMenu]  = useState(false)
  const [slotDates, setSlotDates] = useState([])

  const selectedCourse = courses.find(c => c.id === courseId)
  const courseSlots    = selectedCourse?.days || []

  useEffect(() => {
    if (!selectedCourse) { setSlotDates([]); return }
    setSlotDates(courseSlots.map((_, i) => ({ slotIndex: i, date: '', startTime: '09:00' })))
  }, [courseId])

  function setSlotField(index, field, value) {
    setSlotDates(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s))
  }

  const overlapIndices = getOverlapIndices(slotDates, courseSlots, modules)
  const hasOverlap     = overlapIndices.size > 0
  const allDatesSet    = slotDates.length > 0 && slotDates.every(s => !!s.date)
  const canCreate      = !!courseId && allDatesSet && !hasOverlap

  function handleCreate() {
    addCohort({
      id: crypto.randomUUID(),
      courseId,
      startDate: slotDates[0]?.date || TODAY,
      sections,
      slotDates,
    })
    navigate('/admin')
  }

  const totalHours = courseSlots.reduce((sum, slot) => {
    const mod = modules.find(m => m.id === slot.moduleId)
    return sum + (mod?.durationHours || 0)
  }, 0)

  return (
    <div className="admin-bg">
      <div className="z1" style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px', paddingBottom: 56 }}>

        {/* Header */}
        <div style={{ paddingTop: 'max(20px, env(safe-area-inset-top))', paddingBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => navigate('/admin')}
            style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: '4px 6px', display: 'flex', flexShrink: 0 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18, color: 'var(--text-1)', lineHeight: 1.2 }}>Schedule a Course</div>
            <div style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 2 }}>Set dates and times for each module</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Course picker */}
          <div>
            <div style={fieldLabel}>Course</div>
            <button
              onClick={() => setShowMenu(v => !v)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'var(--surface-sm)', border: `1px solid ${showMenu ? 'var(--accent)' : 'var(--border-md)'}`,
                borderRadius: 'var(--radius-sm)', padding: '12px 14px', cursor: 'pointer',
                transition: 'border-color 150ms',
              }}
            >
              {selectedCourse ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: selectedCourse.color, flexShrink: 0 }} />
                  <span style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 14, color: 'var(--text-1)' }}>{selectedCourse.name}</span>
                  {totalHours > 0 && <span style={{ fontSize: 12, color: 'var(--text-4)' }}>{courseSlots.length} modules · {totalHours}h</span>}
                </span>
              ) : <span style={{ fontSize: 14, color: 'var(--text-4)' }}>Select a course…</span>}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
            </button>

            {showMenu && (
              <div className="card anim-slide-up" style={{ marginTop: 4, overflow: 'hidden', zIndex: 10, position: 'relative', padding: 0 }}>
                {courses.length === 0 ? (
                  <div style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-3)' }}>No courses yet — build one first.</div>
                ) : courses.map((c, idx) => {
                  const hrs = (c.days || []).reduce((s, slot) => s + (modules.find(m => m.id === slot.moduleId)?.durationHours || 0), 0)
                  return (
                    <button
                      key={c.id}
                      onClick={() => { setCourseId(c.id); setShowMenu(false) }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '11px 14px',
                        background: courseId === c.id ? 'var(--accent-dim)' : 'transparent',
                        border: 'none', cursor: 'pointer', textAlign: 'left',
                        borderBottom: idx < courses.length - 1 ? '1px solid var(--border-dim)' : 'none',
                      }}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                      <span style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 14, color: 'var(--text-1)', flex: 1 }}>{c.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-4)' }}>{c.days?.length || 0}m · {hrs}h</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Module schedule */}
          {selectedCourse && courseSlots.length === 0 && (
            <div style={{ padding: '12px 14px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--amber)' }}>
              This course has no modules — add modules in the Course Builder first.
            </div>
          )}

          {selectedCourse && courseSlots.length > 0 && (
            <div>
              <div style={fieldLabel}>Module Schedule</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {courseSlots.map((slot, i) => {
                  const mod       = modules.find(m => m.id === slot.moduleId)
                  const s         = slotDates[i] || { date: '', startTime: '09:00' }
                  const endTime   = mod ? calcEndTime(s.startTime, mod.durationHours) : ''
                  const weekend   = isWeekend(s.date)
                  const hasConflict = overlapIndices.has(i)

                  return (
                    <div
                      key={slot.id || i}
                      style={{
                        background: 'var(--surface-sm)',
                        border: `1px solid ${hasConflict ? 'var(--red)' : 'var(--border-dim)'}`,
                        borderRadius: 'var(--radius-sm)', padding: '12px 14px',
                        transition: 'border-color 150ms',
                      }}
                    >
                      {/* Module label row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <div style={{
                          width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                          background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 10, color: 'var(--accent)',
                        }}>
                          {i + 1}
                        </div>
                        <span style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 13, color: 'var(--text-1)', flex: 1 }}>
                          {slot.label || mod?.name || `Module ${i + 1}`}
                        </span>
                        {mod && (
                          <span style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'Space Grotesk' }}>{mod.durationHours}h</span>
                        )}
                      </div>

                      {/* Date + time row */}
                      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                        <div style={{ flex: 1 }}>
                          <input
                            type="date"
                            className="input"
                            value={s.date}
                            min={TODAY}
                            onChange={e => setSlotField(i, 'date', e.target.value)}
                            style={{ fontSize: 14, padding: '9px 12px' }}
                          />
                        </div>
                        <div style={{ width: 96 }}>
                          <input
                            type="time"
                            className="input"
                            value={s.startTime}
                            onChange={e => setSlotField(i, 'startTime', e.target.value)}
                            style={{ fontSize: 14, padding: '9px 12px' }}
                          />
                        </div>
                        {endTime && (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            paddingBottom: 10, flexShrink: 0,
                          }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 13, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
                              {endTime}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Inline hints */}
                      <div style={{ marginTop: 6, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {s.date && (
                          <span style={{ fontSize: 11, color: weekend ? 'var(--amber)' : 'var(--text-4)' }}>
                            {formatDateShort(s.date)}{weekend ? ' · weekend' : ''}
                          </span>
                        )}
                        {endTime && s.date && (
                          <span style={{ fontSize: 11, color: 'var(--text-4)' }}>
                            {s.startTime} – {endTime}
                          </span>
                        )}
                      </div>
                      {hasConflict && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 7, fontSize: 11, color: 'var(--red)', fontFamily: 'Space Grotesk', fontWeight: 600 }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                          Time overlaps with another module on this date
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Sections */}
          {selectedCourse && courseSlots.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--surface-sm)', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius-sm)' }}>
              <div>
                <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 13, color: 'var(--text-1)', marginBottom: 2 }}>Sections</div>
                <div style={{ fontSize: 11, color: 'var(--text-4)' }}>Groups running simultaneously</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={() => setSections(s => Math.max(1, s - 1))}
                  style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'var(--surface-xs)', border: '1px solid var(--border-dim)', color: 'var(--text-2)', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >−</button>
                <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18, color: 'var(--text-1)', minWidth: 20, textAlign: 'center' }}>{sections}</span>
                <button
                  onClick={() => setSections(s => Math.min(10, s + 1))}
                  style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'var(--surface-xs)', border: '1px solid var(--border-dim)', color: 'var(--text-2)', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >+</button>
              </div>
            </div>
          )}

          {/* Create button */}
          {selectedCourse && courseSlots.length > 0 && (
            <button
              className="btn btn-primary"
              disabled={!canCreate}
              onClick={handleCreate}
              style={{ width: '100%' }}
            >
              {canCreate
                ? `Create Schedule · ${courseSlots.length} modules, ${sections} section${sections !== 1 ? 's' : ''}`
                : hasOverlap
                  ? 'Resolve time overlaps to continue'
                  : 'Set a date for each module to continue'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const fieldLabel = {
  fontSize: 11, fontFamily: 'Space Grotesk', fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.08em',
  color: 'var(--text-4)', marginBottom: 8,
}
