const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5119'

export function getDriverToken() {
  return sessionStorage.getItem('driver_token')
}

export function setDriverSession(token, mustChangePassword, driver, isAdmin = false) {
  sessionStorage.setItem('driver_token', token)
  sessionStorage.setItem('driver_auth', '1')
  sessionStorage.setItem('driver_must_change_password', mustChangePassword ? '1' : '')
  sessionStorage.setItem('driver_name', driver?.fullName || '')
  sessionStorage.setItem('driver_is_admin', isAdmin ? '1' : '')
}

export function clearDriverSession() {
  sessionStorage.removeItem('driver_token')
  sessionStorage.removeItem('driver_auth')
  sessionStorage.removeItem('driver_must_change_password')
  sessionStorage.removeItem('driver_name')
  sessionStorage.removeItem('driver_is_admin')
}

export function driverMustChangePassword() {
  return sessionStorage.getItem('driver_must_change_password') === '1'
}

export function driverName() {
  return sessionStorage.getItem('driver_name') || ''
}

export function driverIsAdmin() {
  return sessionStorage.getItem('driver_is_admin') === '1'
}

async function request(path, options = {}) {
  const token = getDriverToken()
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (!res.ok) {
    let message = res.statusText || `HTTP ${res.status}`
    try {
      const body = await res.json()
      message = body.message || body.error || body.title || message
    } catch {}
    const err = new Error(message)
    err.status = res.status
    throw err
  }
  if (res.status === 204) return null
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

export const driverApi = {
  login: (phone, password) => request('/api/driver/login', { method: 'POST', body: JSON.stringify({ phone, password }) }),
  getMe: () => request('/api/driver/me'),
  changePassword: (newPassword) => request('/api/driver/change-password', { method: 'POST', body: JSON.stringify({ newPassword }) }),
  getMyTrips: () => request('/api/driver/trips'),
  getTrip: (id) => request(`/api/driver/trips/${id}`),
  startTrip: (id) => request(`/api/driver/trips/${id}/start`, { method: 'POST' }),
  finishTrip: (id) => request(`/api/driver/trips/${id}/finish`, { method: 'POST' }),
  reportLocation: (id, latitude, longitude) =>
    request(`/api/driver/trips/${id}/location`, { method: 'POST', body: JSON.stringify({ latitude, longitude }) }),
  arriveAtStop: (tripId, stopId) => request(`/api/driver/trips/${tripId}/stops/${stopId}/arrive`, { method: 'POST' }),
  departFromStop: (tripId, stopId) => request(`/api/driver/trips/${tripId}/stops/${stopId}/depart`, { method: 'POST' }),
  addTripNote: (tripId, message) => request(`/api/driver/trips/${tripId}/notes`, { method: 'POST', body: JSON.stringify({ message }) }),
  addStopNote: (tripId, stopId, message) => request(`/api/driver/trips/${tripId}/stops/${stopId}/notes`, { method: 'POST', body: JSON.stringify({ message }) }),
}
