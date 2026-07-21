import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Home, Phone } from 'lucide-react'
import { useSeo } from '../hooks/useSeo'

const QUICK_LINKS = [
  { label: 'Bestill bussreise', href: '/book' },
  { label: 'Se alle turer', href: '/turer' },
  { label: 'Priser', href: '/priser' },
  { label: 'Om oss', href: '/om-oss' },
  { label: 'Kontakt', href: '/kontakt' },
]

export default function NotFoundPage() {
  useSeo({ title: 'Side ikke funnet', noindex: true })
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex items-center justify-center px-6 py-24">
        <div className="max-w-lg w-full text-center">

          {/* 404 number */}
          <p className="text-[120px] font-black leading-none text-gray-100 select-none mb-2">404</p>

          <h1 className="text-3xl sm:text-4xl font-black text-brand-dark mb-4">
            Siden finnes ikke
          </h1>
          <p className="text-gray-500 text-lg leading-relaxed mb-10">
            Lenken du fulgte er utdatert, eller siden har blitt flyttet.
            Prøv en av lenkene nedenfor, eller gå tilbake til forsiden.
          </p>

          {/* Primary actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <button onClick={() => navigate(-1)}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              ← Gå tilbake
            </button>
            <Link to="/"
              className="flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold px-6 py-3 rounded-full text-sm transition-all">
              <Home size={14} /> Til forsiden
            </Link>
            <Link to="/book"
              className="flex items-center justify-center gap-2 bg-brand-dark hover:bg-black text-white font-bold px-6 py-3 rounded-full text-sm transition-all">
              Bestill buss <ArrowRight size={14} />
            </Link>
          </div>

          {/* Quick links */}
          <div className="border-t border-gray-100 pt-8">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Populære sider</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {QUICK_LINKS.map(({ label, href }) => (
                <Link key={href} to={href}
                  className="px-4 py-2 rounded-full bg-gray-50 hover:bg-brand-blue/10 text-sm text-gray-600 hover:text-brand-blue font-medium transition-colors">
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Help */}
          <p className="text-sm text-gray-400 mt-10">
            Trenger du hjelp?{' '}
            <a href="tel:+4795453807" className="text-brand-blue font-semibold hover:underline inline-flex items-center gap-1">
              <Phone size={12} /> Ring oss: 95 45 38 07
            </a>
          </p>

        </div>
      </div>
    </div>
  )
}
