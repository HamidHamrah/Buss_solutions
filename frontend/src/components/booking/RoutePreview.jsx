import { MapPin } from 'lucide-react'
import { GoogleMap, FitBounds, RoutePolyline, DotMarker } from '../maps/GoogleMap'

const toPath = (route) => route?.geometry?.coordinates?.map(([lon, lat]) => ({ lat, lng: lon })) || []

const shortName = (a) => a?.address?.split(',')[0] || ''

// Live map for the booking wizard: outbound route, return route (dashed, only when it differs
// from the outbound path), and a marker for every start/stop/end point.
export default function RoutePreview({ from, to, stops = [], returnStops = [], route, returnRoute, tripType, className = '' }) {
  const outLine = toPath(route)
  const backLine = tripType === 'return' ? toPath(returnRoute) : []
  const stopPoints = stops.filter(s => s.lat && s.lon)
  const backStopPoints = tripType === 'return' ? returnStops.filter(s => s.lat && s.lon) : []

  const points = [
    ...outLine,
    ...backLine,
    ...(from?.lat ? [{ lat: from.lat, lng: from.lon }] : []),
    ...(to?.lat ? [{ lat: to.lat, lng: to.lon }] : []),
    ...stopPoints.map(s => ({ lat: s.lat, lng: s.lon })),
  ]

  if (!from?.lat && !to?.lat) {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 bg-gray-100 border border-dashed border-gray-300 rounded-xl text-gray-400 text-sm ${className}`}>
        <MapPin size={22} />
        <span>Ruten vises her når du velger start og mål</span>
      </div>
    )
  }

  const marker = (p, color, label, key) => (
    <DotMarker key={key} position={{ lat: p.lat, lng: p.lon }} color={color} title={label} />
  )

  return (
    <div className={`overflow-hidden rounded-xl border border-gray-200 ${className}`}>
      <GoogleMap center={{ lat: from?.lat || to?.lat, lng: from?.lon || to?.lon }} zoom={8}
        style={{ height: '100%', width: '100%' }} scrollZoom={false}>
        {backLine.length > 1 && <RoutePolyline path={backLine} color="#0891b2" weight={4} dashed />}
        {outLine.length > 1 && <RoutePolyline path={outLine} color="#175c8e" weight={5} animate />}
        {stopPoints.map((s, i) => marker(s, '#d97706', `Stopp: ${shortName(s)}`, `s${i}`))}
        {backStopPoints.map((s, i) => marker(s, '#d97706', `Retur-stopp: ${shortName(s)}`, `r${i}`))}
        {from?.lat && marker(from, '#15803d', `Fra: ${shortName(from)}`, 'from')}
        {to?.lat && marker(to, '#dc2626', `Til: ${shortName(to)}`, 'to')}
        <FitBounds points={points} />
      </GoogleMap>
    </div>
  )
}
