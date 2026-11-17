import { useState, useEffect } from 'react'
import { Users, Truck, Package, Star } from 'lucide-react'
import { getDriverRoster } from '../../services/admin.service'
import './AdminPages.css'

function DriversPage() {
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('All')

  useEffect(() => { getDriverRoster().then(setDrivers).finally(() => setLoading(false)) }, [])

  const online = drivers.filter((d) => d.status === 'online').length
  const filtered = filter === 'All' ? drivers : drivers.filter((d) => d.status === filter.toLowerCase())

  return (
    <div className="admin-subpage">
      <div className="admin-subpage-header">
        <div>
          <h1 className="page-title">Drivers</h1>
          <p className="page-subtitle">{loading ? '…' : `${online} online · ${drivers.length - online} offline`}</p>
        </div>

        <div className="filter-tabs" role="tablist">
          {['All', 'Online', 'Offline'].map((f) => (
            <button key={f} role="tab" aria-selected={filter === f}
              className={`filter-tab${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
              {f !== 'All' && (
                <span className="filter-count">
                  {drivers.filter((d) => d.status === f.toLowerCase()).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="page-container" style={{ paddingTop: 20, paddingBottom: 48 }}>
        {loading ? (
          <div className="drivers-grid">
            {[1,2,3].map((n) => <div key={n} className="card skeleton" style={{ height: 120 }} />)}
          </div>
        ) : (
          <div className="drivers-grid">
            {filtered.map((d) => (
              <div key={d.id} className="driver-card card">
                <div className="driver-avatar">{d.name[0]}</div>
                <div className="driver-info" style={{ flex: 1 }}>
                  <div className="driver-name">{d.name}</div>
                  <div className={`driver-status driver-status--${d.status}`}>
                    {d.status === 'online' ? '🟢 Online' : '⚫ Offline'}
                  </div>
                  <div className="driver-station">{d.station}</div>
                  <div className="driver-mini-stats" style={{ marginTop: 10 }}>
                    <div className="driver-mini-stat">
                      <strong>{d.trips}</strong>
                      <label>Trips</label>
                    </div>
                    <div className="driver-mini-stat">
                      <strong>{d.parcels}</strong>
                      <label>Parcels</label>
                    </div>
                    <div className="driver-mini-stat">
                      <strong style={{ color: 'var(--warning)' }}>{d.rating}</strong>
                      <label>Rating</label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default DriversPage
