import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import InstructorCalendarView from './pages/instructor/CalendarView'
import SignIn from './pages/instructor/SignIn'
import SlotBrowser from './pages/instructor/SlotBrowser'
import MySchedule from './pages/instructor/MySchedule'

function InstructorGate() {
  const name = localStorage.getItem('apex_instructor_name')
  return name ? <Navigate to="/schedule/slots" replace /> : <SignIn />
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--teal)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 16px' }} />
        <div style={{ fontFamily: 'Space Grotesk', fontSize: 13, color: 'var(--text-3)' }}>Loading…</div>
      </div>
    </div>
  )
}

function InstructorRoutes() {
  const { isLoading } = useApp()
  if (isLoading) return <LoadingScreen />
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/schedule" replace />} />
      <Route path="/schedule" element={<InstructorGate />} />
      <Route path="/schedule/slots" element={<SlotBrowser />} />
      <Route path="/schedule/calendar" element={<InstructorCalendarView />} />
      <Route path="/schedule/mine" element={<MySchedule />} />
      <Route path="*" element={<Navigate to="/schedule" replace />} />
    </Routes>
  )
}

export default function InstructorApp() {
  return (
    <AppProvider>
      <BrowserRouter>
        <InstructorRoutes />
      </BrowserRouter>
    </AppProvider>
  )
}
