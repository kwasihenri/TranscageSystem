/**
 * IncomingCallListener — polls /api/calls/incoming every 5 seconds
 * for authenticated non-driver users. When an incoming call is detected,
 * renders the VoiceCallUI in callee mode.
 *
 * Mount this once in AppRoutes (inside AuthProvider + NotificationProvider).
 */
import { useState, useEffect, useRef } from 'react'
import useAuth from '../../hooks/useAuth'
import useVoiceCall from '../../hooks/useVoiceCall'
import VoiceCallUI from './VoiceCallUI'
import { getIncoming } from '../../services/call.service'
import { endCall } from '../../services/call.service'

const POLL_INTERVAL = 5000

function IncomingCallListener() {
  const { user } = useAuth()
  const call = useVoiceCall()
  const [incoming, setIncoming] = useState(null) // { callId, offer, callerName }
  const [showUI,   setShowUI]   = useState(false)
  const pollRef = useRef(null)

  useEffect(() => {
    // Only poll for customer / receiver roles
    if (!user || user.role === 'driver' || user.role === 'admin') return

    pollRef.current = setInterval(async () => {
      try {
        const data = await getIncoming()
        if (data?.callId) {
          clearInterval(pollRef.current)
          setIncoming(data)
          setShowUI(true)
        }
      } catch {}
    }, POLL_INTERVAL)

    return () => clearInterval(pollRef.current)
  }, [user])

  /* Accept */
  async function handleAccept() {
    if (!incoming) return
    await call.acceptCall(incoming.callId, incoming.offer, incoming.callerName)
  }

  /* Decline */
  async function handleDecline() {
    if (incoming?.callId) await endCall(incoming.callId).catch(() => {})
    setShowUI(false)
    setIncoming(null)
    // Resume polling
    if (user) {
      pollRef.current = setInterval(async () => {
        try {
          const data = await getIncoming()
          if (data?.callId) {
            clearInterval(pollRef.current)
            setIncoming(data)
            setShowUI(true)
          }
        } catch {}
      }, POLL_INTERVAL)
    }
  }

  /* Call ended or closed */
  function handleClose() {
    setShowUI(false)
    setIncoming(null)
  }

  if (!showUI) return null

  return (
    <VoiceCallUI
      call={call}
      incoming={call.status === 'idle'}
      onAccept={handleAccept}
      onDecline={handleDecline}
      onClose={handleClose}
    />
  )
}

export default IncomingCallListener
