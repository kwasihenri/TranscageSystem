import { useState, useEffect } from 'react'
import { Navigation, MapPin, Save, CheckCircle } from 'lucide-react'
import { getDriverLocation, saveDriverLocation } from '../../services/driver.service'
import './LocationPage.css'

function LocationPage() {
  const [loc,     setLoc]     = useState(getDriverLocation())
  const [landmark, setLandmark] = useState(loc?.landmark || '')
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsErr,  setGpsErr]  = useState('')
  const [saved,   setSaved]   = useState(false)

  function handleSave() {
    const updated = saveDriverLocation({ landmark, lat: loc?.lat, lng: loc?.lng })
    setLoc(updated)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function handleGetGps() {
    if (!navigator.geolocation) {
      setGpsErr('Geolocation is not supported by this browser.')
      return
    }
    setGpsLoading(true)
    setGpsErr('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords
        const updated = saveDriverLocation({ lat: latitude.toFixed(5), lng: longitude.toFixed(5), accuracy: Math.round(accuracy), landmark })
        setLoc(updated)
        setGpsLoading(false)
      },
      (err) => {
        setGpsErr(`Could not get location: ${err.message}`)
        setGpsLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div className="location-page">
      <div className="location-header">
        <h1 className="page-title">My Location</h1>
        <p className="page-subtitle">Share your position with dispatch so they can track the trip.</p>
      </div>

      <div className="page-container location-body">
        {/* Current location card */}
        <div className="card location-card">
          <div className="card-header">
            <span className="card-title">Current Position</span>
            {loc?.updatedAt && (
              <span className="location-last-updated">
                Updated {new Date(loc.updatedAt).toLocaleTimeString('en-GH', { timeStyle: 'short' })}
              </span>
            )}
          </div>
          <div className="card-body">
            {loc?.lat ? (
              <div className="location-coords-display">
                <div className="coords-row">
                  <span className="coords-label">Latitude</span>
                  <code className="coords-val">{loc.lat}</code>
                </div>
                <div className="coords-row">
                  <span className="coords-label">Longitude</span>
                  <code className="coords-val">{loc.lng}</code>
                </div>
                {loc.accuracy && (
                  <div className="coords-row">
                    <span className="coords-label">Accuracy</span>
                    <code className="coords-val">±{loc.accuracy}m</code>
                  </div>
                )}
                {loc.landmark && (
                  <div className="coords-row">
                    <span className="coords-label">Landmark</span>
                    <span className="coords-val" style={{ fontFamily: 'inherit', fontWeight: 600 }}>{loc.landmark}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="location-empty">
                <MapPin size={32} color="var(--text-muted)" strokeWidth={1.5} />
                <p>No location recorded yet. Use the GPS button or enter a landmark below.</p>
              </div>
            )}

            <button
              className="btn btn-primary location-gps-btn"
              id="get-gps-btn"
              onClick={handleGetGps}
              disabled={gpsLoading}
            >
              <Navigation size={15} />
              {gpsLoading ? 'Getting GPS…' : 'Update from GPS'}
            </button>

            {gpsErr && <p className="location-gps-err">{gpsErr}</p>}
          </div>
        </div>

        {/* Landmark / manual input */}
        <div className="card">
          <div className="card-header"><span className="card-title">Landmark or Address</span></div>
          <div className="card-body location-landmark-body">
            <p className="location-hint">
              Enter a recognizable location (e.g. "Achimota Roundabout" or "Cape Coast Bypass") that dispatch can understand.
            </p>
            <div className="form-group">
              <input
                id="landmark-input"
                type="text"
                className="form-input"
                placeholder="e.g. Kasoa Toll Booth"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
              />
            </div>
            <button
              className={`btn btn-secondary${saved ? ' btn-success' : ''}`}
              id="save-location-btn"
              onClick={handleSave}
              disabled={!landmark.trim() && !loc?.lat}
            >
              {saved ? <><CheckCircle size={15} /> Saved!</> : <><Save size={15} /> Save Location</>}
            </button>
          </div>
        </div>

        {/* Info note */}
        <div className="card location-note-card">
          <div className="card-body location-note">
            <MapPin size={15} color="var(--accent)" />
            <p>
              In the full system, your location updates automatically every few minutes while you're online and on a job.
              The dispatcher and station clerks can see your position on a live map.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LocationPage
