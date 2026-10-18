import { useEffect, useState } from 'react'
import { X, AlertTriangle, CheckCircle2, Loader2, SendHorizontal } from 'lucide-react'
import { api } from '../../services/api'
import { useClosingTransition } from '../../hooks/useClosingTransition'
import { PriceBreakdown, ActivityLog } from './BookingDetailParts'

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('nb-NO') : '–'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function Field({ label, children }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <div className="text-sm text-brand-dark mt-0.5 break-words">{children}</div>
    </div>
  )
}

export default function InvoicePreviewModal({ inv, onClose, onSent }) {
  const { closing, close } = useClosingTransition()
  const [booking, setBooking] = useState(null)
  const [confirming, setConfirming] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let stale = false
    api.getBooking(inv.id).then(b => { if (!stale) setBooking(b) }).catch(() => { if (!stale) setError('Kunne ikke hente fakturadetaljer.') })
    return () => { stale = true }
  }, [inv.id])

  const isDraft = inv.invoiceStatus === 'draft'
  const emailOk = EMAIL_RE.test(inv.contactEmail || '')
  const warnings = []
  if (!emailOk) warnings.push('Kunden mangler en gyldig e-postadresse — fakturaen kan ikke sendes.')
  if (!inv.fikenConfigured) warnings.push('Fiken er ikke konfigurert — fakturaen kan ikke sendes.')
  if (inv.tripStatus !== 'completed') warnings.push('Turen er ikke markert som fullført ennå.')
  const blocked = !emailOk || !inv.fikenConfigured

  const send = async () => {
    setSending(true)
    setError(null)
    try {
      await api.sendInvoice(inv.id)
      setRefreshKey(k => k + 1)
      onSent()
      close(onClose)
    } catch (e) {
      setError(e?.message || 'Kunne ikke sende faktura.')
      setConfirming(false)
    }
    setSending(false)
  }

  const fikenStatus = inv.invoiceStatus === 'sent'
    ? { text: `Sendt via Fiken${inv.invoiceSentAt ? ` ${fmtDate(inv.invoiceSentAt)}` : ''}`, ok: true }
    : inv.fikenInvoiceId
      ? { text: 'Kladd opprettet i Fiken — ikke sendt', ok: false }
      : { text: inv.fikenConfigured ? 'Ikke sendt til Fiken ennå' : 'Fiken er ikke konfigurert', ok: false }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 transition-opacity duration-150 motion-reduce:transition-none ${closing ? 'opacity-0' : 'opacity-100'}`}
      onClick={e => e.target === e.currentTarget && !sending && close(onClose)}>
      <div className={`bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col duration-150 motion-reduce:animate-none ${closing ? 'animate-out fade-out zoom-out-95' : 'animate-in fade-in zoom-in-95'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-brand-dark">Faktura {inv.invoiceNumber}</h2>
            <p className="text-xs text-gray-400 mt-0.5">#{inv.reference} · {isDraft ? 'Forhåndsvisning før sending' : 'Fakturadetaljer'}</p>
          </div>
          <button onClick={() => close(onClose)} className="text-gray-400 hover:text-gray-600" aria-label="Lukk"><X size={18} /></button>
        </div>

        <div className="px-6 py-5 space-y-5 overflow-y-auto">
          {isDraft && warnings.length > 0 && (
            <div role="alert" className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
              {warnings.map(w => (
                <p key={w} className="flex items-start gap-1.5 text-xs font-medium text-amber-800">
                  <AlertTriangle size={13} className="shrink-0 mt-0.5" /> {w}
                </p>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Kunde">{inv.orgName || inv.contactName}{inv.orgName && <span className="block text-xs text-gray-400">{inv.contactName}</span>}</Field>
            <Field label="Sendes til">
              <span className={emailOk ? '' : 'text-red-600 font-semibold'}>{inv.contactEmail || 'Mangler e-post'}</span>
            </Field>
            <Field label="Fakturadato">{fmtDate(inv.invoiceDate)}</Field>
            <Field label="Forfallsdato">{fmtDate(inv.dueDate)} <span className="text-xs text-gray-400">(14 dager)</span></Field>
            <Field label="Reise">{inv.fromAddress} → {inv.toAddress}<span className="block text-xs text-gray-400">{fmtDate(inv.departureDate)}</span></Field>
            <Field label="Fiken">
              <span className={`inline-flex items-center gap-1 ${fikenStatus.ok ? 'text-green-700' : 'text-gray-600'}`}>
                {fikenStatus.ok && <CheckCircle2 size={13} />} {fikenStatus.text}
              </span>
            </Field>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Fakturalinjer</p>
            {booking
              ? <PriceBreakdown booking={booking} total={booking.estimatedTotal} extraCharges={booking.extraCharges || []} />
              : <p className="text-sm text-gray-400">{error || 'Laster…'}</p>}
          </div>

          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Fakturahistorikk</p>
            {booking
              ? <ActivityLog booking={booking} refreshKey={refreshKey} types={['invoice', 'payment']} />
              : null}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100">
          {error && booking && <p className="text-xs text-red-600 mb-2">{error}</p>}
          {confirming ? (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
              <p className="text-sm text-indigo-900 font-semibold">Send faktura til {inv.contactEmail}?</p>
              <p className="text-xs text-indigo-700 mt-0.5">E-posten sendes umiddelbart via Fiken og kan ikke angres.</p>
              <div className="flex justify-end gap-3 mt-3">
                <button onClick={() => setConfirming(false)} disabled={sending} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Avbryt</button>
                <button onClick={send} disabled={sending}
                  className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.97] text-white text-sm font-bold rounded-full transition-[background-color,transform] motion-reduce:transition-none disabled:opacity-50">
                  {sending ? <Loader2 size={14} className="animate-spin" /> : <SendHorizontal size={14} />} Ja, send nå
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-end gap-3">
              <button onClick={() => close(onClose)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">{isDraft ? 'Avbryt' : 'Lukk'}</button>
              {isDraft && (
                <button onClick={() => setConfirming(true)} disabled={blocked || !booking}
                  className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.97] text-white text-sm font-bold rounded-full transition-[background-color,transform] motion-reduce:transition-none disabled:opacity-40">
                  <SendHorizontal size={14} /> Send faktura…
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
