import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin } from 'lucide-react'
import { autocompletePlaces, placeLocation, newPlacesSession } from '../services/googleMaps'

// Address autocomplete backed by Google Places (New) — shared between the public
// booking wizard and the admin quick-entry form so both search the same way.
export default function AddressInput({ label, value, onChange, placeholder }) {
  const [query, setQuery] = useState(value?.address || '')
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const timer = useRef(null)
  const session = useRef(newPlacesSession()) // one billing session per search-then-pick

  useEffect(() => { setQuery(value?.address || '') }, [value?.address])

  const search = useCallback((q) => {
    if (q.length < 3) { setSuggestions([]); return }
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      try {
        setSuggestions(await autocompletePlaces(q, session.current))
        setOpen(true)
      } catch {}
    }, 350)
  }, [])

  return (
    <div className="relative">
      {label && <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</label>}
      <div className="relative">
        <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); search(e.target.value) }}
          onFocus={() => suggestions.length && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder={placeholder}
          className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
        />
      </div>
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {suggestions.map((s) => (
            <li
              key={s.placeId}
              className="px-4 py-2.5 text-sm hover:bg-brand-blue-pale cursor-pointer border-b border-gray-50 last:border-0"
              onMouseDown={async () => {
                setQuery(s.text)
                setSuggestions([])
                setOpen(false)
                try {
                  const loc = await placeLocation(s.placeId, session.current)
                  onChange({ address: s.text, ...loc })
                } catch {
                  onChange({ address: s.text, lat: null, lon: null })
                } finally {
                  session.current = newPlacesSession()
                }
              }}
            >
              <span className="font-medium">{s.main}</span>
              <span className="text-gray-400 text-xs block">{s.secondary}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
