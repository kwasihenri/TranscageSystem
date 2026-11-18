import { useState, useRef, useEffect } from 'react'
import { Search, ArrowDownToLine, ArrowUpFromLine, Shield, Package, Layers, AlertTriangle, Camera } from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import { STATIONS, STATUS_CONFIG } from '../../constants/parcel'
import {
  clerkScanParcel,
  clerkCheckIn,
  clerkAddToManifest,
  clerkVerifyOTP,
  clerkGetManifests,
} from '../../services/clerk.service'
import OtpInput    from '../../components/common/OtpInput'
import QrScanner   from '../../components/common/QrScanner'
import { useNotifications } from '../../context/NotificationContext'
import './ScanPage.css'

function getStationName(id) {
  return STATIONS.find((s) => s.id === id)?.name || id || 'Unknown'
}

function ScanPage() {
  const { user } = useAuth()
  const { push } = useNotifications()
  const inputRef  = useRef(null)

  /* ── Scan state ───────────────────────────────────────── */
  const [scanValue, setScanValue] = useState('')
  const [scanning,  setScanning]  = useState(false)
  const [parcel,    setParcel]    = useState(null)
  const [scanErr,   setScanErr]   = useState('')

  /* ── Action state ─────────────────────────────────────── */
  const [otp,          setOtp]          = useState('')
  const [manifests,    setManifests]    = useState([])
  const [selManifest,  setSelManifest]  = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionSuccess,  setActionSuccess]  = useState('')
  const [actionErr,      setActionErr]      = useState('')

  /* ── Scan history (session only) ─────────────────────── */
  const [scanHistory, setScanHistory] = useState([])
  const [scannerOpen, setScannerOpen] = useState(false)

  /* Auto-focus on mount */
  useEffect(() => { inputRef.current?.focus() }, [])

  /* Fetch open manifests whenever a parcel needing dispatch is shown */
  useEffect(() => {
    if (parcel?.status === 'at_origin') {
      clerkGetManifests().then((all) => {
        setManifests(all.filter((m) => m.status === 'open'))
      })
    }
  }, [parcel])

  /* ── QR camera detected ──────────────────────────────── */
  function handleQrDetected(value) {
    setScannerOpen(false)
    const id = value.trim().toUpperCase()
    setScanValue(id)
    setScanErr(''); setParcel(null); setActionSuccess(''); setActionErr('')
    setScanning(true)
    clerkScanParcel(id).then((found) => {
      setScanning(false)
      if (!found) { setScanErr(`No parcel found for "${id}".`); return }
      setParcel(found)
    })
  }

  /* ── Handle scan submit ───────────────────────────────── */
  async function handleScan(e) {
    e.preventDefault()
    const q = scanValue.trim().toUpperCase()
    if (!q) return
    setScanErr('')
    setParcel(null)
    setActionSuccess('')
    setActionErr('')
    setOtp('')
    setSelManifest('')
    setScanning(true)
    const found = await clerkScanParcel(q)
    setScanning(false)
    if (!found) { setScanErr(`No parcel found for "${q}".`); inputRef.current?.select(); return }
    setParcel(found)
  }

  /* ── Handle action ────────────────────────────────────── */
  async function handleAction(type) {
    setActionLoading(true)
    setActionErr('')
    setActionSuccess('')
    try {
      let result
      if (type === 'checkin') {
        result = await clerkCheckIn(parcel.trackingId)
        const label = result.status === 'at_origin' ? 'checked in at origin' : 'received at destination'
        setActionSuccess(`✓ Parcel ${label} successfully.`)
        push({ type: 'status_changed', title: 'Parcel Checked In', body: `${parcel.trackingId} ${label}.`, trackingId: parcel.trackingId })
      } else if (type === 'dispatch') {
        if (!selManifest) { setActionErr('Please select a manifest first.'); setActionLoading(false); return }
        result = await clerkAddToManifest(parcel.trackingId, selManifest)
        setActionSuccess(`✓ Parcel added to manifest ${selManifest}.`)
        push({ type: 'status_changed', title: 'Parcel Dispatched', body: `${parcel.trackingId} added to manifest ${selManifest}.`, trackingId: parcel.trackingId })
      } else if (type === 'otp') {
        if (otp.trim().length < 6) { setActionErr('Please enter all 6 OTP digits.'); setActionLoading(false); return }
        result = await clerkVerifyOTP(parcel.trackingId, otp)
        setActionSuccess(`✓ OTP verified. Parcel handed over to ${parcel.receiverName}.`)
        push({ type: 'delivery_complete', title: 'Delivery Complete!', body: `${parcel.trackingId} handed over to ${parcel.receiverName}.`, trackingId: parcel.trackingId })
      }

      /* Update history */
      setScanHistory((h) => [{ trackingId: parcel.trackingId, action: type, time: new Date() }, ...h.slice(0, 4)])
      setParcel(result)
    } catch (err) {
      setActionErr(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  /* ── Reset and re-focus ───────────────────────────────── */
  function resetScan() {
    setParcel(null); setScanValue(''); setScanErr(''); setActionSuccess(''); setActionErr(''); setOtp('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const cfg = parcel ? (STATUS_CONFIG[parcel.status] || STATUS_CONFIG.created) : null

  return (
    <div className="scan-page">
      {/* Station info bar */}
      <div className="scan-station-bar">
        <span className="scan-station-icon">🏢</span>
        <span className="scan-station-name">{user?.station || 'Station'}</span>
        <span className="scan-station-role">· Station Clerk</span>
      </div>

      <div className="scan-body">
        {/* ── Camera QR scanner overlay ──────────────── */}
        {scannerOpen && (
          <QrScanner
            active={scannerOpen}
            onDetected={handleQrDetected}
            onClose={() => setScannerOpen(false)}
          />
        )}

        {/* ── Input panel ───────────────────────────── */}
        <div className="scan-input-panel card">
          {/* Camera scan button */}
          <button
            type="button"
            className="btn btn-secondary scan-camera-btn"
            id="clerk-camera-scan-btn"
            onClick={() => setScannerOpen(true)}
          >
            <Camera size={16} /> Scan QR with Camera
          </button>

          <div className="scan-divider">
            <span>or enter manually</span>
          </div>

          <form className="scan-form" onSubmit={handleScan}>
            <div className="scan-input-wrap">
              <Search size={16} className="scan-icon" />
              <input
                ref={inputRef}
                id="clerk-scan-input"
                type="text"
                className="scan-input"
                placeholder="Enter Tracking ID or scan QR…"
                value={scanValue}
                onChange={(e) => setScanValue(e.target.value.toUpperCase())}
                spellCheck={false}
                autoComplete="off"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary scan-btn"
              id="clerk-scan-submit"
              disabled={!scanValue.trim() || scanning}
            >
              {scanning ? 'Looking up…' : 'Scan'}
            </button>
          </form>

          {scanErr && (
            <div className="scan-error" role="alert">
              <AlertTriangle size={14} /> {scanErr}
            </div>
          )}

          {import.meta.env.DEV && (
            <p className="scan-dev-hint">
              💡 Try: any parcel from "My Parcels" or <code>TC-DEMO-00001</code>
            </p>
          )}
        </div>

        {/* ── Result panel ───────────────────────────── */}
        {parcel && (
          <div className="scan-result">
            {/* Parcel info */}
            <div className="scan-parcel-card card">
              <div className="card-body">
                <div className="scan-parcel-top">
                  <code className="scan-parcel-id">{parcel.trackingId}</code>
                  <span className={`badge ${cfg?.badge}`}>{cfg?.label}</span>
                </div>
                <div className="scan-parcel-route">
                  {parcel.deliveryType === 'intercity'
                    ? `${getStationName(parcel.originStation)} → ${getStationName(parcel.destinationStation)}`
                    : `${parcel.pickupAddress} → ${parcel.dropoffAddress}`}
                </div>
                <div className="scan-parcel-meta">
                  <span>📦 {parcel.description}</span>
                  <span>⚖️ {parcel.weight}</span>
                  <span>👤 {parcel.receiverName}</span>
                  {parcel.fragile && <span>🏺 Fragile</span>}
                </div>
              </div>

              {/* Success / error feedback */}
              {actionSuccess && (
                <div className="scan-action-success" role="status">{actionSuccess}</div>
              )}
              {actionErr && (
                <div className="scan-action-error" role="alert">
                  <AlertTriangle size={13} /> {actionErr}
                </div>
              )}

              {/* ── CHECK IN (created OR in_transit) ─── */}
              {(parcel.status === 'created' || parcel.status === 'in_transit') && (
                <div className={`scan-action-panel scan-action-panel--${parcel.status === 'created' ? 'blue' : 'amber'}`}>
                  <div className="scan-action-label">
                    <ArrowDownToLine size={15} />
                    {parcel.status === 'created'
                      ? 'Check In — parcel is arriving at this origin station'
                      : 'Receive — parcel arriving from intercity transit'}
                  </div>
                  <button
                    className="btn btn-primary"
                    id="clerk-checkin-btn"
                    onClick={() => handleAction('checkin')}
                    disabled={actionLoading || !!actionSuccess}
                  >
                    {actionLoading ? 'Processing…' : parcel.status === 'created' ? 'Check In' : 'Receive at Destination'}
                  </button>
                </div>
              )}

              {/* ── DISPATCH (at_origin) ──────────────── */}
              {parcel.status === 'at_origin' && !actionSuccess && (
                <div className="scan-action-panel scan-action-panel--blue">
                  <div className="scan-action-label">
                    <ArrowUpFromLine size={15} />
                    Add to manifest for dispatch
                  </div>
                  {manifests.length === 0 ? (
                    <p className="scan-no-manifests">
                      No open manifests. <a href="/clerk/manifests" className="link">Create one first →</a>
                    </p>
                  ) : (
                    <div className="scan-dispatch-row">
                      <select
                        className="form-select"
                        value={selManifest}
                        onChange={(e) => setSelManifest(e.target.value)}
                        id="clerk-manifest-select"
                      >
                        <option value="">Select manifest…</option>
                        {manifests.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.id} → {getStationName(m.destinationStation)} ({m.parcels.length} parcels)
                          </option>
                        ))}
                      </select>
                      <button
                        className="btn btn-primary"
                        id="clerk-add-manifest-btn"
                        onClick={() => handleAction('dispatch')}
                        disabled={actionLoading || !selManifest}
                      >
                        {actionLoading ? 'Adding…' : 'Add to Manifest'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── OTP VERIFY (at_destination) ──────── */}
              {parcel.status === 'at_destination' && !actionSuccess && (
                <div className="scan-action-panel scan-action-panel--green">
                  <div className="scan-action-label">
                    <Shield size={15} />
                    Verify receiver OTP to hand over
                  </div>
                  <OtpInput value={otp} onChange={setOtp} disabled={actionLoading} autoFocus />
                  {import.meta.env.DEV && (
                    <p style={{ fontSize: 11.5, color: 'var(--warning)', margin: 0 }}>
                      💡 Demo OTP: <code>123456</code>
                    </p>
                  )}
                  <button
                    className="btn btn-primary"
                    id="clerk-otp-submit-btn"
                    onClick={() => handleAction('otp')}
                    disabled={actionLoading || otp.trim().length < 6}
                  >
                    {actionLoading ? 'Verifying…' : 'Verify & Hand Over'}
                  </button>
                </div>
              )}

              {parcel.status === 'delivered' && (
                <div className="scan-action-panel scan-action-panel--gray">
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    ✓ This parcel has already been collected by the receiver.
                  </span>
                </div>
              )}
            </div>

            <button className="btn btn-ghost" onClick={resetScan} style={{ alignSelf: 'center' }}>
              ← Scan another parcel
            </button>
          </div>
        )}

        {/* ── Scan history ──────────────────────────── */}
        {history.length > 0 && !parcel && (
          <div className="scan-history card">
            <div className="card-header">
              <span className="card-title">Session Activity</span>
            </div>
            {history.map((h, i) => (
              <div key={i} className="list-item">
                <div className="list-item-icon">
                  {h.action === 'checkin' && <ArrowDownToLine size={14} />}
                  {h.action === 'dispatch' && <ArrowUpFromLine size={14} />}
                  {h.action === 'otp' && <Shield size={14} />}
                </div>
                <div className="list-item-content">
                  <div className="list-item-label">{h.trackingId}</div>
                  <div className="list-item-meta">
                    {h.action === 'checkin' ? 'Checked in' : h.action === 'dispatch' ? 'Added to manifest' : 'OTP verified'}
                    {' · '}{h.time.toLocaleTimeString('en-GH', { timeStyle: 'short' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty prompt */}
        {!parcel && history.length === 0 && !scanning && !scanErr && (
          <div className="scan-idle">
            <Package size={40} strokeWidth={1.2} color="var(--text-muted)" />
            <p>Scan or enter a Tracking ID above to begin.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ScanPage
