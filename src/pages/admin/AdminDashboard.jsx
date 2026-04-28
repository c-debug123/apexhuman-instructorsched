import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useStats } from '../../hooks/useSlots'
import { COURSES, addDays, formatDateShort } from '../../data/courses'
import BottomNav from '../../components/BottomNav'
import BottomSheet from '../../components/BottomSheet'
import CourseBadge from '../../components/CourseBadge'
import RoleSwitcher from '../../components/RoleSwitcher'

function PlusIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
}
function ResetIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { cohorts, claims, resetAll } = useApp()
  const stats = useStats()
  const [showReset, setShowReset] = useState(false)

  const urgentCohorts = cohorts.filter(c => {
    const d1 = new Date(c.startDate + 'T00:00:00')
    const now = new Date(); now.setHours(0,0,0,0)
    const diff = Math.ceil((d1 - now) / 86400000)
    if (diff > 7 || diff < 0) return false
    for (let day = 1; day <= 5; day++) {
      for (let sec = 1; sec <= c.sections; sec++) {
        const has = claims.some(cl => cl.cohortId === c.id && cl.day === day && cl.section === sec)
        if (!has) return true
      }
    }
    return false
  })

  const totalUrgentOpen = urgentCohorts.reduce((sum, c) => {
    let open = 0
    for (let day = 1; day <= 5; day++)
      for (let sec = 1; sec <= c.sections; sec++)
        if (!claims.some(cl => cl.cohortId === c.id && cl.day === day && cl.section === sec)) open++
    return sum + open
  }, 0)

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
              {(cohorts.length > 0 || claims.length > 0) && (
                <button
                  onClick={() => setShowReset(true)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)',
                    borderRadius: 'var(--radius-full)', padding: '3px 10px',
                    color: 'var(--red)', fontFamily: 'Space Grotesk', fontWeight: 600,
                    fontSize: 11, cursor: 'pointer',
                  }}
                >
                  <ResetIcon /> Reset
                </button>
              )}
              <RoleSwitcher role="admin" />
            </div>
          </div>

          {/* Stats */}
          <div className="card" style={{ display: 'flex', marginBottom: 20, overflow: 'hidden' }}>
            {[
              { label: 'Total Slots', value: stats.totalSlots, color: 'var(--accent)' },
              { label: 'Filled',      value: stats.filled,     color: 'var(--teal)' },
              { label: 'Open',        value: stats.open,       color: 'var(--amber)' },
              { label: 'Courses',     value: stats.coursesRunning, color: 'var(--text-2)' },
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

          {/* Urgent alert */}
          {totalUrgentOpen > 0 && (
            <div className="card" style={{ background: 'var(--amber-dim)', border: '1px solid rgba(245,158,11,0.3)', padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span style={{ fontSize: 13, color: 'var(--amber)' }}>
                {totalUrgentOpen} slot{totalUrgentOpen !== 1 ? 's' : ''} need instructors within 7 days
              </span>
            </div>
          )}

          {/* Quick links to new config pages */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button
              className="btn btn-ghost"
              onClick={() => navigate('/admin/modules')}
              style={{ flex: 1, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="6" height="6" rx="1"/><rect x="9" y="3" width="13" height="6" rx="1"/><rect x="2" y="13" width="6" height="6" rx="1"/><rect x="9" y="13" width="13" height="6" rx="1"/></svg>
              Module Library
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => navigate('/admin/courses')}
              style={{ flex: 1, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              Courses
            </button>
          </div>

          <div className="section-label" style={{ marginBottom: 12 }}>Active Cohorts</div>
        </div>

        {/* Cohort list */}
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {cohorts.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="1.5" strokeLinecap="round" style={{ margin: '0 auto' }}>
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 16, color: 'var(--text-2)', marginBottom: 6 }}>No cohorts scheduled</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>Create your first cohort to start building the schedule.</div>
              <button className="btn btn-primary" style={{ margin: '0 auto' }} onClick={() => navigate('/admin/cohorts/new')}>
                <PlusIcon /> Create Cohort
              </button>
            </div>
          ) : (
            cohorts.map(cohort => <CohortCard key={cohort.id} cohort={cohort} claims={claims} onClick={() => navigate(`/admin/cohorts/${cohort.id}`)} />)
          )}
        </div>
      </div>

      {/* FAB */}
      {cohorts.length > 0 && (
        <button
          className="btn btn-primary"
          onClick={() => navigate('/admin/cohorts/new')}
          style={{
            position: 'fixed', bottom: 'calc(72px + max(8px, env(safe-area-inset-bottom)) + 12px)',
            right: 16, zIndex: 30,
            borderRadius: 'var(--radius-full)', padding: '12px 20px',
            boxShadow: '0 4px 24px rgba(124,106,247,0.35)',
          }}
        >
          <PlusIcon /> New Cohort
        </button>
      )}

      {/* Reset confirmation */}
      <BottomSheet isOpen={showReset} onClose={() => setShowReset(false)} title="Reset all data?">
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20, lineHeight: 1.6 }}>
            This will permanently delete <strong style={{ color: 'var(--text-1)' }}>{cohorts.length} cohort{cohorts.length !== 1 ? 's' : ''}</strong> and <strong style={{ color: 'var(--text-1)' }}>{claims.length} instructor claim{claims.length !== 1 ? 's' : ''}</strong>.<br />
            The app will return to a blank state. This cannot be undone.
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-danger"
              style={{ flex: 1 }}
              onClick={() => { resetAll(); setShowReset(false) }}
            >
              Reset everything
            </button>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowReset(false)}>
              Cancel
            </button>
          </div>
        </div>
      </BottomSheet>

      <BottomNav role="admin" />
    </div>
  )
}

function CohortCard({ cohort, claims, onClick }) {
  const course = COURSES[cohort.courseId]
  if (!course) return null
  const d5 = addDays(cohort.startDate, 4)
  const total = cohort.sections * 5
  const filled = claims.filter(cl => cl.cohortId === cohort.id).length
  const pct = total > 0 ? (filled / total) * 100 : 0
  const barColor = pct === 100 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--red)'

  return (
    <button
      className="card card-hover"
      onClick={onClick}
      style={{ padding: 0, overflow: 'hidden', textAlign: 'left', width: '100%', cursor: 'pointer', background: 'var(--surface-sm)' }}
    >
      <div style={{ display: 'flex', gap: 0 }}>
        <div style={{ width: 4, background: course.color, flexShrink: 0 }} />
        <div style={{ flex: 1, padding: '14px 14px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <CourseBadge courseId={cohort.courseId} size="sm" />
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
              {cohort.sections} section{cohort.sections !== 1 ? 's' : ''}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 10 }}>
            {formatDateShort(cohort.startDate)} – {formatDateShort(d5)}
          </div>

          {/* Mini dot grid */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
            {Array.from({ length: cohort.sections }, (_, si) =>
              Array.from({ length: 5 }, (_, di) => {
                const day = di + 1; const sec = si + 1
                const taken = claims.some(cl => cl.cohortId === cohort.id && cl.day === day && cl.section === sec)
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

          {/* Progress */}
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
  )
}
