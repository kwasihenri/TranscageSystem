import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Search, Package, ArrowRight, Share2, CheckCircle } from 'lucide-react'
import { trackPublic } from '../services/parcel.service'
import { STATUS_CONFIG, STATIONS } from '../constants/parcel'
import TrackingTimeline  from '../components/common/TrackingTimeline'
import LiveTrackingMap   from '../components/map/LiveTrackingMap'
import TcIcon from '../components/common/TcIcon'
import './TrackPage.css'

function maskPhone(phone) {
  if (!phone || phone.length < 4) return '••••••'
  return phone.slice(0, 3) + ' ••• ' + phone.slice(-3)
}

function getStationLabel(id) {
  return STATIONS.find((s) => s.id === id)?.name || id
}

function TrackPage() {
  const { id: paramId }  = useParams()
  const navigate          = useNavigate()
  const [query, setQuery] = useState(paramId || '')
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)   // parcel | 'not-found'
  const [copied, setCopied]   = useState(false)

  /* Auto-search if ID is in URL */
  useEffect(() => {
    if (paramId) doSearch(paramId)
  }, [paramId])

  async function doSearch(id) {
    const q = (id || query).trim().toUpperCase()
    if (!q) return
    setLoading(true)
    setResult(null)
    const parcel = await trackPublic(q)
    setResult(parcel || 'not-found')
    setLoading(false)
    /* Sync URL */
    if (q !== paramId) navigate(`/track/${q}`, { replace: true })
  }

  function handleSubmit(e) {
    e.preventDefault()
    doSearch()
  }

  function share() {
    const url = `${window.location.origin}/track/${result?.trackingId || query}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const parcel    = result && result !== 'not-found' ? result : null
  const notFound  = result === 'not-found'
  const cfg       = parcel ? (STATUS_CONFIG[parcel.status] || STATUS_CONFIG.created) : null

  return (
    <div className="track-page">
      {/* Hero search */}
      <div className="track-hero">
        <div className="track-hero-inner">
          <TcIcon size={28} />
          <h1 className="track-hero-title">Track your parcel</h1>
          <p className="track-hero-sub">Enter a Tracking ID to see the live status.</p>

          <form className="track-search-form" onSubmit={handleSubmit}>
            <div className="track-search-wrap">
              <Search size={16} className="track-search-icon" />
              <input
                id="track-search-input"
                type="text"
                className="track-search-input"
                placeholder="e.g. TC-2024-12345"
                value={query}
                onChange={(e) => setQuery(e.target.value.toUpperCase())}
                spellCheck={false}
                autoComplete="off"
                aria-label="Tracking ID"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary track-search-btn"
              disabled={!query.trim() || loading}
              id="track-search-submit"
            >
              {loading ? 'Searching…' : <>Track <ArrowRight size={15} /></>}
            </button>
          </form>

          {import.meta.env.DEV && (
            <p className="track-dev-hint">
              💡 Demo: <code>TC-DEMO-00001</code> (at destination) &nbsp;·&nbsp; <code>TC-DEMO-00002</code> (live map 🗺️)
            </p>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="track-results">

        {/* Not found */}
        {notFound && (
          <div className="track-result-wrap">
            <div className="card track-not-found">
              <div className="empty-state">
                <Package size={40} color="var(--text-muted)" strokeWidth={1.5} />
                <p className="empty-state-title">Parcel not found</p>
                <p className="empty-state-body">
                  No parcel matches <strong>{query}</strong>. Double-check the tracking ID and try again.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Result card */}
        {parcel && (
          <div className="track-result-wrap">
            {/* Summary */}
            <div className="card track-summary-card">
              <div className="card-body">
                <div className="track-summary-top">
                  <div>
                    <code className="track-id-display">{parcel.trackingId}</code>
                    <span className={`badge ${cfg.badge}`} style={{ marginLeft: 10 }}>{cfg.label}</span>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={share}
                    aria-label="Copy tracking link"
                  >
                    {copied ? <CheckCircle size={14} /> : <Share2 size={14} />}
                    {copied ? 'Copied!' : 'Share'}
                  </button>
                </div>

                {/* Route */}
                <div className="track-route">
                  {parcel.deliveryType === 'intercity' ? (
                    <>
                      <div className="track-route-point">
                        <span className="track-dot track-dot--blue" />
                        <div>
                          <div className="track-city-label">From</div>
                          <div className="track-city-name">{getStationLabel(parcel.originStation)}</div>
                        </div>
                      </div>
                      <div className="track-route-line" />
                      <div className="track-route-point">
                        <span className="track-dot track-dot--green" />
                        <div>
                          <div className="track-city-label">To</div>
                          <div className="track-city-name">{getStationLabel(parcel.destinationStation)}</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="track-route-point">
                        <span className="track-dot track-dot--blue" />
                        <div>
                          <div className="track-city-label">Pickup</div>
                          <div className="track-city-name">{parcel.pickupAddress}</div>
                        </div>
                      </div>
                      <div className="track-route-line" />
                      <div className="track-route-point">
                        <span className="track-dot track-dot--green" />
                        <div>
                          <div className="track-city-label">Drop-off</div>
                          <div className="track-city-name">{parcel.dropoffAddress}</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Receiver info (privacy-masked) */}
                <div className="track-receiver-row">
                  <span className="track-receiver-label">For:</span>
                  <span className="track-receiver-name">{parcel.receiverName}</span>
                  <span className="track-receiver-phone">{maskPhone(parcel.receiverPhone)}</span>
                </div>
              </div>

              {/* Collect CTA — only when at_destination */}
              {parcel.status === 'at_destination' && (
                <div className="track-collect-banner">
                  <div className="collect-banner-text">
                    <strong>📦 Ready for collection!</strong>
                    <span>This parcel is waiting at the destination station.</span>
                  </div>
                  <Link
                    to={`/receive/${parcel.trackingId}`}
                    className="btn btn-primary btn-sm"
                    id="track-collect-btn"
                  >
                    Collect Parcel <ArrowRight size={14} />
                  </Link>
                </div>
              )}

              {parcel.status === 'delivered' && (
                <div className="track-delivered-banner">
                  <CheckCircle size={16} /> This parcel has been collected. Delivery complete.
                </div>
              )}
            </div>

            {/* Live map — shown for in_transit intercity parcels */}
            {parcel.status === 'in_transit' && parcel.deliveryType === 'intercity' && (
              <div className="card" style={{ overflow: 'hidden' }}>
                <div className="card-header">
                  <span className="card-title">🚨 Live Driver Tracking</span>
                </div>
                <LiveTrackingMap parcel={parcel} />
              </div>
            )}

            {/* Timeline */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Journey Timeline</span>
              </div>
              <div className="card-body">
                <TrackingTimeline
                  currentStatus={parcel.status}
                  history={parcel.history || []}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TrackPage
