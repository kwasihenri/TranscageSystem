import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Truck, Layers, CheckCircle, MapPin, ArrowRight, Package } from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import {
  getDriverJobs,
  getDriverAvailability,
  setDriverAvailability,
} from '../../services/driver.service'
import TcIllustration from '../../components/common/TcIllustration'
import './Dashboard.css'

function DriverDashboard() {
  const { user } = useAuth()
  const firstName = user?.name?.split(' ')[0] || 'Driver'

  const [isAvailable, setIsAvailable] = useState(getDriverAvailability)
  const [jobs,    setJobs]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDriverJobs(user?.name).then(setJobs).finally(() => setLoading(false))
  }, [user?.name])

  function toggleAvailability() {
    const next = !isAvailable
    setIsAvailable(next)
    setDriverAvailability(next)
  }

  const activeJob    = jobs.find((j) => j.status === 'dispatched')
  const completedToday = jobs.filter((j) => j.status === 'arrived').length
  const totalParcels   = jobs.reduce((acc, j) => acc + (j.parcels?.length || 0), 0)

  const stats = [
    { label: 'Trips Done',  value: completedToday, icon: CheckCircle, color: 'green' },
    { label: 'Parcels',     value: totalParcels,   icon: Package,     color: 'blue'  },
    { label: 'Active Job',  value: activeJob ? 1 : 0, icon: Truck,   color: 'amber' },
  ]

  return (
    <div className="dashboard-page">
      {/* Welcome */}
      <div className="dashboard-welcome">
        <div className="dashboard-welcome-inner">
          <div className="welcome-text">
            <h1 className="welcome-greeting">Hey, <span>{firstName}</span> 👋</h1>
            <p className="welcome-meta">Driver · {user?.station || 'On the Road'}</p>
          </div>
          {/* Availability toggle */}
          <div className="driver-avail-wrap">
            <span className={`avail-label${isAvailable ? ' avail-label--on' : ''}`}>
              {isAvailable ? '🟢 Online' : '⚫ Offline'}
            </span>
            <button
              className={`avail-toggle${isAvailable ? ' on' : ''}`}
              onClick={toggleAvailability}
              aria-label={isAvailable ? 'Go offline' : 'Go online'}
              id="driver-availability-toggle"
            >
              <span className="avail-thumb" />
            </button>
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

          {/* Active job */}
          <div className="section-header">
            <span className="section-title">Active Job</span>
            <Link to="/driver/jobs" className="btn btn-ghost btn-sm">All jobs →</Link>
          </div>
          <div className="card">
            {loading ? (
              <div style={{ padding: 16 }}><div className="skeleton" style={{ height: 64, borderRadius: 4 }} /></div>
            ) : !isAvailable ? (
              <div className="empty-state" style={{ padding: '20px 16px' }}>
                <TcIllustration type="empty-canvas" size={110} />
                <p className="empty-state-title">You are offline</p>
                <p className="empty-state-body">Toggle online to receive job assignments from dispatch.</p>
              </div>
            ) : !activeJob ? (
              <div className="empty-state" style={{ padding: '20px 16px' }}>
                <TcIllustration type="empty-canvas" size={110} />
                <p className="empty-state-title">No active job</p>
                <p className="empty-state-body">You'll be notified when dispatch assigns a manifest to you.</p>
              </div>
            ) : (
              <Link
                to={`/driver/jobs/${activeJob.id}`}
                className="list-item"
                style={{ textDecoration: 'none', color: 'inherit', padding: '14px 16px' }}
              >
                <div className="list-item-icon" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>
                  <Truck size={16} />
                </div>
                <div className="list-item-content">
                  <div className="list-item-label">{activeJob.id}</div>
                  <div className="list-item-meta">
                    {activeJob.destinationStation} · {activeJob.parcels.length} parcels
                  </div>
                </div>
                <span className="badge badge-amber">En Route</span>
              </Link>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="dashboard-section">
          <div className="section-header"><span className="section-title">Quick Actions</span></div>
          <div className="quick-actions-grid">
            {[
              { to: '/driver/jobs',      icon: Layers,   label: 'My Jobs',  desc: 'Assigned manifests'  },
              { to: '/driver/location',  icon: MapPin,   label: 'Location', desc: 'Update your position'},
              { to: '/driver/manifests', icon: Truck,    label: 'Trips',    desc: 'Past deliveries'     },
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

          {/* Recent jobs */}
          {jobs.length > 0 && (
            <>
              <div className="section-header" style={{ marginTop: 4 }}>
                <span className="section-title">Recent Jobs</span>
              </div>
              <div className="card">
                {jobs.slice(0, 3).map((j) => (
                  <Link
                    key={j.id}
                    to={`/driver/jobs/${j.id}`}
                    className="list-item"
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div className="list-item-icon"><Layers size={14} /></div>
                    <div className="list-item-content">
                      <div className="list-item-label">{j.id}</div>
                      <div className="list-item-meta">{j.parcels.length} parcels · {j.destinationStation}</div>
                    </div>
                    <span className={`badge ${j.status === 'dispatched' ? 'badge-amber' : 'badge-green'}`}>
                      {j.status === 'dispatched' ? 'En Route' : 'Done'}
                    </span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default DriverDashboard
