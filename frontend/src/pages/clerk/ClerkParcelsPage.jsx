import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Package, ScanLine, ArrowRight } from 'lucide-react'
import { getStationParcels } from '../../services/clerk.service'
import { STATUS_CONFIG, STATIONS } from '../../constants/parcel'
import TcIllustration from '../../components/common/TcIllustration'
import '../../pages/customer/MyParcelsPage.css'   /* reuse parcel list styles */

const FILTERS = ['All', 'At Station', 'In Transit', 'Delivered']

function statusGroup(status) {
  if (['at_origin', 'at_destination'].includes(status)) return 'At Station'
  if (status === 'in_transit')   return 'In Transit'
  if (status === 'delivered')    return 'Delivered'
  return 'Other'
}

function getRouteShort(parcel) {
  const city = (id) => STATIONS.find((s) => s.id === id)?.city || id
  if (parcel.deliveryType === 'intercity')
    return `${city(parcel.originStation)} → ${city(parcel.destinationStation)}`
  return `${parcel.pickupAddress} → ${parcel.dropoffAddress}`
}

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(iso).toLocaleDateString('en-GH', { day: 'numeric', month: 'short' })
}

function ClerkParcelsPage() {
  const [parcels, setParcels]  = useState([])
  const [loading, setLoading]  = useState(true)
  const [filter, setFilter]    = useState('All')
  const [search, setSearch]    = useState('')

  useEffect(() => {
    getStationParcels().then(setParcels).finally(() => setLoading(false))
  }, [])

  const filtered = parcels.filter((p) => {
    const matchFilter = filter === 'All' || statusGroup(p.status) === filter
    const q = search.toLowerCase()
    const matchSearch = !q
      || p.trackingId.toLowerCase().includes(q)
      || (p.receiverName || '').toLowerCase().includes(q)
      || (p.description  || '').toLowerCase().includes(q)
    return matchFilter && matchSearch
  })

  return (
    <div className="parcels-page">
      {/* Header */}
      <div className="parcels-page-header">
        <div className="parcels-header-inner">
          <h1 className="page-title">All Parcels</h1>
          <Link to="/clerk/scan" className="btn btn-primary btn-sm">
            <ScanLine size={14} /> Scan Parcel
          </Link>
        </div>

        {/* Search */}
        <div className="parcels-search-wrap">
          <Search size={15} className="search-icon" />
          <input
            type="search"
            className="parcels-search-input"
            placeholder="Search tracking ID, receiver, or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <div className="filter-tabs" role="tablist">
          {FILTERS.map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              className={`filter-tab${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
              {f !== 'All' && (
                <span className="filter-count">
                  {parcels.filter((p) => statusGroup(p.status) === f).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="parcels-list-wrap page-container">
        {loading ? (
          <div className="parcels-list">
            {[1, 2, 3].map((n) => (
              <div key={n} className="parcel-card card">
                <div className="parcel-card-body skeleton" style={{ height: 72 }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <TcIllustration type="empty-parcels" size={120} />
              <p className="empty-state-title">{search ? 'No results' : 'No parcels here'}</p>
              <p className="empty-state-body">
                {search ? `Nothing matched "${search}".` : 'Scan a parcel to get started.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="parcels-list">
            {filtered.map((p) => {
              const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.created
              return (
                <div key={p.id} className="parcel-card card" style={{ cursor: 'default' }}>
                  <div className="parcel-card-body">
                    <div className="parcel-left">
                      <span className="parcel-dot" style={{ background: cfg.color }} />
                      <div>
                        <div className="parcel-tracking-id">{p.trackingId}</div>
                        <div className="parcel-route">{getRouteShort(p)}</div>
                      </div>
                    </div>
                    <div className="parcel-right">
                      <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
                      <span className="parcel-time">{relativeTime(p.createdAt)}</span>
                    </div>
                  </div>
                  <div className="parcel-card-footer">
                    <span className="parcel-meta">To: <strong>{p.receiverName}</strong></span>
                    <span className="parcel-meta">{p.category} · {p.weight}</span>
                    <Link to="/clerk/scan" className="btn btn-ghost btn-sm" style={{ padding: '2px 8px' }}>
                      <ScanLine size={12} /> Scan
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default ClerkParcelsPage
