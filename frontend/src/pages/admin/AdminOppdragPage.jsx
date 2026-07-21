import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, Trash2, Save, ChevronUp, Pencil, ToggleLeft, ToggleRight, Upload, X, RefreshCw, GripVertical } from 'lucide-react'
import { api } from '../../services/api'
import { SERVICES } from '../../data/services'
import { useConfirm } from '../../hooks/useConfirm'

const GROUPS = [
  { value: 'transport', label: 'All slags transport' },
  { value: 'fritid',    label: 'Sport, fritid og anledninger' },
  { value: 'langtur',  label: 'Lengre turer og arrangementer' },
]

function slugify(str) {
  return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// ── Shared primitives ──────────────────────────────────────────────────────────

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-brand-dark mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-1">{hint}</p>}
      {children}
    </div>
  )
}

const inp = "w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30"

function ImageUploader({ value, onChange }) {
  const ref = useRef()
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState(null)

  const handle = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    setErr(null); setUploading(true)
    try { const { url } = await api.uploadFile(file); onChange(url) }
    catch { setErr('Opplasting feilet') }
    finally { setUploading(false); e.target.value = '' }
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative rounded-xl overflow-hidden h-28 border border-gray-200">
          <img src={value} alt="" className="w-full h-full object-cover" />
          <button onClick={() => onChange('')} className="absolute top-1.5 right-1.5 bg-white rounded-full p-1 shadow text-red-400 hover:bg-red-50">
            <X size={12} />
          </button>
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-gray-200 h-28 flex items-center justify-center text-gray-300 bg-gray-50">
          <Upload size={20} strokeWidth={1.5} />
        </div>
      )}
      <button type="button" onClick={() => ref.current?.click()} disabled={uploading}
        className="flex items-center gap-1.5 text-xs bg-brand-blue text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-brand-blue-dark disabled:opacity-50 transition-colors">
        <Upload size={11} /> {uploading ? 'Laster opp…' : value ? 'Bytt' : 'Last opp'}
      </button>
      {err && <p className="text-xs text-red-500">{err}</p>}
      <input ref={ref} type="file" accept="image/*" onChange={handle} className="hidden" />
    </div>
  )
}

// ── Service row ────────────────────────────────────────────────────────────────

function ServiceRow({ item, onSaved, onDeleted, askConfirm, dragHandlers }) {
  const [draft, setDraft] = useState({ ...item })
  const [expanded, setExpanded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const set = (k, v) => { setDraft(d => ({ ...d, [k]: v })); setDirty(true) }
  const setBody = (i, v) => { const b = [...(draft.body || [])]; b[i] = v; set('body', b) }
  const setHighlight = (i, v) => { const h = [...(draft.highlights || [])]; h[i] = v; set('highlights', h) }

  const save = async () => {
    setSaving(true)
    try {
      const updated = await api.updateServiceCategory(item.id, {
        ...draft,
        body: (draft.body || []).filter(Boolean),
        highlights: (draft.highlights || []).filter(Boolean),
      })
      onSaved(updated); setDirty(false); setExpanded(false)
    } finally { setSaving(false) }
  }

  const toggleActive = async () => {
    const next = { ...draft, active: !draft.active }
    setDraft(next)
    await api.updateServiceCategory(item.id, { ...next, body: next.body || [], highlights: next.highlights || [] })
    onSaved(next)
  }

  const del = async () => {
    if (!await askConfirm({ title: 'Slett oppdrag', message: `Er du sikker på at du vil slette «${item.title}»?` })) return
    await api.deleteServiceCategory(item.id)
    onDeleted(item.id)
  }

  const body = draft.body || ['', '', '']
  const highlights = draft.highlights || ['', '', '', '']

  return (
    <div className={`bg-white border-2 rounded-2xl transition-colors ${draft.active ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
      {/* Compact header */}
      <div className="flex items-center gap-3 p-4">
        <div {...dragHandlers} className="cursor-grab active:cursor-grabbing touch-none text-gray-300 hover:text-gray-400 flex-shrink-0">
          <GripVertical size={14} />
        </div>
        {draft.heroImage ? (
          <img src={draft.heroImage} alt="" className="w-12 h-9 rounded-lg object-cover flex-shrink-0" />
        ) : (
          <div className="w-12 h-9 rounded-lg bg-gray-100 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-brand-dark text-sm truncate">{draft.title}</p>
          <p className="text-xs text-gray-400 truncate">{draft.slug}</p>
        </div>
        <span className="hidden sm:block text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg flex-shrink-0">
          {GROUPS.find(g => g.value === draft.group)?.label || 'Ingen gruppe'}
        </span>
        <button onClick={toggleActive} className={`flex-shrink-0 transition-colors ${draft.active ? 'text-green-500' : 'text-gray-300'}`}>
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
        <div className="border-t border-gray-100 p-5 space-y-5">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tittel">
              <input value={draft.title} onChange={e => { set('title', e.target.value); if (!dirty) set('slug', slugify(e.target.value)) }}
                className={inp} />
            </Field>
            <Field label="Slug (URL)" hint="/turer/[slug]">
              <input value={draft.slug} onChange={e => set('slug', slugify(e.target.value))} className={inp} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Gruppe">
              <select value={draft.group} onChange={e => set('group', e.target.value)} className={inp}>
                <option value="">— Ingen gruppe —</option>
                {GROUPS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </Field>
            <Field label="Sorteringsrekkefølge">
              <input type="number" value={draft.sortOrder} onChange={e => set('sortOrder', +e.target.value)} className={inp} />
            </Field>
          </div>

          {/* Intro */}
          <Field label="Kort beskrivelse (kortkortet på listesiden)">
            <textarea value={draft.intro} onChange={e => set('intro', e.target.value)} rows={2} className={inp + ' resize-none'} />
          </Field>

          {/* Headline */}
          <Field label="Stor overskrift (detaljsiden)">
            <input value={draft.headline} onChange={e => set('headline', e.target.value)} className={inp} />
          </Field>

          {/* Body paragraphs */}
          <div>
            <label className="block text-xs font-semibold text-brand-dark mb-2">Brødtekst — avsnitt (maks 3)</label>
            <div className="space-y-2">
              {[0,1,2].map(i => (
                <textarea key={i} value={body[i] || ''} onChange={e => setBody(i, e.target.value)}
                  rows={3} placeholder={`Avsnitt ${i+1}`} className={inp + ' resize-none'} />
              ))}
            </div>
          </div>

          {/* Highlights */}
          <div>
            <label className="block text-xs font-semibold text-brand-dark mb-2">Høydepunkter / bullets (maks 4)</label>
            <div className="grid grid-cols-2 gap-2">
              {[0,1,2,3].map(i => (
                <input key={i} value={highlights[i] || ''} onChange={e => setHighlight(i, e.target.value)}
                  placeholder={`Høydepunkt ${i+1}`} className={inp} />
              ))}
            </div>
          </div>

          {/* Images */}
          <div className="grid grid-cols-2 gap-5">
            <Field label="Listebilde (kortkortet)" hint="4:3 format">
              <ImageUploader value={draft.heroImage} onChange={v => set('heroImage', v)} />
            </Field>
            <Field label="Detaljbilde (siden)" hint="4:3 format">
              <ImageUploader value={draft.detailImage} onChange={v => set('detailImage', v)} />
            </Field>
          </div>

          {dirty && (
            <div className="flex justify-end pt-1">
              <button onClick={save} disabled={saving}
                className="flex items-center gap-2 bg-brand-blue text-white font-semibold px-4 py-2 rounded-xl text-sm hover:bg-brand-blue-dark disabled:opacity-50 transition-colors">
                <Save size={13} /> {saving ? 'Lagrer…' : 'Lagre endringer'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── New form ───────────────────────────────────────────────────────────────────

function NewForm({ onCreated, onCancel }) {
  const blank = { slug: '', title: '', intro: '', heroImage: '', detailImage: '', headline: '', body: ['', '', ''], highlights: ['', '', '', ''], group: '', sortOrder: 0, active: true }
  const [draft, setDraft] = useState(blank)
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }))

  const save = async () => {
    if (!draft.title.trim()) return
    setSaving(true)
    try {
      const created = await api.createServiceCategory({
        ...draft,
        slug: draft.slug || slugify(draft.title),
        body: draft.body.filter(Boolean),
        highlights: draft.highlights.filter(Boolean),
      })
      onCreated(created)
    } finally { setSaving(false) }
  }

  return (
    <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-5 space-y-4">
      <p className="text-sm font-bold text-green-800">Ny tjenestekategori</p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Tittel *">
          <input value={draft.title} onChange={e => { set('title', e.target.value); set('slug', slugify(e.target.value)) }}
            autoFocus placeholder="Flyplassturer" className={inp} />
        </Field>
        <Field label="Gruppe">
          <select value={draft.group} onChange={e => set('group', e.target.value)} className={inp}>
            <option value="">— Ingen gruppe —</option>
            {GROUPS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Slug">
        <input value={draft.slug} onChange={e => set('slug', slugify(e.target.value))} placeholder="flyplassturer" className={inp} />
      </Field>
      <Field label="Kort beskrivelse">
        <textarea value={draft.intro} onChange={e => set('intro', e.target.value)} rows={2} className={inp + ' resize-none'} />
      </Field>
      <Field label="Stor overskrift (detaljsiden)">
        <input value={draft.headline} onChange={e => set('headline', e.target.value)} className={inp} />
      </Field>
      <div className="flex gap-3 justify-end">
        <button onClick={onCancel} className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50">Avbryt</button>
        <button onClick={save} disabled={saving || !draft.title.trim()}
          className="flex items-center gap-2 bg-green-600 text-white font-semibold px-4 py-2 rounded-xl text-sm disabled:opacity-50 hover:bg-green-700 transition-colors">
          <Plus size={13} /> {saving ? 'Lagrer…' : 'Legg til'}
        </button>
      </div>
    </div>
  )
}

// ── Import helper ──────────────────────────────────────────────────────────────

function ImportBanner({ onImported }) {
  const [importing, setImporting] = useState(false)

  const doImport = async () => {
    setImporting(true)
    try {
      const created = []
      for (const s of SERVICES) {
        const item = await api.createServiceCategory({
          slug: s.slug, title: s.title, intro: s.intro,
          heroImage: s.heroImage, detailImage: s.detailImage,
          headline: s.headline, body: s.body, highlights: s.highlights,
          group: '', sortOrder: SERVICES.indexOf(s), active: true,
        })
        created.push(item)
      }
      onImported(created)
    } finally { setImporting(false) }
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-center justify-between gap-4">
      <div>
        <p className="font-semibold text-blue-800 text-sm">Ingen turer lagt til ennå</p>
        <p className="text-xs text-blue-600 mt-1">Importer de 9 standard-kategoriene fra malen for å komme i gang raskt.</p>
      </div>
      <button onClick={doImport} disabled={importing}
        className="flex-shrink-0 flex items-center gap-2 bg-brand-blue text-white font-semibold px-4 py-2.5 rounded-xl text-sm disabled:opacity-50 hover:bg-brand-blue-dark transition-colors">
        {importing ? <RefreshCw size={13} className="animate-spin" /> : <Plus size={13} />}
        {importing ? 'Importerer…' : 'Importer maler'}
      </button>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function AdminOppdragPage() {
  const [confirmModal, askConfirm] = useConfirm()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const dragItem = useRef(null)
  const dragOver = useRef(null)

  const load = async () => {
    setLoading(true); setError(null)
    try { setItems(await api.getServiceCategories()) }
    catch { setError('Kunne ikke laste turer — er API-et i gang?') }
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
      api.updateServiceCategory(item.id, { ...item, body: item.body || [], highlights: item.highlights || [] })
    ))
  }, [items])

  const makeDragHandlers = useCallback((index) => ({
    draggable: true,
    onDragStart: () => { dragItem.current = index },
    onDragEnter: () => { dragOver.current = index },
    onDragEnd: handleDrop,
    onDragOver: (e) => e.preventDefault(),
  }), [handleDrop])

  if (loading) return <div className="text-gray-400 text-sm">Laster turer…</div>
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
        <p className="text-sm text-gray-400">{items.filter(i => i.active).length} aktive turer</p>
        <button onClick={() => setShowNew(true)} disabled={showNew}
          className="flex items-center gap-2 bg-brand-blue text-white font-semibold px-4 py-2.5 rounded-full text-sm hover:bg-brand-blue-dark disabled:opacity-40 transition-colors">
          <Plus size={14} /> Legg til tur
        </button>
      </div>

      <div className="space-y-3">
        {showNew && (
          <NewForm
            onCreated={item => { setItems(prev => [...prev, item]); setShowNew(false) }}
            onCancel={() => setShowNew(false)}
          />
        )}

        {items.length === 0 && !showNew && (
          <ImportBanner onImported={imported => setItems(imported)} />
        )}

        {items.map((item, index) => (
          <ServiceRow key={item.id} item={item}
            onSaved={u => setItems(prev => prev.map(x => x.id === u.id ? u : x))}
            onDeleted={id => setItems(prev => prev.filter(x => x.id !== id))}
            askConfirm={askConfirm}
            dragHandlers={makeDragHandlers(index)}
          />
        ))}
      </div>
    </div>
  )
}
