import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminAnalytics from './pages/admin/AdminAnalytics'
import CreateCohort from './pages/admin/CreateCohort'
import CohortDetail from './pages/admin/CohortDetail'
import InstructorRoster from './pages/admin/InstructorRoster'
import InstructorDetail from './pages/admin/InstructorDetail'
import CalendarView from './pages/admin/CalendarView'
import ReferencePage from './pages/admin/ReferencePage'
import ModuleLibrary from './pages/admin/ModuleLibrary'
import CourseBuilder from './pages/admin/CourseBuilder'
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

function AdminShell() {
  const { isLoading } = useApp()
  if (isLoading) return <LoadingScreen />
  return (
    <div style={SHELL_STYLE}>
      <div style={SCROLL_STYLE}>
        <Routes>
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/cohorts/new" element={<CreateCohort />} />
          <Route path="/admin/cohorts/:id" element={<CohortDetail />} />
          <Route path="/admin/calendar" element={<CalendarView />} />
          <Route path="/admin/roster" element={<InstructorRoster />} />
          <Route path="/admin/roster/:id" element={<InstructorDetail />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/reference" element={<ReferencePage />} />
          <Route path="/admin/modules" element={<ModuleLibrary />} />
          <Route path="/admin/courses" element={<CourseBuilder />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </div>
      <BottomNav role="admin" />
    </div>
  )
}

function LoadingScreen() {
  return (
    <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 16px' }} />
        <div style={{ fontFamily: 'Space Grotesk', fontSize: 13, color: 'var(--text-3)' }}>Loading…</div>
      </div>
    </div>
  )
}

export default function AdminApp() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AdminShell />
      </BrowserRouter>
    </AppProvider>
  )
}
