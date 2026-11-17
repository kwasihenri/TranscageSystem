import { useState, useEffect } from 'react'
import { MapPin } from 'lucide-react'
import { getStationStats } from '../../services/admin.service'
import './AdminPages.css'

function StationsPage() {
  const [stations, setStations] = useState([])
  const [loading, setLoading]  = useState(true)

  useEffect(() => { getStationStats().then(setStations).finally(() => setLoading(false)) }, [])

  const activeCount = stations.filter((s) => s.atStation > 0).length

  return (
    <div className="admin-subpage">
      <div className="admin-subpage-header">
        <div>
          <h1 className="page-title">Stations</h1>
          <p className="page-subtitle">{loading ? '…' : `${activeCount} active · ${stations.length - activeCount} idle`}</p>
        </div>
      </div>

      <div className="page-container" style={{ paddingTop: 20, paddingBottom: 48 }}>
        {loading ? (
          <div className="stations-grid">
            {[1,2,3,4].map((n) => <div key={n} className="card skeleton" style={{ height: 120 }} />)}
          </div>
        ) : (
          <div className="stations-grid">
            {stations.map((s) => (
              <div key={s.id} className="station-admin-card card">
                <div className="station-admin-top">
                  <div>
                    <div className="station-admin-name">{s.name}</div>
                    <div className="station-admin-city">
                      <MapPin size={11} style={{ verticalAlign: -1 }} /> {s.city}
                    </div>
                  </div>
                  <span className={`badge ${s.atStation > 0 ? 'badge-green' : 'badge-gray'}`}>
                    {s.atStation > 0 ? 'Active' : 'Idle'}
                  </span>
                </div>

                <div className="station-admin-mini-stats">
                  <div className="station-admin-stat">
                    <strong>{s.atStation}</strong>
                    <label>At Station</label>
                  </div>
                  <div className="station-admin-stat">
                    <strong>{s.totalIn}</strong>
                    <label>Total In</label>
                  </div>
                  <div className="station-admin-stat">
                    <strong>{s.totalOut}</strong>
                    <label>Total Out</label>
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

export default StationsPage
