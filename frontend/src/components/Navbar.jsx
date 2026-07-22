import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, Phone, LogIn } from 'lucide-react'
import { useConfig } from '../contexts/ConfigContext'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { config } = useConfig()
  const { phone, email, companyName, logoPath } = config?.content ?? {}
  const telHref = `tel:+47${(phone || '').replace(/\s+/g, '')}`

  const links = [
    { label: 'Leie buss', href: '#services' },
    { label: 'Turer', href: '/turer' },
    { label: 'Priser', href: '/priser' },
    { label: 'Om oss', href: '/om-oss' },
    { label: 'Kontakt', href: '/kontakt' },
  ]

  const handleNav = (href) => {
    setOpen(false)
    if (href.startsWith('#')) {
      const el = document.querySelector(href)
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate(href)
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0 min-w-0">
            <img src={logoPath} alt={companyName} className="h-14 w-auto object-contain shrink-0" />
            <span className="hidden lg:block text-brand-dark font-bold text-sm leading-tight whitespace-nowrap overflow-hidden text-ellipsis">{companyName}</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <button
                key={l.label}
                onClick={() => handleNav(l.href)}
                className="text-brand-dark font-medium hover:text-brand-blue transition-colors text-sm"
              >
                {l.label}
              </button>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-4">
            <a href={telHref} className="flex items-center gap-1.5 text-sm text-brand-gray hover:text-brand-blue transition-colors">
              <Phone size={15} />
              {phone}
            </a>
            <button
              onClick={() => navigate('/logg-inn')}
              className="flex items-center gap-1.5 text-sm text-brand-dark font-medium hover:text-brand-blue transition-colors"
            >
              <LogIn size={15} /> Logg inn
            </button>
            <button
              onClick={() => navigate('/book')}
              className="bg-brand-blue hover:bg-brand-blue-dark text-white font-semibold px-5 py-2.5 rounded-full text-sm transition-colors"
            >
              Få pristilbud
            </button>
          </div>

          {/* Mobile burger */}
          <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {links.map((l) => (
            <button
              key={l.label}
              onClick={() => handleNav(l.href)}
              className="block w-full text-left text-brand-dark font-medium text-base hover:text-brand-blue transition-colors"
            >
              {l.label}
            </button>
          ))}
          <hr className="border-gray-100" />
          <a href={telHref} className="flex items-center gap-2 text-brand-gray text-sm">
            <Phone size={15} /> {phone}
          </a>
          <a href={`mailto:${email}`} className="block text-brand-gray text-sm">
            {email}
          </a>
          <button
            onClick={() => { setOpen(false); navigate('/logg-inn') }}
            className="flex items-center gap-2 text-brand-dark font-medium text-base hover:text-brand-blue transition-colors"
          >
            <LogIn size={16} /> Logg inn
          </button>
          <button
            onClick={() => { setOpen(false); navigate('/book') }}
            className="w-full bg-brand-blue hover:bg-brand-blue-dark text-white font-semibold py-3 rounded-full text-sm transition-colors"
          >
            Få pristilbud
          </button>
        </div>
      )}
    </header>
  )
}
