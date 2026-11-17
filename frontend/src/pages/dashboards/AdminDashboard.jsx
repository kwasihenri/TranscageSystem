import { Link } from 'react-router-dom'
import { Package, Truck, Building2, BarChart2, Users, ArrowRight, Activity } from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import './Dashboard.css'

function AdminDashboard() {
  const { user } = useAuth()
  const firstName = user?.name?.split(' ')[0] || 'Admin'

  const stats = [
    { label: 'Active Deliveries', value: 0, icon: Package,   color: 'blue' },
    { label: 'Drivers Online',    value: 0, icon: Truck,     color: 'green' },
    { label: 'Stations',          value: 0, icon: Building2, color: 'gray' },
    { label: 'Today\'s Volume',   value: 0, icon: Activity,  color: 'amber' },
  ]

  const managementLinks = [
    { to: '/admin/parcels',  icon: Package,   label: 'All Parcels',  desc: 'Monitor every delivery' },
    { to: '/admin/drivers',  icon: Truck,     label: 'Drivers',      desc: 'Approve & manage drivers' },
    { to: '/admin/stations', icon: Building2, label: 'Stations',     desc: 'Add or edit points' },
    { to: '/admin/users',    icon: Users,     label: 'Users',        desc: 'Customer accounts' },
    { to: '/admin/reports',  icon: BarChart2, label: 'Reports',      desc: 'Activity summaries' },
  ]

  return (
    <div className="dashboard-page">
      {/* Welcome */}
      <div className="dashboard-welcome">
        <div className="dashboard-welcome-inner">
          <div className="welcome-text">
            <h1 className="welcome-greeting">
              Admin Panel — <span>{firstName}</span>
            </h1>
            <p className="welcome-meta">System overview · Transcage Operations</p>
          </div>
          <div className="welcome-actions">
            <Link to="/admin/reports" className="btn btn-secondary">
              <BarChart2 size={15} />
              Reports
            </Link>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="dashboard-body">
        <div className="dashboard-section">
          {/* Stats */}
          <div className="stats-row">
            {stats.map((s) => (
              <div key={s.label} className="stat-card card">
                <div className={`stat-icon stat-icon--${s.color}`}>
                  <s.icon size={16} strokeWidth={2} />
                </div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* System activity */}
          <div className="section-header">
            <span className="section-title">Recent System Activity</span>
            <Link to="/admin/parcels" className="btn btn-ghost btn-sm">
              View all <ArrowRight size={13} />
            </Link>
          </div>
          <div className="card">
            <div className="empty-state">
              <p className="empty-state-title">No activity yet</p>
              <p className="empty-state-body">
                System events (parcel bookings, driver assignments, OTP verifications) will appear here in real time.
              </p>
            </div>
          </div>

          {/* Driver status */}
          <div className="section-header">
            <span className="section-title">Driver Status</span>
            <Link to="/admin/drivers" className="btn btn-ghost btn-sm">
              Manage <ArrowRight size={13} />
            </Link>
          </div>
          <div className="card">
            <div className="empty-state" style={{ padding: '24px 16px' }}>
              <p className="empty-state-body">No drivers registered yet. Add drivers to see their status here.</p>
              <Link to="/admin/drivers" className="btn btn-secondary btn-sm" style={{ marginTop: 10 }}>
                <Truck size={13} /> Add Driver
              </Link>
            </div>
          </div>
        </div>

        {/* Sidebar — management links */}
        <div className="dashboard-section">
          <div className="section-header">
            <span className="section-title">Management</span>
          </div>
          <div className="card">
            {managementLinks.map((link) => (
              <Link key={link.to} to={link.to} className="list-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="list-item-icon">
                  <link.icon size={16} strokeWidth={1.8} />
                </div>
                <div className="list-item-content">
                  <div className="list-item-label">{link.label}</div>
                  <div className="list-item-meta">{link.desc}</div>
                </div>
                <ArrowRight size={14} color="var(--text-muted)" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
