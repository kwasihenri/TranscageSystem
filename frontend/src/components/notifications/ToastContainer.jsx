import Toast from './Toast'
import { useNotifications } from '../../context/NotificationContext'
import './Toast.css'

function ToastContainer() {
  const { toasts, dismissToast } = useNotifications()
  if (toasts.length === 0) return null
  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <Toast key={t.toastId} toast={t} onDismiss={dismissToast} />
      ))}
    </div>
  )
}

export default ToastContainer
