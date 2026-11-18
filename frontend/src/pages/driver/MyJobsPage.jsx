import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Truck, Package, ArrowRight, CheckCircle, Layers, Bike, MapPin } from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import { getDriverJobs } from '../../services/driver.service'
import { getMyP2PJobs, getOpenP2PJobs } from '../../services/p2p.service'
import { STATIONS } from '../../constants/parcel'
import TcIllustration from '../../components/common/TcIllustration'
import './MyJobsPage.css'

function getStationName(id) {
  return STATIONS.find((s) => s.id === id)?.name || id || '—'
}

function relTime(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(iso).toLocaleDateString('en-GH', { day: 'numeric', month: 'short' })
}

const INTERCITY_STATUS_LABEL = { dispatched: 'En Route', arrived: 'Arrived' }
const INTERCITY_STATUS_BADGE  = { dispatched: 'badge-amber', arrived: 'badge-green' }

const P2P_STATUS_LABEL = {
  pending:   'Open — Accept Now',
  accepted:  'Go to Pickup',
  picked_up: 'En Route to Drop-off',
  delivered: 'Delivered',
  failed:    'Failed Attempt',
}
const P2P_STATUS_BADGE = {
  pending:   'badge-blue',
  accepted:  'badge-amber',
  picked_up: 'badge-amber',
  delivered: 'badge-green',
  failed:    'badge-red',
}

const TABS = ['Intercity', 'P2P Jobs', 'Open P2P']

function MyJobsPage() {
  const { user }   = useAuth()
  const [tab, setTab]           = useState('Intercity')
  const [intercityJobs, setIntercityJobs] = useState([])
  const [myP2PJobs, setMyP2PJobs]         = useState([])
  const [openP2PJobs, setOpenP2PJobs]     = useState([])
  const [loading, setLoading]             = useState(true)

  useEffect(() => {
    const all = Promise.all([
      getDriverJobs(user?.name).catch(() => []),
      getMyP2PJobs().catch(() => []),
      getOpenP2PJobs().catch(() => []),
    ])
    all.then(([ic, mine, open]) => {
      setIntercityJobs(ic)
      setMyP2PJobs(mine)
      setOpenP2PJobs(open)
    }).finally(() => setLoading(false))
  }, [user?.name])

  /* ── Intercity tab ───────────────────────────────────── */
  function IntercityList() {
    const [filter, setFilter] = useState('All')
    const filtered = intercityJobs.filter((j) => {
      if (filter === 'Active')    return j.status === 'dispatched'
      if (filter === 'Completed') return j.status === 'arrived'
      return true
    })
    return (
      <>
        <div className="filter-tabs" role="tablist" style={{ marginBottom: 12 }}>
          {['All', 'Active', 'Completed'].map((f) => (
            <button key={f} role="tab" aria-selected={filter === f}
              className={`filter-tab${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
              {f !== 'All' && (
                <span className="filter-count">
                  {f === 'Active'
                    ? intercityJobs.filter((j) => j.status === 'dispatched').length
                    : intercityJobs.filter((j) => j.status === 'arrived').length}
                </span>
              )}
            </button>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div className="card"><div className="empty-state">
            <TcIllustration type="empty-canvas" size={130} />
            <p className="empty-state-title">No intercity jobs</p>
            <p className="empty-state-body">Station clerks assign intercity manifests. Check back later.</p>
          </div></div>
        ) : (
          filtered.map((job) => (
            <Link key={job.id} to={`/driver/jobs/${job.id}`} className="job-card card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="job-card-top">
                <div className="job-info">
                  <div className="job-id-row">
                    <code className="job-id">{job.id}</code>
                    <span className={`badge ${INTERCITY_STATUS_BADGE[job.status] || 'badge-gray'}`}>
                      {INTERCITY_STATUS_LABEL[job.status] || job.status}
                    </span>
                  </div>
                  <div className="job-route">
                    <Truck size={12} />
                    {getStationName(job.originStation)} → {getStationName(job.destinationStation)}
                  </div>
                  <div className="job-meta">
                    <span><Package size={11} /> {job.parcels.length} parcel{job.parcels.length !== 1 ? 's' : ''}</span>
                    {job.driverName && <span>· {job.driverName}</span>}
                    <span>· {relTime(job.dispatchedAt || job.createdAt)}</span>
                  </div>
                </div>
                <div className="job-arrow"><ArrowRight size={16} color="var(--text-muted)" /></div>
              </div>
              <div className="job-progress-strip">
                {['Departed', 'En Route', 'Arrived'].map((step, i) => {
                  const done   = job.status === 'arrived' || (i < 2)
                  const active = (i === 1 && job.status === 'dispatched') || (i === 2 && job.status === 'arrived')
                  return (
                    <div key={step} className={`job-step${done ? ' done' : ''}${active ? ' active' : ''}`}>
                      <span className="job-step-dot" />
                      <span className="job-step-label">{step}</span>
                      {i < 2 && <span className="job-step-line" />}
                    </div>
                  )
                })}
              </div>
            </Link>
          ))
        )}
      </>
    )
  }

  /* ── P2P job card ────────────────────────────────────── */
  function P2PCard({ job, linkTo }) {
    return (
      <Link to={linkTo} className="job-card card" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="job-card-top">
          <div className="job-info">
            <div className="job-id-row">
              <span className="p2p-badge-tag">🛵 P2P</span>
              <span className={`badge ${P2P_STATUS_BADGE[job.status] || 'badge-gray'}`}>
                {P2P_STATUS_LABEL[job.status] || job.status}
              </span>
            </div>
            <div className="job-route" style={{ gap: 6, marginTop: 4 }}>
              <MapPin size={11} />
              <span style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {job.pickupAddress}
              </span>
              <span>→</span>
              <span style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {job.dropoffAddress}
              </span>
            </div>
            <div className="job-meta">
              <span>{job.description || 'Parcel'}</span>
              <span>· {job.category || '—'}</span>
              <span>· {relTime(job.createdAt)}</span>
            </div>
          </div>
          <div className="job-arrow"><ArrowRight size={16} color="var(--text-muted)" /></div>
        </div>
      </Link>
    )
  }

  return (
    <div className="jobs-page">
      <div className="jobs-header">
        <h1 className="page-title">My Jobs</h1>
        <p className="page-subtitle">
          {intercityJobs.filter((j) => j.status === 'dispatched').length} intercity active ·
          {myP2PJobs.filter((j) => ['accepted', 'picked_up'].includes(j.status)).length} P2P active ·
          {openP2PJobs.length} open P2P
        </p>
        <div className="filter-tabs" role="tablist" style={{ marginTop: 10 }}>
          {TABS.map((t) => (
            <button key={t} role="tab" aria-selected={tab === t}
              className={`filter-tab${tab === t ? ' active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'Open P2P' && openP2PJobs.length > 0 && (
                <span className="filter-count filter-count--pulse">{openP2PJobs.length}</span>
              )}
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="jobs-list page-container">
        {loading ? (
          [1, 2].map((n) => <div key={n} className="card skeleton" style={{ height: 88 }} />)
        ) : (
          <>
            {tab === 'Intercity' && <IntercityList />}

            {tab === 'P2P Jobs' && (
              myP2PJobs.length === 0 ? (
                <div className="card"><div className="empty-state">
                  <TcIllustration type="empty-canvas" size={130} />
                  <p className="empty-state-title">No P2P jobs yet</p>
                  <p className="empty-state-body">Switch to "Open P2P" tab to browse and accept local delivery jobs.</p>
                </div></div>
              ) : (
                myP2PJobs.map((job) => <P2PCard key={job.id} job={job} linkTo={`/driver/p2p/${job.id}`} />)
              )
            )}

            {tab === 'Open P2P' && (
              openP2PJobs.length === 0 ? (
                <div className="card"><div className="empty-state">
                  <Bike size={48} color="var(--text-muted)" />
                  <p className="empty-state-title">No open P2P jobs</p>
                  <p className="empty-state-body">New local delivery requests will appear here in real time.</p>
                </div></div>
              ) : (
                openP2PJobs.map((job) => <P2PCard key={job.id} job={job} linkTo={`/driver/p2p/${job.id}`} />)
              )
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default MyJobsPage
