import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package, PlusCircle, ArrowRight, Clock, CheckCircle, Truck } from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import { getMyParcels } from '../../services/parcel.service'
import { STATUS_CONFIG, STATIONS } from '../../constants/parcel'
import TcIllustration from '../../components/common/TcIllustration'
import './Dashboard.css'

function getRouteShort(parcel) {
  const city = (id) => STATIONS.find((s) => s.id === id)?.city || id
  if (parcel.deliveryType === 'intercity')
    return `${city(parcel.originStation)} → ${city(parcel.destinationStation)}`
  return `${parcel.pickupAddress} → ${parcel.dropoffAddress}`
}

function CustomerDashboard() {
  const { user } = useAuth()
  const firstName = user?.name?.split(' ')[0] || 'there'

  const [parcels, setParcels]   = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    getMyParcels().then(setParcels).finally(() => setLoading(false))
  }, [])

  const active    = parcels.filter((p) => ['created', 'at_origin'].includes(p.status)).length
  const inTransit = parcels.filter((p) => ['in_transit', 'at_destination'].includes(p.status)).length
  const delivered = parcels.filter((p) => p.status === 'delivered').length
  const recent    = parcels.slice(0, 5)

  const stats = [
    { label: 'Active',      value: active,    icon: Package,       color: 'blue'  },
    { label: 'In Transit',  value: inTransit,  icon: Truck,         color: 'amber' },
    { label: 'Delivered',   value: delivered,  icon: CheckCircle,   color: 'green' },
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
                <div className="stat-value">{loading ? '—' : s.value}</div>
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
            {loading ? (
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1, 2].map((n) => (
                  <div key={n} className="skeleton" style={{ height: 48, borderRadius: 4 }} />
                ))}
              </div>
            ) : recent.length === 0 ? (
              <div className="empty-state">
                <TcIllustration type="empty-parcels" size={140} />
                <p className="empty-state-title">No parcels yet</p>
                <p className="empty-state-body">
                  Send your first parcel and it will appear here with live tracking.
                </p>
                <Link to="/customer/send" className="btn btn-primary" style={{ marginTop: 8 }}>
                  <PlusCircle size={15} /> Send a Parcel
                </Link>
              </div>
            ) : (
              recent.map((p) => {
                const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.created
                return (
                  <Link
                    key={p.id}
                    to={`/customer/parcels/${p.trackingId}`}
                    className="list-item"
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div className="list-item-icon" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                      <Package size={15} />
                    </div>
                    <div className="list-item-content">
                      <div className="list-item-label">{p.trackingId}</div>
                      <div className="list-item-meta">{getRouteShort(p)}</div>
                    </div>
                    <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
                  </Link>
                )
              })
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="dashboard-section">
          <div className="section-header">
            <span className="section-title">Quick Actions</span>
          </div>
          <div className="quick-actions-grid">
            {[
              { to: '/customer/send',    icon: PlusCircle, label: 'Send',    desc: 'Book a new parcel' },
              { to: '/track',            icon: Package,    label: 'Track',   desc: 'Enter a Tracking ID' },
              { to: '/customer/parcels', icon: Clock,      label: 'History', desc: 'Past deliveries' },
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
