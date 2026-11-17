import { useState, useEffect } from 'react'
import { Plus, ChevronDown, ChevronUp, Truck, Package, ArrowRight, Layers } from 'lucide-react'
import { STATIONS } from '../../constants/parcel'
import {
  clerkGetManifests,
  clerkCreateManifest,
  clerkAddToManifest,
  clerkDispatchManifest,
  clerkScanParcel,
} from '../../services/clerk.service'
import TcIllustration from '../../components/common/TcIllustration'
import './ManifestsPage.css'

function getStationName(id) {
  return STATIONS.find((s) => s.id === id)?.name || id || '—'
}

const STATUS_BADGE = {
  open:       'badge-blue',
  dispatched: 'badge-amber',
  arrived:    'badge-green',
}

function relTime(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(iso).toLocaleDateString('en-GH', { day: 'numeric', month: 'short' })
}

function ManifestsPage() {
  const [manifests, setManifests]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [expanded, setExpanded]     = useState(null) // manifest ID

  /* Create form */
  const [showCreate, setShowCreate]   = useState(false)
  const [creating, setCreating]       = useState(false)
  const [createForm, setCreateForm]   = useState({ destinationStation: '', driverName: '' })
  const [createErr, setCreateErr]     = useState('')

  /* Add parcel to manifest */
  const [addInputs, setAddInputs]   = useState({}) // { manifestId: scanValue }
  const [addLoading, setAddLoading] = useState({})
  const [addErr, setAddErr]         = useState({})
  const [addSuccess, setAddSuccess] = useState({})

  /* Dispatch */
  const [dispatchLoading, setDispatchLoading] = useState({})
  const [dispatchErr, setDispatchErr]         = useState({})

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    setManifests(await clerkGetManifests())
    setLoading(false)
  }

  /* ── Create manifest ──────────────────────────────────── */
  async function handleCreate(e) {
    e.preventDefault()
    setCreateErr('')
    if (!createForm.destinationStation) { setCreateErr('Please select a destination station.'); return }
    setCreating(true)
    try {
      const m = await clerkCreateManifest({ destinationStation: createForm.destinationStation, driverName: createForm.driverName })
      setManifests((prev) => [m, ...prev])
      setShowCreate(false)
      setCreateForm({ destinationStation: '', driverName: '' })
      setExpanded(m.id)
    } catch (err) {
      setCreateErr(err.message)
    } finally {
      setCreating(false)
    }
  }

  /* ── Add parcel ───────────────────────────────────────── */
  async function handleAddParcel(manifestId) {
    const tid = (addInputs[manifestId] || '').trim().toUpperCase()
    if (!tid) return
    setAddLoading((p) => ({ ...p, [manifestId]: true }))
    setAddErr((p)     => ({ ...p, [manifestId]: '' }))
    setAddSuccess((p) => ({ ...p, [manifestId]: '' }))
    try {
      await clerkAddToManifest(tid, manifestId)
      setAddSuccess((p) => ({ ...p, [manifestId]: `✓ ${tid} added.` }))
      setAddInputs((p) => ({ ...p, [manifestId]: '' }))
      load()
    } catch (err) {
      setAddErr((p) => ({ ...p, [manifestId]: err.message }))
    } finally {
      setAddLoading((p) => ({ ...p, [manifestId]: false }))
    }
  }

  /* ── Dispatch manifest ────────────────────────────────── */
  async function handleDispatch(manifestId) {
    setDispatchLoading((p) => ({ ...p, [manifestId]: true }))
    setDispatchErr((p)     => ({ ...p, [manifestId]: '' }))
    try {
      await clerkDispatchManifest(manifestId)
      load()
    } catch (err) {
      setDispatchErr((p) => ({ ...p, [manifestId]: err.message }))
    } finally {
      setDispatchLoading((p) => ({ ...p, [manifestId]: false }))
    }
  }

  return (
    <div className="manifests-page">
      {/* Header */}
      <div className="manifests-header">
        <div className="manifests-header-inner">
          <div>
            <h1 className="page-title">Manifests</h1>
            <p className="page-subtitle">{manifests.filter((m) => m.status === 'open').length} open · {manifests.filter((m) => m.status === 'dispatched').length} in transit</p>
          </div>
          <button
            className="btn btn-primary"
            id="create-manifest-btn"
            onClick={() => setShowCreate((v) => !v)}
          >
            <Plus size={15} /> New Manifest
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <form className="create-manifest-form card" onSubmit={handleCreate}>
            <p className="create-manifest-title">Create Manifest</p>
            {createErr && <div className="scan-error">{createErr}</div>}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="dest-station">Destination Station</label>
                <select
                  id="dest-station"
                  className="form-select"
                  value={createForm.destinationStation}
                  onChange={(e) => setCreateForm((f) => ({ ...f, destinationStation: e.target.value }))}
                >
                  <option value="">Select station…</option>
                  {STATIONS.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.city})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="driver-name">Driver Name (optional)</label>
                <input
                  id="driver-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Kofi Mensah"
                  value={createForm.driverName}
                  onChange={(e) => setCreateForm((f) => ({ ...f, driverName: e.target.value }))}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={creating} id="confirm-create-manifest">
                {creating ? 'Creating…' : 'Create Manifest'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
            </div>
          </form>
        )}
      </div>

      {/* Manifest list */}
      <div className="manifests-list page-container">
        {loading ? (
          [1, 2].map((n) => (
            <div key={n} className="card skeleton" style={{ height: 80 }} />
          ))
        ) : manifests.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <TcIllustration type="empty-canvas" size={130} />
              <p className="empty-state-title">No manifests yet</p>
              <p className="empty-state-body">Create a manifest to group parcels for a driver trip.</p>
              <button className="btn btn-primary" onClick={() => setShowCreate(true)} style={{ marginTop: 8 }}>
                <Plus size={15} /> Create First Manifest
              </button>
            </div>
          </div>
        ) : (
          manifests.map((m) => {
            const isOpen = expanded === m.id
            const badge  = STATUS_BADGE[m.status] || 'badge-gray'
            return (
              <div key={m.id} className="manifest-card card">
                {/* Card header row */}
                <button
                  className="manifest-card-header"
                  onClick={() => setExpanded(isOpen ? null : m.id)}
                  aria-expanded={isOpen}
                >
                  <div className="manifest-info">
                    <div className="manifest-id-row">
                      <code className="manifest-id">{m.id}</code>
                      <span className={`badge ${badge}`}>{m.status}</span>
                    </div>
                    <div className="manifest-route">
                      <Layers size={12} /> {getStationName(m.destinationStation)}
                    </div>
                    <div className="manifest-meta">
                      <span><Package size={11} /> {m.parcels.length} parcel{m.parcels.length !== 1 ? 's' : ''}</span>
                      {m.driverName && <span><Truck size={11} /> {m.driverName}</span>}
                      <span>{relTime(m.createdAt)}</span>
                    </div>
                  </div>
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="manifest-detail">
                    {/* Parcel list */}
                    {m.parcels.length === 0 ? (
                      <p className="manifest-empty-parcels">No parcels added yet.</p>
                    ) : (
                      <div className="manifest-parcel-list">
                        {m.parcels.map((tid) => (
                          <div key={tid} className="manifest-parcel-row">
                            <Package size={12} />
                            <code>{tid}</code>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add parcel (open manifests only) */}
                    {m.status === 'open' && (
                      <>
                        <div className="manifest-add-row">
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Tracking ID to add…"
                            value={addInputs[m.id] || ''}
                            onChange={(e) => setAddInputs((p) => ({ ...p, [m.id]: e.target.value.toUpperCase() }))}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddParcel(m.id)}
                            id={`add-parcel-${m.id}`}
                          />
                          <button
                            className="btn btn-secondary btn-sm"
                            id={`add-parcel-submit-${m.id}`}
                            onClick={() => handleAddParcel(m.id)}
                            disabled={addLoading[m.id] || !addInputs[m.id]?.trim()}
                          >
                            {addLoading[m.id] ? '…' : 'Add'}
                          </button>
                        </div>
                        {addErr[m.id]     && <p className="manifest-add-err">{addErr[m.id]}</p>}
                        {addSuccess[m.id] && <p className="manifest-add-ok">{addSuccess[m.id]}</p>}
                      </>
                    )}

                    {/* Dispatch errors */}
                    {dispatchErr[m.id] && <p className="manifest-add-err">{dispatchErr[m.id]}</p>}

                    {/* Actions */}
                    {m.status === 'open' && (
                      <div className="manifest-actions">
                        <button
                          className="btn btn-primary"
                          id={`dispatch-manifest-${m.id}`}
                          onClick={() => handleDispatch(m.id)}
                          disabled={dispatchLoading[m.id] || m.parcels.length === 0}
                        >
                          <Truck size={14} />
                          {dispatchLoading[m.id] ? 'Dispatching…' : `Dispatch Manifest (${m.parcels.length})`}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default ManifestsPage
