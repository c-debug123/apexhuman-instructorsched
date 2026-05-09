import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import BottomSheet from '../../components/BottomSheet'
import SwipeableRow from '../../components/SwipeableRow'
import SearchInput from '../../components/SearchInput'
import ExpandableText from '../../components/ExpandableText'

const TAG_OPTIONS = ['AI', 'Business', 'Creative', 'Technical', 'Marketing', 'Design', 'Operations']

const SORT_OPTIONS = [
  { value: 'name-asc',  label: 'Name A → Z' },
  { value: 'name-desc', label: 'Name Z → A' },
  { value: 'dur-asc',   label: 'Duration (shortest first)' },
  { value: 'dur-desc',  label: 'Duration (longest first)' },
  { value: 'newest',    label: 'Recently added' },
]

function EditIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}
function TrashIcon({ color = 'var(--red)' }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

function DupWarning({ text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 5, fontSize: 11, color: 'var(--red)', fontFamily: 'Space Grotesk', fontWeight: 600 }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      {text}
    </div>
  )
}

function ModuleForm({ initial, onSave, onCancel, allModules }) {
  const [name, setName]              = useState(initial?.name || '')
  const [desc, setDesc]              = useState(initial?.description || '')
  const [tags, setTags]              = useState(initial?.tags || [])
  const [tagInput, setTagInput]      = useState('')
  const [durationHours, setDuration] = useState(initial?.durationHours ?? 2)
  const [saving, setSaving]          = useState(false)
  const [error, setError]            = useState(null)

  const otherModules = (allModules || []).filter(m => !initial || m.id !== initial.id)
  const dupName = name.trim().length >= 2 && otherModules.some(m => m.name.toLowerCase() === name.trim().toLowerCase())

  function toggleTag(t) {
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }
  function addCustomTag(e) {
    e.preventDefault()
    const t = tagInput.trim()
    if (t && !tags.includes(t)) setTags(prev => [...prev, t])
    setTagInput('')
  }
  async function handleSave() {
    if (name.trim().length < 2 || dupName) return
    setSaving(true); setError(null)
    const result = await onSave({ name: name.trim(), description: desc.trim(), tags, durationHours: parseFloat(durationHours) || 2 })
    if (result?.error) { setError(result.error); setSaving(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Module name</label>
          <input className="input" placeholder="e.g. AI Foundations" value={name} onChange={e => setName(e.target.value)} autoFocus style={{ borderColor: dupName ? 'var(--red)' : undefined }} />
          {dupName && <DupWarning text="A module with this name already exists" />}
        </div>
        <div style={{ width: 90 }}>
          <label style={labelStyle}>Hours</label>
          <input className="input" type="number" min={0.5} max={24} step={0.5} value={durationHours} onChange={e => setDuration(e.target.value)} />
        </div>
      </div>
      <div>
        <label style={labelStyle}>Description (optional)</label>
        <textarea className="input" placeholder="What does this module cover?" value={desc} onChange={e => setDesc(e.target.value)} rows={3} style={{ resize: 'vertical' }} />
      </div>
      <div>
        <label style={labelStyle}>Tags</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {TAG_OPTIONS.map(t => (
            <button key={t} type="button" onClick={() => toggleTag(t)} style={{
              fontSize: 12, fontFamily: 'Space Grotesk', fontWeight: 600,
              padding: '4px 10px', borderRadius: 'var(--radius-full)',
              border: `1px solid ${tags.includes(t) ? 'var(--accent)' : 'var(--border)'}`,
              background: tags.includes(t) ? 'var(--accent-dim)' : 'transparent',
              color: tags.includes(t) ? 'var(--accent)' : 'var(--text-3)', cursor: 'pointer',
            }}>{t}</button>
          ))}
        </div>
        {tags.filter(t => !TAG_OPTIONS.includes(t)).map(t => (
          <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontFamily: 'Space Grotesk', fontWeight: 600, padding: '4px 10px', borderRadius: 'var(--radius-full)', border: '1px solid var(--accent)', background: 'var(--accent-dim)', color: 'var(--accent)', marginRight: 6, marginBottom: 6 }}>
            {t}
            <button type="button" onClick={() => setTags(prev => prev.filter(x => x !== t))} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: 14 }}>×</button>
          </span>
        ))}
        <form onSubmit={addCustomTag} style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          <input className="input" placeholder="Custom tag..." value={tagInput} onChange={e => setTagInput(e.target.value)} style={{ flex: 1 }} />
          <button type="submit" className="btn btn-ghost" style={{ padding: '0 12px', fontSize: 12, minHeight: 38 }}>Add</button>
        </form>
      </div>
      {error && (
        <div style={{ fontSize: 13, color: 'var(--red)', padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239,68,68,0.2)' }}>
          Failed to save: {error}
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={name.trim().length < 2 || dupName || saving}>
          {saving ? 'Saving…' : (initial ? 'Save Changes' : 'Create Module')}
        </button>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onCancel} disabled={saving}>Cancel</button>
      </div>
    </div>
  )
}

export default function ModuleLibrary() {
  const navigate = useNavigate()
  const { modules, courses, addModule, updateModule, deleteModule } = useApp()

  const [showCreate, setShowCreate]       = useState(false)
  const [editing, setEditing]             = useState(null)
  const [viewing, setViewing]             = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleteError, setDeleteError]     = useState(null)
  const [search, setSearch]               = useState('')
  const [sortBy, setSortBy]               = useState('name-asc')
  const [showSort, setShowSort]           = useState(false)
  const [activeTag, setActiveTag]         = useState(null)
  const [selectMode, setSelectMode]       = useState(false)
  const [selected, setSelected]           = useState(new Set())
  const [showBulkDelete, setShowBulkDelete] = useState(false)

  const allTags = [...new Set((modules || []).flatMap(m => m.tags || []))]

  function applySort(list) {
    return [...list].sort((a, b) => {
      if (sortBy === 'name-asc')  return a.name.localeCompare(b.name)
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name)
      if (sortBy === 'dur-asc')   return (a.durationHours || 0) - (b.durationHours || 0)
      if (sortBy === 'dur-desc')  return (b.durationHours || 0) - (a.durationHours || 0)
      return 0
    })
  }

  const filtered = applySort(
    (modules || []).filter(m => {
      const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
        (m.description || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()))
      const matchTag = !activeTag || (m.tags || []).includes(activeTag)
      return matchSearch && matchTag
    })
  )

  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function exitSelect() {
    setSelectMode(false)
    setSelected(new Set())
  }

  async function handleCreate(data) {
    const result = await addModule({ id: crypto.randomUUID(), ...data })
    if (!result?.error) setShowCreate(false)
    return result
  }

  async function handleUpdate(data) {
    const result = await updateModule({ ...editing, ...data })
    if (!result?.error) setEditing(null)
    return result
  }

  async function handleDelete() {
    if (!confirmDelete) return
    setDeleteError(null)
    const result = await deleteModule(confirmDelete.id)
    if (result?.error) setDeleteError(result.error)
    else setConfirmDelete(null)
  }

  async function handleBulkDelete() {
    await Promise.all([...selected].map(id => deleteModule(id)))
    exitSelect()
    setShowBulkDelete(false)
  }

  const sortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label || 'Sort'

  return (
    <div className="admin-bg">
      <div className="z1 page">
        <div className="safe-top" style={{ padding: '0 16px', paddingTop: 'max(16px, env(safe-area-inset-top))' }}>

          {/* Header */}
          <div style={{ paddingTop: 8, paddingBottom: 12 }}>
            {selectMode ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, minHeight: 36 }}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button onClick={() => navigate('/admin')} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: '4px 6px', display: 'flex' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 22, color: 'var(--text-1)', margin: 0 }}>Module Library</h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => setShowSort(true)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--surface-xs)', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius-full)', padding: '4px 10px', color: 'var(--text-3)', cursor: 'pointer', fontSize: 12, fontFamily: 'Space Grotesk', fontWeight: 600 }}>
                    <SortIcon /> Sort
                  </button>
                  {(modules || []).length > 0 && (
                    <button onClick={() => setSelectMode(true)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 13, padding: '4px 0' }}>
                      Select
                    </button>
                  )}
                </div>
              </div>
            )}

            {!selectMode && (
              <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 12, lineHeight: 1.4 }}>
                {(modules || []).length === 0
                  ? 'No modules yet. Create reusable teaching modules here.'
                  : `${(modules || []).length} module${(modules || []).length !== 1 ? 's' : ''} in the library`}
              </p>
            )}

            {!selectMode && (
              <div style={{ display: 'flex', gap: 8, marginBottom: allTags.length > 0 ? 10 : 0 }}>
                <SearchInput placeholder="Search modules..." value={search} onChange={setSearch} />
                <button className="btn btn-primary" onClick={() => setShowCreate(true)} style={{ whiteSpace: 'nowrap' }}>
                  + New Module
                </button>
              </div>
            )}

            {/* Category filter chips */}
            {!selectMode && allTags.length > 0 && (
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
                <button
                  onClick={() => setActiveTag(null)}
                  style={{
                    flexShrink: 0, fontSize: 12, fontFamily: 'Space Grotesk', fontWeight: 600,
                    padding: '4px 12px', borderRadius: 'var(--radius-full)', cursor: 'pointer',
                    border: `1px solid ${!activeTag ? 'var(--accent)' : 'var(--border-dim)'}`,
                    background: !activeTag ? 'var(--accent-dim)' : 'transparent',
                    color: !activeTag ? 'var(--accent)' : 'var(--text-3)',
                  }}
                >All</button>
                {allTags.map(t => (
                  <button
                    key={t}
                    onClick={() => setActiveTag(activeTag === t ? null : t)}
                    style={{
                      flexShrink: 0, fontSize: 12, fontFamily: 'Space Grotesk', fontWeight: 600,
                      padding: '4px 12px', borderRadius: 'var(--radius-full)', cursor: 'pointer',
                      border: `1px solid ${activeTag === t ? 'var(--accent)' : 'var(--border-dim)'}`,
                      background: activeTag === t ? 'var(--accent-dim)' : 'transparent',
                      color: activeTag === t ? 'var(--accent)' : 'var(--text-3)',
                    }}
                  >{t}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sort label when active */}
        {sortBy !== 'name-asc' && !selectMode && (
          <div style={{ padding: '0 16px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'Space Grotesk' }}>Sorted by:</span>
            <span style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'Space Grotesk', fontWeight: 600 }}>{sortLabel}</span>
            <button onClick={() => setSortBy('name-asc')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', fontSize: 13, padding: '0 2px', lineHeight: 1 }}>×</button>
          </div>
        )}

        {/* Module list */}
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 100 }}>
          {filtered.length === 0 && (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 15, color: 'var(--text-2)', marginBottom: 6 }}>
                {search || activeTag ? 'No modules match your filters.' : 'No modules yet.'}
              </div>
              {!search && !activeTag && (
                <button className="btn btn-primary" onClick={() => setShowCreate(true)} style={{ margin: '16px auto 0' }}>
                  Create your first module
                </button>
              )}
            </div>
          )}

          {filtered.map(mod => {
            const isSelected = selected.has(mod.id)
            return (
              <SwipeableRow
                key={mod.id}
                disabled={selectMode}
                leftAction={{
                  label: 'EDIT',
                  icon: <EditIcon />,
                  color: 'var(--accent)',
                  bg: 'rgba(124,106,247,0.18)',
                  onClick: () => setEditing(mod),
                }}
                rightAction={{
                  label: 'DELETE',
                  icon: <TrashIcon />,
                  color: 'var(--red)',
                  bg: 'rgba(239,68,68,0.18)',
                  onClick: () => { setConfirmDelete(mod); setDeleteError(null) },
                }}
              >
                <div
                  className="card"
                  onClick={selectMode ? () => toggleSelect(mod.id) : () => setViewing(mod)}
                  style={{ padding: '14px 16px', cursor: 'pointer', background: isSelected ? 'rgba(124,106,247,0.08)' : undefined, border: isSelected ? '1px solid var(--accent-border)' : undefined }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    {/* Checkbox in select mode */}
                    {selectMode && (
                      <div style={{
                        width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
                        border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                        background: isSelected ? 'var(--accent)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {isSelected && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 15, color: 'var(--text-1)' }}>
                          {mod.name}
                        </div>
                        <span style={{ fontSize: 11, fontFamily: 'Space Grotesk', fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--surface-xs)', color: 'var(--text-3)', border: '1px solid var(--border-dim)', flexShrink: 0 }}>
                          {mod.durationHours}h
                        </span>
                      </div>
                      {mod.description && (
                        <ExpandableText
                          text={mod.description}
                          lines={2}
                          style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.4, marginBottom: 8 }}
                        />
                      )}
                      {(mod.tags || []).length > 0 && (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {mod.tags.map(t => (
                            <span key={t} style={{ fontSize: 11, fontFamily: 'Space Grotesk', fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </SwipeableRow>
            )
          })}
        </div>
      </div>

      {/* Sort sheet */}
      <BottomSheet isOpen={showSort} onClose={() => setShowSort(false)} title="Sort modules">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { setSortBy(opt.value); setShowSort(false) }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px', borderRadius: 'var(--radius-sm)',
                background: sortBy === opt.value ? 'var(--accent-dim)' : 'transparent',
                border: `1px solid ${sortBy === opt.value ? 'var(--accent-border)' : 'transparent'}`,
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <span style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 14, color: sortBy === opt.value ? 'var(--accent)' : 'var(--text-1)' }}>
                {opt.label}
              </span>
              {sortBy === opt.value && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              )}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Create sheet */}
      <BottomSheet isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Module">
        <ModuleForm allModules={modules} onSave={handleCreate} onCancel={() => setShowCreate(false)} />
      </BottomSheet>

      {/* Edit sheet */}
      <BottomSheet isOpen={!!editing} onClose={() => setEditing(null)} title="Edit Module">
        {editing && <ModuleForm initial={editing} allModules={modules} onSave={handleUpdate} onCancel={() => setEditing(null)} />}
      </BottomSheet>

      {/* Single delete confirm */}
      <BottomSheet isOpen={!!confirmDelete} onClose={() => { setConfirmDelete(null); setDeleteError(null) }} title="Delete module?">
        {confirmDelete && (
          <div>
            <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 8, lineHeight: 1.5 }}>
              Delete <strong style={{ color: 'var(--text-1)' }}>{confirmDelete.name}</strong>?
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20, lineHeight: 1.5 }}>
              This will also remove it from any course structures that use it.
            </p>
            {deleteError && (
              <div style={{ fontSize: 13, color: 'var(--red)', marginBottom: 12, padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-sm)' }}>
                Failed to delete: {deleteError}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDelete}>Delete</button>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setConfirmDelete(null); setDeleteError(null) }}>Cancel</button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Module detail */}
      <BottomSheet isOpen={!!viewing} onClose={() => setViewing(null)} title="Module Details">
        {viewing && (() => {
          const usedIn = courses.filter(c => (c.days || []).some(d => d.moduleId === viewing.id))
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Name + duration */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 20, color: 'var(--text-1)' }}>
                  {viewing.name}
                </div>
                <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 15, padding: '4px 12px', borderRadius: 'var(--radius-full)', background: 'var(--surface-xs)', color: 'var(--text-2)', border: '1px solid var(--border-dim)', flexShrink: 0 }}>
                  {viewing.durationHours}h
                </span>
              </div>

              {/* Description */}
              {viewing.description && (
                <div>
                  <div style={{ fontSize: 10, fontFamily: 'Space Grotesk', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-4)', marginBottom: 6 }}>Description</div>
                  <ExpandableText
                    text={viewing.description}
                    lines={3}
                    style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}
                  />
                </div>
              )}

              {/* Tags */}
              {(viewing.tags || []).length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontFamily: 'Space Grotesk', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-4)', marginBottom: 8 }}>Tags</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {viewing.tags.map(t => (
                      <span key={t} style={{ fontSize: 12, fontFamily: 'Space Grotesk', fontWeight: 600, padding: '4px 10px', borderRadius: 'var(--radius-full)', background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Used in courses */}
              <div>
                <div style={{ fontSize: 10, fontFamily: 'Space Grotesk', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-4)', marginBottom: 8 }}>Used in Courses</div>
                {usedIn.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--text-4)', fontStyle: 'italic' }}>Not assigned to any course yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {usedIn.map(c => {
                      const dayIdx = (c.days || []).findIndex(d => d.moduleId === viewing.id)
                      return (
                        <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--surface-xs)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-dim)' }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12, color: c.color }}>{c.code}</span>
                            <span style={{ fontSize: 13, color: 'var(--text-2)', marginLeft: 6 }}>{c.name}</span>
                          </div>
                          {dayIdx >= 0 && (
                            <span style={{ fontSize: 11, fontFamily: 'Space Grotesk', fontWeight: 600, color: 'var(--text-4)', flexShrink: 0 }}>M{dayIdx + 1}</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { setEditing(viewing); setViewing(null) }}>Edit Module</button>
                <button className="btn btn-ghost" style={{ flex: 1, color: 'var(--red)' }} onClick={() => { setConfirmDelete(viewing); setDeleteError(null); setViewing(null) }}>Delete</button>
              </div>
            </div>
          )
        })()}
      </BottomSheet>

      {/* Bulk delete confirm */}
      <BottomSheet isOpen={showBulkDelete} onClose={() => setShowBulkDelete(false)} title={`Delete ${selected.size} module${selected.size !== 1 ? 's' : ''}?`}>
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20, lineHeight: 1.5 }}>
            This will permanently delete the selected modules and remove them from any course structures. This cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleBulkDelete}>Delete {selected.size}</button>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowBulkDelete(false)}>Cancel</button>
          </div>
        </div>
      </BottomSheet>

      {/* Next step bar */}
      {(modules || []).length > 0 && !selectMode && !showCreate && !editing && !viewing && !confirmDelete && !showSort && !showBulkDelete && (
        <div style={{
          position: 'sticky', bottom: 0,
          padding: '8px 16px',
          background: 'linear-gradient(to top, var(--bg) 60%, transparent)',
          pointerEvents: 'none', zIndex: 10,
        }}>
          <button
            onClick={() => navigate('/admin/courses')}
            style={{
              width: '100%', pointerEvents: 'all',
              background: 'var(--surface-md)', border: '1px solid var(--border-md)',
              borderRadius: 'var(--radius-lg)', padding: '11px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 13, color: 'var(--text-2)' }}>
              Next: Build Courses
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      )}

    </div>
  )
}

const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-3)',
  marginBottom: 8, fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.08em',
}
