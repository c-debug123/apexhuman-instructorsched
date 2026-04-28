import { createContext, useContext, useState, useEffect, useCallback } from 'react'

// ── Supabase import (uncomment once env vars are set) ──────────────────────
// import { supabase } from '../lib/supabase'

const AppContext = createContext(null)

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback }
  catch { return fallback }
}

function persist(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function AppProvider({ children }) {
  // ── Core data ──────────────────────────────────────────────────────────────
  const [modules,       setModules]       = useState(() => load('apex_modules',       []))
  const [courses,       setCourses]       = useState(() => load('apex_courses',       []))
  const [cohorts,       setCohorts]       = useState(() => load('apex_cohorts',       []))
  const [claims,        setClaims]        = useState(() => load('apex_claims',        []))
  const [instructors,   setInstructors]   = useState(() => load('apex_instructors',   []))
  const [notifications, setNotifications] = useState(() => load('apex_notifications', []))

  // ── Persist on change ──────────────────────────────────────────────────────
  useEffect(() => persist('apex_modules',       modules),       [modules])
  useEffect(() => persist('apex_courses',       courses),       [courses])
  useEffect(() => persist('apex_cohorts',       cohorts),       [cohorts])
  useEffect(() => persist('apex_claims',        claims),        [claims])
  useEffect(() => persist('apex_instructors',   instructors),   [instructors])
  useEffect(() => persist('apex_notifications', notifications), [notifications])

  // ── Modules ────────────────────────────────────────────────────────────────
  const addModule    = useCallback(m  => setModules(prev => [...prev, m]),                                  [])
  const updateModule = useCallback(m  => setModules(prev => prev.map(x => x.id === m.id ? m : x)),         [])
  const deleteModule = useCallback(id => setModules(prev => prev.filter(x => x.id !== id)),                [])

  // ── Courses ────────────────────────────────────────────────────────────────
  const addCourse    = useCallback(c  => setCourses(prev => [...prev, c]),                                  [])
  const updateCourse = useCallback(c  => setCourses(prev => prev.map(x => x.id === c.id ? c : x)),         [])
  const deleteCourse = useCallback(id => setCourses(prev => prev.filter(x => x.id !== id)),                [])

  // ── Cohorts ────────────────────────────────────────────────────────────────
  const addCohort = useCallback((cohort) => setCohorts(prev => [...prev, cohort]), [])
  const deleteCohort = useCallback((id) => {
    setCohorts(prev => prev.filter(c => c.id !== id))
    setClaims(prev => prev.filter(cl => cl.cohortId !== id))
  }, [])

  // ── Claims ─────────────────────────────────────────────────────────────────
  const addClaim    = useCallback(cl => setClaims(prev => [...prev, cl]),                                   [])
  const removeClaim = useCallback(id => setClaims(prev => prev.filter(cl => cl.id !== id)),                [])

  // ── Instructors ────────────────────────────────────────────────────────────
  const addInstructor    = useCallback(i  => setInstructors(prev => [...prev, i]),                          [])
  const updateInstructor = useCallback(i  => setInstructors(prev => prev.map(x => x.id === i.id ? i : x)), [])
  const deleteInstructor = useCallback(id => setInstructors(prev => prev.filter(x => x.id !== id)),        [])

  // ── Notifications ──────────────────────────────────────────────────────────
  const pushNotification = useCallback((notif) => {
    setNotifications(prev => [{ id: crypto.randomUUID(), readAt: null, createdAt: new Date().toISOString(), ...notif }, ...prev])
  }, [])

  const markNotificationRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
  }, [])

  const markAllNotificationsRead = useCallback(() => {
    const now = new Date().toISOString()
    setNotifications(prev => prev.map(n => n.readAt ? n : { ...n, readAt: now }))
  }, [])

  // ── Admin helpers that also push notifications ─────────────────────────────
  const addCohortWithNotif = useCallback((cohort) => {
    addCohort(cohort)
    const course = courses.find(c => c.id === cohort.courseId)
    pushNotification({
      type: 'new_slots',
      title: `New slots open: ${course?.name ?? 'New course'}`,
      message: `${cohort.sections} section${cohort.sections !== 1 ? 's' : ''} starting ${cohort.startDate}`,
      instructorId: null,
    })
  }, [addCohort, courses, pushNotification])

  const addCourseWithNotif = useCallback((course) => {
    addCourse(course)
    pushNotification({
      type: 'new_course',
      title: `New course added: ${course.name}`,
      message: `${course.code}: ${course.fullTitle || course.name}`,
      instructorId: null,
    })
  }, [addCourse, pushNotification])

  // ── Reset all (admin) ──────────────────────────────────────────────────────
  const resetAll = useCallback(() => {
    setCohorts([]); setClaims([]); setNotifications([])
  }, [])

  return (
    <AppContext.Provider value={{
      // data
      modules, courses, cohorts, claims, instructors, notifications,
      // modules
      addModule, updateModule, deleteModule,
      // courses (use addCourseWithNotif for admin-initiated adds)
      addCourse: addCourseWithNotif, updateCourse, deleteCourse,
      // cohorts (use addCohortWithNotif for admin-initiated adds)
      addCohort: addCohortWithNotif, deleteCohort,
      // claims
      addClaim, removeClaim,
      // instructors
      addInstructor, updateInstructor, deleteInstructor,
      // notifications
      pushNotification, markNotificationRead, markAllNotificationsRead,
      // misc
      resetAll,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
