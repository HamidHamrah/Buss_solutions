import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, PlayCircle, CheckCircle2, MapPin, MessageSquare, Send } from 'lucide-react'
import { driverApi } from '../../services/driverApi'
import TripMap from '../../components/admin/TripMap'

const STATUS_LABELS = { 0: 'Planlagt', 1: 'Pågår', 2: 'Fullført', 3: 'Avlyst' }
const STATUS_COLORS = {
  0: 'bg-gray-100 text-gray-600',
  1: 'bg-blue-100 text-blue-700',
  2: 'bg-green-100 text-green-700',
  3: 'bg-red-100 text-red-600',
}

function fmtTime(iso) {
  return iso ? new Date(iso).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' }) : null
}

function StopNoteForm({ onSubmit }) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-brand-blue">
        <MessageSquare size={12} /> Legg til melding
      </button>
    )
  }

  const submit = async () => {
    if (!message.trim()) return
    setSending(true)
    try {
      await onSubmit(message.trim())
      setMessage('')
      setOpen(false)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex gap-2">
      <input value={message} onChange={e => setMessage(e.target.value)} placeholder="F.eks. forsinkelse, avvik…" autoFocus
        className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
      <button onClick={submit} disabled={sending || !message.trim()} className="text-brand-blue disabled:opacity-40"><Send size={15} /></button>
    </div>
  )
}

export default function DriverTripDetailPage() {
  const { id } = useParams()
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await driverApi.getTrip(id)
      setTrip(data)
    } catch {
      setError('Kunne ikke laste turen.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  // Share position only while the trip is actually in progress (status 1) — starts when the
  // driver taps "Start tur", stops the moment they finish or navigate away. Failures (denied
  // permission, no GPS fix) are silent so they never block the driver from working the trip.
  useEffect(() => {
    if (!trip || trip.status !== 1 || !('geolocation' in navigator)) return

    const reportOnce = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => { driverApi.reportLocation(trip.id, pos.coords.latitude, pos.coords.longitude).catch(() => {}) },
        () => {},
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 }
      )
    }

    reportOnce()
    const interval = setInterval(reportOnce, 30000)
    return () => clearInterval(interval)
  }, [trip?.id, trip?.status])

  const run = async (fn) => {
    setBusy(true)
    setError('')
    try {
      await fn()
      await load()
    } catch (e) {
      setError(e?.message || 'Noe gikk galt.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <p className="text-center text-gray-400 py-10 text-sm">Laster…</p>
  if (error && !trip) return <p className="text-center text-red-500 py-10 text-sm">{error}</p>
  if (!trip) return null

  return (
    <div className="space-y-5">
      <Link to="/driver" className="flex items-center gap-1 text-sm text-gray-500 hover:text-brand-blue">
        <ChevronLeft size={16} /> Mine turer
      </Link>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[trip.status]}`}>{STATUS_LABELS[trip.status]}</span>
        </div>
        <h1 className="text-xl font-black text-brand-dark">{trip.title || 'Tur'}</h1>
        <p className="text-sm text-gray-400 mt-0.5">{trip.busName}{trip.busRegistrationNumber ? ` (${trip.busRegistrationNumber})` : ''}</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-2.5 text-sm">{error}</div>}

      {trip.status === 0 && (
        <button onClick={() => run(() => driverApi.startTrip(trip.id))} disabled={busy}
          className="w-full flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-blue-dark disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl transition-colors">
          <PlayCircle size={18} /> Start tur
        </button>
      )}

      <div>
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Kart</h2>
        <TripMap
          stops={trip.stops}
          currentLatitude={trip.currentLatitude}
          currentLongitude={trip.currentLongitude}
          positionUpdatedAt={trip.positionUpdatedAt}
        />
      </div>

      <div>
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Tidtabell</h2>
        <div className="relative">
          {trip.stops.map((stop, i) => (
            <div key={stop.id} className="flex gap-3 pb-5 last:pb-0">
              <div className="flex flex-col items-center flex-shrink-0">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold
                  ${stop.actualArrival ? 'bg-green-600' : 'bg-brand-blue'}`}>
                  {i === 0 ? '▼' : i === trip.stops.length - 1 ? '✕' : 'H'}
                </span>
                {i < trip.stops.length - 1 && <span className="w-0.5 flex-1 bg-gray-200 mt-1" />}
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <p className="text-xs text-gray-400">Planlagt {fmtTime(stop.plannedTime)}</p>
                <p className="font-semibold text-sm text-brand-dark flex items-center gap-1">
                  <MapPin size={12} className="text-gray-300 flex-shrink-0" /> {stop.name}
                </p>
                {stop.description && <p className="text-xs text-gray-400 mt-0.5">{stop.description}</p>}

                {trip.status === 1 && (
                  <div className="flex items-center gap-2 mt-2">
                    {!stop.actualArrival ? (
                      <button onClick={() => run(() => driverApi.arriveAtStop(trip.id, stop.id))} disabled={busy}
                        className="text-xs font-semibold bg-gray-100 hover:bg-brand-blue hover:text-white px-3 py-1.5 rounded-lg transition-colors">
                        Merk ankomst
                      </button>
                    ) : !stop.actualDeparture ? (
                      <button onClick={() => run(() => driverApi.departFromStop(trip.id, stop.id))} disabled={busy}
                        className="text-xs font-semibold bg-gray-100 hover:bg-brand-blue hover:text-white px-3 py-1.5 rounded-lg transition-colors">
                        Merk avgang
                      </button>
                    ) : null}
                  </div>
                )}

                {(stop.actualArrival || stop.actualDeparture) && (
                  <p className="text-xs text-green-700 font-medium mt-1.5">
                    {stop.actualArrival && `Ank. ${fmtTime(stop.actualArrival)}`}
                    {stop.actualArrival && stop.actualDeparture && ' · '}
                    {stop.actualDeparture && `Avg. ${fmtTime(stop.actualDeparture)}`}
                  </p>
                )}

                {stop.notes?.length > 0 && (
                  <div className="space-y-1 mt-1.5">
                    {stop.notes.map(n => (
                      <p key={n.id} className="text-xs text-gray-600 bg-gray-50 rounded-lg px-2.5 py-1.5">{n.message}</p>
                    ))}
                  </div>
                )}

                {trip.status === 1 && (
                  <div className="mt-1.5">
                    <StopNoteForm onSubmit={(message) => run(() => driverApi.addStopNote(trip.id, stop.id, message))} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {trip.status === 1 && (
        <button onClick={() => run(() => driverApi.finishTrip(trip.id))} disabled={busy}
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl transition-colors">
          <CheckCircle2 size={18} /> Fullfør tur
        </button>
      )}

      <div>
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Meldinger for hele turen</h2>
        {trip.tripNotes?.length > 0 && (
          <div className="space-y-1.5 mb-2">
            {trip.tripNotes.map(n => (
              <p key={n.id} className="text-sm text-gray-700 bg-white border border-gray-200 rounded-xl px-3 py-2">{n.message}</p>
            ))}
          </div>
        )}
        {(trip.status === 1 || trip.status === 0) && (
          <StopNoteForm onSubmit={(message) => run(() => driverApi.addTripNote(trip.id, message))} />
        )}
      </div>
    </div>
  )
}
