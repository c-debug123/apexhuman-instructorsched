import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

// ── Auth helpers ───────────────────────────────────────────────────────────────
async function resolveInstructor(email) {
  if (!email) return null
  const { data } = await supabase
    .from('instructors')
    .select('*')
    .ilike('email', email)
    .single()
  return data ? toInstructor(data) : null
}

const AppContext = createContext(null)

// ── snake_case → camelCase transforms ─────────────────────────────────────────
function toModule(r)  { return { id: r.id, name: r.name, description: r.description, tags: r.tags || [], durationHours: r.duration_hours ?? 2, createdAt: r.created_at } }
function toCourse(r)  { return { id: r.id, code: r.code, name: r.name, fullTitle: r.full_title, shortName: r.short_name, color: r.color, num: r.num, track: r.track, days: r.days || [], groups: r.groups || [], createdAt: r.created_at } }
function toCohort(r)  { return { id: r.id, courseId: r.course_id, startDate: r.start_date, sections: r.sections, slotDates: r.slot_dates || [], createdAt: r.created_at } }
function toInstructor(r) { return { id: r.id, name: r.name, email: r.email, eligibleGroups: r.eligible_groups || [], createdAt: r.created_at } }
function toClaim(r)   { return { id: r.id, cohortId: r.cohort_id, day: r.day, section: r.section, date: r.date, instructorType: r.instructor_type, instructorId: r.instructor_id, instructorName: r.instructor_name, claimedAt: r.created_at } }
function toNotif(r)   { return { id: r.id, type: r.type, title: r.title, message: r.message, instructorId: r.instructor_id, readAt: r.read_at, createdAt: r.created_at } }


export function AppProvider({ children }) {
  const [modules,       setModules]       = useState([])
  const [courses,       setCourses]       = useState([])
  const [cohorts,       setCohorts]       = useState([])
  const [claims,        setClaims]        = useState([])
  const [instructors,   setInstructors]   = useState([])
  const [notifications, setNotifications] = useState([])
  const [isLoading,     setIsLoading]     = useState(true)
  const [currentInstructor, setCurrentInstructor] = useState(null)
  const [authLoading,   setAuthLoading]   = useState(true)
  const [authError,     setAuthError]     = useState(null)
  const channelRef = useRef(null)

  // ── Initial load ─────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const [mod, crs, coh, inst, clm, notif] = await Promise.all([
        supabase.from('modules').select('*').order('created_at'),
        supabase.from('courses').select('*').order('num'),
        supabase.from('cohorts').select('*').order('created_at'),
        supabase.from('instructors').select('*').order('created_at'),
        supabase.from('claims').select('*').order('created_at'),
        supabase.from('notifications').select('*').order('created_at', { ascending: false }),
      ])
      setModules((mod.data   || []).map(toModule))
      setCourses((crs.data   || []).map(toCourse))
      setCohorts((coh.data   || []).map(toCohort))
      setInstructors((inst.data || []).map(toInstructor))
      setClaims((clm.data    || []).map(toClaim))
      setNotifications((notif.data || []).map(toNotif))
      setIsLoading(false)
    }
    load()
  }, [])

  // ── Auth ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session?.user) {
        setCurrentInstructor(null)
        setAuthLoading(false)
        return
      }
      const inst = await resolveInstructor(session.user.email)
      if (inst) {
        setCurrentInstructor(inst)
        setAuthError(null)
      } else {
        await supabase.auth.signOut()
        setCurrentInstructor(null)
        setAuthError('Your Google account is not on the instructor roster. Contact your administrator to be added.')
      }
      setAuthLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null)
    localStorage.setItem('apex_role', 'instructor')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) setAuthError(error.message)
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setCurrentInstructor(null)
    setAuthError(null)
    localStorage.removeItem('apex_role')
  }, [])

  // ── Realtime: notifications + cohorts (new slots alert) ──────────────────────
  useEffect(() => {
    if (channelRef.current) return

    channelRef.current = supabase
      .channel('app-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, ({ new: r }) => {
        setNotifications(prev => [toNotif(r), ...prev])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications' }, ({ new: r }) => {
        setNotifications(prev => prev.map(n => n.id === r.id ? toNotif(r) : n))
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'cohorts' }, ({ new: r }) => {
        setCohorts(prev => { if (prev.find(c => c.id === r.id)) return prev; return [...prev, toCohort(r)] })
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'cohorts' }, ({ old: r }) => {
        setCohorts(prev => prev.filter(c => c.id !== r.id))
        setClaims(prev => prev.filter(cl => cl.cohortId !== r.id))
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'claims' }, ({ new: r }) => {
        setClaims(prev => { if (prev.find(c => c.id === r.id)) return prev; return [...prev, toClaim(r)] })
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'claims' }, ({ old: r }) => {
        setClaims(prev => prev.filter(c => c.id !== r.id))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
  }, [])

  // ── Modules ───────────────────────────────────────────────────────────────────
  const addModule = useCallback(async (m) => {
    const { data, error } = await supabase.from('modules').insert({
      id: m.id, name: m.name, description: m.description || null,
      tags: m.tags || [], duration_hours: m.durationHours ?? 2,
    }).select().single()
    if (error) { console.error('addModule failed:', error); return { error: error.message } }
    setModules(prev => [...prev, toModule(data)])
    return { error: null }
  }, [])

  const updateModule = useCallback(async (m) => {
    const { data, error } = await supabase.from('modules').update({
      name: m.name, description: m.description || null,
      tags: m.tags || [], duration_hours: m.durationHours ?? 2,
    }).eq('id', m.id).select().single()
    if (error) { console.error('updateModule failed:', error); return { error: error.message } }
    setModules(prev => prev.map(x => x.id === m.id ? toModule(data) : x))
    return { error: null }
  }, [])

  const deleteModule = useCallback(async (id) => {
    const { error } = await supabase.from('modules').delete().eq('id', id)
    if (error) { console.error('deleteModule failed:', error); return { error: error.message } }
    setModules(prev => prev.filter(x => x.id !== id))
    return { error: null }
  }, [])

  // ── Courses ───────────────────────────────────────────────────────────────────
  const addCourse = useCallback(async (c) => {
    const row = { id: c.id, code: c.code, name: c.name, full_title: c.fullTitle || null, short_name: c.shortName || null, color: c.color || null, num: c.num || null, track: c.track || null, days: c.days || [], groups: c.groups || [] }
    const { data, error } = await supabase.from('courses').insert(row).select().single()
    if (!error && data) {
      setCourses(prev => [...prev, toCourse(data)])
      await supabase.from('notifications').insert({ type: 'new_course', title: `New course added: ${c.name}`, message: `${c.code}: ${c.fullTitle || c.name}`, instructor_id: null })
    }
  }, [])

  const updateCourse = useCallback(async (c) => {
    const row = { code: c.code, name: c.name, full_title: c.fullTitle || null, short_name: c.shortName || null, color: c.color || null, num: c.num || null, track: c.track || null, days: c.days || [], groups: c.groups || [] }
    const { data, error } = await supabase.from('courses').update(row).eq('id', c.id).select().single()
    if (!error && data) setCourses(prev => prev.map(x => x.id === c.id ? toCourse(data) : x))
  }, [])

  const deleteCourse = useCallback(async (id) => {
    const { error } = await supabase.from('courses').delete().eq('id', id)
    if (!error) setCourses(prev => prev.filter(x => x.id !== id))
  }, [])

  // ── Cohorts ───────────────────────────────────────────────────────────────────
  const addCohort = useCallback(async (cohort) => {
    const row = { id: cohort.id, course_id: cohort.courseId, start_date: cohort.startDate, sections: cohort.sections, slot_dates: cohort.slotDates || [] }
    const { data, error } = await supabase.from('cohorts').insert(row).select().single()
    if (!error && data) {
      setCohorts(prev => [...prev, toCohort(data)])
      const course = courses.find(c => c.id === cohort.courseId)
      await supabase.from('notifications').insert({
        type: 'new_slots',
        title: `New slots open: ${course?.name ?? 'New course'}`,
        message: `${cohort.sections} section${cohort.sections !== 1 ? 's' : ''} starting ${cohort.startDate}`,
        instructor_id: null,
      })
    }
  }, [courses])

  const deleteCohort = useCallback(async (id) => {
    const { error } = await supabase.from('cohorts').delete().eq('id', id)
    if (!error) {
      setCohorts(prev => prev.filter(c => c.id !== id))
      setClaims(prev => prev.filter(cl => cl.cohortId !== id))
    }
  }, [])

  // ── Claims ────────────────────────────────────────────────────────────────────
  const addClaim = useCallback(async (cl) => {
    // Optimistic update — show immediately, roll back on failure
    setClaims(prev => [...prev, cl])
    const row = { id: cl.id, cohort_id: cl.cohortId, day: cl.day, section: cl.section, date: cl.date || null, instructor_type: cl.instructorType || null, instructor_id: cl.instructorId || null, instructor_name: cl.instructorName }
    const { data, error } = await supabase.from('claims').insert(row).select().single()
    if (error) {
      console.error('addClaim failed:', error)
      setClaims(prev => prev.filter(c => c.id !== cl.id))
    } else if (data) {
      setClaims(prev => prev.map(c => c.id === cl.id ? toClaim(data) : c))
    }
  }, [])

  const removeClaim = useCallback(async (id) => {
    // Optimistic update — remove immediately, restore on failure
    setClaims(prev => prev.filter(cl => cl.id !== id))
    const { error } = await supabase.from('claims').delete().eq('id', id)
    if (error) {
      console.error('removeClaim failed:', error)
      // Re-fetch claims to restore state
      const { data } = await supabase.from('claims').select('*').order('created_at')
      if (data) setClaims(data.map(toClaim))
    }
  }, [])

  // ── Instructors ───────────────────────────────────────────────────────────────
  const addInstructor = useCallback(async (inst) => {
    const { data, error } = await supabase.from('instructors')
      .insert({ id: inst.id, name: inst.name, email: inst.email || null, eligible_groups: inst.eligibleGroups || [] })
      .select().single()
    if (error || !data) return
    setInstructors(prev => [...prev, toInstructor(data)])
  }, [])

  const updateInstructor = useCallback(async (inst) => {
    const { data, error } = await supabase.from('instructors')
      .update({ name: inst.name, email: inst.email || null, eligible_groups: inst.eligibleGroups || [] })
      .eq('id', inst.id).select().single()
    if (error || !data) return
    setInstructors(prev => prev.map(x => x.id === inst.id ? toInstructor(data) : x))
  }, [])

  const deleteInstructor = useCallback(async (id) => {
    const { error } = await supabase.from('instructors').delete().eq('id', id)
    if (!error) setInstructors(prev => prev.filter(x => x.id !== id))
  }, [])

  // ── Notifications ─────────────────────────────────────────────────────────────
  const pushNotification = useCallback(async (notif) => {
    await supabase.from('notifications').insert({ type: notif.type, title: notif.title, message: notif.message || null, instructor_id: notif.instructorId || null })
  }, [])

  const markNotificationRead = useCallback(async (id) => {
    const now = new Date().toISOString()
    const { error } = await supabase.from('notifications').update({ read_at: now }).eq('id', id)
    if (!error) setNotifications(prev => prev.map(n => n.id === id ? { ...n, readAt: now } : n))
  }, [])

  const markAllNotificationsRead = useCallback(async () => {
    const now = new Date().toISOString()
    const unreadIds = notifications.filter(n => !n.readAt).map(n => n.id)
    if (unreadIds.length === 0) return
    const { error } = await supabase.from('notifications').update({ read_at: now }).in('id', unreadIds)
    if (!error) setNotifications(prev => prev.map(n => n.readAt ? n : { ...n, readAt: now }))
  }, [notifications])

  // ── Reset all (admin) ─────────────────────────────────────────────────────────
  const resetAll = useCallback(async () => {
    await Promise.all([
      supabase.from('claims').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('cohorts').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('instructors').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('modules').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('courses').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    ])
    setCohorts([]); setClaims([]); setNotifications([]); setInstructors([]); setModules([]); setCourses([])
  }, [])

  return (
    <AppContext.Provider value={{
      isLoading,
      currentInstructor, authLoading, authError, signInWithGoogle, signOut,
      modules, courses, cohorts, claims, instructors, notifications,
      addModule, updateModule, deleteModule,
      addCourse, updateCourse, deleteCourse,
      addCohort, deleteCohort,
      addClaim, removeClaim,
      addInstructor, updateInstructor, deleteInstructor,
      pushNotification, markNotificationRead, markAllNotificationsRead,
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
