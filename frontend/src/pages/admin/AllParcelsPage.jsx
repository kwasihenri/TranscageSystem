import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { getAllParcels } from '../../services/admin.service'
import { STATUS_CONFIG, STATIONS } from '../../constants/parcel'
import './AdminPages.css'

function getStationCity(id) { return STATIONS.find((s) => s.id === id)?.city || id || '—' }

function relTime(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${Math.max(1,mins)}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(iso).toLocaleDateString('en-GH', { day: 'numeric', month: 'short' })
}

const FILTERS = ['All', 'Created', 'At Station', 'In Transit', 'Delivered']

function statusGroup(s) {
  if (['at_origin', 'at_destination'].includes(s)) return 'At Station'
  if (s === 'in_transit') return 'In Transit'
  if (s === 'delivered')  return 'Delivered'
  return 'Created'
}

function AllParcelsPage() {
  const [parcels, setParcels] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('All')
  const [search, setSearch]   = useState('')

  useEffect(() => { getAllParcels().then(setParcels).finally(() => setLoading(false)) }, [])

  const filtered = parcels.filter((p) => {
    const matchF = filter === 'All' || statusGroup(p.status) === filter
    const q = search.toLowerCase()
    const matchS = !q ||
      p.trackingId.toLowerCase().includes(q) ||
      (p.receiverName || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    return matchF && matchS
  })

  return (
    <div className="admin-subpage">
      <div className="admin-subpage-header">
        <div>
          <h1 className="page-title">All Parcels</h1>
          <p className="page-subtitle">{loading ? '…' : `${filtered.length} of ${parcels.length} parcels`}</p>
        </div>

        <div className="admin-search-wrap">
          <Search size={14} className="admin-search-icon" />
          <input
            type="search"
            className="admin-search-input"
            placeholder="Search ID, receiver, category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="admin-parcel-search"
          />
        </div>

        <div className="filter-tabs" role="tablist">
          {FILTERS.map((f) => (
            <button key={f} role="tab" aria-selected={filter === f}
              className={`filter-tab${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
              {f !== 'All' && <span className="filter-count">{parcels.filter((p) => statusGroup(p.status) === f).length}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="page-container admin-table-container">
        <div className="card">
          {loading ? (
            <div style={{ padding: 24 }}>
              {[1,2,3,4].map((n) => <div key={n} className="skeleton" style={{ height: 36, marginBottom: 8, borderRadius: 4 }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}>
              <p className="empty-state-title">{search ? 'No results' : 'No parcels'}</p>
              <p className="empty-state-body">{search ? `Nothing matched "${search}".` : 'No parcels in this category yet.'}</p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Tracking ID</th>
                    <th>Route</th>
                    <th>Receiver</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.created
                    return (
                      <tr key={p.trackingId}>
                        <td><code>{p.trackingId}</code></td>
                        <td>{getStationCity(p.originStation)} → {getStationCity(p.destinationStation)}</td>
                        <td>{p.receiverName || '—'}</td>
                        <td>{p.category || '—'}</td>
                        <td><span className={`badge ${cfg.badge}`}>{cfg.label}</span></td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{relTime(p.createdAt)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AllParcelsPage
