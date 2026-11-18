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
import TrackPage    from './pages/TrackPage'
import ReceivePage  from './pages/ReceivePage'

// Clerk sub-pages
import ScanPage         from './pages/clerk/ScanPage'
import ManifestsPage   from './pages/clerk/ManifestsPage'
import ClerkParcelsPage from './pages/clerk/ClerkParcelsPage'

// Driver sub-pages
import MyJobsPage    from './pages/driver/MyJobsPage'
import JobDetailPage from './pages/driver/JobDetailPage'
import LocationPage  from './pages/driver/LocationPage'
import CustomerDashboard from './pages/dashboards/CustomerDashboard'
import ClerkDashboard    from './pages/dashboards/ClerkDashboard'
import DriverDashboard   from './pages/dashboards/DriverDashboard'
import AdminDashboard    from './pages/dashboards/AdminDashboard'

// Admin sub-pages
import AllParcelsPage from './pages/admin/AllParcelsPage'
import DriversPage    from './pages/admin/DriversPage'
import StationsPage   from './pages/admin/StationsPage'
import ReportsPage    from './pages/admin/ReportsPage'

// Customer sub-pages
import SendParcelPage    from './pages/customer/SendParcelPage'
import MyParcelsPage     from './pages/customer/MyParcelsPage'
import ParcelDetailPage  from './pages/customer/ParcelDetailPage'

import { NotificationProvider, useNotifications } from './context/NotificationContext'
import ToastContainer from './components/notifications/ToastContainer'

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
  const { user }        = useAuth()
  const { unreadCount } = useNotifications()
  const navLinks = user ? (NAV_LINKS[user.role] || []) : []

  return (
    <AppShell user={user} navLinks={navLinks} notifications={unreadCount}>
      <Routes>
        {/* ── Public ──────────────────────────────── */}
        <Route path="/"         element={<HomePage />} />
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/track"     element={<TrackPage />} />
        <Route path="/track/:id" element={<TrackPage />} />
        <Route path="/receive/:id" element={<ReceivePage />} />

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
        <Route path="/customer/send" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <SendParcelPage />
          </ProtectedRoute>
        } />
        <Route path="/customer/parcels/:id" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <ParcelDetailPage />
          </ProtectedRoute>
        } />
        <Route path="/customer/parcels" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <MyParcelsPage />
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
        <Route path="/clerk/scan" element={
          <ProtectedRoute allowedRoles={['clerk']}>
            <ScanPage />
          </ProtectedRoute>
        } />
        <Route path="/clerk/manifests" element={
          <ProtectedRoute allowedRoles={['clerk']}>
            <ManifestsPage />
          </ProtectedRoute>
        } />
        <Route path="/clerk/parcels" element={
          <ProtectedRoute allowedRoles={['clerk']}>
            <ClerkParcelsPage />
          </ProtectedRoute>
        } />
        <Route path="/clerk/otp-verify" element={
          <ProtectedRoute allowedRoles={['clerk']}>
            <ScanPage />
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
        <Route path="/driver/jobs" element={
          <ProtectedRoute allowedRoles={['driver']}>
            <MyJobsPage />
          </ProtectedRoute>
        } />
        <Route path="/driver/jobs/:id" element={
          <ProtectedRoute allowedRoles={['driver']}>
            <JobDetailPage />
          </ProtectedRoute>
        } />
        <Route path="/driver/location" element={
          <ProtectedRoute allowedRoles={['driver']}>
            <LocationPage />
          </ProtectedRoute>
        } />
        <Route path="/driver/manifests" element={
          <ProtectedRoute allowedRoles={['driver']}>
            <MyJobsPage />
          </ProtectedRoute>
        } />
        <Route path="/driver/*" element={
          <ProtectedRoute allowedRoles={['driver']}>
            <Navigate to="/driver/dashboard" replace />
          </ProtectedRoute>
        } />

        {/* ── Admin ───────────────────────────────── */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="/admin/parcels" element={
          <ProtectedRoute allowedRoles={['admin']}><AllParcelsPage /></ProtectedRoute>
        } />
        <Route path="/admin/drivers" element={
          <ProtectedRoute allowedRoles={['admin']}><DriversPage /></ProtectedRoute>
        } />
        <Route path="/admin/stations" element={
          <ProtectedRoute allowedRoles={['admin']}><StationsPage /></ProtectedRoute>
        } />
        <Route path="/admin/reports" element={
          <ProtectedRoute allowedRoles={['admin']}><ReportsPage /></ProtectedRoute>
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
      <NotificationProvider>
        <AuthProvider>
          <AppRoutes />
          <ToastContainer />
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  )
}

export default App
