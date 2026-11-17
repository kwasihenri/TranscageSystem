import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package, Truck, MapPin, CheckCircle, BarChart3, Users, Layers, AlertCircle } from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import { getSystemStats, getAllParcels, getDriverRoster } from '../../services/admin.service'
import { STATUS_CONFIG, STATIONS } from '../../constants/parcel'
import '../dashboards/Dashboard.css'

function getStationName(id) { return STATIONS.find((s) => s.id === id)?.name || id }

function relTime(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(iso).toLocaleDateString('en-GH', { day: 'numeric', month: 'short' })
}

function AdminDashboard() {
  const { user } = useAuth()
  const firstName = user?.name?.split(' ')[0] || 'Admin'

  const [stats,   setStats]   = useState(null)
  const [parcels, setParcels] = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getSystemStats(), getAllParcels(), getDriverRoster()])
      .then(([s, p, d]) => { setStats(s); setParcels(p); setDrivers(d) })
      .finally(() => setLoading(false))
  }, [])

  const statCards = [
    { label: 'Total Parcels',   value: stats?.totalParcels   ?? '—', icon: Package,      color: 'blue'  },
    { label: 'In Transit',      value: stats?.inTransit      ?? '—', icon: Truck,        color: 'amber' },
    { label: 'At Stations',     value: stats?.atStations     ?? '—', icon: MapPin,       color: 'gray'  },
    { label: 'Total Delivered', value: stats?.totalDelivered ?? '—', icon: CheckCircle,  color: 'green' },
  ]

  const recentParcels = [...parcels]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6)

  const onlineDrivers = drivers.filter((d) => d.status === 'online').length

  return (
    <div className="dashboard-page">
      {/* Welcome */}
      <div className="dashboard-welcome">
        <div className="dashboard-welcome-inner">
          <div className="welcome-text">
            <h1 className="welcome-greeting">Command Center, <span>{firstName}</span></h1>
            <p className="welcome-meta">Admin · System Overview</p>
          </div>
          <div className="welcome-actions">
            <Link to="/admin/parcels"  className="btn btn-primary"><Package size={14} /> All Parcels</Link>
            <Link to="/admin/reports"  className="btn btn-secondary"><BarChart3 size={14} /> Reports</Link>
          </div>
        </div>
      </div>

      <div className="dashboard-body">
        {/* Left column */}
        <div className="dashboard-section">
          {/* Stats */}
          <div className="stats-row">
            {statCards.map((s) => (
              <div key={s.label} className="stat-card card">
                <div className={`stat-icon stat-icon--${s.color}`}><s.icon size={16} /></div>
                <div className="stat-value">{loading ? '—' : s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Recent parcels */}
          <div className="section-header">
            <span className="section-title">Recent Parcels</span>
            <Link to="/admin/parcels" className="btn btn-ghost btn-sm">View all →</Link>
          </div>
          <div className="card">
            {loading ? (
              [1,2,3].map((n) => <div key={n} className="list-item"><div className="skeleton" style={{ flex:1, height:36 }} /></div>)
            ) : recentParcels.map((p) => {
              const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.created
              return (
                <div key={p.trackingId} className="list-item">
                  <div className="list-item-icon"><Package size={14} /></div>
                  <div className="list-item-content">
                    <div className="list-item-label">{p.trackingId}</div>
                    <div className="list-item-meta">
                      {getStationName(p.originStation)} → {getStationName(p.destinationStation)} · {p.receiverName}
                    </div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:3 }}>
                    <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
                    <span style={{ fontSize:11, color:'var(--text-muted)' }}>{relTime(p.createdAt)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right column */}
        <div className="dashboard-section">
          {/* Quick actions */}
          <div className="section-header"><span className="section-title">Manage</span></div>
          <div className="quick-actions-grid">
            {[
              { to: '/admin/parcels',  icon: Package,   label: 'All Parcels', desc: 'Monitor every delivery'   },
              { to: '/admin/drivers',  icon: Users,     label: 'Drivers',     desc: 'Roster & live status'     },
              { to: '/admin/stations', icon: MapPin,    label: 'Stations',    desc: 'Station parcel counts'    },
              { to: '/admin/reports',  icon: BarChart3, label: 'Reports',     desc: 'Delivery analytics'       },
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

          {/* System health */}
          <div className="section-header" style={{ marginTop: 4 }}><span className="section-title">System Status</span></div>
          <div className="card">
            {[
              { label: 'Drivers Online',     value: loading ? '—' : `${onlineDrivers} / ${drivers.length}`, ok: onlineDrivers > 0 },
              { label: 'Active Manifests',   value: loading ? '—' : (stats?.activeManifests ?? 0),          ok: true },
              { label: 'Stations Covered',   value: loading ? '—' : (stats?.stations ?? 0),                 ok: true },
            ].map((row) => (
              <div key={row.label} className="list-item">
                <div className="list-item-icon" style={{ background: row.ok ? 'var(--success-light)' : 'var(--warning-light)', color: row.ok ? 'var(--success)' : 'var(--warning)' }}>
                  {row.ok ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                </div>
                <div className="list-item-content">
                  <div className="list-item-label">{row.label}</div>
                </div>
                <strong style={{ fontSize: 14 }}>{row.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
