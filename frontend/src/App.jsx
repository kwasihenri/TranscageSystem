import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import useAuth from './hooks/useAuth'
import { NAV_LINKS } from './constants/navLinks'
import AppShell from './components/layout/AppShell'
import ProtectedRoute from './components/routing/ProtectedRoute'

// Pages — public
import HomePage     from './pages/HomePage'
import LoginPage    from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

// Dashboards
import CustomerDashboard from './pages/dashboards/CustomerDashboard'
import ClerkDashboard    from './pages/dashboards/ClerkDashboard'
import DriverDashboard   from './pages/dashboards/DriverDashboard'
import AdminDashboard    from './pages/dashboards/AdminDashboard'

import './styles/global.css'

/** Redirects /dashboard to the role-specific dashboard URL. */
function DashboardRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  const roleRoutes = {
    customer: '/customer/dashboard',
    clerk:    '/clerk/dashboard',
    driver:   '/driver/dashboard',
    admin:    '/admin/dashboard',
  }
  return <Navigate to={roleRoutes[user.role] || '/login'} replace />
}

/** Inner component — lives inside AuthProvider so useAuth() works. */
function AppRoutes() {
  const { user, notifications } = useAuth()
  const navLinks = user ? (NAV_LINKS[user.role] || []) : []

  return (
    <AppShell user={user} navLinks={navLinks} notifications={notifications}>
      <Routes>
        {/* ── Public ──────────────────────────────── */}
        <Route path="/"         element={<HomePage />} />
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/track"    element={<Navigate to="/" replace />} /> {/* Phase 4 */}

        {/* ── Dashboard hub (role redirect) ──────── */}
        <Route path="/dashboard" element={
          <ProtectedRoute><DashboardRedirect /></ProtectedRoute>
        } />

        {/* ── Customer ────────────────────────────── */}
        <Route path="/customer/dashboard" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/customer/*" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <Navigate to="/customer/dashboard" replace />
          </ProtectedRoute>
        } />

        {/* ── Clerk ───────────────────────────────── */}
        <Route path="/clerk/dashboard" element={
          <ProtectedRoute allowedRoles={['clerk']}>
            <ClerkDashboard />
          </ProtectedRoute>
        } />
        <Route path="/clerk/*" element={
          <ProtectedRoute allowedRoles={['clerk']}>
            <Navigate to="/clerk/dashboard" replace />
          </ProtectedRoute>
        } />

        {/* ── Driver ──────────────────────────────── */}
        <Route path="/driver/dashboard" element={
          <ProtectedRoute allowedRoles={['driver']}>
            <DriverDashboard />
          </ProtectedRoute>
        } />
        <Route path="/driver/*" element={
          <ProtectedRoute allowedRoles={['driver']}>
            <Navigate to="/driver/dashboard" replace />
          </ProtectedRoute>
        } />

        {/* ── Admin ───────────────────────────────── */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/*" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Navigate to="/admin/dashboard" replace />
          </ProtectedRoute>
        } />

        {/* ── Dev tools (Phase 12) ────────────────── */}
        <Route path="/dev/*" element={<Navigate to="/" replace />} />

        {/* ── 404 ─────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
