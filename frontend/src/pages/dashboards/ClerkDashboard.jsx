import { Link } from 'react-router-dom'
import { Package, ScanLine, Layers, ArrowRight, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import TcIllustration from '../../components/common/TcIllustration'
import './Dashboard.css'

function ClerkDashboard() {
  const { user } = useAuth()
  const firstName = user?.name?.split(' ')[0] || 'Clerk'
  const station   = user?.station || 'Your Station'

  const stats = [
    { label: 'Checked In',    value: 0, icon: ArrowDownToLine, color: 'blue' },
    { label: 'Dispatched',    value: 0, icon: ArrowUpFromLine, color: 'green' },
    { label: 'Pending OTP',   value: 0, icon: Package,         color: 'amber' },
    { label: 'Open Manifests',value: 0, icon: Layers,          color: 'gray' },
  ]

  return (
    <div className="dashboard-page">
      {/* Welcome */}
      <div className="dashboard-welcome">
        <div className="dashboard-welcome-inner">
          <div className="welcome-text">
            <h1 className="welcome-greeting">
              Good day, <span>{firstName}</span>
            </h1>
            <p className="welcome-meta">{station} · Station Clerk</p>
          </div>
          <div className="welcome-actions">
            <Link to="/clerk/scan" className="btn btn-primary">
              <ScanLine size={15} />
              Scan Parcel
            </Link>
            <Link to="/clerk/manifests" className="btn btn-secondary">
              <Layers size={15} />
              Manifests
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

          {/* Parcels awaiting action */}
          <div className="section-header">
            <span className="section-title">Awaiting Check-In</span>
            <Link to="/clerk/parcels" className="btn btn-ghost btn-sm">
              All parcels <ArrowRight size={13} />
            </Link>
          </div>

          <div className="card">
            <div className="empty-state">
              <TcIllustration type="scan-ready" size={130} />
              <p className="empty-state-title">Queue is clear</p>
              <p className="empty-state-body">
                No parcels are waiting to be scanned in. Use the Scan button to check in an arriving parcel.
              </p>
              <Link to="/clerk/scan" className="btn btn-primary" style={{ marginTop: 8 }}>
                <ScanLine size={15} />
                Scan a Parcel
              </Link>
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
              { to: '/clerk/scan',       icon: ScanLine,         label: 'Scan In',       desc: 'Receive a parcel' },
              { to: '/clerk/manifests',  icon: Layers,           label: 'Manifests',     desc: 'Create / view trips' },
              { to: '/clerk/parcels',    icon: Package,          label: 'All Parcels',   desc: 'Search & manage' },
              { to: '/clerk/otp-verify', icon: ArrowUpFromLine,  label: 'Verify OTP',    desc: 'Hand over to receiver' },
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

          {/* Reminders */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Today's Reminders</span>
            </div>
            <div className="empty-state" style={{ padding: '24px 16px' }}>
              <p className="empty-state-body">No pending reminders for today.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClerkDashboard
