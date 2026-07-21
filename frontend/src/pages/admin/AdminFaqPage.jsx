import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, Trash2, Save, ChevronUp, Pencil, ToggleLeft, ToggleRight, RefreshCw, GripVertical } from 'lucide-react'
import { api } from '../../services/api'
import { useConfirm } from '../../hooks/useConfirm'

const STATIC_DEFAULTS = [
  { question: 'Hva er inkludert i prisen når man leier buss med sjåfør?', answer: 'Prisen inkluderer sjåfør, drivstoff, bompenger og kjøretøyets forsikring. MVA på 12 % kommer i tillegg.' },
  { question: 'Er det dyrere å leie premiumbuss?', answer: 'Prisen avhenger av busstype, distanse og varighet — ikke utelukkende av bussens størrelse.' },
  { question: 'Får vi rabatt på leie av buss hvis vi bestiller flere turer?', answer: 'Ja, vi er åpne for å diskutere priser ved gjentakende oppdrag eller større kontrakter.' },
  { question: 'Hva er avbestillingsfristen, og hvilke kostnader påløper ved avbestilling?', answer: 'Avbestillingsbetingelsene avtales ved booking og varierer etter oppdragets størrelse og tidspunkt.' },
  { question: 'Gjelder prisen for turer utenfor Jæren-området?', answer: 'Ja, men tomkjøring utover 30 km fra Fosseikeland faktureres med kr 20 per km per vei.' },
  { question: 'Faktureres det nattillegg eller helgetillegg?', answer: 'Det beregnes 40 % tillegg på timeprisen for turer mellom kl. 21:00 og 06:00, samt på lørdager og søndager.' },
]

const inp = "w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30"

function FaqRow({ item, onSaved, onDeleted, askConfirm, dragHandlers }) {
  const [draft, setDraft] = useState({ ...item })
  const [expanded, setExpanded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const set = (k, v) => { setDraft(d => ({ ...d, [k]: v })); setDirty(true) }

  const save = async () => {
    setSaving(true)
    try {
      const updated = await api.updateFaq(item.id, { question: draft.question, answer: draft.answer, sortOrder: draft.sortOrder, active: draft.active })
      onSaved(updated); setDirty(false); setExpanded(false)
    } finally { setSaving(false) }
  }

  const toggleActive = async () => {
    const next = { ...draft, active: !draft.active }
    setDraft(next)
    await api.updateFaq(item.id, { question: next.question, answer: next.answer, sortOrder: next.sortOrder, active: next.active })
    onSaved(next)
  }

  const del = async () => {
    if (!await askConfirm({ title: 'Slett spørsmål', message: `Er du sikker på at du vil slette «${draft.question}»?` })) return
    await api.deleteFaq(item.id)
    onDeleted(item.id)
  }

  return (
    <div className={`bg-white border-2 rounded-2xl transition-colors ${draft.active ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
      <div className="flex items-start gap-3 p-4">
        <div {...dragHandlers} className="cursor-grab active:cursor-grabbing touch-none text-gray-300 hover:text-gray-400 flex-shrink-0 mt-1">
          <GripVertical size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-brand-dark text-sm leading-snug line-clamp-2">{draft.question}</p>
          {!expanded && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{draft.answer}</p>}
        </div>
        <button onClick={toggleActive} className={`flex-shrink-0 transition-colors mt-0.5 ${draft.active ? 'text-green-500' : 'text-gray-300'}`}>
          {draft.active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
        </button>
        <button onClick={() => setExpanded(e => !e)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 flex-shrink-0">
          {expanded ? <ChevronUp size={15} /> : <Pencil size={14} />}
        </button>
        <button onClick={del} className="p-2 rounded-lg hover:bg-red-50 text-red-400 flex-shrink-0">
          <Trash2 size={15} />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-brand-dark mb-1">Spørsmål</label>
            <input value={draft.question} onChange={e => set('question', e.target.value)} className={inp} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-dark mb-1">Svar</label>
            <textarea value={draft.answer} onChange={e => set('answer', e.target.value)} rows={4} className={inp + ' resize-none'} />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-28">
              <label className="block text-xs font-semibold text-brand-dark mb-1">Rekkefølge</label>
              <input type="number" value={draft.sortOrder} onChange={e => set('sortOrder', +e.target.value)} className={inp} />
            </div>
          </div>
          {dirty && (
            <div className="flex justify-end">
              <button onClick={save} disabled={saving}
                className="flex items-center gap-2 bg-brand-blue text-white font-semibold px-4 py-2 rounded-xl text-sm hover:bg-brand-blue-dark disabled:opacity-50 transition-colors">
                <Save size={13} /> {saving ? 'Lagrer…' : 'Lagre'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function NewForm({ onCreated, onCancel, sortOrder }) {
  const [draft, setDraft] = useState({ question: '', answer: '', sortOrder, active: true })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }))

  const save = async () => {
    if (!draft.question.trim() || !draft.answer.trim()) return
    setSaving(true)
    try { onCreated(await api.createFaq({ question: draft.question, answer: draft.answer, sortOrder: draft.sortOrder, active: draft.active })) }
    finally { setSaving(false) }
  }

  return (
    <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-5 space-y-3">
      <p className="text-sm font-bold text-green-800">Nytt spørsmål</p>
      <div>
        <label className="block text-xs font-semibold text-brand-dark mb-1">Spørsmål *</label>
        <input value={draft.question} onChange={e => set('question', e.target.value)} autoFocus
          placeholder="Hva er inkludert i prisen?" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-brand-dark mb-1">Svar *</label>
        <textarea value={draft.answer} onChange={e => set('answer', e.target.value)} rows={4}
          placeholder="Skriv svaret her…" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 resize-none" />
      </div>
      <div className="flex gap-3 justify-end">
        <button onClick={onCancel} className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50">Avbryt</button>
        <button onClick={save} disabled={saving || !draft.question.trim() || !draft.answer.trim()}
          className="flex items-center gap-2 bg-green-600 text-white font-semibold px-4 py-2 rounded-xl text-sm disabled:opacity-50 hover:bg-green-700 transition-colors">
          <Plus size={13} /> {saving ? 'Lagrer…' : 'Legg til'}
        </button>
      </div>
    </div>
  )
}

function ImportBanner({ onImported }) {
  const [importing, setImporting] = useState(false)
  const doImport = async () => {
    setImporting(true)
    try {
      const created = []
      for (let i = 0; i < STATIC_DEFAULTS.length; i++) {
        created.push(await api.createFaq({ ...STATIC_DEFAULTS[i], sortOrder: i, active: true }))
      }
      onImported(created)
    } finally { setImporting(false) }
  }
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-center justify-between gap-4">
      <div>
        <p className="font-semibold text-blue-800 text-sm">Ingen spørsmål lagt til ennå</p>
        <p className="text-xs text-blue-600 mt-1">Importer de 6 standard-spørsmålene for å komme i gang.</p>
      </div>
      <button onClick={doImport} disabled={importing}
        className="flex-shrink-0 flex items-center gap-2 bg-brand-blue text-white font-semibold px-4 py-2.5 rounded-xl text-sm disabled:opacity-50 hover:bg-brand-blue-dark transition-colors">
        {importing ? <RefreshCw size={13} className="animate-spin" /> : <Plus size={13} />}
        {importing ? 'Importerer…' : 'Importer standard'}
      </button>
    </div>
  )
}

export default function AdminFaqPage() {
  const [confirmModal, askConfirm] = useConfirm()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const dragItem = useRef(null)
  const dragOver = useRef(null)

  const load = async () => {
    setLoading(true); setError(null)
    try { setItems(await api.getFaqs()) }
    catch { setError('Kunne ikke laste spørsmål — er API-et i gang?') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleDrop = useCallback(async () => {
    const from = dragItem.current
    const to = dragOver.current
    if (from === null || to === null || from === to) return
    const reordered = [...items]
    const [moved] = reordered.splice(from, 1)
    reordered.splice(to, 0, moved)
    const updated = reordered.map((item, i) => ({ ...item, sortOrder: i }))
    setItems(updated)
    dragItem.current = null
    dragOver.current = null
    await Promise.all(updated.map(item =>
      api.updateFaq(item.id, { question: item.question, answer: item.answer, sortOrder: item.sortOrder, active: item.active })
    ))
  }, [items])

  const makeDragHandlers = useCallback((index) => ({
    draggable: true,
    onDragStart: () => { dragItem.current = index },
    onDragEnter: () => { dragOver.current = index },
    onDragEnd: handleDrop,
    onDragOver: (e) => e.preventDefault(),
  }), [handleDrop])

  if (loading) return <div className="text-gray-400 text-sm">Laster spørsmål…</div>
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
    <div className="max-w-2xl">
      {confirmModal}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-400">{items.filter(i => i.active).length} aktive spørsmål · vises på Priser-siden</p>
        <button onClick={() => setShowNew(true)} disabled={showNew}
          className="flex items-center gap-2 bg-brand-blue text-white font-semibold px-4 py-2.5 rounded-full text-sm hover:bg-brand-blue-dark disabled:opacity-40 transition-colors">
          <Plus size={14} /> Legg til spørsmål
        </button>
      </div>

      <div className="space-y-3">
        {showNew && (
          <NewForm
            sortOrder={items.length}
            onCreated={item => { setItems(prev => [...prev, item]); setShowNew(false) }}
            onCancel={() => setShowNew(false)}
          />
        )}

        {items.length === 0 && !showNew && (
          <ImportBanner onImported={imported => setItems(imported)} />
        )}

        {items.map((item, index) => (
          <FaqRow key={item.id} item={item} askConfirm={askConfirm}
            onSaved={u => setItems(prev => prev.map(x => x.id === u.id ? u : x))}
            onDeleted={id => setItems(prev => prev.filter(x => x.id !== id))}
            dragHandlers={makeDragHandlers(index)}
          />
        ))}
      </div>
    </div>
  )
}
