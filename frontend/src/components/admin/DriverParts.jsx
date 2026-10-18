import { useState } from 'react'
import { Mail, Phone, Plus, RefreshCw, Search, Users, X, Trash2, Edit2 } from 'lucide-react'
import { api } from '../../services/api'
import { useConfirm } from '../../hooks/useConfirm'
import { useClosingTransition } from '../../hooks/useClosingTransition'

// ── Driver modal ──────────────────────────────────────────────────────────────
const DRIVER_PALETTE = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899']

export function DriverModal({ initial, onSave, onDelete, onUpdated, onClose }) {
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


// ── Drivers management tab ────────────────────────────────────────────────────
export function DriversTab({ drivers, onAdd, onEdit }) {
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

