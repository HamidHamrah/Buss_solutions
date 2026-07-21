import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Bus, Clock, ChevronRight } from 'lucide-react'
import { driverApi } from '../../services/driverApi'

const STATUS_LABELS = { 0: 'Planlagt', 1: 'Pågår', 2: 'Fullført', 3: 'Avlyst' }
const STATUS_COLORS = {
  0: 'bg-gray-100 text-gray-600',
  1: 'bg-blue-100 text-blue-700',
  2: 'bg-green-100 text-green-700',
  3: 'bg-red-100 text-red-600',
}

function TripCard({ trip }) {
  return (
    <Link to={`/driver/turer/${trip.id}`}
      className="flex items-center gap-3 bg-white rounded-2xl border border-gray-200 p-4 hover:border-brand-blue/40 transition-colors">
      <div className="w-11 h-11 rounded-xl bg-brand-blue/10 flex items-center justify-center flex-shrink-0">
        <Bus size={18} className="text-brand-blue" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-brand-dark text-sm truncate">{trip.title || 'Tur'}</p>
        <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
          <Clock size={11} /> {new Date(trip.startDate).toLocaleDateString('nb-NO', { weekday: 'short', day: 'numeric', month: 'short' })}
          {trip.startTime && ` · ${trip.startTime}`}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{trip.busName}{trip.busRegistrationNumber ? ` (${trip.busRegistrationNumber})` : ''}</p>
      </div>
      <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${STATUS_COLORS[trip.status]}`}>
        {STATUS_LABELS[trip.status]}
      </span>
      <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
    </Link>
  )
}

export default function DriverTripsPage() {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    driverApi.getMyTrips()
      .then(data => { if (active) setTrips(data) })
      .catch(() => { if (active) setError('Kunne ikke laste turer.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const todayStr = new Date().toDateString()
  const today = trips.filter(t => new Date(t.startDate).toDateString() === todayStr)
  const upcoming = trips.filter(t => new Date(t.startDate).toDateString() !== todayStr)

  if (loading) return <p className="text-center text-gray-400 py-10 text-sm">Laster turer…</p>
  if (error) return <p className="text-center text-red-500 py-10 text-sm">{error}</p>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">I dag</h2>
        {today.length === 0 ? (
          <p className="text-sm text-gray-400 bg-white rounded-2xl border border-gray-200 px-4 py-6 text-center">Ingen turer i dag.</p>
        ) : (
          <div className="space-y-2.5">{today.map(t => <TripCard key={t.id} trip={t} />)}</div>
        )}
      </div>
      <div>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Kommende</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-400 bg-white rounded-2xl border border-gray-200 px-4 py-6 text-center">Ingen kommende turer.</p>
        ) : (
          <div className="space-y-2.5">{upcoming.map(t => <TripCard key={t.id} trip={t} />)}</div>
        )}
      </div>
    </div>
  )
}
