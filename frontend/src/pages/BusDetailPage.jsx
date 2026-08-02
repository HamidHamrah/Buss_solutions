import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Users, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { api } from '../services/api'
import { useSeo } from '../hooks/useSeo'

const AMENITY_ICONS = {
  'Wifi': '📶', 'Klimaanlegg': '❄️', 'Kjøkken': '🍽️', '220 Volt': '🔌',
  'WC': '🚾', 'TV/DVD': '📺', 'Mikrofon': '🎤', 'DAB Radio': '📻',
  'Bagasjerom': '🧳', 'Tilhengerfeste': '🔗', 'Rullestolvennlig': '♿',
}

function Lightbox({ images, index, onClose, onPrev, onNext }) {
  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, onPrev, onNext])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white p-2"
      >
        <X size={28} />
      </button>
      {images.length > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); onPrev() }}
            className="absolute left-4 text-white/70 hover:text-white p-3"
          >
            <ChevronLeft size={32} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onNext() }}
            className="absolute right-4 text-white/70 hover:text-white p-3"
          >
            <ChevronRight size={32} />
          </button>
        </>
      )}
      <img
        src={images[index]}
        alt=""
        className="max-h-[90vh] max-w-[90vw] object-contain"
        onClick={e => e.stopPropagation()}
      />
      <span className="absolute bottom-4 text-white/50 text-sm">
        {index + 1} / {images.length}
      </span>
    </div>
  )
}

export default function BusDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [bus, setBus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState(null)

  useSeo({
    title: bus ? bus.name : 'Buss',
    description: bus?.description || '',
  })

  useEffect(() => {
    api.getBuses(false)
      .then(list => {
        const found = list.find(b => String(b.id) === String(id))
        setBus(found || null)
      })
      .catch(() => setBus(null))
      .finally(() => setLoading(false))
  }, [id])

  const openLightbox = i => setLightbox(i)
  const closeLightbox = () => setLightbox(null)
  const prevImage = () => setLightbox(i => (i - 1 + bus.images.length) % bus.images.length)
  const nextImage = () => setLightbox(i => (i + 1) % bus.images.length)

  if (loading) return (
    <div className="pt-40 pb-20 text-center text-gray-400 text-sm">Laster…</div>
  )

  if (!bus) return (
    <div className="pt-40 pb-20 text-center">
      <p className="text-gray-400 mb-6">Bussen ble ikke funnet.</p>
      <Link to="/busser" className="text-brand-blue font-semibold hover:underline">← Tilbake til busser</Link>
    </div>
  )

  const images = bus.images || []

  return (
    <>
      {lightbox !== null && (
        <Lightbox
          images={images}
          index={lightbox}
          onClose={closeLightbox}
          onPrev={prevImage}
          onNext={nextImage}
        />
      )}

      <div className="pt-24 bg-white min-h-screen">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-400">
            <Link to="/" className="hover:text-brand-blue transition-colors">Hjem</Link>
            <span>›</span>
            <Link to="/busser" className="hover:text-brand-blue transition-colors">Busser</Link>
            <span>›</span>
            <span className="text-brand-dark font-medium">{bus.name}</span>
          </nav>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-8 pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">
            {/* Left: images */}
            <div>
              {images.length > 0 ? (
                <>
                  <div
                    className="rounded-2xl overflow-hidden aspect-[16/10] mb-3 cursor-zoom-in"
                    onClick={() => openLightbox(0)}
                  >
                    <img
                      src={images[0]}
                      alt={bus.name}
                      className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300"
                    />
                  </div>
                  {images.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {images.slice(1, 5).map((img, i) => (
                        <div
                          key={i}
                          className="rounded-xl overflow-hidden aspect-square cursor-zoom-in relative"
                          onClick={() => openLightbox(i + 1)}
                        >
                          <img src={img} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                          {i === 3 && images.length > 5 && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-lg">
                              +{images.length - 5}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-2xl aspect-[16/10] bg-gray-100 flex items-center justify-center text-gray-300 text-sm">
                  Ingen bilder
                </div>
              )}
            </div>

            {/* Right: info */}
            <div className="lg:sticky lg:top-28">
              <div className="flex items-center gap-3 mb-2">
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue bg-brand-blue-pale px-3 py-1 rounded-full">
                  <Users size={13} /> {bus.seats} seter
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-black text-brand-dark mb-5 tracking-tight">{bus.name}</h1>

              {bus.description && (
                <p className="text-gray-500 leading-relaxed mb-8 text-base">{bus.description}</p>
              )}

              {bus.amenities?.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Fasiliteter</h2>
                  <div className="flex flex-wrap gap-2">
                    {bus.amenities.map(a => (
                      <span key={a} className="inline-flex items-center gap-1.5 text-sm bg-gray-50 border border-gray-100 text-brand-dark px-3 py-1.5 rounded-full font-medium">
                        {AMENITY_ICONS[a] && <span>{AMENITY_ICONS[a]}</span>}
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => navigate('/book')}
                  className="flex-1 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold px-6 py-3.5 rounded-full text-sm transition-all"
                >
                  Få pristilbud nå
                </button>
                <Link
                  to="/busser"
                  className="flex items-center justify-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-brand-dark transition-colors px-6 py-3.5"
                >
                  <ChevronLeft size={15} /> Tilbake til busser
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
