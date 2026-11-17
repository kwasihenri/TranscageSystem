import { Navigate, useLocation } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'

/**
 * ProtectedRoute — gate for authenticated-only pages.
 *
 * Props:
 *   allowedRoles?: string[]  — if provided, only these roles can access the route.
 *                              All authenticated users pass if omitted.
 *   children: ReactNode
 *
 * Unauthenticated → /login  (preserves intended destination)
 * Wrong role      → /dashboard  (redirects to their own dashboard)
 */
function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default ProtectedRoute
