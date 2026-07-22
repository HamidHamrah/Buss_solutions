import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, Minus, ChevronLeft, AlertCircle } from 'lucide-react'
import { useConfig } from '../../contexts/ConfigContext'
import { api } from '../../services/api'
import AddressInput from '../../components/AddressInput'
import { calcPrice, fmtKr, calcRouteDistance } from '../../utils/bookingHelpers'

export default function AdminNewBookingPage() {
  const navigate = useNavigate()
  const { config } = useConfig()
  const { pricing } = config
  const [buses, setBuses] = useState([])

  useEffect(() => { api.getBuses().then(setBuses).catch(() => {}) }, [])

  const [state, setState] = useState({
    from: null, to: null,
    stops: [],
    date: '', time: '12:00',
    returnDate: '', returnTime: '12:00',
    tripType: 'oneway',
    busOnStay: false,
    passengers: 1,
    busCount: 1,
    needsTrailer: false,
    needsWheelchair: false,
    selectedBus: '',
    extras: [],
    customerType: 'private',
    company: '', orgNr: '',
    firstName: '', lastName: '', phone: '', email: '',
    notes: '',
    priceAdjustment: '', priceAdjustmentNote: '',
  })
  const [routeData, setRouteData] = useState(null)
  const [calculating, setCalculating] = useState(false)
  const [routeError, setRouteError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const set = (patch) => setState(s => ({ ...s, ...patch }))
  const addStop = () => set({ stops: [...state.stops, { address: '', lat: null, lon: null }] })
  const removeStop = (i) => set({ stops: state.stops.filter((_, idx) => idx !== i) })
  const updateStop = (i, v) => set({ stops: state.stops.map((st, idx) => idx === i ? { ...st, ...v } : st) })

  const km = routeData ? Math.round(routeData.distance / 1000 * (state.tripType === 'return' ? 2 : 1)) : null
  const bus = buses.find(b => b.externalId === state.selectedBus)
  const pricePerBus = km && bus ? calcPrice(pricing, km, state.time, state.tripType, state.busOnStay, bus) : null
  const price = pricePerBus
    ? { base: pricePerBus.base * state.busCount, vat: pricePerBus.vat * state.busCount, total: pricePerBus.total * state.busCount }
    : null
  const adjustment = parseFloat(state.priceAdjustment) || 0
  const finalTotal = price ? price.total + adjustment : null

  const calcRoute = async () => {
    if (!state.from?.lat || !state.to?.lat) return
    setCalculating(true)
    setRouteError('')
    try {
      const route = await calcRouteDistance(state.from, state.to, state.stops)
      setRouteData(route)
    } catch {
      setRouteError('Kunne ikke beregne ruten. Prøv igjen.')
    }
    setCalculating(false)
  }

  // Mirrors the public booking wizard, which always calculates distance/price before
  // the customer can submit — the admin quick-entry form used to let you skip this
  // entirely and submit with price stuck at 0.
  useEffect(() => {
    if (state.from?.lat && state.to?.lat) calcRoute()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.from?.lat, state.from?.lon, state.to?.lat, state.to?.lon])

  const canSubmit = state.from?.lat && state.to?.lat && state.date && state.selectedBus && km &&
    state.firstName.trim() && state.lastName.trim() && state.phone.trim() && state.email.trim()

  const submit = async () => {
    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await api.createBooking({
        fromAddress: state.from?.address || '',
        toAddress: state.to?.address || '',
        stops: state.stops.filter(s => s.lat).map(s => s.address),
        departureDate: state.date ? new Date(state.date).toISOString() : new Date().toISOString(),
        departureTime: state.time || '12:00',
        tripType: state.tripType,
        returnDate: state.tripType === 'return' && state.returnDate ? new Date(state.returnDate).toISOString() : null,
        returnTime: state.tripType === 'return' ? (state.returnTime || null) : null,
        busOnStay: state.busOnStay,
        stayDurationHours: null,
        busId: state.selectedBus,
        busName: bus?.name || '',
        passengers: state.passengers,
        busCount: state.busCount,
        needsTrailer: state.needsTrailer,
        needsWheelchair: state.needsWheelchair,
        selectedExtras: state.extras,
        estimatedBase: price?.base || 0,
        estimatedVat: price?.vat || 0,
        estimatedTotal: finalTotal || 0,
        priceAdjustment: adjustment,
        priceAdjustmentNote: state.priceAdjustmentNote || null,
        distanceKm: km || 0,
        customerType: state.customerType,
        contactName: `${state.firstName} ${state.lastName}`.trim(),
        contactEmail: state.email,
        contactPhone: state.phone,
        orgName: state.customerType === 'org' ? (state.company || null) : null,
        orgNumber: state.customerType === 'org' ? (state.orgNr || null) : null,
        message: state.notes || null,
      })
      navigate(`/admin/bookings?ref=${encodeURIComponent(res.reference)}`)
    } catch (e) {
      setSubmitError(e?.message || 'Kunne ikke opprette bestillingen.')
    } finally {
      setSubmitting(false)
    }
  }

  const inp = 'w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30'

  return (
    <div className="max-w-3xl">
      <button onClick={() => navigate('/admin/bookings')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-brand-blue mb-5">
        <ChevronLeft size={16} /> Bestillinger
      </button>
      <h1 className="text-xl font-bold text-brand-dark mb-1">Ny bestilling</h1>
      <p className="text-sm text-gray-400 mb-6">For bestillinger som kommer inn på telefon eller e-post.</p>

      <div className="space-y-6">
        {/* Route */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-brand-dark uppercase tracking-wider">Reiserute</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AddressInput label="Fra" value={state.from} placeholder="f.eks. Fosseikeland, Norge" onChange={v => set({ from: v })} />
            <AddressInput label="Til" value={state.to} placeholder="f.eks. Oslo, Norge" onChange={v => set({ to: v })} />
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-2">Stopp underveis</p>
            {state.stops.map((stop, i) => (
              <div key={i} className="flex gap-2 mb-2 items-center">
                <div className="flex-1">
                  <AddressInput value={stop} placeholder="Stoppested…" onChange={v => updateStop(i, v)} />
                </div>
                <button onClick={() => removeStop(i)} className="text-gray-400 hover:text-red-500"><X size={16} /></button>
              </div>
            ))}
            <button onClick={addStop} className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-brand-blue">
              <Plus size={13} /> Legg til stopp
            </button>
          </div>

          <div className="flex gap-6">
            {['oneway', 'return'].map(t => (
              <label key={t} className="flex items-center gap-2 cursor-pointer">
                <div onClick={() => set({ tripType: t })}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${state.tripType === t ? 'border-brand-blue bg-brand-blue' : 'border-gray-300'}`}>
                  {state.tripType === t && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <span className="text-sm font-medium">{t === 'return' ? 'Tur/retur' : 'Enveis'}</span>
              </label>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Avreisedato</label>
              <input type="date" value={state.date} min={new Date().toISOString().split('T')[0]}
                onChange={e => set({ date: e.target.value })} className={inp} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tid</label>
              <input type="time" value={state.time} onChange={e => set({ time: e.target.value })} className={inp} />
            </div>
            {state.tripType === 'return' && (
              <>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Returdato</label>
                  <input type="date" value={state.returnDate} min={state.date || new Date().toISOString().split('T')[0]}
                    onChange={e => set({ returnDate: e.target.value })} className={inp} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Tid</label>
                  <input type="time" value={state.returnTime} onChange={e => set({ returnTime: e.target.value })} className={inp} />
                </div>
              </>
            )}
          </div>

          {routeError && <p className="text-sm text-red-600">{routeError}</p>}
          <button onClick={calcRoute} disabled={!state.from?.lat || !state.to?.lat || calculating}
            className="bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
            {calculating ? 'Beregner…' : 'Beregn distanse'}
          </button>
          {routeData && (
            <p className="text-sm text-gray-500">
              Beregnet {km} km {state.tripType === 'return' ? '(tur/retur)' : '(enveis)'}
            </p>
          )}
        </div>

        {/* Passengers + bus */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-brand-dark uppercase tracking-wider">Passasjerer og buss</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Antall passasjerer</label>
              <div className="flex items-center gap-2">
                <button onClick={() => set({ passengers: Math.max(1, state.passengers - 1) })}
                  className="w-9 h-9 rounded-lg bg-brand-dark text-white flex items-center justify-center flex-shrink-0"><Minus size={14} /></button>
                <input type="number" min="1" value={state.passengers}
                  onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 1) set({ passengers: v }) }}
                  className="w-16 text-center font-bold border border-gray-200 rounded-lg py-2" />
                <button onClick={() => set({ passengers: state.passengers + 1 })}
                  className="w-9 h-9 rounded-lg bg-brand-dark text-white flex items-center justify-center flex-shrink-0"><Plus size={14} /></button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Antall busser</label>
              <div className="flex items-center gap-2">
                <button onClick={() => set({ busCount: Math.max(1, state.busCount - 1) })}
                  className="w-9 h-9 rounded-lg bg-brand-dark text-white flex items-center justify-center flex-shrink-0"><Minus size={14} /></button>
                <input type="number" min="1" value={state.busCount}
                  onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 1) set({ busCount: v }) }}
                  className="w-16 text-center font-bold border border-gray-200 rounded-lg py-2" />
                <button onClick={() => set({ busCount: state.busCount + 1 })}
                  className="w-9 h-9 rounded-lg bg-brand-dark text-white flex items-center justify-center flex-shrink-0"><Plus size={14} /></button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-4 py-3 rounded-xl cursor-pointer">
              <input type="checkbox" checked={state.needsTrailer} onChange={e => set({ needsTrailer: e.target.checked })} className="w-4 h-4 rounded" />
              Trenger tilhenger
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-4 py-3 rounded-xl cursor-pointer">
              <input type="checkbox" checked={state.needsWheelchair} onChange={e => set({ needsWheelchair: e.target.checked })} className="w-4 h-4 rounded" />
              Behov for rullestol
            </label>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-2">Buss *</label>
            <div className="space-y-2">
              {buses.filter(b => b.active).map(b => {
                const p = km ? calcPrice(pricing, km, state.time, state.tripType, state.busOnStay, b) : null
                const selected = state.selectedBus === b.externalId
                return (
                  <button key={b.externalId} onClick={() => set({ selectedBus: b.externalId })}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-left transition-colors ${selected ? 'border-brand-blue bg-brand-blue/5' : 'border-gray-200 hover:border-gray-300'}`}>
                    <span className="text-sm font-semibold text-brand-dark">{b.name} · {b.seats * state.busCount} seter</span>
                    {p && <span className="text-sm font-bold text-brand-dark">{fmtKr(p.base * state.busCount)}</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {state.selectedBus && !price && (
            <p className="text-sm text-gray-400">
              {calculating ? 'Beregner pris…' : 'Beregn distanse for å se pris.'}
            </p>
          )}

          {price && (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 grid grid-cols-3 gap-3 text-center text-sm">
                <div><p className="text-xs text-gray-400 uppercase mb-1">Eks. mva</p><p className="font-bold">{fmtKr(price.base)}</p></div>
                <div><p className="text-xs text-gray-400 uppercase mb-1">Mva</p><p className="font-bold">{fmtKr(price.vat)}</p></div>
                <div><p className="text-xs text-gray-400 uppercase mb-1">Beregnet pris</p><p className="font-bold">{fmtKr(price.total)}</p></div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Prisjustering (valgfritt)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Beløp — kr (kan være negativt)</label>
                    <input type="number" placeholder="0" value={state.priceAdjustment}
                      onChange={e => set({ priceAdjustment: e.target.value })} className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Årsak</label>
                    <input placeholder="f.eks. rabatt, ekstra stopp…" value={state.priceAdjustmentNote}
                      onChange={e => set({ priceAdjustmentNote: e.target.value })} className={inp} />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between px-4 py-3 bg-brand-blue/5 border border-brand-blue/20 rounded-xl">
                <span className="text-sm font-semibold text-brand-dark">Totalt inkl. mva</span>
                <span className="text-lg font-black text-brand-blue">{fmtKr(finalTotal)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Contact */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-brand-dark uppercase tracking-wider">Kontaktinfo</h2>
          <div className="flex gap-6">
            {['private', 'org'].map(t => (
              <label key={t} className="flex items-center gap-2 cursor-pointer">
                <div onClick={() => set({ customerType: t })}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${state.customerType === t ? 'border-brand-blue bg-brand-blue' : 'border-gray-300'}`}>
                  {state.customerType === t && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <span className="text-sm font-medium">{t === 'org' ? 'Organisasjon' : 'Privat'}</span>
              </label>
            ))}
          </div>
          {state.customerType === 'org' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input placeholder="Firmanavn" value={state.company} onChange={e => set({ company: e.target.value })} className={inp} />
              <input placeholder="Org.nr." value={state.orgNr} onChange={e => set({ orgNr: e.target.value })} className={inp} />
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input placeholder="Fornavn *" value={state.firstName} onChange={e => set({ firstName: e.target.value })} className={inp} />
            <input placeholder="Etternavn *" value={state.lastName} onChange={e => set({ lastName: e.target.value })} className={inp} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input placeholder="Mobilnummer *" value={state.phone} onChange={e => set({ phone: e.target.value })} className={inp} />
            <input placeholder="E-postadresse *" value={state.email} onChange={e => set({ email: e.target.value })} className={inp} />
          </div>
          <textarea placeholder="Merknad" value={state.notes} onChange={e => set({ notes: e.target.value })} rows={3} className={`${inp} resize-none`} />
        </div>

        {submitError && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl">
            <AlertCircle size={15} /> {submitError}
          </div>
        )}

        {!canSubmit && !km && state.from?.lat && state.to?.lat && (
          <p className="text-xs text-gray-400 text-center -mt-2">Venter på beregnet distanse før pris kan settes…</p>
        )}

        <button onClick={submit} disabled={!canSubmit || submitting}
          className="w-full bg-brand-blue hover:bg-brand-blue-dark disabled:opacity-40 text-white font-bold py-3.5 rounded-xl text-sm transition-colors">
          {submitting ? 'Oppretter…' : 'Opprett bestilling'}
        </button>
      </div>
    </div>
  )
}
