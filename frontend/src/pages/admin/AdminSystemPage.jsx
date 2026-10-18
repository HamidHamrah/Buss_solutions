import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, CheckCircle2, AlertTriangle, XCircle, RotateCcw } from 'lucide-react'
import { api } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import { SkeletonRows } from '../../components/Skeleton'

const STATUS_STYLE = {
  ok: { icon: CheckCircle2, cls: 'text-green-600 bg-green-50 border-green-200', label: 'OK' },
  degraded: { icon: AlertTriangle, cls: 'text-amber-600 bg-amber-50 border-amber-200', label: 'Trenger oppmerksomhet' },
  unhealthy: { icon: XCircle, cls: 'text-red-600 bg-red-50 border-red-200', label: 'Feil' },
}

const CHECK_LABELS = { database: 'Database', email: 'E-post (SMTP)', fiken: 'Fiken', emailQueue: 'E-postkø' }
const EMAIL_LABELS = { Pending: 'Venter', Sent: 'Sendt', Failed: 'Mislyktes' }
const EMAIL_CLS = { Pending: 'bg-amber-50 text-amber-700', Sent: 'bg-green-50 text-green-700', Failed: 'bg-red-50 text-red-700' }

const fmt = (d) => d ? new Date(d.endsWith('Z') ? d : `${d}Z`).toLocaleString('nb-NO', { dateStyle: 'short', timeStyle: 'short' }) : '–'

export default function AdminSystemPage() {
  const toast = useToast()
  const [status, setStatus] = useState(null)
  const [emails, setEmails] = useState(null)
  const [audit, setAudit] = useState(null)
  const [tab, setTab] = useState('emails')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s, e, a] = await Promise.all([api.getSystemStatus(), api.getSystemEmails(), api.getAuditLog(150)])
      setStatus(s); setEmails(e); setAudit(a)
    } catch {
      toast.error('Kunne ikke hente systemstatus')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { load() }, [load])

  const retry = async (id) => {
    try {
      await api.retrySystemEmail(id)
      toast.success('E-posten legges i køen på nytt')
      load()
    } catch {
      toast.error('Kunne ikke prøve på nytt')
    }
  }

  const overall = STATUS_STYLE[status?.status] ?? STATUS_STYLE.ok

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">System</h1>
          <p className="text-sm text-gray-500">Status, e-postkø og endringslogg</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Oppdater
        </button>
      </div>

      {!status ? <SkeletonRows rows={3} /> : (
        <div className="space-y-3">
          <div className={`flex items-center gap-2 px-4 py-3 border rounded-2xl text-sm font-semibold ${overall.cls}`}>
            <overall.icon size={18} /> {overall.label}
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {status.checks.map(c => {
              const st = STATUS_STYLE[c.status] ?? STATUS_STYLE.ok
              return (
                <div key={c.name} className="bg-white border border-gray-200 rounded-2xl px-4 py-3 flex items-start gap-3">
                  <st.icon size={18} className={`mt-0.5 flex-shrink-0 ${st.cls.split(' ')[0]}`} />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{CHECK_LABELS[c.name] ?? c.name}</p>
                    <p className="text-xs text-gray-500">{c.detail}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex gap-1 border-b border-gray-200">
        {[['emails', 'E-postkø'], ['audit', 'Endringslogg']].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 ${tab === k ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'emails' && (emails === null ? <SkeletonRows rows={4} /> : emails.length === 0 ? (
        <p className="text-sm text-gray-500 py-6 text-center">Ingen e-poster i køen ennå.</p>
      ) : (
        <div className="space-y-2">
          {emails.map(e => (
            <div key={e.id} className="bg-white border border-gray-200 rounded-2xl px-4 py-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${EMAIL_CLS[e.status]}`}>{EMAIL_LABELS[e.status] ?? e.status}</span>
                  <span className="text-sm font-medium text-gray-900 truncate">{e.subject}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Til {e.toAddress} · {fmt(e.createdAt)}{e.attempts > 0 ? ` · ${e.attempts} forsøk` : ''}</p>
                {e.lastError && e.status !== 'Sent' && <p className="text-xs text-red-600 mt-1 break-words">{e.lastError}</p>}
              </div>
              {e.status !== 'Sent' && (
                <button onClick={() => retry(e.id)} className="flex items-center gap-1 text-xs font-medium text-brand-blue hover:underline flex-shrink-0">
                  <RotateCcw size={12} /> Prøv igjen
                </button>
              )}
            </div>
          ))}
        </div>
      ))}

      {tab === 'audit' && (audit === null ? <SkeletonRows rows={4} /> : audit.length === 0 ? (
        <p className="text-sm text-gray-500 py-6 text-center">Ingen endringer logget ennå.</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100">
          {audit.map(a => (
            <div key={a.id} className="px-4 py-2.5 text-sm flex flex-wrap gap-x-3 gap-y-0.5">
              <span className="text-xs text-gray-400 w-28 flex-shrink-0">{fmt(a.createdAt)}</span>
              <span className="font-medium text-gray-700 w-24 flex-shrink-0">{a.actor}</span>
              <span className="text-gray-600 flex-1 min-w-0 break-words">{a.summary}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
