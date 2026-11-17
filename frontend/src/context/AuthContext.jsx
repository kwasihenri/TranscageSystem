import { createContext, useContext, useState, useCallback } from 'react'
import api from '../services/api'

/**
 * Demo accounts — only used as a fallback when the backend is unreachable
 * during development. Remove or ignore in production.
 */
const DEMO_ACCOUNTS = [
  { id: 'u-001', name: 'Admin User',    phone: '0200000001', password: 'admin1234',  role: 'admin'    },
  { id: 'u-002', name: 'Kwame Asante',  phone: '0200000002', password: 'clerk1234',  role: 'clerk',   station: 'Takoradi Station' },
  { id: 'u-003', name: 'Kofi Mensah',   phone: '0200000003', password: 'driver1234', role: 'driver',  vehicle: 'GR-2341-21' },
  { id: 'u-004', name: 'Abena Osei',    phone: '0200000004', password: 'cust1234',   role: 'customer' },
]

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('tc_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading]       = useState(false)
  const [authError, setAuthError]   = useState(null)
  const [notifications, setNotifications] = useState(0)

  /* ── persist user ─────────────────────────────────── */
  function persistUser(userData, token) {
    localStorage.setItem('tc_user', JSON.stringify(userData))
    if (token) localStorage.setItem('tc_token', token)
    setUser(userData)
  }

  /* ── login ────────────────────────────────────────── */
  const login = useCallback(async (phone, password) => {
    setLoading(true)
    setAuthError(null)
    try {
      // Real backend
      const res = await api.post('/auth/login', { phone, password })
      persistUser(res.user, res.token)
      return res.user
    } catch {
      // Dev fallback — demo accounts
      if (import.meta.env.DEV) {
        const demo = DEMO_ACCOUNTS.find(
          (a) => a.phone === phone.replace(/\s/g, '') && a.password === password
        )
        if (demo) {
          // eslint-disable-next-line no-unused-vars
          const { password: _pw, ...userData } = demo
          persistUser(userData, null)
          return userData
        }
      }
      const msg = 'Incorrect phone number or password.'
      setAuthError(msg)
      throw new Error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  /* ── register ─────────────────────────────────────── */
  const register = useCallback(async (name, phone, password) => {
    setLoading(true)
    setAuthError(null)
    try {
      const res = await api.post('/auth/register', { name, phone, password, role: 'customer' })
      persistUser(res.user, res.token)
      return res.user
    } catch (err) {
      const msg = err.message || 'Registration failed. Please try again.'
      setAuthError(msg)
      throw new Error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  /* ── logout ───────────────────────────────────────── */
  const logout = useCallback(() => {
    localStorage.removeItem('tc_user')
    localStorage.removeItem('tc_token')
    setUser(null)
    setNotifications(0)
  }, [])

  const value = {
    user,
    loading,
    authError,
    notifications,
    setNotifications,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
