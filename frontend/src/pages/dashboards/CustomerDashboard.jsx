import { Link } from 'react-router-dom'
import { Package, PlusCircle, ArrowRight, Clock, CheckCircle, Truck } from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import TcIllustration from '../../components/common/TcIllustration'
import './Dashboard.css'

function CustomerDashboard() {
  const { user } = useAuth()
  const firstName = user?.name?.split(' ')[0] || 'there'

  const stats = [
    { label: 'Active',      value: 0, icon: Package,       color: 'blue',  trend: null },
    { label: 'In Transit',  value: 0, icon: Truck,         color: 'amber', trend: null },
    { label: 'Delivered',   value: 0, icon: CheckCircle,   color: 'green', trend: null },
  ]

  return (
    <div className="dashboard-page">
      {/* Welcome */}
      <div className="dashboard-welcome">
        <div className="dashboard-welcome-inner">
          <div className="welcome-text">
            <h1 className="welcome-greeting">Hello, <span>{firstName}</span> 👋</h1>
            <p className="welcome-meta">Here's a summary of your parcels.</p>
          </div>
          <div className="welcome-actions">
            <Link to="/customer/send" className="btn btn-primary">
              <PlusCircle size={15} />
              Send Parcel
            </Link>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="dashboard-body">
        {/* Main column */}
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

          {/* Recent parcels */}
          <div className="section-header">
            <span className="section-title">Recent Parcels</span>
            <Link to="/customer/parcels" className="btn btn-ghost btn-sm">
              View all <ArrowRight size={13} />
            </Link>
          </div>

          <div className="card">
            <div className="empty-state">
              <TcIllustration type="empty-parcels" size={140} />
              <p className="empty-state-title">No parcels yet</p>
              <p className="empty-state-body">
                Send your first parcel and it will appear here with live tracking.
              </p>
              <Link to="/customer/send" className="btn btn-primary" style={{ marginTop: 8 }}>
                <PlusCircle size={15} />
                Send a Parcel
              </Link>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="dashboard-section">
          {/* Quick actions */}
          <div className="section-header">
            <span className="section-title">Quick Actions</span>
          </div>
          <div className="quick-actions-grid">
            {[
              { to: '/customer/send', icon: PlusCircle, label: 'Send',  desc: 'Book a new parcel' },
              { to: '/track',         icon: Package,    label: 'Track', desc: 'Enter a Tracking ID' },
              { to: '/customer/parcels', icon: Clock,  label: 'History', desc: 'Past deliveries' },
            ].map((a) => (
              <Link key={a.to} to={a.to} className="quick-action-card">
                <div className="quick-action-icon"><a.icon size={16} /></div>
                <div>
                  <div className="quick-action-label">{a.label}</div>
                  <div className="quick-action-desc">{a.desc}</div>
                </div>
              </Link>
            ))}
          </div>

          {/* Tip card */}
          <div className="card">
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p className="section-title">💡 How it works</p>
              <ol style={{ paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 6, listStyle: 'decimal', color: 'var(--text-secondary)', fontSize: 13 }}>
                <li>Book a parcel and get a Tracking ID + QR label</li>
                <li>Drop it at the nearest station or request pickup</li>
                <li>Track it live all the way to the receiver</li>
                <li>Receiver uses a 6-digit code to collect safely</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomerDashboard
