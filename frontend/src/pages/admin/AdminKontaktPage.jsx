import { useState, useEffect } from 'react'
import { Mail, Phone, Clock, Trash2, Send, RefreshCw, CheckCheck, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'
import { api } from '../../services/api'
import { useConfirm } from '../../hooks/useConfirm'

const STATUS_LABEL = { 0: 'Ny', 1: 'Lest', 2: 'Besvart' }
const STATUS_COLOR = {
  0: 'bg-blue-100 text-blue-700',
  1: 'bg-gray-100 text-gray-600',
  2: 'bg-green-100 text-green-700',
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'Akkurat nå'
  if (diff < 3600) return `${Math.floor(diff / 60)} min siden`
  if (diff < 86400) return `${Math.floor(diff / 3600)} t siden`
  if (diff < 604800) return `${Math.floor(diff / 86400)} d siden`
  return new Date(dateStr).toLocaleDateString('nb-NO', { day: '2-digit', month: 'short', year: 'numeric' })
}

function MessageCard({ msg, onUpdated, onDeleted, askConfirm }) {
  const [expanded, setExpanded] = useState(false)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Mark as read when expanded
  const toggle = async () => {
    if (!expanded && msg.status === 0) {
      const updated = await api.markContactRead(msg.id).catch(() => null)
      if (updated) onUpdated(updated)
    }
    setExpanded(e => !e)
  }

  const sendReply = async () => {
    if (!reply.trim()) return
    setSending(true)
    try {
      const updated = await api.replyContact(msg.id, reply)
      onUpdated(updated)
      setReply('')
      setExpanded(false)
    } finally { setSending(false) }
  }

  const del = async () => {
    if (!await askConfirm({ title: 'Slett melding', message: 'Er du sikker på at du vil slette denne meldingen? Dette kan ikke angres.' })) return
    setDeleting(true)
    try { await api.deleteContact(msg.id); onDeleted(msg.id) }
    finally { setDeleting(false) }
  }

  return (
    <div className={`bg-white border-2 rounded-2xl transition-all ${msg.status === 0 ? 'border-brand-blue/30' : 'border-gray-200'}`}>
      {/* Header row */}
      <div className="flex items-start gap-4 p-5 cursor-pointer" onClick={toggle}>
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-brand-blue/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-brand-blue font-black text-sm">
            {msg.name.charAt(0).toUpperCase()}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-bold text-brand-dark text-sm">{msg.name}</span>
            {msg.status === 0 && (
              <span className="w-2 h-2 rounded-full bg-brand-blue flex-shrink-0" title="Ny" />
            )}
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[msg.status]}`}>
              {STATUS_LABEL[msg.status]}
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-1">
            <span className="font-medium text-gray-700">{msg.subject}</span>
          </p>
          {!expanded && (
            <p className="text-xs text-gray-400 line-clamp-1">{msg.message}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className="text-xs text-gray-400">{timeAgo(msg.createdAt)}</span>
          <div className="flex items-center gap-1">
            <button onClick={e => { e.stopPropagation(); del() }} disabled={deleting}
              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors">
              <Trash2 size={13} />
            </button>
            {expanded ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
          </div>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 pb-5 pt-4 space-y-5">
          {/* Contact info */}
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><Mail size={12} /> {msg.email}</span>
            {msg.phone && <span className="flex items-center gap-1.5"><Phone size={12} /> {msg.phone}</span>}
            <span className="flex items-center gap-1.5"><Clock size={12} />
              {new Date(msg.createdAt).toLocaleString('nb-NO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Message body */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{msg.message}</p>
          </div>

          {/* Previous reply */}
          {msg.status === 2 && msg.adminReply && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCheck size={14} className="text-green-600" />
                <span className="text-xs font-semibold text-green-700">
                  Besvart {msg.repliedAt ? new Date(msg.repliedAt).toLocaleString('nb-NO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
              <p className="text-sm text-green-800 whitespace-pre-wrap leading-relaxed">{msg.adminReply}</p>
            </div>
          )}

          {/* Reply box */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-brand-dark">
                {msg.status === 2 ? 'Send nytt svar' : `Svar til ${msg.name}`}
              </label>
              <span className="text-xs text-gray-400">Maler:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'Standard', text: `Hei ${msg.name},\n\nTakk for din henvendelse. Vi har mottatt forespørselen din og vil komme tilbake til deg så snart som mulig.\n\nMed vennlig hilsen\nKjosavik Reiser AS` },
                { label: 'Pris sendt', text: `Hei ${msg.name},\n\nTakk for din henvendelse. Vedlagt finner du et prisoverslag basert på opplysningene du har gitt oss.\n\nTa gjerne kontakt om du har spørsmål eller ønsker å justere bestillingen.\n\nMed vennlig hilsen\nKjosavik Reiser AS` },
                { label: 'Ikke ledig', text: `Hei ${msg.name},\n\nTakk for din forespørsel. Dessverre er vi ikke tilgjengelig på den aktuelle datoen. Vi beklager dette.\n\nHar du fleksibilitet på dato, hører vi gjerne fra deg igjen.\n\nMed vennlig hilsen\nKjosavik Reiser AS` },
                { label: 'Ring oss', text: `Hei ${msg.name},\n\nTakk for din henvendelse. For å gi deg et mer nøyaktig tilbud, vil vi gjerne ta en kort prat på telefon.\n\nDu kan nå oss på 95 45 38 07 på hverdager mellom kl. 08:00–16:00.\n\nMed vennlig hilsen\nKjosavik Reiser AS` },
              ].map(t => (
                <button key={t.label} type="button"
                  onClick={() => setReply(t.text)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-gray-100 hover:bg-brand-blue hover:text-white text-gray-600 transition-colors font-medium">
                  {t.label}
                </button>
              ))}
            </div>
            <textarea
              value={reply}
              onChange={e => setReply(e.target.value)}
              rows={5}
              placeholder={`Hei ${msg.name},\n\nTakk for din henvendelse…`}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 resize-none"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">Svaret sendes til {msg.email}</p>
              <button onClick={sendReply} disabled={sending || !reply.trim()}
                className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-semibold px-5 py-2.5 rounded-full text-sm disabled:opacity-50 transition-colors">
                <Send size={13} /> {sending ? 'Sender…' : 'Send svar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminKontaktPage() {
  const [confirmModal, askConfirm] = useConfirm()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all') // all | new | replied

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const data = await api.getContacts()
      setItems(data.items ?? [])
    } catch { setError('Kunne ikke laste meldinger — er API-et i gang?') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = items.filter(m => {
    if (filter === 'new') return m.status === 0
    if (filter === 'replied') return m.status === 2
    return true
  })

  const newCount = items.filter(m => m.status === 0).length

  if (loading) return (
    <div className="flex items-center gap-2 text-gray-400 text-sm">
      <RefreshCw size={14} className="animate-spin" /> Laster meldinger…
    </div>
  )

  if (error) return (
    <div className="max-w-xl">
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-3">
        <p className="text-red-600 font-semibold">{error}</p>
        <button onClick={load} className="flex items-center gap-2 mx-auto text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
          <RefreshCw size={14} /> Prøv igjen
        </button>
      </div>
    </div>
  )

  return (
    <div className="max-w-3xl">
      {confirmModal}
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-400">{items.length} meldinger totalt</p>
          {newCount > 0 && (
            <span className="bg-brand-blue text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
              {newCount} nye
            </span>
          )}
        </div>
        <button onClick={load} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Oppdater">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit mb-6">
        {[
          { id: 'all', label: 'Alle', count: items.length },
          { id: 'new', label: 'Nye', count: newCount },
          { id: 'replied', label: 'Besvart', count: items.filter(m => m.status === 2).length },
        ].map(t => (
          <button key={t.id} onClick={() => setFilter(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all
              ${filter === t.id ? 'bg-white text-brand-dark shadow-sm' : 'text-gray-500 hover:text-brand-dark'}`}>
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${filter === t.id ? 'bg-brand-blue/10 text-brand-blue' : 'bg-gray-200 text-gray-500'}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Message list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
          <MessageSquare size={32} className="text-gray-200 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-gray-400 text-sm">Ingen meldinger her ennå.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(msg => (
            <MessageCard key={msg.id} msg={msg} askConfirm={askConfirm}
              onUpdated={u => setItems(prev => prev.map(x => x.id === u.id ? u : x))}
              onDeleted={id => setItems(prev => prev.filter(x => x.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  )
}
