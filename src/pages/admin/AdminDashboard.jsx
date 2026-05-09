import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { addDays, formatDateShort } from '../../data/courses'
import BottomSheet from '../../components/BottomSheet'
import CourseBadge from '../../components/CourseBadge'

function PlusIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
}
function ResetIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
}
function ExternalLinkIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
}
function ChevronRight() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
}
function LockIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
}

const INSTRUCTOR_URL = import.meta.env.VITE_INSTRUCTOR_URL || `${window.location.origin}/?role=instructor`

function SetupStep({ number, label, sublabel, count, onClick, locked, cta }) {
  return (
    <button
      onClick={locked ? undefined : onClick}
      disabled={locked}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '13px 14px', width: '100%', textAlign: 'left',
        background: 'none', border: 'none', cursor: locked ? 'default' : 'pointer',
        opacity: locked ? 0.45 : 1,
        transition: 'opacity 150ms',
      }}
    >
      <div style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
        background: count > 0 ? 'var(--accent-dim)' : 'var(--surface-xs)',
        border: `1px solid ${count > 0 ? 'var(--accent-border)' : 'var(--border-dim)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12,
        color: count > 0 ? 'var(--accent)' : 'var(--text-3)',
      }}>
        {number}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 14, color: 'var(--text-1)', marginBottom: 1 }}>
          {label}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
          {count > 0 ? sublabel(count) : cta}
        </div>
      </div>
      <div style={{ flexShrink: 0, color: locked ? 'var(--text-4)' : 'var(--text-3)' }}>
        {locked ? <LockIcon /> : <ChevronRight />}
      </div>
    </button>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { cohorts, courses, modules, claims, instructors, resetAll, deleteCohort } = useApp()
  const [showReset, setShowReset]       = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [sortBy, setSortBy]             = useState('newest')
  const [filterCourse, setFilterCourse] = useState(null)
  const [showSort, setShowSort]         = useState(false)
  const [showFilter, setShowFilter]     = useState(false)

const totalSlots  = cohorts.reduce((s, c) => s + (courses.find(x => x.id === c.courseId)?.days?.length || 0) * c.sections, 0)
  const filled      = claims.length
  const open        = Math.max(0, totalSlots - filled)

  const urgentOpen = cohorts.filter(c => {
    const course   = courses.find(x => x.id === c.courseId)
    const dayCount = course?.days?.length || 0
    const d1       = new Date(c.startDate + 'T00:00:00')
    const now      = new Date(); now.setHours(0,0,0,0)
    const diff     = Math.ceil((d1 - now) / 86400000)
    if (diff > 7 || diff < 0) return false
    for (let day = 1; day <= dayCount; day++)
      for (let sec = 1; sec <= c.sections; sec++)
        if (!claims.some(cl => cl.cohortId === c.id && cl.day === day && cl.section === sec)) return true
    return false
  }).reduce((sum, c) => {
    const dayCount = courses.find(x => x.id === c.courseId)?.days?.length || 0
    for (let day = 1; day <= dayCount; day++)
      for (let sec = 1; sec <= c.sections; sec++)
        if (!claims.some(cl => cl.cohortId === c.id && cl.day === day && cl.section === sec)) sum++
    return sum
  }, 0)

  const hasModules      = modules.length > 0
  const builtCourses    = courses.filter(c => c.days?.length > 0)
  const hasCourses      = builtCourses.length > 0

  const uniqueCourseIds = [...new Set(cohorts.map(c => c.courseId))]

  const visibleCohorts = cohorts
    .filter(c => !filterCourse || c.courseId === filterCourse)
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      if (sortBy === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
      if (sortBy === 'course') return (courses.find(c => c.id === a.courseId)?.code || '').localeCompare(courses.find(c => c.id === b.courseId)?.code || '')
      return 0
    })

  return (
    <div className="admin-bg">
      <div className="z1 page">
        {/* Header */}
        <div className="safe-top" style={{ padding: '0 16px', paddingTop: 'max(16px, env(safe-area-inset-top))' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 20 }}>
            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 20, color: 'var(--text-1)' }}>
              Apex Humans
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <a
                href={INSTRUCTOR_URL}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: 'rgba(45,212,191,0.12)', border: '1px solid rgba(45,212,191,0.3)',
                  borderRadius: 'var(--radius-full)', padding: '4px 10px',
                  color: 'var(--teal)', fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 11,
                  cursor: 'pointer', transition: 'all 150ms', textDecoration: 'none',
                }}
              >
                <ExternalLinkIcon /> Instructor Link
              </a>
              {(cohorts.length > 0 || claims.length > 0 || modules.length > 0 || instructors.length > 0 || courses.some(c => c.days?.length > 0)) && (
                <button
                  onClick={() => setShowReset(true)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)',
                    borderRadius: 'var(--radius-full)', padding: '4px 10px',
                    color: 'var(--red)', fontFamily: 'Space Grotesk', fontWeight: 600,
                    fontSize: 11, cursor: 'pointer',
                  }}
                >
                  <ResetIcon /> Reset
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          {totalSlots > 0 && (
            <div className="card" style={{ display: 'flex', marginBottom: 16, overflow: 'hidden' }}>
              {[
                { label: 'Total Slots', value: totalSlots,          color: 'var(--accent)' },
                { label: 'Filled',      value: filled,              color: 'var(--teal)' },
                { label: 'Open',        value: open,                color: 'var(--amber)' },
                { label: 'Courses',     value: builtCourses.length, color: 'var(--text-2)' },
              ].map((s, i, arr) => (
                <div key={s.label} style={{
                  flex: 1, padding: '14px 8px', textAlign: 'center',
                  borderRight: i < arr.length - 1 ? '1px solid var(--border-dim)' : 'none',
                }}>
                  <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 24, color: s.color, lineHeight: 1 }}>
                    {s.value}
                  </div>
                  <div style={{ fontFamily: 'Space Grotesk', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginTop: 4 }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Urgent alert */}
          {urgentOpen > 0 && (
            <div className="card" style={{ background: 'var(--amber-dim)', border: '1px solid rgba(245,158,11,0.3)', padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span style={{ fontSize: 13, color: 'var(--amber)' }}>
                {urgentOpen} slot{urgentOpen !== 1 ? 's' : ''} need instructors within 7 days
              </span>
            </div>
          )}

          {/* 3-step setup */}
          <div className="section-label" style={{ marginBottom: 10 }}>Setup</div>
          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
            <SetupStep
              number={1}
              label="Create Modules"
              sublabel={n => `${n} module${n !== 1 ? 's' : ''} in library`}
              cta="Define reusable teaching modules"
              count={modules.length}
              locked={false}
              onClick={() => navigate('/admin/modules')}
            />
            <div style={{ height: 1, background: 'var(--border-dim)', margin: '0 14px' }} />
            <SetupStep
              number={2}
              label="Build Courses"
              sublabel={n => `${n} course${n !== 1 ? 's' : ''} built`}
              cta={hasModules ? 'Combine modules into a course' : 'Create modules first'}
              count={builtCourses.length}
              locked={!hasModules}
              onClick={() => navigate('/admin/courses')}
            />
            <div style={{ height: 1, background: 'var(--border-dim)', margin: '0 14px' }} />
            <SetupStep
              number={3}
              label="Schedule a Course"
              sublabel={n => `${n} schedule${n !== 1 ? 's' : ''} active`}
              cta={!hasModules ? 'Create modules first' : !hasCourses ? 'Build a course first' : 'Set dates and times for each module'}
              count={cohorts.length}
              locked={!hasModules || !hasCourses}
              onClick={() => navigate('/admin/cohorts/new')}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="section-label" style={{ marginBottom: 0 }}>Active Schedules</span>
              {filterCourse && (
                <button onClick={() => setFilterCourse(null)} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: 'rgba(124,106,247,0.15)', border: '1px solid rgba(124,106,247,0.35)',
                  borderRadius: 'var(--radius-full)', padding: '2px 8px',
                  color: 'var(--accent)', fontSize: 11, fontFamily: 'Space Grotesk', fontWeight: 600, cursor: 'pointer',
                }}>
                  {courses.find(c => c.id === filterCourse)?.code} ×
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setShowFilter(true)} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: filterCourse ? 'rgba(124,106,247,0.15)' : 'var(--surface-xs)',
                border: `1px solid ${filterCourse ? 'rgba(124,106,247,0.35)' : 'var(--border-dim)'}`,
                borderRadius: 'var(--radius-full)', padding: '4px 10px',
                color: filterCourse ? 'var(--accent)' : 'var(--text-3)', cursor: 'pointer', fontSize: 12,
                fontFamily: 'Space Grotesk', fontWeight: 600,
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                Filter
              </button>
              <button onClick={() => setShowSort(true)} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: sortBy !== 'newest' ? 'rgba(124,106,247,0.15)' : 'var(--surface-xs)',
                border: `1px solid ${sortBy !== 'newest' ? 'rgba(124,106,247,0.35)' : 'var(--border-dim)'}`,
                borderRadius: 'var(--radius-full)', padding: '4px 10px',
                color: sortBy !== 'newest' ? 'var(--accent)' : 'var(--text-3)', cursor: 'pointer', fontSize: 12,
                fontFamily: 'Space Grotesk', fontWeight: 600,
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                Sort
              </button>
            </div>
          </div>
        </div>

        {/* Cohort list */}
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 100 }}>
          {visibleCohorts.length === 0 && cohorts.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ marginBottom: 12 }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="1.5" strokeLinecap="round" style={{ margin: '0 auto' }}>
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 15, color: 'var(--text-2)', marginBottom: 6 }}>No schedules yet</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>
                {!hasModules ? 'Start by creating your teaching modules above.' : !hasCourses ? 'Then build a course from your modules.' : 'Complete step 3 above to schedule your first course.'}
              </div>
              {!hasModules ? (
                <button className="btn btn-primary" style={{ margin: '0 auto' }} onClick={() => navigate('/admin/modules')}>
                  <PlusIcon /> Create Modules
                </button>
              ) : !hasCourses ? (
                <button className="btn btn-primary" style={{ margin: '0 auto' }} onClick={() => navigate('/admin/courses')}>
                  <PlusIcon /> Build a Course
                </button>
              ) : (
                <button className="btn btn-primary" style={{ margin: '0 auto' }} onClick={() => navigate('/admin/cohorts/new')}>
                  <PlusIcon /> Schedule a Course
                </button>
              )}
            </div>
          ) : visibleCohorts.length === 0 ? (
            <div className="card" style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>
              No schedules match the current filter.
              <button onClick={() => setFilterCourse(null)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 13, marginLeft: 6 }}>Clear</button>
            </div>
          ) : (
            visibleCohorts.map(cohort => (
              <CohortCard
                key={cohort.id}
                cohort={cohort}
                courses={courses}
                claims={claims}
                onClick={() => navigate(`/admin/cohorts/${cohort.id}`)}
                onEdit={() => navigate(`/admin/cohorts/${cohort.id}`)}
                onDelete={() => setDeleteTarget(cohort)}
              />
            ))
          )}
        </div>
      </div>


      <BottomSheet isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete schedule?">
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20, lineHeight: 1.6 }}>
            This will permanently remove this cohort and all associated instructor claims. This cannot be undone.
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => { deleteCohort(deleteTarget.id); setDeleteTarget(null) }}>Delete</button>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setDeleteTarget(null)}>Cancel</button>
          </div>
        </div>
      </BottomSheet>

      <BottomSheet isOpen={showSort} onClose={() => setShowSort(false)} title="Sort schedules">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { value: 'newest', label: 'Newest first' },
            { value: 'oldest', label: 'Oldest first' },
            { value: 'course', label: 'By course' },
          ].map(opt => (
            <button key={opt.value} onClick={() => { setSortBy(opt.value); setShowSort(false) }} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: sortBy === opt.value ? 'rgba(124,106,247,0.12)' : 'var(--surface-xs)',
              border: `1px solid ${sortBy === opt.value ? 'rgba(124,106,247,0.35)' : 'var(--border-dim)'}`,
              borderRadius: 'var(--radius-md)', padding: '12px 14px',
              color: sortBy === opt.value ? 'var(--accent)' : 'var(--text-2)',
              fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 14, cursor: 'pointer', textAlign: 'left',
            }}>
              {opt.label}
              {sortBy === opt.value && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
            </button>
          ))}
        </div>
      </BottomSheet>

      <BottomSheet isOpen={showFilter} onClose={() => setShowFilter(false)} title="Filter by course">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={() => { setFilterCourse(null); setShowFilter(false) }} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: !filterCourse ? 'rgba(124,106,247,0.12)' : 'var(--surface-xs)',
            border: `1px solid ${!filterCourse ? 'rgba(124,106,247,0.35)' : 'var(--border-dim)'}`,
            borderRadius: 'var(--radius-md)', padding: '12px 14px',
            color: !filterCourse ? 'var(--accent)' : 'var(--text-2)',
            fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 14, cursor: 'pointer', textAlign: 'left',
          }}>
            All courses
            {!filterCourse && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
          </button>
          {uniqueCourseIds.map(cid => {
            const c = courses.find(x => x.id === cid)
            if (!c) return null
            return (
              <button key={cid} onClick={() => { setFilterCourse(cid); setShowFilter(false) }} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: filterCourse === cid ? 'rgba(124,106,247,0.12)' : 'var(--surface-xs)',
                border: `1px solid ${filterCourse === cid ? 'rgba(124,106,247,0.35)' : 'var(--border-dim)'}`,
                borderRadius: 'var(--radius-md)', padding: '12px 14px',
                color: filterCourse === cid ? 'var(--accent)' : 'var(--text-2)',
                fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 14, cursor: 'pointer', textAlign: 'left',
              }}>
                {c.code}: {c.name}
                {filterCourse === cid && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
              </button>
            )
          })}
        </div>
      </BottomSheet>

      <BottomSheet isOpen={showReset} onClose={() => setShowReset(false)} title="Reset all data?">
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20, lineHeight: 1.6 }}>
            This will permanently delete <strong style={{ color: 'var(--text-1)' }}>{cohorts.length} schedule{cohorts.length !== 1 ? 's' : ''}</strong>, <strong style={{ color: 'var(--text-1)' }}>{claims.length} instructor claim{claims.length !== 1 ? 's' : ''}</strong>, <strong style={{ color: 'var(--text-1)' }}>{instructors.length} instructor{instructors.length !== 1 ? 's' : ''}</strong>, <strong style={{ color: 'var(--text-1)' }}>{modules.length} module{modules.length !== 1 ? 's' : ''}</strong>, and <strong style={{ color: 'var(--text-1)' }}>{courses.length} course{courses.length !== 1 ? 's' : ''}</strong>.<br />
            The app will return to a blank state. This cannot be undone.
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => { resetAll(); setShowReset(false) }}>Reset everything</button>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowReset(false)}>Cancel</button>
          </div>
        </div>
      </BottomSheet>

    </div>
  )
}

const ACTION_W = 76

function CohortCard({ cohort, courses, claims, onClick, onDelete, onEdit }) {
  const course = courses.find(c => c.id === cohort.courseId)
  const [offset, setOffset]   = useState(0)
  const [snapped, setSnapped] = useState(null) // null | 'left' | 'right'
  const [animating, setAnimating] = useState(false)
  const startXRef  = useRef(null)
  const baseRef    = useRef(0)

  if (!course) return null

  const slots    = cohort.slotDates?.length > 0 ? cohort.slotDates : []
  const dayCount = course.days?.length || 0
  const firstDate = slots[0]?.date || cohort.startDate
  const lastDate  = slots[slots.length - 1]?.date || (dayCount > 1 ? addDays(cohort.startDate, dayCount - 1) : cohort.startDate)
  const firstWithLocation = slots.find(s => s.room || s.address)
  const locationLabel = firstWithLocation
    ? [firstWithLocation.room, firstWithLocation.address].filter(Boolean).join(' · ')
    : null
  const total    = cohort.sections * dayCount
  const filled   = claims.filter(cl => cl.cohortId === cohort.id).length
  const pct      = total > 0 ? (filled / total) * 100 : 0
  const barColor = pct === 100 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--red)'

  function snapTo(target) {
    setAnimating(true)
    setOffset(target)
    setSnapped(target === 0 ? null : target < 0 ? 'left' : 'right')
    setTimeout(() => setAnimating(false), 300)
  }

  function handleTouchStart(e) {
    startXRef.current = e.touches[0].clientX
    baseRef.current   = snapped === 'left' ? -ACTION_W : snapped === 'right' ? ACTION_W : 0
    setAnimating(false)
  }

  function handleTouchMove(e) {
    if (startXRef.current === null) return
    const dx  = e.touches[0].clientX - startXRef.current
    const raw = baseRef.current + dx
    setOffset(Math.max(-ACTION_W, Math.min(ACTION_W, raw)))
  }

  function handleTouchEnd() {
    if (startXRef.current === null) return
    startXRef.current = null
    // From a snapped state, only allow snapping back to center — never jump to opposite side
    if (snapped === 'left') {
      snapTo(offset > -ACTION_W / 2 ? 0 : -ACTION_W)
    } else if (snapped === 'right') {
      snapTo(offset < ACTION_W / 2 ? 0 : ACTION_W)
    } else {
      const moved = offset - baseRef.current
      if (moved < -30 || offset < -ACTION_W / 2) snapTo(-ACTION_W)
      else if (moved > 30 || offset > ACTION_W / 2) snapTo(ACTION_W)
      else snapTo(0)
    }
  }

  function handleCardClick() {
    if (snapped) { snapTo(0); return }
    onClick()
  }

  const leftOpacity  = Math.min(1, Math.max(0, offset / (ACTION_W * 0.4)))
  const rightOpacity = Math.min(1, Math.max(0, -offset / (ACTION_W * 0.4)))

  return (
    <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      {/* Edit action — revealed on right-swipe */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: ACTION_W,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(124,106,247,0.18)',
        flexDirection: 'column', gap: 4,
        cursor: 'pointer',
        opacity: leftOpacity,
      }} onClick={onEdit}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        <span style={{ fontSize: 10, fontFamily: 'Space Grotesk', fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.05em' }}>EDIT</span>
      </div>

      {/* Delete action — revealed on left-swipe */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: ACTION_W,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(239,68,68,0.18)',
        flexDirection: 'column', gap: 4,
        cursor: 'pointer',
        opacity: rightOpacity,
      }} onClick={onDelete}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
        </svg>
        <span style={{ fontSize: 10, fontFamily: 'Space Grotesk', fontWeight: 600, color: 'var(--red)', letterSpacing: '0.05em' }}>DELETE</span>
      </div>

      {/* Card */}
      <button
        className="card card-hover"
        onClick={handleCardClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          padding: 0, overflow: 'hidden', textAlign: 'left', width: '100%',
          cursor: 'pointer', background: 'var(--surface-sm)',
          transform: `translateX(${offset}px)`,
          transition: animating ? 'transform 300ms cubic-bezier(0.34,1.56,0.64,1)' : 'none',
          position: 'relative', zIndex: 1,
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <div style={{ display: 'flex' }}>
          <div style={{ width: 4, background: course.color, flexShrink: 0 }} />
          <div style={{ flex: 1, padding: '14px 14px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <CourseBadge courseId={cohort.courseId} size="sm" />
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                {cohort.sections} section{cohort.sections !== 1 ? 's' : ''}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: locationLabel ? 3 : 6 }}>
              {formatDateShort(firstDate)} – {formatDateShort(lastDate)}
              {dayCount > 0 && <> · {dayCount} module{dayCount !== 1 ? 's' : ''}</>}
            </div>
            {locationLabel && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span style={{ fontSize: 11, color: 'var(--text-4)' }}>{locationLabel}</span>
              </div>
            )}
            {cohort.createdAt && (
              <div style={{ fontSize: 11, color: 'var(--text-4)', marginBottom: 10 }}>
                Created {new Date(cohort.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            )}

            <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
              {Array.from({ length: cohort.sections }, (_, si) =>
                Array.from({ length: dayCount }, (_, di) => {
                  const taken = claims.some(cl => cl.cohortId === cohort.id && cl.day === di + 1 && cl.section === si + 1)
                  return (
                    <div key={`${si}-${di}`} style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: taken ? 'var(--green)' : 'var(--surface-lg)',
                      border: taken ? 'none' : '1px solid var(--border-md)',
                    }} />
                  )
                })
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="progress-track" style={{ flex: 1 }}>
                <div className="progress-fill" style={{ width: `${pct}%`, background: barColor }} />
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'Space Grotesk', fontWeight: 600, whiteSpace: 'nowrap' }}>
                {filled}/{total}
              </span>
            </div>
          </div>
        </div>
      </button>
    </div>
  )
}
