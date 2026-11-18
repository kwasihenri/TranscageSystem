import { useRef } from 'react'
import QRCode from 'react-qr-code'
import { Printer } from 'lucide-react'
import './ParcelQrCode.css'

/**
 * Reusable parcel QR code display with a print label button.
 *
 * Props:
 *   trackingId — the parcel tracking ID string
 *   size       — QR code pixel size (default 148)
 */
function ParcelQrCode({ trackingId, size = 148 }) {
  const qrValue = `${window.location.origin}/track/${trackingId}`

  function handlePrint() {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Parcel Label — ${trackingId}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; display: flex; align-items: center;
           justify-content: center; min-height: 100vh; background: #fff; }
    .label { text-align: center; border: 2px dashed #94a3b8; border-radius: 12px;
             padding: 24px 32px; max-width: 320px; }
    .brand { font-size: 20px; font-weight: 900; letter-spacing: 0.08em; color: #1e3a5f; margin-bottom: 6px; }
    .tid   { font-size: 15px; font-weight: 700; letter-spacing: 0.06em; color: #334155; margin-bottom: 20px; font-family: monospace; }
    .hint  { margin-top: 16px; font-size: 12px; color: #64748b; }
    svg    { display: block; margin: 0 auto; }
  </style>
</head>
<body>
  <div class="label">
    <div class="brand">TRANSCAGE</div>
    <div class="tid">${trackingId}</div>
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      ${document.querySelector('[data-qr-id="${trackingId}"] svg')?.innerHTML || ''}
    </svg>
    <p class="hint">Scan to track · transcage.app/track/${trackingId}</p>
  </div>
  <script>window.onload = function(){ window.print(); window.close(); }<\/script>
</body>
</html>`)
    win.document.close()
  }

  return (
    <div className="parcel-qr-wrap" data-qr-id={trackingId}>
      <div className="parcel-qr-box">
        <QRCode
          value={qrValue}
          size={size}
          level="M"
          style={{ display: 'block' }}
        />
      </div>
      <p className="parcel-qr-label">{trackingId}</p>
      <p className="parcel-qr-hint">Scan to track this parcel</p>
      <button className="btn btn-secondary btn-sm parcel-qr-print-btn" onClick={handlePrint}>
        <Printer size={13} /> Print Label
      </button>
    </div>
  )
}

export default ParcelQrCode
