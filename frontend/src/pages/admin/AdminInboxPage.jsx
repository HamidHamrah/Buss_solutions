import { SkeletonRows } from '../../components/Skeleton'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import { fmtDate } from '../../utils/bookingHelpers'

const PRIORITY_STYLE = {
  high: 'bg-red-50 text-red-700 border-red-200',
  normal: 'bg-amber-50 text-amber-700 border-amber-200',
}

function linkFor(item) {
  if (item.kind === 'contact') return '/admin/kontakt'
  if (item.kind === 'needs_planning' || item.kind === 'planned') return '/admin/planning'
  if (['ready_to_invoice', 'invoice_draft', 'invoice_sent'].includes(item.kind)) return '/admin/invoices'
  return `/admin/bookings?ref=${item.reference}`
}

const FILTERS = [
  { key: 'all', label: 'Alle' },
  { key: 'new', label: 'Nye' },
  { key: 'needs_planning', label: 'Planlegging' },
  { key: 'planned', label: 'Sjåfør' },
  { key: 'invoice', label: 'Faktura' },
  { key: 'contact', label: 'Meldinger' },
]

const matchesFilter = (item, f) =>
  f === 'all' || (f === 'invoice' ? ['ready_to_invoice', 'invoice_draft', 'invoice_sent'].includes(item.kind) : item.kind === f)

export default function AdminInboxPage() {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    api.getInbox().then(setItems).catch(() => setError('Kunne ikke hente innboksen.'))
  }, [])

  if (error) return <p className="text-sm text-red-600">{error}</p>
  if (!items) return <div className="max-w-4xl"><SkeletonRows rows={5} /></div>

  const visible = items.filter(i => matchesFilter(i, filter))

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => {
          const count = items.filter(i => matchesFilter(i, f.key)).length
          return (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${filter === f.key ? 'bg-brand-dark text-white border-brand-dark' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
              {f.label} <span className="opacity-60">{count}</span>
            </button>
          )
        })}
      </div>

      {visible.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-sm text-gray-500">
          Ingenting krever handling akkurat nå.
        </div>
      ) : (
        <ul className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {visible.map((item, i) => (
            <li key={`${item.kind}-${item.bookingId ?? i}-${i}`}>
              <Link to={linkFor(item)} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50">
                <span className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-md border ${PRIORITY_STYLE[item.priority]}`}>
                  {item.stage}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-brand-dark truncate">
                    {item.title} {item.reference && <span className="font-normal text-gray-400">· {item.reference}</span>}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{item.subtitle}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-brand-blue">{item.action}</p>
                  <p className="text-xs text-gray-400">{fmtDate(item.date)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
