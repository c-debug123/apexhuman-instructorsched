import { COURSES } from '../data/courses'

export default function CourseBadge({ courseId, size = 'md', showName = true }) {
  const course = COURSES[courseId]
  if (!course) return null
  const dotSize = size === 'sm' ? 7 : 9
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{
        width: dotSize, height: dotSize, borderRadius: '50%',
        background: course.color, flexShrink: 0,
        boxShadow: `0 0 6px ${course.color}66`,
      }} />
      {showName && (
        <span style={{
          fontFamily: 'Space Grotesk', fontWeight: 600,
          fontSize: size === 'sm' ? 12 : 13, color: 'var(--text-1)',
        }}>
          {course.code}: {size === 'sm' ? course.shortName : course.name}
        </span>
      )}
    </span>
  )
}

export function CourseColorBar({ courseId }) {
  const course = COURSES[courseId]
  if (!course) return null
  return <div style={{ width: 3, borderRadius: 2, background: course.color, alignSelf: 'stretch' }} />
}
