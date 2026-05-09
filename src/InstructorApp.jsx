import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import InstructorCalendarView from './pages/instructor/CalendarView'
import SignIn from './pages/instructor/SignIn'
import SlotBrowser from './pages/instructor/SlotBrowser'
import MySchedule from './pages/instructor/MySchedule'
import BottomNav from './components/BottomNav'

const SHELL_STYLE = {
  height: '100dvh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  background: 'var(--bg)',
}
const SCROLL_STYLE = {
  flex: 1,
  overflowY: 'auto',
  WebkitOverflowScrolling: 'touch',
}

function LoadingScreen() {
  return (
    <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--teal)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 16px' }} />
        <div style={{ fontFamily: 'Space Grotesk', fontSize: 13, color: 'var(--text-3)' }}>Loading…</div>
      </div>
    </div>
  )
}

function InstructorGate() {
  const { currentInstructor, authLoading } = useApp()
  if (authLoading) return <LoadingScreen />
  return currentInstructor ? <Navigate to="/schedule/slots" replace /> : <SignIn />
}

function Protected({ children }) {
  const { currentInstructor, authLoading } = useApp()
  if (authLoading) return <LoadingScreen />
  return currentInstructor ? children : <Navigate to="/schedule" replace />
}

function InstructorShell() {
  const { isLoading, currentInstructor } = useApp()
  const { pathname } = useLocation()
  if (isLoading) return <LoadingScreen />

  const isSignIn = pathname === '/schedule' || pathname === '/'
  return (
    <div style={SHELL_STYLE}>
      <div style={SCROLL_STYLE}>
        <Routes>
          <Route path="/" element={<Navigate to="/schedule" replace />} />
          <Route path="/schedule" element={<InstructorGate />} />
          <Route path="/schedule/slots"    element={<Protected><SlotBrowser /></Protected>} />
          <Route path="/schedule/calendar" element={<Protected><InstructorCalendarView /></Protected>} />
          <Route path="/schedule/mine"     element={<Protected><MySchedule /></Protected>} />
          <Route path="*" element={<Navigate to="/schedule" replace />} />
        </Routes>
      </div>
      {!isSignIn && currentInstructor && <BottomNav role="instructor" />}
    </div>
  )
}

export default function InstructorApp() {
  return (
    <AppProvider>
      <BrowserRouter>
        <InstructorShell />
      </BrowserRouter>
    </AppProvider>
  )
}
