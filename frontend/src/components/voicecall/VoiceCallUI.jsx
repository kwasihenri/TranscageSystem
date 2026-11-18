import { useEffect, useRef } from 'react'
import { Mic, MicOff, PhoneOff, PhoneIncoming, Phone } from 'lucide-react'
import './VoiceCallUI.css'

/** Format seconds → MM:SS */
function fmt(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0')
  const s = (sec % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

const STATUS_LABEL = {
  calling:    'Calling…',
  connecting: 'Connecting…',
  connected:  'Connected',
  ended:      'Call ended',
  error:      'Call failed',
}

/**
 * VoiceCallUI — full-screen overlay for voice calls.
 *
 * Props:
 *   call        — object from useVoiceCall()
 *   onClose()   — called when overlay should be dismissed (after ended/error)
 *   incoming    — if true, renders accept/decline buttons instead of active call
 *   onAccept()  — called when user taps "Accept" (incoming mode)
 *   onDecline() — called when user taps "Decline" (incoming mode)
 */
function VoiceCallUI({ call, onClose, incoming = false, onAccept, onDecline }) {
  const { status, isMuted, contactName, duration, errorMsg, remoteAudio, hangUp, toggleMute } = call

  /* Attach audio element ref */
  const audioElRef = useRef(null)
  useEffect(() => {
    if (remoteAudio) remoteAudio.current = audioElRef.current
  }, [remoteAudio])

  const isActive   = status === 'connected'
  const isEnded    = status === 'ended' || status === 'error'
  const isPulsing  = status === 'calling' || status === 'connecting' || incoming

  function handleClose() {
    if (isActive) hangUp()
    onClose?.()
  }

  return (
    <div className="vc-overlay" role="dialog" aria-modal="true" aria-label="Voice call">
      {/* Hidden audio element for remote audio */}
      <audio ref={audioElRef} autoPlay playsInline className="vc-audio" aria-hidden="true" />

      {/* Background blur effect */}
      <div className="vc-bg" />

      {/* Call card */}
      <div className="vc-card">
        {/* Avatar */}
        <div className={`vc-avatar-wrap${isPulsing ? ' vc-avatar-wrap--pulse' : ''}`}>
          <div className="vc-avatar-ring vc-avatar-ring--2" aria-hidden="true" />
          <div className="vc-avatar-ring vc-avatar-ring--1" aria-hidden="true" />
          <div className="vc-avatar">
            {contactName ? contactName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : '??'}
          </div>
        </div>

        {/* Name + status */}
        <h2 className="vc-name">{contactName || 'Unknown'}</h2>
        <p className={`vc-status ${isEnded ? 'vc-status--ended' : ''}`}>
          {incoming ? '📞 Incoming call…' : (STATUS_LABEL[status] || status)}
        </p>

        {/* Duration */}
        {isActive && (
          <p className="vc-duration">{fmt(duration)}</p>
        )}

        {/* Error */}
        {errorMsg && <p className="vc-error">{errorMsg}</p>}

        {/* Controls */}
        {incoming ? (
          /* Incoming call — accept / decline */
          <div className="vc-controls">
            <button className="vc-btn vc-btn--decline" onClick={onDecline} aria-label="Decline call">
              <PhoneOff size={22} />
            </button>
            <button className="vc-btn vc-btn--accept" onClick={onAccept} aria-label="Accept call">
              <Phone size={22} />
            </button>
          </div>
        ) : isEnded ? (
          /* Call ended */
          <button className="vc-btn vc-btn--close" onClick={handleClose} aria-label="Close">
            Close
          </button>
        ) : (
          /* Active / connecting call */
          <div className="vc-controls">
            <div className="vc-side-actions">
              <button
                className={`vc-btn vc-btn--mute${isMuted ? ' vc-btn--muted' : ''}`}
                onClick={toggleMute}
                aria-pressed={isMuted}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
            </div>
            <button className="vc-btn vc-btn--end" onClick={hangUp} aria-label="End call">
              <PhoneOff size={22} />
            </button>
            <div className="vc-side-actions" /> {/* spacer */}
          </div>
        )}
      </div>
    </div>
  )
}

export default VoiceCallUI
