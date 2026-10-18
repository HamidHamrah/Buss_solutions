import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Circle, AlertTriangle, Download, Loader2, SendHorizontal, FileText, Bus, Route, Eye } from 'lucide-react'
import { api } from '../../services/api'
import { useConfig } from '../../contexts/ConfigContext'
import { printInvoice } from '../../utils/printInvoice'
import { useConfirm } from '../../hooks/useConfirm'
import { useToast } from '../../contexts/ToastContext'
import { SkeletonTable } from '../../components/Skeleton'
import InvoicePreviewModal from '../../components/admin/InvoicePreviewModal'

const fmtKr = (n) => (n ?? 0).toLocaleString('nb-NO') + ' kr'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('nb-NO') : '–'

const FILTERS = [
  { key: 'all', label: 'Alle', test: () => true },
  { key: 'ready', label: 'Klar til fakturering', test: i => i.readyToInvoice, accent: 'text-blue-600' },
  { key: 'draft', label: 'Kladd', test: i => i.invoiceStatus === 'draft' },
  { key: 'sent', label: 'Sendt', test: i => i.invoiceStatus === 'sent' },
  { key: 'unpaid', label: 'Ubetalt', test: i => i.invoiceStatus === 'sent' && i.paymentStatus === 0 },
  { key: 'overdue', label: 'Forfalt', test: i => i.overdue, accent: 'text-red-600' },
  { key: 'paid', label: 'Betalt', test: i => i.paymentStatus === 1 },
  { key: 'none', label: 'Ikke fakturert', test: i => i.invoiceStatus === 'none' },
]

const TRIP_STATUS = {
  unplanned: { label: 'Ikke planlagt', dot: 'bg-gray-300', text: 'text-gray-500', bg: 'bg-gray-100' },
  planning: { label: 'Under planlegging', dot: 'bg-amber-400', text: 'text-amber-700', bg: 'bg-amber-50' },
  planned: { label: 'Planlagt', dot: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50' },
  in_progress: { label: 'Pågår', dot: 'bg-indigo-500', text: 'text-indigo-700', bg: 'bg-indigo-50' },
  completed: { label: 'Fullført', dot: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50' },
}

const INVOICE_STATUS = {
  none: { label: 'Ikke generert', text: 'text-gray-500', bg: 'bg-gray-100' },
  draft: { label: 'Kladd', text: 'text-amber-700', bg: 'bg-amber-50' },
  sent: { label: 'Sendt', text: 'text-green-700', bg: 'bg-green-50' },
}

export default function AdminInvoicesPage() {
  const { config } = useConfig()
  const bankAccountNumber = config?.bankAccountNumber || config?.content?.bankAccountNumber || 'Ikke konfigurert'
  const company = {
    name: config?.content?.companyName || '',
    address: config?.content?.address || '',
    orgNr: config?.content?.orgNr || '',
    email: config?.content?.email || '',
    phone: config?.content?.phone || '',
  }
  const [confirmModal, askConfirm] = useConfirm()
  const toast = useToast()
  const [flashId, setFlashId] = useState(null)
  const flash = (id) => { setFlashId(id); setTimeout(() => setFlashId(null), 900) }
  const [preview, setPreview] = useState(null)
  const [all, setAll] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [updating, setUpdating] = useState(null)
  const [downloading, setDownloading] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)
  const [actionError, setActionError] = useState(null)

  const load = () => {
    setLoading(true)
    api.getInvoices()
      .then(setAll)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const activeFilter = FILTERS.find(f => f.key === filter) ?? FILTERS[0]
  const invoices = all.filter(activeFilter.test)

  const togglePaid = async (inv) => {
    const markingPaid = inv.paymentStatus !== 1
    if (!await askConfirm({
      title: markingPaid ? 'Merk som betalt' : 'Tilbakestill betaling',
      message: markingPaid
        ? `Marker faktura ${inv.invoiceNumber} (${fmtKr(inv.estimatedTotal)}) som betalt?`
        : `Tilbakestill betalingen på faktura ${inv.invoiceNumber} til ubetalt?`,
      confirmLabel: markingPaid ? 'Merk betalt' : 'Merk ubetalt', danger: !markingPaid,
    })) return
    setUpdating(inv.id)
    try {
      await api.updatePaymentStatus(inv.id, inv.paymentStatus === 1 ? 0 : 1)
      load()
      flash(inv.id)
      toast.success(markingPaid ? `Faktura ${inv.invoiceNumber} markert som betalt` : 'Betaling tilbakestilt')
    } catch (e) { toast.error(e?.message || 'Kunne ikke oppdatere betaling.') }
    setUpdating(null)
  }

  const downloadInvoice = async (inv) => {
    setDownloading(inv.id)
    try {
      const booking = await api.getBooking(inv.id)
      printInvoice(booking, inv.invoiceNumber, inv.invoiceDate, bankAccountNumber, company)
    } catch {}
    setDownloading(null)
  }

  const generateInvoice = async (inv) => {
    setActionLoading(inv.id)
    setActionError(null)
    try {
      await api.generateInvoice(inv.id)
      load()
      flash(inv.id)
      toast.success('Faktura opprettet')
    } catch (e) {
      setActionError({ id: inv.id, message: e?.message || 'Kunne ikke generere faktura.' })
    }
    setActionLoading(null)
  }

  const invoiced = all.filter(inv => inv.invoiceStatus !== 'none')
  const totals = invoiced.reduce((acc, inv) => {
    acc.total += inv.estimatedTotal
    if (inv.paymentStatus === 1) acc.paid += inv.estimatedTotal
    else if (inv.invoiceStatus === 'sent') acc.unpaid += inv.estimatedTotal
    return acc
  }, { total: 0, paid: 0, unpaid: 0 })

  return (
    <div>
      {confirmModal}
      {all.find(i => i.id === preview) && (
        <InvoicePreviewModal inv={all.find(i => i.id === preview)} onClose={() => setPreview(null)} onSent={() => { load(); flash(preview); toast.success('Faktura sendt til kunden') }} />
      )}
      <h1 className="text-xl font-bold text-brand-dark mb-1">Fakturaer</h1>
      <p className="text-sm text-gray-400 mb-6">Planlegging, fakturastatus og betaling — samlet oversikt.</p>

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

      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${filter === f.key ? 'bg-brand-dark text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}>
            {f.label}
            {f.key !== 'all' && (() => {
              const n = all.filter(f.test).length
              return n > 0 ? <span className={`ml-1.5 text-xs font-bold ${filter === f.key ? 'text-white/70' : f.accent || 'text-gray-400'}`}>{n}</span> : null
            })()}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[1000px]">
          <thead className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3">Kunde</th>
              <th className="text-left px-5 py-3">Avreise</th>
              <th className="text-left px-5 py-3">Planlegging</th>
              <th className="text-right px-5 py-3">Beløp</th>
              <th className="text-left px-5 py-3">Faktura</th>
              <th className="text-left px-5 py-3">Betaling</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => {
              const overdue = inv.overdue
              const trip = TRIP_STATUS[inv.tripStatus] ?? TRIP_STATUS.unplanned
              const inv_ = INVOICE_STATUS[inv.invoiceStatus] ?? INVOICE_STATUS.none
              const busy = actionLoading === inv.id
              return (
                <tr key={inv.id} className={`border-t border-gray-100 hover:bg-gray-50 align-top ${flashId === inv.id ? 'status-flash' : ''}`}>
                  <td className="px-5 py-3">
                    <p className="font-semibold text-brand-dark">{inv.orgName || inv.contactName}</p>
                    <Link to={`/admin/bookings?ref=${inv.reference}`} className="text-xs font-mono text-gray-400 hover:text-brand-blue">#{inv.reference}</Link>
                    {inv.invoiceNumber && <p className="text-xs text-gray-400 mt-0.5">Faktura {inv.invoiceNumber}</p>}
                  </td>
                  <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{fmtDate(inv.departureDate)}</td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${trip.bg} ${trip.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${trip.dot}`} /> {trip.label}
                    </span>
                    {inv.busCount > 1 && (
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Bus size={11} /> {inv.busesPlanned}/{inv.busCount} busser</p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-brand-dark whitespace-nowrap">{fmtKr(inv.estimatedTotal)}</td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${inv_.bg} ${inv_.text}`}>{inv_.label}</span>
                    {inv.invoiceSentAt && <p className="text-xs text-gray-400 mt-1">{fmtDate(inv.invoiceSentAt)}</p>}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    {inv.invoiceStatus !== 'sent' ? (
                      <span className="text-gray-300 text-xs">—</span>
                    ) : inv.paymentStatus === 1 ? (
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
                    <div className="flex flex-col items-end gap-1.5">
                      <div className="flex items-center justify-end gap-3">
                        {inv.invoiceStatus === 'none' && (
                          <button onClick={() => generateInvoice(inv)} disabled={busy}
                            className="flex items-center gap-1.5 text-xs font-semibold text-brand-blue hover:underline active:opacity-60 transition-opacity motion-reduce:transition-none disabled:opacity-40">
                            {busy ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
                            Generer faktura
                          </button>
                        )}
                        {inv.invoiceStatus !== 'none' && (
                          <button onClick={() => downloadInvoice(inv)} disabled={downloading === inv.id}
                            className="flex items-center gap-1.5 text-xs font-semibold text-brand-blue hover:underline active:opacity-60 transition-opacity motion-reduce:transition-none disabled:opacity-40">
                            {downloading === inv.id ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                            Last ned
                          </button>
                        )}
                        {inv.invoiceStatus === 'draft' && (
                          <button onClick={() => setPreview(inv.id)}
                            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.97] px-2.5 py-1 rounded-full transition-[background-color,transform] motion-reduce:transition-none">
                            <SendHorizontal size={12} /> Forhåndsvis og send
                          </button>
                        )}
                        {inv.invoiceStatus === 'sent' && (
                          <button onClick={() => setPreview(inv.id)}
                            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-brand-blue active:opacity-60 transition-colors motion-reduce:transition-none">
                            <Eye size={12} /> Detaljer
                          </button>
                        )}
                        {inv.invoiceStatus === 'sent' && (
                          <button onClick={() => togglePaid(inv)} disabled={updating === inv.id}
                            className="text-xs font-semibold text-brand-blue hover:underline active:opacity-60 transition-opacity motion-reduce:transition-none disabled:opacity-40">
                            {inv.paymentStatus === 1 ? 'Merk ubetalt' : 'Merk betalt'}
                          </button>
                        )}
                      </div>
                      {inv.invoiceStatus === 'draft' && (
                        <Link to={`/admin/bookings?ref=${inv.reference}`} className="text-xs text-gray-400 hover:text-brand-blue flex items-center gap-1">
                          <Route size={11} /> Rediger pris/kostnader
                        </Link>
                      )}
                      {actionError?.id === inv.id && <p className="text-xs text-red-600 max-w-[200px]">{actionError.message}</p>}
                    </div>
                  </td>
                </tr>
              )
            })}
            {loading && all.length === 0 && <SkeletonTable rows={6} cols={7} />}
            {!loading && invoices.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-400 text-sm">{all.length ? 'Ingen fakturaer i dette filteret.' : 'Ingen bestillinger funnet.'}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

