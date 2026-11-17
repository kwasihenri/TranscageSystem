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

/* ── Get single parcel ─────────────────────────────────── */
export async function getParcelById(id) {
  try {
    return await api.get(`/parcels/${id}`)
  } catch {
    if (import.meta.env.DEV) {
      const all = getDemoParcels()
      return all.find((p) => p.trackingId === id || p.id === id) || null
    }
    return null
  }
}
