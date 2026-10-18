import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../../services/api'
import { useConfig } from '../../contexts/ConfigContext'
import { useConfirm } from '../../hooks/useConfirm'
import { CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, Phone, Mail, Building, Search, Archive, Inbox, SendHorizontal, Printer, X, Square, CheckSquare, Download, Loader2, Bus as BusIcon, User, Plus, Trash2, ArrowUp, ArrowDown, MessageSquare, PlayCircle } from 'lucide-react'
import AddressInput from '../../components/AddressInput'
import TripMap from '../../components/admin/TripMap'
import { toDateTimeLocal, buildStopsFromBooking, stopsToPayload } from '../../utils/bookingHelpers'
import { printInvoice } from '../../utils/printInvoice'
import { TripTimeline } from '../../components/admin/PlanningParts'
import { LifecycleTimeline, PriceBreakdown, ActivityLog, Section, lifecycle } from '../../components/admin/BookingDetailParts'

// ── Kjøreordre (trip planning) ─────────────────────────────────────────────────
const TRIP_STATUS_LABELS = { 0: 'Planlagt', 1: 'Pågår', 2: 'Fullført', 3: 'Avlyst' }
const TRIP_STATUS_COLORS = {
  0: 'bg-gray-100 text-gray-600',
  1: 'bg-blue-100 text-blue-700',
  2: 'bg-green-100 text-green-700',
  3: 'bg-red-100 text-red-600',
}

function TripPlanningPanel({ booking, autoExpandTripId, onTripsChange }) {
  const [loading, setLoading] = useState(true)
  const [trips, setTrips] = useState([])
  const [buses, setBuses] = useState([])
  const [drivers, setDrivers] = useState([])
  const [expandedId, setExpandedId] = useState(autoExpandTripId ?? null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [assignments, busList, driverList] = await Promise.all([
        api.getAssignmentsForBooking(booking.id),
        api.getBuses(),
        api.getDrivers(),
      ])
      setTrips(assignments)
      setBuses(busList)
      setDrivers(driverList)
      if (autoExpandTripId && assignments.some(a => a.id === autoExpandTripId)) {
        setExpandedId(autoExpandTripId)
      }
    } catch {
      setError('Kunne ikke laste kjøreordre.')
    } finally {
      setLoading(false)
    }
  }, [booking.id, autoExpandTripId])

  useEffect(() => { load() }, [load])
  useEffect(() => { if (!loading) onTripsChange?.(trips) }, [trips, loading]) // eslint-disable-line react-hooks/exhaustive-deps

  const createTrip = async () => {
    setCreating(true)
    setError('')
    try {
      const payload = {
        busId: buses[0]?.externalId || '',
        driverId: null,
        bookingId: booking.id,
        startDate: (booking.departureDate || '').slice(0, 10),
        endDate: (booking.returnDate || booking.departureDate || '').slice(0, 10),
        startTime: booking.departureTime || null,
        endTime: booking.returnTime || booking.departureTime || null,
        title: `${booking.reference} — tur ${trips.length + 1}`,
        type: 'trip',
        notes: null,
        bookingReference: booking.reference,
      }
      const created = await api.createAssignment(payload)
      // Pre-fill the itinerary from the booking's own route right away — saves the admin
      // having to click "Generer fra bestilling" + "Lagre tidtabell" on every single trip.
      try {
        await api.replaceAssignmentStops(created.id, stopsToPayload(buildStopsFromBooking(booking)))
      } catch { /* non-fatal — admin can still generate/edit stops manually in the trip editor */ }
      setTrips(t => [...t, created])
      setExpandedId(created.id)
    } catch (e) {
      setError(e?.message || 'Kunne ikke opprette ny tur.')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleted = (id) => {
    setTrips(t => t.filter(x => x.id !== id))
    setExpandedId(current => current === id ? null : current)
  }

  const handleUpdated = (id, patch) => {
    setTrips(t => t.map(x => x.id === id ? { ...x, ...patch } : x))
  }

  if (loading) return <div className="text-sm text-gray-400 py-4">Laster kjøreordre…</div>

  return (
    <div className="space-y-3">
      {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-2.5 text-sm">{error}</div>}

      {trips.length === 0 && (
        <p className="text-sm text-gray-400">Ingen turer opprettet for denne bestillingen ennå.</p>
      )}

      {trips.map(t => (
        <div key={t.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
          <button onClick={() => setExpandedId(id => id === t.id ? null : t.id)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="font-semibold text-brand-dark truncate">{t.title}</span>
              <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${TRIP_STATUS_COLORS[t.status]}`}>
                {TRIP_STATUS_LABELS[t.status]}
              </span>
              {t.driverName && <span className="text-gray-400 flex-shrink-0">· {t.driverName}</span>}
            </div>
            {expandedId === t.id ? <ChevronUp size={15} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={15} className="text-gray-400 flex-shrink-0" />}
          </button>
          {expandedId === t.id && (
            <div className="px-4 pb-4 border-t border-gray-100">
              <TripEditor
                tripId={t.id}
                booking={booking}
                buses={buses}
                drivers={drivers}
                onDeleted={() => handleDeleted(t.id)}
                onUpdated={(patch) => handleUpdated(t.id, patch)}
              />
            </div>
          )}
        </div>
      ))}

      <button onClick={createTrip} disabled={creating || buses.length === 0}
        className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark disabled:opacity-40 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
        <Plus size={15} /> {creating ? 'Oppretter…' : 'Ny tur'}
      </button>
    </div>
  )
}

function TripEditor({ tripId, booking, buses, drivers, onDeleted, onUpdated }) {
  const [confirmModal, askConfirm] = useConfirm()
  const [detail, setDetail] = useState(null)
  const [busId, setBusId] = useState('')
  const [driverId, setDriverId] = useState(null)
  const [stops, setStops] = useState([])
  const [positionHistory, setPositionHistory] = useState([])
  const [saving, setSaving] = useState(false)
  const [savingStops, setSavingStops] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api.getAssignment(tripId).then(full => {
      if (!active) return
      setDetail(full)
      setBusId(full.busId)
      setDriverId(full.driverId)
      setStops(full.stops.map(s => ({
        id: s.id, name: s.name, description: s.description || '',
        latitude: s.latitude ?? null, longitude: s.longitude ?? null,
        plannedTime: toDateTimeLocal(new Date(s.plannedTime)),
        actualArrival: s.actualArrival, actualDeparture: s.actualDeparture, notes: s.notes,
      })))
    })
    api.getPositionHistory(tripId).then(pings => { if (active) setPositionHistory(pings) })
    return () => { active = false }
  }, [tripId])

  // Poll for the driver's live position while the trip is in progress — only touches the
  // position fields so it never clobbers stops/bus/driver the admin might be mid-edit on.
  // Also refetch the position history so the traveled trail keeps growing while the trip runs.
  useEffect(() => {
    if (!detail || detail.status !== 1) return
    const interval = setInterval(async () => {
      try {
        const full = await api.getAssignment(tripId)
        setDetail(d => d ? { ...d, currentLatitude: full.currentLatitude, currentLongitude: full.currentLongitude, positionUpdatedAt: full.positionUpdatedAt } : d)
        const pings = await api.getPositionHistory(tripId)
        setPositionHistory(pings)
      } catch { /* transient poll failure — try again next tick */ }
    }, 20000)
    return () => clearInterval(interval)
  }, [tripId, detail?.status])

  const saveAssignment = async () => {
    setSaving(true)
    setError('')
    try {
      const payload = {
        busId, driverId: driverId || null, bookingId: booking.id,
        startDate: detail.startDate.slice(0, 10), endDate: detail.endDate.slice(0, 10),
        startTime: detail.startTime, endTime: detail.endTime,
        title: detail.title, type: detail.type, notes: detail.notes, bookingReference: detail.bookingReference,
      }
      const result = await api.updateAssignment(tripId, payload)
      setDetail(d => ({ ...d, ...result }))
      onUpdated({ status: result.status, driverName: result.driverName, title: result.title })
    } catch (e) {
      setError(e?.message || 'Lagring feilet — sjekk om buss eller sjåfør allerede er opptatt i dette tidsrommet.')
    } finally {
      setSaving(false)
    }
  }

  const setStop = (i, k, v) => setStops(rows => rows.map((r, idx) => idx === i ? { ...r, [k]: v } : r))
  const setStopAddress = (i, addr) => setStops(rows => rows.map((r, idx) =>
    idx === i ? { ...r, name: addr.address, latitude: addr.lat ?? null, longitude: addr.lon ?? null } : r))
  const addStop = () => setStops(rows => [...rows, { name: '', description: '', latitude: null, longitude: null, plannedTime: rows.at(-1)?.plannedTime || '' }])
  const removeStop = (i) => setStops(rows => rows.filter((_, idx) => idx !== i))
  const moveStop = (i, dir) => setStops(rows => {
    const j = i + dir
    if (j < 0 || j >= rows.length) return rows
    const copy = [...rows]
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
    return copy
  })

  const saveStops = async () => {
    setSavingStops(true)
    setError('')
    try {
      const saved = await api.replaceAssignmentStops(tripId, stopsToPayload(stops))
      setStops(saved.map(s => ({
        id: s.id, name: s.name, description: s.description || '',
        latitude: s.latitude ?? null, longitude: s.longitude ?? null,
        plannedTime: toDateTimeLocal(new Date(s.plannedTime)),
      })))
    } catch (e) {
      setError(e?.message || 'Kunne ikke lagre stopp.')
    } finally {
      setSavingStops(false)
    }
  }

  const handleDelete = async () => {
    if (!await askConfirm({ title: 'Slett tur', message: 'Er du sikker på at du vil slette denne turen? Dette kan ikke angres.' })) return
    setDeleting(true)
    try {
      await api.deleteAssignment(tripId)
      onDeleted()
    } finally {
      setDeleting(false)
    }
  }

  const inp = 'w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30'

  if (!detail) return <p className="text-sm text-gray-400 py-3">Laster…</p>

  return (
    <div className="space-y-4 pt-4">
      {confirmModal}
      {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-2.5 text-sm">{error}</div>}

      <div className="flex items-center gap-2">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TRIP_STATUS_COLORS[detail.status]}`}>
          {TRIP_STATUS_LABELS[detail.status]}
        </span>
        {detail.startedAt && <span className="text-xs text-gray-400">Startet {new Date(detail.startedAt).toLocaleString('nb-NO')}</span>}
        {detail.finishedAt && <span className="text-xs text-gray-400">Fullført {new Date(detail.finishedAt).toLocaleString('nb-NO')}</span>}
      </div>

      {/* Bus + driver assignment */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5"><BusIcon size={12} /> Buss</label>
          <select value={busId} onChange={e => setBusId(e.target.value)} className={inp}>
            {buses.map(b => <option key={b.externalId} value={b.externalId}>{b.name}{b.registrationNumber ? ` (${b.registrationNumber})` : ''}</option>)}
          </select>
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5"><User size={12} /> Sjåfør</label>
          <select value={driverId ?? ''} onChange={e => setDriverId(e.target.value ? Number(e.target.value) : null)} className={inp}>
            <option value="">— Ingen sjåfør valgt —</option>
            {drivers.filter(d => d.active).map(d => <option key={d.id} value={d.id}>{d.fullName}</option>)}
          </select>
        </div>
      </div>
      <button onClick={saveAssignment} disabled={saving}
        className="text-xs font-semibold text-brand-blue hover:text-brand-blue-dark disabled:opacity-40">
        {saving ? 'Lagrer…' : 'Lagre buss/sjåfør'}
      </button>

      {/* Map — planned route + live position while the trip is in progress */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Kart</p>
        <TripMap
          stops={stops}
          currentLatitude={detail.currentLatitude}
          currentLongitude={detail.currentLongitude}
          positionUpdatedAt={detail.positionUpdatedAt}
          traveledPath={positionHistory}
        />
      </div>

      {detail.stops?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Reiseforløp</p>
          <TripTimeline stops={detail.stops} />
        </div>
      )}

      {/* Stops itinerary */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tidtabell</p>
          {stops.length === 0 && (
            <button onClick={() => setStops(buildStopsFromBooking(booking))} className="text-xs font-semibold text-brand-blue hover:underline">
              Generer fra bestilling
            </button>
          )}
        </div>
        <div className="space-y-2">
          {stops.map((s, i) => (
            <div key={s.id ?? i} className="bg-gray-50 rounded-xl p-3 space-y-2">
              <div className="flex gap-2 items-start">
                <div className="flex-1">
                  <AddressInput
                    value={{ address: s.name, lat: s.latitude, lon: s.longitude }}
                    onChange={addr => setStopAddress(i, addr)}
                    placeholder="Stoppested"
                  />
                </div>
                <input type="datetime-local" value={s.plannedTime} onChange={e => setStop(i, 'plannedTime', e.target.value)} className={`${inp} w-56`} />
              </div>
              {!s.latitude && s.name && (
                <p className="text-xs text-amber-600">Ingen posisjon valgt — velg fra forslagslisten for at stoppet skal vises på kartet.</p>
              )}
              <input value={s.description} onChange={e => setStop(i, 'description', e.target.value)} placeholder="Beskrivelse (valgfritt)" className={inp} />
              {(s.actualArrival || s.actualDeparture) && (
                <p className="text-xs text-green-700">
                  {s.actualArrival && `Ank. ${new Date(s.actualArrival).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}`}
                  {s.actualArrival && s.actualDeparture && ' · '}
                  {s.actualDeparture && `Avg. ${new Date(s.actualDeparture).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}`}
                </p>
              )}
              {s.notes?.length > 0 && (
                <div className="space-y-1">
                  {s.notes.map(n => (
                    <p key={n.id} className="flex items-start gap-1.5 text-xs text-gray-600">
                      <MessageSquare size={11} className="mt-0.5 flex-shrink-0" /> {n.message}
                    </p>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-1 justify-end">
                <button onClick={() => moveStop(i, -1)} disabled={i === 0} className="text-gray-400 hover:text-brand-blue disabled:opacity-30"><ArrowUp size={13} /></button>
                <button onClick={() => moveStop(i, 1)} disabled={i === stops.length - 1} className="text-gray-400 hover:text-brand-blue disabled:opacity-30"><ArrowDown size={13} /></button>
                <button onClick={() => removeStop(i)} className="text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-2">
          <button onClick={addStop} className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-brand-blue">
            <Plus size={13} /> Legg til stopp
          </button>
          <button onClick={saveStops} disabled={savingStops || stops.length === 0}
            className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
            {savingStops ? 'Lagrer…' : 'Lagre tidtabell'}
          </button>
        </div>
      </div>

      {detail.tripNotes?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Meldinger fra sjåfør</p>
          <div className="space-y-1.5">
            {detail.tripNotes.map(n => (
              <p key={n.id} className="flex items-start gap-1.5 text-sm text-gray-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                <MessageSquare size={13} className="mt-0.5 flex-shrink-0 text-amber-600" /> {n.message}
              </p>
            ))}
          </div>
        </div>
      )}

      <button onClick={handleDelete} disabled={deleting}
        className="flex items-center gap-1.5 text-red-500 hover:text-red-700 text-xs font-semibold disabled:opacity-40">
        <Trash2 size={13} /> {deleting ? 'Sletter…' : 'Slett denne turen'}
      </button>
    </div>
  )
}

function printQuote(booking, company) {
  const date = (d) => d ? new Date(d).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' }) : '–'
  const kr = (n) => n != null ? Number(n).toLocaleString('nb-NO') + ' kr' : '–'
  const html = `<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="UTF-8"/>
  <title>Tilbud – ${booking.reference}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #1a1a2e; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; border-bottom: 2px solid #1a3a6b; padding-bottom: 20px; }
    .company { font-size: 22px; font-weight: 900; color: #1a3a6b; letter-spacing: -0.5px; }
    .company-sub { font-size: 11px; color: #666; margin-top: 2px; }
    .doc-title { text-align: right; }
    .doc-title h2 { font-size: 18px; font-weight: 700; color: #1a3a6b; }
    .doc-title .ref { font-family: monospace; font-size: 13px; color: #555; margin-top: 4px; }
    .doc-title .issued { font-size: 11px; color: #888; margin-top: 4px; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 10px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
    .field label { font-size: 10px; color: #888; display: block; margin-bottom: 2px; }
    .field span { font-weight: 600; font-size: 13px; }
    .price-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    .price-table td { padding: 8px 12px; border-bottom: 1px solid #eee; }
    .price-table tr:last-child td { border-bottom: none; font-weight: 700; font-size: 15px; background: #f0f4ff; }
    .price-table .label { color: #555; }
    .price-table .amount { text-align: right; }
    .note { background: #f8f9fa; border-left: 3px solid #1a3a6b; padding: 10px 14px; font-size: 12px; color: #444; margin-top: 8px; line-height: 1.5; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 11px; color: #888; display: flex; justify-content: space-between; }
    .toolbar { position: fixed; top: 0; left: 0; right: 0; background: #1a3a6b; color: white; padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; z-index: 999; font-size: 13px; }
    .toolbar span { opacity: 0.8; }
    .btn-pdf { background: white; color: #1a3a6b; border: none; padding: 8px 20px; border-radius: 6px; font-weight: 700; font-size: 13px; cursor: pointer; }
    .btn-pdf:hover { background: #f0f4ff; }
    body { padding-top: 60px; }
    @media print { .toolbar { display: none; } body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="toolbar">
    <span>Tilbud – ${booking.reference} · ${booking.contactName}</span>
    <button class="btn-pdf" onclick="window.print()">⬇ Lagre som PDF</button>
  </div>
  <div class="header">
    <div>
      <div class="company">${company.name}</div>
      <div class="company-sub">${company.address}</div>
      <div class="company-sub">${company.email} · ${company.phone}</div>
    </div>
    <div class="doc-title">
      <h2>Pristilbud</h2>
      <div class="ref">${booking.reference}</div>
      <div class="issued">Utstedt: ${date(new Date())}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Kunde</div>
    <div class="grid">
      <div class="field"><label>Navn</label><span>${booking.contactName || '–'}</span></div>
      <div class="field"><label>E-post</label><span>${booking.contactEmail || '–'}</span></div>
      <div class="field"><label>Telefon</label><span>${booking.contactPhone || '–'}</span></div>
      ${booking.orgName ? `<div class="field"><label>Firma</label><span>${booking.orgName}${booking.orgNumber ? ' (' + booking.orgNumber + ')' : ''}</span></div>` : ''}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Reisedetaljer</div>
    <div class="grid">
      <div class="field"><label>Fra</label><span>${booking.fromAddress || '–'}</span></div>
      <div class="field"><label>Til</label><span>${booking.toAddress || '–'}</span></div>
      <div class="field"><label>Avreise</label><span>${date(booking.departureDate)} kl. ${booking.departureTime || '–'}</span></div>
      ${booking.tripType === 'return' && booking.returnDate ? `<div class="field"><label>Retur</label><span>${date(booking.returnDate)}${booking.returnTime ? ' kl. ' + booking.returnTime : ''}</span></div>` : ''}
      <div class="field"><label>Rute</label><span>${booking.tripType === 'return' ? 'Tur/retur' : 'Enveis'} · ${booking.distanceKm || 0} km</span></div>
      <div class="field"><label>Passasjerer</label><span>${booking.passengers || '–'}${booking.busCount > 1 ? ' · ' + booking.busCount + ' busser' : ''}</span></div>
      <div class="field"><label>Busstype</label><span>${booking.busName || '–'}</span></div>
    </div>
    ${booking.stops?.length > 0 ? `<div style="margin-top:10px"><div class="section-title">Stopp underveis</div><div class="note">${booking.stops.map((s,i) => (i+1)+'. '+s).join('<br/>')}</div></div>` : ''}
    ${(booking.needsTrailer || booking.needsWheelchair || booking.selectedExtras?.length > 0) ? `<div style="margin-top:10px"><div class="section-title">Tillegg</div><div class="note">${[booking.needsTrailer ? 'Tilhenger' : '', booking.needsWheelchair ? 'Rullestoltilpasset' : '', ...(booking.selectedExtras || [])].filter(Boolean).join(', ')}</div></div>` : ''}
  </div>

  <div class="section">
    <div class="section-title">Prissammendrag (estimat)</div>
    <table class="price-table">
      <tr><td class="label">Pris eks. MVA (12 %)</td><td class="amount">${kr(booking.estimatedBase)}</td></tr>
      <tr><td class="label">MVA 12 %</td><td class="amount">${kr(booking.estimatedVat)}</td></tr>
      ${booking.priceAdjustment ? `<tr><td class="label">${booking.priceAdjustmentNote || 'Prisjustering'}</td><td class="amount">${booking.priceAdjustment > 0 ? '+' : ''}${kr(booking.priceAdjustment)}</td></tr>` : ''}
      <tr><td class="label"><strong>Total inkl. MVA</strong></td><td class="amount"><strong>${kr(booking.estimatedTotal)}</strong></td></tr>
    </table>
    <div class="note" style="margin-top:12px">Dette er et prisestimat. Endelig pris fastsettes i ordrebekreftelsen. Prisen inkluderer sjåfør, drivstoff og bompenger. Avbestillingsbetingelser følger av våre vilkår på ${company.domainHost}/vilkar.</div>
  </div>

  ${booking.message ? `<div class="section"><div class="section-title">Kundens merknad</div><div class="note">${booking.message}</div></div>` : ''}

  <div class="footer">
    <span>${company.name} · ${company.email} · ${company.phone} · ${company.domainHost}</span>
    <span>${booking.reference}</span>
  </div>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
}

const STATUS_LABELS = { 0: 'Ny', 1: 'Bekreftet', 2: 'Avlyst', 3: 'Tilbud sendt' }
const STATUS_COLORS = {
  0: 'bg-yellow-100 text-yellow-700',
  1: 'bg-green-100 text-green-700',
  2: 'bg-red-100 text-red-600',
  3: 'bg-blue-100 text-blue-700',
}

function BookingCard({ booking, onStatusChange, showMoveToNew = false, bankAccountNumber = '', company = {}, selectable = false, selected = false, onToggleSelect, defaultOpen = false, autoExpandTripId }) {
  const [open, setOpen] = useState(defaultOpen)
  const [updating, setUpdating] = useState(false)
  const [notes, setNotes] = useState(booking.adminNotes || '')
  const [savingNotes, setSavingNotes] = useState(false)
  const [notesSaved, setNotesSaved] = useState(false)
  const [priceAdjustment, setPriceAdjustment] = useState(booking.priceAdjustment || 0)
  const [priceAdjustmentNote, setPriceAdjustmentNote] = useState(booking.priceAdjustmentNote || '')
  const [total, setTotal] = useState(booking.estimatedTotal)
  const [savingPrice, setSavingPrice] = useState(false)
  const [priceSaved, setPriceSaved] = useState(false)
  const [extraCharges, setExtraCharges] = useState(booking.extraCharges || [])
  const [newChargeDesc, setNewChargeDesc] = useState('')
  const [newChargeAmount, setNewChargeAmount] = useState('')
  const [savingCharge, setSavingCharge] = useState(false)
  const [chargeError, setChargeError] = useState(null)
  const [invoiceNumber, setInvoiceNumber] = useState(booking.invoiceNumber || null)
  const [invoiceDate, setInvoiceDate] = useState(booking.invoiceDate || null)
  const [invoiceSentAt, setInvoiceSentAt] = useState(booking.invoiceSentAt || null)
  const [generatingInvoice, setGeneratingInvoice] = useState(false)
  const [sendingInvoice, setSendingInvoice] = useState(false)
  const [sendError, setSendError] = useState(null)
  const [paymentStatus, setPaymentStatus] = useState(booking.paymentStatus ?? 0)
  const [updatingPayment, setUpdatingPayment] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [trips, setTrips] = useState([])

  const handleGenerateInvoice = async () => {
    setGeneratingInvoice(true)
    try {
      const res = await api.generateInvoice(booking.id)
      setInvoiceNumber(res.invoiceNumber)
      setInvoiceDate(res.invoiceDate)
    } catch {}
    setGeneratingInvoice(false)
  }

  // The explicit step that actually pushes to Fiken and emails the customer — kept separate
  // from generation so the admin can review/adjust price and extra charges first.
  const handleSendInvoice = async () => {
    setSendingInvoice(true)
    setSendError(null)
    try {
      const res = await api.sendInvoice(booking.id)
      setInvoiceSentAt(res.sentAt)
    } catch (e) {
      setSendError(e?.message || 'Kunne ikke sende faktura.')
    }
    setSendingInvoice(false)
  }

  const togglePaymentStatus = async () => {
    setUpdatingPayment(true)
    try {
      const next = paymentStatus === 1 ? 0 : 1
      await api.updatePaymentStatus(booking.id, next)
      setPaymentStatus(next)
    } catch {}
    setUpdatingPayment(false)
  }

  const changeStatus = async (status) => {
    setUpdating(true)
    try {
      const updated = await api.updateBookingStatus(booking.id, status)
      onStatusChange(booking.id, status, updated.invoiceNumber, updated.invoiceDate)
    } catch {}
    setUpdating(false)
  }

  const confirmCancel = async () => {
    setUpdating(true)
    try {
      if (cancelReason.trim()) {
        const prefix = `[Avlysningsgrunn ${new Date().toLocaleDateString('nb-NO')}]: ${cancelReason.trim()}`
        const newNotes = notes.trim() ? `${prefix}\n\n${notes}` : prefix
        await api.updateBookingNotes(booking.id, newNotes)
        setNotes(newNotes)
      }
      await api.updateBookingStatus(booking.id, 2)
      onStatusChange(booking.id, 2)
      setCancelling(false)
      setCancelReason('')
    } catch {}
    setUpdating(false)
  }

  const savePriceAdjustment = async () => {
    setSavingPrice(true)
    try {
      const adj = parseFloat(priceAdjustment) || 0
      const res = await api.updateBookingPrice(booking.id, adj, priceAdjustmentNote || null)
      setTotal(res.estimatedTotal)
      setPriceSaved(true)
      setTimeout(() => setPriceSaved(false), 2000)
    } catch {}
    setSavingPrice(false)
  }

  // Itemized extras (extra hours, cleaning fees, etc.) discovered during/after planning —
  // each one adds to the total on its own instead of overwriting the single price adjustment.
  const addExtraCharge = async () => {
    const amount = parseFloat(newChargeAmount)
    if (!newChargeDesc.trim() || !amount) { setChargeError('Beskrivelse og beløp er påkrevd.'); return }
    setSavingCharge(true)
    setChargeError(null)
    try {
      const res = await api.addExtraCharge(booking.id, newChargeDesc.trim(), amount)
      setExtraCharges(res.extraCharges)
      setTotal(res.estimatedTotal)
      setNewChargeDesc('')
      setNewChargeAmount('')
    } catch (e) {
      setChargeError(e?.message || 'Lagring feilet.')
    }
    setSavingCharge(false)
  }

  const removeExtraCharge = async (index) => {
    try {
      const res = await api.removeExtraCharge(booking.id, index)
      setExtraCharges(res.extraCharges)
      setTotal(res.estimatedTotal)
    } catch (e) {
      setChargeError(e?.message || 'Kunne ikke fjerne linjen.')
    }
  }

  const saveNotes = async () => {
    setSavingNotes(true)
    try {
      await api.updateBookingNotes(booking.id, notes)
      setNotesSaved(true)
      setTimeout(() => setNotesSaved(false), 2000)
    } catch {}
    setSavingNotes(false)
  }

  const life = lifecycle(booking, trips, { invoiceSentAt, paymentStatus })
  const activityKey = [booking.status, invoiceNumber, invoiceSentAt, paymentStatus, total, extraCharges.length, trips.length, notesSaved, priceSaved].join('|')
  const unassigned = life.active.some(t => t.status === 0 && !t.driverId)

  const goToTrips = () => document.getElementById(`trips-${booking.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })

  // The single most relevant next step for this booking's current lifecycle state.
  const nextAction = (() => {
    if (booking.status === 2) return null
    if (booking.status !== 1) return { label: 'Bekreft bestilling', icon: CheckCircle, onClick: () => changeStatus(1), busy: updating }
    if (!life.fullyPlanned) return { label: life.planned === 0 ? 'Opprett kjøreordre' : `Planlegg ${booking.busCount - life.planned} buss til`, icon: BusIcon, onClick: goToTrips }
    if (unassigned) return { label: 'Tildel sjåfør', icon: User, onClick: goToTrips }
    if (!life.allDone && !invoiceNumber) return { hint: 'Venter på at turen gjennomføres' }
    if (!invoiceNumber) return { label: 'Generer faktura', icon: Printer, onClick: handleGenerateInvoice, busy: generatingInvoice }
    if (!invoiceSentAt) return { label: 'Send faktura', icon: SendHorizontal, onClick: handleSendInvoice, busy: sendingInvoice }
    if (paymentStatus !== 1) return { label: 'Merk som betalt', icon: CheckCircle, onClick: togglePaymentStatus, busy: updatingPayment }
    return { hint: 'Ferdig – ingen handling nødvendig' }
  })()

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden transition-colors ${selected ? 'border-brand-blue ring-1 ring-brand-blue/20' : 'border-gray-200'}`}>
      <div className="flex items-center gap-3 px-5 py-4">
        {selectable && (
          <button onClick={e => { e.stopPropagation(); onToggleSelect?.(booking.id) }}
            className="flex-shrink-0 text-gray-300 hover:text-brand-blue transition-colors">
            {selected ? <CheckSquare size={18} className="text-brand-blue" /> : <Square size={18} />}
          </button>
        )}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setOpen(o => !o)}>
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="font-bold text-brand-dark text-sm">{booking.contactName}</span>
            <span className="font-mono text-xs text-gray-400">#{booking.reference}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[booking.status]}`}>
              {STATUS_LABELS[booking.status]}
            </span>
          </div>
          <p className="text-xs text-gray-400 truncate">{booking.fromAddress} → {booking.toAddress}</p>
        </div>
        <div className="text-right flex-shrink-0 cursor-pointer" onClick={() => setOpen(o => !o)}>
          <p className="text-sm font-bold text-brand-dark">{total?.toLocaleString('nb-NO')} kr</p>
          <p className="text-xs text-gray-400">{new Date(booking.createdAt).toLocaleDateString('nb-NO')}</p>
        </div>
        <span className="text-gray-400 flex-shrink-0 cursor-pointer" onClick={() => setOpen(o => !o)}>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </div>

      {open && (
        <div className="border-t border-gray-100 px-5 py-5 space-y-6">
          <div className="space-y-4">
            <LifecycleTimeline booking={booking} steps={life.steps} />
            {nextAction && (
              nextAction.hint ? (
                <p className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">{nextAction.hint}</p>
              ) : (
                <div className="flex items-center justify-between gap-3 bg-brand-blue/5 border border-brand-blue/20 rounded-lg px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Neste steg</p>
                    <p className="text-sm font-semibold text-brand-dark">{nextAction.label}</p>
                  </div>
                  <button onClick={nextAction.onClick} disabled={nextAction.busy || updating}
                    className="shrink-0 flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark disabled:opacity-40 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors">
                    <nextAction.icon size={15} /> {nextAction.busy ? 'Jobber…' : nextAction.label}
                  </button>
                </div>
              )
            )}
          </div>

          <Section title="Kunde">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-4 text-sm">
              <a href={`tel:${booking.contactPhone}`} className="flex items-center gap-1.5 text-brand-blue hover:underline">
                <Phone size={13} /> {booking.contactPhone}
              </a>
              <a href={`mailto:${booking.contactEmail}`} className="flex items-center gap-1.5 text-brand-blue hover:underline">
                <Mail size={13} /> {booking.contactEmail}
              </a>
              {booking.orgName && (
                <span className="flex items-center gap-1.5 text-gray-600">
                  <Building size={13} /> {booking.orgName} {booking.orgNumber && `(${booking.orgNumber})`}
                </span>
              )}
            </div>
            {booking.message && <p className="text-sm text-gray-600 mt-2 italic">"{booking.message}"</p>}
          </div>

          </Section>

          <Section title="Rute og avreise">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><p className="text-xs text-gray-400 mb-1">Referanse</p><p className="font-mono font-semibold text-brand-dark">{booking.reference}</p></div>
            <div><p className="text-xs text-gray-400 mb-1">Avreise</p><p className="font-semibold">{new Date(booking.departureDate).toLocaleDateString('nb-NO')} kl. {booking.departureTime}</p></div>
            <div><p className="text-xs text-gray-400 mb-1">Buss</p><p className="font-semibold">{booking.busName}</p></div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Passasjerer</p>
              <p className="font-semibold">{booking.passengers} stk{booking.busCount > 1 ? ` · ${booking.busCount} busser` : ''}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Rute</p>
              <p className="font-semibold">{booking.tripType === 'return' ? 'Tur/retur' : 'Enveis'} · {booking.distanceKm} km</p>
            </div>
            {booking.tripType === 'return' && booking.returnDate && (
              <div><p className="text-xs text-gray-400 mb-1">Returdato</p><p className="font-semibold">{new Date(booking.returnDate).toLocaleDateString('nb-NO')} kl. {booking.returnTime || '–'}</p></div>
            )}
          </div>

          </Section>

          {/* Stops */}
          {booking.stops?.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">Stopp underveis ({booking.stops.length})</p>
              <ol className="space-y-1">
                {booking.stops.map((s, i) => (
                  <li key={i} className="text-amber-900 flex gap-2"><span className="text-amber-400 font-bold">{i + 1}.</span>{s}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Extras & special needs */}
          {(booking.needsTrailer || booking.needsWheelchair || booking.selectedExtras?.length > 0) && (
            <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 text-sm">
              <p className="text-xs font-semibold text-orange-700 uppercase tracking-wider mb-2">Spesielle behov / tillegg</p>
              <ul className="space-y-1">
                {booking.needsTrailer    && <li className="text-orange-900 flex gap-2"><span>🚛</span> Trenger tilhenger</li>}
                {booking.needsWheelchair && <li className="text-orange-900 flex gap-2"><span>♿</span> Trenger rullestolvogn</li>}
                {booking.selectedExtras?.map(e => (
                  <li key={e} className="text-orange-900 flex gap-2"><span>➕</span> {e}</li>
                ))}
              </ul>
            </div>
          )}

          <Section title="Pris">
          <PriceBreakdown booking={booking} total={total} extraCharges={extraCharges} />
          {/* Price adjustment */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Prisjustering</p>
              {invoiceSentAt && <span className="text-xs font-medium text-amber-600">🔒 Fakturert — beløpet er låst</span>}
            </div>
            <p className="text-xs text-gray-400">
              Beregnet pris ({(booking.estimatedBase + booking.estimatedVat)?.toLocaleString('nb-NO')} kr) + justering under = ny total.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Beløp — kr (kan være negativt)</label>
                <input type="number" placeholder="0" value={priceAdjustment} disabled={!!invoiceSentAt}
                  onChange={e => setPriceAdjustment(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:opacity-50" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Årsak</label>
                <input placeholder="f.eks. rabatt, ekstra stopp…" value={priceAdjustmentNote} disabled={!!invoiceSentAt}
                  onChange={e => setPriceAdjustmentNote(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:opacity-50" />
              </div>
            </div>
            <button
              onClick={savePriceAdjustment}
              disabled={savingPrice || !!invoiceSentAt}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white transition-colors">
              {priceSaved ? '✓ Lagret' : savingPrice ? 'Lagrer...' : 'Lagre prisjustering'}
            </button>
          </div>

          {/* Extra charges — itemized, accumulating (e.g. cleaning fee, extra hours found
              during planning) as opposed to the single overwritable price adjustment above */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ekstra kostnader</p>
              {invoiceSentAt && <span className="text-xs font-medium text-amber-600">🔒 Fakturert — låst</span>}
            </div>
            {extraCharges.length > 0 && (
              <ul className="space-y-1.5">
                {extraCharges.map((c, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    <span className="text-gray-700 truncate">{c.description}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-semibold text-brand-dark">{c.amount > 0 ? '+' : ''}{c.amount.toLocaleString('nb-NO')} kr</span>
                      {!invoiceSentAt && (
                        <button onClick={() => removeExtraCharge(i)} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {!invoiceSentAt && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
                  <input placeholder="f.eks. rengjøring etter oppkast" value={newChargeDesc}
                    onChange={e => setNewChargeDesc(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                  <input type="number" placeholder="Beløp kr" value={newChargeAmount}
                    onChange={e => setNewChargeAmount(e.target.value)}
                    className="w-full sm:w-32 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                </div>
                {chargeError && <p className="text-xs text-red-600">{chargeError}</p>}
                <button
                  onClick={addExtraCharge}
                  disabled={savingCharge}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white transition-colors">
                  {savingCharge ? 'Legger til...' : '+ Legg til kostnad'}
                </button>
              </>
            )}
          </div>

          </Section>

          {/* Kjøreordre */}
          <div id={`trips-${booking.id}`}>
            <Section title="Planlegging og kjøreordre">
              <TripPlanningPanel booking={booking} autoExpandTripId={autoExpandTripId} onTripsChange={setTrips} />
            </Section>
          </div>

          {/* Internal notes */}
          <Section title="Interne notater">
            <div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Kun synlig for admin — legg til info om tilbud, avtaler, oppfølging..."
              className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
            <button
              onClick={saveNotes}
              disabled={savingNotes}
              className="mt-2 px-4 py-2 text-xs font-semibold rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white transition-colors">
              {notesSaved ? '✓ Lagret' : savingNotes ? 'Lagrer...' : 'Lagre notater'}
            </button>
            </div>
          </Section>

          <Section title="Aktivitet">
            <ActivityLog booking={booking} refreshKey={activityKey} />
          </Section>

          <div className="flex gap-3 flex-wrap items-center">
            <button onClick={() => printQuote(booking, company)}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 active:scale-[0.97] text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-[background-color,transform] motion-reduce:transition-none">
              <Printer size={15} /> Pristilbud
            </button>
            {!invoiceNumber && (
              <button onClick={handleGenerateInvoice} disabled={generatingInvoice}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.97] disabled:opacity-40 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-[background-color,transform] motion-reduce:transition-none">
                <Printer size={15} /> {generatingInvoice ? 'Genererer...' : 'Generer faktura'}
              </button>
            )}
            {invoiceNumber && (
              <button onClick={() => printInvoice(booking, invoiceNumber, invoiceDate, bankAccountNumber, company)}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 active:scale-[0.97] text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-[background-color,transform] motion-reduce:transition-none">
                <Printer size={15} /> Faktura {invoiceNumber}
              </button>
            )}
            {invoiceNumber && !invoiceSentAt && (
              <button onClick={handleSendInvoice} disabled={sendingInvoice}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.97] disabled:opacity-40 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-[background-color,transform] motion-reduce:transition-none">
                <SendHorizontal size={15} /> {sendingInvoice ? 'Sender...' : 'Send faktura'}
              </button>
            )}
            {invoiceSentAt && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-full">
                <CheckCircle size={13} /> Sendt {new Date(invoiceSentAt).toLocaleDateString('nb-NO')}
              </span>
            )}
            {sendError && <p className="text-xs text-red-600 w-full">{sendError}</p>}
            {invoiceNumber && (
              <button onClick={togglePaymentStatus} disabled={updatingPayment}
                className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl active:scale-[0.97] transition-[background-color,transform] motion-reduce:transition-none disabled:opacity-40 ${
                  paymentStatus === 1 ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                }`}>
                {paymentStatus === 1 ? <CheckCircle size={15} /> : <Clock size={15} />}
                {paymentStatus === 1 ? 'Betalt' : 'Merk betalt'}
              </button>
            )}
            {booking.status !== 3 && booking.status !== 1 && (
              <button onClick={() => changeStatus(3)} disabled={updating}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.97] disabled:opacity-40 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-[background-color,transform] motion-reduce:transition-none">
                <SendHorizontal size={15} /> Tilbud sendt
              </button>
            )}
            {booking.status !== 1 && (
              <button onClick={() => changeStatus(1)} disabled={updating}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 active:scale-[0.97] disabled:opacity-40 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-[background-color,transform] motion-reduce:transition-none">
                <CheckCircle size={15} /> Bekreft
              </button>
            )}
            {booking.status !== 2 && (
              <button onClick={() => { setCancelling(true); setOpen(true) }} disabled={updating}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 active:scale-[0.97] disabled:opacity-40 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-[background-color,transform] motion-reduce:transition-none">
                <XCircle size={15} /> Avlys
              </button>
            )}
            {showMoveToNew && (
              <button onClick={() => changeStatus(0)} disabled={updating}
                className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-40 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
                <Clock size={15} /> Flytt til Innboks
              </button>
            )}
          </div>

          {cancelling && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3">
              <p className="text-sm font-bold text-red-700">Bekreft avlysning</p>
              <div>
                <label className="block text-xs font-semibold text-red-700 mb-1">Avlysningsgrunn (valgfritt)</label>
                <textarea
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  rows={2}
                  placeholder="f.eks. Kunden kansellerte, feil dato bestilt…"
                  className="w-full text-sm border border-red-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-red-300 bg-white"
                />
                <p className="text-xs text-red-500 mt-1">Grunnen lagres automatisk i notater.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={confirmCancel} disabled={updating}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
                  <XCircle size={14} /> Bekreft avlysning
                </button>
                <button onClick={() => { setCancelling(false); setCancelReason('') }}
                  className="px-4 py-2.5 rounded-xl border border-red-200 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors">
                  Avbryt
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function exportCsv(bookings) {
  const cols = ['reference', 'contactName', 'contactEmail', 'contactPhone', 'fromAddress', 'toAddress', 'departureDate', 'departureTime', 'passengers', 'estimatedTotal', 'status']
  const headers = ['Referanse', 'Navn', 'E-post', 'Telefon', 'Fra', 'Til', 'Dato', 'Tid', 'Passasjerer', 'Total (kr)', 'Status']
  const statusLabel = { 0: 'Ny', 1: 'Bekreftet', 2: 'Avlyst', 3: 'Tilbud sendt' }
  const rows = bookings.map(b => cols.map(c => {
    if (c === 'status') return statusLabel[b[c]] ?? b[c]
    const v = b[c] ?? ''
    return typeof v === 'string' && v.includes(',') ? `"${v}"` : v
  }).join(','))
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = `bestillinger-${new Date().toISOString().slice(0,10)}.csv`
  a.click(); URL.revokeObjectURL(url)
}

function BulkActionBar({ selected, bookings, onBulkStatus, onClear }) {
  const [working, setWorking] = useState(false)
  const selectedBookings = bookings.filter(b => selected.has(b.id))

  const bulkStatus = async (status) => {
    setWorking(true)
    try { await onBulkStatus([...selected], status) } finally { setWorking(false) }
  }

  return (
    <div className="flex items-center gap-3 bg-brand-dark text-white px-4 py-3 rounded-2xl text-sm flex-wrap">
      <span className="font-semibold">{selected.size} valgt</span>
      <div className="flex gap-2 flex-wrap flex-1">
        <button onClick={() => bulkStatus(1)} disabled={working}
          className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">
          <CheckCircle size={13} /> Bekreft alle
        </button>
        <button onClick={() => bulkStatus(3)} disabled={working}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">
          <SendHorizontal size={13} /> Tilbud sendt
        </button>
        <button onClick={() => bulkStatus(2)} disabled={working}
          className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">
          <XCircle size={13} /> Avlys alle
        </button>
        <button onClick={() => exportCsv(selectedBookings)}
          className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">
          <Download size={13} /> Eksporter CSV
        </button>
        {working && <Loader2 size={16} className="animate-spin opacity-70 self-center" />}
      </div>
      <button onClick={onClear} className="text-white/60 hover:text-white transition-colors ml-auto">
        <X size={16} />
      </button>
    </div>
  )
}

// ── Innboks tab ───────────────────────────────────────────────────────────────
function InboxTab({ bookings, onStatusChange, onBulkStatus, bankAccountNumber, company }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(new Set())
  const newBookings = bookings.filter(b => b.status === 0)

  const filtered = useMemo(() => {
    if (!search.trim()) return newBookings
    const q = search.trim().toLowerCase()
    return newBookings.filter(b =>
      b.reference?.toLowerCase().includes(q) ||
      b.contactName?.toLowerCase().includes(q) ||
      b.contactEmail?.toLowerCase().includes(q) ||
      b.contactPhone?.replace(/\s/g, '').includes(q.replace(/\s/g, '')) ||
      b.fromAddress?.toLowerCase().includes(q) ||
      b.toAddress?.toLowerCase().includes(q)
    )
  }, [newBookings, search])

  const toggleSelect = id => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => setSelected(s => s.size === filtered.length ? new Set() : new Set(filtered.map(b => b.id)))

  if (newBookings.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 text-gray-400">
        <Inbox size={36} className="mx-auto mb-3 opacity-30" />
        <p className="font-medium">Ingen nye bestillinger</p>
        <p className="text-sm mt-1">Nye forespørsler vil dukke opp her</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Søk på referanse, navn, adresse…"
            className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 bg-white" />
        </div>
        <button onClick={toggleAll}
          className="flex items-center gap-1.5 px-3 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-50 bg-white transition-colors">
          {selected.size === filtered.length && filtered.length > 0 ? <CheckSquare size={14} className="text-brand-blue" /> : <Square size={14} />}
          Velg alle
        </button>
      </div>
      {selected.size > 0 && (
        <BulkActionBar selected={selected} bookings={bookings}
          onBulkStatus={async (ids, status) => { await onBulkStatus(ids, status); setSelected(new Set()) }}
          onClear={() => setSelected(new Set())} />
      )}
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">Ingen treff på «{search}»</div>
      ) : (
        filtered.map(b => (
          <BookingCard key={b.id} booking={b} onStatusChange={onStatusChange} bankAccountNumber={bankAccountNumber} company={company}
            selectable selected={selected.has(b.id)} onToggleSelect={toggleSelect} />
        ))
      )}
    </div>
  )
}

// ── Arkiv tab ─────────────────────────────────────────────────────────────────
function ArchiveTab({ bookings, onStatusChange, onBulkStatus, bankAccountNumber, company }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // all | confirmed | cancelled
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selected, setSelected] = useState(new Set())

  const archived = bookings.filter(b => b.status === 1 || b.status === 2 || b.status === 3)

  const filtered = useMemo(() => {
    return archived.filter(b => {
      if (statusFilter === 'confirmed' && b.status !== 1) return false
      if (statusFilter === 'cancelled' && b.status !== 2) return false
      if (statusFilter === 'quoted' && b.status !== 3) return false

      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const match =
          b.reference?.toLowerCase().includes(q) ||
          b.contactName?.toLowerCase().includes(q) ||
          b.contactEmail?.toLowerCase().includes(q) ||
          b.contactPhone?.replace(/\s/g, '').includes(q.replace(/\s/g, '')) ||
          b.fromAddress?.toLowerCase().includes(q) ||
          b.toAddress?.toLowerCase().includes(q)
        if (!match) return false
      }

      if (dateFrom) {
        const from = new Date(dateFrom)
        if (new Date(b.createdAt) < from) return false
      }
      if (dateTo) {
        const to = new Date(dateTo)
        to.setHours(23, 59, 59)
        if (new Date(b.createdAt) > to) return false
      }

      return true
    })
  }, [archived, search, statusFilter, dateFrom, dateTo])

  const counts = {
    all: archived.length,
    quoted: archived.filter(b => b.status === 3).length,
    confirmed: archived.filter(b => b.status === 1).length,
    cancelled: archived.filter(b => b.status === 2).length,
  }

  const toggleSelect = id => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => setSelected(s => s.size === filtered.length ? new Set() : new Set(filtered.map(b => b.id)))

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
        {/* Status pills */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'all', label: 'Alle arkiverte' },
            { key: 'quoted', label: 'Tilbud sendt' },
            { key: 'confirmed', label: 'Bekreftet' },
            { key: 'cancelled', label: 'Avlyst' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setStatusFilter(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1
                ${statusFilter === key ? 'bg-brand-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {label}
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${statusFilter === key ? 'bg-white/20' : 'bg-white text-gray-500'}`}>
                {counts[key]}
              </span>
            </button>
          ))}
        </div>

        {/* Search + date */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Søk på referanse, navn, adresse…"
              className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            />
          </div>
          <div className="flex items-center gap-2">
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
            <span className="text-gray-400 text-sm">–</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
            <button onClick={toggleAll}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors whitespace-nowrap">
              {selected.size === filtered.length && filtered.length > 0 ? <CheckSquare size={13} className="text-brand-blue" /> : <Square size={13} />}
              Velg alle
            </button>
          </div>
        </div>
      </div>

      {selected.size > 0 && (
        <BulkActionBar selected={selected} bookings={bookings}
          onBulkStatus={async (ids, status) => { await onBulkStatus(ids, status); setSelected(new Set()) }}
          onClear={() => setSelected(new Set())} />
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 text-gray-400">
          <Archive size={36} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">{archived.length === 0 ? 'Ingen arkiverte bestillinger' : 'Ingen treff på søket'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(b => (
            <BookingCard key={b.id} booking={b} onStatusChange={onStatusChange} showMoveToNew bankAccountNumber={bankAccountNumber} company={company}
              selectable selected={selected.has(b.id)} onToggleSelect={toggleSelect} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminBookingsPage() {
  const { config } = useConfig()
  const bankAccountNumber = config?.bankAccountNumber || config?.content?.bankAccountNumber || 'Ikke konfigurert'
  const company = {
    name: config?.content?.companyName || '',
    address: config?.content?.address || '',
    orgNr: config?.content?.orgNr || '',
    email: config?.content?.email || '',
    phone: config?.content?.phone || '',
    domainHost: (config?.content?.siteDomain || '').replace(/^https?:\/\//, ''),
  }
  const [searchParams, setSearchParams] = useSearchParams()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [totalBookings, setTotalBookings] = useState(0)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('inbox') // inbox | archive
  const [refSearch, setRefSearch] = useState('')
  const [refResult, setRefResult] = useState(null) // { booking } | { notFound } | null
  const [refSearching, setRefSearching] = useState(false)
  const [tripSearch, setTripSearch] = useState('')
  const [tripSearching, setTripSearching] = useState(false)
  const [tripResults, setTripResults] = useState(null) // array | null
  const [jumpTarget, setJumpTarget] = useState(null) // { booking, autoExpandTripId } | { notFound: true } | null
  const [jumping, setJumping] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const first = await api.getBookings(1)
      setBookings(first.bookings)
      setTotalBookings(first.total)
      setLoading(false)
      // Load remaining pages lazily so UI is responsive immediately
      const pages = Math.ceil(first.total / 20)
      if (pages > 1) {
        setLoadingMore(true)
        for (let p = 2; p <= pages; p++) {
          const next = await api.getBookings(p)
          setBookings(prev => [...prev, ...next.bookings])
        }
        setLoadingMore(false)
      }
    } catch {
      setError('Kunne ikke laste bestillinger. Er API-serveren kjørende?')
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleStatusChange = (id, status, invoiceNumber, invoiceDate) => {
    const patch = invoiceNumber ? { status, invoiceNumber, invoiceDate } : { status }
    setBookings(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b))
    if (refResult?.booking?.id === id) setRefResult(r => ({ booking: { ...r.booking, ...patch } }))
  }

  const handleBulkStatus = async (ids, status) => {
    const updated = await Promise.all(ids.map(id => api.updateBookingStatus(id, status)))
    const invoiceById = new Map(updated.map(u => [u.id, u]))
    setBookings(prev => prev.map(b => {
      if (!ids.includes(b.id)) return b
      const u = invoiceById.get(b.id)
      return u?.invoiceNumber ? { ...b, status, invoiceNumber: u.invoiceNumber, invoiceDate: u.invoiceDate } : { ...b, status }
    }))
  }

  const performRefLookup = async (ref) => {
    setRefSearching(true)
    setRefResult(null)
    try {
      const booking = await api.lookupBooking(ref)
      setRefResult({ booking })
    } catch {
      setRefResult({ notFound: true })
    }
    setRefSearching(false)
  }

  const lookupRef = (e) => {
    e.preventDefault()
    if (!refSearch.trim()) return
    performRefLookup(refSearch.trim())
  }

  // Auto-search when arriving from "Ny bestilling" with ?ref=NTR-... in the URL
  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) {
      setRefSearch(ref)
      performRefLookup(ref)
      setSearchParams({}, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const searchTrips = async (e) => {
    e.preventDefault()
    if (!tripSearch.trim()) return
    setTripSearching(true)
    setTripResults(null)
    setJumpTarget(null)
    try {
      const results = await api.searchAssignments(tripSearch.trim())
      setTripResults(results)
    } catch {
      setTripResults([])
    }
    setTripSearching(false)
  }

  const jumpToTrip = async (trip) => {
    setJumping(true)
    try {
      let booking = trip.bookingId ? bookings.find(b => b.id === trip.bookingId) : null
      if (!booking && trip.bookingReference) {
        booking = await api.lookupBooking(trip.bookingReference)
      }
      setJumpTarget(booking ? { booking, autoExpandTripId: trip.id } : { notFound: true })
    } catch {
      setJumpTarget({ notFound: true })
    }
    setJumping(false)
    setTripResults(null)
    setTripSearch('')
  }

  const newCount = bookings.filter(b => b.status === 0).length
  const archiveCount = bookings.filter(b => b.status === 1 || b.status === 2).length

  return (
    <div className="max-w-4xl">
      <div className="flex justify-end mb-3">
        <Link to="/admin/bookings/new"
          className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-dark hover:bg-black text-white text-sm font-semibold rounded-xl transition-colors">
          <Plus size={15} /> Ny bestilling
        </Link>
      </div>

      {/* Reference search */}
      <form onSubmit={lookupRef} className="flex gap-2 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={refSearch}
            onChange={e => { setRefSearch(e.target.value); setRefResult(null) }}
            placeholder="Slå opp referansenr. (f.eks. NT-1234)"
            className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 bg-white"
          />
        </div>
        <button type="submit" disabled={refSearching || !refSearch.trim()}
          className="px-4 py-2.5 bg-brand-blue hover:bg-brand-blue-dark disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors">
          {refSearching ? 'Søker…' : 'Søk'}
        </button>
        {refResult && (
          <button type="button" onClick={() => { setRefResult(null); setRefSearch('') }}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-gray-400 hover:bg-gray-50 text-sm transition-colors">
            <X size={14} />
          </button>
        )}
      </form>

      {/* Trip search — finds a specific tur across every booking's kjøreordre */}
      <form onSubmit={searchTrips} className="flex gap-2 mb-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={tripSearch}
            onChange={e => { setTripSearch(e.target.value); setTripResults(null) }}
            placeholder="Søk tur (sjåfør, tittel, referanse)"
            className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 bg-white"
          />
        </div>
        <button type="submit" disabled={tripSearching || !tripSearch.trim()}
          className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors">
          {tripSearching ? 'Søker…' : 'Søk tur'}
        </button>
        {(tripResults || jumpTarget) && (
          <button type="button" onClick={() => { setTripResults(null); setTripSearch(''); setJumpTarget(null) }}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-gray-400 hover:bg-gray-50 text-sm transition-colors">
            <X size={14} />
          </button>
        )}
      </form>

      {tripResults && tripResults.length === 0 && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          Ingen turer funnet for «{tripSearch}».
        </div>
      )}
      {tripResults && tripResults.length > 0 && (
        <div className="mb-4 bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
          {tripResults.map(t => (
            <button key={t.id} onClick={() => jumpToTrip(t)} disabled={jumping}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors disabled:opacity-50">
              <div className="text-sm min-w-0">
                <span className="font-semibold text-brand-dark">{t.title}</span>
                {t.driverName && <span className="text-gray-400"> · {t.driverName}</span>}
                {t.bookingReference && <span className="font-mono text-xs text-gray-400"> · {t.bookingReference}</span>}
              </div>
              <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${TRIP_STATUS_COLORS[t.status]}`}>
                {TRIP_STATUS_LABELS[t.status]}
              </span>
            </button>
          ))}
        </div>
      )}
      {jumpTarget?.notFound && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          Denne turen er ikke koblet til en bestilling som finnes.
        </div>
      )}
      {jumpTarget?.booking && (
        <div className="mb-5 border-2 border-brand-blue/30 rounded-2xl overflow-hidden">
          <div className="px-4 py-2 bg-brand-blue/5 border-b border-brand-blue/10">
            <span className="text-xs font-bold text-brand-blue uppercase tracking-wider">Søkeresultat — tur</span>
          </div>
          <BookingCard booking={jumpTarget.booking}
            onStatusChange={handleStatusChange}
            showMoveToNew
            bankAccountNumber={bankAccountNumber}
            company={company}
            defaultOpen
            autoExpandTripId={jumpTarget.autoExpandTripId} />
        </div>
      )}

      {refResult?.notFound && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          Ingen bestilling funnet med referanse «{refSearch}».
        </div>
      )}
      {refResult?.booking && (
        <div className="mb-5 border-2 border-brand-blue/30 rounded-2xl overflow-hidden">
          <div className="px-4 py-2 bg-brand-blue/5 border-b border-brand-blue/10">
            <span className="text-xs font-bold text-brand-blue uppercase tracking-wider">Søkeresultat</span>
          </div>
          <BookingCard booking={refResult.booking}
            onStatusChange={handleStatusChange}
            showMoveToNew
            bankAccountNumber={bankAccountNumber}
            company={company} />
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-2xl w-fit">
        <button onClick={() => setTab('inbox')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${tab === 'inbox' ? 'bg-white text-brand-dark shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <Inbox size={15} /> Innboks
          {newCount > 0 && (
            <span className="bg-brand-blue text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {newCount}
            </span>
          )}
        </button>
        <button onClick={() => setTab('archive')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${tab === 'archive' ? 'bg-white text-brand-dark shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <Archive size={15} /> Arkiv
          {archiveCount > 0 && (
            <span className="bg-gray-400 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {archiveCount}
            </span>
          )}
        </button>
      </div>

      {loading && <div className="text-center py-16 text-gray-400">Laster bestillinger…</div>}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-5 py-4 text-sm flex items-center justify-between gap-4">
          <span>{error}</span>
          <button onClick={load} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-xl text-sm flex-shrink-0 transition-colors">
            <Loader2 size={13} /> Prøv igjen
          </button>
        </div>
      )}

      {!loading && !error && (
        tab === 'inbox'
          ? <InboxTab bookings={bookings} onStatusChange={handleStatusChange} onBulkStatus={handleBulkStatus} bankAccountNumber={bankAccountNumber} company={company} />
          : <ArchiveTab bookings={bookings} onStatusChange={handleStatusChange} onBulkStatus={handleBulkStatus} bankAccountNumber={bankAccountNumber} company={company} />
      )}

      {loadingMore && (
        <div className="flex items-center justify-center gap-2 py-3 text-xs text-gray-400">
          <Loader2 size={14} className="animate-spin" />
          Laster flere bestillinger ({bookings.length} av {totalBookings})…
        </div>
      )}
    </div>
  )
}
