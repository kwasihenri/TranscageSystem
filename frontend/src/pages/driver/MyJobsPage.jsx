import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Truck, Package, ArrowRight, CheckCircle, Layers } from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import { getDriverJobs } from '../../services/driver.service'
import { STATIONS } from '../../constants/parcel'
import TcIllustration from '../../components/common/TcIllustration'
import './MyJobsPage.css'

function getStationName(id) {
  return STATIONS.find((s) => s.id === id)?.name || id || '—'
}

function relTime(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(iso).toLocaleDateString('en-GH', { day: 'numeric', month: 'short' })
}

const STATUS_LABEL = { dispatched: 'En Route', arrived: 'Arrived' }
const STATUS_BADGE  = { dispatched: 'badge-amber', arrived: 'badge-green' }

const FILTERS = ['All', 'Active', 'Completed']

function MyJobsPage() {
  const { user }   = useAuth()
  const [jobs, setJobs]     = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('All')

  useEffect(() => {
    getDriverJobs(user?.name).then(setJobs).finally(() => setLoading(false))
  }, [user?.name])

  const filtered = jobs.filter((j) => {
    if (filter === 'Active')    return j.status === 'dispatched'
    if (filter === 'Completed') return j.status === 'arrived'
    return true
  })

  return (
    <div className="jobs-page">
      <div className="jobs-header">
        <h1 className="page-title">My Jobs</h1>
        <p className="page-subtitle">{jobs.filter((j) => j.status === 'dispatched').length} active · {jobs.filter((j) => j.status === 'arrived').length} completed</p>
        <div className="filter-tabs" role="tablist" style={{ marginTop: 10 }}>
          {FILTERS.map((f) => (
            <button key={f} role="tab" aria-selected={filter === f}
              className={`filter-tab${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
              {f !== 'All' && (
                <span className="filter-count">
                  {f === 'Active' ? jobs.filter((j) => j.status === 'dispatched').length
                                  : jobs.filter((j) => j.status === 'arrived').length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="jobs-list page-container">
        {loading ? (
          [1, 2].map((n) => (
            <div key={n} className="card skeleton" style={{ height: 88 }} />
          ))
        ) : filtered.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <TcIllustration type="empty-canvas" size={130} />
              <p className="empty-state-title">{filter === 'All' ? 'No jobs yet' : `No ${filter.toLowerCase()} jobs`}</p>
              <p className="empty-state-body">
                {filter === 'All'
                  ? 'Jobs assigned to you by station clerks will appear here.'
                  : 'Check back after the clerk dispatches a manifest with your name.'}
              </p>
            </div>
          </div>
        ) : (
          filtered.map((job) => (
            <Link key={job.id} to={`/driver/jobs/${job.id}`} className="job-card card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="job-card-top">
                <div className="job-info">
                  <div className="job-id-row">
                    <code className="job-id">{job.id}</code>
                    <span className={`badge ${STATUS_BADGE[job.status] || 'badge-gray'}`}>
                      {STATUS_LABEL[job.status] || job.status}
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
                <div className="job-arrow">
                  <ArrowRight size={16} color="var(--text-muted)" />
                </div>
              </div>

              {/* Progress strip */}
              <div className="job-progress-strip">
                {['Departed', 'En Route', 'Arrived'].map((step, i) => {
                  const done = job.status === 'arrived' || (i < 2)
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
      </div>
    </div>
  )
}

export default MyJobsPage
