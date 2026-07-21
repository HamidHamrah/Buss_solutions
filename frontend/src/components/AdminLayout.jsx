import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom'
import { clearToken } from '../services/api'
import { clearDriverSession } from '../services/driverApi'
import { useConfig } from '../contexts/ConfigContext'
import {
  LayoutDashboard, Calculator, FileText, LogOut, ChevronRight, Settings, ClipboardList, Handshake, UserCheck, Star, MapPin, HelpCircle, Inbox, CalendarDays, Receipt, Route
} from 'lucide-react'

const nav = [
  { to: '/admin/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/kontakt',     icon: Inbox,           label: 'Kontakt' },
  { to: '/admin/bookings',    icon: ClipboardList,   label: 'Bestillinger' },
  { to: '/admin/invoices',    icon: Receipt,         label: 'Fakturaer' },
  { to: '/admin/planning',    icon: CalendarDays,    label: 'Planlegger' },
  { to: '/admin/trips',       icon: Route,           label: 'Kjøreordre' },
  { to: '/admin/prices',      icon: Calculator,      label: 'Priskalkulator' },
  { to: '/admin/oppdrag',     icon: MapPin,          label: 'Turer' },
  { to: '/admin/faq',         icon: HelpCircle,      label: 'FAQ' },
  { to: '/admin/partners',    icon: Handshake,       label: 'Samarbeidspartnere' },
  { to: '/admin/testimonials',icon: Star,            label: 'Anmeldelser' },
  { to: '/admin/recruitment', icon: UserCheck,       label: 'Rekruttering' },
  { to: '/admin/content',     icon: FileText,        label: 'Innhold' },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { config } = useConfig()
  const content = config?.content ?? {}

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

        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                ${pathname === to
                  ? 'bg-brand-blue text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
            >
              <Icon size={16} />
              {label}
            </Link>
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
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-brand-dark">
            {nav.find(n => n.to === pathname)?.label || 'Admin'}
          </h1>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Settings size={13} /> {content.companyName} Admin
          </div>
        </header>
        <main className="flex-1 p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
