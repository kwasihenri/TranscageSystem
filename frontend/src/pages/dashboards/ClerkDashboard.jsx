import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownToLine, ArrowUpFromLine, Package, Layers, ScanLine } from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import { getStationParcels, clerkGetManifests } from '../../services/clerk.service'
import TcIllustration from '../../components/common/TcIllustration'
import '../dashboards/Dashboard.css'

function ClerkDashboard() {
  const { user } = useAuth()
  const firstName = user?.name?.split(' ')[0] || 'Clerk'
  const station   = user?.station || 'Your Station'

  const [parcels,   setParcels]   = useState([])
  const [manifests, setManifests] = useState([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([getStationParcels(), clerkGetManifests()])
      .then(([p, m]) => { setParcels(p); setManifests(m) })
      .finally(() => setLoading(false))
  }, [])

  const checkedInToday = parcels.filter((p) =>
    ['at_origin', 'at_destination'].includes(p.status) &&
    new Date(p.createdAt).toDateString() === new Date().toDateString()
  ).length

  const dispatchedToday = parcels.filter((p) =>
    p.status === 'in_transit' &&
    new Date(p.createdAt).toDateString() === new Date().toDateString()
  ).length

  const pendingOtp   = parcels.filter((p) => p.status === 'at_destination').length
  const openManifests = manifests.filter((m) => m.status === 'open').length

  const stats = [
    { label: 'Checked In',     value: checkedInToday, icon: ArrowDownToLine, color: 'blue'  },
    { label: 'Dispatched',     value: dispatchedToday,icon: ArrowUpFromLine, color: 'green' },
    { label: 'Pending OTP',    value: pendingOtp,     icon: Package,          color: 'amber' },
    { label: 'Open Manifests', value: openManifests,  icon: Layers,           color: 'gray'  },
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
              <ScanLine size={15} /> Scan Parcel
            </Link>
            <Link to="/clerk/manifests" className="btn btn-secondary">
              <Layers size={15} /> Manifests
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
                <div className="stat-value">{loading ? '—' : s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Pending OTP */}
          <div className="section-header">
            <span className="section-title">Awaiting Receiver Collection</span>
            <Link to="/clerk/parcels" className="btn btn-ghost btn-sm">All parcels →</Link>
          </div>
          <div className="card">
            {loading ? (
              <div style={{ padding: 16 }}>
                <div className="skeleton" style={{ height: 48, borderRadius: 4 }} />
              </div>
            ) : parcels.filter((p) => p.status === 'at_destination').length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 16px' }}>
                <TcIllustration type="scan-ready" size={110} />
                <p className="empty-state-title">Queue is clear</p>
                <p className="empty-state-body">No parcels waiting for OTP collection.</p>
              </div>
            ) : (
              parcels.filter((p) => p.status === 'at_destination').map((p) => (
                <Link
                  key={p.id}
                  to="/clerk/scan"
                  className="list-item"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div className="list-item-icon" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>
                    <Package size={15} />
                  </div>
                  <div className="list-item-content">
                    <div className="list-item-label">{p.trackingId}</div>
                    <div className="list-item-meta">For: {p.receiverName}</div>
                  </div>
                  <span className="badge badge-amber">OTP Pending</span>
                </Link>
              ))
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
              { to: '/clerk/scan',       icon: ScanLine,         label: 'Scan In',      desc: 'Receive a parcel' },
              { to: '/clerk/manifests',  icon: Layers,           label: 'Manifests',    desc: 'Create / view trips' },
              { to: '/clerk/parcels',    icon: Package,          label: 'All Parcels',  desc: 'Search & manage' },
              { to: '/clerk/otp-verify', icon: ArrowUpFromLine,  label: 'Verify OTP',   desc: 'Hand over to receiver' },
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

          {/* Open manifests list */}
          <div className="section-header" style={{ marginTop: 4 }}>
            <span className="section-title">Open Manifests</span>
            <Link to="/clerk/manifests" className="btn btn-ghost btn-sm">View all →</Link>
          </div>
          <div className="card">
            {loading ? (
              <div style={{ padding: 12 }}><div className="skeleton" style={{ height: 36, borderRadius: 4 }} /></div>
            ) : manifests.filter((m) => m.status === 'open').length === 0 ? (
              <div className="empty-state" style={{ padding: '20px 16px' }}>
                <p className="empty-state-body">No open manifests.</p>
                <Link to="/clerk/manifests" className="btn btn-secondary btn-sm" style={{ marginTop: 8 }}>
                  <Layers size={13} /> Create Manifest
                </Link>
              </div>
            ) : (
              manifests.filter((m) => m.status === 'open').map((m) => (
                <Link
                  key={m.id}
                  to="/clerk/manifests"
                  className="list-item"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div className="list-item-icon"><Layers size={14} /></div>
                  <div className="list-item-content">
                    <div className="list-item-label">{m.id}</div>
                    <div className="list-item-meta">{m.parcels.length} parcels · {m.destinationStation || 'No destination'}</div>
                  </div>
                  <span className="badge badge-blue">Open</span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClerkDashboard
