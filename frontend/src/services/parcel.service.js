import api from './api'

const STORAGE_KEY = 'tc_demo_parcels'

function getDemoParcels() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') }
  catch { return [] }
}

function saveDemoParcels(parcels) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(parcels))
}

function generateTrackingId() {
  const year = new Date().getFullYear()
  const num  = String(Math.floor(Math.random() * 90000) + 10000)
  return `TC-${year}-${num}`
}

/* ── Demo "ready for collection" parcel ────────────────── */
function buildDemoReadyParcel() {
  const now = Date.now()
  return {
    id:           'demo-ready',
    trackingId:   'TC-DEMO-00001',
    deliveryType: 'intercity',
    originStation:      'tad-stc',
    destinationStation: 'acc-central',
    receiverName:  'Kwame Asante',
    receiverPhone: '0244000001',
    description:   'Black laptop bag with charger',
    weight:        '1-3',
    category:      'Electronics',
    fragile:       false,
    status:        'at_destination',
    createdAt:     new Date(now - 3 * 3600_000).toISOString(),
    otp:           '123456',
    history: [
      { status: 'created',        note: 'Parcel booked.',                                              timestamp: new Date(now - 3 * 3600_000).toISOString() },
      { status: 'at_origin',      note: 'Checked in at Takoradi STC Terminal.',                        timestamp: new Date(now - 2 * 3600_000).toISOString() },
      { status: 'in_transit',     note: 'Dispatched on intercity manifest TC-MAN-001.',                timestamp: new Date(now - 1.5 * 3600_000).toISOString() },
      { status: 'at_destination', note: 'Arrived at Accra Central Station. Receiver has been notified.',timestamp: new Date(now - 0.5 * 3600_000).toISOString() },
    ],
  }
}

function findParcel(id) {
  const all = getDemoParcels()
  const found = all.find((p) => p.trackingId === id || p.id === id)
  if (found) return found
  if (id === 'TC-DEMO-00001') return buildDemoReadyParcel()
  return null
}

/* ── Create parcel ─────────────────────────────────────── */
export async function createParcel(data) {
  try {
    return await api.post('/parcels', data)
  } catch {
    if (import.meta.env.DEV) {
      const parcel = {
        id:          `local-${Date.now()}`,
        trackingId:  generateTrackingId(),
        ...data,
        status:      'created',
        createdAt:   new Date().toISOString(),
        otp:         String(Math.floor(100000 + Math.random() * 900000)), // 6-digit
        history: [
          {
            status:    'created',
            note:      'Parcel booked successfully.',
            timestamp: new Date().toISOString(),
          },
        ],
      }
      const all = getDemoParcels()
      all.unshift(parcel)
      saveDemoParcels(all)
      return parcel
    }
    throw new Error('Could not create parcel. Backend unavailable.')
  }
}

/* ── Get user's parcels ────────────────────────────────── */
export async function getMyParcels() {
  try {
    return await api.get('/parcels/mine')
  } catch {
    if (import.meta.env.DEV) return getDemoParcels()
    return []
  }
}

/* ── Get single parcel (authenticated) ─────────────────── */
export async function getParcelById(id) {
  try {
    return await api.get(`/parcels/${id}`)
  } catch {
    if (import.meta.env.DEV) return findParcel(id)
    return null
  }
}

/* ── Public tracking (no auth required) ────────────────── */
export async function trackPublic(id) {
  try {
    return await api.get(`/track/${id}`)
  } catch {
    if (import.meta.env.DEV) return findParcel(id)
    return null
  }
}

/* ── Verify receiver OTP and mark delivered ────────────── */
export async function verifyReceiverOTP(trackingId, phone, otp) {
  try {
    return await api.post('/parcels/collect', { trackingId, phone, otp })
  } catch {
    if (!import.meta.env.DEV) throw new Error('Collection service unavailable.')

    const parcel = findParcel(trackingId)
    if (!parcel) throw new Error('Parcel not found.')

    const normalise = (p) => p.replace(/\s/g, '')
    if (normalise(parcel.receiverPhone) !== normalise(phone))
      throw new Error('Phone number does not match the registered receiver.')

    if (parcel.status === 'delivered')
      throw new Error('This parcel has already been collected.')

    if (parcel.status !== 'at_destination')
      throw new Error('This parcel is not ready for collection yet.')

    if ((parcel.otp || '123456') !== otp)
      throw new Error('Incorrect OTP. Please check and try again.')

    /* Mark delivered in localStorage (skip for demo-ready parcel since it isn't in localStorage) */
    const all = getDemoParcels()
    const idx = all.findIndex((p) => p.trackingId === trackingId || p.id === parcel.id)
    const updated = {
      ...parcel,
      status: 'delivered',
      history: [
        ...parcel.history,
        { status: 'delivered', note: 'Parcel collected by receiver.', timestamp: new Date().toISOString() },
      ],
    }
    if (idx >= 0) { all[idx] = updated; saveDemoParcels(all) }

    return updated
  }
}
