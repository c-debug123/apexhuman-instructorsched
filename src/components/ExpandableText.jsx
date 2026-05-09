import { useState, useRef, useLayoutEffect } from 'react'

export default function ExpandableText({ text, lines = 2, style = {} }) {
  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(false)
  const ref = useRef(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    // Temporarily unclamp to get true scroll height
    el.style.webkitLineClamp = 'unset'
    el.style.overflow = 'visible'
    const full = el.scrollHeight
    el.style.webkitLineClamp = lines
    el.style.overflow = 'hidden'
    const clamped = el.clientHeight
    setOverflows(full > clamped + 2)
  }, [text, lines])

  return (
    <div style={style}>
      <span
        ref={ref}
        style={{
          display: '-webkit-box',
          WebkitLineClamp: expanded ? 'unset' : lines,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          wordBreak: 'break-word',
        }}
      >
        {text}
      </span>
      {(overflows || expanded) && (
        <button
          onClick={e => { e.stopPropagation(); setExpanded(v => !v) }}
          style={{
            display: 'inline-block',
            marginTop: 3,
            background: 'none', border: 'none', padding: 0,
            fontSize: 11,
            fontFamily: 'Space Grotesk', fontWeight: 600,
            letterSpacing: '0.03em',
            color: 'var(--accent)',
            cursor: 'pointer',
            opacity: 0.85,
          }}
        >
          {expanded ? 'Less' : 'More'}
        </button>
      )}
    </div>
  )
}
