/**
 * GPS coordinates for each Transcage station in Ghana.
 * Used to place markers and animate the driver position on the live map.
 */
export const STATION_COORDS = {
  'acc-central': { lat: 5.5460,  lng: -0.2057 },
  'acc-tema':    { lat: 5.6698,  lng: -0.0166 },
  'ksi-asafo':   { lat: 6.6948,  lng: -1.6252 },
  'tad-stc':     { lat: 4.9016,  lng: -1.7746 },
  'tma-central': { lat: 9.4034,  lng: -0.8424 },
  'cco-unt':     { lat: 5.1053,  lng: -1.2466 },
  'sunyani':     { lat: 7.3349,  lng: -2.3267 },
  'ho':          { lat: 6.6011,  lng:  0.4714 },
}

export function getStationCoords(id) {
  return STATION_COORDS[id] || null
}

/** Linear interpolation between two lat/lng coordinates. */
export function lerpCoords(a, b, t) {
  return {
    lat: a.lat + (b.lat - a.lat) * t,
    lng: a.lng + (b.lng - a.lng) * t,
  }
}

/**
 * Estimate trip progress (0–0.95) based on the dispatch timestamp.
 * Assumes a default total trip duration of 2.5 hours.
 */
export function estimateTripProgress(dispatchedAt, tripHours = 2.5) {
  if (!dispatchedAt) return 0.1
  const elapsed = (Date.now() - new Date(dispatchedAt).getTime()) / 3_600_000
  return Math.min(Math.max(elapsed / tripHours, 0.02), 0.95)
}

/**
 * Returns the estimated arrival time as a locale time string.
 */
export function estimateEta(dispatchedAt, tripHours = 2.5) {
  if (!dispatchedAt) return null
  const totalMs  = tripHours * 3_600_000
  const eta      = new Date(new Date(dispatchedAt).getTime() + totalMs)
  return eta.toLocaleTimeString('en-GH', { timeStyle: 'short' })
}
