import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import AdminDashboard from './pages/admin/AdminDashboard'
import CreateCohort from './pages/admin/CreateCohort'
import CohortDetail from './pages/admin/CohortDetail'
import InstructorRoster from './pages/admin/InstructorRoster'
import CalendarView from './pages/admin/CalendarView'
import ReferencePage from './pages/admin/ReferencePage'
import ModuleLibrary from './pages/admin/ModuleLibrary'
import CourseBuilder from './pages/admin/CourseBuilder'

function AdminRoutes() {
  const { isLoading } = useApp()
  if (isLoading) return <LoadingScreen />
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/cohorts/new" element={<CreateCohort />} />
      <Route path="/admin/cohorts/:id" element={<CohortDetail />} />
      <Route path="/admin/calendar" element={<CalendarView />} />
      <Route path="/admin/roster" element={<InstructorRoster />} />
      <Route path="/admin/reference" element={<ReferencePage />} />
      <Route path="/admin/modules" element={<ModuleLibrary />} />
      <Route path="/admin/courses" element={<CourseBuilder />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
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
        <AdminRoutes />
      </BrowserRouter>
    </AppProvider>
  )
}
