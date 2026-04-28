import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import InstructorCalendarView from './pages/instructor/CalendarView'
import SignIn from './pages/instructor/SignIn'
import SlotBrowser from './pages/instructor/SlotBrowser'
import MySchedule from './pages/instructor/MySchedule'

function InstructorGate() {
  const name = localStorage.getItem('apex_instructor_name')
  return name ? <Navigate to="/schedule/slots" replace /> : <SignIn />
}

export default function InstructorApp() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/schedule" replace />} />
          <Route path="/schedule" element={<InstructorGate />} />
          <Route path="/schedule/slots" element={<SlotBrowser />} />
          <Route path="/schedule/calendar" element={<InstructorCalendarView />} />
          <Route path="/schedule/mine" element={<MySchedule />} />
          <Route path="*" element={<Navigate to="/schedule" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}
