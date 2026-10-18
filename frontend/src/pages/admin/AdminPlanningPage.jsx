import { useState, useEffect, useCallback } from 'react'
import { useConfirm } from '../../hooks/useConfirm'
import { useClosingTransition } from '../../hooks/useClosingTransition'
import { ChevronLeft, ChevronRight, Plus, X, Trash2, Bus as BusIcon, Calendar, Search } from 'lucide-react'
import { api } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import { findConflicts, ConflictNotice, blockStatusClass, StatusBadge, UnplannedQueue } from '../../components/admin/PlanningParts'
import { buildStopsFromBooking, stopsToPayload } from '../../utils/bookingHelpers'

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
function firstFreeBus(buses, assignments, booking) {
  if (!booking) return buses[0]?.externalId ?? ''
  const base = {
    startDate: (booking.departureDate || '').slice(0, 10),
    endDate: (booking.returnDate || booking.departureDate || '').slice(0, 10),
    startTime: booking.departureTime, endTime: booking.returnTime || estimateEndTime(booking.departureTime, oneWayDistanceKm(booking)),
  }
  const free = buses.find(b => findConflicts(assignments, { ...base, busId: b.externalId }).bus.length === 0)
  return (free ?? buses[0])?.externalId ?? ''
}

function AssignmentModal({ buses, drivers, assignments, initial, unplannedBookings, linkedBooking, onSave, onDelete, onClose }) {
  const [confirmModal, askConfirm] = useConfirm()
  const { closing, close } = useClosingTransition()
  const editing = !!initial?.id
  const [form, setForm] = useState({
    busId: initial?.busId ?? firstFreeBus(buses, assignments, linkedBooking),
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
      setErrors(er => ({ ...er, _form: e?.message || 'Lagring feilet — bussen eller sjåføren kan være opptatt.' }))
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

  const conflicts = findConflicts(assignments, {
    busId: form.busId, driverId: form.driverId, startDate: form.startDate, endDate: form.endDate,
    startTime: form.startTime, endTime: form.endTime, excludeId: initial?.id,
  })
  const hasConflict = conflicts.bus.length > 0 || conflicts.driver.length > 0
  const freeBuses = conflicts.bus.length > 0
    ? buses.filter(b => b.externalId !== form.busId && findConflicts(assignments, { ...form, busId: b.externalId, driverId: null, excludeId: initial?.id }).bus.length === 0)
    : []
  const busyDriverIds = new Set(
    drivers.filter(d => findConflicts(assignments, { ...form, busId: null, driverId: d.id, excludeId: initial?.id }).driver.length > 0).map(d => d.id))

  return (
    <>
    {confirmModal}
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 transition-opacity duration-150 motion-reduce:transition-none ${closing ? 'opacity-0' : 'opacity-100'}`} onClick={e => e.target === e.currentTarget && close(onClose)}>
      <div className={`bg-white rounded-2xl shadow-xl w-full max-w-lg duration-150 motion-reduce:animate-none ${closing ? 'animate-out fade-out zoom-out-95' : 'animate-in fade-in zoom-in-95'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-brand-dark">{editing ? 'Rediger oppgave' : 'Ny oppgave'}</h2>
          <button onClick={() => close(onClose)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {errors._form && <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{errors._form}</div>}
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
            <ConflictNotice kind="bus" items={conflicts.bus}>
              {freeBuses.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-red-700">Ledige busser:</span>
                  {freeBuses.map(b => (
                    <button key={b.externalId} type="button" onClick={() => set('busId', b.externalId)}
                      className="text-xs font-semibold px-2 py-1 rounded-md bg-white border border-red-200 text-red-700 hover:bg-red-100">
                      {b.name}
                    </button>
                  ))}
                </div>
              )}
              {freeBuses.length === 0 && <p className="mt-1.5 text-xs text-red-700">Ingen andre busser er ledige i dette tidsrommet.</p>}
            </ConflictNotice>
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
                <option key={d.id} value={d.id}>{d.fullName}{busyDriverIds.has(d.id) ? ' — opptatt' : d.phone ? ` · ${d.phone}` : ''}</option>
              ))}
            </select>
            <ConflictNotice kind="driver" items={conflicts.driver} />
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
            <button onClick={handleSave} disabled={saving || hasConflict} title={hasConflict ? 'Løs konflikten først' : undefined}
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
function BulkPlanModal({ booking, buses, drivers, assignments, onSaved, onClose }) {
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

  // Conflicts per row: against loaded assignments and against the other rows in this modal
  // (so two buses can't share a driver at the same time).
  const rowLegs = (r) => {
    const legs = [{ startDate: r.startDate, endDate: r.startDate, startTime: r.startTime, endTime: r.endTime }]
    if (isReturn) {
      const d = r.returnDate || r.startDate
      legs.push({ startDate: d, endDate: d, startTime: r.returnStartTime, endTime: r.returnEndTime })
    }
    return legs
  }
  const rowConflicts = rows.map((r, i) => {
    if (r.status === 'done') return { bus: [], driver: [] }
    const others = rows.flatMap((o, j) => j === i ? [] : rowLegs(o).map((l, k) => ({
      ...l, id: `row-${j}-${k}`, busId: o.busId, driverId: o.driverId, title: `Buss ${j + 1} i denne bestillingen`,
    })))
    const pool = [...(assignments || []), ...others]
    const bus = new Map()
    const driver = new Map()
    for (const l of rowLegs(r)) {
      const c = findConflicts(pool, { busId: r.busId, driverId: r.driverId, ...l })
      c.bus.forEach(a => bus.set(a.id, a))
      c.driver.forEach(a => driver.set(a.id, a))
    }
    return { bus: [...bus.values()], driver: [...driver.values()] }
  })
  const hasConflict = rowConflicts.some(c => c.bus.length || c.driver.length)

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
              <ConflictNotice kind="bus" items={rowConflicts[i].bus} />
              <ConflictNotice kind="driver" items={rowConflicts[i].driver} />
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
              <button onClick={saveAll} disabled={saving || hasConflict} title={hasConflict ? 'Løs konfliktene først' : undefined}
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
              Ingen busser registrert ennå. Legg til busser under <strong>Oppsett → Busser</strong>.
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
                            style={block.driverColor && (block.driverId || block.type !== 'trip') ? { backgroundColor: block.driverColor } : undefined}
                            title={`${block.title || ''}${block.driverName ? ` · ${block.driverName}` : ' · Ingen sjåfør'}`}
                            className={`w-full rounded-lg flex flex-col items-start px-2 py-1 overflow-hidden text-white hover:opacity-90 transition-opacity
                              ${blockStatusClass(block)} ${!block.driverId && block.type === 'trip' ? 'bg-red-500' : block.driverColor ? '' : TYPE_COLORS[block.type]?.bg}`}>
                            <span className="flex items-center gap-1 text-xs font-semibold truncate leading-tight w-full">
                              <StatusBadge a={block} />
                              <span className="truncate">{block.driverName || TYPE_COLORS[block.type]?.label}</span>
                            </span>
                            {block.title && block.span > 1 && <span className="text-[10px] opacity-90 truncate w-full leading-tight">{block.title}</span>}
                            {(block.startTime || block.endTime) && (
                              <span className="text-[10px] opacity-80">{block.startTime}{block.endTime ? `–${block.endTime}` : ''}</span>
                            )}
                            {!block.driverId && block.type === 'trip' && <span className="text-[9px] font-semibold">Mangler sjåfør</span>}
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
              Ingen busser registrert. Legg til busser under <strong>Oppsett → Busser</strong>.
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
                      return (
                        <button key={a.id}
                          onClick={e => { e.stopPropagation(); onAssignmentClick(a) }}
                          style={{ left, width, top, height, backgroundColor: (a.driverId || a.type !== 'trip') ? bgColor : undefined }}
                          title={`${a.title || ''}${a.driverName ? ` · ${a.driverName}` : ' · Ingen sjåfør'}`}
                          className={`absolute rounded-lg px-2 text-left overflow-hidden text-white z-10
                            hover:opacity-90 active:scale-95 transition-[opacity,transform] motion-reduce:transition-none shadow-sm ${blockStatusClass(a)}
                            ${!a.driverId && a.type === 'trip' ? 'bg-red-500' : bgColor ? '' : (TYPE_COLORS[a.type]?.bg || 'bg-blue-500')}`}>
                          <p className="flex items-center gap-1 text-xs font-bold truncate leading-tight mt-0.5">
                            <StatusBadge a={a} />
                            <span className="truncate">{a.driverName || a.title || TYPE_COLORS[a.type]?.label}</span>
                          </p>
                          {height > 28 && (
                            <p className="text-[10px] opacity-80 leading-tight">
                              {a.startTime || '00:00'}–{a.endTime || '24:00'}
                            </p>
                          )}
                          {!a.driverId && a.type === 'trip' && height > 40 && (
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


// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminPlanningPage() {
  const now = new Date()
  const [calView, setCalView] = useState('month') // month | day
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedDay, setSelectedDay] = useState(now)
  const [buses, setBuses] = useState([])
  const [drivers, setDrivers] = useState([])
  const [assignments, setAssignments] = useState([])
  const [unplannedBookings, setUnplannedBookings] = useState([])
  const [loading, setLoading] = useState(true)

  const [assignModal, setAssignModal] = useState(null)
  const toast = useToast()
  const [bulkPlanModal, setBulkPlanModal] = useState(null)

  const [orderSearch, setOrderSearch] = useState('')
  const [orderSearching, setOrderSearching] = useState(false)
  const [orderSearchResult, setOrderSearchResult] = useState(null) // { assignment } | { unplanned } | { notFound: true } | null

  const MONTH_NAMES = ['Januar','Februar','Mars','April','Mai','Juni','Juli','August','September','Oktober','November','Desember']

  const load = useCallback(async (y, m) => {
    setLoading(true)
    try {
      const [b, d, a] = await Promise.all([
        api.getBuses().catch(() => []),
        api.getDrivers().catch(() => []),
        api.getAssignments(y, m + 1).catch(() => []),
      ])
      setBuses(b)
      setDrivers(d)
      setAssignments(a)
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
    toast.success(`${created.length} kjøreordre opprettet`)
    loadUnplanned()
  }
  const closeBulkPlan = () => { setBulkPlanModal(null); loadUnplanned() }

  const handleAssignSave = async (result, editing, booking) => {
    setAssignments(prev => editing ? prev.map(a => a.id === result.id ? result : a) : [...prev, result])
    setAssignModal(null)
    setOrderSearchResult(null)
    toast.success(editing ? 'Kjøreordre oppdatert' : 'Kjøreordre opprettet')
    if (!result.bookingId) return
    // Re-fetch rather than assume this booking is fully planned — a multi-bus order (BusCount
    // > 1) needs one kjøreordre per bus, so it can still have buses left after this save.
    const fresh = await loadUnplanned()
    if (!editing && booking?.busCount > 1) {
      const stillNeeded = fresh.find(b => b.id === booking.id)
      if (stillNeeded) setAssignModal({ initial: null, linkedBooking: stillNeeded })
    }
  }
  const handleAssignDelete = (id) => { setAssignments(prev => prev.filter(a => a.id !== id)); setAssignModal(null); toast.success('Kjøreordre slettet') }

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-brand-dark">Planlegger</h1>
          <p className="text-sm text-gray-400 mt-0.5">Kalender og tildeling av busser og sjåfører</p>
        </div>
          <button onClick={() => setAssignModal({ initial: null })}
            className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold px-5 py-2.5 rounded-full text-sm transition-colors">
            <Plus size={15} /> Ny oppgave
          </button>
      </div>

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

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px] items-start">
          <div className="space-y-4 min-w-0">
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
            <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded bg-red-500" />Mangler sjåfør</span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded bg-blue-500 ring-2 ring-blue-300" />Pågår</span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded bg-blue-500 opacity-60" />Fullført</span>
            <span className="text-xs text-gray-400">· Farge følger sjåfør når valgt</span>
          </div>
          </div>
          <div className="xl:sticky xl:top-4">
            <UnplannedQueue bookings={unplannedBookings} onPlan={handlePlanBooking} />
          </div>
          </div>
        </div>

      {/* Modals */}
      {assignModal && (
        <AssignmentModal buses={buses} drivers={drivers} assignments={assignments} initial={assignModal.initial}
          unplannedBookings={unplannedBookings} linkedBooking={assignModal.linkedBooking}
          onSave={handleAssignSave} onDelete={handleAssignDelete} onClose={() => setAssignModal(null)} />
      )}
      {bulkPlanModal && (
        <BulkPlanModal booking={bulkPlanModal} buses={buses} drivers={drivers} assignments={assignments}
          onSaved={handleBulkSaved} onClose={closeBulkPlan} />
      )}
    </div>
  )
}
