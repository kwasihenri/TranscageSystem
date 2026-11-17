import api from './api'

/* ── Storage keys ──────────────────────────────────────── */
const MANIFEST_KEY = 'tc_demo_manifests'
const PARCEL_KEY   = 'tc_demo_parcels'
const AVAIL_KEY    = 'tc_driver_available'
const LOC_KEY      = 'tc_driver_location'

function getManifests() {
  try { return JSON.parse(localStorage.getItem(MANIFEST_KEY) || '[]') } catch { return [] }
}
function saveManifests(m) { localStorage.setItem(MANIFEST_KEY, JSON.stringify(m)) }

function getParcels() {
  try { return JSON.parse(localStorage.getItem(PARCEL_KEY) || '[]') } catch { return [] }
}
function saveParcels(p) { localStorage.setItem(PARCEL_KEY, JSON.stringify(p)) }

function transitionParcel(trackingId, newStatus, note) {
  const all = getParcels()
  const idx = all.findIndex((p) => p.trackingId === trackingId || p.id === trackingId)
  if (idx < 0) return
  all[idx] = {
    ...all[idx], status: newStatus,
    history: [...(all[idx].history || []), { status: newStatus, note, timestamp: new Date().toISOString() }],
  }
  saveParcels(all)
}

/* ═══════════════════════════════════════════════════════
   Driver operations
   ═══════════════════════════════════════════════════════ */

/* ── Get jobs (dispatched + arrived manifests) ─────────── */
export async function getDriverJobs(driverName) {
  try { return await api.get('/driver/jobs') }
  catch {
    if (!import.meta.env.DEV) return []
    const all = getManifests().filter((m) => ['dispatched', 'arrived'].includes(m.status))
    /* Prefer matching by name, fall back to all for demo */
    if (driverName) {
      const matched = all.filter((m) =>
        (m.driverName || '').toLowerCase().includes(driverName.toLowerCase()))
      if (matched.length) return matched
    }
    return all
  }
}

/* ── Get one job ───────────────────────────────────────── */
export async function getDriverJob(manifestId) {
  try { return await api.get(`/manifests/${manifestId}`) }
  catch {
    if (!import.meta.env.DEV) return null
    return getManifests().find((m) => m.id === manifestId) || null
  }
}

/* ── Mark manifest arrived + auto-receive parcels ─────── */
export async function markArrived(manifestId) {
  try { return await api.post(`/manifests/${manifestId}/arrive`) }
  catch {
    if (!import.meta.env.DEV) throw new Error('Backend unavailable.')
    const all = getManifests()
    const idx = all.findIndex((m) => m.id === manifestId)
    if (idx < 0) throw new Error('Job not found.')
    if (all[idx].status !== 'dispatched') throw new Error('This trip has already arrived.')

    all[idx] = { ...all[idx], status: 'arrived', arrivedAt: new Date().toISOString() }
    saveManifests(all)

    /* Transition each parcel: in_transit → at_destination */
    all[idx].parcels.forEach((tid) => {
      transitionParcel(tid, 'at_destination',
        `Arrived at ${all[idx].destinationStation}. Ready for receiver collection.`)
    })
    return all[idx]
  }
}

/* ── Availability ──────────────────────────────────────── */
export function getDriverAvailability() {
  return localStorage.getItem(AVAIL_KEY) !== 'false'
}
export function setDriverAvailability(available) {
  localStorage.setItem(AVAIL_KEY, String(available))
}

/* ── Location ──────────────────────────────────────────── */
export function getDriverLocation() {
  try { return JSON.parse(localStorage.getItem(LOC_KEY) || 'null') }
  catch { return null }
}
export function saveDriverLocation(data) {
  localStorage.setItem(LOC_KEY, JSON.stringify({ ...data, updatedAt: new Date().toISOString() }))
  return getDriverLocation()
}
