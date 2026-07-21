import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin } from 'lucide-react'

// Address autocomplete backed by OpenStreetMap Nominatim — shared between the public
// booking wizard and the admin quick-entry form so both search the same way.
export default function AddressInput({ label, value, onChange, placeholder }) {
  const [query, setQuery] = useState(value?.address || '')
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const timer = useRef(null)

  useEffect(() => { setQuery(value?.address || '') }, [value?.address])

  const search = useCallback((q) => {
    if (q.length < 3) { setSuggestions([]); return }
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1`,
          { headers: { 'Accept-Language': 'no' } }
        )
        const data = await res.json()
        setSuggestions(data)
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
              key={s.place_id}
              className="px-4 py-2.5 text-sm hover:bg-brand-blue-pale cursor-pointer border-b border-gray-50 last:border-0"
              onMouseDown={() => {
                const addr = s.display_name.split(',').slice(0, 3).join(',')
                setQuery(addr)
                setSuggestions([])
                setOpen(false)
                onChange({ address: addr, lat: parseFloat(s.lat), lon: parseFloat(s.lon) })
              }}
            >
              <span className="font-medium">{s.display_name.split(',')[0]}</span>
              <span className="text-gray-400 text-xs block">{s.display_name.split(',').slice(1, 3).join(',')}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
