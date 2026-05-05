import AdminApp from './AdminApp'
import InstructorApp from './InstructorApp'

function detectRole() {
  const hostname = window.location.hostname
  if (hostname.includes('instructor')) return 'instructor'
  if (hostname.includes('admin')) return 'admin'
  // URL param sets and persists the role (covers normal dev + OAuth redirect)
  const param = new URLSearchParams(window.location.search).get('role')
  if (param === 'instructor') {
    localStorage.setItem('apex_role', 'instructor')
    return 'instructor'
  }
  if (param === 'admin') {
    localStorage.removeItem('apex_role')
    return 'admin'
  }
  // Persisted role survives OAuth double-redirects and URL cleanup
  const stored = localStorage.getItem('apex_role')
  if (stored) return stored
  return 'admin'
}

export default function App() {
  const role = detectRole()
  if (role === 'instructor') return <InstructorApp />
  return <AdminApp />
}
