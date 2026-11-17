import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import './styles/global.css'

/**
 * Root router.
 * Auth state and role-based nav links will be injected via context in Phase 2.
 * For Phase 1 we wire up the shell and public routes.
 */
function App() {
  // Placeholder — replaced with real auth context in Phase 2
  const user = null
  const navLinks = []
  const notifications = 0

  return (
    <BrowserRouter>
      <AppShell user={user} navLinks={navLinks} notifications={notifications}>
        <Routes>
          {/* Public routes */}
          <Route path="/"       element={<HomePage />} />
          <Route path="/login"  element={<LoginPage />} />

          {/* Stubs for upcoming phases — redirect to home until built */}
          <Route path="/register"   element={<Navigate to="/login" replace />} />
          <Route path="/track"      element={<Navigate to="/" replace />} />
          <Route path="/dashboard"  element={<Navigate to="/login" replace />} />
          <Route path="/dev/*"      element={<Navigate to="/" replace />} />

          {/* 404 fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  )
}

export default App
