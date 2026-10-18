import { useState, useEffect, useMemo } from 'react'
import { Plus, Trash2, Save, Star, ToggleLeft, ToggleRight, ChevronUp, Pencil, RefreshCw, Search } from 'lucide-react'
import { api } from '../../services/api'
import { useConfirm } from '../../hooks/useConfirm'

const AVATAR_COLORS = ['#4F46E5','#0891B2','#059669','#DC2626','#D97706','#7C3AED','#DB2777']

function StarRating({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n)}>
          <Star size={18} className={n <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
        </button>
      ))}
    </div>
  )
}

function TestimonialRow({ t, onSaved, onDeleted, askConfirm }) {
  const [draft, setDraft] = useState({ ...t })
  const [expanded, setExpanded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const set = (k, v) => { setDraft(d => ({ ...d, [k]: v })); setDirty(true) }

  const save = async () => {
    setSaving(true)
    try {
      const updated = await api.updateTestimonial(t.id, draft)
      onSaved(updated)
      setDirty(false)
      setExpanded(false)
    } finally { setSaving(false) }
  }

  const toggleActive = async () => {
    const next = { ...draft, active: !draft.active }
    setDraft(next)
    await api.updateTestimonial(t.id, next)
    onSaved(next)
  }

  const del = async () => {
    if (!await askConfirm({ title: 'Slett anmeldelse', message: `Er du sikker på at du vil slette anmeldelsen fra «${t.name}»?` })) return
    await api.deleteTestimonial(t.id)
    onDeleted(t.id)
  }

  const initials = draft.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className={`bg-white border-2 rounded-2xl transition-colors ${draft.active ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
      {/* Compact row */}
      <div className="flex items-center gap-4 p-4">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          style={{ backgroundColor: draft.avatarColor }}>
          {initials || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-brand-dark text-sm truncate">{draft.name}</p>
          <div className="flex items-center gap-2">
            <div className="flex">{[1,2,3,4,5].map(n => <Star key={n} size={11} className={n <= draft.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />)}</div>
            <span className="text-xs text-gray-400">{draft.source}</span>
          </div>
        </div>
        <button onClick={toggleActive} className={`flex-shrink-0 transition-colors ${draft.active ? 'text-green-500 hover:text-green-700' : 'text-gray-300 hover:text-gray-500'}`}>
          {draft.active ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
        </button>
        <button onClick={() => setExpanded(e => !e)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
          {expanded ? <ChevronUp size={16} /> : <Pencil size={15} />}
        </button>
        <button onClick={del} className="p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors flex-shrink-0">
          <Trash2 size={16} />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-brand-dark mb-1">Navn</label>
              <input value={draft.name} onChange={e => set('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-dark mb-1">Kilde</label>
              <select value={draft.source} onChange={e => set('source', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30">
                <option>Google</option>
                <option>Facebook</option>
                <option>Manuell</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-dark mb-1">Vurdering</label>
            <StarRating value={draft.rating} onChange={v => set('rating', v)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-dark mb-1">Avatarfarge</label>
            <div className="flex gap-2">
              {AVATAR_COLORS.map(c => (
                <button key={c} type="button" onClick={() => set('avatarColor', c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform motion-reduce:transition-none ${draft.avatarColor === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-dark mb-1">Anmeldelse</label>
            <textarea value={draft.text} onChange={e => set('text', e.target.value)} rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 resize-none" />
          </div>
          {dirty && (
            <div className="flex justify-end">
              <button onClick={save} disabled={saving}
                className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-50">
                <Save size={14} /> {saving ? 'Lagrer…' : 'Lagre'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function NewForm({ onCreated, onCancel }) {
  const [draft, setDraft] = useState({ name: '', avatarColor: AVATAR_COLORS[0], avatarImageUrl: '', rating: 5, text: '', source: 'Google', sortOrder: 0, active: true })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }))

  const save = async () => {
    if (!draft.name.trim() || !draft.text.trim()) return
    setSaving(true)
    try { onCreated(await api.createTestimonial(draft)) } finally { setSaving(false) }
  }

  const initials = draft.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-5 space-y-3">
      <p className="text-sm font-bold text-green-800">Ny anmeldelse</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-brand-dark mb-1">Navn *</label>
          <input value={draft.name} onChange={e => set('name', e.target.value)} autoFocus placeholder="Kari Nordmann"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-brand-dark mb-1">Kilde</label>
          <select value={draft.source} onChange={e => set('source', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30">
            <option>Google</option>
            <option>Facebook</option>
            <option>Manuell</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-brand-dark mb-1">Vurdering</label>
        <StarRating value={draft.rating} onChange={v => set('rating', v)} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-brand-dark mb-1">Avatarfarge</label>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            {AVATAR_COLORS.map(c => (
              <button key={c} type="button" onClick={() => set('avatarColor', c)}
                className={`w-7 h-7 rounded-full border-2 ${draft.avatarColor === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: draft.avatarColor }}>{initials || '?'}</div>
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-brand-dark mb-1">Anmeldelse *</label>
        <textarea value={draft.text} onChange={e => set('text', e.target.value)} rows={4}
          placeholder="Skriv inn anmeldelsesteksten…"
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 resize-none" />
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50">Avbryt</button>
        <button onClick={save} disabled={saving || !draft.name.trim() || !draft.text.trim()}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-xl text-sm disabled:opacity-50">
          <Plus size={14} /> {saving ? 'Lagrer…' : 'Legg til'}
        </button>
      </div>
    </div>
  )
}

export default function AdminTestimonialsPage() {
  const [confirmModal, askConfirm] = useConfirm()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true); setError(null)
    try { setItems(await api.getTestimonials()) }
    catch { setError('Kunne ikke laste anmeldelser — er API-et i gang?') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const visibleItems = useMemo(() => {
    if (!search.trim()) return items
    const q = search.toLowerCase()
    return items.filter(t => t.name?.toLowerCase().includes(q) || t.text?.toLowerCase().includes(q))
  }, [items, search])

  if (loading) return <div className="text-gray-400 text-sm">Laster anmeldelser…</div>
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
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-400">{items.filter(t => t.active).length} aktive anmeldelser</p>
        <button onClick={() => setShowNew(true)} disabled={showNew}
          className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-semibold px-4 py-2.5 rounded-full text-sm transition-colors disabled:opacity-40">
          <Plus size={15} /> Legg til anmeldelse
        </button>
      </div>
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Søk på navn eller anmeldelsestekst…"
          className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
      </div>

      <div className="space-y-3">
        {showNew && (
          <NewForm
            onCreated={t => { setItems(prev => [...prev, t]); setShowNew(false) }}
            onCancel={() => setShowNew(false)}
          />
        )}
        {items.length === 0 && !showNew && (
          <div className="text-center py-12 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-2xl">
            Ingen anmeldelser ennå.<br />Klikk «Legg til anmeldelse» for å starte.
          </div>
        )}
        {visibleItems.map(t => (
          <TestimonialRow key={t.id} t={t}
            onSaved={u => setItems(prev => prev.map(x => x.id === u.id ? u : x))}
            onDeleted={id => setItems(prev => prev.filter(x => x.id !== id))}
            askConfirm={askConfirm}
          />
        ))}
      </div>
    </div>
  )
}
