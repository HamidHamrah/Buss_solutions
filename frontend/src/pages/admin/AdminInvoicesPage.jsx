import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Circle, AlertTriangle } from 'lucide-react'
import { api } from '../../services/api'

const fmtKr = (n) => (n ?? 0).toLocaleString('nb-NO') + ' kr'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('nb-NO') : '–'
const dueDate = (invoiceDate) => {
  if (!invoiceDate) return null
  const d = new Date(invoiceDate)
  d.setDate(d.getDate() + 14)
  return d
}

const FILTERS = [
  { key: 'all', label: 'Alle' },
  { key: 'unpaid', label: 'Ubetalt' },
  { key: 'paid', label: 'Betalt' },
]

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [updating, setUpdating] = useState(null)

  const load = () => {
    setLoading(true)
    api.getInvoices(filter === 'all' ? undefined : filter)
      .then(setInvoices)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filter])

  const togglePaid = async (inv) => {
    setUpdating(inv.id)
    try {
      await api.updatePaymentStatus(inv.id, inv.paymentStatus === 1 ? 0 : 1)
      load()
    } catch {}
    setUpdating(null)
  }

  const totals = invoices.reduce((acc, inv) => {
    acc.total += inv.estimatedTotal
    if (inv.paymentStatus === 1) acc.paid += inv.estimatedTotal
    else acc.unpaid += inv.estimatedTotal
    return acc
  }, { total: 0, paid: 0, unpaid: 0 })

  return (
    <div>
      <h1 className="text-xl font-bold text-brand-dark mb-1">Fakturaer</h1>
      <p className="text-sm text-gray-400 mb-6">Oversikt over genererte fakturaer og betalingsstatus.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-xs text-gray-400 mb-1">Totalt fakturert</p>
          <p className="text-xl font-black text-brand-dark">{fmtKr(totals.total)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-xs text-gray-400 mb-1">Betalt</p>
          <p className="text-xl font-black text-green-600">{fmtKr(totals.paid)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-xs text-gray-400 mb-1">Utestående</p>
          <p className="text-xl font-black text-amber-600">{fmtKr(totals.unpaid)}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${filter === f.key ? 'bg-brand-dark text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3">Faktura</th>
              <th className="text-left px-5 py-3">Kunde</th>
              <th className="text-left px-5 py-3">Fakturadato</th>
              <th className="text-left px-5 py-3">Forfall</th>
              <th className="text-right px-5 py-3">Beløp</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => {
              const due = dueDate(inv.invoiceDate)
              const overdue = inv.paymentStatus === 0 && due && due < new Date()
              return (
                <tr key={inv.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-5 py-3 font-mono text-xs font-semibold text-brand-dark whitespace-nowrap">{inv.invoiceNumber}</td>
                  <td className="px-5 py-3">
                    <p className="font-semibold text-brand-dark">{inv.orgName || inv.contactName}</p>
                    <Link to={`/admin/bookings?ref=${inv.reference}`} className="text-xs text-gray-400 hover:text-brand-blue">#{inv.reference}</Link>
                  </td>
                  <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{fmtDate(inv.invoiceDate)}</td>
                  <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{fmtDate(due)}</td>
                  <td className="px-5 py-3 text-right font-bold text-brand-dark whitespace-nowrap">{fmtKr(inv.estimatedTotal)}</td>
                  <td className="px-5 py-3">
                    {inv.paymentStatus === 1 ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700 whitespace-nowrap">
                        <CheckCircle2 size={12} /> Betalt
                      </span>
                    ) : overdue ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-600 whitespace-nowrap">
                        <AlertTriangle size={12} /> Forfalt
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 whitespace-nowrap">
                        <Circle size={12} /> Ubetalt
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    <button onClick={() => togglePaid(inv)} disabled={updating === inv.id}
                      className="text-xs font-semibold text-brand-blue hover:underline disabled:opacity-40">
                      {inv.paymentStatus === 1 ? 'Merk ubetalt' : 'Merk betalt'}
                    </button>
                  </td>
                </tr>
              )
            })}
            {!loading && invoices.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-400 text-sm">Ingen fakturaer ennå.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
