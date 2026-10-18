import { SkeletonTable } from '../../components/Skeleton'
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Search, Calendar, Phone, User, Copy, Check } from 'lucide-react'
import { api } from '../../services/api'

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('nb-NO', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '–'
const fmtDateShort = (d) => d ? new Date(d).toLocaleDateString('nb-NO', { day: '2-digit', month: '2-digit' }) : '–'
const todayStr = () => new Date().toISOString().slice(0, 10)

function CopyTrackingLink({ token }) {
  const [copied, setCopied] = useState(false)
  if (!token) return <span className="text-gray-300 text-xs">–</span>
  const url = `${window.location.origin}/sporing/${token}`
  const copy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      onClick={copy}
      title={url}
      className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded border border-gray-200 hover:border-blue-400 hover:text-blue-600 text-gray-500 transition-colors"
    >
      {copied ? <Check size={11} className="text-green-600" /> : <Copy size={11} />}
      {copied ? 'Kopiert!' : 'Kopier lenke'}
    </button>
  )
}

const TRIP_STATUS = [
  { value: '',  label: 'Alle',      dot: 'bg-gray-300',   text: 'text-gray-500',  bg: 'bg-gray-100' },
  { value: '0', label: 'Planlagt',  dot: 'bg-yellow-400', text: 'text-yellow-700', bg: 'bg-yellow-50' },
  { value: '1', label: 'Pågår',     dot: 'bg-blue-500',   text: 'text-blue-700',  bg: 'bg-blue-50' },
  { value: '2', label: 'Fullført',  dot: 'bg-green-500',  text: 'text-green-700', bg: 'bg-green-50' },
  { value: '3', label: 'Avlyst',    dot: 'bg-red-500',    text: 'text-red-700',   bg: 'bg-red-50' },
]

const BOOKING_STATUS = {
  0: { label: 'Ny',         text: 'text-blue-700',  bg: 'bg-blue-50' },
  1: { label: 'Bekreftet',  text: 'text-green-700', bg: 'bg-green-50' },
  2: { label: 'Avlyst',     text: 'text-red-700',   bg: 'bg-red-50' },
  3: { label: 'Tilbud',     text: 'text-purple-700',bg: 'bg-purple-50' },
}

const DATE_PRESETS = [
  { key: 'upcoming', label: 'Kommende' },
  { key: 'today',    label: 'I dag' },
  { key: 'all',      label: 'Alle datoer' },
]

export default function AdminTripsOverviewPage() {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [datePreset, setDatePreset] = useState('upcoming')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    const params = { status: status || undefined, search: search.trim() || undefined }
    if (datePreset === 'today') {
      params.from = todayStr(); params.to = todayStr()
    } else if (datePreset === 'upcoming') {
      params.from = todayStr()
    } else if (datePreset === 'custom') {
      params.from = fromDate || undefined; params.to = toDate || undefined
    }
    api.getTripsOverview(params).then(setTrips).catch(() => {}).finally(() => setLoading(false))
  }, [search, status, datePreset, fromDate, toDate])

  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [load])

  const tripStatusObj = (s) => TRIP_STATUS.find(x => x.value === String(s)) ?? TRIP_STATUS[1]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-brand-dark">Kjøreordre</h1>
          <p className="text-sm text-gray-400 mt-0.5">Oversikt over alle turer</p>
        </div>
        <span className="text-sm text-gray-400">{trips.length} tur{trips.length !== 1 ? 'er' : ''}</span>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Søk på turnummer, referanse, sjåfør, kunde…"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {DATE_PRESETS.map(p => (
            <button key={p.key} onClick={() => setDatePreset(p.key)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap
                ${datePreset === p.key ? 'bg-brand-dark text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}>
              {p.label}
            </button>
          ))}
          <button onClick={() => setDatePreset('custom')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap
              ${datePreset === 'custom' ? 'bg-brand-dark text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}>
            <Calendar size={14} /> Egendefinert
          </button>
        </div>
      </div>

      {datePreset === 'custom' && (
        <div className="flex flex-wrap items-end gap-3 mb-4 bg-white border border-gray-200 rounded-xl p-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Fra dato</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Til dato</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4 flex-wrap">
        {TRIP_STATUS.map(s => (
          <button key={s.value} onClick={() => setStatus(s.value)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold transition-colors
              ${status === s.value ? 'bg-brand-dark text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}>
            <span className={`w-2 h-2 rounded-full ${s.dot}`} /> {s.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr className="text-xs text-gray-400 uppercase tracking-wider">
              <th className="text-left px-4 py-3 font-semibold">Tur nr.</th>
              <th className="text-left px-4 py-3 font-semibold">Tur start</th>
              <th className="text-left px-4 py-3 font-semibold">Turen slutter</th>
              <th className="text-left px-4 py-3 font-semibold">Pax</th>
              <th className="text-left px-4 py-3 font-semibold">Fra / Til</th>
              <th className="text-left px-4 py-3 font-semibold">Buss</th>
              <th className="text-left px-4 py-3 font-semibold">Turstatus</th>
              <th className="text-left px-4 py-3 font-semibold">Oppdragsstatus</th>
              <th className="text-left px-4 py-3 font-semibold">Sjåfør</th>
              <th className="text-left px-4 py-3 font-semibold">Kunde</th>
              <th className="text-left px-4 py-3 font-semibold">Sporing</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {trips.map(t => {
              const ts = tripStatusObj(t.status)
              const bs = BOOKING_STATUS[t.bookingStatus] ?? null
              return (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  {/* Tur nr. */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Link
                      to={t.bookingId ? `/admin/bookings?ref=${t.bookingReference || ''}` : '#'}
                      className="font-mono text-xs font-bold text-brand-blue hover:underline"
                    >
                      #{t.id}
                    </Link>
                    {t.bookingReference && (
                      <p className="text-xs text-gray-400 font-normal mt-0.5">{t.bookingReference}</p>
                    )}
                    {t.title && (
                      <p className="text-xs text-gray-400 font-normal mt-0.5 max-w-[120px] truncate">{t.title}</p>
                    )}
                  </td>

                  {/* Tur start */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="font-semibold text-brand-dark">{fmtDate(t.startDate)}</p>
                    {t.startTime && <p className="text-xs text-gray-400 mt-0.5">{t.startTime}</p>}
                  </td>

                  {/* Turen slutter */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="font-semibold text-brand-dark">{fmtDate(t.endDate)}</p>
                    {t.endTime && <p className="text-xs text-gray-400 mt-0.5">{t.endTime}</p>}
                  </td>

                  {/* Pax */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {t.passengers != null
                      ? <span className="inline-flex items-center gap-1 text-gray-700 font-semibold"><User size={12} className="text-gray-400" />{t.passengers}</span>
                      : <span className="text-gray-300">–</span>}
                  </td>

                  {/* Fra / Til */}
                  <td className="px-4 py-3 max-w-[200px]">
                    {t.fromAddress && <p className="text-gray-700 truncate text-xs">{t.fromAddress}</p>}
                    {t.toAddress && (
                      <p className="text-gray-400 truncate text-xs mt-0.5">→ {t.toAddress}</p>
                    )}
                    {!t.fromAddress && !t.toAddress && <span className="text-gray-300">–</span>}
                  </td>

                  {/* Buss */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-gray-700">{t.busName || t.busId || <span className="text-gray-300">–</span>}</span>
                  </td>

                  {/* Turstatus */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${ts.bg} ${ts.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${ts.dot}`} />
                      {ts.label}
                    </span>
                  </td>

                  {/* Oppdragsstatus (booking status) */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {bs
                      ? <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${bs.bg} ${bs.text}`}>{bs.label}</span>
                      : <span className="text-gray-300 text-xs">–</span>}
                  </td>

                  {/* Sjåfør */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {t.driverName
                      ? <span className="text-gray-700">{t.driverName}</span>
                      : <span className="text-gray-300">–</span>}
                  </td>

                  {/* Kunde */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {t.customerName
                      ? <>
                          <p className="text-gray-700 font-medium">{t.customerName}</p>
                          {t.customerPhone && (
                            <a href={`tel:${t.customerPhone}`} className="flex items-center gap-1 text-xs text-gray-400 hover:text-brand-blue mt-0.5">
                              <Phone size={10} /> {t.customerPhone}
                            </a>
                          )}
                        </>
                      : <span className="text-gray-300">–</span>}
                  </td>

                  {/* Sporing */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <CopyTrackingLink token={t.trackingToken} />
                  </td>
                </tr>
              )
            })}
            {!loading && trips.length === 0 && (
              <tr>
                <td colSpan={11} className="px-5 py-12 text-center text-gray-400 text-sm">
                  Ingen turer funnet.
                </td>
              </tr>
            )}
            {loading && (
              <SkeletonTable rows={6} cols={11} />
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
