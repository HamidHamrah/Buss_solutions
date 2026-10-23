// Google Maps Platform access shared by the map components, address search and route calculation.
// One browser key (VITE_GOOGLE_MAPS_KEY, restricted by HTTP referrer) covers: Maps JavaScript API,
// Places API (New) and Routes API.
export const GMAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || ''
// Advanced markers need a map ID; DEMO_MAP_ID works until you create a styled one in Cloud Console.
export const GMAPS_MAP_ID = import.meta.env.VITE_GOOGLE_MAP_ID || 'DEMO_MAP_ID'

function gfetch(url, { fieldMask, body } = {}) {
  if (!GMAPS_KEY) return Promise.reject(new Error('Mangler VITE_GOOGLE_MAPS_KEY'))
  return fetch(url, {
    method: body ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GMAPS_KEY,
      ...(fieldMask ? { 'X-Goog-FieldMask': fieldMask } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  }).then(async res => {
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.error?.message || `Google API ${res.status}`)
    return data
  })
}

// Decodes Google's encoded polyline into [[lon, lat], ...] (GeoJSON order, as the rest of the app expects).
function decodePolyline(encoded) {
  const coords = []
  let index = 0, lat = 0, lng = 0
  while (index < encoded.length) {
    for (const axis of [0, 1]) {
      let shift = 0, result = 0, b
      do {
        b = encoded.charCodeAt(index++) - 63
        result |= (b & 0x1f) << shift
        shift += 5
      } while (b >= 0x20)
      const delta = result & 1 ? ~(result >> 1) : result >> 1
      if (axis === 0) lat += delta; else lng += delta
    }
    coords.push([lng / 1e5, lat / 1e5])
  }
  return coords
}

const waypoint = (p) => ({ location: { latLng: { latitude: p.lat, longitude: p.lon } } })

// Driving route through from → stops → to. Resolves to { distance (m), duration (s), geometry: { coordinates } }.
export async function computeRoute(from, to, stops = []) {
  const data = await gfetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    fieldMask: 'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline',
    body: {
      origin: waypoint(from),
      destination: waypoint(to),
      intermediates: stops.filter(s => s.lat && s.lon).map(waypoint),
      travelMode: 'DRIVE',
      languageCode: 'nb',
      units: 'METRIC',
    },
  })
  const r = data.routes?.[0]
  if (!r) throw new Error('Kunne ikke beregne ruten.')
  return {
    distance: r.distanceMeters,
    duration: parseInt(r.duration, 10),
    geometry: { coordinates: decodePolyline(r.polyline.encodedPolyline) },
  }
}

export const newPlacesSession = () => crypto.randomUUID()

export async function autocompletePlaces(input, sessionToken) {
  const data = await gfetch('https://places.googleapis.com/v1/places:autocomplete', {
    body: { input, languageCode: 'nb', sessionToken },
  })
  return (data.suggestions || [])
    .map(s => s.placePrediction)
    .filter(Boolean)
    .map(p => ({
      placeId: p.placeId,
      text: p.text?.text || '',
      main: p.structuredFormat?.mainText?.text || p.text?.text || '',
      secondary: p.structuredFormat?.secondaryText?.text || '',
    }))
}

// Closing call of a session: resolves the picked suggestion to coordinates.
export async function placeLocation(placeId, sessionToken) {
  const data = await gfetch(
    `https://places.googleapis.com/v1/places/${placeId}?sessionToken=${sessionToken}&languageCode=nb`,
    { fieldMask: 'location' },
  )
  return { lat: data.location.latitude, lon: data.location.longitude }
}
