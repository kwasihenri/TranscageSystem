import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  MapPin, Package, ArrowLeft, CheckCircle2,
  AlertTriangle, Bike, Phone, Shield, XCircle
} from 'lucide-react'
import OtpInput from '../../components/common/OtpInput'
import { useNotifications } from '../../context/NotificationContext'
import {
  getP2PJob, acceptP2PJob,
  verifyPickupOTP, verifyDeliveryOTP, markFailedDelivery,
} from '../../services/p2p.service'
import './P2PJobPage.css'

/* ── OTP lockout helper ──────────────────────────────── */
const MAX_ATTEMPTS = 3

function OtpVerifyPanel({ title, hint, onVerify, locked, attempts }) {
  const [otp, setOtp]       = useState('')
  const [err, setErr]       = useState('')
  const [loading, setLoading] = useState(false)
  const remaining = MAX_ATTEMPTS - attempts

  async function handleSubmit(e) {
    e.preventDefault()
    if (otp.trim().length < 6) { setErr('Enter all 6 digits.'); return }
    setLoading(true); setErr('')
    try {
      await onVerify(otp.trim())
    } catch (ex) {
      setErr(ex.message)
    } finally {
      setLoading(false)
    }
  }

  if (locked) return (
    <div className="p2p-locked-banner" role="alert">
      <XCircle size={18} />
      <span>OTP locked — 3 failed attempts. Contact support.</span>
    </div>
  )

  return (
    <form className="p2p-otp-panel card" onSubmit={handleSubmit}>
      <div className="card-header"><span className="card-title"><Shield size={14} /> {title}</span></div>
      <div className="card-body">
        <p className="p2p-otp-hint">{hint}</p>
        <OtpInput length={6} value={otp} onChange={setOtp} />
        {err && (
          <div className="p2p-otp-err" role="alert">
            <AlertTriangle size={13} /> {err}
            {attempts > 0 && attempts < MAX_ATTEMPTS && (
              <span className="p2p-attempts"> · {remaining} attempt{remaining !== 1 ? 's' : ''} left</span>
            )}
          </div>
        )}
        <button className="btn btn-primary btn-full" style={{ marginTop: 14 }} disabled={loading}>
          <CheckCircle2 size={14} /> {loading ? 'Verifying…' : 'Confirm'}
        </button>
      </div>
    </form>
  )
}

/* ── Status config ───────────────────────────────────── */
const STATUS_CFG = {
  pending:   { label: 'Awaiting Driver',   badge: 'badge-gray'   },
  accepted:  { label: 'Driver En Route',   badge: 'badge-amber'  },
  picked_up: { label: 'Parcel Collected',  badge: 'badge-blue'   },
  delivered: { label: 'Delivered',         badge: 'badge-green'  },
  failed:    { label: 'Failed Attempt',    badge: 'badge-red'    },
  returned:  { label: 'Returned',          badge: 'badge-gray'   },
}

const STEPS = ['Accept', 'Collect', 'Deliver', 'Done']

function stepIndex(status) {
  if (status === 'pending')   return 0
  if (status === 'accepted')  return 1
  if (status === 'picked_up') return 2
  if (status === 'delivered') return 3
  return 0
}

/* ════════════════════════════════════════════════════════ */
function P2PJobPage() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const { push }   = useNotifications()

  const [job, setJob]           = useState(null)
  const [loading, setLoading]   = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [pickupAttempts,   setPickupAttempts]   = useState(0)
  const [deliveryAttempts, setDeliveryAttempts] = useState(0)
  const [showFailModal,    setShowFailModal]     = useState(false)
  const [failReason,       setFailReason]        = useState('')
  const [failing,          setFailing]           = useState(false)
  const [err, setErr]           = useState('')

  useEffect(() => {
    getP2PJob(id).then(setJob).catch(() => setErr('Job not found.')).finally(() => setLoading(false))
  }, [id])

  /* ── Accept job ──────────────────────────────────────── */
  async function handleAccept() {
    setAccepting(true); setErr('')
    try {
      const updated = await acceptP2PJob(id)
      setJob(updated)
      push({ type: 'status_changed', title: 'Job Accepted', body: `You accepted P2P job ${id}. Navigate to pickup address.` })
    } catch (ex) { setErr(ex.message) } finally { setAccepting(false) }
  }

  /* ── Verify pickup OTP ───────────────────────────────── */
  async function handlePickup(otp) {
    try {
      const updated = await verifyPickupOTP(id, otp)
      setJob(updated)
      push({ type: 'status_changed', title: 'Parcel Collected', body: `Pickup OTP verified for ${id}. Head to drop-off.` })
    } catch (ex) {
      setPickupAttempts((n) => n + 1)
      throw ex
    }
  }

  /* ── Verify delivery OTP ─────────────────────────────── */
  async function handleDelivery(otp) {
    try {
      const updated = await verifyDeliveryOTP(id, otp)
      setJob(updated)
      push({ type: 'delivery_complete', title: 'Delivered! 🎉', body: `P2P job ${id} completed successfully.` })
    } catch (ex) {
      setDeliveryAttempts((n) => n + 1)
      throw ex
    }
  }

  /* ── Mark failed ─────────────────────────────────────── */
  async function handleFail() {
    if (!failReason.trim()) return
    setFailing(true)
    try {
      const updated = await markFailedDelivery(id, failReason.trim())
      setJob(updated)
      setShowFailModal(false)
      push({ type: 'warning', title: 'Failed Delivery Logged', body: `Attempt marked failed for ${id}.` })
    } catch (ex) { setErr(ex.message) } finally { setFailing(false) }
  }

  /* ── Loading / error ─────────────────────────────────── */
  if (loading) return (
    <div className="p2p-page page-container">
      <div className="card skeleton" style={{ height: 180 }} />
    </div>
  )

  if (!job || err) return (
    <div className="p2p-page page-container">
      <div className="card"><div className="empty-state">
        <p className="empty-state-title">{err || 'Job not found'}</p>
        <button className="btn btn-secondary" style={{ marginTop: 8 }} onClick={() => navigate('/driver/jobs')}>
          <ArrowLeft size={14} /> Back to jobs
        </button>
      </div></div>
    </div>
  )

  const cfg  = STATUS_CFG[job.status] || STATUS_CFG.pending
  const step = stepIndex(job.status)
  const isDone   = job.status === 'delivered' || job.status === 'returned'
  const isFailed = job.status === 'failed'

  return (
    <div className="p2p-page">
      {/* Topbar */}
      <div className="p2p-topbar">
        <button className="detail-back-btn" onClick={() => navigate('/driver/jobs')} aria-label="Back">
          <ArrowLeft size={18} />
        </button>
        <div className="p2p-title-wrap">
          <span className="p2p-tag">🛵 P2P Job</span>
          <code className="p2p-job-id">{job.id}</code>
        </div>
        <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
      </div>

      {/* Progress strip */}
      <div className="p2p-progress">
        {STEPS.map((label, i) => (
          <div key={label} className={`p2p-step${i <= step ? ' done' : ''}${i === step && !isDone ? ' active' : ''}`}>
            {i > 0 && <div className="p2p-step-line" />}
            <div className="p2p-step-dot">{i < step || isDone ? '✓' : i + 1}</div>
            <span className="p2p-step-label">{label}</span>
          </div>
        ))}
      </div>

      <div className="p2p-body page-container">
        {/* Route card */}
        <div className="card">
          <div className="card-body">
            <div className="p2p-route">
              <div className="p2p-point">
                <span className="p2p-point-dot p2p-point-dot--blue" />
                <div>
                  <div className="p2p-point-label">Pickup</div>
                  <div className="p2p-point-addr">{job.pickupAddress}</div>
                </div>
              </div>
              <div className="p2p-route-line" />
              <div className="p2p-point">
                <span className="p2p-point-dot p2p-point-dot--green" />
                <div>
                  <div className="p2p-point-label">Drop-off</div>
                  <div className="p2p-point-addr">{job.dropoffAddress}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Parcel info */}
        <div className="card">
          <div className="card-header"><span className="card-title"><Package size={14} /> Parcel</span></div>
          <div className="card-body">
            <dl className="p2p-dl">
              <div><dt>Description</dt><dd>{job.description || '—'}</dd></div>
              <div><dt>Category</dt><dd>{job.category || '—'}</dd></div>
              <div><dt>Weight</dt><dd>{job.weight || '—'}</dd></div>
              <div><dt>Receiver</dt><dd>{job.receiverName}</dd></div>
              <div><dt>Receiver Phone</dt><dd>{job.receiverPhone}</dd></div>
            </dl>
          </div>
        </div>

        {/* Accept button */}
        {job.status === 'pending' && (
          <div className="card">
            <div className="card-body">
              <div className="p2p-accept-info">
                <Bike size={22} color="var(--accent)" />
                <div>
                  <p style={{ margin: '0 0 2px', fontWeight: 700 }}>Available Job</p>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                    Accept this job to take custody of the delivery.
                  </p>
                </div>
              </div>
              {err && <p className="p2p-err">{err}</p>}
              <button
                className="btn btn-primary btn-full"
                id="accept-p2p-job-btn"
                style={{ marginTop: 14 }}
                onClick={handleAccept}
                disabled={accepting}
              >
                <CheckCircle2 size={14} /> {accepting ? 'Accepting…' : 'Accept this Job'}
              </button>
            </div>
          </div>
        )}

        {/* Pickup OTP verification */}
        {job.status === 'accepted' && (
          <>
            <div className="p2p-nav-hint card">
              <div className="card-body" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <MapPin size={18} color="var(--accent)" />
                <div>
                  <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: 14 }}>Go to pickup location</p>
                  <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-muted)' }}>{job.pickupAddress}</p>
                </div>
              </div>
            </div>
            <OtpVerifyPanel
              title="Sender Pickup OTP"
              hint="Ask the sender for their 6-digit Pickup OTP to confirm you have collected the parcel."
              onVerify={handlePickup}
              locked={pickupAttempts >= MAX_ATTEMPTS}
              attempts={pickupAttempts}
            />
            <button
              className="btn btn-secondary btn-full"
              id="mark-failed-pickup-btn"
              style={{ marginTop: 4 }}
              onClick={() => setShowFailModal(true)}
            >
              <AlertTriangle size={14} /> Can't complete pickup
            </button>
          </>
        )}

        {/* Delivery OTP verification */}
        {job.status === 'picked_up' && (
          <>
            <div className="p2p-nav-hint card">
              <div className="card-body" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <MapPin size={18} color="var(--success, #22c55e)" />
                <div>
                  <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: 14 }}>Go to drop-off location</p>
                  <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-muted)' }}>{job.dropoffAddress}</p>
                </div>
              </div>
            </div>
            <OtpVerifyPanel
              title="Receiver Delivery OTP"
              hint="Ask the receiver for their 6-digit Delivery OTP to hand over the parcel."
              onVerify={handleDelivery}
              locked={deliveryAttempts >= MAX_ATTEMPTS}
              attempts={deliveryAttempts}
            />
            <button
              className="btn btn-secondary btn-full"
              id="mark-failed-delivery-btn"
              style={{ marginTop: 4 }}
              onClick={() => setShowFailModal(true)}
            >
              <AlertTriangle size={14} /> Failed delivery attempt
            </button>
          </>
        )}

        {/* Success */}
        {job.status === 'delivered' && (
          <div className="card">
            <div className="card-body p2p-success">
              <div style={{ fontSize: 48 }}>🎉</div>
              <p style={{ fontWeight: 800, fontSize: 17, margin: '8px 0 4px' }}>Delivery Complete!</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
                Parcel handed over to {job.receiverName}.
              </p>
              <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => navigate('/driver/jobs')}>
                ← Back to jobs
              </button>
            </div>
          </div>
        )}

        {/* Failed state */}
        {isFailed && (
          <div className="card">
            <div className="card-body p2p-success">
              <div style={{ fontSize: 40 }}>⚠️</div>
              <p style={{ fontWeight: 800, fontSize: 15, margin: '8px 0 4px' }}>Delivery Attempt Failed</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
                {job.failReason || 'Marked as failed delivery.'}
              </p>
              <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => navigate('/driver/jobs')}>
                ← Back to jobs
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Failed delivery modal */}
      {showFailModal && (
        <div className="p2p-modal-backdrop" onClick={() => setShowFailModal(false)}>
          <div className="p2p-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="p2p-modal-title">Mark Failed Attempt</h3>
            <p className="p2p-modal-hint">Briefly explain why the delivery could not be completed.</p>
            <textarea
              className="form-input p2p-modal-textarea"
              placeholder="e.g. Receiver not available, wrong address…"
              value={failReason}
              onChange={(e) => setFailReason(e.target.value)}
              rows={3}
            />
            {err && <p className="p2p-err">{err}</p>}
            <div className="p2p-modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowFailModal(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                id="confirm-fail-btn"
                onClick={handleFail}
                disabled={failing || !failReason.trim()}
              >
                {failing ? 'Saving…' : 'Confirm Failed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default P2PJobPage
