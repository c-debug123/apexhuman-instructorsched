import { useState, useRef } from 'react'

const ACTION_W = 76

export default function SwipeableRow({ leftAction, rightAction, children, disabled, style }) {
  const [offset, setOffset]       = useState(0)
  const [snapped, setSnapped]     = useState(null)
  const [animating, setAnimating] = useState(false)
  const startXRef = useRef(null)
  const baseRef   = useRef(0)

  function snapTo(target) {
    setAnimating(true)
    setOffset(target)
    setSnapped(target === 0 ? null : target < 0 ? 'left' : 'right')
    setTimeout(() => setAnimating(false), 300)
  }

  function close() { snapTo(0) }

  function handleTouchStart(e) {
    if (disabled) return
    startXRef.current = e.touches[0].clientX
    baseRef.current   = snapped === 'left' ? -ACTION_W : snapped === 'right' ? ACTION_W : 0
    setAnimating(false)
  }

  function handleTouchMove(e) {
    if (disabled || startXRef.current === null) return
    if (!leftAction && e.touches[0].clientX > startXRef.current) return
    if (!rightAction && e.touches[0].clientX < startXRef.current) return
    const raw = baseRef.current + (e.touches[0].clientX - startXRef.current)
    setOffset(Math.max(-ACTION_W, Math.min(ACTION_W, raw)))
  }

  function handleTouchEnd() {
    if (disabled || startXRef.current === null) return
    startXRef.current = null
    if (snapped === 'left') {
      snapTo(offset > -ACTION_W / 2 ? 0 : -ACTION_W)
    } else if (snapped === 'right') {
      snapTo(offset < ACTION_W / 2 ? 0 : ACTION_W)
    } else {
      const moved = offset - baseRef.current
      if (moved < -30 || offset < -ACTION_W / 2) snapTo(-ACTION_W)
      else if (moved > 30 || offset > ACTION_W / 2) snapTo(ACTION_W)
      else snapTo(0)
    }
  }

  const leftOpacity  = Math.min(1, Math.max(0, offset / (ACTION_W * 0.4)))
  const rightOpacity = Math.min(1, Math.max(0, -offset / (ACTION_W * 0.4)))

  return (
    <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', ...style }}>
      {leftAction && (
        <div
          style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: ACTION_W,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
            background: leftAction.bg || 'rgba(124,106,247,0.18)', cursor: 'pointer',
            opacity: leftOpacity,
          }}
          onClick={() => { close(); leftAction.onClick?.() }}
        >
          {leftAction.icon}
          <span style={{ fontSize: 10, fontFamily: 'Space Grotesk', fontWeight: 600, color: leftAction.color, letterSpacing: '0.05em' }}>
            {leftAction.label}
          </span>
        </div>
      )}

      {rightAction && (
        <div
          style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: ACTION_W,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
            background: rightAction.bg || 'rgba(239,68,68,0.18)', cursor: 'pointer',
            opacity: rightOpacity,
          }}
          onClick={() => { close(); rightAction.onClick?.() }}
        >
          {rightAction.icon}
          <span style={{ fontSize: 10, fontFamily: 'Space Grotesk', fontWeight: 600, color: rightAction.color, letterSpacing: '0.05em' }}>
            {rightAction.label}
          </span>
        </div>
      )}

      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${offset}px)`,
          transition: animating ? 'transform 300ms cubic-bezier(0.34,1.56,0.64,1)' : 'none',
          position: 'relative', zIndex: 1,
          borderRadius: 'var(--radius-lg)',
        }}
      >
        {children}
      </div>
    </div>
  )
}
