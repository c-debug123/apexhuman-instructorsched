import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'

const TODAY = new Date().toISOString().slice(0, 10)

// ── Time helpers ──────────────────────────────────────────────────────────────

function calcEndTime(startTime, durationHours) {
  if (!startTime || !durationHours) return ''
  const [h, m] = startTime.split(':').map(Number)
  const totalMins = h * 60 + m + Math.round(durationHours * 60)
  const endH = Math.floor(totalMins / 60) % 24
  const endM = totalMins % 60
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
}

function addDuration(date, startTime, durationHours) {
  if (!date || !startTime) return { date, startTime }
  const [h, m] = startTime.split(':').map(Number)
  const totalMins = h * 60 + m + Math.round(durationHours * 60)
  const dayOverflow = Math.floor(totalMins / (24 * 60))
  const endMins = totalMins % (24 * 60)
  const endTime = `${String(Math.floor(endMins / 60)).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}`
  let newDate = date
  if (dayOverflow > 0) {
    const d = new Date(date + 'T00:00:00')
    d.setDate(d.getDate() + dayOverflow)
    newDate = d.toISOString().slice(0, 10)
  }
  return { date: newDate, startTime: endTime }
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

function getPrecedenceErrors(slotDates, courseSlots, modules) {
  const errors = new Set()
  for (let i = 1; i < slotDates.length; i++) {
    const prev = slotDates[i - 1]
    const curr = slotDates[i]
    if (!prev?.date || !prev?.startTime || !curr?.date || !curr?.startTime) continue
    const prevMod = modules.find(m => m.id === courseSlots[i - 1]?.moduleId)
    const prevEnd = new Date(`${prev.date}T${prev.startTime}`)
    prevEnd.setMinutes(prevEnd.getMinutes() + Math.round((prevMod?.durationHours || 1) * 60))
    const currStart = new Date(`${curr.date}T${curr.startTime}`)
    if (currStart < prevEnd) errors.add(i)
  }
  return errors
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
      if (startI < endJ && startJ < endI) { conflicting.add(i); conflicting.add(j) }
    }
  }
  return conflicting
}

// ── Google Maps loader ────────────────────────────────────────────────────────

let mapsPromise = null
function loadGoogleMaps() {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  if (!key) return Promise.resolve(false)
  if (window.google?.maps?.places) return Promise.resolve(true)
  if (mapsPromise) return mapsPromise
  mapsPromise = new Promise(resolve => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.head.appendChild(script)
  })
  return mapsPromise
}

// ── AddressAutocomplete ───────────────────────────────────────────────────────

function AddressAutocomplete({ value, onChange, placeholder, height }) {
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [mapsReady, setMapsReady] = useState(!!window.google?.maps?.places)
  const serviceRef = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    if (mapsReady) return
    loadGoogleMaps().then(ok => { if (ok) setMapsReady(true) })
  }, [mapsReady])

  function getService() {
    if (!serviceRef.current && window.google?.maps?.places) {
      serviceRef.current = new window.google.maps.places.AutocompleteService()
    }
    return serviceRef.current
  }

  function handleInput(e) {
    const v = e.target.value
    onChange(v)
    clearTimeout(debounceRef.current)
    if (v.length < 3 || !mapsReady) { setSuggestions([]); setOpen(false); return }
    debounceRef.current = setTimeout(() => {
      const svc = getService()
      if (!svc) return
      svc.getPlacePredictions({ input: v }, (preds, status) => {
        if (status === 'OK' && preds) { setSuggestions(preds.slice(0, 5)); setOpen(true) }
        else { setSuggestions([]); setOpen(false) }
      })
    }, 280)
  }

  function handleSelect(description) {
    onChange(description)
    setSuggestions([])
    setOpen(false)
  }

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        className="input"
        placeholder={placeholder}
        value={value}
        onChange={handleInput}
        onBlur={() => setTimeout(() => setOpen(false), 160)}
        style={{ height, padding: '0 10px', boxSizing: 'border-box', width: '100%' }}
      />
      {open && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
          background: 'var(--surface-sm)', border: '1px solid var(--border-md)',
          borderRadius: 'var(--radius-sm)', marginTop: 2, overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          {suggestions.map((pred, idx) => (
            <button
              key={pred.place_id || idx}
              type="button"
              onMouseDown={() => handleSelect(pred.description)}
              style={{
                width: '100%', display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '9px 12px', background: 'transparent', border: 'none',
                borderBottom: idx < suggestions.length - 1 ? '1px solid var(--border-dim)' : 'none',
                cursor: 'pointer', textAlign: 'left',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-xs)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 3 }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'Space Grotesk', fontSize: 12, fontWeight: 600, color: 'var(--text-1)', marginBottom: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {pred.structured_formatting?.main_text || pred.description}
                </div>
                {pred.structured_formatting?.secondary_text && (
                  <div style={{ fontSize: 11, color: 'var(--text-4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {pred.structured_formatting.secondary_text}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Time picker ───────────────────────────────────────────────────────────────

const HOURS   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']
const FIELD_H = 36

function MilitaryTimePicker({ value, onChange }) {
  const [hh, mm] = value ? value.split(':') : ['09', '00']
  const selStyle = {
    background: 'var(--surface-xs)', border: '1px solid var(--border-md)',
    borderRadius: 'var(--radius-md)', color: 'var(--text-1)',
    fontFamily: 'Space Grotesk', fontWeight: 600,
    height: FIELD_H, width: 48, padding: 0, boxSizing: 'border-box',
    cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none',
    textAlign: 'center', textAlignLast: 'center',
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <select value={hh} onChange={e => onChange(`${e.target.value}:${mm}`)} style={selStyle}>
        {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
      </select>
      <span style={{ color: 'var(--text-3)', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 14 }}>:</span>
      <select value={mm} onChange={e => onChange(`${hh}:${e.target.value}`)} style={selStyle}>
        {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
    </div>
  )
}

// ── Duplicate check ───────────────────────────────────────────────────────────

function findDuplicateCohort(cohorts, courseId, slotDates) {
  if (!courseId || !slotDates.some(s => s.date)) return null
  const newDates = slotDates.map(s => s.date).filter(Boolean)
  if (newDates.length === 0) return null
  const newFirst = newDates[0]
  const newLast  = newDates[newDates.length - 1]
  return cohorts.find(c => {
    if (c.courseId !== courseId) return false
    const existing = c.slotDates?.map(s => s.date).filter(Boolean) || []
    if (existing.length === 0) return false
    return existing[0] <= newLast && existing[existing.length - 1] >= newFirst
  }) || null
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CreateCohort() {
  const navigate = useNavigate()
  const { courses, modules, cohorts, addCohort } = useApp()

  const [courseId,  setCourseId]  = useState('')
  const [sections,  setSections]  = useState(1)
  const [showMenu,  setShowMenu]  = useState(false)
  const [slotDates, setSlotDates] = useState([])

  const selectedCourse = courses.find(c => c.id === courseId)
  const courseSlots    = selectedCourse?.days || []

  useEffect(() => {
    if (!selectedCourse) { setSlotDates([]); return }
    setSlotDates(courseSlots.map((_, i) => ({ slotIndex: i, date: '', startTime: '09:00', room: '', address: '' })))
  }, [courseId])

  // Cascade date+time from `fromIndex` downward
  const cascadeDateTime = useCallback((slots, fromIndex) => {
    const next = [...slots]
    for (let j = fromIndex + 1; j < next.length; j++) {
      const prev = next[j - 1]
      if (!prev.date || !prev.startTime) break
      const prevMod = modules.find(m => m.id === courseSlots[j - 1]?.moduleId)
      const { date, startTime } = addDuration(prev.date, prev.startTime, prevMod?.durationHours || 1)
      next[j] = { ...next[j], date, startTime }
    }
    return next
  }, [modules, courseSlots])

  function handleDateChange(i, value) {
    setSlotDates(prev => {
      const updated = prev.map((s, idx) => idx === i ? { ...s, date: value } : s)
      return cascadeDateTime(updated, i)
    })
  }

  function handleTimeChange(i, value) {
    setSlotDates(prev => {
      const updated = prev.map((s, idx) => idx === i ? { ...s, startTime: value } : s)
      return cascadeDateTime(updated, i)
    })
  }

  // Cascade venue (room or address) from `index` downward — always overwrites
  function handleVenueChange(index, field, value) {
    setSlotDates(prev => prev.map((s, i) => i >= index ? { ...s, [field]: value } : s))
  }

  const overlapIndices     = getOverlapIndices(slotDates, courseSlots, modules)
  const precedenceErrors   = getPrecedenceErrors(slotDates, courseSlots, modules)
  const duplicateCohort    = findDuplicateCohort(cohorts, courseId, slotDates)
  const hasOverlap         = overlapIndices.size > 0
  const hasPrecedenceError = precedenceErrors.size > 0
  const allDatesSet        = slotDates.length > 0 && slotDates.every(s => !!s.date)
  const canCreate          = !!courseId && allDatesSet && !hasOverlap && !hasPrecedenceError && !duplicateCohort

  function handleCreate() {
    addCohort({ id: crypto.randomUUID(), courseId, startDate: slotDates[0]?.date || TODAY, sections, slotDates })
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
          <button onClick={() => navigate('/admin')} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: '4px 6px', display: 'flex', flexShrink: 0 }}>
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
                borderRadius: 'var(--radius-sm)', padding: '12px 14px', cursor: 'pointer', transition: 'border-color 150ms',
              }}
            >
              {selectedCourse ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: selectedCourse.color, flexShrink: 0 }} />
                  <span style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 14, color: 'var(--text-1)' }}>{selectedCourse.code}: {selectedCourse.name}</span>
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
                    <button key={c.id} onClick={() => { setCourseId(c.id); setShowMenu(false) }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: courseId === c.id ? 'var(--accent-dim)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: idx < courses.length - 1 ? '1px solid var(--border-dim)' : 'none' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                      <span style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 14, color: 'var(--text-1)', flex: 1 }}>{c.code}: {c.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-4)' }}>{c.days?.length || 0}m · {hrs}h</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Duplicate warning */}
          {duplicateCohort && (
            <div style={{ padding: '12px 14px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-sm)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span style={{ fontSize: 13, color: 'var(--red)', lineHeight: 1.5 }}>
                A schedule for this course already exists with overlapping dates. Delete the existing one first, or choose different dates.
              </span>
            </div>
          )}

          {selectedCourse && courseSlots.length === 0 && (
            <div style={{ padding: '12px 14px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--amber)' }}>
              This course has no modules — add modules in the Course Builder first.
            </div>
          )}

          {/* Module schedule */}
          {selectedCourse && courseSlots.length > 0 && (
            <div>
              <div style={fieldLabel}>Module Schedule</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {courseSlots.map((slot, i) => {
                  const mod           = modules.find(m => m.id === slot.moduleId)
                  const s             = slotDates[i] || { date: '', startTime: '09:00', room: '', address: '' }
                  const endTime       = mod ? calcEndTime(s.startTime, mod.durationHours) : ''
                  const weekend       = isWeekend(s.date)
                  const hasConflict   = overlapIndices.has(i)
                  const hasPrecedence = precedenceErrors.has(i)
                  const hasError      = hasConflict || hasPrecedence

                  let precedenceMsg = ''
                  if (hasPrecedence) {
                    const prev    = slotDates[i - 1]
                    const prevMod = modules.find(m => m.id === courseSlots[i - 1]?.moduleId)
                    const prevEndTime = calcEndTime(prev.startTime, prevMod?.durationHours || 1)
                    precedenceMsg = prev.date === s.date
                      ? `Must start at ${prevEndTime} or later (after Module ${i} ends)`
                      : `Must be on ${formatDateShort(prev.date)} at ${prevEndTime} or later`
                  }

                  return (
                    <div key={slot.id || i} style={{ background: 'var(--surface-sm)', border: `1px solid ${hasError ? 'var(--red)' : 'var(--border-dim)'}`, borderRadius: 'var(--radius-sm)', padding: '12px 14px', transition: 'border-color 150ms' }}>

                      {/* Module label */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 10, color: 'var(--accent)' }}>
                          {i + 1}
                        </div>
                        <span style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 13, color: 'var(--text-1)', flex: 1 }}>
                          {slot.label || mod?.name || `Module ${i + 1}`}
                        </span>
                        {mod && <span style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'Space Grotesk' }}>{mod.durationHours}h</span>}
                      </div>

                      {/* Date + time */}
                      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                        <div style={{ flex: 1 }}>
                          <div style={microLabel}>Date</div>
                          <input
                            type="date"
                            value={s.date}
                            min={TODAY}
                            onChange={e => handleDateChange(i, e.target.value)}
                            style={{ width: '100%', height: FIELD_H, boxSizing: 'border-box', padding: '0 10px', outline: 'none', background: 'var(--surface-xs)', border: '1px solid var(--border-md)', borderRadius: 'var(--radius-md)', color: 'var(--text-1)', fontFamily: 'Inter, sans-serif', appearance: 'none', WebkitAppearance: 'none' }}
                          />
                        </div>
                        <div style={{ flexShrink: 0 }}>
                          <div style={microLabel}>Start Time</div>
                          <MilitaryTimePicker value={s.startTime || '09:00'} onChange={v => handleTimeChange(i, v)} />
                        </div>
                        {endTime && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 13, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{endTime}</span>
                          </div>
                        )}
                      </div>

                      {/* Inline hints */}
                      {s.date && (
                        <div style={{ marginTop: 5, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, color: weekend ? 'var(--amber)' : 'var(--text-4)' }}>
                            {formatDateShort(s.date)}{weekend ? ' · weekend' : ''}
                          </span>
                          {endTime && <span style={{ fontSize: 11, color: 'var(--text-4)' }}>{s.startTime} – {endTime}</span>}
                        </div>
                      )}

                      {/* Venue */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 8 }}>
                        <input
                          type="text"
                          className="input"
                          placeholder="Room (optional)"
                          value={s.room || ''}
                          onChange={e => handleVenueChange(i, 'room', e.target.value)}
                          style={{ height: FIELD_H, padding: '0 10px', boxSizing: 'border-box' }}
                        />
                        <AddressAutocomplete
                          value={s.address || ''}
                          onChange={v => handleVenueChange(i, 'address', v)}
                          placeholder="Address (optional)"
                          height={FIELD_H}
                        />
                      </div>

                      {hasConflict && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 7, fontSize: 11, color: 'var(--red)', fontFamily: 'Space Grotesk', fontWeight: 600 }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                          Time overlaps with another module on this date
                        </div>
                      )}
                      {hasPrecedence && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 7, fontSize: 11, color: 'var(--red)', fontFamily: 'Space Grotesk', fontWeight: 600 }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                          {precedenceMsg}
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
                <button onClick={() => setSections(s => Math.max(1, s - 1))} style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'var(--surface-xs)', border: '1px solid var(--border-dim)', color: 'var(--text-2)', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18, color: 'var(--text-1)', minWidth: 20, textAlign: 'center' }}>{sections}</span>
                <button onClick={() => setSections(s => Math.min(10, s + 1))} style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'var(--surface-xs)', border: '1px solid var(--border-dim)', color: 'var(--text-2)', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
              </div>
            </div>
          )}

          {/* Create button */}
          {selectedCourse && courseSlots.length > 0 && (
            <button className="btn btn-primary" disabled={!canCreate} onClick={handleCreate} style={{ width: '100%' }}>
              {canCreate
                ? `Create Schedule · ${courseSlots.length} modules, ${sections} section${sections !== 1 ? 's' : ''}`
                : duplicateCohort ? 'Duplicate schedule — choose different dates'
                : hasOverlap ? 'Resolve time overlaps to continue'
                : hasPrecedenceError ? 'Modules must be scheduled in order'
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

const microLabel = {
  fontSize: 10, fontFamily: 'Space Grotesk', fontWeight: 700,
  color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5,
}
