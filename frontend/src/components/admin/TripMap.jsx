import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { calcRouteDistance } from '../../utils/bookingHelpers'

// Same marker style as the public booking page's route map, for visual consistency.
const stopIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41],
})

const busIcon = new L.DivIcon({
  html: '<div style="background:#2563eb;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 0 6px rgba(37,99,235,0.7);"></div>',
  className: '',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

function minutesAgo(iso) {
  if (!iso) return null
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
}

export default function TripMap({ stops, currentLatitude, currentLongitude, positionUpdatedAt, traveledPath }) {
  const [routeCoords, setRouteCoords] = useState([])
  const [routeError, setRouteError] = useState(false)

  const located = (stops || []).filter(s => s.latitude != null && s.longitude != null)
  const locatedKey = located.map(s => `${s.latitude},${s.longitude}`).join('|')
  const traveledCoords = (traveledPath || []).map(p => [p.latitude, p.longitude])

  useEffect(() => {
    if (located.length < 2) { setRouteCoords([]); return }
    let active = true
    const from = { lat: located[0].latitude, lon: located[0].longitude }
    const to = { lat: located[located.length - 1].latitude, lon: located[located.length - 1].longitude }
    const via = located.slice(1, -1).map(s => ({ lat: s.latitude, lon: s.longitude }))
    setRouteError(false)
    calcRouteDistance(from, to, via)
      .then(route => { if (active) setRouteCoords(route.geometry.coordinates.map(([lon, lat]) => [lat, lon])) })
      .catch(() => { if (active) setRouteError(true) })
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locatedKey])

  const hasPosition = currentLatitude != null && currentLongitude != null
  const age = minutesAgo(positionUpdatedAt)
  const stale = age != null && age > 5

  if (located.length === 0 && !hasPosition && traveledCoords.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-8 text-center text-sm text-gray-400">
        Ingen posisjon tilgjengelig ennå — legg til stopp med adresse, eller vent til sjåføren starter turen.
      </div>
    )
  }

  const center = hasPosition
    ? [currentLatitude, currentLongitude]
    : located.length > 0
      ? [located[0].latitude, located[0].longitude]
      : traveledCoords[traveledCoords.length - 1]

  return (
    <div className="space-y-2">
      <div className="rounded-xl overflow-hidden border border-gray-200" style={{ height: 280 }}>
        <MapContainer center={center} zoom={hasPosition ? 11 : 7} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution="&copy; OpenStreetMap &copy; CARTO" />
          {routeCoords.length > 0 && <Polyline positions={routeCoords} color="#1e3a8a" weight={4} opacity={0.7} />}
          {traveledCoords.length > 1 && (
            <Polyline positions={traveledCoords} color="#dc2626" weight={3} opacity={0.8} dashArray="6 6" />
          )}
          {located.map((s, i) => (
            <Marker key={i} position={[s.latitude, s.longitude]} icon={stopIcon}>
              <Popup>{s.name}</Popup>
            </Marker>
          ))}
          {hasPosition && (
            <Marker position={[currentLatitude, currentLongitude]} icon={busIcon}>
              <Popup>Buss {stale ? `(sist sett for ${age} min siden)` : '(nå)'}</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
      {hasPosition ? (
        <p className={`text-xs ${stale ? 'text-amber-600' : 'text-green-700'}`}>
          {stale
            ? `⚠ Posisjon sist oppdatert for ${age} min siden — kan være utdatert.`
            : `● Live posisjon — oppdatert for ${age} min siden.`}
        </p>
      ) : (
        <p className="text-xs text-gray-400">Sjåføren har ikke delt posisjon på denne turen ennå.</p>
      )}
      {traveledCoords.length > 1 && (
        <p className="text-xs text-gray-400">- - - Rute kjørt så langt ({traveledCoords.length} punkter registrert)</p>
      )}
      {routeError && <p className="text-xs text-gray-400">Kunne ikke beregne rute mellom stoppene.</p>}
    </div>
  )
}
