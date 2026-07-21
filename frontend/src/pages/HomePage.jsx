import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { ArrowRight, Star, ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react'
import { api } from '../services/api'
import { useSeo } from '../hooks/useSeo'
import JsonLd, { ORG_SCHEMA } from '../components/JsonLd'

// ── Google G svg ──────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" aria-label="Google">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

// ── Review card ───────────────────────────────────────────────────────────────
function ReviewCard({ t }) {
  const [expanded, setExpanded] = useState(false)
  const initials = t.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const isLong = t.text.length > 160
  const displayText = (!expanded && isLong) ? t.text.slice(0, 160) + '…' : t.text

  return (
    <div className="bg-white rounded-3xl p-7 flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ backgroundColor: t.avatarColor }}>
            {initials}
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">{t.name}</p>
            <div className="flex gap-0.5 mt-0.5">
              {[1,2,3,4,5].map(n => <Star key={n} size={12} className={n <= t.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />)}
            </div>
          </div>
        </div>
        {t.source === 'Google' && <GoogleIcon />}
      </div>
      <p className="text-gray-500 text-sm leading-relaxed flex-1">
        {displayText}
        {isLong && (
          <button onClick={() => setExpanded(e => !e)} className="text-brand-blue font-medium ml-1 hover:underline">
            {expanded ? 'Vis mindre' : 'Les mer'}
          </button>
        )}
      </p>
    </div>
  )
}

// ── Reviews section ───────────────────────────────────────────────────────────
function ReviewsSection({ testimonials }) {
  const scrollRef = useRef(null)
  const scroll = (dir) => scrollRef.current?.scrollBy({ left: dir * 340, behavior: 'smooth' })

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-brand-blue text-xs font-bold tracking-[0.2em] uppercase mb-2">Våre kunder sier</p>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900">Tilbakemeldinger</h2>
          </div>
          <div className="flex gap-2">
            <button onClick={() => scroll(-1)}
              className="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:border-brand-blue hover:text-brand-blue transition-colors shadow-sm">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => scroll(1)}
              className="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:border-brand-blue hover:text-brand-blue transition-colors shadow-sm">
              <ChevronRightIcon size={16} />
            </button>
          </div>
        </div>
        <div ref={scrollRef} className="flex gap-5 overflow-x-auto pb-2 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {testimonials.map(t => (
            <div key={t.id} className="flex-shrink-0 w-80">
              <ReviewCard t={t} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Swapping word ─────────────────────────────────────────────────────────────
const SWAP_WORDS = ['Behagelig', 'Avslappet', 'Trygt', 'Sikkert', 'Enkelt', 'Sømløst', 'Personlig', 'Pålitelig']

function SwapWord({ words = SWAP_WORDS, className = '' }) {
  const [current, setCurrent] = useState(0)
  const [outgoing, setOutgoing] = useState(null)
  const [direction, setDirection] = useState('up')
  const [width, setWidth] = useState(null)
  const currentRef = useRef(null)
  const outgoingRef = useRef(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setDirection(Math.random() < 0.5 ? 'up' : 'down')
      setOutgoing(current)
      setCurrent(c => (c + 1) % words.length)
    }, 2200)
    return () => clearInterval(interval)
  }, [current, words.length])

  useEffect(() => {
    if (outgoing === null) return
    const t = setTimeout(() => setOutgoing(null), 500)
    return () => clearTimeout(t)
  }, [outgoing])

  useLayoutEffect(() => {
    const widths = [currentRef.current?.scrollWidth, outgoingRef.current?.scrollWidth].filter(Boolean)
    if (widths.length) setWidth(Math.max(...widths))
  })

  return (
    <span className={`relative inline-block overflow-hidden align-bottom ${className}`} style={{ height: '1.1em', width: width ?? 'auto' }}>
      {outgoing !== null && (
        <span
          ref={outgoingRef}
          key={`out-${outgoing}`}
          className="absolute left-0 top-0 block whitespace-nowrap"
          style={{ animation: `swap-out-${direction} 0.5s ease forwards` }}
        >
          {words[outgoing]}
        </span>
      )}
      <span
        ref={currentRef}
        key={`in-${current}`}
        className="absolute left-0 top-0 block whitespace-nowrap"
        style={outgoing !== null ? { animation: `swap-in-${direction} 0.5s ease forwards` } : undefined}
      >
        {words[current]}
      </span>
    </span>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  useSeo({
    title: 'Turbuss og minibuss til leie på Jæren',
    description: 'Kjosavik Reiser AS tilbyr komfortable bussreiser fra Jæren siden 2023. Flyplassturer, skoleturer, firmaturer og charterturer. Få et uforpliktende pristilbud i dag.',
  })
  const navigate = useNavigate()
  const [partners, setPartners] = useState([])
  const [siteConfig, setSiteConfig] = useState(null)
  const [testimonials, setTestimonials] = useState([])

  useEffect(() => {
    api.getPartners(true).then(setPartners).catch(() => {})
    api.getConfig().then(setSiteConfig).catch(() => {})
    api.getTestimonials(true).then(setTestimonials).catch(() => {})
  }, [])

  const c = siteConfig?.content ?? {}
  const heroImg = c.heroImageUrl || 'https://images.unsplash.com/photo-1570125909517-53cb21c89ff2?w=1600&q=80'

  return (
    <div>
      <JsonLd data={ORG_SCHEMA} />


      {/* ── Services — split layout ── */}
      <section id="services" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-brand-blue text-xs font-bold tracking-[0.2em] uppercase mb-4">Hva vi tilbyr</p>
              <h2 className="text-4xl sm:text-5xl font-black text-brand-dark leading-tight mb-6">
                Reise med oss<br />
                <span className="whitespace-nowrap">– <SwapWord className="text-red-600" /></span>
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed mb-8">
                {c.servicesSubtitle || 'Fra dagsturer på Jæren til charterturer i Europa — vi sørger for at du og dine reisende kommer trygt og komfortabelt frem.'}
              </p>
              <div className="space-y-4 mb-10">
                {[c.servicesBullet1, c.servicesBullet2, c.servicesBullet3, c.servicesBullet4]
                  .filter(Boolean)
                  .map(item => (
                    <div key={item} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-blue flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{item}</span>
                    </div>
                  ))}
              </div>
              <button onClick={() => navigate('/book')}
                className="inline-flex items-center gap-2 bg-brand-dark hover:bg-black text-white font-bold px-7 py-3.5 rounded-full transition-all text-sm">
                Bestill nå <ArrowRight size={15} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-3xl overflow-hidden aspect-[3/4] row-span-2">
                <img src={c.servicesImage1 || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&q=80'} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="rounded-3xl overflow-hidden aspect-square">
                <img src={c.servicesImage2 || 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=400&q=80'} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="rounded-3xl overflow-hidden aspect-square">
                <img src={c.servicesImage3 || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80'} alt="" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="bg-gray-50 border-y border-gray-100 py-12" id="about">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { n: c.stat1Value || '2023',    l: c.stat1Label || 'Etablert på Jæren' },
              { n: c.stat2Value || '4',        l: c.stat2Label || 'Busser i flåten' },
              { n: c.stat3Value || 'Euro 5–6', l: c.stat3Label || 'Miljøstandard' },
              { n: c.stat4Value || '100 %',    l: c.stat4Label || 'Dedikerte sjåfører' },
            ].map(({ n, l }) => (
              <div key={l} className="text-center">
                <p className="text-3xl sm:text-4xl font-black text-brand-dark mb-1">{n}</p>
                <p className="text-gray-400 text-sm">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bus types ── */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-14">
            <p className="text-brand-blue text-xs font-bold tracking-[0.2em] uppercase mb-4">Flåten vår</p>
            <h2 className="text-4xl sm:text-5xl font-black text-brand-dark">Velg riktig buss</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { name: 'Mercedes Sprinter VIP', seats: '19 seter', desc: 'For små grupper og VIP-oppdrag' },
              { name: 'MAN Lions Coach', seats: '48 seter', desc: 'Gruppeturisme og charterreiser' },
              { name: 'Setra 516 HD', seats: '53 seter', desc: 'Premium med Euro 6-motor' },
              { name: 'Volvo 9700 Premium', seats: '58 seter', desc: 'Moderne Volvo med topputstyr' },
            ].map((s) => (
              <button key={s.name} onClick={() => navigate('/book')}
                className="text-left bg-white rounded-3xl p-7 hover:shadow-lg transition-all group border border-transparent hover:border-brand-blue/20">
                <p className="text-brand-blue text-xs font-bold tracking-wider uppercase mb-4">{s.seats}</p>
                <h3 className="font-black text-brand-dark text-lg mb-2 leading-snug">{s.name}</h3>
                <p className="text-gray-400 text-sm mb-6 leading-relaxed">{s.desc}</p>
                <span className="inline-flex items-center gap-1 text-brand-blue text-sm font-bold group-hover:gap-2 transition-all">
                  Bestill <ArrowRight size={14} />
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Recruitment banner ── */}
      {siteConfig?.recruitmentEnabled && (siteConfig.recruitmentTeaserTitle || siteConfig.recruitmentTeaserText) && (
        <section className="py-24 bg-brand-dark">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center gap-12">
              {siteConfig.recruitmentTeaserImageUrl && (
                <div className="w-full md:w-96 flex-shrink-0 rounded-3xl overflow-hidden aspect-[4/3]">
                  <img src={siteConfig.recruitmentTeaserImageUrl} alt="Sjåfør" className="w-full h-full object-cover" />
                </div>
              )}
              <div>
                <p className="text-brand-blue text-xs font-bold tracking-[0.2em] uppercase mb-4">Bli en del av teamet</p>
                <h2 className="text-4xl font-black text-white mb-5 leading-tight">
                  {siteConfig.recruitmentTeaserTitle || 'Vi trenger flere sjåfører!'}
                </h2>
                <p className="text-white/50 text-base leading-relaxed mb-8 max-w-lg">
                  {siteConfig.recruitmentTeaserText}
                </p>
                <button onClick={() => navigate('/jobb')}
                  className="inline-flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold px-7 py-3.5 rounded-full transition-all text-sm">
                  Søk her <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Reviews ── */}
      {testimonials.length > 0 && <ReviewsSection testimonials={testimonials} />}

      {/* ── Partners ── */}
      {partners.length > 0 && (
        <section className="py-16 bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <p className="text-gray-300 text-xs font-bold tracking-[0.2em] uppercase text-center mb-10">Samarbeidspartnere</p>
            <div className="flex flex-wrap items-center justify-center gap-10">
              {partners.map(p => (
                <a key={p.id} href={p.websiteUrl} target="_blank" rel="noopener noreferrer" title={p.name}
                  className="flex items-center justify-center h-12 opacity-50 hover:opacity-100 transition-opacity">
                  <img src={p.logoUrl} alt={p.name} className="max-h-10 max-w-[140px] object-contain" />
                </a>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
