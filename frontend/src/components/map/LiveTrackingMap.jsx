import { useEffect, useState } from 'react'
import L from 'leaflet'
// Leaflet CSS loaded via CDN in index.html to avoid Rolldown OOM
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import {
  getStationCoords,
  lerpCoords,
  estimateTripProgress,
  estimateEta,
} from '../../constants/stationCoords'
import { STATIONS } from '../../constants/parcel'
import './LiveTrackingMap.css'

/* ── Custom Leaflet icons (created once outside render) ─── */
const driverIcon = L.divIcon({
  className: 'tc-driver-icon',
  html: '<div class="tc-driver-pin"><span>🚚</span></div>',
  iconSize:   [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -24],
})
const originIcon = L.divIcon({
  className: '',
  html: '<div class="tc-station-pin tc-station-pin--origin"></div>',
  iconSize: [14, 14], iconAnchor: [7, 7],
})
const destIcon = L.divIcon({
  className: '',
  html: '<div class="tc-station-pin tc-station-pin--dest"></div>',
  iconSize: [14, 14], iconAnchor: [7, 7],
})

function getStationName(id) {
  return STATIONS.find((s) => s.id === id)?.name || id
}

/* Fits map bounds to show origin + destination */
function FitBounds({ positions }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length >= 2) {
      map.fitBounds(positions, { padding: [48, 48] })
    }
  }, [map])  // only on mount
  return null
}

function LiveTrackingMap({ parcel }) {
  const [driverPos, setDriverPos] = useState(null)
  const [eta,       setEta]       = useState(null)
  const [progress,  setProgress]  = useState(0)

  const originCoords = getStationCoords(parcel.originStation)
  const destCoords   = getStationCoords(parcel.destinationStation)

  useEffect(() => {
    if (!originCoords || !destCoords) return

    function update() {
      const dispatchEvent = parcel.history?.find((h) => h.status === 'in_transit')
      const dispatchedAt  = dispatchEvent?.timestamp || parcel.createdAt
      const p = estimateTripProgress(dispatchedAt)
      setProgress(p)
      setDriverPos(lerpCoords(originCoords, destCoords, p))
      setEta(estimateEta(dispatchedAt))
    }

    update()
    const interval = setInterval(update, 30_000)
    return () => clearInterval(interval)
  }, [parcel, originCoords?.lat, destCoords?.lat])

  if (!originCoords || !destCoords) {
    return (
      <div className="tc-map-unavailable">
        Live map is not yet available for this route.
      </div>
    )
  }

  const midPoint  = lerpCoords(originCoords, destCoords, 0.5)
  const boundsPos = [[originCoords.lat, originCoords.lng], [destCoords.lat, destCoords.lng]]
  const fullRoute = [[originCoords.lat, originCoords.lng], [destCoords.lat, destCoords.lng]]
  const travelled = driverPos
    ? [[originCoords.lat, originCoords.lng], [driverPos.lat, driverPos.lng]]
    : []

  return (
    <div className="tc-live-map-wrap">
      {/* ── ETA bar ─────────────────────────────────────── */}
      <div className="tc-map-eta-bar">
        <div className="tc-map-eta-left">
          <span className="tc-live-dot" />
          <span className="tc-map-status">🚚 Driver en route</span>
        </div>
        <div className="tc-map-eta-right">
          <div className="tc-map-progress-bar-wrap">
            <div
              className="tc-map-progress-fill"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <span className="tc-map-pct">{Math.round(progress * 100)}%</span>
          {eta && <span className="tc-map-eta">ETA&nbsp;<strong>{eta}</strong></span>}
        </div>
      </div>

      {/* ── Leaflet map ──────────────────────────────────── */}
      <MapContainer
        center={[midPoint.lat, midPoint.lng]}
        zoom={8}
        className="tc-leaflet-map"
        scrollWheelZoom={false}
        zoomControl
      >
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds positions={boundsPos} />

        {/* Dashed full route */}
        <Polyline positions={fullRoute} color="#94a3b8" weight={2} dashArray="8 6" />

        {/* Blue travelled segment */}
        {travelled.length === 2 && (
          <Polyline positions={travelled} color="#2563eb" weight={3.5} />
        )}

        {/* Origin */}
        <Marker position={[originCoords.lat, originCoords.lng]} icon={originIcon}>
          <Popup className="tc-map-popup">{getStationName(parcel.originStation)}</Popup>
        </Marker>

        {/* Destination */}
        <Marker position={[destCoords.lat, destCoords.lng]} icon={destIcon}>
          <Popup className="tc-map-popup">{getStationName(parcel.destinationStation)}</Popup>
        </Marker>

        {/* Driver truck */}
        {driverPos && (
          <Marker position={[driverPos.lat, driverPos.lng]} icon={driverIcon}>
            <Popup className="tc-map-popup">
              Driver en route — {Math.round(progress * 100)}% complete
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* ── Legend ──────────────────────────────────────── */}
      <div className="tc-map-legend">
        <span className="tc-legend-item"><span className="tc-leg-dot tc-leg-dot--origin" />Origin</span>
        <span className="tc-legend-item"><span className="tc-leg-truck">🚚</span>Driver</span>
        <span className="tc-legend-item"><span className="tc-leg-dot tc-leg-dot--dest" />Destination</span>
      </div>
    </div>
  )
}

export default LiveTrackingMap
