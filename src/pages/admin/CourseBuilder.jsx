import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useApp } from '../../context/AppContext'
import BottomNav from '../../components/BottomNav'
import BottomSheet from '../../components/BottomSheet'

const COLORS = ['#7c6af7','#ec4899','#f59e0b','#22c55e','#2dd4bf','#3b82f6','#f97316','#a78bfa','#e11d48','#0ea5e9']

function DupWarning({ text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 5, fontSize: 11, color: 'var(--red)', fontFamily: 'Space Grotesk', fontWeight: 600 }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      {text}
    </div>
  )
}

function totalHours(slots, modules) {
  return slots.reduce((sum, slot) => {
    const mod = modules.find(m => m.id === slot.moduleId)
    return sum + (mod?.durationHours ?? 0)
  }, 0)
}

// ── Full-screen module picker ─────────────────────────────────────────────────
function ModulePicker({ modules, initialSelected, onDone, onCancel }) {
  const [selected, setSelected] = useState(initialSelected) // ordered string[]

  function toggle(id) {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 60,
      background: 'var(--bg)', display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'max(16px, env(safe-area-inset-top)) 16px 12px',
        borderBottom: '1px solid var(--border-dim)', flexShrink: 0,
      }}>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: '4px 6px', display: 'flex' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 17, color: 'var(--text-1)' }}>
          Choose Modules
        </span>
        <button
          className="btn btn-primary"
          onClick={() => onDone(selected)}
          style={{ padding: '6px 16px', fontSize: 13 }}
        >
          Done {selected.length > 0 && `(${selected.length})`}
        </button>
      </div>

      {/* Column labels */}
      <div style={{
        display: 'flex', padding: '8px 16px 6px', flexShrink: 0,
        borderBottom: '1px solid var(--border-dim)',
      }}>
        <div style={{ flex: 1, fontSize: 10, fontFamily: 'Space Grotesk', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-4)' }}>
          All modules
        </div>
        <div style={{ width: 130, fontSize: 10, fontFamily: 'Space Grotesk', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-4)', paddingLeft: 10, borderLeft: '1px solid var(--border-dim)' }}>
          Order
        </div>
      </div>

      {/* Two-panel body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Left — module list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {modules.length === 0 && (
            <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>
              No modules in the library yet.
            </div>
          )}
          {modules.map(mod => {
            const checked = selected.includes(mod.id)
            const order   = selected.indexOf(mod.id) + 1
            return (
              <button
                key={mod.id}
                onClick={() => toggle(mod.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 16px', background: checked ? 'var(--accent-dim)' : 'transparent',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                  borderBottom: '1px solid var(--border-dim)',
                  transition: 'background 150ms',
                }}
              >
                {/* Checkbox */}
                <div style={{
                  width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                  border: `2px solid ${checked ? 'var(--accent)' : 'var(--border-md)'}`,
                  background: checked ? 'var(--accent)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 150ms',
                }}>
                  {checked && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 13, color: checked ? 'var(--accent)' : 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {mod.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{mod.durationHours}h</div>
                </div>

                {checked && (
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 10, color: 'white',
                  }}>
                    {order}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Divider */}
        <div style={{ width: 1, background: 'var(--border-dim)', flexShrink: 0 }} />

        {/* Right — order */}
        <div style={{ width: 130, overflowY: 'auto', padding: '8px 0' }}>
          {selected.length === 0 ? (
            <div style={{ padding: '24px 12px', fontSize: 11, color: 'var(--text-4)', textAlign: 'center', lineHeight: 1.5 }}>
              Tick modules to set the order
            </div>
          ) : selected.map((id, i) => {
            const mod = modules.find(m => m.id === id)
            return (
              <div key={id} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 10px', borderBottom: '1px solid var(--border-dim)',
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 9, color: 'var(--accent)',
                }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontFamily: 'Space Grotesk', fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {mod?.name ?? id}
                  </div>
                  {mod && <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{mod.durationHours}h</div>}
                </div>
                <button
                  onClick={() => toggle(id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-4)', cursor: 'pointer', padding: 2, flexShrink: 0, fontSize: 14, lineHeight: 1 }}
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer total */}
      {selected.length > 0 && (
        <div style={{
          padding: '10px 16px', borderTop: '1px solid var(--border-dim)', flexShrink: 0,
          paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
            {selected.length} module{selected.length !== 1 ? 's' : ''} · {selected.reduce((s, id) => s + (modules.find(m => m.id === id)?.durationHours ?? 0), 0)}h total
          </span>
        </div>
      )}
    </div>
  )
}

// ── Drag-handle sortable slot row ─────────────────────────────────────────────
function SortableSlotRow({ slot, index, modules, onEdit, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: slot.id })
  const mod = modules.find(m => m.id === slot.moduleId)

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 14px',
        background: 'var(--surface-xs)', border: '1px solid var(--border-dim)',
        borderRadius: 'var(--radius-sm)',
      }}
    >
      <div {...attributes} {...listeners} style={{ cursor: 'grab', color: 'var(--text-4)', flexShrink: 0, display: 'flex', touchAction: 'none' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </div>
      <div style={{
        width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
        background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12, color: 'var(--accent)',
      }}>
        {index + 1}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 13, color: 'var(--text-1)', marginBottom: 2 }}>
          {slot.label || (mod ? mod.name : <span style={{ color: 'var(--text-4)' }}>No module</span>)}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
          {mod ? `${mod.durationHours}h` : '—'}
          {slot.label && mod ? ` · ${mod.name}` : ''}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        <button className="btn btn-ghost" onClick={() => onEdit(slot)} style={{ fontSize: 11, padding: '3px 8px', minHeight: 26 }}>Label</button>
        <button className="btn btn-ghost" onClick={() => onRemove(slot.id)} style={{ fontSize: 11, padding: '3px 8px', minHeight: 26, color: 'var(--red)' }}>×</button>
      </div>
    </div>
  )
}

// ── Label-edit form (simple override for display name) ────────────────────────
function LabelForm({ slot, modules, onSave, onCancel }) {
  const mod = modules.find(m => m.id === slot.moduleId)
  const [label, setLabel] = useState(slot.label || '')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 13, color: 'var(--text-3)' }}>
        Module: <strong style={{ color: 'var(--text-1)' }}>{mod?.name}</strong> · {mod?.durationHours}h
      </div>
      <div>
        <label style={labelStyle}>Display label (optional)</label>
        <input className="input" placeholder={mod?.name || 'Override name…'} value={label} onChange={e => setLabel(e.target.value)} autoFocus />
        <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-4)' }}>Leave blank to use the module name.</div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => onSave({ ...slot, label })}>Save</button>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

// ── Instructor group rules ────────────────────────────────────────────────────
function GroupRules({ slots, groups, onChange }) {
  const [editGroup, setEditGroup]     = useState(null)
  const [newGroupName, setNewGroupName] = useState('')

  function addGroup() {
    const name = newGroupName.trim() || `Group ${groups.length + 1}`
    onChange([...groups, { id: crypto.randomUUID(), name, dayIndexes: [] }])
    setNewGroupName('')
  }
  function removeGroup(id) { onChange(groups.filter(g => g.id !== id)) }
  function toggleSlot(groupId, idx) {
    onChange(groups.map(g => {
      if (g.id !== groupId) return g
      const has = g.dayIndexes.includes(idx)
      return { ...g, dayIndexes: has ? g.dayIndexes.filter(i => i !== idx) : [...g.dayIndexes, idx].sort((a,b)=>a-b) }
    }))
  }
  function renameGroup(id, name) { onChange(groups.map(g => g.id === id ? { ...g, name } : g)); setEditGroup(null) }

  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 12, lineHeight: 1.5 }}>
        Group modules that must be taught by the same instructor.
      </p>
      {groups.map(group => (
        <div key={group.id} style={{ marginBottom: 10, padding: '12px 14px', background: 'var(--surface-xs)', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            {editGroup === group.id ? (
              <input className="input" defaultValue={group.name} autoFocus style={{ flex: 1, marginRight: 8, fontSize: 13 }}
                onBlur={e => renameGroup(group.id, e.target.value)}
                onKeyDown={e => e.key === 'Enter' && renameGroup(group.id, e.target.value)} />
            ) : (
              <span style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 13, color: 'var(--text-1)', cursor: 'pointer' }} onClick={() => setEditGroup(group.id)}>
                {group.name}
              </span>
            )}
            <button className="btn btn-ghost" onClick={() => removeGroup(group.id)} style={{ fontSize: 11, padding: '2px 8px', minHeight: 24, color: 'var(--red)' }}>Remove</button>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {slots.map((slot, idx) => {
              const selected = group.dayIndexes.includes(idx)
              return (
                <button key={slot.id} onClick={() => toggleSlot(group.id, idx)} style={{
                  fontSize: 12, fontFamily: 'Space Grotesk', fontWeight: 600,
                  padding: '4px 10px', borderRadius: 'var(--radius-full)',
                  border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                  background: selected ? 'var(--accent-dim)' : 'transparent',
                  color: selected ? 'var(--accent)' : 'var(--text-3)', cursor: 'pointer',
                }}>
                  Slot {idx + 1}
                </button>
              )
            })}
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <input className="input" placeholder="Group name (optional)" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} style={{ flex: 1, fontSize: 13 }} />
        <button className="btn btn-ghost" onClick={addGroup} style={{ whiteSpace: 'nowrap' }}>+ Add Group</button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CourseBuilder() {
  const navigate = useNavigate()
  const { modules, courses, addCourse, updateCourse, deleteCourse } = useApp()

  const [view, setView]             = useState('list')
  const [editCourse, setEditCourse] = useState(null)

  const [name, setName]           = useState('')
  const [code, setCode]           = useState('')
  const [fullTitle, setFullTitle] = useState('')
  const [color, setColor]         = useState(COLORS[0])
  const [slots, setSlots]         = useState([])
  const [groups, setGroups]       = useState([])

  const [showPicker, setShowPicker]   = useState(false)
  const [editSlot, setEditSlot]       = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function openCreate() {
    setEditCourse(null)
    setName(''); setCode(''); setFullTitle(''); setColor(COLORS[0]); setSlots([]); setGroups([])
    setView('edit')
  }

  function openEdit(course) {
    setEditCourse(course)
    setName(course.name); setCode(course.code); setFullTitle(course.fullTitle || ''); setColor(course.color || COLORS[0])
    setSlots(course.days || []); setGroups(course.groups || [])
    setView('edit')
  }

  // Duplicate detection — exclude self when editing
  const otherCourses = (courses || []).filter(c => !editCourse || c.id !== editCourse.id)
  const dupCode  = code.trim().length > 0  && otherCourses.some(c => c.code.toUpperCase() === code.trim().toUpperCase())
  const dupName  = name.trim().length > 0  && otherCourses.some(c => c.name.toLowerCase() === name.trim().toLowerCase())
  const dupTitle = fullTitle.trim().length > 0 && otherCourses.some(c => (c.fullTitle || '').toLowerCase() === fullTitle.trim().toLowerCase())
  const hasDup   = dupCode || dupName || dupTitle

  function handleSave() {
    if (!name.trim() || !code.trim() || hasDup) return
    const payload = { name: name.trim(), code: code.trim().toUpperCase(), fullTitle: fullTitle.trim(), color, days: slots, groups }
    if (editCourse) updateCourse({ ...editCourse, ...payload })
    else addCourse({ id: crypto.randomUUID(), ...payload, createdAt: new Date().toISOString() })
    setView('list')
  }

  function handleDragEnd({ active, over }) {
    if (active.id !== over?.id) {
      setSlots(prev => {
        const from = prev.findIndex(d => d.id === active.id)
        const to   = prev.findIndex(d => d.id === over.id)
        return arrayMove(prev, from, to)
      })
    }
  }

  function handlePickerDone(selectedIds) {
    setSlots(prev => {
      const existing = Object.fromEntries(prev.map(s => [s.moduleId, s]))
      return selectedIds.map(id => existing[id] ?? { id: crypto.randomUUID(), moduleId: id, label: '' })
    })
    setShowPicker(false)
  }

  function handleEditSlot(slotData) {
    setSlots(prev => prev.map(d => d.id === slotData.id ? slotData : d))
    setEditSlot(null)
  }

  function removeSlot(id) { setSlots(prev => prev.filter(d => d.id !== id)) }

  const hrs = totalHours(slots, modules || [])

  // ── List view ───────────────────────────────────────────────────────────────
  if (view === 'list') {
    return (
      <div className="admin-bg">
        <div className="z1 page">
          <div className="safe-top" style={{ padding: '0 16px', paddingTop: 'max(16px, env(safe-area-inset-top))' }}>
            <div style={{ paddingTop: 8, paddingBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button onClick={() => navigate('/admin')} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: '4px 6px', display: 'flex' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 22, color: 'var(--text-1)', margin: 0 }}>Courses</h1>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 12, lineHeight: 1.4 }}>
                {(courses || []).length === 0 ? 'No courses yet.' : `${(courses || []).length} course${(courses || []).length !== 1 ? 's' : ''} defined`}
              </p>
              <button className="btn btn-primary" onClick={openCreate}>+ New Course</button>
            </div>
          </div>

          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 100 }}>
            {(courses || []).length === 0 && (
              <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 15, color: 'var(--text-2)', marginBottom: 16 }}>No courses yet.</div>
                <button className="btn btn-primary" onClick={openCreate} style={{ margin: '0 auto' }}>Create your first course</button>
              </div>
            )}
            {(courses || []).map(course => {
              const h = totalHours(course.days || [], modules || [])
              return (
                <div key={course.id} className="card" style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 4, height: 40, borderRadius: 2, background: course.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 15, color: 'var(--text-1)', marginBottom: 2 }}>
                        {course.code}: {course.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                        {(course.days || []).length} module{(course.days || []).length !== 1 ? 's' : ''}
                        {h > 0 && ` · ${h}h total`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button className="btn btn-ghost" onClick={() => openEdit(course)} style={{ fontSize: 12, padding: '4px 10px', minHeight: 30 }}>Edit</button>
                      <button className="btn btn-ghost" onClick={() => setConfirmDelete(course)} style={{ fontSize: 12, padding: '4px 10px', minHeight: 30, color: 'var(--red)' }}>Delete</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <BottomSheet isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete course?">
          {confirmDelete && (
            <div>
              <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 8 }}>
                Delete <strong style={{ color: 'var(--text-1)' }}>{confirmDelete.code}: {confirmDelete.name}</strong>?
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20, lineHeight: 1.5 }}>
                Cohorts using this course will need to be updated.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => { deleteCourse(confirmDelete.id); setConfirmDelete(null) }}>Delete</button>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setConfirmDelete(null)}>Cancel</button>
              </div>
            </div>
          )}
        </BottomSheet>

        <BottomNav role="admin" />
      </div>
    )
  }

  // ── Edit view ───────────────────────────────────────────────────────────────
  return (
    <>
      <div className="admin-bg">
        <div className="z1 page">
          <div className="safe-top" style={{ padding: '0 16px', paddingTop: 'max(16px, env(safe-area-inset-top))' }}>
            <div style={{ paddingTop: 8, paddingBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button onClick={() => setView('list')} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: '4px 6px', display: 'flex' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 20, color: 'var(--text-1)', margin: 0 }}>
                    {editCourse ? 'Edit Course' : 'New Course'}
                  </h1>
                </div>
                <button className="btn btn-primary" onClick={handleSave} disabled={!name.trim() || !code.trim() || hasDup} style={{ padding: '6px 16px' }}>
                  Save
                </button>
              </div>
            </div>
          </div>

          <div style={{ padding: '0 16px', paddingBottom: 100, display: 'flex', flexDirection: 'column', gap: 24 }}>

            <section>
              <div style={sectionHeader}>Course Info</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ width: 80 }}>
                    <label style={labelStyle}>Code</label>
                    <input
                      className="input"
                      placeholder="C7"
                      value={code}
                      onChange={e => setCode(e.target.value)}
                      style={{ textTransform: 'uppercase', borderColor: dupCode ? 'var(--red)' : undefined }}
                    />
                    {dupCode && <DupWarning text="Code already exists" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Short name</label>
                    <input
                      className="input"
                      placeholder="e.g. AI Basics"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      style={{ borderColor: dupName ? 'var(--red)' : undefined }}
                    />
                    {dupName && <DupWarning text="Name already exists" />}
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Full title (optional)</label>
                  <input
                    className="input"
                    placeholder="e.g. Build Your AI Foundation"
                    value={fullTitle}
                    onChange={e => setFullTitle(e.target.value)}
                    style={{ borderColor: dupTitle ? 'var(--red)' : undefined }}
                  />
                  {dupTitle && <DupWarning text="A course with this title already exists" />}
                </div>
                <div>
                  <label style={labelStyle}>Course colour</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {COLORS.map(c => (
                      <button key={c} onClick={() => setColor(c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer', outline: color === c ? `3px solid ${c}` : 'none', outlineOffset: 2 }} />
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section>
              <div style={{ ...sectionHeader, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>
                  Module Sequence
                  {hrs > 0 && <span style={{ fontWeight: 400, color: 'var(--text-4)', marginLeft: 8 }}>{hrs}h total</span>}
                </span>
                <button
                  className="btn btn-ghost"
                  onClick={() => setShowPicker(true)}
                  style={{ fontSize: 12, padding: '4px 10px', minHeight: 28 }}
                >
                  {slots.length === 0 ? '+ Choose Modules' : 'Edit Selection'}
                </button>
              </div>

              {slots.length === 0 && (
                <div className="card" style={{ padding: '24px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 12 }}>
                    {(modules || []).length === 0
                      ? 'Create modules in the Module Library first.'
                      : 'No modules added yet. Tap "Choose Modules" to build the sequence.'}
                  </div>
                  {(modules || []).length > 0 && (
                    <button className="btn btn-primary" onClick={() => setShowPicker(true)} style={{ margin: '0 auto', fontSize: 13 }}>
                      Choose Modules
                    </button>
                  )}
                </div>
              )}

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={slots.map(d => d.id)} strategy={verticalListSortingStrategy}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {slots.map((slot, idx) => (
                      <SortableSlotRow
                        key={slot.id}
                        slot={slot}
                        index={idx}
                        modules={modules || []}
                        onEdit={setEditSlot}
                        onRemove={removeSlot}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {slots.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-4)', textAlign: 'center' }}>
                  Drag to reorder · tap Label to override display name
                </div>
              )}
            </section>

            {slots.length >= 2 && (
              <section>
                <div style={sectionHeader}>Instructor Groups</div>
                <GroupRules slots={slots} groups={groups} onChange={setGroups} />
              </section>
            )}

          </div>
        </div>

        <BottomSheet isOpen={!!editSlot} onClose={() => setEditSlot(null)} title="Edit Label">
          {editSlot && <LabelForm slot={editSlot} modules={modules || []} onSave={handleEditSlot} onCancel={() => setEditSlot(null)} />}
        </BottomSheet>

        <BottomNav role="admin" />
      </div>

      {showPicker && (
        <ModulePicker
          modules={modules || []}
          initialSelected={slots.map(s => s.moduleId).filter(Boolean)}
          onDone={handlePickerDone}
          onCancel={() => setShowPicker(false)}
        />
      )}
    </>
  )
}

const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-3)',
  marginBottom: 8, fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.08em',
}
const sectionHeader = {
  fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13,
  textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)',
  marginBottom: 12,
}
