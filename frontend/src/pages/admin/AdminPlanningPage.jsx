import { useState, useEffect, useCallback, useRef } from 'react'
import { useConfirm } from '../../hooks/useConfirm'
import { useClosingTransition } from '../../hooks/useClosingTransition'
import { ChevronLeft, ChevronRight, Plus, X, Trash2, Bus as BusIcon, Edit2, Calendar, Phone, Mail, CalendarDays, Users, Save, ToggleLeft, ToggleRight, ChevronDown, ChevronUp, ImagePlus, Upload, Loader2, RefreshCw, Search } from 'lucide-react'
import { api } from '../../services/api'
import { buildStopsFromBooking, stopsToPayload } from '../../utils/bookingHelpers'

// ── Bus card (inline from AdminBusesPage) ────────────────────────────────────
const ALL_AMENITIES = ['Wifi', 'Klimaanlegg', 'Kjøkken', '220 Volt', 'WC', 'TV/DVD', 'Mikrofon', 'DAB Radio', 'Bagasjerom', 'Tilhengerfeste', 'Rullestolvennlig']

function BusCard({ bus, categories, onSaved, onDeleted }) {
  const [confirmModal, askConfirm] = useConfirm()
  const [open, setOpen] = useState(!bus.id) // auto-open new buses
  const [draft, setDraft] = useState({ ...bus })
  const [newImageUrl, setNewImageUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const [saving, setSaving] = useState(false)
  const set = (f, v) => setDraft(d => ({ ...d, [f]: v }))
  const toggleAmenity = (a) => set('amenities', draft.amenities.includes(a) ? draft.amenities.filter(x => x !== a) : [...draft.amenities, a])
  const addImage = () => { if (!newImageUrl.trim()) return; set('images', [...(draft.images||[]), newImageUrl.trim()]); setNewImageUrl('') }
  const removeImage = (i) => set('images', draft.images.filter((_, idx) => idx !== i))
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)
    try {
      const urls = await Promise.all(files.map(f => api.uploadPublicFile(f).then(r => r.url)))
      set('images', [...(draft.images || []), ...urls])
    } catch {
      alert('Opplasting feilet. Prøv igjen.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const buildPayload = (overrides = {}) => ({
    name: draft.name, registrationNumber: draft.registrationNumber ?? '', seats: draft.seats,
    description: draft.description, images: draft.images||[], amenities: draft.amenities||[],
    active: draft.active, showOnWebsite: draft.showOnWebsite ?? false,
    priceCategoryId: draft.priceCategoryId ?? null, ...overrides
  })

  const save = async () => {
    setSaving(true)
    try {
      const updated = bus.id ? await api.updateBus(bus.id, buildPayload()) : await api.createBus(buildPayload())
      onSaved(updated); setOpen(false)
    } finally { setSaving(false) }
  }

  const quickToggle = async (field, value) => {
    if (!bus.id) { set(field, value); return }
    set(field, value)
    try { const updated = await api.updateBus(bus.id, buildPayload({ [field]: value })); onSaved(updated) }
    catch { set(field, !value) }
  }

  const del = async () => {
    if (!bus.id) { onDeleted(bus._tempId); return }
    if (!await askConfirm({ title: 'Slett buss', message: `Er du sikker på at du vil slette «${bus.name}»?` })) return
    await api.deleteBus(bus.id); onDeleted(bus.id)
  }

  const cat = categories.find(c => c.id === draft.priceCategoryId)
  const inp = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30'

  return (
    <div className={`bg-white border-2 rounded-2xl overflow-hidden transition-colors ${draft.active ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
      {confirmModal}
      <div className="flex items-center gap-4 p-4">
        {draft.images?.[0] && <img src={draft.images[0]} alt={draft.name} className="w-20 h-14 object-cover rounded-xl flex-shrink-0" />}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-brand-dark truncate">{draft.name || <span className="text-gray-400">Ny buss</span>}</p>
          <p className="text-sm text-gray-400">
            {draft.registrationNumber && <span className="font-mono mr-2">{draft.registrationNumber}</span>}
            {draft.seats} seter{cat ? ` · ${cat.name}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => quickToggle('active', !draft.active)}
            title={draft.active ? 'Aktiv' : 'Inaktiv'}
            className={`transition-colors ${draft.active ? 'text-green-500 hover:text-green-700' : 'text-gray-300 hover:text-gray-500'}`}>
            {draft.active ? <ToggleRight size={28}/> : <ToggleLeft size={28}/>}
          </button>
          <button
            onClick={() => quickToggle('showOnWebsite', !draft.showOnWebsite)}
            title={draft.showOnWebsite ? 'Vises på nettsiden' : 'Skjult fra nettsiden'}
            className={`transition-colors ${draft.showOnWebsite ? 'text-brand-blue hover:text-brand-blue-dark' : 'text-gray-300 hover:text-gray-500'}`}>
            {draft.showOnWebsite ? <ToggleRight size={28}/> : <ToggleLeft size={28}/>}
          </button>
          <span className="text-xs text-gray-400 hidden sm:inline">{draft.showOnWebsite ? 'Nettside' : ''}</span>
          <button onClick={() => setOpen(o => !o)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            {open ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
          </button>
          <button onClick={del} className="p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors">
            <Trash2 size={16}/>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-gray-100 p-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-semibold text-brand-dark mb-1.5">Navn</label>
              <input value={draft.name} onChange={e => set('name', e.target.value)} className={inp} /></div>
            <div><label className="block text-xs font-semibold text-brand-dark mb-1.5">Registreringsnummer</label>
              <input value={draft.registrationNumber ?? ''} onChange={e => set('registrationNumber', e.target.value)} placeholder="AB 12345" className={`${inp} font-mono`} /></div>
            <div><label className="block text-xs font-semibold text-brand-dark mb-1.5">Antall seter</label>
              <input type="number" value={draft.seats} onChange={e => set('seats', Number(e.target.value))} className={inp} /></div>
            <div><label className="block text-xs font-semibold text-brand-dark mb-1.5">Priskategori</label>
              <select value={draft.priceCategoryId ?? ''} onChange={e => set('priceCategoryId', e.target.value ? Number(e.target.value) : null)} className={`${inp} bg-white`}>
                <option value="">— Ingen kategori —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name} ({c.kmRate} kr/km)</option>)}
              </select></div>
          </div>
          <div><label className="block text-xs font-semibold text-brand-dark mb-1.5">Beskrivelse</label>
            <textarea value={draft.description} onChange={e => set('description', e.target.value)} rows={2} className={`${inp} resize-none`} /></div>
          <div>
            <label className="block text-xs font-semibold text-brand-dark mb-2">Bilder</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {(draft.images||[]).map((url, i) => (
                <div key={i} className="relative group">
                  <img src={url} alt="" className="w-24 h-16 object-cover rounded-lg"/>
                  <button onClick={() => removeImage(i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={10}/></button>
                </div>
              ))}
              {uploading && (
                <div className="w-24 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Loader2 size={18} className="animate-spin text-gray-400" />
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload} />
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-brand-blue/40 hover:bg-brand-blue/5 text-gray-500 hover:text-brand-blue px-3 py-3 rounded-xl text-sm transition-colors disabled:opacity-50 mb-2">
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploading ? 'Laster opp…' : 'Last opp bilder fra enhet'}
            </button>
            <div className="flex gap-2">
              <input value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)} onKeyDown={e => e.key==='Enter' && addImage()} placeholder="eller lim inn bilde-URL…" className={`flex-1 ${inp}`}/>
              <button onClick={addImage} className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2.5 rounded-xl text-sm transition-colors"><ImagePlus size={14}/> Legg til</button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-dark mb-2">Fasiliteter</label>
            <div className="flex flex-wrap gap-2">
              {ALL_AMENITIES.map(a => (
                <button key={a} onClick={() => toggleAmenity(a)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${draft.amenities?.includes(a) ? 'bg-brand-blue text-white border-brand-blue' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>{a}</button>
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={save} disabled={saving} className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50">
              <Save size={14}/> {saving ? 'Lagrer…' : 'Lagre buss'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Constants ─────────────────────────────────────────────────────────────────
const TYPE_COLORS = {
  trip:        { bg: 'bg-blue-500',   text: 'text-white', label: 'Tur' },
  maintenance: { bg: 'bg-amber-500',  text: 'text-white', label: 'Vedlikehold' },
  other:       { bg: 'bg-gray-500',   text: 'text-white', label: 'Annet' },
}
const NO_ID = '__none__'

// ── Helpers ───────────────────────────────────────────────────────────────────
function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}
function dateKey(d) {
  return d.toISOString().slice(0, 10)
}
function parseDate(str) {
  // Always parse only the date part to avoid timezone shifts
  return new Date(str.slice(0, 10) + 'T12:00:00')
}
function toMinutes(timeStr) {
  if (!timeStr) return null
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}
// Last-resort fallback when there's no distance to estimate from — one-way bookings have
// no distinct return time, so departure time alone would make start === end and trip the
// "end must be after start" validation. Just nudges it forward by an hour.
function bumpHour(timeStr) {
  if (!timeStr) return timeStr
  const [h, m] = timeStr.split(':').map(Number)
  return `${String(Math.min(h + 1, 23)).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// Booking.distanceKm is the round-trip total when tripType is "return", so halve it back
// to a single leg's driving distance.
function oneWayDistanceKm(booking) {
  if (!booking?.distanceKm) return null
  return booking.tripType === 'return' ? booking.distanceKm / 2 : booking.distanceKm
}

// Auto-fills a leg's end time from its one-way driving distance, assuming a coach cruising
// average (incl. stops) and rounding up to the nearest 15 min. Just a starting point — the
// admin can always override it in the form.
const AVG_COACH_SPEED_KMH = 65
function estimateEndTime(startTime, oneWayKm) {
  if (!startTime || !oneWayKm) return null
  const drivingMinutes = Math.max(30, Math.ceil(oneWayKm / AVG_COACH_SPEED_KMH * 4) * 15)
  const [h, m] = startTime.split(':').map(Number)
  const total = Math.min(h * 60 + m + drivingMinutes, 23 * 60 + 45) // stay within the same day
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

// ── Assignment modal ──────────────────────────────────────────────────────────
function AssignmentModal({ buses, drivers, assignments, initial, unplannedBookings, linkedBooking, onSave, onDelete, onClose }) {
  const [confirmModal, askConfirm] = useConfirm()
  const { closing, close } = useClosingTransition()
  const editing = !!initial?.id
  const [form, setForm] = useState({
    busId: initial?.busId ?? (buses[0]?.externalId ?? ''),
    driverId: initial?.driverId ?? null,
    bookingId: initial?.bookingId ?? linkedBooking?.id ?? null,
    startDate: initial ? dateKey(parseDate(initial.startDate)) : linkedBooking ? (linkedBooking.departureDate || '').slice(0, 10) : dateKey(new Date()),
    endDate: initial ? dateKey(parseDate(initial.endDate)) : linkedBooking ? (linkedBooking.returnDate || linkedBooking.departureDate || '').slice(0, 10) : dateKey(new Date()),
    startTime: initial?.startTime || linkedBooking?.departureTime || '',
    endTime: initial?.endTime || linkedBooking?.returnTime
      || estimateEndTime(linkedBooking?.departureTime, oneWayDistanceKm(linkedBooking))
      || bumpHour(linkedBooking?.departureTime) || '',
    title: initial?.title ?? (linkedBooking ? `${linkedBooking.reference} — ${linkedBooking.fromAddress} → ${linkedBooking.toAddress}` : ''),
    type: initial?.type ?? 'trip',
    notes: initial?.notes ?? '',
    bookingReference: initial?.bookingReference ?? linkedBooking?.reference ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  // Which booking is currently linked (read-only display) — either passed straight in
  // from the "Nye bestillinger" queue, or picked from the search-and-link dropdown below.
  const [pickedBooking, setPickedBooking] = useState(linkedBooking ?? null)
  const [bookingPickerOpen, setBookingPickerOpen] = useState(false)
  const [bookingPickerQuery, setBookingPickerQuery] = useState('')

  const linkBooking = (booking) => {
    setPickedBooking(booking)
    setBookingPickerOpen(false)
    setBookingPickerQuery('')
    setForm(f => ({
      ...f,
      bookingId: booking.id,
      bookingReference: booking.reference,
      startDate: (booking.departureDate || '').slice(0, 10),
      endDate: (booking.returnDate || booking.departureDate || '').slice(0, 10),
      startTime: booking.departureTime || f.startTime,
      endTime: booking.returnTime
        || estimateEndTime(booking.departureTime, oneWayDistanceKm(booking))
        || bumpHour(booking.departureTime) || f.endTime,
      title: f.title || `${booking.reference} — ${booking.fromAddress} → ${booking.toAddress}`,
    }))
  }

  const unlinkBooking = () => {
    setPickedBooking(null)
    setForm(f => ({ ...f, bookingId: null, bookingReference: '' }))
  }

  const pickerResults = (unplannedBookings || []).filter(b => {
    const q = bookingPickerQuery.trim().toLowerCase()
    if (!q) return true
    return b.reference.toLowerCase().includes(q) || b.contactName?.toLowerCase().includes(q)
  })

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const validate = () => {
    const e = {}
    if (!form.busId) e.busId = 'Buss er påkrevd.'
    if (!form.startDate) e.startDate = 'Startdato er påkrevd.'
    if (!form.endDate) e.endDate = 'Sluttdato er påkrevd.'
    if (form.endDate < form.startDate) e.endDate = 'Sluttdato kan ikke være før startdato.'
    if (!form.startTime) e.startTime = 'Starttid er påkrevd.'
    if (!form.endTime) e.endTime = 'Sluttid er påkrevd.'
    if (form.startTime && form.endTime && form.startDate === form.endDate && form.endTime <= form.startTime)
      e.endTime = 'Sluttid må være etter starttid.'
    return e
  }

  const handleSave = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setSaving(true)
    setErrors({})
    try {
      const isReturn = !editing && pickedBooking?.tripType === 'return' && pickedBooking?.returnDate

      // Outbound leg (or the only leg for one-way / edits)
      const outbound = {
        busId: form.busId,
        driverId: form.driverId || null,
        bookingId: form.bookingId || null,
        startDate: form.startDate,
        endDate: form.startDate, // outbound ends same day as departure
        startTime: form.startTime || null,
        endTime: isReturn
          ? (estimateEndTime(form.startTime, oneWayDistanceKm(pickedBooking)) || bumpHour(form.startTime))
          : (form.endTime || null),
        title: isReturn
          ? `${form.bookingReference || pickedBooking?.reference} — Tur: ${pickedBooking.fromAddress} → ${pickedBooking.toAddress}`
          : form.title,
        type: form.type,
        notes: form.notes || null,
        bookingReference: form.bookingReference || null,
      }

      const result = editing
        ? await api.updateAssignment(initial.id, { ...outbound, endDate: form.endDate, endTime: form.endTime || null, title: form.title })
        : await api.createAssignment(outbound)

      if (!editing && outbound.type === 'trip' && pickedBooking) {
        try { await api.replaceAssignmentStops(result.id, stopsToPayload(buildStopsFromBooking(pickedBooking))) } catch {}
      }

      // Return leg — only for new return-trip bookings
      if (isReturn) {
        const returnDate = pickedBooking.returnDate.slice(0, 10)
        const returnPayload = {
          busId: form.busId,
          driverId: form.driverId || null,
          bookingId: form.bookingId || null,
          startDate: returnDate,
          endDate: returnDate,
          startTime: pickedBooking.returnTime || null,
          endTime: estimateEndTime(pickedBooking.returnTime, oneWayDistanceKm(pickedBooking))
            || bumpHour(pickedBooking.returnTime) || null,
          title: `${form.bookingReference || pickedBooking.reference} — Retur: ${pickedBooking.toAddress} → ${pickedBooking.fromAddress}`,
          type: form.type,
          notes: form.notes || null,
          bookingReference: form.bookingReference || null,
        }
        const returnResult = await api.createAssignment(returnPayload)
        if (outbound.type === 'trip') {
          try {
            // Reverse the route for the return leg
            const returnBooking = { ...pickedBooking, fromAddress: pickedBooking.toAddress, toAddress: pickedBooking.fromAddress }
            await api.replaceAssignmentStops(returnResult.id, stopsToPayload(buildStopsFromBooking(returnBooking)))
          } catch {}
        }
        onSave(returnResult, false) // add return leg to calendar (no reopen-for-next-bus here)
      }

      // Only offer the "reopen for the next bus" flow on fresh creates, not edits.
      onSave(result, editing, !editing ? pickedBooking : undefined)
    } catch (e) {
      setError(e?.message || 'Lagring feilet')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!await askConfirm({ title: 'Slett oppgave', message: 'Er du sikker på at du vil slette denne oppgaven? Dette kan ikke angres.' })) return
    setSaving(true)
    try {
      await api.deleteAssignment(initial.id)
      onDelete(initial.id)
    } finally {
      setSaving(false)
    }
  }

  const inp = (err) => `w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors
    ${err ? 'border-red-400 focus:ring-red-300 bg-red-50' : 'border-gray-200 focus:ring-brand-blue/30'}`
  const Err = ({ k }) => errors[k] ? <p className="text-red-500 text-xs mt-1">{errors[k]}</p> : null

  const conflicts = form.busId && form.startDate && form.endDate
    ? (assignments || []).filter(a =>
        a.busId === form.busId &&
        a.id !== initial?.id &&
        a.startDate.slice(0, 10) <= form.endDate &&
        a.endDate.slice(0, 10) >= form.startDate
      )
    : []

  return (
    <>
    {confirmModal}
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 transition-opacity duration-150 motion-reduce:transition-none ${closing ? 'opacity-0' : 'opacity-100'}`} onClick={e => e.target === e.currentTarget && close(onClose)}>
      <div className={`bg-white rounded-2xl shadow-xl w-full max-w-md duration-150 motion-reduce:animate-none ${closing ? 'animate-out fade-out zoom-out-95' : 'animate-in fade-in zoom-in-95'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-brand-dark">{editing ? 'Rediger oppgave' : 'Ny oppgave'}</h2>
          <button onClick={() => close(onClose)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Bus */}
          <div>
            <label className="block text-xs font-semibold text-brand-dark mb-1.5">Buss *</label>
            <select value={form.busId} onChange={e => set('busId', e.target.value)} className={inp(errors.busId)}>
              <option value="">— Velg buss —</option>
              {buses.map(b => (
                <option key={b.externalId} value={b.externalId}>
                  {b.name}{b.registrationNumber ? ` (${b.registrationNumber})` : ''}
                </option>
              ))}
            </select>
            <Err k="busId" />
            {conflicts.length > 0 && (
              <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-xs font-semibold text-amber-700 mb-1">⚠ Overlapp med {conflicts.length} eksisterende oppgave{conflicts.length > 1 ? 'r' : ''}:</p>
                {conflicts.map(c => (
                  <p key={c.id} className="text-xs text-amber-600">
                    {c.title || c.type} · {c.startDate.slice(0, 10)}{c.startDate !== c.endDate ? ` – ${c.endDate.slice(0, 10)}` : ''}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Driver */}
          <div>
            <label className="block text-xs font-semibold text-brand-dark mb-1.5">
              Sjåfør
              {!form.driverId && (
                <span className="ml-2 text-amber-500 font-normal text-[10px] uppercase tracking-wide">
                  ⚠ Ingen sjåfør — oppgaven vises i rødt
                </span>
              )}
            </label>
            <select value={form.driverId ?? NO_ID}
              onChange={e => set('driverId', e.target.value === NO_ID ? null : Number(e.target.value))}
              className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors
                ${!form.driverId ? 'border-amber-300 focus:ring-amber-200 bg-amber-50/50' : 'border-gray-200 focus:ring-brand-blue/30'}`}>
              <option value={NO_ID}>— Ingen sjåfør valgt —</option>
              {drivers.filter(d => d.active).map(d => (
                <option key={d.id} value={d.id}>{d.fullName}{d.phone ? ` · ${d.phone}` : ''}</option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-brand-dark mb-1.5">Startdato *</label>
              <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} className={inp(errors.startDate)} />
              <Err k="startDate" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-dark mb-1.5">Sluttdato *</label>
              <input type="date" value={form.endDate} min={form.startDate} onChange={e => set('endDate', e.target.value)} className={inp(errors.endDate)} />
              <Err k="endDate" />
            </div>
          </div>

          {/* Times — required */}
          <div>
            <label className="block text-xs font-semibold text-brand-dark mb-1.5">
              Tidspunkt * <span className="font-normal text-gray-400">(påkrevd)</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Fra *</label>
                <input type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)} className={inp(errors.startTime)} />
                <Err k="startTime" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Til *</label>
                <input type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)} className={inp(errors.endTime)} />
                <Err k="endTime" />
              </div>
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-semibold text-brand-dark mb-1.5">Type</label>
            <div className="flex gap-2">
              {Object.entries(TYPE_COLORS).map(([key, { bg, label }]) => (
                <button key={key} onClick={() => set('type', key)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all
                    ${form.type === key ? `${bg} text-white shadow-sm` : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-brand-dark mb-1.5">Tittel / beskrivelse</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="F.eks. Skoletur til Jæren" className={inp()} />
          </div>

          {/* Booking link */}
          <div>
            <label className="block text-xs font-semibold text-brand-dark mb-1.5">Bestilling</label>
            {pickedBooking || (form.bookingId && form.bookingReference) ? (
              <div className="flex items-center justify-between gap-3 bg-brand-blue/5 border border-brand-blue/20 rounded-xl px-3.5 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-brand-dark font-mono truncate">{form.bookingReference}</p>
                  {pickedBooking && (
                    <p className="text-xs text-gray-500 truncate">
                      {pickedBooking.contactName} · {pickedBooking.fromAddress} → {pickedBooking.toAddress}
                    </p>
                  )}
                  {pickedBooking?.busCount > 1 && (
                    <p className="text-xs text-brand-blue font-medium mt-0.5">
                      🚌 {pickedBooking.plannedCount ?? 0}/{pickedBooking.busCount} busser planlagt — denne bestillingen trenger {pickedBooking.busCount} separate kjøreordre
                    </p>
                  )}
                  {pickedBooking?.tripType === 'return' && pickedBooking?.returnDate && (
                    <p className="text-xs text-amber-600 font-medium mt-0.5">
                      ↩ Returtur {pickedBooking.returnDate.slice(0, 10)} — dette oppretter 2 separate kjøreordre {pickedBooking.busCount > 1 ? 'per buss' : ''}
                    </p>
                  )}
                </div>
                <button type="button" onClick={unlinkBooking} className="text-gray-400 hover:text-red-500 flex-shrink-0"><X size={15} /></button>
              </div>
            ) : bookingPickerOpen ? (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <input autoFocus value={bookingPickerQuery} onChange={e => setBookingPickerQuery(e.target.value)}
                  placeholder="Søk referanse eller navn…" className="w-full px-3 py-2.5 text-sm focus:outline-none border-b border-gray-100" />
                <div className="max-h-40 overflow-y-auto divide-y divide-gray-50">
                  {pickerResults.length === 0 && (
                    <p className="text-xs text-gray-400 px-3 py-3">Ingen uplanlagte bestillinger funnet.</p>
                  )}
                  {pickerResults.map(b => (
                    <button key={b.id} type="button" onClick={() => linkBooking(b)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors">
                      <p className="text-xs font-mono font-bold text-brand-dark">
                        {b.reference}{b.busCount > 1 && <span className="ml-2 text-brand-blue">{b.plannedCount ?? 0}/{b.busCount} busser</span>}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{b.contactName} · {b.fromAddress} → {b.toAddress}</p>
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => setBookingPickerOpen(false)}
                  className="w-full text-center text-xs text-gray-400 hover:text-gray-600 py-1.5 border-t border-gray-100">Avbryt</button>
              </div>
            ) : (
              <button type="button" onClick={() => setBookingPickerOpen(true)}
                className="text-xs font-semibold text-brand-blue hover:text-brand-blue-dark">
                + Koble til en bestilling
              </button>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-brand-dark mb-1.5">Notater</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
              placeholder="Ekstra informasjon…" className={`${inp()} resize-none`} />
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          {editing
            ? <button onClick={handleDelete} disabled={saving} className="flex items-center gap-1.5 text-red-500 hover:text-red-700 text-sm font-semibold disabled:opacity-50">
                <Trash2 size={14} /> Slett
              </button>
            : <span />
          }
          <div className="flex gap-3">
            <button onClick={() => close(onClose)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Avbryt</button>
            <button onClick={handleSave} disabled={saving}
              className="px-5 py-2 bg-brand-blue hover:bg-brand-blue-dark active:scale-[0.97] text-white text-sm font-bold rounded-full transition-[background-color,transform] motion-reduce:transition-none disabled:opacity-50">
              {saving ? 'Lagrer…' : editing ? 'Oppdater' : 'Legg til'}
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

// ── Bulk plan modal — for multi-bus orders (BusCount > 1). One screen to assign every
// remaining bus + driver at once instead of repeating the single-assignment flow N times.
function BulkPlanModal({ booking, buses, drivers, onSaved, onClose }) {
  const { closing, close } = useClosingTransition()
  const isReturn = booking.tripType === 'return' && !!booking.returnDate
  const oneWayKm = oneWayDistanceKm(booking)
  const defaultEndTime = estimateEndTime(booking.departureTime, oneWayKm) || bumpHour(booking.departureTime) || ''
  const defaultReturnEndTime = isReturn
    ? (estimateEndTime(booking.returnTime, oneWayKm) || bumpHour(booking.returnTime) || '')
    : ''
  const remaining = Math.max(1, (booking.busCount || 1) - (booking.plannedCount || 0))

  // Shared date/time template — applied to every row by default, and re-appliable on demand
  // via "Bruk for alle rader" after the admin tweaks it. Each row can still be edited alone.
  const [sharedDate, setSharedDate] = useState((booking.departureDate || '').slice(0, 10))
  const [sharedStartTime, setSharedStartTime] = useState(booking.departureTime || '')
  const [sharedEndTime, setSharedEndTime] = useState(defaultEndTime)
  const [sharedReturnDate, setSharedReturnDate] = useState(isReturn ? (booking.returnDate || '').slice(0, 10) : '')
  const [sharedReturnStartTime, setSharedReturnStartTime] = useState(booking.returnTime || '')
  const [sharedReturnEndTime, setSharedReturnEndTime] = useState(defaultReturnEndTime)

  const makeRow = () => ({
    busId: '', driverId: null,
    startDate: sharedDate, startTime: sharedStartTime, endTime: sharedEndTime,
    returnDate: sharedReturnDate, returnStartTime: sharedReturnStartTime, returnEndTime: sharedReturnEndTime,
    status: 'idle', error: null, // idle | saving | done | error
  })

  const [rows, setRows] = useState(() => Array.from({ length: remaining }, makeRow))
  const [saving, setSaving] = useState(false)

  const setRow = (i, patch) => setRows(rs => rs.map((r, idx) => idx === i ? { ...r, ...patch } : r))
  const addRow = () => setRows(rs => [...rs, makeRow()])
  const removeRow = (i) => setRows(rs => rs.filter((_, idx) => idx !== i))
  const usedBusIds = rows.map(r => r.busId).filter(Boolean)

  const applyToAll = () => {
    setRows(rs => rs.map(r => r.status === 'done' ? r : ({
      ...r,
      startDate: sharedDate, startTime: sharedStartTime, endTime: sharedEndTime,
      returnDate: sharedReturnDate, returnStartTime: sharedReturnStartTime, returnEndTime: sharedReturnEndTime,
    })))
  }

  const saveRow = async (i) => {
    const row = rows[i]
    if (!row.busId) { setRow(i, { status: 'error', error: 'Velg en buss.' }); return null }
    if (!row.startDate || !row.startTime || !row.endTime) { setRow(i, { status: 'error', error: 'Dato og klokkeslett er påkrevd.' }); return null }
    setRow(i, { status: 'saving', error: null })
    try {
      const outbound = {
        busId: row.busId, driverId: row.driverId || null, bookingId: booking.id,
        startDate: row.startDate, endDate: row.startDate,
        startTime: row.startTime || null, endTime: row.endTime || null,
        title: isReturn
          ? `${booking.reference} — Tur: ${booking.fromAddress} → ${booking.toAddress}`
          : `${booking.reference} — ${booking.fromAddress} → ${booking.toAddress}`,
        type: 'trip', notes: null, bookingReference: booking.reference,
      }
      const result = await api.createAssignment(outbound)
      try { await api.replaceAssignmentStops(result.id, stopsToPayload(buildStopsFromBooking(booking))) } catch {}

      let returnResult = null
      if (isReturn) {
        const returnDate = row.returnDate || row.startDate
        const returnPayload = {
          busId: row.busId, driverId: row.driverId || null, bookingId: booking.id,
          startDate: returnDate, endDate: returnDate,
          startTime: row.returnStartTime || null, endTime: row.returnEndTime || null,
          title: `${booking.reference} — Retur: ${booking.toAddress} → ${booking.fromAddress}`,
          type: 'trip', notes: null, bookingReference: booking.reference,
        }
        returnResult = await api.createAssignment(returnPayload)
        try {
          const returnBooking = { ...booking, fromAddress: booking.toAddress, toAddress: booking.fromAddress }
          await api.replaceAssignmentStops(returnResult.id, stopsToPayload(buildStopsFromBooking(returnBooking)))
        } catch {}
      }

      setRow(i, { status: 'done' })
      return returnResult ? [result, returnResult] : [result]
    } catch (e) {
      setRow(i, { status: 'error', error: e?.message || 'Lagring feilet.' })
      return null
    }
  }

  const saveAll = async () => {
    setSaving(true)
    const created = []
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].status === 'done') continue
      const out = await saveRow(i)
      if (out) created.push(...out)
    }
    setSaving(false)
    if (created.length) onSaved(created)
  }

  const doneCount = rows.filter(r => r.status === 'done').length
  const allDone = rows.length > 0 && doneCount === rows.length
  const timeInp = 'px-2.5 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-blue/30'

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 transition-opacity duration-150 motion-reduce:transition-none ${closing ? 'opacity-0' : 'opacity-100'}`} onClick={e => e.target === e.currentTarget && close(onClose)}>
      <div className={`bg-white rounded-2xl shadow-xl w-full max-w-2xl duration-150 motion-reduce:animate-none ${closing ? 'animate-out fade-out zoom-out-95' : 'animate-in fade-in zoom-in-95'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-brand-dark">Bulk-planlegg busser</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {booking.reference} · {booking.fromAddress} → {booking.toAddress} · trenger {remaining} {remaining === 1 ? 'buss til' : 'busser til'}
              {isReturn && ' · tur/retur (2 kjøreordre per buss)'}
            </p>
          </div>
          <button onClick={() => close(onClose)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Shared date/time template — set once, apply to all rows, then tweak individually below */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tidspunkt for alle busser</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-gray-500 mb-1">Dato</label>
                <input type="date" value={sharedDate} onChange={e => setSharedDate(e.target.value)} className={`${timeInp} w-full`} />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-1">Fra kl.</label>
                <input type="time" value={sharedStartTime} onChange={e => setSharedStartTime(e.target.value)} className={`${timeInp} w-full`} />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-1">Til kl.</label>
                <input type="time" value={sharedEndTime} onChange={e => setSharedEndTime(e.target.value)} className={`${timeInp} w-full`} />
              </div>
            </div>
            {isReturn && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">Retur dato</label>
                  <input type="date" value={sharedReturnDate} onChange={e => setSharedReturnDate(e.target.value)} className={`${timeInp} w-full`} />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">Retur fra kl.</label>
                  <input type="time" value={sharedReturnStartTime} onChange={e => setSharedReturnStartTime(e.target.value)} className={`${timeInp} w-full`} />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">Retur til kl.</label>
                  <input type="time" value={sharedReturnEndTime} onChange={e => setSharedReturnEndTime(e.target.value)} className={`${timeInp} w-full`} />
                </div>
              </div>
            )}
            <button onClick={applyToAll} className="mt-2.5 text-xs font-semibold text-brand-blue hover:text-brand-blue-dark">
              ↓ Bruk for alle rader
            </button>
          </div>

          {rows.map((row, i) => (
            <div key={i} className={`border rounded-xl p-3.5 transition-colors
              ${row.status === 'done' ? 'border-green-200 bg-green-50' : row.status === 'error' ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Buss {i + 1}</p>
                {row.status === 'done'
                  ? <span className="text-xs font-semibold text-green-700">✓ Lagret</span>
                  : rows.length > 1 && (
                    <button onClick={() => removeRow(i)} className="text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
                  )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select disabled={row.status === 'done' || row.status === 'saving'} value={row.busId}
                  onChange={e => setRow(i, { busId: e.target.value })}
                  className="px-2.5 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-blue/30 disabled:opacity-60">
                  <option value="">— Velg buss —</option>
                  {buses.map(b => {
                    const takenElsewhere = usedBusIds.includes(b.externalId) && row.busId !== b.externalId
                    return (
                      <option key={b.externalId} value={b.externalId} disabled={takenElsewhere}>
                        {b.name}{takenElsewhere ? ' (allerede valgt)' : ''}
                      </option>
                    )
                  })}
                </select>
                <select disabled={row.status === 'done' || row.status === 'saving'} value={row.driverId ?? ''}
                  onChange={e => setRow(i, { driverId: e.target.value ? Number(e.target.value) : null })}
                  className="px-2.5 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-blue/30 disabled:opacity-60">
                  <option value="">— Ingen sjåfør —</option>
                  {drivers.filter(d => d.active).map(d => (
                    <option key={d.id} value={d.id}>{d.fullName}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <input type="date" disabled={row.status === 'done' || row.status === 'saving'} value={row.startDate}
                  onChange={e => setRow(i, { startDate: e.target.value })} className={`${timeInp} disabled:opacity-60`} />
                <input type="time" disabled={row.status === 'done' || row.status === 'saving'} value={row.startTime}
                  onChange={e => setRow(i, { startTime: e.target.value })} className={`${timeInp} disabled:opacity-60`} />
                <input type="time" disabled={row.status === 'done' || row.status === 'saving'} value={row.endTime}
                  onChange={e => setRow(i, { endTime: e.target.value })} className={`${timeInp} disabled:opacity-60`} />
              </div>
              {isReturn && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <input type="date" disabled={row.status === 'done' || row.status === 'saving'} value={row.returnDate}
                    onChange={e => setRow(i, { returnDate: e.target.value })} className={`${timeInp} disabled:opacity-60`} />
                  <input type="time" disabled={row.status === 'done' || row.status === 'saving'} value={row.returnStartTime}
                    onChange={e => setRow(i, { returnStartTime: e.target.value })} className={`${timeInp} disabled:opacity-60`} />
                  <input type="time" disabled={row.status === 'done' || row.status === 'saving'} value={row.returnEndTime}
                    onChange={e => setRow(i, { returnEndTime: e.target.value })} className={`${timeInp} disabled:opacity-60`} />
                </div>
              )}
              {row.error && <p className="text-xs text-red-600 mt-1.5">{row.error}</p>}
            </div>
          ))}

          <button onClick={addRow} className="text-xs font-semibold text-brand-blue hover:text-brand-blue-dark flex items-center gap-1">
            <Plus size={13} /> Legg til enda en buss
          </button>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <span className="text-xs text-gray-400">{doneCount}/{rows.length} lagret</span>
          <div className="flex gap-3">
            <button onClick={() => close(onClose)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">
              {allDone ? 'Lukk' : 'Avbryt'}
            </button>
            {!allDone && (
              <button onClick={saveAll} disabled={saving}
                className="px-5 py-2 bg-brand-blue hover:bg-brand-blue-dark active:scale-[0.97] text-white text-sm font-bold rounded-full transition-[background-color,transform] motion-reduce:transition-none disabled:opacity-50">
                {saving ? 'Lagrer…' : `Opprett ${rows.length - doneCount} kjøreordre`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Driver modal ──────────────────────────────────────────────────────────────
const DRIVER_PALETTE = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899']

function DriverModal({ initial, onSave, onDelete, onUpdated, onClose }) {
  const [confirmModal, askConfirm] = useConfirm()
  const { closing, close } = useClosingTransition()
  const editing = !!initial?.id
  const [driver, setDriver] = useState(initial ?? null)
  const [form, setForm] = useState({
    firstName: initial?.firstName ?? '',
    lastName: initial?.lastName ?? '',
    phone: initial?.phone ?? '',
    email: initial?.email ?? '',
    notes: initial?.notes ?? '',
    color: initial?.color ?? DRIVER_PALETTE[Math.floor(Math.random() * DRIVER_PALETTE.length)],
    active: initial?.active ?? true,
    showOnWebsite: initial?.showOnWebsite ?? false,
  })
  const [saving, setSaving] = useState(false)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [togglingAdmin, setTogglingAdmin] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const inp = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30'
  const canSave = form.firstName.trim() && form.lastName.trim() && (editing || form.phone.trim())

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      const result = editing
        ? await api.updateDriver(initial.id, form)
        : await api.createDriver(form)
      onSave(result, editing)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!await askConfirm({ title: 'Slett sjåfør', message: 'Er du sikker på at du vil slette denne sjåføren? Dette kan ikke angres.' })) return
    setSaving(true)
    try {
      await api.deleteDriver(initial.id)
      onDelete(initial.id)
    } finally {
      setSaving(false)
    }
  }

  const handleResendCredentials = async () => {
    if (!await askConfirm({ title: 'Send nye påloggingsopplysninger', message: 'Dette lager en ny innloggingskode og et nytt passord, og sender dem til sjåførens telefonnummer på SMS. Gammelt passord slutter å virke.' })) return
    setResending(true)
    try {
      const result = await api.resendDriverCredentials(initial.id)
      setDriver(result)
      onUpdated(result)
      setResent(true)
      setTimeout(() => setResent(false), 3000)
    } finally {
      setResending(false)
    }
  }

  const handleToggleAdmin = async () => {
    const nextIsAdmin = !driver?.isAdmin
    const message = nextIsAdmin
      ? `Gi ${driver?.fullName} tilgang til hele adminpanelet?`
      : `Fjerne admin-tilgangen til ${driver?.fullName}?`
    if (!await askConfirm({ title: 'Admin-tilgang', message, confirmLabel: nextIsAdmin ? 'Gi tilgang' : 'Fjern tilgang', danger: !nextIsAdmin })) return
    setTogglingAdmin(true)
    try {
      const result = await api.setDriverRole(initial.id, nextIsAdmin)
      setDriver(result)
      onUpdated(result)
    } catch (e) {
      await askConfirm({ title: 'Kunne ikke endre', message: e?.message || 'Noe gikk galt.', confirmLabel: 'OK', danger: false })
    } finally {
      setTogglingAdmin(false)
    }
  }

  return (
    <>
    {confirmModal}
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 transition-opacity duration-150 motion-reduce:transition-none ${closing ? 'opacity-0' : 'opacity-100'}`} onClick={e => e.target === e.currentTarget && close(onClose)}>
      <div className={`bg-white rounded-2xl shadow-xl w-full max-w-sm duration-150 motion-reduce:animate-none ${closing ? 'animate-out fade-out zoom-out-95' : 'animate-in fade-in zoom-in-95'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-brand-dark">{editing ? 'Rediger sjåfør' : 'Ny sjåfør'}</h2>
          <button onClick={() => close(onClose)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-brand-dark mb-1.5">Fornavn *</label>
              <input value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="Ola" className={inp} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-dark mb-1.5">Etternavn *</label>
              <input value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Nordmann" className={inp} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-dark mb-1.5">Telefon *</label>
            <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="95 45 38 07" className={inp} />
            {!editing && (
              <p className="text-xs text-gray-400 mt-1">Passord sendes på SMS til dette nummeret — sjåføren logger inn med telefonnummeret sitt.</p>
            )}
          </div>

          {editing && (
            <>
              <div className="bg-gray-50 rounded-xl p-3.5 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Innlogging</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Logger inn med</span>
                  <span className="font-mono font-semibold text-brand-dark">{driver?.phone}</span>
                </div>
                {driver?.mustChangePassword && (
                  <p className="text-xs text-amber-600 font-semibold">Venter på første innlogging / passordbytte</p>
                )}
                <button onClick={handleResendCredentials} disabled={resending}
                  className="flex items-center gap-1.5 text-xs font-semibold text-brand-blue hover:text-brand-blue-dark disabled:opacity-40 mt-1">
                  <RefreshCw size={12} className={resending ? 'animate-spin' : ''} />
                  {resent ? 'Sendt!' : resending ? 'Sender…' : 'Send nytt passord på SMS'}
                </button>
              </div>
              <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3.5">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin-tilgang</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {driver?.isAdmin ? 'Har full tilgang til adminpanelet.' : 'Kun tilgang til sjåfør-appen.'}
                  </p>
                </div>
                <button onClick={handleToggleAdmin} disabled={togglingAdmin}
                  className={`flex-shrink-0 text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors disabled:opacity-40
                    ${driver?.isAdmin ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-brand-blue text-white hover:bg-brand-blue-dark'}`}>
                  {togglingAdmin ? '…' : driver?.isAdmin ? 'Fjern admin' : 'Gjør til admin'}
                </button>
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-dark mb-1.5">E-post</label>
                <input value={form.email} onChange={e => set('email', e.target.value)} placeholder="ola@kjosavikreiser.no" className={inp} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-dark mb-1.5">Farge i kalender</label>
                <div className="flex gap-2 flex-wrap">
                  {DRIVER_PALETTE.map(c => (
                    <button key={c} onClick={() => set('color', c)}
                      style={{ backgroundColor: c }}
                      className={`w-7 h-7 rounded-full transition-transform motion-reduce:transition-none ${form.color === c ? 'scale-125 ring-2 ring-offset-2 ring-gray-400' : 'hover:scale-110'}`} />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-dark mb-1.5">Notater</label>
                <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className={`${inp} resize-none`} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} className="rounded" />
                <span className="text-sm text-gray-700">Aktiv</span>
              </label>
            </>
          )}
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          {editing
            ? <button onClick={handleDelete} disabled={saving} className="flex items-center gap-1.5 text-red-500 hover:text-red-700 text-sm font-semibold"><Trash2 size={14} /> Slett</button>
            : <span />
          }
          <div className="flex gap-3">
            <button onClick={() => close(onClose)} className="px-4 py-2 text-sm text-gray-500">Avbryt</button>
            <button onClick={handleSave} disabled={saving || !canSave}
              className="px-5 py-2 bg-brand-blue hover:bg-brand-blue-dark active:scale-[0.97] text-white text-sm font-bold rounded-full transition-[background-color,transform] motion-reduce:transition-none disabled:opacity-50">
              {saving ? 'Lagrer…' : editing ? 'Oppdater' : 'Legg til og send SMS'}
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

// ── Month Gantt view ──────────────────────────────────────────────────────────
const DAY_W = 38

function buildLanes(blocks) {
  const lanes = []
  blocks.forEach(block => {
    let placed = false
    for (const lane of lanes) {
      if (!lane.some(b => b.startDay <= block.endDay && b.endDay >= block.startDay)) {
        lane.push(block); placed = true; break
      }
    }
    if (!placed) lanes.push([block])
  })
  return lanes
}

function MonthGantt({ buses, assignments, year, month, onCellClick, onAssignmentClick }) {
  const days = daysInMonth(year, month)
  const dayNums = Array.from({ length: days }, (_, i) => i + 1)
  const today = dateKey(new Date())
  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month, days)
  const DAY_NAMES = ['Ma','Ti','On','To','Fr','Lø','Sø']

  const blocksByBus = {}
  buses.forEach(b => { blocksByBus[b.externalId] = [] })
  assignments.forEach(a => {
    const start = parseDate(a.startDate)
    const end = parseDate(a.endDate)
    const clampedStart = start < monthStart ? monthStart : start
    const clampedEnd = end > monthEnd ? monthEnd : end
    const startDay = clampedStart.getDate()
    const endDay = clampedEnd.getDate()
    if (blocksByBus[a.busId]) blocksByBus[a.busId].push({ ...a, startDay, endDay, span: endDay - startDay + 1 })
  })

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
      <table className="border-collapse" style={{ minWidth: `${180 + days * DAY_W}px` }}>
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 min-w-[180px]">Buss</th>
            {dayNums.map(d => {
              const dt = new Date(year, month, d)
              const dow = (dt.getDay() + 6) % 7
              const isToday = dateKey(dt) === today
              const isWeekend = dow >= 5
              return (
                <th key={d} style={{ width: DAY_W, minWidth: DAY_W }}
                  className={`text-center py-2 text-xs font-semibold border-l border-gray-100
                    ${isToday ? 'bg-brand-blue text-white' : isWeekend ? 'bg-gray-100 text-gray-400' : 'text-gray-500'}`}>
                  <div>{d}</div>
                  <div className="text-[10px] font-normal opacity-70">{DAY_NAMES[dow]}</div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {buses.length === 0 && (
            <tr><td colSpan={days + 1} className="text-center py-16 text-gray-400 text-sm">
              Ingen busser registrert ennå. Legg til busser under <strong>Busser</strong>-fanen.
            </td></tr>
          )}
          {buses.map((bus, bi) => {
            const lanes = buildLanes(blocksByBus[bus.externalId] ?? [])
            const laneCount = Math.max(lanes.length, 1)
            const rowBg = bi % 2 === 1
            return Array.from({ length: laneCount }, (_, li) => {
              const laneBlocks = lanes[li] ?? []
              const isFirst = li === 0
              const isLast = li === laneCount - 1
              return (
                <tr key={`${bus.externalId}-${li}`} className={`${isLast ? 'border-b border-gray-200' : ''} ${rowBg ? 'bg-gray-50/40' : ''}`}>
                  {isFirst && (
                    <td rowSpan={laneCount} className={`sticky left-0 z-10 px-4 py-2 border-b border-gray-200 align-middle ${rowBg ? 'bg-gray-50' : 'bg-white'}`}>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-brand-blue/10 flex items-center justify-center flex-shrink-0">
                          <BusIcon size={13} className="text-brand-blue" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-brand-dark leading-tight">{bus.name}</p>
                          {bus.registrationNumber && <p className="text-xs text-gray-400 font-mono">{bus.registrationNumber}</p>}
                        </div>
                      </div>
                    </td>
                  )}
                  {dayNums.map(d => {
                    const dt = new Date(year, month, d)
                    const dow = (dt.getDay() + 6) % 7
                    const isWeekend = dow >= 5
                    const isToday = dateKey(dt) === today
                    const block = laneBlocks.find(b => b.startDay === d)
                    const covered = laneBlocks.some(b => d > b.startDay && d <= b.endDay)
                    if (covered) return null
                    const span = block?.span ?? 1
                    return (
                      <td key={d} colSpan={block ? span : 1}
                        style={{ width: block ? DAY_W * span : DAY_W, minWidth: block ? DAY_W * span : DAY_W }}
                        className={`border-l border-gray-100 p-0.5 ${isToday && !block ? 'bg-brand-blue/5' : isWeekend && !block ? 'bg-gray-50/70' : ''}`}
                        onClick={() => isFirst && !block && onCellClick(bus.externalId, dateKey(dt))}>
                        {block ? (
                          <button onClick={e => { e.stopPropagation(); onAssignmentClick(block) }}
                            style={block.driverColor ? { backgroundColor: block.driverColor } : undefined}
                            className={`w-full rounded-lg flex flex-col items-start px-2 py-1 overflow-hidden text-white hover:opacity-90 transition-opacity
                              ${block.driverColor ? '' : block.driverId ? TYPE_COLORS[block.type]?.bg : 'bg-red-500'}`}>
                            <span className="text-xs font-semibold truncate leading-tight w-full">
                              {block.driverName || block.title || TYPE_COLORS[block.type]?.label}
                            </span>
                            {(block.startTime || block.endTime) && (
                              <span className="text-[10px] opacity-80">{block.startTime}{block.endTime ? `–${block.endTime}` : ''}</span>
                            )}
                            {!block.driverId && <span className="text-[9px] opacity-70">Ingen sjåfør</span>}
                          </button>
                        ) : isFirst ? (
                          <div className="w-full h-8 rounded-lg hover:bg-brand-blue/10 cursor-pointer transition-colors flex items-center justify-center group">
                            <Plus size={12} className="text-gray-200 group-hover:text-brand-blue opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        ) : <div className="w-full h-8" />}
                      </td>
                    )
                  })}
                </tr>
              )
            })
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Day view (horizontal timeline — buses as rows, hours as columns) ──────────
const HOUR_W = 64   // px per hour column
const HOURS_24 = Array.from({ length: 24 }, (_, i) => i) // 00–23

function DayView({ buses, assignments, date, onSlotClick, onAssignmentClick }) {
  const dayStr = dateKey(date)
  const totalWidth = 24 * HOUR_W

  const busAssignments = (busId) =>
    assignments.filter(a => {
      const s = a.startDate.slice(0, 10)
      const e = a.endDate.slice(0, 10)
      return a.busId === busId && dayStr >= s && dayStr <= e
    })

  function buildTimeLanes(asgns) {
    // Same lane-splitting logic as Gantt but by time instead of day
    const lanes = []
    const sorted = [...asgns].sort((a, b) => (toMinutes(a.startTime) ?? 0) - (toMinutes(b.startTime) ?? 0))
    sorted.forEach(a => {
      const aStart = toMinutes(a.startTime) ?? 0
      const aEnd   = toMinutes(a.endTime)   ?? 1440
      let placed = false
      for (const lane of lanes) {
        const conflict = lane.some(b => {
          const bStart = toMinutes(b.startTime) ?? 0
          const bEnd   = toMinutes(b.endTime)   ?? 1440
          return aStart < bEnd && aEnd > bStart
        })
        if (!conflict) { lane.push(a); placed = true; break }
      }
      if (!placed) lanes.push([a])
    })
    return lanes
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <div style={{ minWidth: `${180 + totalWidth}px` }}>
          {/* Header: hours */}
          <div className="flex border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
            <div className="w-44 flex-shrink-0 border-r border-gray-200 px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
              Buss
            </div>
            {HOURS_24.map(h => {
              const isNight = h < 6 || h >= 22
              return (
                <div key={h} style={{ width: HOUR_W, minWidth: HOUR_W }}
                  className={`border-r border-gray-100 text-center py-2 text-xs font-semibold
                    ${isNight ? 'text-gray-300 bg-gray-50/80' : 'text-gray-500'}`}>
                  {String(h).padStart(2, '0')}:00
                </div>
              )
            })}
          </div>

          {buses.length === 0 && (
            <div className="py-16 text-center text-gray-400 text-sm">
              Ingen busser registrert. Legg til busser under <strong>Busser</strong>-fanen.
            </div>
          )}

          {/* Bus rows */}
          {buses.map((bus, bi) => {
            const asgns = busAssignments(bus.externalId)
            const lanes = buildTimeLanes(asgns)
            const laneCount = Math.max(lanes.length, 1)
            const ROW_H = 44
            const rowHeight = laneCount * ROW_H
            const rowBg = bi % 2 === 1

            return (
              <div key={bus.externalId} className={`flex border-b border-gray-100 ${rowBg ? 'bg-gray-50/40' : ''}`}
                style={{ minHeight: rowHeight }}>
                {/* Bus label */}
                <div className={`w-44 flex-shrink-0 border-r border-gray-200 px-4 flex items-center ${rowBg ? 'bg-gray-50' : 'bg-white'}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-brand-blue/10 flex items-center justify-center flex-shrink-0">
                      <BusIcon size={13} className="text-brand-blue" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-brand-dark leading-tight">{bus.name}</p>
                      {bus.registrationNumber && <p className="text-xs text-gray-400 font-mono">{bus.registrationNumber}</p>}
                    </div>
                  </div>
                </div>

                {/* Hour timeline */}
                <div className="relative flex-1" style={{ height: rowHeight }}>
                  {/* Hour grid lines + click targets */}
                  <div className="absolute inset-0 flex">
                    {HOURS_24.map(h => {
                      const isNight = h < 6 || h >= 22
                      return (
                        <div key={h} style={{ width: HOUR_W, minWidth: HOUR_W }}
                          className={`border-r border-gray-100 h-full relative cursor-pointer group
                            ${isNight ? 'bg-slate-50/60' : ''} hover:bg-brand-blue/5 transition-colors`}
                          onClick={() => onSlotClick(bus.externalId, dayStr, `${String(h).padStart(2,'0')}:00`)}>
                          {/* half-hour tick */}
                          <div className="absolute top-0 bottom-0 border-r border-dashed border-gray-100" style={{ left: HOUR_W / 2 }} />
                          <Plus size={10} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-brand-blue/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )
                    })}
                  </div>

                  {/* Assignment blocks — one layer per lane */}
                  {lanes.map((lane, li) =>
                    lane.map(a => {
                      const startMin = toMinutes(a.startTime) ?? 0
                      const endMin   = toMinutes(a.endTime)   ?? 1440
                      const left   = (startMin / 60) * HOUR_W
                      const width  = Math.max(((endMin - startMin) / 60) * HOUR_W, 32)
                      const top    = li * ROW_H + 4
                      const height = ROW_H - 8
                      const bgColor = a.driverColor || undefined
                      const bgClass = !bgColor ? TYPE_COLORS[a.type]?.bg : ''
                      return (
                        <button key={a.id}
                          onClick={e => { e.stopPropagation(); onAssignmentClick(a) }}
                          style={{ left, width, top, height, backgroundColor: bgColor || undefined }}
                          className={`absolute rounded-lg px-2 text-left overflow-hidden text-white z-10
                            hover:opacity-90 active:scale-95 transition-[opacity,transform] motion-reduce:transition-none shadow-sm
                            ${bgColor ? '' : a.driverId ? (TYPE_COLORS[a.type]?.bg || 'bg-blue-500') : 'bg-red-500'}`}>
                          <p className="text-xs font-bold truncate leading-tight mt-0.5">
                            {a.driverName || a.title || TYPE_COLORS[a.type]?.label}
                          </p>
                          {height > 28 && (
                            <p className="text-[10px] opacity-80 leading-tight">
                              {a.startTime || '00:00'}–{a.endTime || '24:00'}
                            </p>
                          )}
                          {!a.driverId && height > 40 && (
                            <p className="text-[9px] opacity-70">Ingen sjåfør</p>
                          )}
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}


// ── Drivers management tab ────────────────────────────────────────────────────
function DriversTab({ drivers, onAdd, onEdit }) {
  const [search, setSearch] = useState('')
  const filtered = drivers.filter(d => {
    const q = search.toLowerCase()
    return !q || d.fullName.toLowerCase().includes(q) || d.phone?.includes(q) || d.email?.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Søk navn, telefon eller e-post…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}
        </div>
        <p className="text-sm text-gray-400 whitespace-nowrap">
          {filtered.length} av {drivers.length} sjåfører
        </p>
        <button onClick={onAdd}
          className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold px-5 py-2.5 rounded-full text-sm transition-colors">
          <Plus size={14} /> Legg til sjåfør
        </button>
      </div>

      {drivers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 flex flex-col items-center justify-center py-20 text-gray-400">
          <Users size={36} className="mb-3 opacity-30" />
          <p className="font-medium">Ingen sjåfører ennå</p>
          <p className="text-sm mt-1">Klikk «Legg til sjåfør» for å komme i gang</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 flex flex-col items-center justify-center py-16 text-gray-400">
          <p className="font-medium">Ingen treff for «{search}»</p>
          <button onClick={() => setSearch('')} className="text-sm text-brand-blue hover:underline mt-2">Nullstill søk</button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Navn</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Telefon</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">E-post</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Rolle</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Kalender</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(d => (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: d.color }}>
                        {(d.firstName[0] || '') + (d.lastName[0] || '')}
                      </span>
                      <span className={`font-semibold text-sm ${!d.active ? 'text-gray-400 line-through' : 'text-brand-dark'}`}>{d.fullName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {d.phone ? (
                      <a href={`tel:${d.phone}`} className="flex items-center gap-1.5 text-sm text-brand-blue hover:underline">
                        <Phone size={12} /> {d.phone}
                      </a>
                    ) : <span className="text-gray-300 text-sm">—</span>}
                  </td>
                  <td className="px-5 py-4">
                    {d.email ? (
                      <a href={`mailto:${d.email}`} className="flex items-center gap-1.5 text-sm text-brand-blue hover:underline">
                        <Mail size={12} /> {d.email}
                      </a>
                    ) : <span className="text-gray-300 text-sm">—</span>}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold
                      ${d.isAdmin ? 'bg-brand-blue/10 text-brand-blue' : 'bg-gray-100 text-gray-500'}`}>
                      {d.isAdmin ? 'Admin' : 'Sjåfør'}
                    </span>
                    {d.mustChangePassword && (
                      <span className="block text-[10px] text-amber-600 font-semibold mt-0.5">Venter på 1. innlogging</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold
                      ${d.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                      {d.active ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="w-4 h-4 rounded-full inline-block" style={{ backgroundColor: d.color }} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button onClick={() => onEdit(d)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-brand-blue transition-colors ml-auto">
                      <Edit2 size={13} /> Rediger
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Buses management tab ──────────────────────────────────────────────────────
function BusesTab({ buses, setBuses, categories }) {
  const addBus = () => {
    setBuses(prev => [
      ...prev,
      { _tempId: Date.now(), name: '', registrationNumber: '', seats: 50, description: '', images: [], amenities: ['Wifi', 'Klimaanlegg', 'WC'], active: true, showOnWebsite: false, priceCategoryId: categories[0]?.id ?? null }
    ])
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{buses.filter(b => b.active).length} av {buses.length} busser er aktive</p>
        <button onClick={addBus}
          className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-semibold px-4 py-2.5 rounded-full text-sm transition-colors">
          <Plus size={15} /> Legg til buss
        </button>
      </div>

      {categories.length === 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          Ingen priskategorier er opprettet ennå. Gå til <strong>Priskalkulator</strong> og legg til kategorier (f.eks. «Minibuss», «Stor buss») før du setter opp busser.
        </div>
      )}

      {buses.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 flex flex-col items-center justify-center py-20 text-gray-400">
          <BusIcon size={36} className="mb-3 opacity-30" />
          <p className="font-medium">Ingen busser registrert</p>
          <p className="text-sm mt-1">Klikk «Legg til buss» for å komme i gang</p>
        </div>
      )}

      <div className="space-y-4">
        {buses.map(bus => (
          <BusCard
            key={bus.id ?? bus._tempId}
            bus={bus}
            categories={categories}
            onSaved={updated => setBuses(prev =>
              bus.id
                ? prev.map(b => b.id === updated.id ? updated : b)
                : prev.map(b => b._tempId === bus._tempId ? updated : b)
            )}
            onDeleted={id => setBuses(prev => prev.filter(b => b.id !== id && b._tempId !== id))}
          />
        ))}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminPlanningPage() {
  const now = new Date()
  const [tab, setTab] = useState('calendar') // calendar | drivers | buses
  const [calView, setCalView] = useState('month') // month | day
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedDay, setSelectedDay] = useState(now)
  const [buses, setBuses] = useState([])
  const [drivers, setDrivers] = useState([])
  const [assignments, setAssignments] = useState([])
  const [priceCategories, setPriceCategories] = useState([])
  const [unplannedBookings, setUnplannedBookings] = useState([])
  const [loading, setLoading] = useState(true)

  const [assignModal, setAssignModal] = useState(null)
  const [bulkPlanModal, setBulkPlanModal] = useState(null)
  const [driverModal, setDriverModal] = useState(null)

  const [orderSearch, setOrderSearch] = useState('')
  const [orderSearching, setOrderSearching] = useState(false)
  const [orderSearchResult, setOrderSearchResult] = useState(null) // { assignment } | { unplanned } | { notFound: true } | null

  const MONTH_NAMES = ['Januar','Februar','Mars','April','Mai','Juni','Juli','August','September','Oktober','November','Desember']

  const load = useCallback(async (y, m) => {
    setLoading(true)
    try {
      const [b, d, a, c] = await Promise.all([
        api.getBuses().catch(() => []),
        api.getDrivers().catch(() => []),
        api.getAssignments(y, m + 1).catch(() => []),
        api.getPriceCategories().catch(() => []),
      ])
      setBuses(b)
      setDrivers(d)
      setAssignments(a)
      setPriceCategories(c)
    } catch (e) {
      console.error('Planning load error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadUnplanned = useCallback(async () => {
    try {
      const data = await api.getUnplannedBookings()
      setUnplannedBookings(data)
      return data
    } catch {
      setUnplannedBookings([])
      return []
    }
  }, [])

  useEffect(() => { loadUnplanned() }, [loadUnplanned])

  useEffect(() => { load(year, month) }, [year, month, load])

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }
  const goToday = () => {
    setYear(now.getFullYear()); setMonth(now.getMonth()); setSelectedDay(now)
  }
  const prevDay = () => setSelectedDay(d => { const n = new Date(d); n.setDate(n.getDate() - 1); return n })
  const nextDay = () => setSelectedDay(d => { const n = new Date(d); n.setDate(n.getDate() + 1); return n })

  const handleCellClick = (busId, date) => {
    setAssignModal({ initial: { busId, startDate: date, endDate: date } })
  }
  const handleSlotClick = (busId, date, time) => {
    const endH = String(Math.min(parseInt(time) + 1, 23)).padStart(2, '0')
    setAssignModal({ initial: { busId, startDate: date, endDate: date, startTime: time, endTime: `${endH}:00` } })
  }
  const handleAssignmentClick = (a) => setAssignModal({ initial: a })
  // Multi-bus orders (more than one bus still needed) go to the bulk modal so the admin
  // assigns every remaining bus/driver in one screen instead of repeating this flow N times.
  const handlePlanBooking = (booking) => {
    const remaining = (booking.busCount || 1) - (booking.plannedCount || 0)
    if (remaining > 1) setBulkPlanModal(booking)
    else setAssignModal({ initial: null, linkedBooking: booking })
  }

  const handleBulkSaved = (created) => {
    setAssignments(prev => [...prev, ...created])
    loadUnplanned()
  }
  const closeBulkPlan = () => { setBulkPlanModal(null); loadUnplanned() }

  const handleAssignSave = async (result, editing, booking) => {
    setAssignments(prev => editing ? prev.map(a => a.id === result.id ? result : a) : [...prev, result])
    setAssignModal(null)
    setOrderSearchResult(null)
    if (!result.bookingId) return
    // Re-fetch rather than assume this booking is fully planned — a multi-bus order (BusCount
    // > 1) needs one kjøreordre per bus, so it can still have buses left after this save.
    const fresh = await loadUnplanned()
    if (!editing && booking?.busCount > 1) {
      const stillNeeded = fresh.find(b => b.id === booking.id)
      if (stillNeeded) setAssignModal({ initial: null, linkedBooking: stillNeeded })
    }
  }
  const handleAssignDelete = (id) => { setAssignments(prev => prev.filter(a => a.id !== id)); setAssignModal(null) }

  const searchOrders = async (e) => {
    e.preventDefault()
    const q = orderSearch.trim()
    if (!q) return
    setOrderSearching(true)
    setOrderSearchResult(null)
    try {
      const results = await api.searchAssignments(q)
      if (results.length > 0) {
        const a = results[0]
        const start = parseDate(a.startDate)
        setYear(start.getFullYear())
        setMonth(start.getMonth())
        setOrderSearchResult({ assignment: a })
        setAssignModal({ initial: a })
        return
      }
      const unplanned = unplannedBookings.find(b =>
        b.reference.toLowerCase().includes(q.toLowerCase()) || b.contactName?.toLowerCase().includes(q.toLowerCase()))
      setOrderSearchResult(unplanned ? { unplanned } : { notFound: true })
    } catch {
      setOrderSearchResult({ notFound: true })
    } finally {
      setOrderSearching(false)
    }
  }

  const handleDriverSave = (result, editing) => {
    setDrivers(prev => editing ? prev.map(d => d.id === result.id ? result : d) : [...prev, result])
    setDriverModal(null)
  }
  const handleDriverDelete = (id) => { setDrivers(prev => prev.filter(d => d.id !== id)); setDriverModal(null) }
  // Updates the list in place without closing the modal — used for in-modal actions
  // (resend credentials, toggle admin) that show their own inline confirmation.
  const handleDriverUpdated = (result) => setDrivers(prev => prev.map(d => d.id === result.id ? result : d))

  const TABS = [
    { id: 'calendar', label: 'Kalender', icon: CalendarDays },
    { id: 'drivers',  label: 'Sjåfører', icon: Users },
    { id: 'buses',    label: 'Busser',   icon: BusIcon },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-brand-dark">Planlegger</h1>
          <p className="text-sm text-gray-400 mt-0.5">Kalender, sjåfører og flåteoversikt</p>
        </div>
        {tab === 'calendar' && (
          <button onClick={() => setAssignModal({ initial: null })}
            className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold px-5 py-2.5 rounded-full text-sm transition-colors">
            <Plus size={15} /> Ny oppgave
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all
              ${tab === id ? 'bg-white text-brand-dark shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Calendar tab */}
      {tab === 'calendar' && (
        <div className="space-y-4">
          {/* Order / reference search — finds an existing kjøreordre or an unplanned booking by reference or navn */}
          <form onSubmit={searchOrders} className="flex gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={orderSearch}
                onChange={e => { setOrderSearch(e.target.value); setOrderSearchResult(null) }}
                placeholder="Søk bestilling (referanse, navn)"
                className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 bg-white"
              />
            </div>
            <button type="submit" disabled={orderSearching || !orderSearch.trim()}
              className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors">
              {orderSearching ? 'Søker…' : 'Søk'}
            </button>
            {orderSearchResult && (
              <button type="button" onClick={() => { setOrderSearchResult(null); setOrderSearch('') }}
                className="px-3 py-2.5 rounded-xl border border-gray-200 text-gray-400 hover:bg-gray-50 text-sm transition-colors">
                <X size={14} />
              </button>
            )}
          </form>

          {orderSearchResult?.notFound && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
              Ingen treff for «{orderSearch}».
            </div>
          )}
          {orderSearchResult?.unplanned && (
            <div className="flex items-center justify-between gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-brand-dark font-mono">{orderSearchResult.unplanned.reference}</p>
                <p className="text-xs text-gray-500 truncate">
                  {orderSearchResult.unplanned.contactName} · {orderSearchResult.unplanned.fromAddress} → {orderSearchResult.unplanned.toAddress} · Ikke planlagt ennå
                </p>
              </div>
              <button onClick={() => handlePlanBooking(orderSearchResult.unplanned)}
                className="flex-shrink-0 flex items-center gap-1.5 bg-brand-blue hover:bg-brand-blue-dark text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors">
                <Plus size={13} /> Planlegg
              </button>
            </div>
          )}

          {/* New/unplanned orders — surfaces bookings that don't have a kjøreordre yet */}
          {unplannedBookings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3">
                Nye bestillinger — venter på planlegging ({unplannedBookings.length})
              </p>
              <div className="space-y-2">
                {unplannedBookings.map(b => (
                  <div key={b.id} className="flex items-center justify-between gap-3 bg-white border border-amber-100 rounded-xl px-4 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-brand-dark">
                        <span className="font-mono text-xs text-gray-400 mr-2">{b.reference}</span>{b.contactName}
                        {b.busCount > 1 && (
                          <span className="ml-2 inline-flex items-center text-xs font-bold text-brand-blue bg-brand-blue/10 px-2 py-0.5 rounded-full">
                            {b.plannedCount ?? 0}/{b.busCount} busser
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {b.fromAddress} → {b.toAddress} · {parseDate(b.departureDate).toLocaleDateString('nb-NO')}
                      </p>
                    </div>
                    <button onClick={() => handlePlanBooking(b)}
                      className="flex-shrink-0 flex items-center gap-1.5 bg-brand-blue hover:bg-brand-blue-dark text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors">
                      <Plus size={13} /> Planlegg
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nav bar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* View switcher */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mr-2">
              {[{ id: 'month', label: 'Måned' }, { id: 'day', label: 'Dag' }].map(v => (
                <button key={v.id} onClick={() => setCalView(v.id)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all
                    ${calView === v.id ? 'bg-white text-brand-dark shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  {v.label}
                </button>
              ))}
            </div>

            {/* Prev */}
            <button onClick={calView === 'month' ? prevMonth : prevDay}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
              <ChevronLeft size={16} />
            </button>

            {/* Title */}
            {calView === 'month' ? (
              <h2 className="text-lg font-bold text-brand-dark min-w-[180px] text-center">
                {MONTH_NAMES[month]} {year}
              </h2>
            ) : (
              <h2 className="text-lg font-bold text-brand-dark min-w-[200px] text-center">
                {selectedDay.toLocaleDateString('nb-NO', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h2>
            )}

            {/* Next */}
            <button onClick={calView === 'month' ? nextMonth : nextDay}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
              <ChevronRight size={16} />
            </button>

            <button onClick={goToday}
              className="flex items-center gap-1.5 text-xs font-semibold text-brand-blue hover:text-brand-blue-dark px-3 py-1.5 rounded-full border border-brand-blue/30 hover:bg-brand-blue/5 transition-colors">
              <Calendar size={12} /> I dag
            </button>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl border border-gray-200 flex items-center justify-center py-24 text-gray-400 text-sm">Laster…</div>
          ) : calView === 'month' ? (
            <MonthGantt buses={buses} assignments={assignments} year={year} month={month}
              onCellClick={handleCellClick} onAssignmentClick={handleAssignmentClick} />
          ) : (
            <DayView buses={buses} assignments={assignments} date={selectedDay}
              onSlotClick={handleSlotClick} onAssignmentClick={handleAssignmentClick} />
          )}

          <div className="flex items-center gap-4 flex-wrap">
            {Object.entries(TYPE_COLORS).map(([key, { bg, label }]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded ${bg}`} />
                <span className="text-xs text-gray-500">{label}</span>
              </div>
            ))}
            <span className="text-xs text-gray-400">· Farge følger sjåfør når valgt</span>
          </div>
        </div>
      )}

      {/* Drivers tab */}
      {tab === 'drivers' && (
        <DriversTab
          drivers={drivers}
          onAdd={() => setDriverModal({ initial: null })}
          onEdit={(d) => setDriverModal({ initial: d })}
        />
      )}

      {/* Buses tab */}
      {tab === 'buses' && <BusesTab buses={buses} setBuses={setBuses} categories={priceCategories} />}

      {/* Modals */}
      {assignModal && (
        <AssignmentModal buses={buses} drivers={drivers} assignments={assignments} initial={assignModal.initial}
          unplannedBookings={unplannedBookings} linkedBooking={assignModal.linkedBooking}
          onSave={handleAssignSave} onDelete={handleAssignDelete} onClose={() => setAssignModal(null)} />
      )}
      {bulkPlanModal && (
        <BulkPlanModal booking={bulkPlanModal} buses={buses} drivers={drivers}
          onSaved={handleBulkSaved} onClose={closeBulkPlan} />
      )}
      {driverModal && (
        <DriverModal initial={driverModal.initial}
          onSave={handleDriverSave} onDelete={handleDriverDelete} onUpdated={handleDriverUpdated} onClose={() => setDriverModal(null)} />
      )}
    </div>
  )
}
