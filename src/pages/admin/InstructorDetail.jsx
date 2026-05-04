import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import BottomSheet from '../../components/BottomSheet'

const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-4)',
  marginBottom: 8, fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.08em',
}

function InstructorForm({ initial, modules, onSave, onCancel }) {
  const [name, setName]   = useState(initial?.name || '')
  const [email, setEmail] = useState(initial?.email || '')
  const [eligible, setElig] = useState(initial?.eligibleGroups || [])

  const allGroups = [...new Set((modules || []).flatMap(m => m.tags || []))].sort()

  function toggleGroup(g) {
    setElig(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])
  }

  function handleSave() {
    if (name.trim().length < 2) return
    onSave({ name: name.trim(), email: email.trim(), eligibleGroups: eligible })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={labelStyle}>Full name</label>
        <input className="input" placeholder="Instructor name" value={name} onChange={e => setName(e.target.value)} autoFocus />
      </div>
      <div>
        <label style={labelStyle}>Email (optional)</label>
        <input className="input" type="email" placeholder="instructor@example.com" value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <div>
        <label style={labelStyle}>Module groups</label>
        <p style={{ fontSize: 12, color: 'var(--text-4)', marginBottom: 10, lineHeight: 1.5 }}>
          This instructor can teach any module belonging to the selected groups.
        </p>
        {allGroups.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-4)', fontStyle: 'italic' }}>No module groups yet — add tags to modules first.</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {allGroups.map(g => {
              const on = eligible.includes(g)
              const modCount = (modules || []).filter(m => (m.tags || []).includes(g)).length
              return (
                <button key={g} type="button" onClick={() => toggleGroup(g)} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 'var(--radius-full)',
                  border: `1px solid ${on ? 'var(--accent)' : 'var(--border-md)'}`,
                  background: on ? 'var(--accent-dim)' : 'var(--surface-xs)',
                  cursor: 'pointer', transition: 'all 150ms',
                }}>
                  {on && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  <span style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 13, color: on ? 'var(--accent)' : 'var(--text-2)' }}>{g}</span>
                  <span style={{ fontSize: 11, color: on ? 'var(--accent)' : 'var(--text-4)' }}>{modCount}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={name.trim().length < 2}>
          Save Changes
        </button>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

export default function InstructorDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { instructors, modules, courses, claims, updateInstructor, deleteInstructor } = useApp()

  const [showEdit, setShowEdit]       = useState(false)
  const [showDelete, setShowDelete]   = useState(false)

  const inst = instructors.find(i => i.id === id)

  if (!inst) {
    return (
      <div className="admin-bg">
        <div className="z1 page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100svh' }}>
          <div style={{ textAlign: 'center', color: 'var(--text-3)', fontFamily: 'Space Grotesk' }}>
            Instructor not found.
          </div>
        </div>
      </div>
    )
  }

  const today       = new Date().toISOString().slice(0, 10)
  const eligGroups  = inst.eligibleGroups || []
  const instClaims  = claims.filter(cl => cl.instructorId === inst.id)
  const upcoming    = instClaims.filter(cl => cl.date && cl.date >= today).sort((a, b) => a.date.localeCompare(b.date))
  const past        = instClaims.filter(cl => !cl.date || cl.date < today).sort((a, b) => b.date?.localeCompare(a.date ?? ''))

  function handleUpdate(data) {
    updateInstructor({ ...inst, ...data })
    setShowEdit(false)
  }

  async function handleDelete() {
    await deleteInstructor(inst.id)
    navigate('/admin/roster', { replace: true })
  }

  return (
    <div className="admin-bg">
      <div className="z1 page">

        {/* Header */}
        <div className="safe-top" style={{ padding: '0 16px', paddingTop: 'max(16px, env(safe-area-inset-top))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 8, paddingBottom: 16 }}>
            <button
              onClick={() => navigate('/admin/roster')}
              style={{ background: 'none', border: 'none', padding: '4px 4px 4px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-3)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18, color: 'var(--text-1)', flex: 1 }}>
              Instructor
            </span>
            <button
              onClick={() => setShowEdit(true)}
              style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 'var(--radius-full)', padding: '5px 14px', cursor: 'pointer', fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 13, color: 'var(--accent)' }}
            >
              Edit
            </button>
          </div>
        </div>

        <div style={{ padding: '0 16px', paddingBottom: 100, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Identity card */}
          <div className="card" style={{ padding: '20px 16px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'var(--accent-dim)', border: '1.5px solid var(--accent-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 22, color: 'var(--accent)',
              flexShrink: 0,
            }}>
              {inst.name[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18, color: 'var(--text-1)', marginBottom: 4 }}>
                {inst.name}
              </div>
              {inst.email ? (
                <div style={{ fontSize: 13, color: 'var(--text-3)' }}>{inst.email}</div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--text-4)', fontStyle: 'italic' }}>No email on file</div>
              )}
            </div>
          </div>

          {/* Module groups */}
          <div>
            <div style={labelStyle}>Eligible Module Groups</div>
            {eligGroups.length === 0 ? (
              <div className="card" style={{ padding: '16px', textAlign: 'center', fontSize: 13, color: 'var(--text-4)', fontStyle: 'italic' }}>
                No groups assigned yet
              </div>
            ) : (
              <div className="card" style={{ padding: '14px 16px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {eligGroups.map(g => (
                  <span key={g} style={{
                    fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13,
                    color: 'var(--accent)', background: 'var(--accent-dim)',
                    border: '1px solid var(--accent-border)',
                    borderRadius: 'var(--radius-full)', padding: '4px 12px',
                  }}>
                    {g}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Claimed slots */}
          <div>
            <div style={labelStyle}>Slots Claimed ({instClaims.length})</div>
            {instClaims.length === 0 ? (
              <div className="card" style={{ padding: '16px', textAlign: 'center', fontSize: 13, color: 'var(--text-4)', fontStyle: 'italic' }}>
                No slots claimed yet
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {upcoming.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontFamily: 'Space Grotesk', fontWeight: 600, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                      Upcoming ({upcoming.length})
                    </div>
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                      {upcoming.map((cl, i) => {
                        const course = courses.find(c => c.id === cl.courseId)
                        return (
                          <div key={cl.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderBottom: i < upcoming.length - 1 ? '1px solid var(--border-dim)' : 'none' }}>
                            {course && <div style={{ width: 3, height: 32, borderRadius: 2, background: course.color, flexShrink: 0 }} />}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 13, color: 'var(--text-1)', marginBottom: 2 }}>
                                {course?.name ?? 'Unknown course'}
                              </div>
                              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                                Day {cl.day} · Section {cl.section} · {cl.date}
                              </div>
                            </div>
                            <div style={{ flexShrink: 0, background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.25)', borderRadius: 'var(--radius-full)', padding: '2px 8px', fontSize: 10, fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              Upcoming
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                {past.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontFamily: 'Space Grotesk', fontWeight: 600, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                      Completed ({past.length})
                    </div>
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                      {past.map((cl, i) => {
                        const course = courses.find(c => c.id === cl.courseId)
                        return (
                          <div key={cl.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderBottom: i < past.length - 1 ? '1px solid var(--border-dim)' : 'none', opacity: 0.7 }}>
                            {course && <div style={{ width: 3, height: 32, borderRadius: 2, background: course.color, flexShrink: 0 }} />}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 13, color: 'var(--text-2)', marginBottom: 2 }}>
                                {course?.name ?? 'Unknown course'}
                              </div>
                              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                                Day {cl.day} · Section {cl.section} · {cl.date}
                              </div>
                            </div>
                            <div style={{ flexShrink: 0, background: 'var(--surface-xs)', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius-full)', padding: '2px 8px', fontSize: 10, fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              Done
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Remove */}
          <button
            onClick={() => setShowDelete(true)}
            style={{ background: 'none', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', padding: '12px 0', width: '100%', cursor: 'pointer', fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 13, color: 'var(--red)' }}
          >
            Remove Instructor
          </button>
        </div>
      </div>

      {/* Edit sheet */}
      <BottomSheet isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Instructor">
        <InstructorForm initial={inst} modules={modules} onSave={handleUpdate} onCancel={() => setShowEdit(false)} />
      </BottomSheet>

      {/* Delete confirmation */}
      <BottomSheet isOpen={showDelete} onClose={() => setShowDelete(false)} title="Remove instructor?">
        <div>
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 8 }}>
            Remove <strong style={{ color: 'var(--text-1)' }}>{inst.name}</strong> from the roster?
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20, lineHeight: 1.5 }}>
            Their existing slot claims will remain but they will no longer be able to sign in or claim new slots.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDelete}>Remove</button>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowDelete(false)}>Cancel</button>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
