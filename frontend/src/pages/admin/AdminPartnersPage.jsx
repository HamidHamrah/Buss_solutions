import { useState, useEffect, useRef, useMemo } from 'react'
import { Plus, Trash2, Save, ToggleLeft, ToggleRight, RefreshCw, ExternalLink, Upload, X, Pencil, ChevronUp, Search } from 'lucide-react'
import { api } from '../../services/api'
import { useConfirm } from '../../hooks/useConfirm'

// ── Shared logo uploader component ──────────────────────────────────────────
function LogoUploader({ currentUrl, onUploaded }) {
  const inputRef = useRef()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setUploading(true)
    try {
      const { url } = await api.uploadFile(file)
      onUploaded(url)
    } catch {
      setError('Opplasting feilet — prøv igjen')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div>
      <label className="block text-xs font-semibold text-brand-dark mb-1.5">Logo</label>

      {/* Preview */}
      <div className="flex items-center gap-4 mb-3">
        <div className="w-32 h-16 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
          {currentUrl
            ? <img src={currentUrl} alt="Logo" className="max-h-12 max-w-28 object-contain p-1" />
            : <span className="text-xs text-gray-300">Ingen logo</span>
          }
        </div>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 text-sm bg-brand-blue hover:bg-brand-blue-dark text-white px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
          >
            <Upload size={14} />
            {uploading ? 'Laster opp…' : currentUrl ? 'Bytt logo' : 'Last opp logo'}
          </button>
          {currentUrl && (
            <button
              type="button"
              onClick={() => onUploaded('')}
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600"
            >
              <X size={12} /> Fjern logo
            </button>
          )}
          <p className="text-xs text-gray-400">JPG, PNG, SVG — maks 5 MB</p>
        </div>
      </div>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </div>
  )
}

// ── Existing partner row ─────────────────────────────────────────────────────
function PartnerRow({ partner, onSaved, onDeleted, askConfirm }) {
  const [draft, setDraft] = useState({ ...partner })
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const set = (field, val) => {
    setDraft(d => ({ ...d, [field]: val }))
    setDirty(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      const updated = await api.updatePartner(partner.id, {
        name: draft.name,
        logoUrl: draft.logoUrl,
        websiteUrl: draft.websiteUrl,
        active: draft.active,
      })
      onSaved(updated)
      setDirty(false)
      setExpanded(false)
    } finally {
      setSaving(false)
    }
  }

  const del = async () => {
    if (!await askConfirm({ title: 'Slett partner', message: `Er du sikker på at du vil slette «${partner.name}»?` })) return
    await api.deletePartner(partner.id)
    onDeleted(partner.id)
  }

  return (
    <div className={`bg-white border-2 rounded-2xl transition-colors ${draft.active ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
      {/* Compact header — always visible */}
      <div className="flex items-center gap-4 p-4">
        <div className="w-20 h-12 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {draft.logoUrl
            ? <img src={draft.logoUrl} alt={draft.name} className="max-h-10 max-w-[72px] object-contain" />
            : <span className="text-xs text-gray-300">Logo</span>
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-brand-dark truncate">{draft.name || <span className="text-gray-400 font-normal">Uten navn</span>}</p>
          {draft.websiteUrl && (
            <a href={draft.websiteUrl} target="_blank" rel="noopener noreferrer"
              className="text-xs text-brand-blue hover:underline inline-flex items-center gap-1 truncate">
              {draft.websiteUrl} <ExternalLink size={10} />
            </a>
          )}
        </div>
        <button onClick={async () => {
            const newActive = !draft.active
            setDraft(d => ({ ...d, active: newActive }))
            await api.updatePartner(partner.id, { name: draft.name, logoUrl: draft.logoUrl, websiteUrl: draft.websiteUrl, active: newActive })
          }} title={draft.active ? 'Deaktiver' : 'Aktiver'}
          className={`transition-colors flex-shrink-0 ${draft.active ? 'text-green-500 hover:text-green-700' : 'text-gray-300 hover:text-gray-500'}`}>
          {draft.active ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
        </button>
        <button onClick={() => setExpanded(e => !e)}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          title={expanded ? 'Skjul' : 'Rediger'}>
          {expanded ? <ChevronUp size={16} /> : <Pencil size={15} />}
        </button>
        <button onClick={del} className="p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors flex-shrink-0">
          <Trash2 size={16} />
        </button>
      </div>

      {/* Expanded edit fields */}
      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-3">
          <LogoUploader
            currentUrl={draft.logoUrl}
            onUploaded={url => set('logoUrl', url)}
          />
          <div>
            <label className="block text-xs font-semibold text-brand-dark mb-1.5">Navn</label>
            <input value={draft.name} onChange={e => set('name', e.target.value)}
              placeholder="f.eks. Visit Jæren"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-dark mb-1.5">Nettside (URL)</label>
            <input value={draft.websiteUrl} onChange={e => set('websiteUrl', e.target.value)}
              placeholder="https://www.partner.no"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
          </div>
          {dirty && (
            <div className="flex justify-end pt-1">
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

// ── New partner form ─────────────────────────────────────────────────────────
function NewPartnerForm({ onCreated, onCancel }) {
  const [draft, setDraft] = useState({ name: '', logoUrl: '', websiteUrl: '', active: true })
  const [saving, setSaving] = useState(false)

  const set = (field, val) => setDraft(d => ({ ...d, [field]: val }))

  const save = async () => {
    if (!draft.name.trim()) return
    setSaving(true)
    try {
      const created = await api.createPartner(draft)
      onCreated(created)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-5 space-y-4">
      <p className="text-sm font-bold text-green-800">Ny samarbeidspartner</p>

      <LogoUploader
        currentUrl={draft.logoUrl}
        onUploaded={url => set('logoUrl', url)}
      />

      <div>
        <label className="block text-xs font-semibold text-brand-dark mb-1.5">Navn</label>
        <input value={draft.name} onChange={e => set('name', e.target.value)}
          placeholder="f.eks. Visit Jæren"
          autoFocus
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-brand-dark mb-1.5">Nettside (URL)</label>
        <input value={draft.websiteUrl} onChange={e => set('websiteUrl', e.target.value)}
          placeholder="https://www.partner.no"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
      </div>

      <div className="flex gap-2 justify-end">
        <button onClick={onCancel}
          className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50">
          Avbryt
        </button>
        <button onClick={save} disabled={saving || !draft.name.trim()}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-xl text-sm disabled:opacity-50">
          <Plus size={14} /> {saving ? 'Oppretter…' : 'Legg til'}
        </button>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function AdminPartnersPage() {
  const [confirmModal, askConfirm] = useConfirm()
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      setPartners(await api.getPartners())
    } catch {
      setError('Kunne ikke laste partnere — er API-et i gang?')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const visiblePartners = useMemo(() => {
    if (!search.trim()) return partners
    const q = search.toLowerCase()
    return partners.filter(p => p.name?.toLowerCase().includes(q) || p.websiteUrl?.toLowerCase().includes(q))
  }, [partners, search])

  if (loading) return <div className="text-gray-400 text-sm">Laster partnere…</div>

  if (error) return (
    <div className="max-w-xl">
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-3">
        <p className="text-red-600 font-semibold">Tilkoblingsfeil</p>
        <p className="text-sm text-red-500">{error}</p>
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
        <p className="text-sm text-gray-400">{partners.filter(p => p.active).length} aktive partnere</p>
        <button onClick={() => setShowNew(true)} disabled={showNew}
          className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-semibold px-4 py-2.5 rounded-full text-sm transition-colors disabled:opacity-40">
          <Plus size={15} /> Legg til partner
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Søk på navn eller nettside…"
          className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
      </div>

      <div className="space-y-4">
        {showNew && (
          <NewPartnerForm
            onCreated={p => { setPartners(prev => [...prev, p]); setShowNew(false) }}
            onCancel={() => setShowNew(false)}
          />
        )}
        {partners.length === 0 && !showNew && (
          <div className="text-center py-12 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-2xl">
            Ingen samarbeidspartnere ennå.<br />Klikk «Legg til partner» for å starte.
          </div>
        )}
        {visiblePartners.map(p => (
          <PartnerRow
            key={p.id}
            partner={p}
            onSaved={updated => setPartners(prev => prev.map(x => x.id === updated.id ? updated : x))}
            onDeleted={id => setPartners(prev => prev.filter(x => x.id !== id))}
            askConfirm={askConfirm}
          />
        ))}
      </div>
    </div>
  )
}
