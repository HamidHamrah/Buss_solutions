import { useState, useEffect, useMemo } from 'react'
import { Plus, Trash2, Save, Info, Pencil, Check, X, Calculator } from 'lucide-react'
import { useConfig } from '../../contexts/ConfigContext'
import { api } from '../../services/api'
import { useConfirm } from '../../hooks/useConfirm'
import { calcTripPrice } from '../../services/config'

const VAR_TYPES = [
  { value: 'flat', label: 'Fast beløp (kr)' },
  { value: 'per_km', label: 'Per km (kr/km)' },
  { value: 'per_hour', label: 'Per time (kr/t)' },
  { value: 'percent', label: 'Prosenttillegg (%)' },
]

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-brand-dark mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-1.5">{hint}</p>}
      {children}
    </div>
  )
}

function NumberInput({ value, onChange, min = 0, step = 1, suffix }) {
  return (
    <div className="relative">
      <input
        type="number"
        value={value}
        min={min}
        step={step}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue pr-12"
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">{suffix}</span>
      )}
    </div>
  )
}

// ── Price category row ──────────────────────────────────────────────────────
function CategoryRow({ cat, onSaved, onDeleted, askConfirm }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ name: cat.name, kmRate: cat.kmRate, hourRate: cat.hourRate })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      const updated = await api.updatePriceCategory(cat.id, draft)
      onSaved(updated)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const del = async () => {
    if (!await askConfirm({ title: 'Slett priskategori', message: `«${cat.name}» vil bli slettet. Busser med denne kategorien mister priskoblingen.` })) return
    await api.deletePriceCategory(cat.id)
    onDeleted(cat.id)
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
        <div className="flex-1">
          <p className="font-semibold text-brand-dark text-sm">{cat.name}</p>
          <p className="text-xs text-gray-400">{cat.kmRate} kr/km · {cat.hourRate} kr/t</p>
        </div>
        <button onClick={() => setEditing(true)}
          className="p-1.5 rounded-lg hover:bg-white text-gray-400 hover:text-brand-blue transition-colors">
          <Pencil size={15} />
        </button>
        <button onClick={del}
          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
          <Trash2 size={15} />
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 bg-blue-50 rounded-xl space-y-3 border border-brand-blue/20">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-brand-dark mb-1">Navn</label>
          <input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-brand-dark mb-1">Kr/km</label>
          <input type="number" value={draft.kmRate} onChange={e => setDraft(d => ({ ...d, kmRate: Number(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-brand-dark mb-1">Kr/time</label>
          <input type="number" value={draft.hourRate} onChange={e => setDraft(d => ({ ...d, hourRate: Number(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={() => setEditing(false)}
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-gray-50">
          <X size={12} /> Avbryt
        </button>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-brand-blue text-white hover:bg-brand-blue-dark disabled:opacity-50">
          <Check size={12} /> {saving ? 'Lagrer…' : 'Lagre'}
        </button>
      </div>
    </div>
  )
}

// ── New category form ───────────────────────────────────────────────────────
function NewCategoryForm({ onCreated, onCancel }) {
  const [draft, setDraft] = useState({ name: '', kmRate: 18, hourRate: 850 })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!draft.name.trim()) return
    setSaving(true)
    try {
      const created = await api.createPriceCategory(draft)
      onCreated(created)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 bg-green-50 rounded-xl space-y-3 border border-green-200">
      <p className="text-xs font-bold text-green-800">Ny priskategori</p>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-brand-dark mb-1">Navn</label>
          <input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
            placeholder="f.eks. Minibuss"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-brand-dark mb-1">Kr/km</label>
          <input type="number" value={draft.kmRate} onChange={e => setDraft(d => ({ ...d, kmRate: Number(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-brand-dark mb-1">Kr/time</label>
          <input type="number" value={draft.hourRate} onChange={e => setDraft(d => ({ ...d, hourRate: Number(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel}
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-gray-50">
          <X size={12} /> Avbryt
        </button>
        <button onClick={save} disabled={saving || !draft.name.trim()}
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">
          <Check size={12} /> {saving ? 'Oppretter…' : 'Opprett'}
        </button>
      </div>
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function AdminPricesPage() {
  const [confirmModal, askConfirm] = useConfirm()
  const { config, update } = useConfig()
  const [pricing, setPricing] = useState({ ...config.pricing })
  const [saved, setSaved] = useState(false)
  const [categories, setCategories] = useState([])
  const [showNewCat, setShowNewCat] = useState(false)
  const [catError, setCatError] = useState(null)

  useEffect(() => {
    api.getPriceCategories()
      .then(setCategories)
      .catch(() => setCatError('Kunne ikke laste priskategorier — er API-et i gang?'))
  }, [])

  const save = () => {
    update(c => ({ ...c, pricing }))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const setField = (key, val) => setPricing(p => ({ ...p, [key]: val }))

  const addVar = () => setPricing(p => ({
    ...p,
    customVariables: [
      ...(p.customVariables || []),
      { id: Date.now().toString(), name: '', type: 'flat', value: 0, unit: '', optional: false, defaultEnabled: true }
    ]
  }))

  const updateVar = (id, field, val) => setPricing(p => ({
    ...p,
    customVariables: p.customVariables.map(v => v.id === id ? { ...v, [field]: val } : v)
  }))

  const removeVar = (id) => setPricing(p => ({
    ...p,
    customVariables: p.customVariables.filter(v => v.id !== id)
  }))

  return (
    <div className="max-w-3xl space-y-8">
      {confirmModal}

      {/* Price categories */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h2 className="font-bold text-brand-dark text-lg">Priskategorier</h2>
            <p className="text-sm text-gray-400 mt-0.5">Definer pristyper — hver buss velger hvilken kategori den tilhører</p>
          </div>
          <button onClick={() => setShowNewCat(true)}
            className="flex items-center gap-1.5 text-sm bg-brand-blue hover:bg-brand-blue-dark text-white px-3 py-1.5 rounded-lg transition-colors">
            <Plus size={14} /> Ny kategori
          </button>
        </div>

        {catError && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl">{catError}</div>
        )}

        <div className="mt-5 space-y-2">
          {categories.map(cat => (
            <CategoryRow
              key={cat.id}
              cat={cat}
              onSaved={updated => setCategories(cs => cs.map(c => c.id === updated.id ? updated : c))}
              onDeleted={id => setCategories(cs => cs.filter(c => c.id !== id))}
              askConfirm={askConfirm}
            />
          ))}
          {categories.length === 0 && !catError && (
            <div className="text-center py-6 text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
              Ingen kategorier ennå. Klikk «Ny kategori» for å starte.
            </div>
          )}
          {showNewCat && (
            <NewCategoryForm
              onCreated={cat => { setCategories(cs => [...cs, cat]); setShowNewCat(false) }}
              onCancel={() => setShowNewCat(false)}
            />
          )}
        </div>
      </section>

      {/* Surcharges */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-bold text-brand-dark text-lg mb-1">Tillegg og surcharger</h2>
        <p className="text-sm text-gray-400 mb-6">Prosenttillegg legges på timeprisen automatisk</p>
        <div className="grid grid-cols-2 gap-5">
          <Field label="Nattillegg (%)" hint="Gjelder timer mellom kl. 21:00 og 06:00">
            <NumberInput value={pricing.nightSurcharge} onChange={v => setField('nightSurcharge', v)} suffix="%" />
          </Field>
          <Field label="Helgetillegg (%)" hint="Gjelder hele lørdag og søndag (ikke bare nattetimer)">
            <NumberInput value={pricing.weekendSurcharge} onChange={v => setField('weekendSurcharge', v)} suffix="%" />
          </Field>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-xl flex gap-2 text-xs text-brand-blue">
          <Info size={14} className="flex-shrink-0 mt-0.5" />
          <span>
            Nattillegg og helgetillegg legges på <strong>timeprisen</strong> — ikke kilometerprisen.
            Disse gjelder uavhengig av hverandre. Faller en natt på helgen brukes det høyeste tillegget.
          </span>
        </div>
      </section>

      {/* Other base settings */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-bold text-brand-dark text-lg mb-1">Andre innstillinger</h2>
        <p className="text-sm text-gray-400 mb-6">MVA, minstepris og tomkjøring</p>
        <div className="grid grid-cols-2 gap-5">
          <Field label="Minstepris" hint="Laveste mulige faktura (kr)">
            <NumberInput value={pricing.minInvoice} onChange={v => setField('minInvoice', v)} suffix="kr" />
          </Field>
          <Field label="MVA" hint="Merverdiavgift i prosent">
            <NumberInput value={pricing.vatPercent} onChange={v => setField('vatPercent', v)} suffix="%" />
          </Field>
          <Field label="Tomkjøringsradius (km)" hint="Km rundt Fosseikeland der tomkjøring ikke beregnes">
            <NumberInput value={pricing.deadMileageRadiusKm} onChange={v => setField('deadMileageRadiusKm', v)} suffix="km" />
          </Field>
          <Field label="Tomkjøringsrate" hint="Kr per km utover grensen (per vei)">
            <NumberInput value={pricing.deadMileageRate} onChange={v => setField('deadMileageRate', v)} suffix="kr/km" />
          </Field>
        </div>
      </section>

      {/* Custom variables */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-bold text-brand-dark text-lg">Egendefinerte variabler</h2>
          <button onClick={addVar}
            className="flex items-center gap-1.5 text-sm bg-brand-blue hover:bg-brand-blue-dark text-white px-3 py-1.5 rounded-lg transition-colors">
            <Plus size={14} /> Legg til
          </button>
        </div>
        <p className="text-sm text-gray-400 mb-5">
          Valgfrie variabler vises som tilvalg i bestillingsskjemaet.
        </p>

        {(!pricing.customVariables || pricing.customVariables.length === 0) && (
          <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
            Ingen egendefinerte variabler ennå. Klikk «Legg til» for å starte.
          </div>
        )}

        <div className="space-y-4">
          {(pricing.customVariables || []).map(v => (
            <div key={v.id} className="border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Navn">
                  <input value={v.name}
                    onChange={e => updateVar(v.id, 'name', e.target.value)}
                    placeholder="f.eks. Tilhenger, Ekstra sjåfør"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
                </Field>
                <Field label="Type">
                  <select value={v.type}
                    onChange={e => updateVar(v.id, 'type', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/30">
                    {VAR_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Verdi">
                  <NumberInput value={v.value} onChange={val => updateVar(v.id, 'value', val)}
                    suffix={v.type === 'percent' ? '%' : 'kr'} />
                </Field>
                <Field label="Visningsenhet (valgfritt)">
                  <input value={v.unit}
                    onChange={e => updateVar(v.id, 'unit', e.target.value)}
                    placeholder="f.eks. per tur, per person"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
                </Field>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-5">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={v.optional}
                      onChange={e => updateVar(v.id, 'optional', e.target.checked)}
                      className="rounded" />
                    <span>Valgfritt for kunde</span>
                  </label>
                  {v.optional && (
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={v.defaultEnabled}
                        onChange={e => updateVar(v.id, 'defaultEnabled', e.target.checked)}
                        className="rounded" />
                      <span>Huk av som standard</span>
                    </label>
                  )}
                </div>
                <button onClick={() => removeVar(v.id)}
                  className="text-red-400 hover:text-red-600 flex items-center gap-1 text-sm">
                  <Trash2 size={14} /> Slett
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Save surcharges / other settings */}
      <div className="flex items-center gap-4">
        <button onClick={save}
          className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold px-6 py-3 rounded-full text-sm transition-colors">
          <Save size={15} /> Lagre tillegg og variabler
        </button>
        {saved && <span className="text-green-600 text-sm font-medium">✓ Lagret!</span>}
      </div>

      {/* Pricing calculator */}
      <PricingCalculator pricing={pricing} categories={categories} />
    </div>
  )
}

function PricingCalculator({ pricing, categories }) {
  const today = new Date().toISOString().slice(0, 10)
  const [catId, setCatId] = useState('')
  const [km, setKm] = useState(100)
  const [date, setDate] = useState(today)
  const [time, setTime] = useState('10:00')
  const [tripType, setTripType] = useState('oneway')
  const [busOnStay, setBusOnStay] = useState(false)
  const [stayHours, setStayHours] = useState(3)

  const selectedCat = categories.find(c => c.id === Number(catId)) ?? categories[0]

  const result = useMemo(() => {
    if (!selectedCat) return null
    const day = date ? new Date(date).getDay() : -1
    const isWeekend = day === 0 || day === 6

    const effectivePricing = {
      ...pricing,
      kmRate: selectedCat.kmRate,
      hourRate: selectedCat.hourRate,
    }

    const { base, vat, total } = calcTripPrice(effectivePricing, {
      km, departureTime: time, tripType, busOnStay,
      stayDurationHours: busOnStay ? stayHours : 0
    })

    const hour = parseInt(time.split(':')[0])
    const isNight = hour >= 21 || hour < 6
    let surcharge = 0
    if (isNight) surcharge = pricing.nightSurcharge
    if (isWeekend) surcharge = Math.max(surcharge, pricing.weekendSurcharge)
    const legs = tripType === 'return' ? 2 : 1
    const travelHours = km / 80
    const effectiveHour = selectedCat.hourRate * (1 + surcharge / 100)

    return {
      kmCost: Math.round(km * legs * selectedCat.kmRate),
      hourCost: Math.round(travelHours * legs * effectiveHour),
      surcharge, isNight, isWeekend,
      base, vat, total,
      legs
    }
  }, [pricing, selectedCat, km, date, time, tripType, busOnStay, stayHours])

  return (
    <section className="bg-white rounded-2xl border-2 border-brand-blue/20 p-6">
      <div className="flex items-center gap-2 mb-1">
        <Calculator size={18} className="text-brand-blue" />
        <h2 className="font-bold text-brand-dark text-lg">Priskalkulator</h2>
      </div>
      <p className="text-sm text-gray-400 mb-6">Test hva en tur vil koste med gjeldende priser</p>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {categories.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-brand-dark mb-1.5">Priskategori</label>
            <select value={catId} onChange={e => setCatId(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/30">
              {categories.map(c => <option key={c.id} value={c.id}>{c.name} ({c.kmRate} kr/km · {c.hourRate} kr/t)</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-brand-dark mb-1.5">Antall km</label>
          <div className="relative">
            <input type="number" value={km} min={1} onChange={e => setKm(Number(e.target.value))}
              className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">km</span>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-brand-dark mb-1.5">Avreisedato</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-brand-dark mb-1.5">Avreisetid</label>
          <input type="time" value={time} onChange={e => setTime(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-brand-dark mb-1.5">Turtype</label>
          <select value={tripType} onChange={e => setTripType(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/30">
            <option value="oneway">Enveis</option>
            <option value="return">Tur-retur</option>
          </select>
        </div>
        <div className="flex flex-col justify-end gap-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={busOnStay} onChange={e => setBusOnStay(e.target.checked)} className="rounded" />
            <span className="text-xs font-semibold text-brand-dark">Buss venter på stedet</span>
          </label>
          {busOnStay && (
            <div className="relative">
              <input type="number" value={stayHours} min={1} onChange={e => setStayHours(Number(e.target.value))}
                className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">t</span>
            </div>
          )}
        </div>
      </div>

      {result && (
        <div className="mt-4 bg-gray-50 rounded-xl p-4 space-y-2">
          {(result.isNight || result.isWeekend) && (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-3">
              <Info size={13} />
              <span>
                {result.isNight && result.isWeekend
                  ? `Natt + helg — høyeste tillegg brukes: ${result.surcharge}%`
                  : result.isNight ? `Nattillegg ${result.surcharge}% på timepris`
                  : `Helgetillegg ${result.surcharge}% på timepris`}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Km-kostnad ({result.legs === 2 ? 'tur-retur' : 'enveis'})</span>
            <span className="font-medium">{result.kmCost.toLocaleString('nb-NO')} kr</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Timekostnad (kjøretid)</span>
            <span className="font-medium">{result.hourCost.toLocaleString('nb-NO')} kr</span>
          </div>
          <div className="border-t border-gray-200 my-2" />
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Pris eks. MVA</span>
            <span className="font-medium">{result.base.toLocaleString('nb-NO')} kr</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">MVA ({pricing.vatPercent}%)</span>
            <span className="font-medium">{result.vat.toLocaleString('nb-NO')} kr</span>
          </div>
          <div className="flex justify-between text-base font-bold text-brand-dark pt-1">
            <span>Totalpris</span>
            <span className="text-brand-blue">{result.total.toLocaleString('nb-NO')} kr</span>
          </div>
          {result.base === pricing.minInvoice && (
            <p className="text-xs text-gray-400 text-right">* Minstepris brukt</p>
          )}
        </div>
      )}

      {categories.length === 0 && (
        <div className="p-4 bg-amber-50 rounded-xl text-sm text-amber-700">
          Opprett minst én priskategori ovenfor for å bruke kalkulatoren.
        </div>
      )}
    </section>
  )
}
