import { Link } from 'react-router-dom'
import TcIcon from '../components/common/TcIcon'
import TcIllustration from '../components/common/TcIllustration'
import './HomePage.css'

/**
 * HomePage — public landing page shown to unauthenticated visitors.
 * This is the front door of Transcage.
 */
function HomePage() {
  return (
    <div className="home-page">
      {/* Hero */}
      <section className="hero">
        <div className="hero-inner">
          <TcIcon size={56} />
          <h1 className="hero-title">
            Track every parcel,<br />
            <span className="hero-title-accent">every step of the way.</span>
          </h1>
          <p className="hero-subtitle">
            Transcage connects senders, drivers, clerks, and receivers on one
            platform — with real-time tracking, secure OTP handovers, and
            live driver location.
          </p>
          <div className="hero-actions">
            <Link to="/login" className="btn btn-primary btn-lg">
              Get Started
            </Link>
            <Link to="/track" className="btn btn-secondary btn-lg">
              Track a Parcel
            </Link>
          </div>
        </div>

        {/* Hero illustration */}
        <div className="hero-visual" aria-hidden="true">
          <div className="hero-visual-card card">
            <div className="card-header">
              <span className="card-title">Live Shipment</span>
              <span className="badge badge-green">● In Transit</span>
            </div>
            <div className="card-body">
              <div className="hero-tracking-id">
                <span className="form-label">Tracking ID</span>
                <code className="tracking-id-code">TC-2024-00147</code>
              </div>
              <div className="hero-route">
                <div className="route-point">
                  <span className="route-dot route-dot--origin" />
                  <span>Takoradi Station</span>
                </div>
                <div className="route-line" />
                <div className="route-point">
                  <span className="route-dot route-dot--dest" />
                  <span>Accra Central</span>
                </div>
              </div>
              <div className="hero-progress-bar">
                <div className="hero-progress-fill" style={{ width: '62%' }} />
              </div>
              <p className="form-hint" style={{ marginTop: 6 }}>
                Estimated arrival: <strong>3 hrs 20 mins</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature strips */}
      <section className="features">
        <div className="page-container">
          <div className="features-grid">
            {[
              {
                illustration: 'scan-ready',
                title: 'QR Code Check-In',
                body: 'Every parcel gets a unique QR code. Station clerks scan it to track every handover in real time.',
              },
              {
                illustration: 'delivery-done',
                title: 'Secure OTP Handover',
                body: 'A 6-digit code sent to the receiver ensures only the right person can collect the package.',
              },
              {
                illustration: 'no-connections',
                title: 'Live Driver Tracking',
                body: 'Watch your driver move on a live map during local town deliveries — no guesswork.',
              },
            ].map((f) => (
              <div key={f.title} className="feature-card card">
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12 }}>
                  <TcIllustration type={f.illustration} size={120} />
                  <h3 className="feature-title">{f.title}</h3>
                  <p className="feature-body">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
