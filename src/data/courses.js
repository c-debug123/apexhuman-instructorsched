export const COURSES = {
  c1: { id: 'c1', code: 'C1', name: 'Roblox Game Dev',    fullTitle: 'Publish and Monetize Your Roblox Game',   shortName: 'Roblox',   color: '#7c6af7', num: 1, track: 1 },
  c2: { id: 'c2', code: 'C2', name: 'Build & Ship',        fullTitle: 'Build and Ship Your Product',             shortName: 'Build',    color: '#ec4899', num: 2, track: 1 },
  c3: { id: 'c3', code: 'C3', name: 'Content Studio',      fullTitle: 'AI Content Studio',                       shortName: 'Content',  color: '#f59e0b', num: 3, track: 1 },
  c4: { id: 'c4', code: 'C4', name: 'E-Commerce',          fullTitle: 'E-Commerce: Source, Sell, and Scale',     shortName: 'Ecom',     color: '#22c55e', num: 4, track: 1 },
  c5: { id: 'c5', code: 'C5', name: 'AI Contact Center',   fullTitle: 'Build Your Own AI Contact Center',        shortName: 'Contact',  color: '#2dd4bf', num: 5, track: 1 },
  c6: { id: 'c6', code: 'C6', name: 'Automate & Scale',    fullTitle: 'Automate and Scale Your Workflows',       shortName: 'Automate', color: '#3b82f6', num: 6, track: 2 },
}

export const DAY_FRAMEWORK = [
  { day: 1, label: 'AI Foundations',      instructor: 'AI Educator',         desc: 'AI landscape, prompt engineering, tool setup' },
  { day: 2, label: 'Business Strategy',   instructor: 'Business Strategist', desc: 'Market validation, ICP, business model, idea canvas' },
  { day: 3, label: 'Build Day 1',         instructor: 'Course Specialist',   desc: 'Core skill-building and hands-on creation' },
  { day: 4, label: 'Build Day 2',         instructor: 'Course Specialist',   desc: 'Advanced features, monetisation, polish' },
  { day: 5, label: 'Launch & GTM',        instructor: 'Growth Marketer',     desc: 'Distribution, marketing, student showcase' },
]

export const COURSE_LIST = Object.values(COURSES)

export function getInstructorType(courseId, day) {
  if (day === 1) return 'AI Educator'
  if (day === 2) return 'Business Strategist'
  if (day === 5) return 'Growth Marketer'
  if (day === 3 || day === 4) return courseId === 'c1' ? 'Roblox Expert' : 'AI Educator'
  return 'AI Educator'
}

export function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
