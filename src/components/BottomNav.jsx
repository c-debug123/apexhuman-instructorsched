import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useNotifications } from '../hooks/useNotifications'
import NotificationDrawer from './NotificationDrawer'

function GridIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  )
}
function UsersIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}
function ListIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  )
}
function CalIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )
}
function BookIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  )
}
function MyCalIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      <polyline points="9 16 11 18 15 14"/>
    </svg>
  )
}
function BellIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}

export default function BottomNav({ role }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [notifOpen, setNotifOpen] = useState(false)
  const { unreadCount } = useNotifications()

  if (role === 'admin') {
    const isCalendar  = pathname.startsWith('/admin/calendar')
    const isRoster    = pathname.startsWith('/admin/roster')
    const isReference = pathname.startsWith('/admin/reference') || pathname.startsWith('/admin/analytics')
    const isDashboard = !isCalendar && !isRoster && !isReference
    return (
      <nav className="bottom-nav" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <button className={`nav-tab ${isDashboard ? 'active-admin' : ''}`} onClick={() => navigate('/admin')}>
          <GridIcon /><span>Cohorts</span>
        </button>
        <button className={`nav-tab ${isCalendar ? 'active-admin' : ''}`} onClick={() => navigate('/admin/calendar')}>
          <CalIcon /><span>Calendar</span>
        </button>
        <button className={`nav-tab ${isRoster ? 'active-admin' : ''}`} onClick={() => navigate('/admin/roster')}>
          <UsersIcon /><span>Roster</span>
        </button>
        <button className={`nav-tab ${isReference ? 'active-admin' : ''}`} onClick={() => navigate('/admin/reference')}>
          <BookIcon /><span>Reference</span>
        </button>
      </nav>
    )
  }

  const isCalendar = pathname === '/schedule/calendar'
  const isMine     = pathname === '/schedule/mine'
  const isBrowse   = !isCalendar && !isMine
  return (
    <>
      <nav className="bottom-nav" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <button className={`nav-tab ${isBrowse ? 'active-instructor' : ''}`} onClick={() => navigate('/schedule/slots')}>
          <ListIcon /><span>Browse</span>
        </button>
        <button className={`nav-tab ${isCalendar ? 'active-instructor' : ''}`} onClick={() => navigate('/schedule/calendar')}>
          <MyCalIcon /><span>Calendar</span>
        </button>
        <button className={`nav-tab ${isMine ? 'active-instructor' : ''}`} onClick={() => navigate('/schedule/mine')}>
          <ListIcon /><span>Schedule</span>
        </button>
        <button className="nav-tab" onClick={() => setNotifOpen(true)} style={{ position: 'relative' }}>
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <BellIcon />
            {unreadCount > 0 && (
              <div style={{
                position: 'absolute', top: -4, right: -4,
                width: 14, height: 14, borderRadius: '50%',
                background: 'var(--teal)', border: '2px solid var(--bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 8, fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--bg)',
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </div>
            )}
          </div>
          <span>Alerts</span>
        </button>
      </nav>

      <NotificationDrawer isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  )
}
