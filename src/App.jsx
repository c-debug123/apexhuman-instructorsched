import AdminApp from './AdminApp'
import InstructorApp from './InstructorApp'

function detectRole() {
  const hostname = window.location.hostname
  if (hostname.includes('instructor')) return 'instructor'
  if (hostname.includes('admin')) return 'admin'
  // Dev fallback: ?role=instructor in the URL
  const param = new URLSearchParams(window.location.search).get('role')
  if (param === 'instructor') return 'instructor'
  return 'admin'
}

export default function App() {
  const role = detectRole()
  if (role === 'instructor') return <InstructorApp />
  return <AdminApp />
}
