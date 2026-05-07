import AdminApp from './AdminApp'
import InstructorApp from './InstructorApp'

function detectRole() {
  const hostname = window.location.hostname
  const param = new URLSearchParams(window.location.search).get('role')

  // Dedicated admin subdomain — always admin, ignore any stored role
  if (hostname.includes('admin')) {
    if (param === 'instructor') return 'instructor' // explicit override for the link
    return 'admin'
  }

  // Dedicated instructor subdomain — always instructor
  if (hostname.includes('instructor')) return 'instructor'

  // localhost: URL param sets and persists the role
  if (param === 'instructor') {
    localStorage.setItem('apex_role', 'instructor')
    return 'instructor'
  }
  if (param === 'admin') {
    localStorage.removeItem('apex_role')
    return 'admin'
  }
  const stored = localStorage.getItem('apex_role')
  if (stored) return stored
  return 'admin'
}

export default function App() {
  const role = detectRole()
  if (role === 'instructor') return <InstructorApp />
  return <AdminApp />
}
