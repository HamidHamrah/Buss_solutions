import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Users, ChevronRight } from 'lucide-react'
import { api } from '../services/api'
import { useSeo } from '../hooks/useSeo'

const AMENITY_ICONS = {
  'Wifi': '📶', 'Klimaanlegg': '❄️', 'Kjøkken': '🍽️', '220 Volt': '🔌',
  'WC': '🚾', 'TV/DVD': '📺', 'Mikrofon': '🎤', 'DAB Radio': '📻',
  'Bagasjerom': '🧳', 'Tilhengerfeste': '🔗', 'Rullestolvennlig': '♿',
}

export default function BusserPage() {
  const navigate = useNavigate()
  const [buses, setBuses] = useState([])
  const [loading, setLoading] = useState(true)

  useSeo({
    title: 'Våre busser',
    description: 'Se hele flåten vår — turbusser og minibusser i ulike størrelser med moderne fasiliteter.',
  })

  useEffect(() => {
    api.getBuses(true)
      .then(setBuses)
      .catch(() => setBuses([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="pt-40 pb-20 text-center text-gray-400 text-sm">Laster busser…</div>
  )

  return (
    <div className="pt-24 bg-white min-h-screen">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
        <nav className="flex items-center gap-2 text-sm text-gray-400">
          <Link to="/" className="hover:text-brand-blue transition-colors">Hjem</Link>
          <span>›</span>
          <span className="text-brand-dark font-medium">Busser</span>
        </nav>
      </div>

      {/* Hero text */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-8 pb-14">
        <h1 className="text-5xl sm:text-6xl font-black text-brand-dark mb-5 tracking-tight">Våre busser</h1>
        <p className="text-lg text-gray-500 max-w-2xl leading-relaxed">
          Moderne busser i ulike størrelser — alle utstyrt med komfort og sikkerhet i fokus.
          Klikk på en buss for å se bilder, fasiliteter og mer informasjon.
        </p>
      </div>

      {/* Bus grid */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-24">
        {buses.length === 0 ? (
          <p className="text-gray-400 text-sm">Ingen busser er lagt til ennå.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {buses.map(bus => (
              <Link
                key={bus.id}
                to={`/busser/${bus.id}`}
                className="group block bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200"
              >
                {/* Image */}
                <div className="aspect-[16/10] bg-gray-100 overflow-hidden">
                  {bus.images?.[0] ? (
                    <img
                      src={bus.images[0]}
                      alt={bus.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                      Ingen bilde
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h2 className="font-bold text-brand-dark text-lg leading-tight group-hover:text-brand-blue transition-colors">
                      {bus.name}
                    </h2>
                    <span className="flex items-center gap-1 text-sm text-gray-500 shrink-0 mt-0.5">
                      <Users size={14} />
                      {bus.seats} seter
                    </span>
                  </div>

                  {bus.description && (
                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4">
                      {bus.description}
                    </p>
                  )}

                  {/* Top amenities */}
                  {bus.amenities?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {bus.amenities.slice(0, 4).map(a => (
                        <span key={a} className="inline-flex items-center gap-1 text-xs bg-brand-blue-pale text-brand-blue px-2 py-1 rounded-full font-medium">
                          {AMENITY_ICONS[a] && <span>{AMENITY_ICONS[a]}</span>}
                          {a}
                        </span>
                      ))}
                      {bus.amenities.length > 4 && (
                        <span className="text-xs text-gray-400 px-2 py-1">
                          +{bus.amenities.length - 4} mer
                        </span>
                      )}
                    </div>
                  )}

                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-blue group-hover:gap-2 transition-all">
                    Se detaljer <ChevronRight size={15} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <section className="bg-brand-dark py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-black text-white mb-2">Klar for å bestille?</h2>
            <p className="text-gray-400">Fyll inn skjemaet så gir vi deg et uforpliktende pristilbud.</p>
          </div>
          <button
            onClick={() => navigate('/book')}
            className="flex-shrink-0 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold px-8 py-4 rounded-full transition-all text-sm"
          >
            Få pristilbud nå
          </button>
        </div>
      </section>
    </div>
  )
}
