import { NavLink, Link } from 'react-router-dom'
import { Bell, Package } from 'lucide-react'
import TcIcon from '../common/TcIcon'
import './Header.css'

/**
 * App top navigation bar.
 * nav links and avatar are driven by the authenticated user passed as props.
 * When no user is provided (unauthenticated), only the brand is shown.
 */
function Header({ user = null, navLinks = [], notificationCount = 0 }) {
  const initials = user
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : ''

  return (
    <header className="app-header">
      {/* Brand */}
      <Link to="/" className="header-brand" aria-label="Transcage home">
        <TcIcon size={28} wordmark />
      </Link>

      {/* Desktop nav links (role-specific, injected by parent) */}
      {navLinks.length > 0 && (
        <nav className="header-nav" aria-label="Main navigation">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `header-nav-link${isActive ? ' active' : ''}`
              }
              end={link.end}
            >
              {link.icon && <link.icon size={15} strokeWidth={2} />}
              {link.label}
            </NavLink>
          ))}
        </nav>
      )}

      {/* Right-side actions */}
      <div className="header-actions">
        {/* Notification bell (only when logged in) */}
        {user && (
          <button
            className="header-icon-btn"
            aria-label={`Notifications${notificationCount > 0 ? `, ${notificationCount} unread` : ''}`}
          >
            <Bell size={18} strokeWidth={1.8} />
            {notificationCount > 0 && (
              <span className="header-notif-badge" aria-hidden="true" />
            )}
          </button>
        )}

        {/* Quick track button (always visible) */}
        <button
          className="header-icon-btn"
          aria-label="Track a parcel"
          title="Track a parcel"
        >
          <Package size={18} strokeWidth={1.8} />
        </button>

        {/* User avatar / name */}
        {user && (
          <button className="header-avatar-btn" aria-label="Open account menu">
            <span className="header-avatar" aria-hidden="true">
              {initials}
            </span>
            <span className="header-avatar-name">{user.name.split(' ')[0]}</span>
          </button>
        )}
      </div>
    </header>
  )
}

export default Header
