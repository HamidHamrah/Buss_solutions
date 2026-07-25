const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5119'

export function getToken() {
  return sessionStorage.getItem('admin_token')
}

export function setToken(token) {
  sessionStorage.setItem('admin_token', token)
  sessionStorage.setItem('admin_auth', '1')
}

export function clearToken() {
  sessionStorage.removeItem('admin_token')
  sessionStorage.removeItem('admin_auth')
}

async function request(path, options = {}) {
  const token = getToken()
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

export const api = {
  getConfig: () => request('/api/config'),
  updateConfig: (data) => request('/api/config', { method: 'PUT', body: JSON.stringify(data) }),
  sendTestEmail: () => request('/api/config/test-email', { method: 'POST' }),
  changePassword: (newPassword) => request('/api/config/password', { method: 'PUT', body: JSON.stringify({ newPassword }) }),
  // Drivers
  getDrivers: () => request('/api/drivers'),
  createDriver: (data) => request('/api/drivers', { method: 'POST', body: JSON.stringify(data) }),
  updateDriver: (id, data) => request(`/api/drivers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDriver: (id) => request(`/api/drivers/${id}`, { method: 'DELETE' }),
  resendDriverCredentials: (id) => request(`/api/drivers/${id}/resend-credentials`, { method: 'POST' }),
  setDriverRole: (id, isAdmin) => request(`/api/drivers/${id}/role`, { method: 'PUT', body: JSON.stringify({ isAdmin }) }),
  // Assignments
  getAssignments: (year, month) => request(`/api/assignments?year=${year}&month=${month}`),
  getAssignmentsForBooking: (bookingId) => request(`/api/assignments?bookingId=${bookingId}`),
  searchAssignments: (query) => request(`/api/assignments?search=${encodeURIComponent(query)}`),
  getTripsOverview: (params = {}) => {
    const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== '')).toString()
    return request(`/api/assignments${q ? `?${q}` : ''}`)
  },
  getAssignment: (id) => request(`/api/assignments/${id}`),
  createAssignment: (data) => request('/api/assignments', { method: 'POST', body: JSON.stringify(data) }),
  updateAssignment: (id, data) => request(`/api/assignments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAssignment: (id) => request(`/api/assignments/${id}`, { method: 'DELETE' }),
  replaceAssignmentStops: (id, stops) => request(`/api/assignments/${id}/stops`, { method: 'PUT', body: JSON.stringify(stops) }),
  getPositionHistory: (id) => request(`/api/assignments/${id}/position-history`),
  getBuses: (activeOnly = false) => request(`/api/buses?activeOnly=${activeOnly}`),
  createBus: (data) => request('/api/buses', { method: 'POST', body: JSON.stringify(data) }),
  updateBus: (id, data) => request(`/api/buses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBus: (id) => request(`/api/buses/${id}`, { method: 'DELETE' }),
  getPriceCategories: () => request('/api/price-categories'),
  createPriceCategory: (data) => request('/api/price-categories', { method: 'POST', body: JSON.stringify(data) }),
  updatePriceCategory: (id, data) => request(`/api/price-categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePriceCategory: (id) => request(`/api/price-categories/${id}`, { method: 'DELETE' }),
  uploadFile: async (file) => {
    const token = getToken()
    const body = new FormData()
    body.append('file', file)
    const res = await fetch(`${BASE}/api/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body,
    })
    if (!res.ok) throw new Error(`${res.status}`)
    return res.json()
  },
  uploadPublicFile: async (file) => {
    const body = new FormData()
    body.append('file', file)
    const res = await fetch(`${BASE}/api/upload/public`, { method: 'POST', body })
    if (!res.ok) throw new Error(`${res.status}`)
    return res.json()
  },
  submitJobApplication: (data) => request('/api/job-applications', { method: 'POST', body: JSON.stringify(data) }),
  getJobApplications: (page = 1) => request(`/api/job-applications?page=${page}&pageSize=20`),
  updateJobApplicationStatus: (id, status) => request(`/api/job-applications/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  deleteJobApplication: (id) => request(`/api/job-applications/${id}`, { method: 'DELETE' }),
  getPartners: (activeOnly = false) => request(`/api/partners?activeOnly=${activeOnly}`),
  createPartner: (data) => request('/api/partners', { method: 'POST', body: JSON.stringify(data) }),
  updatePartner: (id, data) => request(`/api/partners/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePartner: (id) => request(`/api/partners/${id}`, { method: 'DELETE' }),
  getTestimonials: (activeOnly = false) => request(`/api/testimonials?activeOnly=${activeOnly}`),
  createTestimonial: (data) => request('/api/testimonials', { method: 'POST', body: JSON.stringify(data) }),
  updateTestimonial: (id, data) => request(`/api/testimonials/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTestimonial: (id) => request(`/api/testimonials/${id}`, { method: 'DELETE' }),
  submitContact: (data) => request('/api/contact', { method: 'POST', body: JSON.stringify(data) }),
  getContacts: (page = 1) => request(`/api/contact?page=${page}&pageSize=30`),
  markContactRead: (id) => request(`/api/contact/${id}/read`, { method: 'PUT' }),
  replyContact: (id, replyText) => request(`/api/contact/${id}/reply`, { method: 'POST', body: JSON.stringify({ replyText }) }),
  deleteContact: (id) => request(`/api/contact/${id}`, { method: 'DELETE' }),
  getFaqs: (activeOnly = false) => request(`/api/faqs?activeOnly=${activeOnly}`),
  createFaq: (data) => request('/api/faqs', { method: 'POST', body: JSON.stringify(data) }),
  updateFaq: (id, data) => request(`/api/faqs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFaq: (id) => request(`/api/faqs/${id}`, { method: 'DELETE' }),
  getServiceCategories: (activeOnly = false) => request(`/api/service-categories?activeOnly=${activeOnly}`),
  getServiceCategory: (slug) => request(`/api/service-categories/${slug}`),
  createServiceCategory: (data) => request('/api/service-categories', { method: 'POST', body: JSON.stringify(data) }),
  updateServiceCategory: (id, data) => request(`/api/service-categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteServiceCategory: (id) => request(`/api/service-categories/${id}`, { method: 'DELETE' }),
  createBooking: (data) => request('/api/bookings', { method: 'POST', body: JSON.stringify(data) }),
  getBookings: (page = 1) => request(`/api/bookings?page=${page}&pageSize=20`),
  getUnplannedBookings: () => request('/api/bookings/unplanned'),
  getBookingStats: () => request('/api/bookings/stats'),
  lookupBooking: (ref) => request(`/api/bookings/lookup/${encodeURIComponent(ref.trim().toUpperCase())}`),
  updateBookingStatus: (id, status) => request(`/api/bookings/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  updateBookingNotes: (id, notes) => request(`/api/bookings/${id}/notes`, { method: 'PUT', body: JSON.stringify({ notes }) }),
  updateBookingPrice: (id, priceAdjustment, priceAdjustmentNote) =>
    request(`/api/bookings/${id}/price`, { method: 'PUT', body: JSON.stringify({ priceAdjustment, priceAdjustmentNote }) }),
  getInvoices: (status) => request(`/api/bookings/invoices${status ? `?status=${status}` : ''}`),
  updatePaymentStatus: (id, paymentStatus) =>
    request(`/api/bookings/${id}/payment-status`, { method: 'PUT', body: JSON.stringify({ paymentStatus }) }),
  generateInvoice: (id) => request(`/api/bookings/${id}/invoice`, { method: 'POST' }),
  getTrackingInfo: async (token) => {
    const res = await fetch(`${BASE}/api/track/${token}`)
    if (!res.ok) throw new Error('Sporingslenke ikke funnet')
    return res.json()
  },
}
