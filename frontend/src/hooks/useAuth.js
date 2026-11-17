import { useContext } from 'react'
import AuthContext from '../context/AuthContext'

/**
 * Convenience hook for consuming the auth context.
 * Throws if used outside of <AuthProvider>.
 */
function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

export default useAuth
