import { Plus, CheckCircle2, MessageSquare, AlertTriangle } from 'lucide-react'

const toMin = (t) => {
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  return Number.isNaN(h) ? null : h * 60 + (m || 0)
}
const dayKey = (d) => String(d).slice(0, 10)
const dayMs = (d) => new Date(`${dayKey(d)}T00:00:00Z`).getTime()

// Same overlap rule as the backend AssignmentConflictChecker (date + time of day windows).
function span(startDate, endDate, startTime, endTime) {
  return {
    start: dayMs(startDate) + (toMin(startTime) ?? 0) * 60000,
    end: dayMs(endDate) + (toMin(endTime) ?? 1440) * 60000,
  }
}

export function findConflicts(assignments, { busId, driverId, startDate, endDate, startTime, endTime, excludeId }) {
  if (!startDate || !endDate) return { bus: [], driver: [] }
  const w = span(startDate, endDate, startTime, endTime)
  const bus = []
  const driver = []
  for (const a of assignments || []) {
    if (a.id === excludeId || a.status === 3) continue
    const o = span(a.startDate, a.endDate, a.startTime, a.endTime)
    if (w.start >= o.end || o.start >= w.end) continue
    if (busId && a.busId === busId) bus.push(a)
    if (driverId && a.driverId === driverId) driver.push(a)
  }
  return { bus, driver }
}

export const describe = (a) =>
  `${a.title || 'Oppgave'} · ${dayKey(a.startDate)}${dayKey(a.startDate) !== dayKey(a.endDate) ? ` – ${dayKey(a.endDate)}` : ''}${a.startTime ? ` ${a.startTime}–${a.endTime || ''}` : ''}`

export function ConflictNotice({ kind, items, children }) {
  if (items.length === 0) return null
  return (
    <div role="alert" className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-red-700 mb-1">
        <AlertTriangle size={13} /> {kind === 'bus' ? 'Bussen er opptatt' : 'Sjåføren er opptatt'} i dette tidsrommet
      </p>
      <ul className="space-y-0.5">
        {items.map(c => <li key={c.id} className="text-xs text-red-600">{describe(c)}</li>)}
      </ul>
      {children}
    </div>
  )
}

// Status styling for calendar blocks: completed fades, in-progress is ringed, trips with no driver stay red.
export function blockStatusClass(a) {
  if (a.status === 2) return 'opacity-60'
  if (a.status === 1) return 'ring-2 ring-offset-1 ring-blue-300'
  return ''
}

export function StatusBadge({ a }) {
  if (a.status === 2) return <CheckCircle2 size={11} className="shrink-0" aria-label="Fullført" />
  if (a.status === 1) return <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" aria-label="Pågår" />
  return null
}

const fmtShort = (d) => new Date(d).toLocaleDateString('nb-NO', { weekday: 'short', day: 'numeric', month: 'short' })

function urgency(departureDate) {
  const days = Math.ceil((new Date(departureDate).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000)
  if (days < 0) return { label: 'Forfalt', cls: 'bg-red-100 text-red-700' }
  if (days === 0) return { label: 'I dag', cls: 'bg-red-100 text-red-700' }
  if (days <= 3) return { label: `Om ${days} d`, cls: 'bg-red-100 text-red-700' }
  if (days <= 7) return { label: `Om ${days} d`, cls: 'bg-amber-100 text-amber-700' }
  return { label: `Om ${days} d`, cls: 'bg-gray-100 text-gray-600' }
}

const STATUS_CHIP = { 0: 'Ny', 1: 'Bekreftet', 3: 'Tilbud' }

export function UnplannedQueue({ bookings, onPlan }) {
  return (
    <aside className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-sm font-bold text-brand-dark">Må planlegges</h2>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${bookings.length ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
          {bookings.length}
        </span>
      </div>
      {bookings.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-gray-500">Alle bestillinger er planlagt.</p>
      ) : (
        <ul className="divide-y divide-gray-100 max-h-[70vh] overflow-y-auto">
          {bookings.map(b => {
            const u = urgency(b.departureDate)
            return (
              <li key={b.id} className="px-4 py-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-brand-dark truncate">{b.contactName}</span>
                  <span className={`shrink-0 text-[11px] font-semibold px-1.5 py-0.5 rounded ${u.cls}`}>{u.label}</span>
                </div>
                <p className="text-xs text-gray-500 truncate">{b.fromAddress} → {b.toAddress}</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-gray-400">
                    {fmtShort(b.departureDate)} · <span className="font-mono">{b.reference}</span>
                    {b.busCount > 1 && <span className="ml-1 font-semibold text-brand-blue">{b.plannedCount ?? 0}/{b.busCount} busser</span>}
                    {STATUS_CHIP[b.status] && b.status !== 1 && <span className="ml-1 text-gray-400">· {STATUS_CHIP[b.status]}</span>}
                  </p>
                  <button onClick={() => onPlan(b)}
                    className="shrink-0 flex items-center gap-1 bg-brand-blue hover:bg-brand-blue-dark text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors">
                    <Plus size={12} /> Planlegg
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </aside>
  )
}

const hhmm = (iso) => new Date(iso).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })

// Read-only vertical timeline of a trip: pickup, stops, destination with planned/actual times and driver notes.
export function TripTimeline({ stops }) {
  if (!stops?.length) return null
  return (
    <ol className="relative ml-2">
      {stops.map((s, i) => {
        const first = i === 0
        const last = i === stops.length - 1
        const done = !!s.actualDeparture || (last && !!s.actualArrival)
        const arrived = !!s.actualArrival
        return (
          <li key={s.id ?? i} className="relative pl-6 pb-4 last:pb-0">
            {!last && <span className={`absolute left-[5px] top-3 bottom-0 w-0.5 ${done ? 'bg-green-400' : 'bg-gray-200'}`} />}
            <span className={`absolute left-0 top-1 w-3 h-3 rounded-full border-2 bg-white ${arrived ? 'border-green-500 bg-green-500' : last ? 'border-brand-dark' : 'border-brand-blue'}`} />
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-semibold text-brand-dark truncate">
                <span className="text-[11px] font-medium text-gray-400 mr-1.5 uppercase">{first ? 'Henting' : last ? 'Mål' : 'Stopp'}</span>
                {s.name}
              </p>
              <span className="text-xs tabular-nums text-gray-500 shrink-0">
                {s.plannedTime ? hhmm(s.plannedTime) : ''}
                {s.actualArrival && <span className="text-green-700 ml-1.5">({hhmm(s.actualArrival)})</span>}
              </span>
            </div>
            {s.description && <p className="text-xs text-gray-500">{s.description}</p>}
            {s.notes?.map(n => (
              <p key={n.id} className="flex items-start gap-1 text-xs text-amber-700 mt-0.5">
                <MessageSquare size={11} className="mt-0.5 shrink-0" /> {n.message}
              </p>
            ))}
          </li>
        )
      })}
    </ol>
  )
}
