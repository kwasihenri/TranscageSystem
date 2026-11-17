import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Truck, Layers, CheckCircle, MapPin, ArrowRight } from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import TcIllustration from '../../components/common/TcIllustration'
import './Dashboard.css'

function DriverDashboard() {
  const { user } = useAuth()
  const firstName = user?.name?.split(' ')[0] || 'Driver'
  const vehicle   = user?.vehicle || 'No vehicle assigned'
  const [available, setAvailable] = useState(false)

  const stats = [
    { label: 'Completed Today', value: 0, icon: CheckCircle, color: 'green' },
    { label: 'Assigned Jobs',   value: 0, icon: Truck,       color: 'blue' },
    { label: 'Open Manifests',  value: 0, icon: Layers,      color: 'amber' },
  ]

  return (
    <div className="dashboard-page">
      {/* Welcome */}
      <div className="dashboard-welcome">
        <div className="dashboard-welcome-inner">
          <div className="welcome-text">
            <h1 className="welcome-greeting">
              Ready, <span>{firstName}</span>?
            </h1>
            <p className="welcome-meta">{vehicle} · Driver</p>
          </div>
          <div className="welcome-actions">
            <Link to="/driver/jobs" className="btn btn-primary">
              <Truck size={15} />
              My Jobs
            </Link>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="dashboard-body">
        <div className="dashboard-section">
          {/* Availability toggle */}
          <div className={`availability-toggle ${available ? 'available' : 'busy'}`}>
            <div className="toggle-info">
              <div className="toggle-status">
                {available ? '🟢 You are Available' : '🔴 You are Offline'}
              </div>
              <div className="toggle-desc">
                {available
                  ? 'You can receive new delivery assignments.'
                  : 'Toggle on to start receiving jobs.'}
              </div>
            </div>
            <label className="toggle-switch" aria-label="Toggle availability">
              <input
                type="checkbox"
                checked={available}
                onChange={(e) => setAvailable(e.target.checked)}
              />
              <span className="toggle-track" />
            </label>
          </div>

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

          {/* Active job */}
          <div className="section-header">
            <span className="section-title">Active Job</span>
          </div>
          <div className="card">
            <div className="empty-state">
              <TcIllustration type="empty-canvas" size={120} />
              <p className="empty-state-title">No active job</p>
              <p className="empty-state-body">
                Toggle yourself available to start receiving delivery assignments.
              </p>
            </div>
          </div>

          {/* Upcoming */}
          <div className="section-header">
            <span className="section-title">Upcoming Jobs</span>
            <Link to="/driver/jobs" className="btn btn-ghost btn-sm">
              See all <ArrowRight size={13} />
            </Link>
          </div>
          <div className="card">
            <div className="empty-state" style={{ padding: '24px 16px' }}>
              <p className="empty-state-body">No upcoming jobs assigned yet.</p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="dashboard-section">
          <div className="section-header">
            <span className="section-title">Quick Actions</span>
          </div>
          <div className="quick-actions-grid">
            {[
              { to: '/driver/jobs',      icon: Truck,   label: 'My Jobs',    desc: 'View all assignments' },
              { to: '/driver/manifests', icon: Layers,  label: 'Manifests',  desc: 'Intercity trips' },
              { to: '/driver/location',  icon: MapPin,  label: 'Location',   desc: 'Share live position' },
              { to: '/track',            icon: CheckCircle, label: 'History', desc: 'Completed deliveries' },
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

          {/* Delivery tips */}
          <div className="card">
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p className="section-title">📦 Pickup flow</p>
              <ol style={{ paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 6, listStyle: 'decimal', color: 'var(--text-secondary)', fontSize: 13 }}>
                <li>Accept the assignment</li>
                <li>Arrive at pickup point</li>
                <li>Verify sender's OTP</li>
                <li>Deliver and collect receiver's OTP</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DriverDashboard
