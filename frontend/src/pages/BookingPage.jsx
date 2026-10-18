import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Calendar, Clock, Users, ChevronRight, ChevronLeft, Minus, Plus, Wifi, Wind, Shield,
  CheckCircle, AlertCircle, ArrowRight, Sparkles, Loader2, Check,
} from 'lucide-react'
import { useConfig } from '../contexts/ConfigContext'
import { api } from '../services/api'
import { useSeo } from '../hooks/useSeo'
import AddressInput from '../components/AddressInput'
import RoutePreview from '../components/booking/RoutePreview'
import { Disclosure, StopList, TripSummary, MobileSummaryBar } from '../components/booking/BookingParts'
import { fmtKr, fmtMin, fmtDate, shortAddr, calcRouteDistance } from '../utils/bookingHelpers'
import { calcTripPrice } from '../services/config'

const STEPS = ['Rute', 'Dato og reisende', 'Buss og tillegg', 'Kontakt og oversikt']

const MINIBUS_CAPACITY = 20
const BUS_CAPACITY = 60

const EXTRAS = [
  { id: 'guide', label: 'Reiseguide / vertinne', price: 1500 },
  { id: 'wifi', label: 'Ekstra Wi-Fi-enhet', price: 500 },
  { id: 'drinks', label: 'Drikkevarer ombord', price: 800 },
  { id: 'luggage', label: 'Ekstra bagasjetjeneste', price: 400 },
]

const isMini = (cat) => cat.name.toLowerCase().includes('mini')
const inputCls = 'w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue'
const emailValid = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

const hasCoords = (a) => !!(a?.lat && a?.lon)
const stopsKey = (stops) => stops.filter(hasCoords).map(s => `${s.lat},${s.lon}`).join(';')

// Suggests a category from passengers per bus: small groups fit a minibus, larger ones a full-size bus.
function recommendCategory(categories, passengers, busCount) {
  if (!categories.length) return null
  const perBus = Math.ceil(passengers / Math.max(1, busCount))
  const minis = categories.filter(isMini)
  const large = categories.filter(c => !isMini(c))
  if (perBus <= MINIBUS_CAPACITY && minis.length) return minis[0]
  return large[0] || categories[0]
}

// Fetches route distance as soon as valid addresses are selected, with a short debounce so
// typing/choosing several fields doesn't spam the routing service.
function useAutoRoute(state) {
  const [out, setOut] = useState({ status: 'idle', route: null })
  const [back, setBack] = useState({ route: null })
  const seq = useRef(0)

  const fromKey = hasCoords(state.from) ? `${state.from.lat},${state.from.lon}` : ''
  const toKey = hasCoords(state.to) ? `${state.to.lat},${state.to.lon}` : ''
  const outStops = stopsKey(state.stops)
  const backStops = state.tripType === 'return' ? stopsKey(state.returnStops || []) : ''

  useEffect(() => {
    if (!fromKey || !toKey) { setOut({ status: 'idle', route: null }); return }
    const id = ++seq.current
    setOut(o => ({ ...o, status: 'loading' }))
    const t = setTimeout(async () => {
      try {
        const route = await calcRouteDistance(state.from, state.to, state.stops)
        if (id === seq.current) setOut({ status: 'ok', route })
      } catch {
        if (id === seq.current) setOut({ status: 'error', route: null })
      }
    }, 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromKey, toKey, outStops])

  useEffect(() => {
    if (!backStops || !fromKey || !toKey) { setBack({ route: null }); return }
    let cancelled = false
    const t = setTimeout(async () => {
      try {
        const route = await calcRouteDistance(state.to, state.from, state.returnStops)
        if (!cancelled) setBack({ route })
      } catch {
        if (!cancelled) setBack({ route: null })
      }
    }, 400)
    return () => { cancelled = true; clearTimeout(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromKey, toKey, backStops])

  return { status: out.status, route: out.route, returnRoute: back.route }
}

// ── Step 1: route ──────────────────────────────────────────────────────────────
function RouteStep({ state, setState, auto, km }) {
  const advancedCount = state.stops.length + (state.tripType === 'return' ? (state.returnStops || []).length : 0)
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-brand-dark">Hvor skal dere reise?</h2>
        <p className="text-sm text-gray-500 mt-1">Velg start og mål, så beregner vi ruten for deg.</p>
      </div>

      <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1" role="radiogroup" aria-label="Reisetype">
        {[['return', 'Tur/retur'], ['oneway', 'Enveis']].map(([t, label]) => (
          <button key={t} type="button" role="radio" aria-checked={state.tripType === t}
            onClick={() => setState(s => ({ ...s, tripType: t }))}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors motion-reduce:transition-none
              ${state.tripType === t ? 'bg-brand-blue text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AddressInput label="Reise fra" value={state.from} placeholder="f.eks. Stavanger, Norge"
          onChange={v => setState(s => ({ ...s, from: v }))} />
        <AddressInput label="Reise til" value={state.to} placeholder="f.eks. Oslo, Norge"
          onChange={v => setState(s => ({ ...s, to: v }))} />
      </div>

      <div className="min-h-6" aria-live="polite">
        {auto.status === 'loading' && (
          <p className="flex items-center gap-2 text-sm text-gray-500"><Loader2 size={14} className="animate-spin" /> Beregner rute…</p>
        )}
        {auto.status === 'ok' && auto.route && (
          <p className="flex items-center gap-2 text-sm text-gray-700">
            <Check size={14} className="text-green-600" />
            <span><strong>{Math.round(auto.route.distance / 1000)} km</strong> enveis · ca. {fmtMin(auto.route.duration)}
              {state.tripType === 'return' && <span className="text-gray-400"> · {km} km tur/retur</span>}</span>
          </p>
        )}
        {auto.status === 'error' && (
          <p className="flex items-center gap-2 text-sm text-amber-700">
            <AlertCircle size={14} /> Kunne ikke beregne ruten akkurat nå. Du kan fortsette – vi regner ut prisen i tilbudet.
          </p>
        )}
      </div>

      <RoutePreview className="h-64 sm:h-80" from={state.from} to={state.to}
        stops={state.stops} returnStops={state.returnStops || []}
        route={auto.route} returnRoute={auto.returnRoute} tripType={state.tripType} />

      <Disclosure title="Stopp og pauser underveis" badge={advancedCount}
        hint="Valgfritt – legg til hvis dere skal innom flere steder" defaultOpen={advancedCount > 0}>
        <StopList label="Stopp på utreisen" stops={state.stops} onChange={stops => setState(s => ({ ...s, stops }))} />
        {state.tripType === 'return' && (
          <StopList label="Stopp på returen" stops={state.returnStops || []} onChange={returnStops => setState(s => ({ ...s, returnStops }))} />
        )}
      </Disclosure>
    </div>
  )
}

// ── Step 2: date + passengers ──────────────────────────────────────────────────
function Counter({ label, value, min = 1, max, onChange }) {
  return (
    <div>
      <p className="text-sm font-semibold text-brand-dark mb-2">{label}</p>
      <div className="flex items-center gap-2">
        <button type="button" aria-label={`Færre ${label.toLowerCase()}`} onClick={() => onChange(Math.max(min, value - 1))}
          className="w-10 h-10 rounded-lg bg-brand-dark text-white flex items-center justify-center hover:bg-gray-700 active:scale-95 transition-transform motion-reduce:transition-none">
          <Minus size={16} />
        </button>
        <input type="number" min={min} max={max} value={value}
          onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= min) onChange(max ? Math.min(max, v) : v) }}
          className="w-20 text-center text-xl font-bold border border-gray-200 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue" />
        <button type="button" aria-label={`Flere ${label.toLowerCase()}`} onClick={() => onChange(max ? Math.min(max, value + 1) : value + 1)}
          className="w-10 h-10 rounded-lg bg-brand-dark text-white flex items-center justify-center hover:bg-gray-700 active:scale-95 transition-transform motion-reduce:transition-none">
          <Plus size={16} />
        </button>
      </div>
    </div>
  )
}

function WhenStep({ state, setState }) {
  const today = new Date().toISOString().split('T')[0]
  const advancedCount = [state.busOnStay, state.needsTrailer, state.needsWheelchair].filter(Boolean).length
  const check = (key, label) => (
    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
      <input type="checkbox" checked={state[key]} onChange={e => setState(s => ({ ...s, [key]: e.target.checked }))}
        className="w-4 h-4 rounded accent-brand-blue" />
      {label}
    </label>
  )
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-brand-dark">Når og hvor mange?</h2>
        <p className="text-sm text-gray-500 mt-1">
          {shortAddr(state.from)} → {shortAddr(state.to)} · {state.tripType === 'return' ? 'tur/retur' : 'enveis'}
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1"><Calendar size={12} className="inline mr-1" />Utreise</label>
            <input type="date" value={state.date} min={today} className={inputCls}
              onChange={e => setState(s => ({ ...s, date: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1"><Clock size={12} className="inline mr-1" />Avgang kl.</label>
            <input type="time" value={state.time} className={inputCls}
              onChange={e => setState(s => ({ ...s, time: e.target.value }))} />
          </div>
          {state.tripType === 'return' && (
            <>
              <div>
                <label className="block text-xs text-gray-500 mb-1"><Calendar size={12} className="inline mr-1" />Retur</label>
                <input type="date" value={state.returnDate} min={state.date || today} className={inputCls}
                  onChange={e => setState(s => ({ ...s, returnDate: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1"><Clock size={12} className="inline mr-1" />Retur kl.</label>
                <input type="time" value={state.returnTime} className={inputCls}
                  onChange={e => setState(s => ({ ...s, returnTime: e.target.value }))} />
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-5 border-t border-gray-100">
          <Counter label="Antall reisende" value={state.passengers} max={1000}
            onChange={v => setState(s => ({ ...s, passengers: v }))} />
          <Counter label="Antall busser" value={state.busCount} max={50}
            onChange={v => setState(s => ({ ...s, busCount: v }))} />
        </div>
        {state.passengers > state.busCount * BUS_CAPACITY && (
          <button type="button" onClick={() => setState(s => ({ ...s, busCount: Math.ceil(s.passengers / BUS_CAPACITY) }))}
            className="flex items-center gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 w-full text-left">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>{state.passengers} reisende trenger trolig {Math.ceil(state.passengers / BUS_CAPACITY)} busser.{' '}
              <strong className="underline">Oppdater antall busser</strong></span>
          </button>
        )}
      </div>

      <Disclosure title="Flere valg" badge={advancedCount}
        hint="Tilhenger, rullestol og buss tilgjengelig under oppholdet" defaultOpen={advancedCount > 0}>
        {check('busOnStay', 'Buss tilgjengelig under oppholdet')}
        {check('needsTrailer', 'Trenger tilhenger')}
        {check('needsWheelchair', 'Behov for rullestolplass (maks 1)')}
      </Disclosure>
    </div>
  )
}

// ── Step 3: bus + extras ───────────────────────────────────────────────────────
function BusStep({ state, setState, categories, recommended, priceFor }) {
  const toggleExtra = (id, on) => setState(s => ({
    ...s, extras: on ? [...(s.extras || []), id] : (s.extras || []).filter(x => x !== id),
  }))
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-brand-dark">Velg buss</h2>
        <p className="text-sm text-gray-500 mt-1">Vi tildeler den beste tilgjengelige bussen i valgt kategori.</p>
      </div>

      {categories.length === 0 && (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400">
          <p className="font-medium">Ingen busstyper tilgjengelig</p>
          <p className="text-sm">Ta kontakt med oss for å bestille.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" role="radiogroup" aria-label="Busstype">
        {categories.map(cat => {
          const selected = state.selectedCategory === cat.id
          const isRec = recommended?.id === cat.id
          const price = priceFor(cat)
          const mini = isMini(cat)
          return (
            <button key={cat.id} type="button" role="radio" aria-checked={selected}
              onClick={() => setState(s => ({ ...s, selectedCategory: cat.id, selectedCategoryName: cat.name }))}
              className={`text-left border-2 rounded-xl overflow-hidden transition-colors motion-reduce:transition-none
                ${selected ? 'border-brand-blue bg-brand-blue-pale/40' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
              <div className="px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-brand-dark">{cat.name}</p>
                  <p className="text-xs text-gray-500">{mini ? 'Opp til ca. 20 passasjerer' : 'Opp til ca. 60 passasjerer'}</p>
                </div>
                {price && (
                  <div className="text-right">
                    <p className="text-[11px] text-gray-400">Fra</p>
                    <p className="text-lg font-black text-brand-dark tabular-nums">{price.base.toLocaleString('nb-NO')},-</p>
                  </div>
                )}
              </div>
              <div className="px-4 pb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><Wifi size={12} className="text-brand-blue" /> Wi-Fi</span>
                <span className="flex items-center gap-1.5"><Wind size={12} className="text-brand-blue" /> Klimaanlegg</span>
                <span className="flex items-center gap-1.5"><Shield size={12} className="text-brand-blue" /> Forsikret</span>
                <span className="flex items-center gap-1.5"><Users size={12} className="text-brand-blue" /> Erfaren sjåfør</span>
              </div>
              {isRec && (
                <div className="px-4 py-1.5 bg-brand-blue text-white text-xs font-semibold flex items-center gap-1.5">
                  <Sparkles size={12} /> Anbefalt for {state.passengers} reisende{state.busCount > 1 ? ` på ${state.busCount} busser` : ''}
                </div>
              )}
            </button>
          )
        })}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-brand-dark uppercase tracking-wider mb-1">Tilleggstjenester</h3>
        <p className="text-sm text-gray-500 mb-3">Valgfritt. Prises i tilbudet vi sender deg.</p>
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          {EXTRAS.map(e => (
            <label key={e.id} className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50">
              <span className="flex items-center gap-3">
                <input type="checkbox" checked={!!state.extras?.includes(e.id)}
                  onChange={ev => toggleExtra(e.id, ev.target.checked)} className="w-4 h-4 rounded accent-brand-blue" />
                <span className="text-sm font-medium text-brand-dark">{e.label}</span>
              </span>
              <span className="text-sm font-semibold text-brand-blue">+ {e.price.toLocaleString('nb-NO')} kr</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Step 4: contact + final review ─────────────────────────────────────────────
function ReviewStep({ state, setState, auto, km, category, price, content, onEdit, onSubmit, submitting, submitError }) {
  const [touched, setTouched] = useState({})
  const touch = (f) => setTouched(t => ({ ...t, [f]: true }))
  const errors = {
    firstName: !state.firstName ? 'Fornavn er påkrevd' : null,
    lastName: !state.lastName ? 'Etternavn er påkrevd' : null,
    phone: !state.phone ? 'Mobilnummer er påkrevd' : null,
    email: !state.email ? 'E-post er påkrevd' : !emailValid(state.email) ? 'Ugyldig e-postadresse' : null,
  }
  const err = (f) => touched[f] && errors[f]
  const cls = (f) => `${inputCls} ${err(f) ? '!border-red-400 !bg-red-50' : ''}`
  const field = (f, placeholder, type = 'text') => (
    <div>
      <input type={type} placeholder={placeholder} value={state[f] || ''} className={cls(f)}
        onChange={e => setState(s => ({ ...s, [f]: e.target.value }))} onBlur={() => touch(f)} />
      {err(f) && <p className="mt-1 text-xs text-red-500">{errors[f]}</p>}
    </div>
  )
  const canSubmit = !Object.values(errors).some(Boolean) && state.acceptTerms && !submitting

  const Line = ({ label, value, step }) => (
    <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
      <span className="text-gray-500 w-28 flex-shrink-0">{label}</span>
      <span className="flex-1 font-semibold text-brand-dark">{value}</span>
      <button type="button" onClick={() => onEdit(step)} className="text-xs font-semibold text-brand-blue hover:underline">Endre</button>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-brand-dark">Kontroller og send forespørsel</h2>
        <p className="text-sm text-gray-500 mt-1">Se over at alt stemmer, og fyll inn kontaktinformasjon.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl px-5 divide-y divide-gray-100">
        <Line step={0} label="Rute" value={
          <>
            {shortAddr(state.from)} → {shortAddr(state.to)}
            {state.stops.filter(s => s.lat).length > 0 && (
              <span className="block text-xs font-normal text-gray-500">
                Via {state.stops.filter(s => s.lat).map(s => `${shortAddr(s)} (${s.pause} min)`).join(', ')}
              </span>
            )}
            {state.tripType === 'return' && (state.returnStops || []).filter(s => s.lat).length > 0 && (
              <span className="block text-xs font-normal text-gray-500">
                Retur via {(state.returnStops || []).filter(s => s.lat).map(s => `${shortAddr(s)} (${s.pause} min)`).join(', ')}
              </span>
            )}
            {auto.route && <span className="block text-xs font-normal text-gray-500">{km} km {state.tripType === 'return' ? 'tur/retur' : 'enveis'} · ca. {fmtMin(auto.route.duration)} hver vei</span>}
          </>
        } />
        <Line step={1} label={state.tripType === 'return' ? 'Utreise' : 'Dato'} value={`${fmtDate(state.date, { day: 'numeric', month: 'long', year: 'numeric' })} kl. ${state.time}`} />
        {state.tripType === 'return' && (
          <Line step={1} label="Retur" value={`${fmtDate(state.returnDate, { day: 'numeric', month: 'long', year: 'numeric' })} kl. ${state.returnTime}`} />
        )}
        <Line step={1} label="Reisende" value={`${state.passengers} personer${state.busCount > 1 ? ` · ${state.busCount} busser` : ''}`} />
        {(state.busOnStay || state.needsTrailer || state.needsWheelchair) && (
          <Line step={1} label="Ønsker" value={[
            state.busOnStay && 'Buss under oppholdet', state.needsTrailer && 'Tilhenger', state.needsWheelchair && 'Rullestolplass',
          ].filter(Boolean).join(', ')} />
        )}
        <Line step={2} label="Busstype" value={category?.name || '–'} />
        {state.extras?.length > 0 && (
          <Line step={2} label="Tillegg" value={EXTRAS.filter(e => state.extras.includes(e.id)).map(e => e.label).join(', ')} />
        )}
        {price && (
          <div className="flex items-baseline justify-between py-3">
            <span className="text-sm text-gray-500">Estimert pris inkl. mva</span>
            <span className="text-2xl font-black text-brand-dark tabular-nums">{fmtKr(price.total)}</span>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-500 leading-relaxed -mt-3">
        {content?.priceDisclaimer || 'Dette er en estimert pris.'} Vi kontakter deg med et korrekt tilbud basert på opplysningene over.
      </p>

      <div>
        <p className="text-sm font-semibold text-brand-dark mb-3">Hvem bestiller?</p>
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 mb-4" role="radiogroup" aria-label="Kundetype">
          {[['org', 'Organisasjon'], ['private', 'Privat']].map(([t, label]) => (
            <button key={t} type="button" role="radio" aria-checked={state.customerType === t}
              onClick={() => setState(s => ({ ...s, customerType: t }))}
              className={`px-4 py-1.5 text-sm font-semibold rounded-md ${state.customerType === t ? 'bg-brand-blue text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {state.customerType === 'org' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input placeholder="Firmanavn" value={state.company || ''} className={inputCls}
                onChange={e => setState(s => ({ ...s, company: e.target.value }))} />
              <input placeholder="Org.nr." value={state.orgNr || ''} className={inputCls}
                onChange={e => setState(s => ({ ...s, orgNr: e.target.value }))} />
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {field('firstName', 'Fornavn *')}
            {field('lastName', 'Etternavn *')}
            {field('phone', 'Mobilnummer *', 'tel')}
            {field('email', 'E-postadresse *', 'email')}
          </div>
          <textarea placeholder="Merknad (valgfritt)" value={state.notes || ''} rows={3}
            onChange={e => setState(s => ({ ...s, notes: e.target.value }))} className={`${inputCls} resize-none`} />
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={state.acceptTerms}
              onChange={e => setState(s => ({ ...s, acceptTerms: e.target.checked }))} className="w-4 h-4 rounded accent-brand-blue" />
            <span>Jeg godkjenner <a href="/vilkar" target="_blank" rel="noopener noreferrer" className="text-brand-blue underline">vilkår og betingelser</a></span>
          </label>
        </div>

        {submitError && (
          <div role="alert" className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{submitError}</div>
        )}
        <button type="button" onClick={onSubmit} disabled={!canSubmit}
          className="w-full mt-5 flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-blue-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-lg text-sm transition-colors">
          {submitting && <Loader2 size={16} className="animate-spin" />}
          {submitting ? 'Sender…' : 'Send forespørsel'}
        </button>
      </div>
    </div>
  )
}

// ── Confirmation ───────────────────────────────────────────────────────────────
function SuccessView({ state, bookingRef, category, price, content }) {
  const phone = content?.phone
  const nextSteps = [
    ['Forespørselen er mottatt', `Bekreftelse sendes til ${state.email}.`],
    ['Vi sender deg et tilbud', 'En av våre medarbeidere kontakter deg innen 2 arbeidstimer.'],
    ['Du bekrefter og vi planlegger', 'Når du godtar tilbudet setter vi opp buss og sjåfør.'],
  ]
  return (
    <div className="max-w-xl mx-auto py-8">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={34} className="text-green-600" strokeWidth={1.75} />
        </div>
        <h2 className="text-3xl font-black text-brand-dark mb-2">Forespørsel sendt!</h2>
        <p className="text-gray-600">Takk, <strong>{state.firstName}</strong>.{bookingRef && ' Ta vare på referansenummeret ditt:'}</p>
        {bookingRef && (
          <div className="inline-block bg-brand-blue/10 text-brand-blue font-mono font-bold px-5 py-2.5 rounded-lg text-lg mt-4 select-all">
            {bookingRef}
          </div>
        )}
      </div>

      <ol className="mt-8 space-y-4">
        {nextSteps.map(([title, text], i) => (
          <li key={title} className="flex gap-3">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
              ${i === 0 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              {i === 0 ? <Check size={14} /> : i + 1}
            </span>
            <div><p className="text-sm font-semibold text-brand-dark">{title}</p><p className="text-sm text-gray-500">{text}</p></div>
          </li>
        ))}
      </ol>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mt-8 text-sm space-y-2">
        <div className="flex justify-between"><span className="text-gray-500">Rute</span><span className="font-semibold">{shortAddr(state.from)} → {shortAddr(state.to)}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">{state.tripType === 'return' ? 'Utreise' : 'Dato'}</span><span className="font-semibold">{fmtDate(state.date, { day: 'numeric', month: 'long', year: 'numeric' })} kl. {state.time}</span></div>
        {state.tripType === 'return' && state.returnDate && (
          <div className="flex justify-between"><span className="text-gray-500">Retur</span><span className="font-semibold">{fmtDate(state.returnDate, { day: 'numeric', month: 'long', year: 'numeric' })} kl. {state.returnTime}</span></div>
        )}
        <div className="flex justify-between"><span className="text-gray-500">Reisende</span><span className="font-semibold">{state.passengers}{state.busCount > 1 ? ` · ${state.busCount} busser` : ''}</span></div>
        {category && <div className="flex justify-between"><span className="text-gray-500">Busstype</span><span className="font-semibold">{category.name}</span></div>}
        {price && <div className="flex justify-between border-t border-gray-200 pt-2"><span className="text-gray-500">Estimert pris inkl. mva</span><span className="font-black">{fmtKr(price.total)}</span></div>}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
        {bookingRef && (
          <Link to={`/bestilling/${bookingRef}`}
            className="flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold px-6 py-3 rounded-lg text-sm transition-colors">
            Følg bestillingen <ArrowRight size={14} />
          </Link>
        )}
        {phone && (
          <a href={`tel:+47${phone.replace(/\s+/g, '')}`}
            className="flex items-center justify-center px-6 py-3 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
            Ring oss: {phone}
          </a>
        )}
        <Link to="/" className="flex items-center justify-center px-6 py-3 rounded-lg text-sm font-semibold text-gray-500 hover:text-brand-blue">
          Til forsiden
        </Link>
      </div>
    </div>
  )
}

// ── Main ────────────────────────────────────────────────────────────────────────
export default function BookingPage() {
  const { config } = useConfig()
  const { pricing, content } = config
  useSeo({
    title: 'Bestill bussreise',
    description: `Bestill buss med sjåfør. Velg rute, dato og busstype og send forespørsel til ${content?.brandNamePrimary || 'oss'}.`,
  })
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  useEffect(() => {
    api.getPriceCategories().then(cats => setCategories((cats || []).sort((a, b) => a.sortOrder - b.sortOrder))).catch(() => {})
  }, [])

  const [step, setStep] = useState(0)
  const [bookingRef, setBookingRef] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [state, setState] = useState({
    from: null, to: null, stops: [], returnStops: [],
    date: '', time: '12:00', returnDate: '', returnTime: '12:00',
    tripType: 'return', busOnStay: false,
    passengers: 1, busCount: 1, needsTrailer: false, needsWheelchair: false,
    selectedCategory: null, selectedCategoryName: '', extras: [],
    customerType: 'org', company: '', orgNr: '',
    firstName: '', lastName: '', phone: '', email: '', notes: '', acceptTerms: false,
  })

  const auto = useAutoRoute(state)
  const km = auto.route ? Math.round(auto.route.distance / 1000 * (state.tripType === 'return' ? 2 : 1)) : 0

  const recommended = useMemo(
    () => recommendCategory(categories, state.passengers, state.busCount),
    [categories, state.passengers, state.busCount],
  )
  // Preselect the recommendation when entering the bus step so the user starts from a sensible default.
  useEffect(() => {
    if (step === 2 && !state.selectedCategory && recommended) {
      setState(s => ({ ...s, selectedCategory: recommended.id, selectedCategoryName: recommended.name }))
    }
  }, [step, recommended, state.selectedCategory])

  const category = categories.find(c => c.id === state.selectedCategory) || null
  const priceForCategory = (cat) => km
    ? calcTripPrice({ ...pricing, kmRate: cat.kmRate, hourRate: cat.hourRate },
      { km: state.tripType === 'return' ? Math.round(km / 2) : km, departureTime: state.time, tripType: state.tripType, busOnStay: state.busOnStay })
    : null
  const perBus = category ? priceForCategory(category) : null
  const busCount = state.busCount || 1
  const price = perBus ? { base: perBus.base * busCount, vat: perBus.vat * busCount, total: perBus.total * busCount } : null

  const canNext = () => {
    if (step === 0) return hasCoords(state.from) && hasCoords(state.to) && auto.status !== 'loading'
    if (step === 1) return !!state.date && state.passengers >= 1 && (state.tripType !== 'return' || !!state.returnDate)
    if (step === 2) return !!state.selectedCategory
    return false
  }

  const direction = useRef('forward')
  const goTo = (i) => { direction.current = i < step ? 'back' : 'forward'; setStep(i); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  const handleSubmit = async () => {
    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await api.createBooking({
        fromAddress: state.from?.address || '',
        toAddress: state.to?.address || '',
        stops: [
          ...state.stops.filter(s => s.lat).map(s => s.address),
          ...(state.tripType === 'return' ? (state.returnStops || []).filter(s => s.lat).map(s => `[Retur] ${s.address}`) : []),
        ],
        departureDate: state.date ? new Date(state.date).toISOString() : new Date().toISOString(),
        departureTime: state.time || '12:00',
        tripType: state.tripType,
        returnDate: state.returnDate ? new Date(state.returnDate).toISOString() : null,
        returnTime: state.returnTime || null,
        busOnStay: state.busOnStay,
        stayDurationHours: state.stayDurationHours || null,
        busId: null,
        busName: category?.name || state.selectedCategoryName || '',
        passengers: state.passengers,
        busCount,
        needsTrailer: state.needsTrailer,
        needsWheelchair: state.needsWheelchair,
        selectedExtras: state.extras || [],
        estimatedBase: price?.base || 0,
        estimatedVat: price?.vat || 0,
        estimatedTotal: price?.total || 0,
        distanceKm: km,
        customerType: state.customerType,
        contactName: `${state.firstName} ${state.lastName}`.trim(),
        contactEmail: state.email,
        contactPhone: state.phone,
        orgName: state.company || null,
        orgNumber: state.orgNr || null,
        message: state.notes || null,
      })
      setBookingRef(res?.reference || '')
      setSubmitted(true)
    } catch (err) {
      if (err?.status === 409) setSubmitError('Denne bussen er allerede bekreftet booket på den valgte datoen. Gå tilbake og velg en annen dato eller busstype.')
      else if (err?.status === 429) setSubmitError('For mange forespørsler. Vent litt og prøv igjen.')
      else setSubmitError(`Noe gikk galt, og forespørselen ble ikke sendt.${content?.phone ? ` Prøv igjen, eller ring oss på ${content.phone}.` : ' Prøv igjen om litt.'}`)
    }
    setSubmitting(false)
  }

  const done = submitted

  return (
    <div className="min-h-screen bg-gray-50">
      {!done && (
        <div className="bg-brand-dark text-white pt-12">
          <ol className="max-w-5xl mx-auto px-4 flex items-center gap-2 py-4 overflow-x-auto">
            {STEPS.map((s, i) => (
              <li key={s} className="flex items-center gap-2 flex-shrink-0">
                <button type="button" disabled={i > step} onClick={() => goTo(i)} aria-current={i === step ? 'step' : undefined}
                  className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider whitespace-nowrap
                    ${i === step ? 'text-white' : i < step ? 'text-gray-300 hover:text-white' : 'text-gray-600'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px]
                    ${i === step ? 'bg-brand-blue text-white' : i < step ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
                    {i < step ? <Check size={11} /> : i + 1}
                  </span>
                  {s}
                </button>
                {i < STEPS.length - 1 && <span className={`h-px w-6 sm:w-12 ${i < step ? 'bg-green-600' : 'bg-gray-700'}`} />}
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className={`max-w-5xl mx-auto px-4 py-8 ${done ? 'pt-16' : price ? 'pb-24 lg:pb-8' : ''}`}>
        {done ? (
          <SuccessView state={state} bookingRef={bookingRef} category={category} price={price} content={content} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
            <div className="min-w-0">
              <button type="button" onClick={() => step === 0 ? navigate('/') : goTo(step - 1)}
                className="text-sm text-gray-500 hover:text-brand-blue flex items-center gap-1 mb-4">
                <ChevronLeft size={14} /> {step === 0 ? 'Tilbake til forsiden' : 'Tilbake'}
              </button>

              <div key={step} className={`animate-in fade-in ${direction.current === 'back' ? 'slide-in-from-left-4' : 'slide-in-from-right-4'}`}>
                {step === 0 && <RouteStep state={state} setState={setState} auto={auto} km={km} />}
                {step === 1 && <WhenStep state={state} setState={setState} />}
                {step === 2 && <BusStep state={state} setState={setState} categories={categories} recommended={recommended} priceFor={priceForCategory} />}
                {step === 3 && (
                  <ReviewStep state={state} setState={setState} auto={auto} km={km} category={category} price={price}
                    content={content} onEdit={goTo} onSubmit={handleSubmit} submitting={submitting} submitError={submitError} />
                )}
              </div>

              {step < 3 && (
                <div className={`flex justify-end mt-8 ${price ? 'hidden lg:flex' : ''}`}>
                  <button type="button" onClick={() => goTo(step + 1)} disabled={!canNext()}
                    className="flex items-center justify-center gap-2 w-full sm:w-auto bg-brand-blue hover:bg-brand-blue-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-8 py-3 rounded-lg text-sm transition-colors">
                    Neste <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>

            <TripSummary state={state} routeStatus={auto.status} route={auto.route} km={km} category={category} price={price}
              className="hidden lg:block lg:sticky lg:top-6" />
            <MobileSummaryBar action={step < 3 ? { label: 'Neste', onClick: () => goTo(step + 1), disabled: !canNext() } : null} state={state} routeStatus={auto.status} route={auto.route} km={km} category={category} price={price} />
          </div>
        )}

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs text-gray-400">
          <span>✓ Uforpliktende tilbud</span>
          <span>✓ Svar innen 2 arbeidstimer</span>
          {content?.brandNamePrimary && <span>✓ {content.brandNamePrimary} {content.brandNameSecondary}</span>}
        </div>
      </div>
    </div>
  )
}
