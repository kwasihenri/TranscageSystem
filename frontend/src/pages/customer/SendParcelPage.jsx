import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ChevronRight, Printer, Package } from 'lucide-react'
import QRCode from 'react-qr-code'
import useAuth from '../../hooks/useAuth'
import { STATIONS, WEIGHT_OPTIONS, ITEM_CATEGORIES, calculateFee, formatFeeBreakdown } from '../../constants/parcel'
import { createParcel } from '../../services/parcel.service'
import './SendParcelPage.css'

/* ── Validation ─────────────────────────────────────────── */
function validate(step, data) {
  switch (step) {
    case 1:
      if (data.deliveryType === 'intercity') {
        if (!data.originStation)                        return 'Please select an origin station.'
        if (!data.destinationStation)                   return 'Please select a destination station.'
        if (data.originStation === data.destinationStation) return 'Origin and destination must be different.'
      } else {
        if (!data.pickupAddress.trim())   return 'Please enter a pickup address.'
        if (!data.dropoffAddress.trim())  return 'Please enter a drop-off address.'
      }
      return null
    case 2:
      if (!data.receiverName.trim())  return "Please enter the receiver's name."
      if (!data.receiverPhone.trim()) return "Please enter the receiver's phone number."
      if (!/^0[0-9]{9}$/.test(data.receiverPhone.replace(/\s/g, '')))
        return 'Enter a valid Ghanaian phone number (e.g. 024 000 0000).'
      return null
    case 3:
      if (!data.description.trim()) return 'Please describe the item.'
      if (!data.weight)             return 'Please select a weight range.'
      if (!data.category)           return 'Please select an item category.'
      return null
    default:
      return null
  }
}

/* ── Step labels ────────────────────────────────────────── */
const STEPS = ['Route', 'Receiver', 'Item', 'Review']

const INITIAL_FORM = {
  deliveryType:        'intercity',
  originStation:       '',
  destinationStation:  '',
  pickupAddress:       '',
  dropoffAddress:      '',
  receiverName:        '',
  receiverPhone:       '',
  description:         '',
  weight:              'under-1',
  category:            'Other',
  fragile:             false,
}

/* ════════════════════════════════════════════════════════ */
function SendParcelPage() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [step, setStep]   = useState(1)
  const [form, setForm]   = useState(INITIAL_FORM)
  const [error, setError] = useState('')
  const [loading, setLoading]         = useState(false)
  const [submitted, setSubmitted]     = useState(null) // confirmed parcel

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function next() {
    const err = validate(step, form)
    if (err) { setError(err); return }
    setError('')
    setStep((s) => s + 1)
  }

  function back() {
    setError('')
    if (step === 1) navigate(-1)
    else setStep((s) => s - 1)
  }

  async function handleConfirm() {
    setLoading(true)
    setError('')
    try {
      const payload = { ...form, senderId: user?.id, senderName: user?.name }
      const parcel = await createParcel(payload)
      setSubmitted(parcel)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  /* ── Confirmation screen ────────────────────────────── */
  if (submitted) {
    return (
      <div className="send-page">
        <div className="send-wizard">
          <div className="confirm-screen">
            <div className="confirm-icon">📦</div>
            <h1 className="confirm-title">Parcel Booked!</h1>
            <p className="confirm-subtitle">Your parcel has been registered and is ready for drop-off.</p>

            <div className="confirm-tracking-id">
              <span className="confirm-id-label">Tracking ID</span>
              <code className="confirm-id-code">{submitted.trackingId}</code>
            </div>

            <div className="confirm-qr">
              <QRCode value={submitted.trackingId} size={160} />
              <p className="confirm-qr-hint">Show or scan this code at the station</p>
            </div>

            <div className="confirm-actions">
              <Link to={`/customer/parcels/${submitted.trackingId}`} className="btn btn-primary btn-full">
                <Package size={15} /> Track this parcel
              </Link>
              <button
                className="btn btn-secondary btn-full"
                onClick={() => { setSubmitted(null); setStep(1); setForm(INITIAL_FORM) }}
              >
                Send another parcel
              </button>
              <button className="btn btn-ghost btn-full" onClick={() => window.print()}>
                <Printer size={15} /> Print label
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ── Fee for review ─────────────────────────────────── */
  const totalFee  = calculateFee(form.deliveryType, form.weight, form.fragile)
  const breakdown = formatFeeBreakdown(form.deliveryType, form.weight, form.fragile)
  const originLabel = form.deliveryType === 'intercity'
    ? STATIONS.find((s) => s.id === form.originStation)?.name || '—'
    : form.pickupAddress
  const destLabel = form.deliveryType === 'intercity'
    ? STATIONS.find((s) => s.id === form.destinationStation)?.name || '—'
    : form.dropoffAddress

  /* ── Wizard ─────────────────────────────────────────── */
  return (
    <div className="send-page">
      <div className="send-wizard">
        {/* Header */}
        <div className="wizard-header">
          <button className="wizard-back-btn" onClick={back} aria-label="Go back">
            <ArrowLeft size={18} />
          </button>
          <h1 className="wizard-title">Send a Parcel</h1>
          <span />
        </div>

        {/* Progress */}
        <div className="wizard-progress" role="list" aria-label="Booking steps">
          {STEPS.map((label, i) => {
            const num  = i + 1
            const done = num < step
            const cur  = num === step
            return (
              <div key={label} className="progress-item" role="listitem">
                {i > 0 && <div className={`progress-line${done || cur ? ' filled' : ''}`} />}
                <div className={`progress-dot${done ? ' done' : cur ? ' current' : ''}`}>
                  {done ? '✓' : num}
                </div>
                <span className={`progress-label${cur ? ' current' : done ? ' done' : ''}`}>{label}</span>
              </div>
            )
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="wizard-error" role="alert">{error}</div>
        )}

        {/* ── STEP 1: Route ──────────────────────────── */}
        {step === 1 && (
          <div className="wizard-step">
            <p className="step-heading">How are you sending it?</p>

            {/* Type selector */}
            <div className="type-selector">
              {[
                { value: 'intercity', emoji: '🚌', title: 'Intercity', desc: 'Station to station across cities' },
                { value: 'local',     emoji: '🛵', title: 'Local Town', desc: 'Address to address within town' },
              ].map((t) => (
                <button
                  key={t.value}
                  type="button"
                  className={`type-card${form.deliveryType === t.value ? ' selected' : ''}`}
                  onClick={() => set('deliveryType', t.value)}
                >
                  <span className="type-emoji">{t.emoji}</span>
                  <span className="type-title">{t.title}</span>
                  <span className="type-desc">{t.desc}</span>
                </button>
              ))}
            </div>

            {/* Location inputs */}
            {form.deliveryType === 'intercity' ? (
              <div className="route-fields">
                <div className="form-group">
                  <label className="form-label" htmlFor="origin">Origin Station</label>
                  <select
                    id="origin"
                    className="form-select"
                    value={form.originStation}
                    onChange={(e) => set('originStation', e.target.value)}
                  >
                    <option value="">Select origin station…</option>
                    {STATIONS.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.city})</option>
                    ))}
                  </select>
                </div>
                <div className="route-arrow"><ChevronRight size={18} color="var(--text-muted)" /></div>
                <div className="form-group">
                  <label className="form-label" htmlFor="destination">Destination Station</label>
                  <select
                    id="destination"
                    className="form-select"
                    value={form.destinationStation}
                    onChange={(e) => set('destinationStation', e.target.value)}
                  >
                    <option value="">Select destination station…</option>
                    {STATIONS.filter((s) => s.id !== form.originStation).map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.city})</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="route-fields">
                <div className="form-group">
                  <label className="form-label" htmlFor="pickup">Pickup Address</label>
                  <input
                    id="pickup"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Anaji, Takoradi"
                    value={form.pickupAddress}
                    onChange={(e) => set('pickupAddress', e.target.value)}
                  />
                </div>
                <div className="route-arrow"><ChevronRight size={18} color="var(--text-muted)" /></div>
                <div className="form-group">
                  <label className="form-label" htmlFor="dropoff">Drop-off Address</label>
                  <input
                    id="dropoff"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Market Circle, Takoradi"
                    value={form.dropoffAddress}
                    onChange={(e) => set('dropoffAddress', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: Receiver ───────────────────────── */}
        {step === 2 && (
          <div className="wizard-step">
            <p className="step-heading">Who is receiving the parcel?</p>
            <div className="form-group">
              <label className="form-label" htmlFor="recv-name">Receiver's Full Name</label>
              <input
                id="recv-name"
                type="text"
                className="form-input"
                placeholder="e.g. Kwame Asante"
                value={form.receiverName}
                onChange={(e) => set('receiverName', e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="recv-phone">Receiver's Phone Number</label>
              <input
                id="recv-phone"
                type="tel"
                className="form-input"
                placeholder="e.g. 024 000 0000"
                value={form.receiverPhone}
                onChange={(e) => set('receiverPhone', e.target.value)}
              />
              <span className="form-hint">
                The receiver will get a 6-digit pickup code on this number.
              </span>
            </div>
          </div>
        )}

        {/* ── STEP 3: Item ───────────────────────────── */}
        {step === 3 && (
          <div className="wizard-step">
            <p className="step-heading">What are you sending?</p>
            <div className="form-group">
              <label className="form-label" htmlFor="description">Item Description</label>
              <textarea
                id="description"
                className="form-input form-textarea"
                placeholder="e.g. Black laptop bag with charger inside"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={3}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="weight">Estimated Weight</label>
                <select
                  id="weight"
                  className="form-select"
                  value={form.weight}
                  onChange={(e) => set('weight', e.target.value)}
                >
                  {WEIGHT_OPTIONS.map((w) => (
                    <option key={w.value} value={w.value}>{w.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="category">Category</label>
                <select
                  id="category"
                  className="form-select"
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                >
                  {ITEM_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <label className="fragile-toggle">
              <input
                type="checkbox"
                checked={form.fragile}
                onChange={(e) => set('fragile', e.target.checked)}
              />
              <span className="fragile-label">🏺 Mark as fragile (+ GHS {5})</span>
            </label>
          </div>
        )}

        {/* ── STEP 4: Review ─────────────────────────── */}
        {step === 4 && (
          <div className="wizard-step">
            <p className="step-heading">Review your booking</p>
            <div className="review-card card">
              <div className="card-body review-body">
                <div className="review-row">
                  <span className="review-key">Type</span>
                  <span className="review-val">{form.deliveryType === 'intercity' ? '🚌 Intercity' : '🛵 Local Town'}</span>
                </div>
                <div className="review-row">
                  <span className="review-key">From</span>
                  <span className="review-val">{originLabel}</span>
                </div>
                <div className="review-row">
                  <span className="review-key">To</span>
                  <span className="review-val">{destLabel}</span>
                </div>
                <div className="review-row">
                  <span className="review-key">Receiver</span>
                  <span className="review-val">{form.receiverName}</span>
                </div>
                <div className="review-row">
                  <span className="review-key">Phone</span>
                  <span className="review-val">{form.receiverPhone}</span>
                </div>
                <div className="review-row">
                  <span className="review-key">Item</span>
                  <span className="review-val">{form.description}</span>
                </div>
                <div className="review-row">
                  <span className="review-key">Weight</span>
                  <span className="review-val">{WEIGHT_OPTIONS.find(w => w.value === form.weight)?.label}</span>
                </div>
                <div className="review-row">
                  <span className="review-key">Category</span>
                  <span className="review-val">{form.category}</span>
                </div>
                {form.fragile && (
                  <div className="review-row">
                    <span className="review-key">Special</span>
                    <span className="review-val">🏺 Fragile</span>
                  </div>
                )}
              </div>
            </div>

            {/* Fee breakdown */}
            <div className="fee-card card">
              <div className="card-header">
                <span className="card-title">Estimated Fee</span>
              </div>
              <div className="card-body">
                {breakdown.map((item) => (
                  <div key={item.label} className="fee-row">
                    <span className="fee-label">{item.label}</span>
                    <span className="fee-amount">GHS {item.amount}</span>
                  </div>
                ))}
                <div className="fee-total-row">
                  <span>Total</span>
                  <span className="fee-total">GHS {totalFee}</span>
                </div>
              </div>
            </div>

            <p className="review-disclaimer">
              Payment is collected at the station when you drop off the parcel.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="wizard-nav">
          <button className="btn btn-secondary" onClick={back}>
            <ArrowLeft size={15} /> {step === 1 ? 'Cancel' : 'Back'}
          </button>
          {step < 4 ? (
            <button className="btn btn-primary" onClick={next}>
              Continue <ArrowRight size={15} />
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleConfirm} disabled={loading}>
              {loading ? 'Booking…' : 'Confirm Booking'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default SendParcelPage
