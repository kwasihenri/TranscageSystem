import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import TcIcon from '../components/common/TcIcon'
import useAuth from '../hooks/useAuth'
import './RegisterPage.css'

function RegisterPage() {
  const { register, loading } = useAuth()
  const navigate = useNavigate()

  const [form, setForm]       = useState({ name: '', phone: '', password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError]     = useState('')

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.name.trim() || !form.phone.trim() || !form.password) {
      setError('Please fill in all fields.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }

    try {
      await register(form.name.trim(), form.phone.trim(), form.password)
      navigate('/customer/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="register-page">
      <div className="register-card card">
        {/* Brand */}
        <div className="register-brand">
          <TcIcon size={34} wordmark />
        </div>

        <div className="register-heading">
          <h1 className="register-title">Create account</h1>
          <p className="register-subtitle">
            Sign up to send and track parcels with Transcage.
          </p>
        </div>

        <form className="register-form" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="register-error-banner" role="alert">{error}</div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">Full Name</label>
            <input
              id="reg-name"
              type="text"
              className="form-input"
              placeholder="e.g. Abena Osei"
              autoComplete="name"
              value={form.name}
              onChange={set('name')}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-phone">Phone Number</label>
            <input
              id="reg-phone"
              type="tel"
              className="form-input"
              placeholder="e.g. 024 000 0000"
              autoComplete="tel"
              value={form.phone}
              onChange={set('phone')}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Password</label>
            <div className="input-with-action">
              <input
                id="reg-password"
                type={showPass ? 'text' : 'password'}
                className="form-input"
                placeholder="At least 8 characters"
                autoComplete="new-password"
                value={form.password}
                onChange={set('password')}
                required
              />
              <button
                type="button"
                className="input-action-btn"
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? <EyeOff size={16} strokeWidth={1.8} /> : <Eye size={16} strokeWidth={1.8} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-confirm">Confirm Password</label>
            <input
              id="reg-confirm"
              type={showPass ? 'text' : 'password'}
              className="form-input"
              placeholder="Repeat your password"
              autoComplete="new-password"
              value={form.confirm}
              onChange={set('confirm')}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            id="register-submit-btn"
            disabled={loading}
          >
            {loading ? 'Creating account…' : (
              <>Create account <ArrowRight size={15} /></>
            )}
          </button>
        </form>

        <hr className="divider" />

        <p className="register-footer-text">
          Already have an account?{' '}
          <Link to="/login" className="register-footer-link">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage
