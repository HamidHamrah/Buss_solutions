import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import {
  Calendar, Clock, Users, ChevronRight, ChevronLeft,
  Plus, X, Minus, Wifi, Wind, Utensils, Zap, Bath, CheckCircle,
  AlertCircle, ArrowRight, Shield,
} from 'lucide-react'
import { useConfig } from '../contexts/ConfigContext'
import { api } from '../services/api'
import { useSeo } from '../hooks/useSeo'
import AddressInput from '../components/AddressInput'
import { calcPrice, fmtKr, fmtMin, calcRouteDistance } from '../utils/bookingHelpers'
import { calcTripPrice } from '../services/config'

// Map amenity string → icon
const AMENITY_ICONS = {
  Wifi, Klimaanlegg: Wind, Kjøkken: Utensils, '220 Volt': Zap, WC: Bath,
  'TV/DVD': Zap, Mikrofon: Zap, 'DAB Radio': Zap, Bagasjerom: Users,
  Tilhengerfeste: Users, Rullestolvennlig: Users,
}

const STEPS = ['Søk reise', 'Velg busstype', 'Tilleggs tjenester', 'Send forespørsel']

// ── Leaflet icon fix ────────────────────────────────────────────────────────────
const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41],
})

// ── Step 1 ─────────────────────────────────────────────────────────────────────
function Step1({ state, setState, onCalcRoute, routeData, loading }) {
  const addStop = () => setState(s => ({ ...s, stops: [...s.stops, { address: '', lat: null, lon: null, pause: 30 }] }))
  const removeStop = (i) => setState(s => ({ ...s, stops: s.stops.filter((_, idx) => idx !== i) }))
  const updateStop = (i, field, val) => setState(s => ({
    ...s, stops: s.stops.map((st, idx) => idx === i ? { ...st, [field]: val } : st)
  }))
  const addReturnStop = () => setState(s => ({ ...s, returnStops: [...(s.returnStops || []), { address: '', lat: null, lon: null, pause: 30 }] }))
  const removeReturnStop = (i) => setState(s => ({ ...s, returnStops: (s.returnStops || []).filter((_, idx) => idx !== i) }))
  const updateReturnStop = (i, field, val) => setState(s => ({
    ...s, returnStops: (s.returnStops || []).map((st, idx) => idx === i ? { ...st, [field]: val } : st)
  }))

  return (
    <div className="space-y-6">
      {/* Route */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl font-bold text-brand-dark">Beregn pris</h2>
          {routeData && (
            <span className="text-sm text-gray-500 font-medium">
              {state.tripType === 'return' ? 'Tur/retur' : 'Enveis'}{' '}
              <strong>{Math.round(routeData.distance / 1000 * (state.tripType === 'return' ? 2 : 1))} Km</strong>
            </span>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AddressInput
              label="Reise fra"
              value={state.from}
              placeholder="f.eks. Fosseikeland, Norge"
              onChange={v => setState(s => ({ ...s, from: v }))}
            />
            <AddressInput
              label="Reise til"
              value={state.to}
              placeholder="f.eks. Oslo, Norge"
              onChange={v => setState(s => ({ ...s, to: v }))}
            />
          </div>

          {/* Stops outbound */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-2">Legg til stopp/pause</p>
              {state.stops.map((stop, i) => (
                <div key={i} className="flex gap-2 mb-2 items-center">
                  <div className="flex-1 relative">
                    <AddressInput
                      label=""
                      value={stop}
                      placeholder="Stopested..."
                      onChange={v => setState(s => ({
                        ...s,
                        stops: s.stops.map((st, idx) => idx === i ? { ...st, address: v.address, lat: v.lat, lon: v.lon } : st)
                      }))}
                    />
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={stop.pause}
                    onChange={e => updateStop(i, 'pause', e.target.value)}
                    className="w-16 px-2 py-3 bg-orange-50 border border-orange-200 rounded-xl text-sm text-center font-medium"
                    title="Pausetid (min)"
                  />
                  <button onClick={() => removeStop(i)} className="text-gray-400 hover:text-red-500">
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button
                onClick={addStop}
                className="flex items-center gap-2 text-sm text-white bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg w-full justify-center"
              >
                <Plus size={14} /> Legg til stopp
              </button>
            </div>
            <div className={state.tripType !== 'return' ? 'opacity-40 pointer-events-none' : ''}>
              <p className="text-xs text-gray-400 mb-2">Legg til stopp/pause på retur reise</p>
              {(state.returnStops || []).map((stop, i) => (
                <div key={i} className="flex gap-2 mb-2 items-center">
                  <div className="flex-1 relative">
                    <AddressInput
                      label=""
                      value={stop}
                      placeholder="Stopested..."
                      onChange={v => updateReturnStop(i, 'address', v.address) || setState(s => ({
                        ...s, returnStops: (s.returnStops || []).map((st, idx) => idx === i ? { ...st, address: v.address, lat: v.lat, lon: v.lon } : st)
                      }))}
                    />
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={stop.pause}
                    onChange={e => updateReturnStop(i, 'pause', e.target.value)}
                    className="w-16 px-2 py-3 bg-orange-50 border border-orange-200 rounded-xl text-sm text-center font-medium"
                    title="Pausetid (min)"
                  />
                  <button onClick={() => removeReturnStop(i)} className="text-gray-400 hover:text-red-500">
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button
                onClick={addReturnStop}
                className="flex items-center gap-2 text-sm text-white bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg w-full justify-center"
              >
                <Plus size={14} /> Legg til stopp
              </button>
            </div>
          </div>

          <button
            onClick={onCalcRoute}
            disabled={!state.from?.lat || !state.to?.lat || loading}
            className="w-full bg-brand-blue hover:bg-brand-blue-dark disabled:opacity-40 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            {loading ? 'Beregner rute...' : 'Beregn distanse'}
          </button>
        </div>
      </div>

      {/* When */}
      <div>
        <h2 className="text-2xl font-bold text-brand-dark mb-3">Når vil du reise?</h2>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
          <div className="flex gap-6">
            {['return', 'oneway'].map(t => (
              <label key={t} className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => setState(s => ({ ...s, tripType: t }))}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors
                    ${state.tripType === t ? 'border-brand-blue bg-brand-blue' : 'border-gray-300'}`}
                >
                  {state.tripType === t && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <span className="text-sm font-medium">{t === 'return' ? 'Tur/retur' : 'En vei'}</span>
              </label>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1"><Calendar size={12} className="inline mr-1" /> Utreise</label>
              <input type="date" value={state.date}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setState(s => ({ ...s, date: e.target.value }))}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1"><Clock size={12} className="inline mr-1" /> Tid</label>
              <input type="time" value={state.time}
                onChange={e => setState(s => ({ ...s, time: e.target.value }))}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
            </div>
            {state.tripType === 'return' && <>
              <div>
                <label className="block text-xs text-gray-500 mb-1"><Calendar size={12} className="inline mr-1" /> Retur</label>
                <input type="date" value={state.returnDate}
                  min={state.date || new Date().toISOString().split('T')[0]}
                  onChange={e => setState(s => ({ ...s, returnDate: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1"><Clock size={12} className="inline mr-1" /> Tid</label>
                <input type="time" value={state.returnTime}
                  onChange={e => setState(s => ({ ...s, returnTime: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
              </div>
            </>}
          </div>

          <div className="flex gap-6 text-sm text-gray-600">
            {['Avgang', 'Ankomst'].map(t => (
              <label key={t} className="flex items-center gap-2 cursor-pointer">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${t === 'Avgang' ? 'border-brand-blue bg-brand-blue' : 'border-gray-300'}`}>
                  {t === 'Avgang' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
                {t}
              </label>
            ))}
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={state.busOnStay}
              onChange={e => setState(s => ({ ...s, busOnStay: e.target.checked }))}
              className="w-4 h-4 rounded" />
            Buss tilgjengelig under oppholdet
          </label>
        </div>
      </div>
    </div>
  )
}

// ── Step 2 ─────────────────────────────────────────────────────────────────────
function Step2({ state, setState, routeData, categories, pricing }) {
  const km = routeData ? Math.round(routeData.distance / 1000 * (state.tripType === 'return' ? 2 : 1)) : null

  return (
    <div className="space-y-6">
      {/* Passengers */}
      <div>
        <h2 className="text-2xl font-bold text-brand-dark mb-3">Reisedetaljer</h2>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <p className="text-sm font-semibold text-brand-dark mb-3">Antall reisende</p>
              <div className="flex items-center gap-3">
                <button onClick={() => setState(s => ({ ...s, passengers: Math.max(1, s.passengers - 1) }))}
                  className="w-10 h-10 rounded-lg bg-brand-dark text-white flex items-center justify-center hover:bg-gray-700 font-bold text-lg flex-shrink-0">
                  <Minus size={16} />
                </button>
                <input
                  type="number" min="1" max="1000"
                  value={state.passengers}
                  onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 1) setState(s => ({ ...s, passengers: v })) }}
                  className="w-20 text-center text-xl font-bold border border-gray-200 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
                <button onClick={() => setState(s => ({ ...s, passengers: s.passengers + 1 }))}
                  className="w-10 h-10 rounded-lg bg-brand-dark text-white flex items-center justify-center hover:bg-gray-700 font-bold text-lg flex-shrink-0">
                  <Plus size={16} />
                </button>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-dark mb-3">Antall busser</p>
              <div className="flex items-center gap-3">
                <button onClick={() => setState(s => ({ ...s, busCount: Math.max(1, s.busCount - 1) }))}
                  className="w-10 h-10 rounded-lg bg-brand-dark text-white flex items-center justify-center hover:bg-gray-700 font-bold text-lg flex-shrink-0">
                  <Minus size={16} />
                </button>
                <input
                  type="number" min="1" max="50"
                  value={state.busCount}
                  onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 1) setState(s => ({ ...s, busCount: v })) }}
                  className="w-20 text-center text-xl font-bold border border-gray-200 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
                <button onClick={() => setState(s => ({ ...s, busCount: s.busCount + 1 }))}
                  className="w-10 h-10 rounded-lg bg-brand-dark text-white flex items-center justify-center hover:bg-gray-700 font-bold text-lg flex-shrink-0">
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-brand-dark mb-3">Spesielle behov</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-4 py-3 rounded-xl cursor-pointer">
                <input type="checkbox" checked={state.needsTrailer}
                  onChange={e => setState(s => ({ ...s, needsTrailer: e.target.checked }))}
                  className="w-4 h-4 rounded" />
                Trenger du tilhenger?
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-4 py-3 rounded-xl cursor-pointer">
                <input type="checkbox" checked={state.needsWheelchair}
                  onChange={e => setState(s => ({ ...s, needsWheelchair: e.target.checked }))}
                  className="w-4 h-4 rounded" />
                Behov for rullestol? (Maks 1)
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Bus type selection */}
      <div>
        <h3 className="text-sm font-semibold text-brand-dark mb-3 uppercase tracking-wider">Velg busstype</h3>
        <p className="text-sm text-gray-500 mb-4">Velg busstype som passer for reisen din. Vår sjåfør tildeler den beste tilgjengelige bussen.</p>
        {categories.length === 0 && (
          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center text-gray-400">
            <p className="font-medium mb-1">Ingen busstyper tilgjengelig</p>
            <p className="text-sm">Kontakt oss på <a href="tel:+4795453807" className="text-brand-blue hover:underline">95 45 38 07</a> for å reservere.</p>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {categories.map(cat => {
            const effectivePricing = { ...pricing, kmRate: cat.kmRate, hourRate: cat.hourRate }
            const price = km ? calcTripPrice(effectivePricing, { km, departureTime: state.time, tripType: state.tripType, busOnStay: state.busOnStay }) : null
            const selected = state.selectedCategory === cat.id
            const isMinibuss = cat.name.toLowerCase().includes('mini')
            return (
              <div key={cat.id}
                onClick={() => setState(s => ({ ...s, selectedCategory: cat.id, selectedCategoryName: cat.name }))}
                className={`border-2 rounded-2xl overflow-hidden transition-all cursor-pointer
                  ${selected ? 'border-brand-blue shadow-md' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className={`px-5 py-3 flex items-center justify-between ${selected ? 'bg-brand-blue-pale' : 'bg-gray-50'}`}>
                  <span className="font-bold text-brand-dark">{cat.name}</span>
                  {price && (
                    <span className="text-right">
                      <span className="text-xs text-gray-400">Fra </span>
                      <span className="text-lg font-black text-brand-dark">{(price.base * (state.busCount || 1)).toLocaleString('nb-NO')},-</span>
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-brand-blue/10 flex items-center justify-center text-2xl">
                      {isMinibuss ? '🚐' : '🚌'}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">
                        {isMinibuss ? 'Passer for mindre grupper' : 'Passer for større grupper'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {isMinibuss ? 'Opp til ca. 20 passasjerer' : 'Opp til ca. 60 passasjerer'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5"><Wifi size={12} className="text-brand-blue" /> Wi-Fi ombord</div>
                    <div className="flex items-center gap-1.5"><Users size={12} className="text-brand-blue" /> Erfaren sjåfør</div>
                    <div className="flex items-center gap-1.5"><Zap size={12} className="text-brand-blue" /> Klimaanlegg</div>
                    <div className="flex items-center gap-1.5"><Shield size={12} className="text-brand-blue" /> Forsikret</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Step 3 ─────────────────────────────────────────────────────────────────────
function Step3({ state, setState }) {
  const extras = [
    { id: 'guide', label: 'Reiseguide / vertinne', price: 1500 },
    { id: 'wifi', label: 'Ekstra Wi-Fi-enhet', price: 500 },
    { id: 'drinks', label: 'Drikkevarer ombord', price: 800 },
    { id: 'luggage', label: 'Ekstra bagasjetjeneste', price: 400 },
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold text-brand-dark mb-2">Tilleggstjenester</h2>
      <p className="text-sm text-gray-500 mb-5">Legg til ekstra tjenester for en bedre reiseopplevelse</p>
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
        {extras.map(e => (
          <label key={e.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-brand-blue-pale transition-colors">
            <div className="flex items-center gap-3">
              <input type="checkbox"
                checked={state.extras?.includes(e.id)}
                onChange={ev => setState(s => ({
                  ...s,
                  extras: ev.target.checked
                    ? [...(s.extras || []), e.id]
                    : (s.extras || []).filter(x => x !== e.id)
                }))}
                className="w-4 h-4 rounded accent-brand-blue" />
              <span className="text-sm font-medium text-brand-dark">{e.label}</span>
            </div>
            <span className="text-sm font-semibold text-brand-blue">+ {e.price.toLocaleString('nb-NO')} kr</span>
          </label>
        ))}
      </div>
    </div>
  )
}

// ── Step 4 ─────────────────────────────────────────────────────────────────────
function Step4({ state, setState, routeData, submitted, bookingRef, onSubmit, submitError, categories, pricing, content }) {
  const [touched, setTouched] = useState({})
  const selectedCat = categories.find(c => c.id === state.selectedCategory)
  const km = routeData ? Math.round(routeData.distance / 1000 * (state.tripType === 'return' ? 2 : 1)) : 0
  const price = selectedCat && km ? calcTripPrice(
    { ...pricing, kmRate: selectedCat.kmRate, hourRate: selectedCat.hourRate },
    { km, departureTime: state.time, tripType: state.tripType, busOnStay: state.busOnStay }
  ) : null
  const routeCoords = routeData?.geometry?.coordinates?.map(([lon, lat]) => [lat, lon]) || []
  const center = routeCoords[Math.floor(routeCoords.length / 2)] || [63.4, 10.4]

  const touch = (field) => setTouched(t => ({ ...t, [field]: true }))
  const emailValid = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
  const fieldError = (field) => {
    if (!touched[field]) return null
    if (field === 'email') return !state.email ? 'E-post er påkrevd' : !emailValid(state.email) ? 'Ugyldig e-postadresse' : null
    if (field === 'firstName') return !state.firstName ? 'Fornavn er påkrevd' : null
    if (field === 'lastName') return !state.lastName ? 'Etternavn er påkrevd' : null
    if (field === 'phone') return !state.phone ? 'Mobilnummer er påkrevd' : null
    return null
  }
  const inputClass = (field) => `px-4 py-3 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 w-full ${fieldError(field) ? 'border-red-400 bg-red-50' : 'border-gray-200'}`

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-500" strokeWidth={1.5} />
        </div>
        <h2 className="text-3xl font-black text-brand-dark mb-3">Forespørsel sendt!</h2>
        {bookingRef && (
          <div className="inline-flex items-center gap-2 bg-brand-blue/10 text-brand-blue font-mono font-bold px-5 py-2.5 rounded-full text-sm mb-6">
            Referansenr: {bookingRef}
          </div>
        )}
        <p className="text-brand-gray mb-2">
          Takk, <strong>{state.firstName}</strong>! Vi har mottatt din forespørsel og sender deg en bekreftelse på{' '}
          <strong>{state.email}</strong>.
        </p>
        <p className="text-brand-gray mb-8">
          En av våre medarbeidere kontakter deg innen <strong>2 arbeidstimer</strong> med et bindende tilbud.
        </p>
        <div className="bg-gray-50 rounded-2xl p-6 text-left space-y-3 mb-8 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Fra</span>
            <span className="font-semibold text-brand-dark">{state.from?.address?.split(',')[0]}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Til</span>
            <span className="font-semibold text-brand-dark">{state.to?.address?.split(',')[0]}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{state.tripType === 'return' ? 'Utreise' : 'Dato'}</span>
            <span className="font-semibold text-brand-dark">
              {state.date ? new Date(state.date).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' }) : '–'} kl. {state.time}
            </span>
          </div>
          {state.tripType === 'return' && state.returnDate && (
            <div className="flex justify-between">
              <span className="text-gray-500">Retur</span>
              <span className="font-semibold text-brand-dark">
                {new Date(state.returnDate).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' })} kl. {state.returnTime || '12:00'}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Reisende</span>
            <span className="font-semibold text-brand-dark">{state.passengers} personer</span>
          </div>
          {state.busCount > 1 && (
            <div className="flex justify-between">
              <span className="text-gray-500">Antall busser</span>
              <span className="font-semibold text-brand-dark">{state.busCount} busser</span>
            </div>
          )}
          {selectedCat && (
            <div className="flex justify-between">
              <span className="text-gray-500">Busstype</span>
              <span className="font-semibold text-brand-dark">{selectedCat.name}</span>
            </div>
          )}
          {price && (
            <div className="flex justify-between border-t border-gray-200 pt-3 mt-1">
              <span className="text-gray-500">Estimert pris inkl. mva</span>
              <span className="font-black text-brand-dark">{fmtKr(price.total)}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="tel:+4795453807"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
            Ring oss: 95 45 38 07
          </a>
          {bookingRef && (
            <a href={`/bestilling/${bookingRef}`}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-brand-blue text-brand-blue font-bold text-sm hover:bg-brand-blue/5 transition-colors">
              Se bestillingsstatus <ArrowRight size={13} />
            </a>
          )}
          <a href="/"
            className="flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold px-6 py-3 rounded-full text-sm transition-all">
            Tilbake til forsiden <ArrowRight size={13} />
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Price summary */}
      {price && (
        <div>
          <h2 className="text-2xl font-bold text-brand-dark mb-3">Estimert pris på buss</h2>
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
            <div className="grid grid-cols-3 gap-4 text-center border-b border-green-200 pb-4 mb-4">
              {[
                ['ESTIMERT PRIS (U/MOMS)', fmtKr(price.base)],
                ['12% MOMS', fmtKr(price.vat)],
                ['TOTALT', fmtKr(price.total)],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                  <p className={`font-black text-brand-dark ${label === 'TOTALT' ? 'text-lg' : 'text-base'}`}>{val}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Route summary */}
      {routeData && (
        <div>
          <h2 className="text-2xl font-bold text-brand-dark mb-3">Kontroller forespørsel</h2>
          <div className="space-y-3">
            {/* Outbound */}
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
              <h3 className="font-bold text-lg text-brand-dark mb-3 flex items-center gap-2">
                {state.from?.address?.split(',')[0]} <ArrowRight size={16} /> {state.to?.address?.split(',')[0]}
              </h3>
              {state.stops.length > 0 && (
                <div className="flex justify-between text-sm mb-3 pb-3 border-b border-green-200">
                  <div>
                    <p className="text-gray-400 text-xs uppercase mb-1">Via</p>
                    {state.stops.map((s, i) => <p key={i} className="text-gray-700">{s.address}</p>)}
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-xs uppercase mb-1">Pause</p>
                    {state.stops.map((s, i) => <p key={i} className="text-gray-700">{s.pause} min</p>)}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                {[
                  ['AVGANGSTID', state.date && state.time ? `${new Date(state.date).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' })} Kl. ${state.time}` : '–'],
                  ['TID (ENKEL TUR)', fmtMin(routeData.duration)],
                  ['ANKOMSTTID', '–'],
                  ['ANTALL KM (ENKEL TUR)', `${Math.round(routeData.distance / 1000)} Km`],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                    <p className="font-semibold text-brand-dark">{val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Return leg */}
            {state.tripType === 'return' && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
                <h3 className="font-bold text-lg text-brand-dark mb-3 flex items-center gap-2">
                  {state.to?.address?.split(',')[0]} <ArrowRight size={16} /> {state.from?.address?.split(',')[0]}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  {[
                    ['AVGANGSTID', state.returnDate && state.returnTime ? `${new Date(state.returnDate).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' })} Kl. ${state.returnTime}` : '–'],
                    ['TID (ENKEL TUR)', fmtMin(routeData.duration)],
                    ['ANKOMSTTID', '–'],
                    ['ANTALL KM (ENKEL TUR)', `${Math.round(routeData.distance / 1000)} Km`],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                      <p className="font-semibold text-brand-dark">{val}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Map */}
          {routeCoords.length > 1 && (
            <div className="mt-4 rounded-2xl overflow-hidden h-52 sm:h-96 border border-gray-200">
              <MapContainer center={center} zoom={7} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  attribution='© OpenStreetMap contributors' />
                <Polyline positions={routeCoords} color="#E8621A" weight={4} />
                <Marker position={routeCoords[0]} icon={markerIcon}>
                  <Popup>{state.from?.address?.split(',')[0]}</Popup>
                </Marker>
                <Marker position={routeCoords[routeCoords.length - 1]} icon={markerIcon}>
                  <Popup>{state.to?.address?.split(',')[0]}</Popup>
                </Marker>
              </MapContainer>
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div>
        <h2 className="text-3xl font-black text-brand-dark">Dette er en estimert pris.</h2>
        <p className="text-sm text-gray-500 mt-3 leading-relaxed">
          {content?.priceDisclaimer || 'Prisen forutsetter at turen starter, slutter eller er innom Jæren-området med ca. 30 km radius.'}
        </p>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          En av våre servicemedarbeidere tar kontakt med deg for et godt og korrekt tilbud basert på de beregningene som er lagt inn.
        </p>
      </div>

      {/* Contact form */}
      <div>
        <p className="text-sm font-semibold text-brand-dark mb-4">Fyll ut informasjonen din:</p>

        {/* Type toggle */}
        <div className="flex gap-6 mb-5">
          {['org', 'private'].map(t => (
            <label key={t} className="flex items-center gap-2 cursor-pointer">
              <div onClick={() => setState(s => ({ ...s, customerType: t }))}
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors
                  ${state.customerType === t ? 'border-brand-blue bg-brand-blue' : 'border-gray-300'}`}>
                {state.customerType === t && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              <span className="text-sm font-medium">{t === 'org' ? 'Organisjon' : 'Privat'}</span>
            </label>
          ))}
        </div>

        <div className="space-y-3">
          {state.customerType === 'org' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input placeholder="Firmanavn" value={state.company || ''}
                onChange={e => setState(s => ({ ...s, company: e.target.value }))}
                className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
              <input placeholder="Org.Nr." value={state.orgNr || ''}
                onChange={e => setState(s => ({ ...s, orgNr: e.target.value }))}
                className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <input placeholder="Fornavn *" value={state.firstName || ''}
                onChange={e => setState(s => ({ ...s, firstName: e.target.value }))}
                onBlur={() => touch('firstName')}
                className={inputClass('firstName')} />
              {fieldError('firstName') && <p className="mt-1 text-xs text-red-500">{fieldError('firstName')}</p>}
            </div>
            <div>
              <input placeholder="Etternavn *" value={state.lastName || ''}
                onChange={e => setState(s => ({ ...s, lastName: e.target.value }))}
                onBlur={() => touch('lastName')}
                className={inputClass('lastName')} />
              {fieldError('lastName') && <p className="mt-1 text-xs text-red-500">{fieldError('lastName')}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <input placeholder="Mobilnummer *" value={state.phone || ''}
                onChange={e => setState(s => ({ ...s, phone: e.target.value }))}
                onBlur={() => touch('phone')}
                className={inputClass('phone')} />
              {fieldError('phone') && <p className="mt-1 text-xs text-red-500">{fieldError('phone')}</p>}
            </div>
            <div>
              <input placeholder="E-postadresse *" value={state.email || ''}
                onChange={e => setState(s => ({ ...s, email: e.target.value }))}
                onBlur={() => touch('email')}
                className={inputClass('email')} />
              {fieldError('email') && <p className="mt-1 text-xs text-red-500">{fieldError('email')}</p>}
            </div>
          </div>
          <textarea placeholder="Merknad" value={state.notes || ''}
            onChange={e => setState(s => ({ ...s, notes: e.target.value }))}
            rows={3}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 resize-none" />
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={state.acceptTerms || false}
              onChange={e => setState(s => ({ ...s, acceptTerms: e.target.checked }))}
              className="w-4 h-4 rounded" />
            Jeg godkjenner alle vilkår og{' '}
            <a href="/vilkar" target="_blank" rel="noopener noreferrer" className="text-brand-blue underline">betingelser</a>
          </label>
        </div>

        {submitError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {submitError}
          </div>
        )}
        <button
          onClick={onSubmit}
          disabled={!state.firstName || !state.lastName || !state.email || !state.phone || !state.acceptTerms}
          className="w-full mt-5 bg-brand-blue hover:bg-brand-blue-dark disabled:opacity-40 text-white font-black py-4 rounded-xl text-sm tracking-widest uppercase transition-colors"
        >
          Send forespørsel
        </button>
      </div>
    </div>
  )
}

// ── Main ────────────────────────────────────────────────────────────────────────
export default function BookingPage() {
  useSeo({
    title: 'Bestill bussreise',
    description: 'Bestill buss med sjåfør på Jæren. Fyll inn reiserute, velg busstype og send forespørsel. Rask og enkel booking hos Kjosavik Reiser AS.',
  })
  const navigate = useNavigate()
  const { config } = useConfig()
  const { pricing, content } = config
  const [categories, setCategories] = useState([])
  useEffect(() => {
    api.getPriceCategories().then(cats => setCategories((cats || []).sort((a, b) => a.sortOrder - b.sortOrder))).catch(() => {})
  }, [])
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [bookingRef, setBookingRef] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [routeData, setRouteData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [routeError, setRouteError] = useState(null)

  const [state, setState] = useState({
    from: null, to: null,
    stops: [],
    returnStops: [],
    date: '', time: '12:00',
    returnDate: '', returnTime: '12:00',
    tripType: 'return',
    busOnStay: false,
    passengers: 1,
    busCount: 1,
    needsTrailer: false,
    needsWheelchair: false,
    selectedCategory: null,
    selectedCategoryName: '',
    extras: [],
    customerType: 'org',
    company: '', orgNr: '',
    firstName: '', lastName: '', phone: '', email: '',
    notes: '', acceptTerms: false,
  })

  const calcRoute = async () => {
    if (!state.from?.lat || !state.to?.lat) return
    setLoading(true)
    setRouteError(null)
    try {
      const route = await calcRouteDistance(state.from, state.to, state.stops)
      setRouteData(route)
    } catch {
      setRouteError('Kunne ikke beregne ruten. Prøv igjen.')
    }
    setLoading(false)
  }

  const handleSubmit = async () => {
    const selectedCat = categories.find(c => c.id === state.selectedCategory)
    const km = routeData ? Math.round(routeData.distance / 1000 * (state.tripType === 'return' ? 2 : 1)) : 0
    const pricePerBus = selectedCat
      ? calcTripPrice({ ...pricing, kmRate: selectedCat.kmRate, hourRate: selectedCat.hourRate }, { km, departureTime: state.time, tripType: state.tripType, busOnStay: state.busOnStay })
      : { base: 0, vat: 0, total: 0 }
    const busCount = state.busCount || 1
    const price = { base: (pricePerBus?.base || 0) * busCount, vat: (pricePerBus?.vat || 0) * busCount, total: (pricePerBus?.total || 0) * busCount }
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
        busName: selectedCat?.name || state.selectedCategoryName || '',
        passengers: state.passengers,
        busCount: state.busCount || 1,
        needsTrailer: state.needsTrailer,
        needsWheelchair: state.needsWheelchair,
        selectedExtras: state.extras || [],
        estimatedBase: price.base,
        estimatedVat: price.vat,
        estimatedTotal: price.total,
        distanceKm: km,
        customerType: state.customerType,
        contactName: `${state.firstName} ${state.lastName}`.trim(),
        contactEmail: state.email,
        contactPhone: state.phone,
        orgName: state.company || null,
        orgNumber: state.orgNr || null,
        message: state.notes || null,
      })
      if (res?.reference) setBookingRef(res.reference)
      setSubmitted(true)
    } catch (err) {
      if (err?.status === 409) {
        setSubmitError('Denne bussen er allerede bekreftet booket på den valgte datoen. Gå tilbake og velg en annen dato eller busstype.')
      } else if (err?.status === 429) {
        setSubmitError('For mange forespørsler. Vent litt og prøv igjen.')
      } else {
        setSubmitted(true) // API down — still show confirmation to user
      }
    }
  }

  const canNext = () => {
    if (step === 0) return state.from?.lat && state.to?.lat && state.date
    if (step === 1) return !!state.selectedCategory
    if (step === 2) return true
    return false
  }

  const tabLabels = [
    { label: 'Avgang', icon: '→' },
    { label: 'Retur', icon: '←' },
    { label: 'Reiseinfo', icon: '📅' },
    { label: 'Estimert pris', icon: '✓' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress bar */}
      <div className="bg-brand-dark text-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-2 py-4 overflow-x-auto">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs font-bold uppercase tracking-widest whitespace-nowrap
                  ${i === step ? 'text-brand-blue' : i < step ? 'text-gray-400' : 'text-gray-600'}`}>
                  {i + 1}.{s}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={`h-px w-8 sm:w-16 mx-1 ${i < step ? 'bg-brand-blue' : 'bg-gray-700'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      {step > 0 && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 flex overflow-x-auto">
            <button onClick={() => setStep(0)} className="text-xs text-gray-500 px-4 py-3 hover:text-brand-blue border-r border-gray-100 whitespace-nowrap">
              Vis detaljer ↓
            </button>
            {tabLabels.map((t, i) => (
              <button key={t.label}
                onClick={() => i + 1 <= step && setStep(i + 1)}
                className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-r border-gray-100 transition-colors
                  ${i + 1 === step ? 'text-brand-blue border-b-2 border-brand-blue' : 'text-gray-500 hover:text-gray-700'}`}>
                {t.label} {t.icon}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-4">
          <button onClick={() => step === 0 ? navigate('/') : setStep(s => s - 1)}
            className="text-sm text-gray-500 hover:text-brand-blue flex items-center gap-1 mb-4">
            <ChevronLeft size={14} /> {step === 0 ? 'Tilbake til forsiden' : 'Tilbake'}
          </button>
        </div>

        {routeError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-600">
            <AlertCircle size={16} /> {routeError}
          </div>
        )}

        {step === 0 && <Step1 state={state} setState={setState} onCalcRoute={calcRoute} routeData={routeData} loading={loading} />}
        {step === 1 && <Step2 state={state} setState={setState} routeData={routeData} categories={categories} pricing={pricing} />}
        {step === 2 && <Step3 state={state} setState={setState} />}
        {step === 3 && <Step4 state={state} setState={setState} routeData={routeData} submitted={submitted} bookingRef={bookingRef} onSubmit={handleSubmit} submitError={submitError} categories={categories} pricing={pricing} content={content} />}

        {/* Nav buttons */}
        {step < 3 && !submitted && (
          <div className="flex justify-end mt-8">
            <button
              onClick={async () => {
                if (step === 0 && !routeData) await calcRoute()
                setStep(s => s + 1)
              }}
              disabled={!canNext() || loading}
              className="flex items-center justify-center gap-2 w-full sm:w-auto bg-brand-blue hover:bg-brand-blue-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-8 py-3.5 rounded-full text-sm transition-colors"
            >
              {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <ChevronRight size={16} />}
              Neste
            </button>
          </div>
        )}

        {/* Trust strip */}
        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-gray-400">
          <span>✓ Uforpliktende tilbud</span>
          <span>✓ Svar innen 2 timer</span>
          <span>✓ Kjosavik Reiser AS siden 2023</span>
        </div>
      </div>
    </div>
  )
}
