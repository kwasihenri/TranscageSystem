import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Truck, Package, CheckCircle, MapPin, Clock } from 'lucide-react'
import { getDriverJob, markArrived } from '../../services/driver.service'
import { STATIONS } from '../../constants/parcel'
import './JobDetailPage.css'

function getStationName(id) {
  return STATIONS.find((s) => s.id === id)?.name || id || '—'
}

function fmt(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GH', { dateStyle: 'medium', timeStyle: 'short' })
}

function JobDetailPage() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const [job, setJob]           = useState(null)
  const [loading, setLoading]   = useState(true)
  const [arriving, setArriving] = useState(false)
  const [arrived,  setArrived]  = useState(false)
  const [err, setErr]           = useState('')

  useEffect(() => {
    getDriverJob(id).then(setJob).finally(() => setLoading(false))
  }, [id])

  async function handleMarkArrived() {
    setArriving(true)
    setErr('')
    try {
      const updated = await markArrived(id)
      setJob(updated)
      setArrived(true)
    } catch (e) {
      setErr(e.message)
    } finally {
      setArriving(false)
    }
  }

  /* Loading */
  if (loading) {
    return (
      <div className="job-detail-page page-container">
        <div className="skeleton" style={{ height: 24, width: 120, marginBottom: 20 }} />
        <div className="card skeleton" style={{ height: 180 }} />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="job-detail-page page-container">
        <div className="card">
          <div className="empty-state">
            <p className="empty-state-title">Job not found</p>
            <Link to="/driver/jobs" className="btn btn-secondary" style={{ marginTop: 8 }}>
              <ArrowLeft size={14} /> Back to jobs
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const steps = [
    { label: 'Departed',  time: job.dispatchedAt, done: true },
    { label: 'En Route',  time: null,              done: job.status === 'arrived', active: job.status === 'dispatched' },
    { label: 'Arrived',   time: job.arrivedAt,     done: job.status === 'arrived', active: job.status === 'arrived' },
  ]

  return (
    <div className="job-detail-page">
      {/* Topbar */}
      <div className="job-detail-topbar">
        <button className="detail-back-btn" onClick={() => navigate('/driver/jobs')} aria-label="Back">
          <ArrowLeft size={18} />
        </button>
        <div className="job-detail-title-wrap">
          <code className="job-detail-id">{job.id}</code>
          <span className={`badge ${job.status === 'dispatched' ? 'badge-amber' : 'badge-green'}`}>
            {job.status === 'dispatched' ? 'En Route' : 'Arrived'}
          </span>
        </div>
      </div>

      <div className="job-detail-body page-container">
        {/* Route card */}
        <div className="card">
          <div className="card-body">
            <div className="job-detail-route">
              <div className="job-detail-point">
                <span className="job-detail-dot job-detail-dot--blue" />
                <div>
                  <div className="job-detail-point-label">Origin</div>
                  <div className="job-detail-point-name">{getStationName(job.originStation)}</div>
                </div>
              </div>
              <div className="job-detail-dashes">
                <Truck size={16} color="var(--accent)" />
              </div>
              <div className="job-detail-point">
                <span className="job-detail-dot job-detail-dot--green" />
                <div>
                  <div className="job-detail-point-label">Destination</div>
                  <div className="job-detail-point-name">{getStationName(job.destinationStation)}</div>
                </div>
              </div>
            </div>

            <div className="job-detail-meta-row">
              <span><Package size={13} /> {job.parcels.length} parcel{job.parcels.length !== 1 ? 's' : ''}</span>
              {job.driverName && <span><Truck size={13} /> {job.driverName}</span>}
              <span><Clock size={13} /> Departed {fmt(job.dispatchedAt)}</span>
            </div>
          </div>
        </div>

        {/* Trip progress stepper */}
        <div className="card">
          <div className="card-header"><span className="card-title">Trip Progress</span></div>
          <div className="card-body">
            <div className="trip-stepper">
              {steps.map((s, i) => (
                <div key={s.label} className={`trip-step${s.done ? ' done' : ''}${s.active ? ' active' : ''}`}>
                  <div className="trip-step-indicator">
                    <div className="trip-step-dot">
                      {s.done && <CheckCircle size={14} />}
                    </div>
                    {i < steps.length - 1 && (
                      <div className={`trip-step-connector${s.done ? ' done' : ''}`} />
                    )}
                  </div>
                  <div className="trip-step-info">
                    <div className="trip-step-label">{s.label}</div>
                    {s.time && <div className="trip-step-time">{fmt(s.time)}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Parcels list */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Parcels ({job.parcels.length})</span>
          </div>
          {job.parcels.length === 0 ? (
            <div className="card-body">
              <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>No parcels in this manifest.</p>
            </div>
          ) : (
            job.parcels.map((tid, i) => (
              <div key={tid} className="list-item">
                <div className="list-item-icon"><Package size={14} /></div>
                <div className="list-item-content">
                  <div className="list-item-label">{tid}</div>
                  <div className="list-item-meta">Parcel {i + 1} of {job.parcels.length}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Error */}
        {err && (
          <div style={{ padding: '10px 14px', background: 'var(--danger-light)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: 13, fontWeight: 500 }}>
            {err}
          </div>
        )}

        {/* Mark arrived */}
        {job.status === 'dispatched' && !arrived && (
          <div className="job-arrive-panel card">
            <div className="card-body">
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <MapPin size={18} color="var(--accent)" style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    At the destination?
                  </p>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                    Confirm arrival to notify the station clerk that the parcels are ready for check-in.
                  </p>
                </div>
              </div>
              <button
                className="btn btn-primary btn-full"
                id="mark-arrived-btn"
                style={{ marginTop: 14 }}
                onClick={handleMarkArrived}
                disabled={arriving}
              >
                <CheckCircle size={15} />
                {arriving ? 'Confirming…' : 'Mark Arrived at Destination'}
              </button>
            </div>
          </div>
        )}

        {/* Success */}
        {(job.status === 'arrived' || arrived) && (
          <div className="job-arrive-success card">
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', textAlign: 'center' }}>
              <div style={{ fontSize: 36 }}>🎯</div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>Arrived at {getStationName(job.destinationStation)}!</p>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                All {job.parcels.length} parcel{job.parcels.length !== 1 ? 's are' : ' is'} now ready for station check-in.
              </p>
              <Link to="/driver/jobs" className="btn btn-secondary">← Back to jobs</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default JobDetailPage
