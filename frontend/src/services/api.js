/**
 * API service layer.
 * All backend calls go through here — swap the base URL and nothing else changes.
 *
 * VITE_API_URL in .env → e.g. http://192.168.1.100:4000/api (LAN)
 * Falls back to '/api' which Vite proxies to localhost:4000
 */

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

async function request(method, path, data) {
  const token = localStorage.getItem('tc_token')

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(err.message || `HTTP ${res.status}`)
  }

  return res.json()
}

const api = {
  get:    (path)        => request('GET',    path),
  post:   (path, data)  => request('POST',   path, data),
  put:    (path, data)  => request('PUT',    path, data),
  patch:  (path, data)  => request('PATCH',  path, data),
  delete: (path)        => request('DELETE', path),
}

export default api
