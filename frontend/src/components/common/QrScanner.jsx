import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { X, Camera } from 'lucide-react'
import './QrScanner.css'

/**
 * Camera-based QR code scanner using jsQR.
 *
 * Props:
 *   onDetected(value) — called once when a QR code is decoded
 *   onClose()         — called when user dismisses the scanner
 *   active            — mount/unmount the camera stream
 */
function QrScanner({ onDetected, onClose, active = true }) {
  const videoRef  = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef    = useRef(null)
  const [status, setStatus] = useState('requesting') // requesting | active | error | found

  /* Start / stop camera when `active` changes */
  useEffect(() => {
    if (!active) return
    let mounted = true

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
        })
        if (!mounted) { stream.getTracks().forEach((t) => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          if (mounted) { setStatus('active'); tick() }
        }
      } catch {
        if (mounted) setStatus('error')
      }
    }

    startCamera()
    return () => {
      mounted = false
      cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [active])

  function tick() {
    rafRef.current = requestAnimationFrame(() => {
      const video  = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || video.readyState < video.HAVE_ENOUGH_DATA) {
        tick(); return
      }
      canvas.width  = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      ctx.drawImage(video, 0, 0)
      const img  = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' })

      if (code?.data) {
        setStatus('found')
        streamRef.current?.getTracks().forEach((t) => t.stop())
        // Extract tracking ID from URL or use raw value
        const raw = code.data.trim()
        const match = raw.match(/\/track\/([^/?#]+)/)
        onDetected?.(match ? match[1] : raw)
        return
      }
      tick()
    })
  }

  return (
    <div className="qr-scanner-modal" role="dialog" aria-modal="true" aria-label="QR code scanner">
      {/* Header */}
      <div className="qr-scanner-topbar">
        <span className="qr-scanner-title">Scan Parcel QR Code</span>
        <button className="qr-close-btn" onClick={onClose} aria-label="Close scanner">
          <X size={18} />
        </button>
      </div>

      {/* Camera viewport */}
      <div className="qr-viewport">
        <video ref={videoRef} className="qr-video" muted playsInline />
        <canvas ref={canvasRef} className="qr-canvas" />

        {/* Scan frame */}
        {status === 'active' && (
          <div className="qr-frame" aria-hidden="true">
            <span className="qr-corner qr-corner--tl" />
            <span className="qr-corner qr-corner--tr" />
            <span className="qr-corner qr-corner--bl" />
            <span className="qr-corner qr-corner--br" />
            <div className="qr-scan-line" />
          </div>
        )}

        {/* Overlay states */}
        {status === 'requesting' && (
          <div className="qr-overlay">
            <Camera size={32} />
            <p>Requesting camera…</p>
          </div>
        )}
        {status === 'error' && (
          <div className="qr-overlay qr-overlay--error">
            <p>⚠️ Camera unavailable</p>
            <p className="qr-overlay-sub">Please allow camera access and reload.</p>
          </div>
        )}
        {status === 'found' && (
          <div className="qr-overlay qr-overlay--found">
            <span className="qr-found-tick">✓</span>
            <p>QR Code detected!</p>
          </div>
        )}
      </div>

      <p className="qr-scanner-hint">Point the camera at any Transcage parcel QR code</p>
    </div>
  )
}

export default QrScanner
