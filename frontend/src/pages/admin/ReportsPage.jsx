import { useState, useEffect } from 'react'
import { BarChart3, Package, Truck, CheckCircle } from 'lucide-react'
import { getReportData } from '../../services/admin.service'
import { STATIONS } from '../../constants/parcel'
import './AdminPages.css'

function getStationCity(id) { return STATIONS.find((s) => s.id === id)?.city || id || '—' }

function relDate(iso) {
  return new Date(iso).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: '2-digit' })
}

function ReportsPage() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { getReportData().then(setData).finally(() => setLoading(false)) }, [])

  const { byStatus = {}, completionRate = 0, byCategory = {}, recentDeliveries = [] } = data || {}

  const totalDispatched = (byStatus.in_transit || 0) + (byStatus.at_destination || 0) + (byStatus.delivered || 0)
  const totalParcels    = Object.values(byStatus).reduce((a, b) => a + b, 0)
  const maxCat          = Math.max(...Object.values(byCategory), 1)

  const summaryCards = [
    { label: 'Total Parcels',   value: totalParcels,            icon: Package,     color: 'blue'  },
    { label: 'Dispatched',      value: totalDispatched,         icon: Truck,       color: 'amber' },
    { label: 'Delivered',       value: byStatus.delivered || 0, icon: CheckCircle, color: 'green' },
    { label: 'Completion Rate', value: `${completionRate}%`,    icon: BarChart3,   color: 'green' },
  ]

  return (
    <div className="admin-subpage">
      <div className="admin-subpage-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Delivery analytics across all stations</p>
        </div>
      </div>

      <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 20, paddingBottom: 48 }}>
        {/* Summary stat cards */}
        <div className="stats-row">
          {summaryCards.map((s) => (
            <div key={s.label} className="stat-card card">
              <div className={`stat-icon stat-icon--${s.color}`}><s.icon size={16} /></div>
              <div className="stat-value">{loading ? '—' : s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Completion rate bar */}
        <div className="card">
          <div className="card-header"><span className="card-title">Overall Completion Rate</span></div>
          <div className="reports-completion-row">
            <span className="reports-completion-label">Delivered</span>
            <div className="reports-bar-wrap">
              <div className="reports-bar-fill" style={{ width: loading ? '0%' : `${completionRate}%` }} />
            </div>
            <span className="reports-completion-pct">{loading ? '—' : `${completionRate}%`}</span>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="card">
          <div className="card-header"><span className="card-title">Parcel Categories</span></div>
          {loading ? (
            <div style={{ padding: 16 }}><div className="skeleton" style={{ height: 80, borderRadius: 4 }} /></div>
          ) : Object.keys(byCategory).length === 0 ? (
            <div className="card-body"><p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>No data yet.</p></div>
          ) : (
            Object.entries(byCategory)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, count]) => (
                <div key={cat} className="category-row">
                  <span className="category-name">{cat}</span>
                  <div className="category-bar-track">
                    <div className="category-bar-fill" style={{ width: `${(count / maxCat) * 100}%` }} />
                  </div>
                  <span className="category-count">{count}</span>
                </div>
              ))
          )}
        </div>

        {/* Recent deliveries table */}
        <div className="card">
          <div className="card-header"><span className="card-title">Recent Deliveries</span></div>
          {loading ? (
            <div style={{ padding: 16 }}><div className="skeleton" style={{ height: 120, borderRadius: 4 }} /></div>
          ) : recentDeliveries.length === 0 ? (
            <div className="card-body"><p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>No deliveries yet.</p></div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Tracking ID</th>
                    <th>Route</th>
                    <th>Receiver</th>
                    <th>Category</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDeliveries.map((p) => (
                    <tr key={p.trackingId}>
                      <td><code>{p.trackingId}</code></td>
                      <td>{getStationCity(p.originStation)} → {getStationCity(p.destinationStation)}</td>
                      <td>{p.receiverName || '—'}</td>
                      <td>{p.category || '—'}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{relDate(p.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReportsPage
