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
import RoleSwitcher from '../../components/RoleSwitcher'

const COLORS = ['#7c6af7','#ec4899','#f59e0b','#22c55e','#2dd4bf','#3b82f6','#f97316','#a78bfa','#e11d48','#0ea5e9']

// ── Drag-handle sortable day row ──────────────────────────────────────────────
function SortableDayRow({ day, index, modules, onEdit, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: day.id })
  const mod = modules.find(m => m.id === day.moduleId)

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
      {/* Drag handle */}
      <div {...attributes} {...listeners} style={{ cursor: 'grab', color: 'var(--text-4)', flexShrink: 0, display: 'flex', touchAction: 'none' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </div>

      {/* Day number badge */}
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
          {mod ? mod.name : <span style={{ color: 'var(--text-4)' }}>No module selected</span>}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
          {day.startTime} · {day.hoursPerDay}h
          {day.label && <> · {day.label}</>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        <button className="btn btn-ghost" onClick={() => onEdit(day)} style={{ fontSize: 11, padding: '3px 8px', minHeight: 26 }}>Edit</button>
        <button className="btn btn-ghost" onClick={() => onRemove(day.id)} style={{ fontSize: 11, padding: '3px 8px', minHeight: 26, color: 'var(--red)' }}>×</button>
      </div>
    </div>
  )
}

// ── Day edit form ─────────────────────────────────────────────────────────────
function DayForm({ day, modules, onSave, onCancel }) {
  const [moduleId, setModuleId]     = useState(day?.moduleId || '')
  const [label, setLabel]           = useState(day?.label || '')
  const [startTime, setStartTime]   = useState(day?.startTime || '09:00')
  const [hoursPerDay, setHoursPerDay] = useState(day?.hoursPerDay || 8)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={labelStyle}>Module</label>
        <select className="input" value={moduleId} onChange={e => setModuleId(e.target.value)}>
          <option value="">— select a module —</option>
          {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>
      <div>
        <label style={labelStyle}>Day label (optional override)</label>
        <input className="input" placeholder="e.g. Build Day 1" value={label} onChange={e => setLabel(e.target.value)} />
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Start time</label>
          <input className="input" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Hours per day</label>
          <input className="input" type="number" min={1} max={12} step={0.5} value={hoursPerDay} onChange={e => setHoursPerDay(parseFloat(e.target.value))} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => onSave({ ...day, moduleId, label, startTime, hoursPerDay })}>
          Save Day
        </button>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

// ── Instructor group rules ────────────────────────────────────────────────────
function GroupRules({ days, groups, onChange }) {
  const [editGroup, setEditGroup] = useState(null)
  const [newGroupName, setNewGroupName] = useState('')

  function addGroup() {
    const name = newGroupName.trim() || `Group ${groups.length + 1}`
    onChange([...groups, { id: crypto.randomUUID(), name, dayIndexes: [] }])
    setNewGroupName('')
  }

  function removeGroup(id) {
    onChange(groups.filter(g => g.id !== id))
  }

  function toggleDayInGroup(groupId, dayIndex) {
    onChange(groups.map(g => {
      if (g.id !== groupId) return g
      const has = g.dayIndexes.includes(dayIndex)
      return { ...g, dayIndexes: has ? g.dayIndexes.filter(i => i !== dayIndex) : [...g.dayIndexes, dayIndex].sort((a,b)=>a-b) }
    }))
  }

  function renameGroup(id, name) {
    onChange(groups.map(g => g.id === id ? { ...g, name } : g))
    setEditGroup(null)
  }

  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 12, lineHeight: 1.5 }}>
        Group days that must be taught by the same instructor. E.g. if Days 1 and 2 cover the same topic, put them in one group.
      </p>

      {groups.map(group => (
        <div key={group.id} style={{ marginBottom: 10, padding: '12px 14px', background: 'var(--surface-xs)', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            {editGroup === group.id ? (
              <input
                className="input"
                defaultValue={group.name}
                autoFocus
                style={{ flex: 1, marginRight: 8, fontSize: 13 }}
                onBlur={e => renameGroup(group.id, e.target.value)}
                onKeyDown={e => e.key === 'Enter' && renameGroup(group.id, e.target.value)}
              />
            ) : (
              <span
                style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 13, color: 'var(--text-1)', cursor: 'pointer' }}
                onClick={() => setEditGroup(group.id)}
              >
                {group.name}
              </span>
            )}
            <button className="btn btn-ghost" onClick={() => removeGroup(group.id)} style={{ fontSize: 11, padding: '2px 8px', minHeight: 24, color: 'var(--red)' }}>Remove</button>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {days.map((day, idx) => {
              const selected = group.dayIndexes.includes(idx)
              return (
                <button
                  key={day.id}
                  onClick={() => toggleDayInGroup(group.id, idx)}
                  style={{
                    fontSize: 12, fontFamily: 'Space Grotesk', fontWeight: 600,
                    padding: '4px 10px', borderRadius: 'var(--radius-full)',
                    border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                    background: selected ? 'var(--accent-dim)' : 'transparent',
                    color: selected ? 'var(--accent)' : 'var(--text-3)',
                    cursor: 'pointer',
                  }}
                >
                  Day {idx + 1}
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

  const [view, setView]         = useState('list')  // 'list' | 'edit'
  const [editCourse, setEditCourse] = useState(null)

  // Course form fields
  const [name, setName]         = useState('')
  const [code, setCode]         = useState('')
  const [fullTitle, setFullTitle] = useState('')
  const [color, setColor]       = useState(COLORS[0])
  const [days, setDays]         = useState([])
  const [groups, setGroups]     = useState([])
  const [editDay, setEditDay]   = useState(null)
  const [showAddDay, setShowAddDay] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function openCreate() {
    setEditCourse(null)
    setName(''); setCode(''); setFullTitle(''); setColor(COLORS[0]); setDays([]); setGroups([])
    setView('edit')
  }

  function openEdit(course) {
    setEditCourse(course)
    setName(course.name); setCode(course.code); setFullTitle(course.fullTitle || ''); setColor(course.color || COLORS[0])
    setDays(course.days || []); setGroups(course.groups || [])
    setView('edit')
  }

  function handleSave() {
    if (!name.trim() || !code.trim()) return
    const payload = { name: name.trim(), code: code.trim().toUpperCase(), fullTitle: fullTitle.trim(), color, days, groups }
    if (editCourse) {
      updateCourse({ ...editCourse, ...payload })
    } else {
      addCourse({ id: crypto.randomUUID(), ...payload, createdAt: new Date().toISOString() })
    }
    setView('list')
  }

  function handleDragEnd(event) {
    const { active, over } = event
    if (active.id !== over?.id) {
      setDays(prev => {
        const oldIdx = prev.findIndex(d => d.id === active.id)
        const newIdx = prev.findIndex(d => d.id === over.id)
        return arrayMove(prev, oldIdx, newIdx)
      })
    }
  }

  function handleAddDay(dayData) {
    setDays(prev => [...prev, { id: crypto.randomUUID(), ...dayData }])
    setShowAddDay(false)
  }

  function handleEditDay(dayData) {
    setDays(prev => prev.map(d => d.id === dayData.id ? dayData : d))
    setEditDay(null)
  }

  function removeDay(id) {
    setDays(prev => prev.filter(d => d.id !== id))
  }

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
                <RoleSwitcher role="admin" />
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
            {(courses || []).map(course => (
              <div key={course.id} className="card" style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 4, height: 40, borderRadius: 2, background: course.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 15, color: 'var(--text-1)', marginBottom: 2 }}>
                      {course.code}: {course.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                      {(course.days || []).length} day{(course.days || []).length !== 1 ? 's' : ''}
                      {(course.groups || []).length > 0 && ` · ${course.groups.length} instructor group${course.groups.length !== 1 ? 's' : ''}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button className="btn btn-ghost" onClick={() => openEdit(course)} style={{ fontSize: 12, padding: '4px 10px', minHeight: 30 }}>Edit</button>
                    <button className="btn btn-ghost" onClick={() => setConfirmDelete(course)} style={{ fontSize: 12, padding: '4px 10px', minHeight: 30, color: 'var(--red)' }}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <BottomSheet isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete course?">
          {confirmDelete && (
            <div>
              <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 8 }}>
                Delete <strong style={{ color: 'var(--text-1)' }}>{confirmDelete.code}: {confirmDelete.name}</strong>?
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20, lineHeight: 1.5 }}>
                Cohorts that use this course will need to be updated. Existing claims will not be deleted.
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
              <button className="btn btn-primary" onClick={handleSave} disabled={!name.trim() || !code.trim()} style={{ padding: '6px 16px' }}>
                Save
              </button>
            </div>
          </div>
        </div>

        <div style={{ padding: '0 16px', paddingBottom: 100, display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Basic info */}
          <section>
            <div style={sectionHeader}>Course Info</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 80 }}>
                  <label style={labelStyle}>Code</label>
                  <input className="input" placeholder="C7" value={code} onChange={e => setCode(e.target.value)} style={{ textTransform: 'uppercase' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Short name</label>
                  <input className="input" placeholder="e.g. AI Basics" value={name} onChange={e => setName(e.target.value)} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Full title (optional)</label>
                <input className="input" placeholder="e.g. Build Your AI Foundation in 5 Days" value={fullTitle} onChange={e => setFullTitle(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Course colour</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      style={{
                        width: 28, height: 28, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
                        outline: color === c ? `3px solid ${c}` : 'none',
                        outlineOffset: 2,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Day structure */}
          <section>
            <div style={{ ...sectionHeader, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Day Structure</span>
              <button className="btn btn-ghost" onClick={() => setShowAddDay(true)} style={{ fontSize: 12, padding: '4px 10px', minHeight: 28 }}>+ Add Day</button>
            </div>
            {days.length === 0 && (
              <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 8 }}>
                No days yet. Add days to define the course schedule.
              </p>
            )}
            {modules.length === 0 && days.length === 0 && (
              <p style={{ fontSize: 12, color: 'var(--amber)', marginBottom: 8 }}>
                No modules in the library yet — create modules first so you can assign them to days.
              </p>
            )}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={days.map(d => d.id)} strategy={verticalListSortingStrategy}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {days.map((day, idx) => (
                    <SortableDayRow
                      key={day.id}
                      day={day}
                      index={idx}
                      modules={modules || []}
                      onEdit={setEditDay}
                      onRemove={removeDay}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </section>

          {/* Instructor groups */}
          {days.length >= 2 && (
            <section>
              <div style={sectionHeader}>Instructor Groups</div>
              <GroupRules days={days} groups={groups} onChange={setGroups} />
            </section>
          )}

        </div>
      </div>

      {/* Add day sheet */}
      <BottomSheet isOpen={showAddDay} onClose={() => setShowAddDay(false)} title="Add Day">
        <DayForm modules={modules || []} onSave={handleAddDay} onCancel={() => setShowAddDay(false)} />
      </BottomSheet>

      {/* Edit day sheet */}
      <BottomSheet isOpen={!!editDay} onClose={() => setEditDay(null)} title="Edit Day">
        {editDay && <DayForm day={editDay} modules={modules || []} onSave={handleEditDay} onCancel={() => setEditDay(null)} />}
      </BottomSheet>

      <BottomNav role="admin" />
    </div>
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
