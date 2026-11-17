import api from './api'

/* ── Storage helpers ───────────────────────────────────── */
const PARCEL_KEY   = 'tc_demo_parcels'
const MANIFEST_KEY = 'tc_demo_manifests'

function getParcels() {
  try { return JSON.parse(localStorage.getItem(PARCEL_KEY) || '[]') } catch { return [] }
}
function saveParcels(p) { localStorage.setItem(PARCEL_KEY, JSON.stringify(p)) }

function getManifests() {
  try { return JSON.parse(localStorage.getItem(MANIFEST_KEY) || '[]') } catch { return [] }
}
function saveManifests(m) { localStorage.setItem(MANIFEST_KEY, JSON.stringify(m)) }

/* ── Demo "ready" parcel (falls back when not in localStorage) ─── */
function buildDemoReadyParcel() {
  const now = Date.now()
  return {
    id: 'demo-ready', trackingId: 'TC-DEMO-00001',
    deliveryType: 'intercity', originStation: 'tad-stc', destinationStation: 'acc-central',
    receiverName: 'Kwame Asante', receiverPhone: '0244000001',
    description: 'Black laptop bag', weight: '1-3', category: 'Electronics', fragile: false,
    status: 'at_destination', createdAt: new Date(now - 3*3600_000).toISOString(), otp: '123456',
    history: [
      { status: 'created',        note: 'Parcel booked.',                            timestamp: new Date(now - 3*3600_000).toISOString() },
      { status: 'at_origin',      note: 'Checked in at Takoradi STC Terminal.',      timestamp: new Date(now - 2*3600_000).toISOString() },
      { status: 'in_transit',     note: 'Dispatched on intercity manifest.',         timestamp: new Date(now - 1.5*3600_000).toISOString() },
      { status: 'at_destination', note: 'Arrived at Accra Central Station.',         timestamp: new Date(now - 0.5*3600_000).toISOString() },
    ],
  }
}

function findParcel(id) {
  const all = getParcels()
  const found = all.find((p) => p.trackingId === id || p.id === id)
  if (found) return found
  if (id === 'TC-DEMO-00001') return buildDemoReadyParcel()
  return null
}

function updateParcelStatus(trackingId, newStatus, note, extra = {}) {
  const all = getParcels()
  const idx = all.findIndex((p) => p.trackingId === trackingId || p.id === trackingId)

  /* If it's the demo parcel and not in localStorage yet, materialise it */
  if (idx < 0 && trackingId === 'TC-DEMO-00001') {
    const demo = { ...buildDemoReadyParcel(), ...extra, status: newStatus,
      history: [...buildDemoReadyParcel().history, { status: newStatus, note, timestamp: new Date().toISOString() }] }
    all.push(demo)
    saveParcels(all)
    return demo
  }
  if (idx < 0) throw new Error('Parcel not found in local storage.')

  const updated = {
    ...all[idx], ...extra, status: newStatus,
    history: [...(all[idx].history || []), { status: newStatus, note, timestamp: new Date().toISOString() }],
  }
  all[idx] = updated
  saveParcels(all)
  return updated
}

function generateManifestId() {
  return `MAN-${new Date().getFullYear()}-${Math.floor(10000 + Math.random()*90000)}`
}

/* ══════════════════════════════════════════════════════════
   Clerk Operations
   ══════════════════════════════════════════════════════════ */

/* ── Scan / look up a parcel ──────────────────────────── */
export async function clerkScanParcel(id) {
  try { return await api.get(`/track/${id}`) }
  catch {
    if (import.meta.env.DEV) return findParcel(id.trim().toUpperCase())
    return null
  }
}

/* ── Check in parcel at station ───────────────────────── */
export async function clerkCheckIn(trackingId) {
  try { return await api.post('/clerk/check-in', { trackingId }) }
  catch {
    if (!import.meta.env.DEV) throw new Error('Backend unavailable.')
    const p = findParcel(trackingId)
    if (!p) throw new Error('Parcel not found.')
    if (p.status === 'created')    return updateParcelStatus(trackingId, 'at_origin',      'Checked in at origin station.')
    if (p.status === 'in_transit') return updateParcelStatus(trackingId, 'at_destination', 'Arrived at destination station. Receiver notified.')
    throw new Error(`Cannot check in a parcel with status "${p.status}".`)
  }
}

/* ── Create a manifest ────────────────────────────────── */
export async function clerkCreateManifest({ originStation, destinationStation, driverName }) {
  try { return await api.post('/manifests', { originStation, destinationStation, driverName }) }
  catch {
    if (!import.meta.env.DEV) throw new Error('Backend unavailable.')
    const manifest = {
      id: generateManifestId(), originStation, destinationStation,
      driverName: driverName || '', parcels: [],
      status: 'open', createdAt: new Date().toISOString(), dispatchedAt: null,
    }
    const all = getManifests()
    all.unshift(manifest)
    saveManifests(all)
    return manifest
  }
}

/* ── Get all manifests ────────────────────────────────── */
export async function clerkGetManifests() {
  try { return await api.get('/manifests') }
  catch {
    if (import.meta.env.DEV) return getManifests()
    return []
  }
}

/* ── Add parcel to manifest ───────────────────────────── */
export async function clerkAddToManifest(trackingId, manifestId) {
  try { return await api.post(`/manifests/${manifestId}/parcels`, { trackingId }) }
  catch {
    if (!import.meta.env.DEV) throw new Error('Backend unavailable.')
    const p = findParcel(trackingId)
    if (!p) throw new Error('Parcel not found.')
    if (p.status !== 'at_origin') throw new Error(`Parcel must be at origin to add to manifest (current: ${p.status}).`)

    const all = getManifests()
    const idx = all.findIndex((m) => m.id === manifestId)
    if (idx < 0) throw new Error('Manifest not found.')
    if (all[idx].status !== 'open') throw new Error('Manifest is already dispatched.')
    if (all[idx].parcels.includes(trackingId)) throw new Error('Parcel already in this manifest.')

    all[idx].parcels.push(trackingId)
    saveManifests(all)
    return all[idx]
  }
}

/* ── Dispatch manifest (all parcels → in_transit) ─────── */
export async function clerkDispatchManifest(manifestId) {
  try { return await api.post(`/manifests/${manifestId}/dispatch`) }
  catch {
    if (!import.meta.env.DEV) throw new Error('Backend unavailable.')
    const all = getManifests()
    const idx = all.findIndex((m) => m.id === manifestId)
    if (idx < 0) throw new Error('Manifest not found.')
    if (all[idx].parcels.length === 0) throw new Error('Cannot dispatch an empty manifest.')

    all[idx].status      = 'dispatched'
    all[idx].dispatchedAt = new Date().toISOString()
    saveManifests(all)

    /* Transition all parcels to in_transit */
    all[idx].parcels.forEach((tid) => {
      try {
        updateParcelStatus(tid, 'in_transit',
          `Dispatched on manifest ${manifestId} to ${all[idx].destinationStation}.`)
      } catch { /* parcel may not be in localStorage */ }
    })
    return all[idx]
  }
}

/* ── Clerk-side OTP verify (no phone step needed) ─────── */
export async function clerkVerifyOTP(trackingId, otp) {
  try { return await api.post('/clerk/verify-otp', { trackingId, otp }) }
  catch {
    if (!import.meta.env.DEV) throw new Error('Backend unavailable.')
    const p = findParcel(trackingId)
    if (!p) throw new Error('Parcel not found.')
    if (p.status === 'delivered') throw new Error('This parcel has already been collected.')
    if (p.status !== 'at_destination') throw new Error('Parcel is not ready for collection yet.')
    if ((p.otp || '123456') !== otp.trim()) throw new Error('Incorrect OTP. Check and try again.')
    return updateParcelStatus(trackingId, 'delivered', 'Parcel handed over to receiver by clerk.')
  }
}

/* ── Get all station parcels ──────────────────────────── */
export async function getStationParcels() {
  try { return await api.get('/clerk/parcels') }
  catch {
    if (import.meta.env.DEV) return getParcels()
    return []
  }
}
