import { useState, useEffect, useMemo } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, ToggleLeft, ToggleRight, ImagePlus, X, Save, RefreshCw, Search } from 'lucide-react'
import { api } from '../../services/api'
import { useConfirm } from '../../hooks/useConfirm'

const ALL_AMENITIES = ['Wifi', 'Klimaanlegg', 'Kjøkken', '220 Volt', 'WC', 'TV/DVD', 'Mikrofon', 'DAB Radio', 'Bagasjerom', 'Tilhengerfeste', 'Rullestolvennlig']

function BusCard({ bus, categories, onSaved, onDeleted, askConfirm }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState({ ...bus })
  const [newImageUrl, setNewImageUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const set = (field, val) => setDraft(d => ({ ...d, [field]: val }))

  const toggleAmenity = (a) => {
    const has = draft.amenities.includes(a)
    set('amenities', has ? draft.amenities.filter(x => x !== a) : [...draft.amenities, a])
  }

  const addImage = () => {
    if (!newImageUrl.trim()) return
    set('images', [...(draft.images || []), newImageUrl.trim()])
    setNewImageUrl('')
  }

  const removeImage = (i) => set('images', draft.images.filter((_, idx) => idx !== i))

  const save = async () => {
    setSaving(true)
    try {
      const payload = {
        name: draft.name,
        registrationNumber: draft.registrationNumber ?? '',
        seats: draft.seats,
        description: draft.description,
        images: draft.images || [],
        amenities: draft.amenities || [],
        active: draft.active,
        priceCategoryId: draft.priceCategoryId ?? null,
      }
      const updated = bus.id
        ? await api.updateBus(bus.id, payload)
        : await api.createBus(payload)
      onSaved(updated)
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const del = async () => {
    if (!bus.id) { onDeleted(bus._tempId); return }
    if (!await askConfirm({ title: 'Slett buss', message: `Er du sikker på at du vil slette «${bus.name}»?` })) return
    setDeleting(true)
    try {
      await api.deleteBus(bus.id)
      onDeleted(bus.id)
    } finally {
      setDeleting(false)
    }
  }

  const cat = categories.find(c => c.id === draft.priceCategoryId)

  return (
    <div className={`bg-white border-2 rounded-2xl overflow-hidden transition-colors ${draft.active ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
      {/* Header */}
      <div className="flex items-center gap-4 p-4">
        {draft.images?.[0] && (
          <img src={draft.images[0]} alt={draft.name}
            className="w-20 h-14 object-cover rounded-xl flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-brand-dark truncate">{draft.name || <span className="text-gray-400">Ny buss</span>}</p>
          <p className="text-sm text-gray-400">
            {draft.seats} seter
            {cat ? ` · ${cat.name} (${cat.kmRate} kr/km · ${cat.hourRate} kr/t)` : ' · ingen priskategori'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => set('active', !draft.active)} title={draft.active ? 'Deaktiver' : 'Aktiver'}
            className={`transition-colors ${draft.active ? 'text-green-500 hover:text-green-700' : 'text-gray-300 hover:text-gray-500'}`}>
            {draft.active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
          </button>
          <button onClick={() => setOpen(o => !o)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          <button onClick={del} disabled={deleting}
            className="p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors disabled:opacity-40">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Expandable editor */}
      {open && (
        <div className="border-t border-gray-100 p-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-brand-dark mb-1.5">Navn</label>
              <input value={draft.name} onChange={e => set('name', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-dark mb-1.5">Registreringsnummer</label>
              <input value={draft.registrationNumber ?? ''} onChange={e => set('registrationNumber', e.target.value)}
                placeholder="AB 12345" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 font-mono" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-dark mb-1.5">Maks antall seter</label>
              <input type="number" value={draft.seats} onChange={e => set('seats', Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
            </div>
          </div>

          {/* Price category */}
          <div>
            <label className="block text-xs font-semibold text-brand-dark mb-1.5">Priskategori</label>
            <p className="text-xs text-gray-400 mb-2">
              Velg hvilken pristype som gjelder for denne bussen. Priser settes under Priskalkulator.
            </p>
            <select
              value={draft.priceCategoryId ?? ''}
              onChange={e => set('priceCategoryId', e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            >
              <option value="">— Ingen kategori valgt —</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.kmRate} kr/km · {c.hourRate} kr/t)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-dark mb-1.5">Beskrivelse</label>
            <textarea value={draft.description} onChange={e => set('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 resize-none" />
          </div>

          {/* Images */}
          <div>
            <label className="block text-xs font-semibold text-brand-dark mb-2">Bilder (URL)</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {(draft.images || []).map((url, i) => (
                <div key={i} className="relative group">
                  <img src={url} alt="" className="w-24 h-16 object-cover rounded-lg" />
                  <button onClick={() => removeImage(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addImage()}
                placeholder="https://... (lim inn bilde-URL)"
                className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
              <button onClick={addImage}
                className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2.5 rounded-xl text-sm transition-colors">
                <ImagePlus size={14} /> Legg til
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">Første bilde brukes som hovedbilde.</p>
          </div>

          {/* Amenities */}
          <div>
            <label className="block text-xs font-semibold text-brand-dark mb-2">Fasiliteter</label>
            <div className="flex flex-wrap gap-2">
              {ALL_AMENITIES.map(a => (
                <button key={a} onClick={() => toggleAmenity(a)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                    ${draft.amenities?.includes(a)
                      ? 'bg-brand-blue text-white border-brand-blue'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50">
              <Save size={14} /> {saving ? 'Lagrer…' : 'Lagre buss'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminBusesPage() {
  const [confirmModal, askConfirm] = useConfirm()
  const [buses, setBuses] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [b, c] = await Promise.all([api.getBuses(), api.getPriceCategories()])
      setBuses(b)
      setCategories(c)
    } catch {
      setError('Kunne ikke laste data — er API-et i gang? (dotnet run i kjosavik-api)')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const addBus = () => {
    setBuses(prev => [
      ...prev,
      { _tempId: Date.now(), name: '', seats: 50, description: '', images: [], amenities: ['Wifi', 'Klimaanlegg', 'WC'], active: true, priceCategoryId: categories[0]?.id ?? null }
    ])
  }

  const visibleBuses = useMemo(() => {
    if (!search.trim()) return buses
    const q = search.toLowerCase()
    return buses.filter(b => b.name?.toLowerCase().includes(q) || b.registrationNumber?.toLowerCase().includes(q))
  }, [buses, search])

  if (loading) return <div className="text-gray-400 text-sm">Laster busser…</div>

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
    <div className="max-w-3xl">
      {confirmModal}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-400">{buses.filter(b => b.active).length} av {buses.length} busser er aktive</p>
        <button onClick={addBus}
          className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-semibold px-4 py-2.5 rounded-full text-sm transition-colors">
          <Plus size={15} /> Legg til buss
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Søk på navn eller reg.nummer…"
          className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
      </div>

      {categories.length === 0 && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          Ingen priskategorier er opprettet ennå. Gå til <strong>Priskalkulator</strong> og legg til kategorier (f.eks. «Minibuss», «Stor buss») før du setter opp busser.
        </div>
      )}

      <div className="space-y-4">
        {visibleBuses.map(bus => (
          <BusCard
            key={bus.id ?? bus._tempId}
            bus={bus}
            categories={categories}
            onSaved={updated => setBuses(prev =>
              bus.id
                ? prev.map(b => b.id === updated.id ? updated : b)
                : prev.map(b => (b._tempId === bus._tempId ? updated : b))
            )}
            onDeleted={id => setBuses(prev => prev.filter(b => b.id !== id && b._tempId !== id))}
            askConfirm={askConfirm}
          />
        ))}
      </div>
    </div>
  )
}
