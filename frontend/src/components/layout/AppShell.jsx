import Header from './Header'
import BottomNav from './BottomNav'
import './AppShell.css'

/**
 * AppShell — the master layout wrapper.
 *
 * Props:
 *   user         — authenticated user object (null = unauthenticated)
 *   navLinks     — array of nav link configs for Header + BottomNav
 *   notifications — number of unread notifications
 *   children     — page content
 */
function AppShell({ user = null, navLinks = [], notifications = 0, children }) {
  return (
    <div className="app-shell">
      <Header
        user={user}
        navLinks={navLinks}
        notificationCount={notifications}
      />

      <main className="app-content" id="main-content">
        {children}
      </main>

      {user && (
        <BottomNav navLinks={navLinks} />
      )}
    </div>
  )
}

export default AppShell
