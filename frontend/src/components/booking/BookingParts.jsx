import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus, X, ArrowRight, Route as RouteIcon, Calendar, Users, Bus } from 'lucide-react'
import AddressInput from '../AddressInput'
import { fmtKr, fmtMin, fmtDate, shortAddr } from '../../utils/bookingHelpers'

// Collapsible section used to keep rarely-needed options out of the way of simple trips.
export function Disclosure({ title, hint, badge, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-gray-200 rounded-xl bg-white">
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left">
        <span>
          <span className="text-sm font-semibold text-brand-dark">{title}</span>
          {hint && <span className="block text-xs text-gray-400 mt-0.5">{hint}</span>}
        </span>
        <span className="flex items-center gap-2 flex-shrink-0">
          {badge > 0 && <span className="text-xs font-bold bg-brand-blue text-white rounded-full px-2 py-0.5">{badge}</span>}
          <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>
      {open && <div className="px-4 pb-4 pt-3 border-t border-gray-100 space-y-4">{children}</div>}
    </div>
  )
}

// Editable list of stops, each with a pause duration in minutes.
export function StopList({ label, stops, onChange }) {
  const update = (i, patch) => onChange(stops.map((s, idx) => idx === i ? { ...s, ...patch } : s))
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      {stops.map((stop, i) => (
        <div key={i} className="flex gap-2 mb-2 items-end">
          <div className="flex-1">
            <AddressInput label="" value={stop} placeholder="Stoppested…"
              onChange={v => update(i, { address: v.address, lat: v.lat, lon: v.lon })} />
          </div>
          <label className="flex flex-col items-center">
            <span className="text-[10px] text-gray-400 mb-0.5">Pause (min)</span>
            <input type="number" min="0" value={stop.pause}
              onChange={e => update(i, { pause: e.target.value })}
              className="w-16 px-2 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-center font-medium" />
          </label>
          <button type="button" aria-label="Fjern stopp" onClick={() => onChange(stops.filter((_, idx) => idx !== i))}
            className="p-3 text-gray-400 hover:text-red-500"><X size={16} /></button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...stops, { address: '', lat: null, lon: null, pause: 30 }])}
        className="flex items-center gap-1.5 text-sm font-semibold text-brand-blue hover:text-brand-blue-dark">
        <Plus size={14} /> Legg til stopp
      </button>
    </div>
  )
}

function Row({ icon: Icon, children }) {
  return (
    <div className="flex gap-3 text-sm">
      <Icon size={15} className="text-brand-blue mt-0.5 flex-shrink-0" />
      <div className="min-w-0 text-gray-700">{children}</div>
    </div>
  )
}

// Recap of the trip being built — stays visible on every step.
export function TripSummary({ state, routeStatus, route, km, category, price, className = '' }) {
  const hasRoute = state.from?.lat && state.to?.lat
  const stopCount = state.stops.filter(s => s.lat).length
  return (
    <aside className={`bg-white border border-gray-200 rounded-xl overflow-hidden ${className}`} aria-label="Din reise">
      <div className="px-4 py-3 bg-brand-dark text-white">
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Din reise</p>
        {hasRoute ? (
          <p className="font-bold flex items-center gap-2 flex-wrap">
            {shortAddr(state.from)} <ArrowRight size={14} className="text-gray-400" /> {shortAddr(state.to)}
          </p>
        ) : <p className="text-sm text-gray-400">Velg start og mål</p>}
      </div>
      <div className="p-4 space-y-3">
        {hasRoute && (
          <Row icon={RouteIcon}>
            {routeStatus === 'loading' && <span className="text-gray-400">Beregner rute…</span>}
            {routeStatus === 'error' && <span className="text-amber-600">Kunne ikke beregne distanse</span>}
            {routeStatus === 'ok' && route && (
              <>
                <strong>{km} km</strong> {state.tripType === 'return' ? 'tur/retur' : 'enveis'}
                <span className="text-gray-400"> · {fmtMin(route.duration)} hver vei</span>
              </>
            )}
            {stopCount > 0 && <span className="block text-xs text-gray-400">{stopCount} stopp underveis</span>}
          </Row>
        )}
        <Row icon={Calendar}>
          {state.date ? (
            <>
              {fmtDate(state.date)} kl. {state.time}
              {state.tripType === 'return' && (
                <span className="block text-xs text-gray-500">
                  Retur {state.returnDate ? `${fmtDate(state.returnDate)} kl. ${state.returnTime}` : '– velg dato'}
                </span>
              )}
            </>
          ) : <span className="text-gray-400">Dato ikke valgt</span>}
        </Row>
        <Row icon={Users}>
          {state.passengers} reisende
          {state.busCount > 1 && <span> · {state.busCount} busser</span>}
        </Row>
        <Row icon={Bus}>
          {category ? category.name : <span className="text-gray-400">Busstype ikke valgt</span>}
        </Row>
        <div className="pt-3 border-t border-gray-100">
          {price ? (
            <>
              <p className="text-[11px] uppercase tracking-wider text-gray-400">Estimert pris inkl. mva</p>
              <p className="text-2xl font-black text-brand-dark tabular-nums">{fmtKr(price.total)}</p>
              <p className="text-xs text-gray-400">Uforpliktende. Endelig tilbud sendes av oss.</p>
            </>
          ) : (
            <p className="text-sm text-gray-400">Pris vises når rute og busstype er valgt.</p>
          )}
        </div>
      </div>
    </aside>
  )
}

// Mobile-only bottom bar: appears once a price exists, always shows it, expands to the full
// summary on tap, and can carry the step's primary action next to the price.
export function MobileSummaryBar({ action, ...props }) {
  const [open, setOpen] = useState(false)
  const { state, price } = props
  if (!price) return null
  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
      {open && <div className="max-h-[70vh] overflow-y-auto p-3 border-b border-gray-100"><TripSummary {...props} className="border-0" /></div>}
      <div className="flex items-center gap-3 px-4 py-3">
        <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} className="flex-1 min-w-0 text-left">
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <span className="truncate">
              {state.from?.lat && state.to?.lat ? `${shortAddr(state.from)} → ${shortAddr(state.to)}` : 'Din reise'}
            </span>
            <ChevronDown size={12} className={`flex-shrink-0 transition-transform motion-reduce:transition-none ${open ? '' : 'rotate-180'}`} />
          </span>
          <span className="block font-black text-brand-dark tabular-nums">{fmtKr(price.total)}</span>
        </button>
        {action && (
          <button type="button" onClick={action.onClick} disabled={action.disabled}
            className="flex-shrink-0 flex items-center gap-1.5 bg-brand-blue hover:bg-brand-blue-dark disabled:opacity-40 text-white font-bold px-6 py-3 rounded-lg text-sm transition-colors">
            {action.label} <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
