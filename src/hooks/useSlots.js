import { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { COURSES, getInstructorType, addDays } from '../data/courses'

export function useSlots({ dayFilter = null, courseFilter = null } = {}) {
  const { cohorts, claims } = useApp()

  return useMemo(() => {
    const slots = []
    for (const cohort of cohorts) {
      for (let section = 1; section <= cohort.sections; section++) {
        for (let day = 1; day <= 5; day++) {
          const date = addDays(cohort.startDate, day - 1)
          const instructorType = getInstructorType(cohort.courseId, day)
          const claim = claims.find(
            cl => cl.cohortId === cohort.id && cl.day === day && cl.section === section
          )
          slots.push({
            id: `${cohort.id}-d${day}-s${section}`,
            cohortId: cohort.id,
            courseId: cohort.courseId,
            course: COURSES[cohort.courseId],
            day,
            section,
            sections: cohort.sections,
            date,
            instructorType,
            claim: claim || null,
          })
        }
      }
    }

    let filtered = slots
    if (dayFilter) filtered = filtered.filter(s => s.day === dayFilter)
    if (courseFilter) filtered = filtered.filter(s => s.courseId === courseFilter)

    filtered.sort((a, b) => a.date.localeCompare(b.date) || a.day - b.day || a.section - b.section)
    return filtered
  }, [cohorts, claims, dayFilter, courseFilter])
}

export function useSlotsForCohort(cohortId) {
  const { cohorts, claims } = useApp()
  return useMemo(() => {
    const cohort = cohorts.find(c => c.id === cohortId)
    if (!cohort) return []
    const slots = []
    for (let section = 1; section <= cohort.sections; section++) {
      for (let day = 1; day <= 5; day++) {
        const date = addDays(cohort.startDate, day - 1)
        const instructorType = getInstructorType(cohort.courseId, day)
        const claim = claims.find(cl => cl.cohortId === cohortId && cl.day === day && cl.section === section)
        slots.push({ id: `${cohortId}-d${day}-s${section}`, cohortId, courseId: cohort.courseId, day, section, sections: cohort.sections, date, instructorType, claim: claim || null })
      }
    }
    return slots
  }, [cohorts, claims, cohortId])
}

export function useStats() {
  const { cohorts, claims } = useApp()
  return useMemo(() => {
    const totalSlots = cohorts.reduce((sum, c) => sum + c.sections * 5, 0)
    const filled = claims.length
    const open = totalSlots - filled
    const courseIds = new Set(cohorts.map(c => c.courseId))
    return { totalSlots, filled, open, coursesRunning: courseIds.size }
  }, [cohorts, claims])
}
