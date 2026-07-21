import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Search, Calendar } from 'lucide-react'
import { api } from '../../services/api'

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('nb-NO') : '–'
const todayStr = () => new Date().toISOString().slice(0, 10)

const STATUS = [
  { value: '', label: 'Alle', dot: 'bg-gray-300' },
  { value: '0', label: 'Planlagt', dot: 'bg-yellow-400' },
  { value: '1', label: 'Pågår', dot: 'bg-blue-500' },
  { value: '2', label: 'Fullført', dot: 'bg-green-500' },
  { value: '3', label: 'Avlyst', dot: 'bg-red-500' },
]

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
      params.from = todayStr()
      params.to = todayStr()
    } else if (datePreset === 'upcoming') {
      params.from = todayStr()
    } else if (datePreset === 'custom') {
      params.from = fromDate || undefined
      params.to = toDate || undefined
    }
    api.getTripsOverview(params).then(setTrips).catch(() => {}).finally(() => setLoading(false))
  }, [search, status, datePreset, fromDate, toDate])

  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [load])

  return (
    <div>
      <h1 className="text-xl font-bold text-brand-dark mb-1">Kjøreordre</h1>
      <p className="text-sm text-gray-400 mb-6">Oversikt over alle turer — søk på turnummer, referanse eller sjåfør.</p>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Søk på turnummer, referanse, sjåfør…"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
          />
        </div>
        <div className="flex gap-2">
          {DATE_PRESETS.map(p => (
            <button key={p.key} onClick={() => setDatePreset(p.key)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${datePreset === p.key ? 'bg-brand-dark text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}>
              {p.label}
            </button>
          ))}
          <button onClick={() => setDatePreset('custom')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${datePreset === 'custom' ? 'bg-brand-dark text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}>
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

      <div className="flex gap-2 mb-4">
        {STATUS.map(s => (
          <button key={s.value} onClick={() => setStatus(s.value)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold transition-colors ${status === s.value ? 'bg-brand-dark text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}>
            <span className={`w-2 h-2 rounded-full ${s.dot}`} />
            {s.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3">Tur</th>
              <th className="text-left px-5 py-3">Referanse</th>
              <th className="text-left px-5 py-3">Start</th>
              <th className="text-left px-5 py-3">Fra</th>
              <th className="text-left px-5 py-3">Slutt</th>
              <th className="text-left px-5 py-3">Til</th>
              <th className="text-left px-5 py-3">Sjåfør</th>
              <th className="text-left px-5 py-3">Buss</th>
              <th className="text-left px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {trips.map(t => {
              const st = STATUS[t.status + 1] ?? STATUS[0]
              return (
                <tr key={t.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-5 py-3 font-mono text-xs font-semibold text-brand-dark whitespace-nowrap">
                    <Link to={t.bookingId ? `/admin/bookings?ref=${t.bookingReference || ''}` : '#'} className="hover:text-brand-blue">
                      #{t.id}
                    </Link>
                    {t.title && <p className="font-sans text-xs text-gray-400 font-normal">{t.title}</p>}
                  </td>
                  <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{t.bookingReference || '–'}</td>
                  <td className="px-5 py-3 text-gray-700 whitespace-nowrap">{fmtDate(t.startDate)}{t.startTime ? ` ${t.startTime}` : ''}</td>
                  <td className="px-5 py-3 text-gray-700 max-w-[180px] truncate">{t.fromAddress || '–'}</td>
                  <td className="px-5 py-3 text-gray-700 whitespace-nowrap">{fmtDate(t.endDate)}{t.endTime ? ` ${t.endTime}` : ''}</td>
                  <td className="px-5 py-3 text-gray-700 max-w-[180px] truncate">{t.toAddress || '–'}</td>
                  <td className="px-5 py-3 text-gray-700 whitespace-nowrap">{t.driverName || '–'}</td>
                  <td className="px-5 py-3 text-gray-700 whitespace-nowrap">{t.busName || t.busId || '–'}</td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                      <span className={`w-2 h-2 rounded-full ${st.dot}`} /> {st.label}
                    </span>
                  </td>
                </tr>
              )
            })}
            {!loading && trips.length === 0 && (
              <tr><td colSpan={9} className="px-5 py-10 text-center text-gray-400 text-sm">Ingen turer funnet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
