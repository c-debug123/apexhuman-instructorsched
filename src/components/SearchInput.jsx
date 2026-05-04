export default function SearchInput({ value, onChange, placeholder = 'Search…', style }) {
  return (
    <div style={{ position: 'relative', flex: 1, ...style }}>
      <input
        className="input"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ paddingRight: value ? 36 : 14 }}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', padding: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-4)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      )}
    </div>
  )
}
