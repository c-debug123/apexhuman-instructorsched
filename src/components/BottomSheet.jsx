import { useEffect } from 'react'

export default function BottomSheet({ isOpen, onClose, children, title }) {
  useEffect(() => {
    if (!isOpen) return
    // Lock the app scroll container (body is never the scroller in our 100dvh shell)
    const el = document.querySelector('.app-scroll')
    if (el) el.style.overflow = 'hidden'
    return () => {
      if (el) el.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="anim-fade" style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }}
      />
      <div
        className="anim-sheet"
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'rgba(15,15,26,0.96)',
          border: '1px solid var(--border-md)',
          borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
          backdropFilter: 'blur(20px)',
          maxHeight: '85dvh',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-md)' }} />
        </div>
        {title && (
          <div style={{ padding: '8px 20px 0', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 17, color: 'var(--text-1)' }}>
            {title}
          </div>
        )}
        <div style={{ padding: '12px 20px 0' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
