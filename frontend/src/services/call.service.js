/**
 * Call signaling API service.
 * All routes talk to the Express backend which manages call sessions in MySQL.
 *
 * Backend routes expected:
 *   POST   /api/calls/initiate       body: { parcelId }         → { callId, receiverName }
 *   GET    /api/calls/:id            → { status, offer, answer, iceCandidates, role }
 *   PUT    /api/calls/:id/offer      body: { sdp }              → { ok }
 *   PUT    /api/calls/:id/answer     body: { sdp }              → { ok }
 *   POST   /api/calls/:id/ice        body: { candidate }        → { ok }
 *   DELETE /api/calls/:id                                       → { ok }
 *   GET    /api/calls/incoming       → { callId, offer, callerName } | null
 */
import api from './api'

export const initiateCall = (parcelId)        => api.post('/calls/initiate', { parcelId }).then((r) => r.data)
export const getCallState = (callId)          => api.get(`/calls/${callId}`).then((r) => r.data)
export const sendOffer    = (callId, sdp)     => api.put(`/calls/${callId}/offer`,  { sdp }).then((r) => r.data)
export const sendAnswer   = (callId, sdp)     => api.put(`/calls/${callId}/answer`, { sdp }).then((r) => r.data)
export const sendIce      = (callId, c)       => api.post(`/calls/${callId}/ice`,   { candidate: c }).then((r) => r.data)
export const endCall      = (callId)          => api.delete(`/calls/${callId}`).then((r) => r.data)
export const getIncoming  = ()               => api.get('/calls/incoming').then((r) => r.data)
