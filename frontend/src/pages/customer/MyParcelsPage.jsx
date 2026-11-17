import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Package, PlusCircle, ArrowRight } from 'lucide-react'
import { getMyParcels } from '../../services/parcel.service'
import { STATUS_CONFIG, STATIONS } from '../../constants/parcel'
import TcIllustration from '../../components/common/TcIllustration'
import './MyParcelsPage.css'

const FILTERS = ['All', 'Active', 'In Transit', 'Delivered']

function statusGroup(status) {
  if (status === 'in_transit')                    return 'In Transit'
  if (status === 'delivered')                     return 'Delivered'
  if (['at_origin', 'at_destination', 'created'].includes(status)) return 'Active'
  return 'Other'
}

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)   return 'Just now'
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  return new Date(iso).toLocaleDateString('en-GH', { day: 'numeric', month: 'short' })
}

function getLocationLabel(parcel) {
  const station = (id) => STATIONS.find((s) => s.id === id)?.city || id
  if (parcel.deliveryType === 'intercity') {
    return `${station(parcel.originStation)} → ${station(parcel.destinationStation)}`
  }
  return `${parcel.pickupAddress} → ${parcel.dropoffAddress}`
}

function MyParcelsPage() {
  const [parcels, setParcels]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('All')
  const [search, setSearch]     = useState('')

  useEffect(() => {
    getMyParcels().then(setParcels).finally(() => setLoading(false))
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
      {/* Page header */}
      <div className="parcels-page-header">
        <div className="parcels-header-inner">
          <h1 className="page-title">My Parcels</h1>
          <Link to="/customer/send" className="btn btn-primary btn-sm">
            <PlusCircle size={14} /> Send Parcel
          </Link>
        </div>

        {/* Search */}
        <div className="parcels-search-wrap">
          <Search size={15} className="search-icon" />
          <input
            type="search"
            className="parcels-search-input"
            placeholder="Search by tracking ID, receiver, or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter tabs */}
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
      <div className="parcels-list-wrap page-container" style={{ paddingTop: 0 }}>
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
              <TcIllustration type="empty-parcels" size={140} />
              <p className="empty-state-title">
                {search ? 'No results found' : 'No parcels here'}
              </p>
              <p className="empty-state-body">
                {search
                  ? `Nothing matched "${search}". Try a different keyword.`
                  : 'Send your first parcel and it will show up here.'}
              </p>
              {!search && (
                <Link to="/customer/send" className="btn btn-primary" style={{ marginTop: 8 }}>
                  <PlusCircle size={15} /> Send a Parcel
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="parcels-list">
            {filtered.map((parcel) => {
              const cfg = STATUS_CONFIG[parcel.status] || STATUS_CONFIG.created
              return (
                <Link
                  key={parcel.id}
                  to={`/customer/parcels/${parcel.trackingId}`}
                  className="parcel-card card"
                  aria-label={`Parcel ${parcel.trackingId}`}
                >
                  <div className="parcel-card-body">
                    {/* Left: dot + tracking ID */}
                    <div className="parcel-left">
                      <span className="parcel-dot" style={{ background: cfg.color }} />
                      <div>
                        <div className="parcel-tracking-id">{parcel.trackingId}</div>
                        <div className="parcel-route">{getLocationLabel(parcel)}</div>
                      </div>
                    </div>
                    {/* Right: badge + date */}
                    <div className="parcel-right">
                      <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
                      <span className="parcel-time">{relativeTime(parcel.createdAt)}</span>
                    </div>
                  </div>
                  {/* Footer */}
                  <div className="parcel-card-footer">
                    <span className="parcel-meta">
                      To: <strong>{parcel.receiverName}</strong>
                    </span>
                    <span className="parcel-meta">{parcel.category} · {parcel.weight}</span>
                    <ArrowRight size={13} color="var(--text-muted)" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyParcelsPage
