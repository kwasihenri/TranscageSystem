import { X } from 'lucide-react'
import './Toast.css'

const TYPE_CFG = {
  success: { emoji: '✅', cls: 'toast--success' },
  error:   { emoji: '❌', cls: 'toast--error'   },
  warning: { emoji: '⚠️', cls: 'toast--warning' },
  info:    { emoji: 'ℹ️', cls: 'toast--info'    },
  parcel_booked:    { emoji: '📦', cls: 'toast--success' },
  status_changed:   { emoji: '🚚', cls: 'toast--info'    },
  otp_sent:         { emoji: '🔑', cls: 'toast--warning' },
  delivery_complete:{ emoji: '🎉', cls: 'toast--success' },
}

function Toast({ toast, onDismiss }) {
  const cfg = TYPE_CFG[toast.type] || TYPE_CFG.info

  return (
    <div className={`toast ${cfg.cls}`} role="alert" aria-live="assertive">
      <span className="toast-emoji" aria-hidden="true">{cfg.emoji}</span>
      <div className="toast-content">
        {toast.title && <strong className="toast-title">{toast.title}</strong>}
        {toast.body  && <p className="toast-body">{toast.body}</p>}
      </div>
      <button
        className="toast-close"
        onClick={() => onDismiss(toast.toastId)}
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export default Toast
