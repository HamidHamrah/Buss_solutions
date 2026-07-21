import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Search, CheckCircle, Clock, XCircle, ArrowRight, Bus, MapPin, Calendar, Users, SendHorizontal } from 'lucide-react'
import { api } from '../services/api'
import { useSeo } from '../hooks/useSeo'

const STATUS_MAP = {
  New:       { label: 'Til behandling', color: 'bg-amber-50 text-amber-700 border-amber-200',  icon: Clock,        dot: 'bg-amber-400' },
  Quoted:    { label: 'Tilbud sendt',   color: 'bg-blue-50 text-blue-700 border-blue-200',     icon: SendHorizontal, dot: 'bg-blue-500'  },
  Confirmed: { label: 'Bekreftet',      color: 'bg-green-50 text-green-700 border-green-200',   icon: CheckCircle,  dot: 'bg-green-500' },
  Cancelled: { label: 'Kansellert',     color: 'bg-red-50 text-red-700 border-red-200',         icon: XCircle,      dot: 'bg-red-500'   },
}

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.New
  const Icon = s.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-semibold ${s.color}`}>
      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
      <Icon size={13} />
      {s.label}
    </span>
  )
}

function BookingCard({ booking }) {
  const date = new Date(booking.departureDate).toLocaleDateString('nb-NO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const created = new Date(booking.createdAt).toLocaleDateString('nb-NO', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  const status = STATUS_MAP[booking.status] ?? STATUS_MAP.New

  return (
    <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-100 px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs text-gray-400 mb-1">Referansenummer</p>
          <p className="font-mono font-bold text-brand-dark text-lg">{booking.reference}</p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      {/* Status message */}
      <div className={`px-8 py-4 border-b border-gray-100 ${status.color} bg-opacity-40`}>
        {booking.status === 'New' && (
          <p className="text-sm">
            <strong>Din forespørsel er mottatt</strong> og er til behandling. En av våre medarbeidere kontakter deg innen 2 arbeidstimer med et bindende tilbud.
          </p>
        )}
        {booking.status === 'Quoted' && (
          <p className="text-sm">
            <strong>Vi har sendt deg et tilbud!</strong> Sjekk e-posten din og ta kontakt om du har spørsmål eller ønsker å bekrefte.
          </p>
        )}
        {booking.status === 'Confirmed' && (
          <p className="text-sm">
            <strong>Bestillingen er bekreftet!</strong> Vi ser frem til å kjøre deg. Ta kontakt om du har spørsmål eller endringer.
          </p>
        )}
        {booking.status === 'Cancelled' && (
          <p className="text-sm">
            <strong>Bestillingen er kansellert.</strong> Ta kontakt dersom dette er en feil, eller bestill en ny tur.
          </p>
        )}
      </div>

      {/* Trip details */}
      <div className="px-8 py-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Detail icon={MapPin} label="Fra" value={booking.fromAddress} />
        <Detail icon={MapPin} label="Til" value={booking.toAddress} />
        <Detail icon={Calendar} label="Avgangsdato" value={`${date} kl. ${booking.departureTime}`} />
        <Detail icon={Bus} label="Buss" value={booking.busCount > 1 ? `${booking.busName} × ${booking.busCount} busser` : (booking.busName || '–')} />
        <Detail icon={Users} label="Passasjerer" value={String(booking.passengers)} />
        <Detail icon={null} label="Estimert pris inkl. mva"
          value={booking.estimatedTotal ? `${Number(booking.estimatedTotal).toLocaleString('nb-NO')} kr` : '–'} />
      </div>

      {/* Return date */}
      {booking.tripType === 'return' && booking.returnDate && (
        <div className="px-8 pb-4">
          <Detail icon={Calendar} label="Returdato" value={`${new Date(booking.returnDate).toLocaleDateString('nb-NO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}${booking.returnTime ? ` kl. ${booking.returnTime}` : ''}`} />
        </div>
      )}

      {/* Stops */}
      {booking.stops?.filter(s => !s.startsWith('[Retur]')).length > 0 && (
        <div className="px-8 pb-4 border-t border-gray-100 pt-4">
          <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">Stopp på utreise</p>
          {booking.stops.filter(s => !s.startsWith('[Retur]')).map((s, i) => (
            <p key={i} className="text-sm text-gray-700">{s}</p>
          ))}
        </div>
      )}
      {booking.stops?.filter(s => s.startsWith('[Retur]')).length > 0 && (
        <div className="px-8 pb-4">
          <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">Stopp på retur</p>
          {booking.stops.filter(s => s.startsWith('[Retur]')).map((s, i) => (
            <p key={i} className="text-sm text-gray-700">{s.replace('[Retur] ', '')}</p>
          ))}
        </div>
      )}

      {/* Extras / special needs */}
      {(booking.needsTrailer || booking.needsWheelchair || booking.selectedExtras?.length > 0) && (
        <div className="px-8 pb-4 border-t border-gray-100 pt-4">
          <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">Tilleggstjenester</p>
          <div className="flex flex-wrap gap-2">
            {booking.needsTrailer && <span className="px-3 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-xs font-medium">Tilhenger</span>}
            {booking.needsWheelchair && <span className="px-3 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-xs font-medium">Rullestoltilpasset</span>}
            {booking.selectedExtras?.map((e, i) => (
              <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{e}</span>
            ))}
          </div>
        </div>
      )}

      <div className="px-8 pb-6 flex flex-col sm:flex-row gap-3">
        <a href="tel:+4795453807"
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
          Ring oss: 95 45 38 07
        </a>
        <Link to="/kontakt"
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-brand-blue hover:bg-brand-blue-dark text-white font-bold text-sm transition-all">
          Send melding <ArrowRight size={13} />
        </Link>
      </div>

      <div className="px-8 pb-5 text-xs text-gray-400">
        Bestilt {created} · Husk å oppgi referansenummeret ved henvendelser.
      </div>
    </div>
  )
}

function Detail({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      {Icon && (
        <div className="w-8 h-8 rounded-lg bg-brand-blue/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon size={14} className="text-brand-blue" />
        </div>
      )}
      {!Icon && <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-gray-400 text-xs font-bold">kr</span>
      </div>}
      <div>
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-brand-dark">{value}</p>
      </div>
    </div>
  )
}

export default function BookingLookupPage() {
  useSeo({ title: 'Sjekk bestillingsstatus', noindex: true })
  const { ref } = useParams()
  const navigate = useNavigate()

  const [input, setInput] = useState(ref ?? '')
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const lookup = async (reference) => {
    if (!reference.trim()) return
    setLoading(true)
    setError(null)
    setBooking(null)
    try {
      const data = await api.lookupBooking(reference.trim())
      setBooking(data)
      // Keep URL in sync
      if (reference.trim().toUpperCase() !== ref) {
        navigate(`/bestilling/${reference.trim().toUpperCase()}`, { replace: true })
      }
    } catch {
      setError('Ingen bestilling funnet med dette referansenummeret. Sjekk at du har skrevet det inn riktig.')
    } finally {
      setLoading(false)
    }
  }

  // Auto-lookup when page loads with a ref in URL
  useEffect(() => {
    if (ref) lookup(ref)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="pt-24 min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-brand-blue/10 flex items-center justify-center mx-auto mb-4">
            <Search size={24} className="text-brand-blue" />
          </div>
          <h1 className="text-3xl font-black text-brand-dark mb-3">Sjekk bestillingsstatus</h1>
          <p className="text-gray-500">
            Skriv inn referansenummeret fra bekreftelsen du fikk da du bestilte.
          </p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
          <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider mb-2">
            Referansenummer
          </label>
          <div className="flex gap-3">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && lookup(input)}
              placeholder="NTR-20260704-1234"
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
            />
            <button
              onClick={() => lookup(input)}
              disabled={loading || !input.trim()}
              className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark disabled:opacity-50 text-white font-bold px-5 py-3 rounded-xl text-sm transition-all">
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search size={15} />
              )}
              Søk
            </button>
          </div>
          {error && (
            <p className="mt-3 text-sm text-red-600 flex items-center gap-1.5">
              <XCircle size={14} /> {error}
            </p>
          )}
        </div>

        {booking && <BookingCard booking={booking} />}

        {/* Help text */}
        {!booking && !error && (
          <p className="text-center text-sm text-gray-400 mt-8">
            Finner du ikke referansenummeret?{' '}
            <Link to="/kontakt" className="text-brand-blue hover:underline font-medium">Kontakt oss</Link>
          </p>
        )}
      </div>
    </div>
  )
}
