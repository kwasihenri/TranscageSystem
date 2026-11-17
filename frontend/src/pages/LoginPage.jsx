import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import TcIcon from '../components/common/TcIcon'
import './LoginPage.css'

/**
 * LoginPage — shared entry point for all roles.
 * Role is determined server-side after credentials are verified.
 */
function LoginPage() {
  const [phone, setPhone]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!phone || !password) {
      setError('Please enter your phone number and password.')
      return
    }
    setLoading(true)
    // Auth logic wired in Phase 2
    setTimeout(() => setLoading(false), 1200)
  }

  return (
    <div className="login-page">
      <div className="login-card card">
        {/* Brand */}
        <div className="login-brand">
          <TcIcon size={36} wordmark />
        </div>

        <div className="login-heading">
          <h1 className="login-title">Sign in</h1>
          <p className="login-subtitle">Enter your phone number and password to continue.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="login-error-banner" role="alert">
              {error}
            </div>
          )}

          {/* Phone */}
          <div className="form-group">
            <label className="form-label" htmlFor="login-phone">
              Phone Number
            </label>
            <input
              id="login-phone"
              type="tel"
              className="form-input"
              placeholder="e.g. 024 000 0000"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="login-password">
              Password
            </label>
            <div className="input-with-action">
              <input
                id="login-password"
                type={showPass ? 'text' : 'password'}
                className="form-input"
                placeholder="Your password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="input-action-btn"
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass
                  ? <EyeOff size={16} strokeWidth={1.8} />
                  : <Eye size={16} strokeWidth={1.8} />
                }
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
            id="login-submit-btn"
          >
            {loading ? 'Signing in…' : (
              <>Sign in <ArrowRight size={15} /></>
            )}
          </button>
        </form>

        <hr className="divider" />

        <p className="login-footer-text">
          New customer?{' '}
          <Link to="/register" className="login-footer-link">
            Create an account
          </Link>
        </p>

        <p className="login-footer-text" style={{ marginTop: 6 }}>
          Tracking a parcel?{' '}
          <Link to="/track" className="login-footer-link">
            Track without signing in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage
