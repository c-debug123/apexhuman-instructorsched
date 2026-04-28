import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import BottomNav from '../../components/BottomNav'
import BottomSheet from '../../components/BottomSheet'

const TAG_OPTIONS = ['AI', 'Business', 'Creative', 'Technical', 'Marketing', 'Design', 'Operations']

function ModuleForm({ initial, onSave, onCancel }) {
  const [name, setName]        = useState(initial?.name || '')
  const [desc, setDesc]        = useState(initial?.description || '')
  const [tags, setTags]        = useState(initial?.tags || [])
  const [tagInput, setTagInput] = useState('')

  function toggleTag(t) {
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  function addCustomTag(e) {
    e.preventDefault()
    const t = tagInput.trim()
    if (t && !tags.includes(t)) setTags(prev => [...prev, t])
    setTagInput('')
  }

  function handleSave() {
    if (name.trim().length < 2) return
    onSave({ name: name.trim(), description: desc.trim(), tags })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={labelStyle}>Module name</label>
        <input className="input" placeholder="e.g. AI Foundations" value={name} onChange={e => setName(e.target.value)} autoFocus />
      </div>
      <div>
        <label style={labelStyle}>Description (optional)</label>
        <textarea
          className="input"
          placeholder="What does this module cover?"
          value={desc}
          onChange={e => setDesc(e.target.value)}
          rows={3}
          style={{ resize: 'vertical' }}
        />
      </div>
      <div>
        <label style={labelStyle}>Tags</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {TAG_OPTIONS.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => toggleTag(t)}
              style={{
                fontSize: 12, fontFamily: 'Space Grotesk', fontWeight: 600,
                padding: '4px 10px', borderRadius: 'var(--radius-full)',
                border: `1px solid ${tags.includes(t) ? 'var(--accent)' : 'var(--border)'}`,
                background: tags.includes(t) ? 'var(--accent-dim)' : 'transparent',
                color: tags.includes(t) ? 'var(--accent)' : 'var(--text-3)',
                cursor: 'pointer',
              }}
            >{t}</button>
          ))}
        </div>
        {tags.filter(t => !TAG_OPTIONS.includes(t)).map(t => (
          <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontFamily: 'Space Grotesk', fontWeight: 600, padding: '4px 10px', borderRadius: 'var(--radius-full)', border: '1px solid var(--accent)', background: 'var(--accent-dim)', color: 'var(--accent)', marginRight: 6, marginBottom: 6 }}>
            {t}
            <button type="button" onClick={() => setTags(prev => prev.filter(x => x !== t))} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: 14 }}>×</button>
          </span>
        ))}
        <form onSubmit={addCustomTag} style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          <input className="input" placeholder="Custom tag..." value={tagInput} onChange={e => setTagInput(e.target.value)} style={{ flex: 1, fontSize: 13 }} />
          <button type="submit" className="btn btn-ghost" style={{ padding: '0 12px', fontSize: 12, minHeight: 38 }}>Add</button>
        </form>
      </div>
      <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={name.trim().length < 2}>
          {initial ? 'Save Changes' : 'Create Module'}
        </button>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

export default function ModuleLibrary() {
  const navigate = useNavigate()
  const { modules, addModule, updateModule, deleteModule } = useApp()
  const [showCreate, setShowCreate]   = useState(false)
  const [editing, setEditing]         = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [search, setSearch]           = useState('')

  const filtered = (modules || []).filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.description || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()))
  )

  function handleCreate(data) {
    addModule({ id: crypto.randomUUID(), ...data, createdAt: new Date().toISOString() })
    setShowCreate(false)
  }

  function handleUpdate(data) {
    updateModule({ ...editing, ...data })
    setEditing(null)
  }

  function handleDelete() {
    if (confirmDelete) deleteModule(confirmDelete.id)
    setConfirmDelete(null)
  }

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
                <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 22, color: 'var(--text-1)', margin: 0 }}>Module Library</h1>
              </div>
              
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 12, lineHeight: 1.4 }}>
              {(modules || []).length === 0
                ? 'No modules yet. Create reusable teaching modules here.'
                : `${(modules || []).length} module${(modules || []).length !== 1 ? 's' : ''} in the library`}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input"
                placeholder="Search modules..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ flex: 1, fontSize: 13 }}
              />
              <button className="btn btn-primary" onClick={() => setShowCreate(true)} style={{ whiteSpace: 'nowrap' }}>
                + New Module
              </button>
            </div>
          </div>
        </div>

        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 100 }}>
          {filtered.length === 0 && (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 15, color: 'var(--text-2)', marginBottom: 6 }}>
                {search ? 'No modules match your search.' : 'No modules yet.'}
              </div>
              {!search && (
                <button className="btn btn-primary" onClick={() => setShowCreate(true)} style={{ margin: '16px auto 0' }}>
                  Create your first module
                </button>
              )}
            </div>
          )}

          {filtered.map(mod => (
            <div key={mod.id} className="card" style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 15, color: 'var(--text-1)', marginBottom: 4 }}>
                    {mod.name}
                  </div>
                  {mod.description && (
                    <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 8, lineHeight: 1.4 }}>
                      {mod.description}
                    </div>
                  )}
                  {(mod.tags || []).length > 0 && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {mod.tags.map(t => (
                        <span key={t} style={{
                          fontSize: 11, fontFamily: 'Space Grotesk', fontWeight: 600,
                          padding: '2px 8px', borderRadius: 'var(--radius-full)',
                          background: 'var(--accent-dim)', color: 'var(--accent)',
                          border: '1px solid var(--accent-border)',
                        }}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    className="btn btn-ghost"
                    onClick={() => setEditing(mod)}
                    style={{ fontSize: 12, padding: '4px 10px', minHeight: 30 }}
                  >Edit</button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => setConfirmDelete(mod)}
                    style={{ fontSize: 12, padding: '4px 10px', minHeight: 30, color: 'var(--red)' }}
                  >Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create sheet */}
      <BottomSheet isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Module">
        <ModuleForm onSave={handleCreate} onCancel={() => setShowCreate(false)} />
      </BottomSheet>

      {/* Edit sheet */}
      <BottomSheet isOpen={!!editing} onClose={() => setEditing(null)} title="Edit Module">
        {editing && <ModuleForm initial={editing} onSave={handleUpdate} onCancel={() => setEditing(null)} />}
      </BottomSheet>

      {/* Delete confirmation */}
      <BottomSheet isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete module?">
        {confirmDelete && (
          <div>
            <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 8, lineHeight: 1.5 }}>
              Delete <strong style={{ color: 'var(--text-1)' }}>{confirmDelete.name}</strong>?
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20, lineHeight: 1.5 }}>
              This will also remove it from any course structures that use it.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDelete}>Delete</button>
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
