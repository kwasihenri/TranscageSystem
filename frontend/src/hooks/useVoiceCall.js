/**
 * useVoiceCall — WebRTC voice call hook.
 *
 * Manages the full RTCPeerConnection lifecycle for both caller (driver)
 * and callee (receiver) sides. Uses REST polling against the backend
 * for signaling; no WebSocket required (backend can upgrade later).
 *
 * Usage:
 *   const call = useVoiceCall()
 *   call.startCall(parcelId)   // driver initiates
 *   call.acceptCall(callId, offer) // receiver accepts
 *   call.hangUp()
 *   call.toggleMute()
 */
import { useState, useRef, useCallback, useEffect } from 'react'
import {
  initiateCall, getCallState, sendOffer, sendAnswer,
  sendIce, endCall,
} from '../services/call.service'

const ICE_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
}

const POLL_INTERVAL_MS = 2000

export default function useVoiceCall() {
  const [status,       setStatus]       = useState('idle')    // idle | calling | connecting | connected | ended | error
  const [isMuted,      setIsMuted]      = useState(false)
  const [callId,       setCallId]       = useState(null)
  const [contactName,  setContactName]  = useState('')
  const [duration,     setDuration]     = useState(0)         // seconds
  const [errorMsg,     setErrorMsg]     = useState('')

  const pcRef         = useRef(null)   // RTCPeerConnection
  const localStream   = useRef(null)   // MediaStream (mic)
  const remoteAudio   = useRef(null)   // <audio> element for remote track
  const pollRef       = useRef(null)   // setInterval id
  const timerRef      = useRef(null)   // setInterval id for duration
  const pendingIce    = useRef([])     // ICE queue before remote desc is set
  const sentIce       = useRef(new Set())

  /* ── Cleanup ───────────────────────────────────────────── */
  const cleanup = useCallback((finalStatus = 'ended') => {
    clearInterval(pollRef.current)
    clearInterval(timerRef.current)
    localStream.current?.getTracks().forEach((t) => t.stop())
    pcRef.current?.close()
    pcRef.current   = null
    localStream.current = null
    setStatus(finalStatus)
    setDuration(0)
    setCallId(null)
  }, [])

  /* ── Build PeerConnection ──────────────────────────────── */
  function buildPeer(cid) {
    const pc = new RTCPeerConnection(ICE_CONFIG)
    pcRef.current = pc

    pc.onicecandidate = ({ candidate }) => {
      if (!candidate) return
      const key = JSON.stringify(candidate)
      if (sentIce.current.has(key)) return
      sentIce.current.add(key)
      sendIce(cid, candidate).catch(() => {})
    }

    pc.ontrack = (event) => {
      if (remoteAudio.current) {
        remoteAudio.current.srcObject = event.streams[0]
        remoteAudio.current.play().catch(() => {})
      }
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setStatus('connected')
        setDuration(0)
        timerRef.current = setInterval(() => setDuration((s) => s + 1), 1000)
      } else if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) {
        cleanup('ended')
      }
    }

    return pc
  }

  /* ── Add queued ICE candidates ─────────────────────────── */
  async function drainPendingIce(pc) {
    for (const c of pendingIce.current) {
      await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {})
    }
    pendingIce.current = []
  }

  /* ── startCall (caller / driver) ───────────────────────── */
  const startCall = useCallback(async (parcelId) => {
    try {
      setStatus('calling')
      setErrorMsg('')
      sentIce.current = new Set()
      pendingIce.current = []

      const { callId: cid, receiverName } = await initiateCall(parcelId)
      setCallId(cid)
      setContactName(receiverName || 'Receiver')

      localStream.current = await navigator.mediaDevices.getUserMedia({ audio: true })
      const pc = buildPeer(cid)
      localStream.current.getTracks().forEach((t) => pc.addTrack(t, localStream.current))

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      await sendOffer(cid, offer)

      setStatus('connecting')

      /* Poll for answer + remote ICE */
      pollRef.current = setInterval(async () => {
        try {
          const state = await getCallState(cid)
          if (state.status === 'declined' || state.status === 'ended') {
            clearInterval(pollRef.current)
            cleanup('ended'); return
          }
          if (state.answer && pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(state.answer))
            await drainPendingIce(pc)
          }
          for (const c of (state.iceCandidates || [])) {
            const key = JSON.stringify(c)
            if (sentIce.current.has(key)) continue
            if (pc.remoteDescription) {
              await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {})
            } else {
              pendingIce.current.push(c)
            }
          }
        } catch {}
      }, POLL_INTERVAL_MS)

    } catch (err) {
      setErrorMsg(err.message || 'Failed to start call')
      setStatus('error')
      cleanup('error')
    }
  }, [cleanup])

  /* ── acceptCall (callee / receiver) ───────────────────── */
  const acceptCall = useCallback(async (cid, offerSdp, callerName) => {
    try {
      setStatus('connecting')
      setCallId(cid)
      setContactName(callerName || 'Driver')
      setErrorMsg('')
      sentIce.current = new Set()
      pendingIce.current = []

      localStream.current = await navigator.mediaDevices.getUserMedia({ audio: true })
      const pc = buildPeer(cid)
      localStream.current.getTracks().forEach((t) => pc.addTrack(t, localStream.current))

      await pc.setRemoteDescription(new RTCSessionDescription(offerSdp))
      await drainPendingIce(pc)
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      await sendAnswer(cid, answer)

      /* Poll for remote ICE */
      pollRef.current = setInterval(async () => {
        try {
          const state = await getCallState(cid)
          if (state.status === 'ended') { clearInterval(pollRef.current); cleanup('ended'); return }
          for (const c of (state.iceCandidates || [])) {
            const key = JSON.stringify(c)
            if (sentIce.current.has(key)) continue
            sentIce.current.add(key)
            await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {})
          }
        } catch {}
      }, POLL_INTERVAL_MS)

    } catch (err) {
      setErrorMsg(err.message || 'Failed to accept call')
      setStatus('error')
      cleanup('error')
    }
  }, [cleanup])

  /* ── hangUp ────────────────────────────────────────────── */
  const hangUp = useCallback(() => {
    if (callId) endCall(callId).catch(() => {})
    cleanup('ended')
  }, [callId, cleanup])

  /* ── toggleMute ────────────────────────────────────────── */
  const toggleMute = useCallback(() => {
    localStream.current?.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled
    })
    setIsMuted((m) => !m)
  }, [])

  /* Cleanup on unmount */
  useEffect(() => () => { if (callId) endCall(callId).catch(() => {}); cleanup('ended') }, [])

  return { status, isMuted, callId, contactName, duration, errorMsg, remoteAudio, startCall, acceptCall, hangUp, toggleMute }
}
