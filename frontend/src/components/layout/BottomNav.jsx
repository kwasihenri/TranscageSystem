import { NavLink } from 'react-router-dom'
import './BottomNav.css'

/**
 * Mobile-only bottom navigation bar.
 * Receives the same navLinks array as Header for consistency.
 *
 * navLinks shape:
 *   [{ to, label, icon: LucideComponent, badge?: number, end?: bool }]
 */
function BottomNav({ navLinks = [] }) {
  if (navLinks.length === 0) return null

  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {navLinks.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          className={({ isActive }) =>
            `bottom-nav-item${isActive ? ' active' : ''}`
          }
          aria-label={link.label}
        >
          <span className="bottom-nav-icon">
            {link.icon && (
              <link.icon size={22} strokeWidth={1.8} aria-hidden="true" />
            )}
            {link.badge > 0 && (
              <span className="bottom-nav-badge">
                {link.badge > 9 ? '9+' : link.badge}
              </span>
            )}
          </span>
          <span>{link.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

export default BottomNav
