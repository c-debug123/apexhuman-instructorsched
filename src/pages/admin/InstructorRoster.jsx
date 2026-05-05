import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import BottomNav from '../../components/BottomNav'
import BottomSheet from '../../components/BottomSheet'
import SwipeableRow from '../../components/SwipeableRow'
import SearchInput from '../../components/SearchInput'

const SORT_OPTIONS = [
  { value: 'name-asc',     label: 'Name A → Z' },
  { value: 'name-desc',    label: 'Name Z → A' },
  { value: 'modules-desc', label: 'Most modules' },
  { value: 'claims-desc',  label: 'Most slots claimed' },
]

function EditIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}
function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  )
}
function SortIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="9" y1="18" x2="15" y2="18"/>
    </svg>
  )
}

function InstructorForm({ initial, instructors, modules, onSave, onCancel }) {
  const [name, setName]     = useState(initial?.name || '')
  const [email, setEmail]   = useState(initial?.email || '')
  const [phone, setPhone]   = useState(initial?.phone || '')
  const [eligible, setElig] = useState(initial?.eligibleGroups || [])

  const allGroups   = [...new Set((modules || []).flatMap(m => m.tags || []))].sort()
  const phoneDigits = phone.replace(/\D/g, '')
  const others      = (instructors || []).filter(i => i.id !== initial?.id)
  const nameTaken   = others.some(i => i.name.trim().toLowerCase() === name.trim().toLowerCase())
  const emailTaken  = email.trim().includes('@') && others.some(i => i.email?.toLowerCase() === email.trim().toLowerCase())

  const blockReason = name.trim().length < 2       ? 'Enter a full name (at least 2 characters)'
                    : nameTaken                     ? 'An instructor with this name already exists'
                    : !email.trim().includes('@')   ? 'Enter a valid Gmail address'
                    : emailTaken                    ? 'This email is already registered to another instructor'
                    : phoneDigits.length < 6        ? 'Enter a valid mobile number'
                    : (allGroups.length > 0 && eligible.length === 0) ? 'Select at least one module group'
                    : null
  const canSave = !blockReason

  function toggleGroup(g) {
    setElig(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])
  }
  function handleSave() {
    if (!canSave) return
    onSave({ name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim(), eligibleGroups: eligible })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={labelStyle}>Full name</label>
        <input className="input" placeholder="Instructor name" value={name} onChange={e => setName(e.target.value)} autoFocus />
      </div>
      <div>
        <label style={labelStyle}>
          Gmail
          <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Required for sign-in</span>
        </label>
        <input className="input" type="email" placeholder="instructor@gmail.com" value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <div>
        <label style={labelStyle}>Mobile number</label>
        <input className="input" type="tel" placeholder="+65 9123 4567" value={phone} onChange={e => setPhone(e.target.value)} />
      </div>
      <div>
        <label style={labelStyle}>
          Module groups
          {allGroups.length > 0 && (
            <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600, color: eligible.length > 0 ? 'var(--teal)' : 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {eligible.length > 0 ? `${eligible.length} selected` : 'Select at least one'}
            </span>
          )}
        </label>
        <p style={{ fontSize: 12, color: 'var(--text-4)', marginBottom: 10, lineHeight: 1.5 }}>
          This instructor can teach any module belonging to the selected groups.
        </p>
        {allGroups.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-4)', fontStyle: 'italic' }}>No module groups yet — add tags to modules first.</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {allGroups.map(g => {
              const on = eligible.includes(g)
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
                  <span style={{ fontSize: 11, color: on ? 'var(--accent)' : 'var(--text-4)' }}>
                    {(modules || []).filter(m => (m.tags || []).includes(g)).length}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={!canSave}>
          {initial ? 'Save Changes' : 'Add Instructor'}
        </button>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onCancel}>Cancel</button>
      </div>
      {blockReason && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span style={{ fontSize: 12, color: 'var(--text-4)' }}>{blockReason}</span>
        </div>
      )}
    </div>
  )
}

export default function InstructorRoster() {
  const { instructors, modules, claims, addInstructor, updateInstructor, deleteInstructor } = useApp()

  const navigate = useNavigate()

  const [showCreate, setShowCreate]       = useState(false)
  const [editing, setEditing]             = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [search, setSearch]               = useState('')
  const [sortBy, setSortBy]               = useState('name-asc')
  const [showSort, setShowSort]           = useState(false)
  const [selectMode, setSelectMode]       = useState(false)
  const [selected, setSelected]           = useState(new Set())
  const [showBulkDelete, setShowBulkDelete] = useState(false)

  const instructorList = instructors || []
  const moduleList     = modules || []
  const claimList      = claims || []

  function applySort(list) {
    return [...list].sort((a, b) => {
      if (sortBy === 'name-asc')     return a.name.localeCompare(b.name)
      if (sortBy === 'name-desc')    return b.name.localeCompare(a.name)
      if (sortBy === 'modules-desc') return (b.eligibleGroups?.length || 0) - (a.eligibleGroups?.length || 0)
      if (sortBy === 'claims-desc')  return claimList.filter(cl => cl.instructorId === b.id).length - claimList.filter(cl => cl.instructorId === a.id).length
      return 0
    })
  }

  const filtered = applySort(
    instructorList.filter(i =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      (i.email || '').toLowerCase().includes(search.toLowerCase())
    )
  )

  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function exitSelect() { setSelectMode(false); setSelected(new Set()) }

  function handleCreate(data) {
    addInstructor({ id: crypto.randomUUID(), ...data, createdAt: new Date().toISOString() })
    setShowCreate(false)
  }
  function handleUpdate(data) { updateInstructor({ ...editing, ...data }); setEditing(null) }
  function handleDelete() { if (confirmDelete) deleteInstructor(confirmDelete.id); setConfirmDelete(null) }

  async function handleBulkDelete() {
    await Promise.all([...selected].map(id => deleteInstructor(id)))
    exitSelect()
    setShowBulkDelete(false)
  }

  const sortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label || 'Sort'

  return (
    <div className="admin-bg">
      <div className="z1 page">
        <div className="safe-top" style={{ padding: '0 16px', paddingTop: 'max(16px, env(safe-area-inset-top))' }}>
          <div style={{ paddingTop: 8, paddingBottom: 16 }}>

            {/* Header */}
            {selectMode ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, minHeight: 36 }}>
                <button onClick={exitSelect} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 14, padding: '4px 0' }}>
                  Cancel
                </button>
                <span style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 14, color: 'var(--text-2)' }}>
                  {selected.size} selected
                </span>
                <button
                  onClick={() => selected.size > 0 && setShowBulkDelete(true)}
                  disabled={selected.size === 0}
                  style={{ background: 'none', border: 'none', cursor: selected.size > 0 ? 'pointer' : 'default', fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 14, color: selected.size > 0 ? 'var(--red)' : 'var(--text-4)', padding: '4px 0', opacity: selected.size > 0 ? 1 : 0.4 }}
                >
                  Delete {selected.size > 0 ? `(${selected.size})` : ''}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 22, color: 'var(--text-1)', margin: 0 }}>
                  Instructor Roster
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => setShowSort(true)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--surface-xs)', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius-full)', padding: '4px 10px', color: 'var(--text-3)', cursor: 'pointer', fontSize: 12, fontFamily: 'Space Grotesk', fontWeight: 600 }}>
                    <SortIcon /> Sort
                  </button>
                  {instructorList.length > 0 && (
                    <button onClick={() => setSelectMode(true)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 13, padding: '4px 0' }}>
                      Select
                    </button>
                  )}
                </div>
              </div>
            )}

            {!selectMode && (
              <>
                <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 12, lineHeight: 1.4 }}>
                  {instructorList.length === 0
                    ? 'No instructors added yet. Add instructors and set their eligible modules.'
                    : `${instructorList.length} instructor${instructorList.length !== 1 ? 's' : ''} registered`}
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <SearchInput placeholder="Search instructors..." value={search} onChange={setSearch} />
                  <button className="btn btn-primary" onClick={() => setShowCreate(true)} style={{ whiteSpace: 'nowrap' }}>+ Add</button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sort label */}
        {sortBy !== 'name-asc' && !selectMode && (
          <div style={{ padding: '0 16px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'Space Grotesk' }}>Sorted by:</span>
            <span style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'Space Grotesk', fontWeight: 600 }}>{sortLabel}</span>
            <button onClick={() => setSortBy('name-asc')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', fontSize: 13, padding: '0 2px', lineHeight: 1 }}>×</button>
          </div>
        )}

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
            const eligGroups  = inst.eligibleGroups || []
            const claimCount  = claimList.filter(cl => cl.instructorId === inst.id).length
            const isSelected = selected.has(inst.id)

            return (
              <div key={inst.id}>
                <SwipeableRow
                  disabled={selectMode}
                  leftAction={{
                    label: 'EDIT',
                    icon: <EditIcon />,
                    color: 'var(--accent)',
                    bg: 'rgba(124,106,247,0.18)',
                    onClick: () => setEditing(inst),
                  }}
                  rightAction={{
                    label: 'REMOVE',
                    icon: <TrashIcon />,
                    color: 'var(--red)',
                    bg: 'rgba(239,68,68,0.18)',
                    onClick: () => setConfirmDelete(inst),
                  }}
                >
                  <button
                    className="card card-hover"
                    onClick={() => selectMode ? toggleSelect(inst.id) : navigate(`/admin/roster/${inst.id}`)}
                    style={{ width: '100%', padding: '14px 16px', textAlign: 'left', cursor: 'pointer', background: isSelected ? 'rgba(124,106,247,0.08)' : undefined, border: isSelected ? '1px solid var(--accent-border)' : undefined }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {selectMode ? (
                        <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`, background: isSelected ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {isSelected && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 16, color: 'var(--accent)', flexShrink: 0 }}>
                          {inst.name[0].toUpperCase()}
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 15, color: 'var(--text-1)', marginBottom: 2 }}>
                          {inst.name}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                          {eligGroups.length === 0 ? 'No groups assigned' : `${eligGroups.length} group${eligGroups.length !== 1 ? 's' : ''}`}
                          {claimCount > 0 && ` · ${claimCount} slot${claimCount !== 1 ? 's' : ''} claimed`}
                        </div>
                      </div>
                      {!selectMode && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      )}
                    </div>

                  </button>
                </SwipeableRow>

              </div>
            )
          })}
        </div>
      </div>

      {/* Sort sheet */}
      <BottomSheet isOpen={showSort} onClose={() => setShowSort(false)} title="Sort instructors">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {SORT_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => { setSortBy(opt.value); setShowSort(false) }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: sortBy === opt.value ? 'var(--accent-dim)' : 'transparent', border: `1px solid ${sortBy === opt.value ? 'var(--accent-border)' : 'transparent'}`, cursor: 'pointer', textAlign: 'left' }}>
              <span style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 14, color: sortBy === opt.value ? 'var(--accent)' : 'var(--text-1)' }}>{opt.label}</span>
              {sortBy === opt.value && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
            </button>
          ))}
        </div>
      </BottomSheet>

      <BottomSheet isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add Instructor">
        <InstructorForm instructors={instructorList} modules={moduleList} onSave={handleCreate} onCancel={() => setShowCreate(false)} />
      </BottomSheet>

      <BottomSheet isOpen={!!editing} onClose={() => setEditing(null)} title="Edit Instructor">
        {editing && <InstructorForm initial={editing} instructors={instructorList} modules={moduleList} onSave={handleUpdate} onCancel={() => setEditing(null)} />}
      </BottomSheet>

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

      <BottomSheet isOpen={showBulkDelete} onClose={() => setShowBulkDelete(false)} title={`Remove ${selected.size} instructor${selected.size !== 1 ? 's' : ''}?`}>
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20, lineHeight: 1.5 }}>
            Their existing slot claims will remain but they will no longer be able to sign in. This cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleBulkDelete}>Remove {selected.size}</button>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowBulkDelete(false)}>Cancel</button>
          </div>
        </div>
      </BottomSheet>

      <BottomNav role="admin" />
    </div>
  )
}

const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-3)',
  marginBottom: 8, fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.08em',
}
