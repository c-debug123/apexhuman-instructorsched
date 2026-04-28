import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import AdminDashboard from './pages/admin/AdminDashboard'
import CreateCohort from './pages/admin/CreateCohort'
import CohortDetail from './pages/admin/CohortDetail'
import InstructorRoster from './pages/admin/InstructorRoster'
import CalendarView from './pages/admin/CalendarView'
import ReferencePage from './pages/admin/ReferencePage'
import ModuleLibrary from './pages/admin/ModuleLibrary'
import CourseBuilder from './pages/admin/CourseBuilder'

export default function AdminApp() {
  return (
    <AppProvider>
      <BrowserRouter>
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
      </BrowserRouter>
    </AppProvider>
  )
}
