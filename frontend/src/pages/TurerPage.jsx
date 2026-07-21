import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { api } from '../services/api'
import { SERVICES } from '../data/services'
import { useSeo } from '../hooks/useSeo'

const GROUPS = [
  { heading: 'Vi utfører all slags transport, enten det er lite eller stort', group: 'transport' },
  { heading: 'Sport, fritid og spesielle anledninger', group: 'fritid' },
  { heading: 'Lengre turer og arrangementer', group: 'langtur' },
]

function ServiceCard({ service }) {
  return (
    <Link to={`/turer/${service.slug}`} className="group block">
      <div className="rounded-2xl overflow-hidden aspect-[4/3] mb-4">
        <img
          src={service.heroImage}
          alt={service.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <h3 className="font-bold text-brand-dark text-base mb-2 group-hover:text-brand-blue transition-colors flex items-center gap-1.5">
        {service.title}
        <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity -mt-0.5" />
      </h3>
      <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">{service.intro}</p>
    </Link>
  )
}

export default function TurerPage() {
  useSeo({
    title: 'Turer og oppdrag',
    description: 'Se alle bussreiser og oppdrag Kjosavik Reiser AS tilbyr — flyplassturer, skoleturer, firmaturer, bryllupstransport, charterturer og mer. Vi kjører dit du vil.',
  })
  const navigate = useNavigate()
  const [services, setServices] = useState([])

  useEffect(() => {
    api.getServiceCategories(true)
      .then(data => setServices(data.length > 0 ? data : SERVICES))
      .catch(() => setServices(SERVICES))
  }, [])

  // If services come from API they have group field; if from static data, assign groups by slug order
  const grouped = GROUPS.map(g => {
    const items = services.filter(s => s.group === g.group)
    // fallback: spread static services evenly across groups
    return { ...g, items }
  })

  // Flat fallback: no groups defined → show all in one grid
  const hasGroups = grouped.some(g => g.items.length > 0)

  return (
    <div className="pt-24 bg-white">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
        <nav className="flex items-center gap-2 text-sm text-gray-400">
          <Link to="/" className="hover:text-brand-blue transition-colors">Hjem</Link>
          <span>→</span>
          <span className="text-brand-dark font-medium">Turer</span>
        </nav>
      </div>

      {/* Hero image */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-14">
        <div className="rounded-3xl overflow-hidden h-[420px]">
          <img
            src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1600&q=80"
            alt="Kjosavik Reiser busser"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Intro */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-20">
        <h1 className="text-5xl sm:text-6xl font-black text-brand-dark mb-6">Turer</h1>
        <p className="text-lg text-gray-500 max-w-2xl leading-relaxed">
          Vi løser små og store oppdrag på en god måte, og sørger for at hver eneste reise med oss blir en bra tur.
          Fra flyturer og skoleturer til bryllupskortejer og charterturer i Europa — vi har bussen og sjåføren for deg.
        </p>
      </div>

      {hasGroups ? (
        GROUPS.map(g => {
          const items = services.filter(s => s.group === g.group)
          if (!items.length) return null
          return (
            <section key={g.group} className="max-w-7xl mx-auto px-6 lg:px-8 mb-20">
              <h2 className="text-2xl sm:text-3xl font-black text-brand-dark mb-10">{g.heading}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                {items.map(s => <ServiceCard key={s.slug} service={s} />)}
              </div>
            </section>
          )
        })
      ) : (
        <section className="max-w-7xl mx-auto px-6 lg:px-8 mb-20">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {services.map(s => <ServiceCard key={s.slug} service={s} />)}
          </div>
        </section>
      )}

      {/* CTA strip */}
      <section className="bg-brand-dark py-20 mt-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-black text-white mb-2">Klar for å bestille?</h2>
            <p className="text-gray-400">Fyll inn skjemaet så gir vi deg et uforpliktende pristilbud.</p>
          </div>
          <button onClick={() => navigate('/book')}
            className="flex-shrink-0 bg-brand-blue hover:bg-white hover:text-brand-dark text-white font-bold px-8 py-4 rounded-full transition-all text-sm">
            Få pristilbud nå
          </button>
        </div>
      </section>
    </div>
  )
}
