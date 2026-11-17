import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Copy, Check, Share2 } from 'lucide-react'
import QRCode from 'react-qr-code'
import { getParcelById } from '../../services/parcel.service'
import { STATUS_CONFIG, STATIONS } from '../../constants/parcel'
import TrackingTimeline from '../../components/common/TrackingTimeline'
import TcIllustration from '../../components/common/TcIllustration'
import './ParcelDetailPage.css'

function getLocationLabel(parcel, field) {
  const station = (id) => STATIONS.find((s) => s.id === id)?.name || id
  if (parcel.deliveryType === 'intercity') {
    return field === 'origin'
      ? station(parcel.originStation)
      : station(parcel.destinationStation)
  }
  return field === 'origin' ? parcel.pickupAddress : parcel.dropoffAddress
}

function ParcelDetailPage() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const [parcel, setParcel]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied]   = useState(false)

  useEffect(() => {
    getParcelById(id)
      .then(setParcel)
      .finally(() => setLoading(false))
  }, [id])

  function copyId() {
    navigator.clipboard.writeText(parcel.trackingId).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  /* ── Loading ────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="detail-page page-container">
        <div className="skeleton" style={{ height: 24, width: 180, marginBottom: 24 }} />
        <div className="skeleton" style={{ height: 120, borderRadius: 8, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 300, borderRadius: 8 }} />
      </div>
    )
  }

  /* ── Not found ──────────────────────────────────────── */
  if (!parcel) {
    return (
      <div className="detail-page page-container">
        <div className="card">
          <div className="empty-state">
            <TcIllustration type="not-found" size={140} />
            <p className="empty-state-title">Parcel not found</p>
            <p className="empty-state-body">
              No parcel matches <strong>{id}</strong>. Check the tracking ID and try again.
            </p>
            <Link to="/customer/parcels" className="btn btn-secondary" style={{ marginTop: 8 }}>
              <ArrowLeft size={14} /> My Parcels
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const cfg = STATUS_CONFIG[parcel.status] || STATUS_CONFIG.created

  return (
    <div className="detail-page">
      {/* Sticky top bar */}
      <div className="detail-topbar">
        <button
          className="detail-back-btn"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="detail-topbar-center">
          <code className="detail-topbar-id">{parcel.trackingId}</code>
          <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
        </div>
        <button className="detail-share-btn" aria-label="Share tracking link">
          <Share2 size={17} />
        </button>
      </div>

      <div className="detail-body page-container">
        {/* Tracking ID card */}
        <div className="detail-id-card card">
          <div className="card-body">
            <div className="detail-id-row">
              <div>
                <p className="detail-id-label">Tracking ID</p>
                <code className="detail-id-code">{parcel.trackingId}</code>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={copyId}
                aria-label="Copy tracking ID"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            {/* Route */}
            <div className="detail-route">
              <div className="detail-route-point">
                <span className="route-dot-lg route-dot-lg--origin" />
                <div>
                  <div className="route-city-label">From</div>
                  <div className="route-city-name">{getLocationLabel(parcel, 'origin')}</div>
                </div>
              </div>
              <div className="route-dashed-line" />
              <div className="detail-route-point">
                <span className="route-dot-lg route-dot-lg--dest" />
                <div>
                  <div className="route-city-label">To</div>
                  <div className="route-city-name">{getLocationLabel(parcel, 'destination')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="detail-columns">
          {/* Timeline */}
          <div className="detail-main">
            <div className="card">
              <div className="card-header">
                <span className="card-title">Tracking History</span>
              </div>
              <div className="card-body">
                <TrackingTimeline
                  currentStatus={parcel.status}
                  history={parcel.history || []}
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="detail-sidebar">
            {/* QR Code */}
            <div className="card detail-qr-card">
              <div className="card-header">
                <span className="card-title">QR Label</span>
              </div>
              <div className="card-body detail-qr-body">
                <QRCode value={parcel.trackingId} size={140} />
                <p className="detail-qr-hint">Scan at station to check in / out</p>
              </div>
            </div>

            {/* Parcel info */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Parcel Details</span>
              </div>
              <div className="card-body">
                {[
                  { label: 'Receiver',  value: parcel.receiverName },
                  { label: 'Phone',     value: parcel.receiverPhone },
                  { label: 'Item',      value: parcel.description },
                  { label: 'Weight',    value: parcel.weight },
                  { label: 'Category',  value: parcel.category },
                  { label: 'Fragile',   value: parcel.fragile ? 'Yes' : 'No' },
                  { label: 'Booked',    value: new Date(parcel.createdAt).toLocaleString('en-GH', { dateStyle: 'medium', timeStyle: 'short' }) },
                ].map((row) => (
                  <div key={row.label} className="detail-info-row">
                    <span className="detail-info-key">{row.label}</span>
                    <span className="detail-info-val">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ParcelDetailPage
