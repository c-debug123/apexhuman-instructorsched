import { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { addDays } from '../data/courses'

export function useSlots({ dayFilter = null, courseFilter = null } = {}) {
  const { cohorts, courses, modules, claims } = useApp()

  return useMemo(() => {
    const slots = []

    for (const cohort of cohorts) {
      const course   = courses.find(c => c.id === cohort.courseId)
      if (!course) continue
      const courseDays = course.days || []
      const dayCount   = courseDays.length > 0 ? courseDays.length : 5

      for (let section = 1; section <= cohort.sections; section++) {
        for (let dayIdx = 0; dayIdx < dayCount; dayIdx++) {
          const day    = dayIdx + 1
          const date   = addDays(cohort.startDate, dayIdx)
          const dayDef = courseDays[dayIdx]
          const module = dayDef?.moduleId ? modules.find(m => m.id === dayDef.moduleId) : null

          // Instructor type: use module name if defined, else fallback label
          const instructorType = dayDef?.label || module?.name || `Day ${day}`

          const claim = claims.find(
            cl => cl.cohortId === cohort.id && cl.day === day && cl.section === section
          )

          slots.push({
            id: `${cohort.id}-d${day}-s${section}`,
            cohortId: cohort.id,
            courseId: cohort.courseId,
            course,
            day,
            section,
            sections: cohort.sections,
            date,
            instructorType,
            moduleId: dayDef?.moduleId || null,
            moduleName: module?.name || null,
            startTime: dayDef?.startTime || null,
            hoursPerDay: dayDef?.hoursPerDay || null,
            claim: claim || null,
          })
        }
      }
    }

    let filtered = slots
    if (dayFilter)    filtered = filtered.filter(s => s.day === dayFilter)
    if (courseFilter) filtered = filtered.filter(s => s.courseId === courseFilter)

    filtered.sort((a, b) => a.date.localeCompare(b.date) || a.day - b.day || a.section - b.section)
    return filtered
  }, [cohorts, courses, modules, claims, dayFilter, courseFilter])
}

export function useSlotsForCohort(cohortId) {
  const { cohorts, courses, modules, claims } = useApp()
  return useMemo(() => {
    const cohort = cohorts.find(c => c.id === cohortId)
    if (!cohort) return []
    const course     = courses.find(c => c.id === cohort.courseId)
    const courseDays = course?.days || []
    const dayCount   = courseDays.length > 0 ? courseDays.length : 5
    const slots      = []

    for (let section = 1; section <= cohort.sections; section++) {
      for (let dayIdx = 0; dayIdx < dayCount; dayIdx++) {
        const day    = dayIdx + 1
        const date   = addDays(cohort.startDate, dayIdx)
        const dayDef = courseDays[dayIdx]
        const module = dayDef?.moduleId ? modules.find(m => m.id === dayDef.moduleId) : null
        const instructorType = dayDef?.label || module?.name || `Day ${day}`
        const claim  = claims.find(cl => cl.cohortId === cohortId && cl.day === day && cl.section === section)

        slots.push({
          id: `${cohortId}-d${day}-s${section}`,
          cohortId,
          courseId: cohort.courseId,
          day,
          section,
          sections: cohort.sections,
          date,
          instructorType,
          moduleId: dayDef?.moduleId || null,
          moduleName: module?.name || null,
          startTime: dayDef?.startTime || null,
          hoursPerDay: dayDef?.hoursPerDay || null,
          claim: claim || null,
        })
      }
    }
    return slots
  }, [cohorts, courses, modules, claims, cohortId])
}

export function useStats() {
  const { cohorts, courses, claims } = useApp()
  return useMemo(() => {
    const totalSlots = cohorts.reduce((sum, c) => {
      const course   = courses.find(x => x.id === c.courseId)
      const dayCount = course?.days?.length || 5
      return sum + c.sections * dayCount
    }, 0)
    const filled      = claims.length
    const open        = totalSlots - filled
    const courseIds   = new Set(cohorts.map(c => c.courseId))
    return { totalSlots, filled, open, coursesRunning: courseIds.size }
  }, [cohorts, courses, claims])
}
