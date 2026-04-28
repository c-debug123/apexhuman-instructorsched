import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import InstructorApp from './InstructorApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <InstructorApp />
  </StrictMode>,
)
