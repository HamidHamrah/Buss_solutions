import { useEffect } from 'react'
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip, useMap } from 'react-leaflet'
import { MapPin } from 'lucide-react'

const toLatLng = (route) => route?.geometry?.coordinates?.map(([lon, lat]) => [lat, lon]) || []

function FitBounds({ points }) {
  const map = useMap()
  const key = points.map(p => p.join(',')).join('|')
  useEffect(() => {
    if (points.length > 1) map.fitBounds(points, { padding: [32, 32], maxZoom: 12 })
    else if (points.length === 1) map.setView(points[0], 10)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map])
  return null
}

const shortName = (a) => a?.address?.split(',')[0] || ''

// Live map for the booking wizard: outbound route, return route (dashed, only when it differs
// from the outbound path), and a marker for every start/stop/end point.
export default function RoutePreview({ from, to, stops = [], returnStops = [], route, returnRoute, tripType, className = '' }) {
  const outLine = toLatLng(route)
  const backLine = tripType === 'return' ? toLatLng(returnRoute) : []
  const stopPoints = stops.filter(s => s.lat && s.lon)
  const backStopPoints = tripType === 'return' ? returnStops.filter(s => s.lat && s.lon) : []

  const points = [
    ...outLine,
    ...backLine,
    ...(from?.lat ? [[from.lat, from.lon]] : []),
    ...(to?.lat ? [[to.lat, to.lon]] : []),
    ...stopPoints.map(s => [s.lat, s.lon]),
  ]

  if (!from?.lat && !to?.lat) {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 bg-gray-100 border border-dashed border-gray-300 rounded-xl text-gray-400 text-sm ${className}`}>
        <MapPin size={22} />
        <span>Ruten vises her når du velger start og mål</span>
      </div>
    )
  }

  const marker = (pos, color, label, key) => (
    <CircleMarker key={key} center={pos} radius={8} pathOptions={{ color: '#fff', weight: 3, fillColor: color, fillOpacity: 1 }}>
      <Tooltip direction="top" offset={[0, -6]}>{label}</Tooltip>
    </CircleMarker>
  )

  return (
    <div className={`overflow-hidden rounded-xl border border-gray-200 ${className}`}>
      <MapContainer center={[from?.lat || to?.lat, from?.lon || to?.lon]} zoom={8}
        style={{ height: '100%', width: '100%' }} zoomControl={false} scrollWheelZoom={false}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution="© OpenStreetMap contributors" />
        {backLine.length > 1 && <Polyline positions={backLine} pathOptions={{ color: '#0891b2', weight: 4, dashArray: '8 8' }} />}
        {outLine.length > 1 && <Polyline positions={outLine} pathOptions={{ color: '#175c8e', weight: 5 }} />}
        {stopPoints.map((s, i) => marker([s.lat, s.lon], '#d97706', `Stopp: ${shortName(s)}`, `s${i}`))}
        {backStopPoints.map((s, i) => marker([s.lat, s.lon], '#d97706', `Retur-stopp: ${shortName(s)}`, `r${i}`))}
        {from?.lat && marker([from.lat, from.lon], '#15803d', `Fra: ${shortName(from)}`, 'from')}
        {to?.lat && marker([to.lat, to.lon], '#dc2626', `Til: ${shortName(to)}`, 'to')}
        <FitBounds points={points} />
      </MapContainer>
    </div>
  )
}
