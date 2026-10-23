import { useEffect, useRef } from 'react'
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps'
import { MapPin } from 'lucide-react'
import { GMAPS_KEY, GMAPS_MAP_ID } from '../../services/googleMaps'

// Thin wrapper so every page gets the same provider, defaults and "no key" fallback.
export function GoogleMap({ center, zoom = 8, className = '', style, scrollZoom = true, children }) {
  if (!GMAPS_KEY) {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 bg-gray-100 text-gray-400 text-sm text-center px-4 ${className}`} style={style}>
        <MapPin size={22} />
        <span>Kartet er ikke konfigurert (mangler VITE_GOOGLE_MAPS_KEY)</span>
      </div>
    )
  }
  return (
    <APIProvider apiKey={GMAPS_KEY} language="nb" region="NO">
      <Map
        className={className}
        style={style}
        mapId={GMAPS_MAP_ID}
        defaultCenter={center}
        defaultZoom={zoom}
        gestureHandling={scrollZoom ? 'auto' : 'cooperative'}
        disableDefaultUI
        zoomControl
        clickableIcons={false}
      >
        {children}
      </Map>
    </APIProvider>
  )
}

// points: [{ lat, lng }]. Re-fits whenever the set of points changes.
export function FitBounds({ points, maxZoom = 12, padding = 32 }) {
  const map = useMap()
  const key = points.map(p => `${p.lat},${p.lng}`).join('|')
  useEffect(() => {
    if (!map || points.length === 0) return
    if (points.length === 1) { map.setCenter(points[0]); map.setZoom(10); return }
    const bounds = new google.maps.LatLngBounds()
    points.forEach(p => bounds.extend(p))
    map.fitBounds(bounds, padding)
    const once = google.maps.event.addListenerOnce(map, 'idle', () => {
      if (map.getZoom() > maxZoom) map.setZoom(maxZoom)
    })
    return () => once.remove()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key])
  return null
}

// path: [{ lat, lng }]. `animate` draws the line from start to end whenever the path changes.
export function RoutePolyline({ path, color = '#175c8e', weight = 5, opacity = 1, dashed = false, animate = false }) {
  const map = useMap()
  const lineRef = useRef(null)
  const key = `${path.length}:${path[0]?.lat},${path[0]?.lng}:${path[path.length - 1]?.lat},${path[path.length - 1]?.lng}`

  useEffect(() => {
    if (!map) return
    const line = new google.maps.Polyline({
      map,
      strokeColor: color,
      strokeWeight: weight,
      strokeOpacity: dashed ? 0 : opacity,
      icons: dashed
        ? [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: opacity, strokeWeight: weight, scale: 2 }, offset: '0', repeat: '14px' }]
        : undefined,
    })
    lineRef.current = line
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf
    if (animate && !reduce && path.length > 2) {
      const duration = Math.min(1400, 500 + path.length)
      const start = performance.now()
      const step = (now) => {
        const t = Math.min(1, (now - start) / duration)
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
        line.setPath(path.slice(0, Math.max(2, Math.ceil(path.length * eased))))
        if (t < 1) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    } else {
      line.setPath(path)
    }
    return () => { cancelAnimationFrame(raf); line.setMap(null) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key, color, weight, opacity, dashed, animate])

  return null
}

// Round marker with a white ring (start/stop/end points, bus position).
export function DotMarker({ position, color, title, size = 16, children }) {
  return (
    <AdvancedMarker position={position} title={title}>
      <div style={{
        width: size, height: size, borderRadius: '50%', background: color,
        border: '3px solid #fff', boxShadow: '0 1px 6px rgba(0,0,0,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.55, lineHeight: 1,
      }}>{children}</div>
    </AdvancedMarker>
  )
}
