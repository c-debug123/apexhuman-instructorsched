import { useEffect, useCallback } from 'react'
import { useApp } from '../context/AppContext'

export function useNotifications() {
  const { notifications, markNotificationRead, markAllNotificationsRead, currentInstructor } = useApp()

  const instructorId = currentInstructor?.id || null

  const mine = (notifications || []).filter(n =>
    n.instructorId === null || n.instructorId === instructorId
  ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const unreadCount = mine.filter(n => !n.readAt).length

  const markRead = useCallback((id) => {
    markNotificationRead(id)
  }, [markNotificationRead])

  const markAll = useCallback(() => {
    markAllNotificationsRead()
  }, [markAllNotificationsRead])

  return { notifications: mine, unreadCount, markRead, markAll }
}
