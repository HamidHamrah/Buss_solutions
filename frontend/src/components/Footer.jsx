import { Link } from 'react-router-dom'
import { Phone, Mail, MapPin } from 'lucide-react'
import { useConfig } from '../contexts/ConfigContext'
import BloomstackLogo from './BloomstackLogo'

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
)
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
  </svg>
)
const LinkedinIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect x="2" y="9" width="4" height="12"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
)

export default function Footer() {
  const { config } = useConfig()
  const content = config?.content ?? {}
  const socials = [
    { url: config?.socialFacebook, icon: <FacebookIcon /> },
    { url: config?.socialInstagram, icon: <InstagramIcon /> },
    { url: config?.socialLinkedin, icon: <LinkedinIcon /> },
  ].filter(s => s.url)

  return (
    <footer className="bg-brand-dark text-white">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

        {/* Brand */}
        <div className="space-y-4">
          <div className="flex flex-col leading-tight">
            <span className="text-2xl font-black text-brand-blue tracking-tight">{content.brandNamePrimary}</span>
            <span className="text-sm font-medium text-gray-400 -mt-1">{content.brandNameSecondary}</span>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed">
            {content.footerAbout}
          </p>
          {socials.length > 0 && (
            <div className="flex gap-3 pt-1">
              {socials.map(({ url, icon }) => (
                <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-brand-blue flex items-center justify-center transition-colors">
                  {icon}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="space-y-4">
          <h4 className="font-bold text-white text-sm uppercase tracking-widest">Tjenester</h4>
          <ul className="space-y-2.5 text-sm text-gray-400">
            {[
              { label: 'Flyplassturer',         href: '/turer/flyplassturer' },
              { label: 'Firmaturer',            href: '/turer/firmaturer' },
              { label: 'Skoleturer',            href: '/turer/skoleturer' },
              { label: 'Sport og idrettslag',   href: '/turer/sport-og-idrettslag' },
              { label: 'Charterturer',          href: '/turer/charterturer' },
              { label: 'Bryllupstransport',     href: '/turer/bryllupstransport' },
            ].map((item) => (
              <li key={item.href}>
                <Link to={item.href} className="hover:text-brand-blue transition-colors">{item.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div className="space-y-4">
          <h4 className="font-bold text-white text-sm uppercase tracking-widest">Selskapet</h4>
          <ul className="space-y-2.5 text-sm text-gray-400">
            {[
              { label: 'Om oss', href: '/om-oss' },
              { label: 'Turer', href: '/turer' },
              { label: 'Priser', href: '/priser' },
              { label: 'Kontakt oss', href: '/kontakt' },
              { label: 'Sjekk bestilling', href: '/bestilling' },
              { label: 'Jobb hos oss', href: '/jobb' },
              { label: 'FAQ', href: '/faq' },
              { label: 'Personvern', href: '/personvern' },
              { label: 'Vilkår', href: '/vilkar' },
            ].map((item) => (
              <li key={item.label}>
                <a href={item.href} className="hover:text-brand-blue transition-colors">{item.label}</a>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div className="space-y-4">
          <h4 className="font-bold text-white text-sm uppercase tracking-widest">Kontakt</h4>
          <ul className="space-y-3 text-sm text-gray-400">
            <li>
              <a href={`tel:+47${(content.phone || '').replace(/\s+/g, '')}`} className="flex items-start gap-2.5 hover:text-brand-blue transition-colors">
                <Phone size={15} className="mt-0.5 flex-shrink-0 text-brand-blue" />
                {content.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${content.email}`} className="flex items-start gap-2.5 hover:text-brand-blue transition-colors">
                <Mail size={15} className="mt-0.5 flex-shrink-0 text-brand-blue" />
                {content.email}
              </a>
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin size={15} className="mt-0.5 flex-shrink-0 text-brand-blue" />
              <span>{content.address}</span>
            </li>
          </ul>
          <div className="pt-2">
            <p className="text-xs text-gray-500 font-medium">Åpningstider</p>
            <p className="text-sm text-gray-400 mt-1">{content.openingHoursText}</p>
            <p className="text-sm text-gray-400">{content.emergencyAvailabilityText}</p>
          </div>
        </div>
      </div>

      {/* Certifications bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {(content.footerCertifications || []).map((cert) => (
              <span key={cert} className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full">
                <span className="text-brand-blue font-bold">✓</span> {cert}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} {content.companyName}
          </p>
        </div>
      </div>

      {/* Bloomstack banner */}
      <div className="bg-black/30 border-t border-white/10">
        <a
          href="https://bloomstack.no"
          target="_blank"
          rel="noopener noreferrer"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          <span>{content.brandNamePrimary} er utviklet av</span>
          <BloomstackLogo className="h-4 w-auto" variant="light" />
        </a>
      </div>
    </footer>
  )
}
