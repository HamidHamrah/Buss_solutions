import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom'
import { api, clearToken } from '../services/api'
import { clearDriverSession } from '../services/driverApi'
import { useConfig } from '../contexts/ConfigContext'
import { fmtDate } from '../utils/bookingHelpers'
import {
  LayoutDashboard, Calculator, FileText, LogOut, ChevronRight, ClipboardList, Handshake, UserCheck, Star, MapPin, HelpCircle, Inbox, CalendarDays, Receipt, Route, Bus, Search, ListChecks
} from 'lucide-react'

const groups = [
  {
    label: 'Daglig arbeid',
    items: [
      { to: '/admin/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/admin/inbox',       icon: ListChecks,      label: 'Innboks', badge: true },
      { to: '/admin/bookings',    icon: ClipboardList,   label: 'Bestillinger' },
      { to: '/admin/planning',    icon: CalendarDays,    label: 'Planlegger' },
      { to: '/admin/trips',       icon: Route,           label: 'Kjøreordre' },
      { to: '/admin/invoices',    icon: Receipt,         label: 'Fakturaer' },
    ],
  },
  {
    label: 'Oppsett',
    items: [
      { to: '/admin/buses',       icon: Bus,             label: 'Busser' },
      { to: '/admin/prices',      icon: Calculator,      label: 'Priser' },
    ],
  },
  {
    label: 'Nettside',
    items: [
      { to: '/admin/content',     icon: FileText,        label: 'Innhold' },
      { to: '/admin/oppdrag',     icon: MapPin,          label: 'Turer' },
      { to: '/admin/faq',         icon: HelpCircle,      label: 'FAQ' },
      { to: '/admin/partners',    icon: Handshake,       label: 'Samarbeidspartnere' },
      { to: '/admin/testimonials',icon: Star,            label: 'Anmeldelser' },
      { to: '/admin/recruitment', icon: UserCheck,       label: 'Rekruttering' },
      { to: '/admin/kontakt',     icon: Inbox,           label: 'Kontaktskjema' },
    ],
  },
]
const nav = groups.flatMap(g => g.items)

function GlobalSearch() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [results, setResults] = useState(null)
  const [open, setOpen] = useState(false)
  const box = useRef(null)

  useEffect(() => {
    if (q.trim().length < 2) { setResults(null); return }
    let stale = false
    const t = setTimeout(() => {
      api.searchBookings(q.trim()).then(r => { if (!stale) setResults(r) }).catch(() => { if (!stale) setResults([]) })
    }, 250)
    return () => { stale = true; clearTimeout(t) }
  }, [q])

  useEffect(() => {
    const close = e => { if (!box.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const go = r => {
    setOpen(false)
    setQ('')
    navigate(`/admin/bookings?ref=${r.reference}`)
  }

  return (
    <div ref={box} className="relative w-full max-w-sm">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        value={q}
        onChange={e => { setQ(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder="Søk referanse, navn, telefon, dato, faktura, sjåfør"
        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-blue"
      />
      {open && results && (
        <div className="absolute z-30 mt-1 w-[28rem] max-w-[90vw] bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-500">Ingen treff.</p>
          ) : (
            <ul className="max-h-96 overflow-auto divide-y divide-gray-100">
              {results.map(r => (
                <li key={r.id}>
                  <button onClick={() => go(r)} className="w-full text-left px-4 py-2.5 hover:bg-gray-50">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-brand-dark truncate">
                        {r.contactName} <span className="font-normal text-gray-400">· {r.reference}</span>
                      </span>
                      <span className="text-xs text-gray-400 shrink-0">{fmtDate(r.departureDate)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 mt-0.5">
                      <span className="text-xs text-gray-500 truncate">{r.fromAddress} → {r.toAddress}</span>
                      <span className="text-xs font-medium text-brand-blue shrink-0">{r.stage}: {r.action}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default function AdminLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { config } = useConfig()
  const content = config?.content ?? {}
  const [inboxCount, setInboxCount] = useState(0)

  useEffect(() => {
    api.getInbox().then(r => setInboxCount(r.length)).catch(() => {})
  }, [pathname])

  const logout = () => {
    clearToken()
    clearDriverSession()
    navigate('/logg-inn')
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-56 bg-brand-dark text-white flex flex-col">
        <div className="px-5 py-5 border-b border-white/10">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-0.5">Admin</p>
          <span className="text-lg font-black text-brand-blue">{content.brandNamePrimary}</span>
          <span className="text-sm text-gray-400 ml-1">{content.brandNameSecondary}</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {groups.map(group => (
            <div key={group.label}>
              <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-gray-500">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map(({ to, icon: Icon, label, badge }) => (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${pathname === to
                        ? 'bg-brand-blue text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                  >
                    <Icon size={16} />
                    <span className="flex-1">{label}</span>
                    {badge && inboxCount > 0 && (
                      <span className="text-[11px] font-bold bg-red-500 text-white rounded-full px-1.5 min-w-5 text-center">{inboxCount}</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-colors mb-1">
            <ChevronRight size={16} /> Se nettside
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={16} /> Logg ut
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-8 py-3 flex items-center justify-between gap-6">
          <h1 className="text-lg font-bold text-brand-dark shrink-0">
            {nav.find(n => n.to === pathname)?.label || 'Admin'}
          </h1>
          <GlobalSearch />
        </header>
        <main className="flex-1 p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
