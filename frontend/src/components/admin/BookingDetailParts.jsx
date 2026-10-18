import { useEffect, useState } from 'react'
import { Check, XCircle } from 'lucide-react'
import { api } from '../../services/api'

const kr = (n) => `${Number(n || 0).toLocaleString('nb-NO')} kr`

export function plannedBusCount(trips) {
  return new Set(trips.filter(t => t.status !== 3).map(t => t.busId)).size
}

// Derives lifecycle progress from booking + trips + invoice/payment state.
export function lifecycle(booking, trips, { invoiceSentAt, paymentStatus }) {
  const active = trips.filter(t => t.status !== 3)
  const planned = plannedBusCount(trips)
  const fullyPlanned = planned >= booking.busCount
  const allDone = active.length > 0 && fullyPlanned && active.every(t => t.status === 2)
  const confirmed = booking.status === 1
  const steps = [
    { key: 'request', label: 'Forespørsel', done: true },
    { key: 'quoted', label: 'Tilbud', done: booking.status === 3 || confirmed, optional: true },
    { key: 'confirmed', label: 'Bekreftet', done: confirmed },
    { key: 'planned', label: 'Planlagt', done: confirmed && fullyPlanned && active.length > 0 },
    { key: 'completed', label: 'Gjennomført', done: confirmed && allDone },
    { key: 'invoiced', label: 'Fakturert', done: !!invoiceSentAt },
    { key: 'paid', label: 'Betalt', done: paymentStatus === 1 },
  ]
  return { steps, planned, fullyPlanned, allDone, active }
}

export function LifecycleTimeline({ booking, steps }) {
  if (booking.status === 2) {
    return (
      <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm font-semibold">
        <XCircle size={16} /> Bestillingen er avlyst
      </div>
    )
  }
  const currentIdx = steps.findIndex(s => !s.done && !s.optional)
  return (
    <ol className="flex items-start overflow-x-auto pb-1">
      {steps.map((s, i) => {
        const isCurrent = i === currentIdx
        return (
          <li key={s.key} className="flex-1 min-w-[72px] flex flex-col items-center relative">
            {i > 0 && <span className={`absolute top-3 right-1/2 w-full h-0.5 ${s.done ? 'bg-green-500' : 'bg-gray-200'}`} />}
            <span className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2
              ${s.done ? 'bg-green-500 border-green-500 text-white' : isCurrent ? 'bg-white border-brand-blue text-brand-blue' : 'bg-white border-gray-200 text-gray-300'}`}>
              {s.done ? <Check size={13} /> : i + 1}
            </span>
            <span className={`mt-1.5 text-[11px] text-center leading-tight ${isCurrent ? 'font-bold text-brand-dark' : s.done ? 'text-gray-600' : 'text-gray-400'}`}>
              {s.label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export function PriceBreakdown({ booking, total, extraCharges }) {
  const adj = Number(booking.priceAdjustment || 0)
  const row = (label, value, strong) => (
    <div className={`flex justify-between gap-3 text-sm ${strong ? 'font-bold text-brand-dark pt-2 mt-1 border-t border-gray-200' : 'text-gray-600'}`}>
      <span>{label}</span><span className="tabular-nums">{value}</span>
    </div>
  )
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-1">
      {row('Grunnpris eks. MVA', kr(booking.estimatedBase))}
      {row('MVA', kr(booking.estimatedVat))}
      {adj !== 0 && row(`Justering${booking.priceAdjustmentNote ? ` (${booking.priceAdjustmentNote})` : ''}`, `${adj > 0 ? '+' : ''}${kr(adj)}`)}
      {extraCharges.map(c => row(c.description, `${c.amount > 0 ? '+' : ''}${kr(c.amount)}`))}
      {row('Total inkl. MVA', kr(total), true)}
    </div>
  )
}

const TYPE_DOT = { created: 'bg-gray-400', status: 'bg-blue-500', price: 'bg-amber-500', trip: 'bg-indigo-500', invoice: 'bg-purple-500', payment: 'bg-green-500', notes: 'bg-gray-400' }

export function ActivityLog({ booking, refreshKey, types }) {
  const [items, setItems] = useState(null)

  useEffect(() => {
    let stale = false
    api.getBookingActivity(booking.id).then(r => { if (!stale) setItems(r) }).catch(() => { if (!stale) setItems([]) })
    return () => { stale = true }
  }, [booking.id, refreshKey])

  if (!items) return <p className="text-sm text-gray-400">Laster aktivitet…</p>
  const list = types
    ? items.filter(i => types.includes(i.type))
    : items.some(i => i.type === 'created')
      ? items
      : [...items, { id: 'created', type: 'created', message: 'Forespørsel mottatt', createdAt: booking.createdAt }]
  if (types && list.length === 0) return <p className="text-sm text-gray-400">Ingen hendelser ennå.</p>

  return (
    <ul className="space-y-2.5">
      {list.map(a => (
        <li key={a.id} className="flex gap-3 text-sm">
          <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${TYPE_DOT[a.type] || 'bg-gray-400'}`} />
          <div className="min-w-0">
            <p className="text-gray-700">{a.message}</p>
            <p className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}

export function Section({ title, children, aside }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  )
}
