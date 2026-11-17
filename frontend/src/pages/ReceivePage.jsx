import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Phone, Shield } from 'lucide-react'
import { trackPublic, verifyReceiverOTP } from '../services/parcel.service'
import { STATIONS } from '../constants/parcel'
import TcIcon from '../components/common/TcIcon'
import './ReceivePage.css'

function getStationName(id) {
  return STATIONS.find((s) => s.id === id)?.name || id
}

/* ── OTP Input (6 boxes) ────────────────────────────────── */
function OtpInput({ value, onChange, disabled }) {
  const inputs = useRef([])
  const digits  = (value + '      ').slice(0, 6).split('')

  function handleKey(e, i) {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const next = digits.slice()
      if (next[i] && next[i].trim()) {
        next[i] = ''
      } else if (i > 0) {
        next[i - 1] = ''
        inputs.current[i - 1]?.focus()
      }
      onChange(next.join('').trimEnd())
      return
    }
    if (e.key === 'ArrowLeft' && i > 0)  { inputs.current[i - 1]?.focus(); return }
    if (e.key === 'ArrowRight' && i < 5) { inputs.current[i + 1]?.focus(); return }
  }

  function handleChange(e, i) {
    const char = e.target.value.replace(/\D/g, '').slice(-1)
    if (!char) return
    const next = digits.slice()
    next[i] = char
    onChange(next.join('').trimEnd())
    if (i < 5) inputs.current[i + 1]?.focus()
  }

  function handlePaste(e) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    onChange(pasted)
    inputs.current[Math.min(pasted.length, 5)]?.focus()
  }

  return (
    <div className="otp-input-row" aria-label="Enter your 6-digit OTP">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]"
          maxLength={1}
          className={`otp-box${d.trim() ? ' filled' : ''}`}
          value={d.trim()}
          disabled={disabled}
          aria-label={`Digit ${i + 1}`}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKey(e, i)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          autoComplete="one-time-code"
        />
      ))}
    </div>
  )
}

/* ════════════════════════════════════════════════════════ */
function ReceivePage() {
  const { id: trackingId } = useParams()
  const [parcel, setParcel]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep]       = useState(1) // 1: phone, 2: OTP, 3: success
  const [phone, setPhone]     = useState('')
  const [otp, setOtp]         = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]     = useState('')
  const [collected, setCollected] = useState(null)

  useEffect(() => {
    trackPublic(trackingId).then(setParcel).finally(() => setLoading(false))
  }, [trackingId])

  /* ── Step 1: Verify phone ───────────────────────────── */
  function handlePhoneSubmit(e) {
    e.preventDefault()
    setError('')
    const normalised = phone.replace(/\s/g, '')
    if (!/^0[0-9]{9}$/.test(normalised)) {
      setError('Enter a valid Ghanaian phone number (e.g. 024 000 0000).')
      return
    }
    setStep(2)
  }

  /* ── Step 2: Verify OTP ─────────────────────────────── */
  async function handleOtpSubmit(e) {
    e.preventDefault()
    setError('')
    if (otp.trim().length < 6) {
      setError('Please enter all 6 digits.')
      return
    }
    setSubmitting(true)
    try {
      const updated = await verifyReceiverOTP(trackingId, phone, otp.trim())
      setCollected(updated)
      setStep(3)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  /* ── Loading ────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="receive-page">
        <div className="receive-card card">
          <div className="skeleton" style={{ height: 80, borderRadius: 6 }} />
        </div>
      </div>
    )
  }

  /* ── Parcel not found ───────────────────────────────── */
  if (!parcel) {
    return (
      <div className="receive-page">
        <div className="receive-card card">
          <div className="empty-state">
            <p className="empty-state-title">Parcel not found</p>
            <p className="empty-state-body">Could not find parcel <strong>{trackingId}</strong>.</p>
            <Link to="/track" className="btn btn-secondary" style={{ marginTop: 8 }}>
              <ArrowLeft size={14} /> Search again
            </Link>
          </div>
        </div>
      </div>
    )
  }

  /* ── Wrong status ───────────────────────────────────── */
  if (parcel.status !== 'at_destination' && parcel.status !== 'delivered' && step < 3) {
    return (
      <div className="receive-page">
        <div className="receive-card card">
          <div className="receive-brand"><TcIcon size={28} wordmark /></div>
          <div className="empty-state">
            <p className="empty-state-title">Not ready yet</p>
            <p className="empty-state-body">
              This parcel is currently <strong>{parcel.status.replace('_', ' ')}</strong> and hasn't arrived at the destination station yet.
            </p>
            <Link to={`/track/${trackingId}`} className="btn btn-secondary" style={{ marginTop: 8 }}>
              Track this parcel
            </Link>
          </div>
        </div>
      </div>
    )
  }

  /* ── Parcel info summary ────────────────────────────── */
  const origin = parcel.deliveryType === 'intercity'
    ? getStationName(parcel.destinationStation)
    : parcel.dropoffAddress

  /* ════════════════════════════════════════════════════ */
  return (
    <div className="receive-page">
      <div className="receive-card card">
        {/* Brand */}
        <div className="receive-brand"><TcIcon size={28} wordmark /></div>

        {/* Parcel info pill */}
        <div className="receive-parcel-info">
          <code className="receive-tracking-id">{parcel.trackingId}</code>
          <p className="receive-route">
            📍 {origin} · {parcel.description}
          </p>
        </div>

        {/* Error */}
        {error && <div className="receive-error" role="alert">{error}</div>}

        {/* ── STEP 1: Phone ──────────────────────────── */}
        {step === 1 && (
          <form className="receive-form" onSubmit={handlePhoneSubmit} noValidate>
            <div className="receive-step-header">
              <div className="receive-step-icon" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                <Phone size={20} />
              </div>
              <div>
                <h1 className="receive-step-title">Verify your number</h1>
                <p className="receive-step-desc">Enter the phone number registered as the receiver.</p>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="receiver-phone">Your Phone Number</label>
              <input
                id="receiver-phone"
                type="tel"
                className="form-input"
                placeholder="e.g. 024 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoFocus
              />
            </div>

            {import.meta.env.DEV && (
              <div className="receive-dev-hint">
                💡 Demo phone: <code>0244000001</code> (for TC-DEMO-00001)
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-full" id="receive-phone-submit">
              Continue <span>→</span>
            </button>
          </form>
        )}

        {/* ── STEP 2: OTP ────────────────────────────── */}
        {step === 2 && (
          <form className="receive-form" onSubmit={handleOtpSubmit} noValidate>
            <div className="receive-step-header">
              <div className="receive-step-icon" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                <Shield size={20} />
              </div>
              <div>
                <h1 className="receive-step-title">Enter your OTP</h1>
                <p className="receive-step-desc">
                  Enter the 6-digit code sent to <strong>{phone}</strong>.
                </p>
              </div>
            </div>

            <OtpInput value={otp} onChange={setOtp} disabled={submitting} />

            {import.meta.env.DEV && (
              <div className="receive-dev-hint">
                💡 Demo OTP: <code>123456</code>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-full"
              id="receive-otp-submit"
              disabled={submitting || otp.trim().length < 6}
            >
              {submitting ? 'Verifying…' : 'Collect Parcel'}
            </button>

            <button
              type="button"
              className="btn btn-ghost btn-full"
              onClick={() => { setStep(1); setOtp(''); setError('') }}
            >
              ← Change number
            </button>
          </form>
        )}

        {/* ── STEP 3: Success ────────────────────────── */}
        {step === 3 && (
          <div className="receive-success">
            <div className="success-emoji">🎉</div>
            <h1 className="success-title">Collected!</h1>
            <p className="success-subtitle">
              Your parcel has been successfully handed over.
            </p>
            <div className="success-details">
              <div className="success-row">
                <span>Tracking ID</span>
                <code>{collected?.trackingId}</code>
              </div>
              <div className="success-row">
                <span>Item</span>
                <span>{parcel.description}</span>
              </div>
              <div className="success-row">
                <span>Collected at</span>
                <span>{new Date().toLocaleString('en-GH', { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </div>
            </div>
            <div className="success-actions">
              <Link to={`/track/${collected?.trackingId}`} className="btn btn-secondary btn-full">
                View tracking history
              </Link>
              <Link to="/" className="btn btn-ghost btn-full">Go home</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ReceivePage
