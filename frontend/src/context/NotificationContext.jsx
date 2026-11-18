/**
 * NotificationContext — global in-app notification system.
 *
 * Provides:
 *   notifications  — array of all stored notifications (newest first)
 *   unreadCount    — number of unread notifications
 *   toasts         — active toast queue (auto-dismissed)
 *   push(n)        — add a notification + show a toast
 *   markRead(id)   — mark one notification as read
 *   markAllRead()  — mark all as read
 *   clearAll()     — remove all notifications
 *   dismissToast(id)
 */
import { createContext, useContext, useState, useCallback } from 'react'

const STORAGE_KEY = 'tc_notifications'
const MAX_STORED  = 60
const TOAST_TTL   = 4500 // ms

function loadStored() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] } catch { return [] }
}

function saveStored(list) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_STORED))) } catch {}
}

export const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(() => loadStored())
  const [toasts,        setToasts]        = useState([])

  /* ── push ──────────────────────────────────────────────── */
  const push = useCallback(({ type = 'info', title, body, trackingId } = {}) => {
    const n = {
      id:         `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      title,
      body,
      trackingId,
      read:       false,
      createdAt:  new Date().toISOString(),
    }
    setNotifications((prev) => {
      const updated = [n, ...prev].slice(0, MAX_STORED)
      saveStored(updated)
      return updated
    })
    // Also queue a toast
    const toast = { ...n, toastId: `t-${n.id}` }
    setToasts((prev) => [toast, ...prev].slice(0, 4))
    setTimeout(() => dismissToast(toast.toastId), TOAST_TTL)
  }, [])

  /* ── markRead ──────────────────────────────────────────── */
  const markRead = useCallback((id) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => n.id === id ? { ...n, read: true } : n)
      saveStored(updated)
      return updated
    })
  }, [])

  /* ── markAllRead ───────────────────────────────────────── */
  const markAllRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }))
      saveStored(updated)
      return updated
    })
  }, [])

  /* ── clearAll ──────────────────────────────────────────── */
  const clearAll = useCallback(() => {
    setNotifications([])
    saveStored([])
  }, [])

  /* ── dismissToast ──────────────────────────────────────── */
  const dismissToast = useCallback((toastId) => {
    setToasts((prev) => prev.filter((t) => t.toastId !== toastId))
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, toasts, push, markRead, markAllRead, clearAll, dismissToast }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider')
  return ctx
}
