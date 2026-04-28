import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import BottomNav from '../../components/BottomNav'
import BottomSheet from '../../components/BottomSheet'

// ── Add / Edit instructor form ────────────────────────────────────────────────
function InstructorForm({ initial, modules, onSave, onCancel }) {
  const [name, setName]   = useState(initial?.name || '')
  const [email, setEmail] = useState(initial?.email || '')
  const [eligible, setEligible] = useState(initial?.eligibleModules || [])

  function toggleModule(id) {
    setEligible(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function handleSave() {
    if (name.trim().length < 2) return
    onSave({ name: name.trim(), email: email.trim(), eligibleModules: eligible })
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
        <label style={labelStyle}>Eligible modules</label>
        {(modules || []).length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-4)', fontStyle: 'italic' }}>
            No modules in the library yet. Add modules first.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {modules.map(m => {
              const on = eligible.includes(m.id)
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleModule(m.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${on ? 'var(--accent)' : 'var(--border-dim)'}`,
                    background: on ? 'var(--accent-dim)' : 'var(--surface-xs)',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  {/* Checkbox visual */}
                  <div style={{
                    width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                    border: `2px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
                    background: on ? 'var(--accent)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {on && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 13, color: on ? 'var(--accent)' : 'var(--text-1)' }}>
                      {m.name}
                    </div>
                    {m.description && (
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{m.description}</div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={name.trim().length < 2}>
          {initial ? 'Save Changes' : 'Add Instructor'}
        </button>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function InstructorRoster() {
  const { instructors, modules, claims, addInstructor, updateInstructor, deleteInstructor } = useApp()
  const [showCreate, setShowCreate]       = useState(false)
  const [editing, setEditing]             = useState(null)
  const [expanded, setExpanded]           = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [search, setSearch]               = useState('')

  const instructorList = instructors || []
  const moduleList     = modules || []

  const filtered = instructorList.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    (i.email || '').toLowerCase().includes(search.toLowerCase())
  )

  function handleCreate(data) {
    addInstructor({ id: crypto.randomUUID(), ...data, createdAt: new Date().toISOString() })
    setShowCreate(false)
  }

  function handleUpdate(data) {
    updateInstructor({ ...editing, ...data })
    setEditing(null)
  }

  function handleDelete() {
    if (confirmDelete) deleteInstructor(confirmDelete.id)
    setConfirmDelete(null)
  }

  return (
    <div className="admin-bg">
      <div className="z1 page">
        <div className="safe-top" style={{ padding: '0 16px', paddingTop: 'max(16px, env(safe-area-inset-top))' }}>
          <div style={{ paddingTop: 8, paddingBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 22, color: 'var(--text-1)', margin: 0 }}>
                Instructor Roster
              </h1>
              
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 12, lineHeight: 1.4 }}>
              {instructorList.length === 0
                ? 'No instructors added yet. Add instructors and set their eligible modules.'
                : `${instructorList.length} instructor${instructorList.length !== 1 ? 's' : ''} registered`}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input"
                placeholder="Search instructors..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ flex: 1, fontSize: 13 }}
              />
              <button className="btn btn-primary" onClick={() => setShowCreate(true)} style={{ whiteSpace: 'nowrap' }}>
                + Add
              </button>
            </div>
          </div>
        </div>

        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 100 }}>
          {filtered.length === 0 && (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 15, color: 'var(--text-2)', marginBottom: 6 }}>
                {search ? 'No instructors match your search.' : 'No instructors yet.'}
              </div>
              {!search && (
                <button className="btn btn-primary" onClick={() => setShowCreate(true)} style={{ margin: '16px auto 0' }}>
                  Add first instructor
                </button>
              )}
            </div>
          )}

          {filtered.map(inst => {
            const instClaims  = claims.filter(cl => cl.instructorId === inst.id)
            const eligMods    = (inst.eligibleModules || []).map(id => moduleList.find(m => m.id === id)).filter(Boolean)
            const isExpanded  = expanded === inst.id

            return (
              <div key={inst.id}>
                <button
                  className="card card-hover"
                  onClick={() => setExpanded(isExpanded ? null : inst.id)}
                  style={{ width: '100%', padding: '14px 16px', textAlign: 'left', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Avatar */}
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 16, color: 'var(--accent)',
                      flexShrink: 0,
                    }}>
                      {inst.name[0].toUpperCase()}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 15, color: 'var(--text-1)', marginBottom: 2 }}>
                        {inst.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                        {eligMods.length === 0 ? 'No modules assigned' : `${eligMods.length} eligible module${eligMods.length !== 1 ? 's' : ''}`}
                        {instClaims.length > 0 && ` · ${instClaims.length} slot${instClaims.length !== 1 ? 's' : ''} claimed`}
                      </div>
                    </div>

                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round"
                      style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>

                  {/* Module chips */}
                  {eligMods.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                      {eligMods.map(m => (
                        <span key={m.id} style={{
                          fontSize: 11, fontFamily: 'Space Grotesk', fontWeight: 600,
                          padding: '2px 8px', borderRadius: 'var(--radius-full)',
                          color: 'var(--accent)', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
                        }}>
                          {m.name}
                        </span>
                      ))}
                    </div>
                  )}
                </button>

                {/* Expanded actions */}
                {isExpanded && (
                  <div className="anim-slide-up" style={{ marginTop: 2, padding: '10px 14px 10px 20px', background: 'var(--surface-xs)', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius-sm)', display: 'flex', gap: 8 }}>
                    {inst.email && (
                      <span style={{ fontSize: 12, color: 'var(--text-3)', flex: 1, alignSelf: 'center' }}>{inst.email}</span>
                    )}
                    <button className="btn btn-ghost" onClick={() => setEditing(inst)} style={{ fontSize: 12, padding: '4px 12px', minHeight: 30 }}>Edit</button>
                    <button className="btn btn-ghost" onClick={() => setConfirmDelete(inst)} style={{ fontSize: 12, padding: '4px 12px', minHeight: 30, color: 'var(--red)' }}>Remove</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Create sheet */}
      <BottomSheet isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add Instructor">
        <InstructorForm modules={moduleList} onSave={handleCreate} onCancel={() => setShowCreate(false)} />
      </BottomSheet>

      {/* Edit sheet */}
      <BottomSheet isOpen={!!editing} onClose={() => setEditing(null)} title="Edit Instructor">
        {editing && <InstructorForm initial={editing} modules={moduleList} onSave={handleUpdate} onCancel={() => setEditing(null)} />}
      </BottomSheet>

      {/* Delete confirmation */}
      <BottomSheet isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Remove instructor?">
        {confirmDelete && (
          <div>
            <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 8 }}>
              Remove <strong style={{ color: 'var(--text-1)' }}>{confirmDelete.name}</strong> from the roster?
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20, lineHeight: 1.5 }}>
              Their existing slot claims will remain but they will no longer be able to sign in or claim new slots.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDelete}>Remove</button>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setConfirmDelete(null)}>Cancel</button>
            </div>
          </div>
        )}
      </BottomSheet>

      <BottomNav role="admin" />
    </div>
  )
}

const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-3)',
  marginBottom: 8, fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.08em',
}
