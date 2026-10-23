import { calcTripPrice } from '../services/config'
import { computeRoute } from '../services/googleMaps'

// Price for one bus on a given route — uses the bus's own price category rates
// when set, otherwise falls back to the site's global pricing.
export function calcPrice(pricing, km, time, tripType, busOnStay, bus = null) {
  if (!pricing || !km) return null
  const cat = bus?.priceCategory
  const effectivePricing = cat
    ? { ...pricing, kmRate: cat.kmRate, hourRate: cat.hourRate }
    : pricing
  return calcTripPrice(effectivePricing, { km: tripType === 'return' ? Math.round(km / 2) : km, departureTime: time, tripType, busOnStay })
}

export function fmtKr(n) {
  return 'Kr ' + n.toLocaleString('nb-NO') + ',-'
}

export const fmtDate = (d, opts = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  d ? new Date(d).toLocaleDateString('nb-NO', opts) : '–'

export const shortAddr = (a) => a?.address?.split(',')[0] || ''

export function fmtMin(secs) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return h > 0 ? `${h} timer ${m} min` : `${m} min`
}

// Driving distance/duration through a from → stops → to waypoint chain (Google Routes API).
// Throws on failure; caller decides how to surface that (both the public wizard and the admin
// quick-entry form call this). Resolves to { distance (m), duration (s), geometry: { coordinates } }.
export function calcRouteDistance(from, to, stops = []) {
  return computeRoute(from, to, stops)
}

export function toDateTimeLocal(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// Builds a default trip itinerary straight from a booking's own route (from/via/to
// addresses + departure time) — used to pre-fill a new trip's stops automatically
// instead of leaving the admin to generate them by hand.
export function buildStopsFromBooking(booking) {
  const base = new Date(`${(booking.departureDate || '').slice(0, 10)}T${booking.departureTime || '00:00'}`)
  const addMinutes = (d, m) => new Date(d.getTime() + m * 60000)
  const middleStops = (booking.stops || []).filter(s => !s.startsWith('[Retur]'))
  return [
    { name: booking.fromAddress || 'Avreise', description: '', latitude: null, longitude: null, plannedTime: toDateTimeLocal(base) },
    ...middleStops.map((s, i) => ({ name: s, description: '', latitude: null, longitude: null, plannedTime: toDateTimeLocal(addMinutes(base, (i + 1) * 15)) })),
    { name: booking.toAddress || 'Ankomst', description: '', latitude: null, longitude: null, plannedTime: toDateTimeLocal(addMinutes(base, (middleStops.length + 1) * 15)) },
  ]
}

// Converts a buildStopsFromBooking() result into the payload shape the
// PUT /api/assignments/{id}/stops endpoint expects.
export function stopsToPayload(stops) {
  return stops.map(s => ({
    name: s.name.trim(), description: s.description?.trim() || null,
    latitude: s.latitude ?? null, longitude: s.longitude ?? null,
    plannedTime: s.plannedTime,
  }))
}
