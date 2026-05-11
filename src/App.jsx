import AdminApp from './AdminApp'
import InstructorApp from './InstructorApp'

function detectRole() {
  const hostname = window.location.hostname
  const param = new URLSearchParams(window.location.search).get('role')

  // URL param always wins (allows overriding on any deployment)
  if (param === 'instructor') {
    localStorage.setItem('apex_role', 'instructor')
    return 'instructor'
  }
  if (param === 'admin') {
    localStorage.removeItem('apex_role')
    return 'admin'
  }

  // Build-time env var set in Vercel project settings
  if (import.meta.env.VITE_ROLE === 'instructor') return 'instructor'
  if (import.meta.env.VITE_ROLE === 'admin') return 'admin'

  // Hostname-based detection for custom domains
  if (hostname.includes('admin')) return 'admin'
  if (hostname.includes('instructor')) return 'instructor'

  const stored = localStorage.getItem('apex_role')
  if (stored) return stored
  return 'admin'
}

export default function App() {
  const role = detectRole()
  if (role === 'instructor') return <InstructorApp />
  return <AdminApp />
}
