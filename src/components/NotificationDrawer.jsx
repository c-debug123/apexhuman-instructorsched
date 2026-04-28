import { useNotifications } from '../hooks/useNotifications'

const TYPE_ICONS = {
  new_course:     { icon: '◆', color: 'var(--accent)' },
  new_slots:      { icon: '○', color: 'var(--teal)' },
  course_updated: { icon: '△', color: 'var(--amber)' },
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr)
  const min  = Math.floor(diff / 60000)
  const hr   = Math.floor(diff / 3600000)
  const day  = Math.floor(diff / 86400000)
  if (min < 1)  return 'just now'
  if (min < 60) return `${min}m ago`
  if (hr  < 24) return `${hr}h ago`
  return `${day}d ago`
}

export default function NotificationDrawer({ isOpen, onClose }) {
  const { notifications, unreadCount, markRead, markAll } = useNotifications()

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 40,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 50,
        width: 'min(340px, 100vw)',
        background: 'var(--surface-md)',
        borderLeft: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.4)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 20px 16px',
          paddingTop: 'max(20px, env(safe-area-inset-top))',
          borderBottom: '1px solid var(--border-dim)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18, color: 'var(--text-1)', margin: 0, marginBottom: 2 }}>
              Notifications
            </h2>
            {unreadCount > 0 && (
              <span style={{ fontSize: 12, color: 'var(--teal)' }}>{unreadCount} unread</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {unreadCount > 0 && (
              <button
                onClick={markAll}
                style={{ fontSize: 12, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Space Grotesk', fontWeight: 600 }}
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: '4px', display: 'flex', borderRadius: 'var(--radius-sm)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Notification list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {notifications.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>○</div>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 14, color: 'var(--text-3)' }}>
                No notifications yet
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 4 }}>
                You'll be notified when new courses or slots open up.
              </div>
            </div>
          ) : (
            notifications.map(n => {
              const meta = TYPE_ICONS[n.type] || TYPE_ICONS.new_course
              const isUnread = !n.readAt
              return (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  style={{
                    display: 'flex', gap: 12, padding: '12px 14px',
                    background: isUnread ? 'rgba(45,212,191,0.06)' : 'var(--surface-xs)',
                    border: `1px solid ${isUnread ? 'rgba(45,212,191,0.2)' : 'var(--border-dim)'}`,
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer', textAlign: 'left', width: '100%',
                  }}
                >
                  {/* Type icon */}
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: `${meta.color}1a`, border: `1px solid ${meta.color}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, color: meta.color,
                  }}>
                    {meta.icon}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Space Grotesk', fontWeight: isUnread ? 700 : 600, fontSize: 13, color: 'var(--text-1)', marginBottom: 3 }}>
                      {n.title}
                    </div>
                    {n.message && (
                      <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4, lineHeight: 1.4 }}>
                        {n.message}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: 'var(--text-4)' }}>
                      {timeAgo(n.createdAt)}
                    </div>
                  </div>

                  {isUnread && (
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--teal)', flexShrink: 0, marginTop: 4 }} />
                  )}
                </button>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}
