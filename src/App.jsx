import AdminApp from './AdminApp'
import InstructorApp from './InstructorApp'

function detectRole() {
  // URL param always wins — lets the instructor link work from the admin domain
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
  // Fall back to hostname for dedicated subdomain deployments
  const hostname = window.location.hostname
  if (hostname.includes('instructor')) return 'instructor'
  if (hostname.includes('admin')) return 'admin'
  return 'admin'
}

export default function App() {
  const role = detectRole()
  if (role === 'instructor') return <InstructorApp />
  return <AdminApp />
}
