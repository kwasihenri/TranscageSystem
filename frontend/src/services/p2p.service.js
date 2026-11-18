/**
 * P2P (Intracity / Door-to-Door) delivery service.
 *
 * Backend routes expected:
 *   GET    /api/p2p/jobs              — open jobs pool (any available driver can browse)
 *   POST   /api/p2p/jobs/:id/accept   — driver accepts a job
 *   GET    /api/p2p/jobs/mine         — jobs accepted by this driver
 *   GET    /api/p2p/jobs/:id          — single job detail
 *   POST   /api/p2p/jobs/:id/pickup   — verify sender pickup OTP → status: picked_up
 *   POST   /api/p2p/jobs/:id/deliver  — verify receiver delivery OTP → status: delivered
 *   POST   /api/p2p/jobs/:id/fail     — mark failed delivery attempt
 */
import api from './api'

export const getOpenP2PJobs  = ()         => api.get('/p2p/jobs').then((r) => r.data ?? r)
export const getMyP2PJobs    = ()         => api.get('/p2p/jobs/mine').then((r) => r.data ?? r)
export const getP2PJob       = (id)       => api.get(`/p2p/jobs/${id}`).then((r) => r.data ?? r)
export const acceptP2PJob    = (id)       => api.post(`/p2p/jobs/${id}/accept`).then((r) => r.data ?? r)
export const verifyPickupOTP = (id, otp)  => api.post(`/p2p/jobs/${id}/pickup`,  { otp }).then((r) => r.data ?? r)
export const verifyDeliveryOTP = (id, otp) => api.post(`/p2p/jobs/${id}/deliver`, { otp }).then((r) => r.data ?? r)
export const markFailedDelivery = (id, reason) => api.post(`/p2p/jobs/${id}/fail`, { reason }).then((r) => r.data ?? r)
