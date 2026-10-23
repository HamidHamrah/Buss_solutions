import { useState, useEffect } from 'react'
import { calcRouteDistance } from '../../utils/bookingHelpers'
import { GoogleMap, FitBounds, RoutePolyline, DotMarker } from '../maps/GoogleMap'

function minutesAgo(iso) {
  if (!iso) return null
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
}

export default function TripMap({ stops, currentLatitude, currentLongitude, positionUpdatedAt, traveledPath }) {
  const [routeCoords, setRouteCoords] = useState([])
  const [routeError, setRouteError] = useState(false)

  const located = (stops || []).filter(s => s.latitude != null && s.longitude != null)
  const locatedKey = located.map(s => `${s.latitude},${s.longitude}`).join('|')
  const traveledCoords = (traveledPath || []).map(p => ({ lat: p.latitude, lng: p.longitude }))

  useEffect(() => {
    if (located.length < 2) { setRouteCoords([]); return }
    let active = true
    const from = { lat: located[0].latitude, lon: located[0].longitude }
    const to = { lat: located[located.length - 1].latitude, lon: located[located.length - 1].longitude }
    const via = located.slice(1, -1).map(s => ({ lat: s.latitude, lon: s.longitude }))
    setRouteError(false)
    calcRouteDistance(from, to, via)
      .then(route => { if (active) setRouteCoords(route.geometry.coordinates.map(([lon, lat]) => ({ lat, lng: lon }))) })
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
    ? { lat: currentLatitude, lng: currentLongitude }
    : located.length > 0
      ? { lat: located[0].latitude, lng: located[0].longitude }
      : traveledCoords[traveledCoords.length - 1]

  // Stops only: refitting on every live position update would fight the user's own zoom/pan.
  const fitPoints = located.map(s => ({ lat: s.latitude, lng: s.longitude }))

  return (
    <div className="space-y-2">
      <div className="rounded-xl overflow-hidden border border-gray-200" style={{ height: 280 }}>
        <GoogleMap center={center} zoom={hasPosition ? 11 : 7} style={{ height: '100%', width: '100%' }}>
          {routeCoords.length > 0 && <RoutePolyline path={routeCoords} color="#1e3a8a" weight={4} opacity={0.7} />}
          {traveledCoords.length > 1 && <RoutePolyline path={traveledCoords} color="#dc2626" weight={3} opacity={0.8} dashed />}
          {located.map((s, i) => (
            <DotMarker key={i} position={{ lat: s.latitude, lng: s.longitude }} color="#175c8e" title={s.name} />
          ))}
          {hasPosition && (
            <DotMarker position={{ lat: currentLatitude, lng: currentLongitude }} color="#2563eb" size={20}
              title={`Buss ${stale ? `(sist sett for ${age} min siden)` : '(nå)'}`} />
          )}
          {fitPoints.length > 1 && <FitBounds points={fitPoints} maxZoom={13} />}
        </GoogleMap>
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
