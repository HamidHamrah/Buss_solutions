import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { api } from '../services/api'

// Fix default icon paths broken by bundlers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const busIcon = L.divIcon({
  html: `<div style="background:#2563eb;width:38px;height:38px;border-radius:50%;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:20px;line-height:1">🚌</div>`,
  className: '',
  iconSize: [38, 38],
  iconAnchor: [19, 19],
})

const STATUS_LABEL = { 0: 'Planlagt', 1: 'Underveis', 2: 'Fullført', 3: 'Avlyst' }
const STATUS_COLOR = { 0: 'bg-gray-100 text-gray-600', 1: 'bg-blue-100 text-blue-700', 2: 'bg-green-100 text-green-700', 3: 'bg-red-100 text-red-700' }

const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' }) : null

function RecenterMap({ lat, lng }) {
  const map = useMap()
  useEffect(() => { map.setView([lat, lng], map.getZoom()) }, [lat, lng, map])
  return null
}

export default function TrackingPage() {
  const { token } = useParams()
  const [info, setInfo] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const data = await api.getTrackingInfo(token)
        if (!cancelled) setInfo(data)
      } catch {
        if (!cancelled) setError('Sporingslenken er ugyldig eller utløpt.')
      }
    }
    load()
    const interval = setInterval(() => { if (!cancelled) load() }, 15000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [token])

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-5xl mb-4">🚌</div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">Sporingslenke ikke funnet</h1>
        <p className="text-gray-500 text-sm">{error}</p>
      </div>
    </div>
  )

  if (!info) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const isLive = info.status === 1
  const isDone = info.status === 2
  const hasPosition = info.latitude != null && info.longitude != null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 shadow-sm">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-base font-bold text-gray-900">{info.title || 'Bussreise'}</h1>
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[info.status] ?? 'bg-gray-100 text-gray-600'}`}>
              {isLive && <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />}
              {STATUS_LABEL[info.status] ?? 'Ukjent'}
            </span>
          </div>

          {(info.fromAddress || info.toAddress) && (
            <p className="text-sm text-gray-500 mt-0.5">
              {[info.fromAddress, info.toAddress].filter(Boolean).join(' → ')}
            </p>
          )}

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-400">
            {info.startTime && <span>Avgang: <span className="text-gray-600">{info.startTime}</span></span>}
            {info.endTime && <span>Ankomst: <span className="text-gray-600">{info.endTime}</span></span>}
            {info.driverName && <span>Sjåfør: <span className="text-gray-600">{info.driverName}</span></span>}
            {info.busName && <span>Buss: <span className="text-gray-600">{info.busName}</span></span>}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative" style={{ minHeight: '450px' }}>
        {hasPosition ? (
          <MapContainer
            center={[info.latitude, info.longitude]}
            zoom={14}
            style={{ width: '100%', height: '100%', minHeight: '450px' }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[info.latitude, info.longitude]} icon={busIcon}>
              <Popup>{info.title || 'Bussen er her'}</Popup>
            </Marker>
            <RecenterMap lat={info.latitude} lng={info.longitude} />
          </MapContainer>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center p-6">
              <div className="text-5xl mb-3">📍</div>
              <p className="font-semibold text-gray-700">
                {isDone ? 'Turen er fullført' : isLive ? 'Henter posisjon…' : 'Turen har ikke startet ennå'}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {isDone
                  ? info.endTime ? `Ankom ${info.endTime}` : ''
                  : isLive
                  ? 'Kartet oppdateres automatisk'
                  : 'Posisjonen vises når sjåføren starter turen'}
              </p>
            </div>
          </div>
        )}

        {isDone && hasPosition && (
          <div className="absolute inset-x-0 bottom-0 bg-green-600 text-white text-sm font-medium text-center py-2">
            ✅ Turen er fullført {info.endTime ? `– ankom ${info.endTime}` : ''}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-100 px-4 py-3 text-center">
        {isLive && hasPosition ? (
          <p className="text-xs text-gray-400">
            Sist oppdatert: {fmtTime(info.positionUpdatedAt) ?? '–'} · Oppdateres hvert 15. sekund
          </p>
        ) : (
          <p className="text-xs text-gray-400">Live sporing er tilgjengelig når sjåføren starter turen</p>
        )}
      </div>
    </div>
  )
}
