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
import SwipeableRow from '../../components/SwipeableRow'
import SearchInput from '../../components/SearchInput'

const COLORS = ['#7c6af7','#ec4899','#f59e0b','#22c55e','#2dd4bf','#3b82f6','#f97316','#a78bfa','#e11d48','#0ea5e9']

function EditIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
}
function TrashIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
}

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
      <button className="btn btn-ghost" onClick={() => onRemove(slot.id)} style={{ fontSize: 14, padding: '3px 8px', minHeight: 26, color: 'var(--text-4)', flexShrink: 0 }}>×</button>
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
const BUNDLE_COLORS = ['#2dd4bf', '#f59e0b', '#ec4899', '#22c55e', '#3b82f6', '#f97316']

function GroupRules({ slots, groups, onChange }) {
  const [editGroup, setEditGroup]     = useState(null)
  const [activeGroupId, setActiveGroupId] = useState(null)
  const [newGroupName, setNewGroupName] = useState('')

  function nextColor() {
    const used = new Set(groups.map(g => g.color).filter(Boolean))
    return BUNDLE_COLORS.find(c => !used.has(c)) ?? BUNDLE_COLORS[groups.length % BUNDLE_COLORS.length]
  }

  function addGroup() {
    const name  = newGroupName.trim() || `Group ${groups.length + 1}`
    const color = nextColor()
    const id    = crypto.randomUUID()
    onChange([...groups, { id, name, color, dayIndexes: [] }])
    setNewGroupName('')
    setActiveGroupId(id)
  }

  function removeGroup(id) {
    onChange(groups.filter(g => g.id !== id))
    if (activeGroupId === id) setActiveGroupId(null)
  }

  function toggleModuleInGroup(groupId, idx) {
    onChange(groups.map(g => {
      if (g.id !== groupId) {
        // Remove from other groups — one module can only be in one group
        return { ...g, dayIndexes: g.dayIndexes.filter(i => i !== idx) }
      }
      const has = g.dayIndexes.includes(idx)
      return { ...g, dayIndexes: has ? g.dayIndexes.filter(i => i !== idx) : [...g.dayIndexes, idx].sort((a, b) => a - b) }
    }))
  }

  function renameGroup(id, name) {
    onChange(groups.map(g => g.id === id ? { ...g, name } : g))
    setEditGroup(null)
  }

  function moduleGroupColor(idx) {
    const g = groups.find(g => (g.dayIndexes || []).includes(idx))
    return g?.color || null
  }

  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 4, lineHeight: 1.5 }}>
        Group modules that must be claimed together. When an instructor claims any module in a group, all others in that group are automatically claimed too.
      </p>

      {/* Module map — visual overview of group assignments */}
      {slots.length > 0 && (
        <div style={{ marginBottom: 16, marginTop: 14 }}>
          <div style={{ fontSize: 10, fontFamily: 'Space Grotesk', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-4)', marginBottom: 8 }}>
            Module Map — click a group below, then tap modules to assign
          </div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {slots.map((slot, idx) => {
              const color = moduleGroupColor(idx)
              const canAssign = !!activeGroupId
              return (
                <button
                  key={slot.id}
                  onClick={() => activeGroupId && toggleModuleInGroup(activeGroupId, idx)}
                  title={slot.label || `Module ${idx + 1}`}
                  style={{
                    fontSize: 12, fontFamily: 'Space Grotesk', fontWeight: 700,
                    padding: '5px 12px', borderRadius: 'var(--radius-full)',
                    border: `1.5px solid ${color || 'var(--border-dim)'}`,
                    background: color ? `${color}20` : 'transparent',
                    color: color || 'var(--text-4)',
                    cursor: canAssign ? 'pointer' : 'default',
                    transition: 'all 120ms',
                  }}
                >
                  M{idx + 1}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Group rows */}
      {groups.map(group => {
        const isActive = group.id === activeGroupId
        const color    = group.color || 'var(--accent)'
        return (
          <div
            key={group.id}
            onClick={() => setActiveGroupId(isActive ? null : group.id)}
            style={{
              marginBottom: 8, padding: '12px 14px',
              background: isActive ? `${color}12` : 'var(--surface-xs)',
              border: `1.5px solid ${isActive ? color : 'var(--border-dim)'}`,
              borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              transition: 'all 150ms',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: group.dayIndexes.length > 0 ? 10 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                {editGroup === group.id ? (
                  <input
                    className="input"
                    defaultValue={group.name}
                    autoFocus
                    style={{ flex: 1, fontSize: 13 }}
                    onClick={e => e.stopPropagation()}
                    onBlur={e => renameGroup(group.id, e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && renameGroup(group.id, e.target.value)}
                  />
                ) : (
                  <span
                    style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 13, color: 'var(--text-1)' }}
                    onClick={e => { e.stopPropagation(); setEditGroup(group.id) }}
                  >
                    {group.name}
                  </span>
                )}
                {isActive && (
                  <span style={{ fontSize: 10, fontFamily: 'Space Grotesk', fontWeight: 600, color, background: `${color}20`, padding: '2px 8px', borderRadius: 'var(--radius-full)', border: `1px solid ${color}` }}>
                    Active — tap modules above
                  </span>
                )}
              </div>
              <button
                className="btn btn-ghost"
                onClick={e => { e.stopPropagation(); removeGroup(group.id) }}
                style={{ fontSize: 11, padding: '2px 8px', minHeight: 24, color: 'var(--red)' }}
              >
                Remove
              </button>
            </div>
            {group.dayIndexes.length > 0 ? (
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {group.dayIndexes.map(idx => (
                  <span
                    key={idx}
                    style={{
                      fontSize: 11, fontFamily: 'Space Grotesk', fontWeight: 700,
                      padding: '3px 10px', borderRadius: 'var(--radius-full)',
                      background: `${color}20`, color, border: `1px solid ${color}`,
                    }}
                  >
                    M{idx + 1}
                  </span>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 4 }}>
                {isActive ? 'Tap modules in the map above to assign them.' : 'No modules assigned — select this group to start.'}
              </div>
            )}
          </div>
        )
      })}

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <input
          className="input"
          placeholder="Group name (optional)"
          value={newGroupName}
          onChange={e => setNewGroupName(e.target.value)}
          style={{ flex: 1, fontSize: 13 }}
        />
        <button className="btn btn-ghost" onClick={addGroup} style={{ whiteSpace: 'nowrap' }}>+ Add Group</button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CourseBuilder() {
  const navigate = useNavigate()
  const { modules, courses, addCourse, updateCourse, deleteCourse } = useApp()

  const [view, setView]               = useState('list')
  const [editCourse, setEditCourse]   = useState(null)
  const [detailCourse, setDetailCourse] = useState(null)

  const [name, setName]           = useState('')
  const [code, setCode]           = useState('')
  const [fullTitle, setFullTitle] = useState('')
  const [color, setColor]         = useState(COLORS[0])
  const [slots, setSlots]         = useState([])
  const [groups, setGroups]       = useState([])

  const [showPicker, setShowPicker]       = useState(false)
  const [editSlot, setEditSlot]           = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  // List view state
  const [search, setSearch]               = useState('')
  const [sortBy, setSortBy]               = useState('name-asc')
  const [showSort, setShowSort]           = useState(false)
  const [selectMode, setSelectMode]       = useState(false)
  const [selected, setSelected]           = useState(new Set())
  const [showBulkDelete, setShowBulkDelete] = useState(false)

  const SORT_OPTIONS = [
    { value: 'name-asc',  label: 'Name A → Z' },
    { value: 'name-desc', label: 'Name Z → A' },
    { value: 'code-asc',  label: 'Code A → Z' },
    { value: 'mods-desc', label: 'Most modules' },
    { value: 'hrs-desc',  label: 'Most hours' },
  ]

  function applyListSort(list) {
    return [...list].sort((a, b) => {
      if (sortBy === 'name-asc')  return a.name.localeCompare(b.name)
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name)
      if (sortBy === 'code-asc')  return a.code.localeCompare(b.code)
      if (sortBy === 'mods-desc') return (b.days?.length || 0) - (a.days?.length || 0)
      if (sortBy === 'hrs-desc')  return totalHours(b.days || [], modules || []) - totalHours(a.days || [], modules || [])
      return 0
    })
  }

  const filteredCourses = applyListSort(
    (courses || []).filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      (c.fullTitle || '').toLowerCase().includes(search.toLowerCase())
    )
  )

  function toggleSelect(id) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function exitSelect() { setSelectMode(false); setSelected(new Set()) }
  function handleBulkDelete() {
    [...selected].forEach(id => deleteCourse(id))
    exitSelect(); setShowBulkDelete(false)
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function nextAvailableColor() {
    const used = new Set((courses || []).map(c => c.color))
    return COLORS.find(c => !used.has(c)) ?? COLORS[(courses || []).length % COLORS.length]
  }

  function openCreate() {
    setEditCourse(null)
    setName(''); setCode(''); setFullTitle(''); setColor(nextAvailableColor()); setSlots([]); setGroups([])
    setView('edit')
  }

  function openEdit(course) {
    setEditCourse(course)
    setName(course.name); setCode(course.code); setFullTitle(course.fullTitle || ''); setColor(course.color || COLORS[0])
    setSlots(course.days || []); setGroups(course.groups || [])
    setView('edit')
  }

  function openDetail(course) {
    setDetailCourse(course)
    setView('detail')
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
    if (editCourse) {
      const updated = { ...editCourse, ...payload }
      updateCourse(updated)
      setDetailCourse(updated)
      setView('detail')
    } else {
      addCourse({ id: crypto.randomUUID(), ...payload, createdAt: new Date().toISOString() })
      setDetailCourse(null)
      setView('list')
    }
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
    const sortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label || 'Sort'
    return (
      <div className="admin-bg">
        <div className="z1 page">
          <div className="safe-top" style={{ padding: '0 16px', paddingTop: 'max(16px, env(safe-area-inset-top))' }}>
            <div style={{ paddingTop: 8, paddingBottom: 16 }}>

              {/* Header */}
              {selectMode ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, minHeight: 36 }}>
                  <button onClick={exitSelect} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 14, padding: '4px 0' }}>Cancel</button>
                  <span style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 14, color: 'var(--text-2)' }}>{selected.size} selected</span>
                  <button onClick={() => selected.size > 0 && setShowBulkDelete(true)} disabled={selected.size === 0} style={{ background: 'none', border: 'none', cursor: selected.size > 0 ? 'pointer' : 'default', fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 14, color: selected.size > 0 ? 'var(--red)' : 'var(--text-4)', padding: '4px 0', opacity: selected.size > 0 ? 1 : 0.4 }}>
                    Delete {selected.size > 0 ? `(${selected.size})` : ''}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button onClick={() => navigate('/admin')} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: '4px 6px', display: 'flex' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>
                    <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 22, color: 'var(--text-1)', margin: 0 }}>Courses</h1>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => setShowSort(true)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--surface-xs)', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius-full)', padding: '4px 10px', color: 'var(--text-3)', cursor: 'pointer', fontSize: 12, fontFamily: 'Space Grotesk', fontWeight: 600 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="9" y1="18" x2="15" y2="18"/></svg> Sort
                    </button>
                    {(courses || []).length > 0 && (
                      <button onClick={() => setSelectMode(true)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 13, padding: '4px 0' }}>Select</button>
                    )}
                  </div>
                </div>
              )}

              {!selectMode && (
                <>
                  <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 12, lineHeight: 1.4 }}>
                    {(courses || []).length === 0 ? 'No courses yet.' : `${(courses || []).length} course${(courses || []).length !== 1 ? 's' : ''} defined`}
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <SearchInput placeholder="Search courses…" value={search} onChange={setSearch} />
                    <button className="btn btn-primary" onClick={openCreate} style={{ whiteSpace: 'nowrap' }}>+ New</button>
                  </div>
                </>
              )}
            </div>
          </div>

          {sortBy !== 'name-asc' && !selectMode && (
            <div style={{ padding: '0 16px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'Space Grotesk' }}>Sorted by:</span>
              <span style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'Space Grotesk', fontWeight: 600 }}>{sortLabel}</span>
              <button onClick={() => setSortBy('name-asc')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', fontSize: 13, padding: '0 2px', lineHeight: 1 }}>×</button>
            </div>
          )}

          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 100 }}>
            {filteredCourses.length === 0 && (
              <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 15, color: 'var(--text-2)', marginBottom: 16 }}>
                  {search ? 'No courses match your search.' : 'No courses yet.'}
                </div>
                {!search && <button className="btn btn-primary" onClick={openCreate} style={{ margin: '0 auto' }}>Create your first course</button>}
              </div>
            )}

            {filteredCourses.map(course => {
              const h = totalHours(course.days || [], modules || [])
              const isSelected = selected.has(course.id)
              return (
                <SwipeableRow
                  key={course.id}
                  disabled={selectMode}
                  leftAction={{ label: 'EDIT', icon: <EditIcon />, color: 'var(--accent)', bg: 'rgba(124,106,247,0.18)', onClick: () => openEdit(course) }}
                  rightAction={{ label: 'DELETE', icon: <TrashIcon />, color: 'var(--red)', bg: 'rgba(239,68,68,0.18)', onClick: () => setConfirmDelete(course) }}
                >
                  <div
                    className="card"
                    onClick={selectMode ? () => toggleSelect(course.id) : () => openDetail(course)}
                    style={{ padding: '12px 14px', cursor: 'pointer', background: isSelected ? 'rgba(124,106,247,0.08)' : undefined, border: isSelected ? '1px solid var(--accent-border)' : undefined }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {selectMode ? (
                        <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`, background: isSelected ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {isSelected && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                      ) : (
                        <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, background: course.color, flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 14, color: 'var(--text-1)', marginBottom: 2 }}>
                          {course.code}: {course.name}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                          {(course.days || []).length} module{(course.days || []).length !== 1 ? 's' : ''}
                          {h > 0 && ` · ${h}h total`}
                        </div>
                      </div>
                      {!selectMode && (
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: course.color, flexShrink: 0 }} />
                      )}
                    </div>
                  </div>
                </SwipeableRow>
              )
            })}
          </div>
        </div>

        {/* Sort sheet */}
        <BottomSheet isOpen={showSort} onClose={() => setShowSort(false)} title="Sort courses">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {SORT_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => { setSortBy(opt.value); setShowSort(false) }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: sortBy === opt.value ? 'var(--accent-dim)' : 'transparent', border: `1px solid ${sortBy === opt.value ? 'var(--accent-border)' : 'transparent'}`, cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 14, color: sortBy === opt.value ? 'var(--accent)' : 'var(--text-1)' }}>{opt.label}</span>
                {sortBy === opt.value && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
              </button>
            ))}
          </div>
        </BottomSheet>

        {/* Single delete confirm */}
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

        {/* Bulk delete confirm */}
        <BottomSheet isOpen={showBulkDelete} onClose={() => setShowBulkDelete(false)} title={`Delete ${selected.size} course${selected.size !== 1 ? 's' : ''}?`}>
          <div>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20, lineHeight: 1.5 }}>
              This will permanently delete the selected courses. Any cohorts using them will be affected. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleBulkDelete}>Delete {selected.size}</button>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowBulkDelete(false)}>Cancel</button>
            </div>
          </div>
        </BottomSheet>

        {/* Next step bar */}
        {(courses || []).length > 0 && !selectMode && !showPicker && !editSlot && !confirmDelete && !showSort && !editCourse && !detailCourse && (
          <div style={{
            position: 'fixed', bottom: 'calc(64px + max(0px, env(safe-area-inset-bottom)))',
            left: 0, right: 0, padding: '8px 16px',
            background: 'linear-gradient(to top, var(--bg) 60%, transparent)',
            pointerEvents: 'none', zIndex: 50,
          }}>
            <button
              onClick={() => navigate('/admin/cohorts/new')}
              style={{
                width: '100%', pointerEvents: 'all',
                background: 'var(--surface-md)', border: '1px solid var(--border-md)',
                borderRadius: 'var(--radius-lg)', padding: '11px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 13, color: 'var(--text-2)' }}>
                Next: Schedule a Course
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        )}

        <BottomNav role="admin" />
      </div>
    )
  }

  // ── Detail view ─────────────────────────────────────────────────────────────
  if (view === 'detail' && detailCourse) {
    const dc   = courses.find(c => c.id === detailCourse.id) || detailCourse
    const mods = modules || []
    const hrs  = totalHours(dc.days || [], mods)
    return (
      <div className="admin-bg">
        <div className="z1 page">
          <div className="safe-top" style={{ padding: '0 16px', paddingTop: 'max(16px, env(safe-area-inset-top))' }}>
            <div style={{ paddingTop: 8, paddingBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button onClick={() => { setView('list'); setDetailCourse(null); setEditCourse(null) }} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: '4px 6px', display: 'flex' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <div>
                    <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 20, color: 'var(--text-1)', lineHeight: 1.2 }}>
                      {dc.code}: {dc.name}
                    </div>
                    {dc.fullTitle && (
                      <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{dc.fullTitle}</div>
                    )}
                  </div>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => openEdit(dc)}
                  style={{ padding: '6px 16px', fontSize: 13, flexShrink: 0 }}
                >
                  Edit
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingLeft: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: dc.color }} />
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  {(dc.days || []).length} module{(dc.days || []).length !== 1 ? 's' : ''}
                  {hrs > 0 && ` · ${hrs}h total`}
                </span>
              </div>
            </div>
          </div>

          <div style={{ padding: '0 16px', paddingBottom: 100, display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Module sequence */}
            {(dc.days || []).length > 0 && (
              <section>
                <div style={sectionHeader}>Module Sequence</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(dc.days || []).map((slot, i) => {
                    const mod      = mods.find(m => m.id === slot.moduleId)
                    const grp      = (dc.groups || []).find(g => (g.dayIndexes || []).includes(i))
                    const grpColor = grp?.color || null
                    return (
                      <div key={slot.id || i} className="card" style={{ padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 12, borderLeft: grp ? `3px solid ${grpColor || 'var(--accent)'}` : undefined }}>
                        <div style={{
                          width: 28, height: 22, borderRadius: 'var(--radius-sm)', flexShrink: 0,
                          background: grpColor ? `${grpColor}20` : 'var(--accent-dim)',
                          border: `1px solid ${grpColor || 'var(--accent-border)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 10,
                          color: grpColor || 'var(--accent)',
                        }}>
                          M{i + 1}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 13, color: 'var(--text-1)' }}>
                            {slot.label || mod?.name || <span style={{ color: 'var(--text-4)' }}>Unknown module</span>}
                          </div>
                          {mod && (
                            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
                              {mod.durationHours}h{slot.label && mod.name !== slot.label ? ` · ${mod.name}` : ''}
                            </div>
                          )}
                        </div>
                        {grp && (
                          <span style={{ fontSize: 10, fontFamily: 'Space Grotesk', fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: grpColor ? `${grpColor}20` : 'var(--accent-dim)', color: grpColor || 'var(--accent)', border: `1px solid ${grpColor || 'var(--accent-border)'}`, flexShrink: 0 }}>
                            {grp.name}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Claim bundles */}
            {(dc.groups || []).length > 0 && (
              <section>
                <div style={sectionHeader}>Claim Bundles</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 10, lineHeight: 1.5 }}>
                  Instructors who claim any module in a bundle automatically claim all modules in that bundle.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {dc.groups.map(group => {
                    const color = group.color || 'var(--accent)'
                    return (
                      <div key={group.id} className="card" style={{ padding: '12px 14px', borderLeft: `3px solid ${color}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: group.dayIndexes?.length > 0 ? 8 : 0 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                          <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 13, color: 'var(--text-1)' }}>
                            {group.name}
                          </div>
                        </div>
                        {(group.dayIndexes || []).length > 0 ? (
                          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                            {group.dayIndexes.map(idx => (
                              <span key={idx} style={{ fontSize: 11, fontFamily: 'Space Grotesk', fontWeight: 700, padding: '3px 10px', borderRadius: 'var(--radius-full)', background: `${color}20`, color, border: `1px solid ${color}` }}>
                                M{idx + 1}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div style={{ fontSize: 12, color: 'var(--text-4)' }}>No modules assigned</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {(dc.days || []).length === 0 && (
              <div className="card" style={{ padding: 32, textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 16 }}>No modules added to this course yet.</div>
                <button className="btn btn-primary" onClick={() => openEdit(dc)} style={{ margin: '0 auto' }}>Edit Course</button>
              </div>
            )}
          </div>
        </div>
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
                  <button onClick={() => editCourse && detailCourse ? setView('detail') : setView('list')} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: '4px 6px', display: 'flex' }}>
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
                    {COLORS.map(c => {
                      const inUse = (courses || []).some(x => x.color === c && (!editCourse || x.id !== editCourse.id))
                      const isSelected = color === c
                      return (
                        <div key={c} style={{ position: 'relative' }}>
                          <button
                            onClick={() => setColor(c)}
                            style={{
                              width: 28, height: 28, borderRadius: '50%', background: c, border: 'none',
                              cursor: 'pointer', opacity: inUse && !isSelected ? 0.35 : 1,
                              outline: isSelected ? `3px solid ${c}` : 'none', outlineOffset: 2,
                            }}
                          />
                          {inUse && !isSelected && (
                            <div style={{
                              position: 'absolute', bottom: -1, right: -1,
                              width: 8, height: 8, borderRadius: '50%',
                              background: 'var(--bg)', border: '1px solid var(--border)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-4)' }} />
                            </div>
                          )}
                        </div>
                      )
                    })}
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
