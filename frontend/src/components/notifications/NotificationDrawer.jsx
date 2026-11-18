import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { X, BellOff, CheckCheck, Trash2 } from 'lucide-react'
import { useNotifications } from '../../context/NotificationContext'
import './NotificationDrawer.css'

const TYPE_EMOJI = {
  parcel_booked:     '📦',
  status_changed:    '🚚',
  otp_sent:          '🔑',
  delivery_complete: '🎉',
  success:           '✅',
  error:             '❌',
  warning:           '⚠️',
  info:              'ℹ️',
}

function relTime(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return new Date(iso).toLocaleDateString('en-GH', { day: 'numeric', month: 'short' })
}

function NotificationDrawer({ open, onClose }) {
  const { notifications, unreadCount, markRead, markAllRead, clearAll } = useNotifications()
  const drawerRef = useRef(null)

  /* Close on outside click */
  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose])

  /* Close on Escape */
  useEffect(() => {
    if (!open) return
    function handler(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        className={`notif-backdrop${open ? ' notif-backdrop--open' : ''}`}
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        className={`notif-drawer${open ? ' notif-drawer--open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Notifications"
      >
        {/* Header */}
        <div className="notif-drawer-header">
          <div>
            <h2 className="notif-drawer-title">Notifications</h2>
            {unreadCount > 0 && (
              <span className="notif-unread-pill">{unreadCount} unread</span>
            )}
          </div>
          <div className="notif-drawer-actions">
            {unreadCount > 0 && (
              <button className="notif-action-btn" onClick={markAllRead} title="Mark all read">
                <CheckCheck size={16} />
              </button>
            )}
            {notifications.length > 0 && (
              <button className="notif-action-btn notif-action-btn--danger" onClick={clearAll} title="Clear all">
                <Trash2 size={16} />
              </button>
            )}
            <button className="notif-action-btn" onClick={onClose} aria-label="Close">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="notif-list">
          {notifications.length === 0 ? (
            <div className="notif-empty">
              <BellOff size={28} className="notif-empty-icon" />
              <p>No notifications yet</p>
              <span>Activity will appear here as you use the app.</span>
            </div>
          ) : (
            notifications.map((n) => (
              <NotifItem key={n.id} n={n} onRead={markRead} onClose={onClose} />
            ))
          )}
        </div>
      </div>
    </>
  )
}

function NotifItem({ n, onRead, onClose }) {
  const emoji = TYPE_EMOJI[n.type] || 'ℹ️'

  function handleClick() {
    onRead(n.id)
    onClose()
  }

  const inner = (
    <div className={`notif-item${n.read ? '' : ' notif-item--unread'}`} onClick={() => onRead(n.id)}>
      <span className="notif-item-emoji" aria-hidden="true">{emoji}</span>
      <div className="notif-item-content">
        {n.title && <strong className="notif-item-title">{n.title}</strong>}
        {n.body  && <p className="notif-item-body">{n.body}</p>}
        <span className="notif-item-time">{relTime(n.createdAt)}</span>
      </div>
      {!n.read && <span className="notif-item-dot" aria-label="Unread" />}
    </div>
  )

  return n.trackingId ? (
    <Link to={`/customer/parcels/${n.trackingId}`} onClick={handleClick} className="notif-item-link">
      {inner}
    </Link>
  ) : inner
}

export default NotificationDrawer
