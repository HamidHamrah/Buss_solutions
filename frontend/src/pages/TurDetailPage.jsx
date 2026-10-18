import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { api } from '../services/api'
import { SERVICES } from '../data/services'
import { useSeo } from '../hooks/useSeo'

export default function TurDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [service, setService] = useState(null)
  const [related, setRelated] = useState([])
  const [notFound, setNotFound] = useState(false)

  useSeo({
    title: service?.title || 'Tjenester',
    description: service?.intro || '',
  })

  useEffect(() => {
    api.getServiceCategory(slug)
      .then(data => {
        setService(data)
        api.getServiceCategories(true)
          .then(all => setRelated(all.filter(s => s.slug !== slug).slice(0, 3)))
          .catch(() => setRelated(SERVICES.filter(s => s.slug !== slug).slice(0, 3)))
      })
      .catch(() => {
        const s = SERVICES.find(s => s.slug === slug)
        if (s) {
          setService(s)
          setRelated(SERVICES.filter(x => x.slug !== slug).slice(0, 3))
        } else {
          setNotFound(true)
        }
      })
  }, [slug])

  if (notFound) return (
    <div className="pt-40 pb-20 text-center">
      <p className="text-gray-400 mb-4">Siden ble ikke funnet.</p>
      <Link to="/turer" className="text-brand-blue underline text-sm">← Tilbake til Turer</Link>
    </div>
  )

  if (!service) return (
    <div className="pt-40 pb-20 text-center">
      <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto" />
    </div>
  )

  const body = Array.isArray(service.body) ? service.body : []
  const highlights = Array.isArray(service.highlights) ? service.highlights : []

  return (
    <div className="pt-24 bg-white">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
        <nav className="flex items-center gap-2 text-sm text-gray-400">
          <Link to="/" className="hover:text-brand-blue transition-colors">Hjem</Link>
          <span>→</span>
          <Link to="/turer" className="hover:text-brand-blue transition-colors">Turer</Link>
          <span>→</span>
          <span className="text-brand-dark font-medium">{service.title}</span>
        </nav>
      </div>

      {/* Hero — image left, text right */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="rounded-3xl overflow-hidden aspect-[4/3]">
            <img src={service.detailImage || service.heroImage} alt={service.title} className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-brand-blue text-xs font-bold tracking-[0.2em] uppercase mb-4">Kjosavik Reiser</p>
            <h1 className="text-4xl sm:text-5xl font-black text-brand-dark leading-tight mb-8">
              {service.headline || service.title}
            </h1>
            <div className="space-y-4 mb-10">
              {body.map((para, i) => (
                <p key={i} className="text-gray-500 leading-relaxed">{para}</p>
              ))}
              {body.length === 0 && service.intro && (
                <p className="text-gray-500 leading-relaxed">{service.intro}</p>
              )}
            </div>
            {highlights.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-10">
                {highlights.map(h => (
                  <div key={h} className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-brand-blue/10 flex items-center justify-center flex-shrink-0">
                      <Check size={11} className="text-brand-blue" />
                    </div>
                    <span className="text-sm text-gray-700">{h}</span>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => navigate('/book')}
              className="inline-flex items-center gap-2 bg-brand-dark hover:bg-black text-white font-bold px-8 py-4 rounded-full transition-all text-sm">
              Få pristilbud <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <>
          <div className="max-w-7xl mx-auto px-6 lg:px-8"><hr className="border-gray-100" /></div>
          <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
            <h2 className="text-2xl font-black text-brand-dark mb-10">Andre turer du kanskje er interessert i</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {related.map(s => (
                <Link key={s.slug} to={`/turer/${s.slug}`} className="group block">
                  <div className="rounded-2xl overflow-hidden aspect-[4/3] mb-4">
                    <img src={s.heroImage} alt={s.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none" />
                  </div>
                  <h3 className="font-bold text-brand-dark text-base mb-1.5 group-hover:text-brand-blue transition-colors flex items-center gap-1.5">
                    {s.title} <ArrowRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">{s.intro}</p>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}

      {/* CTA strip */}
      <section className="bg-brand-dark py-20">
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
