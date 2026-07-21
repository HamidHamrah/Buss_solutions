import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowRight, Plus, Minus, MapPin, Clock, Users, Bus } from 'lucide-react'
import { api } from '../services/api'
import { useSeo } from '../hooks/useSeo'

const STATIC_FAQS = [
  { question: 'Hva er inkludert i prisen når man leier buss med sjåfør?', answer: 'Prisen inkluderer sjåfør, drivstoff, bompenger og kjøretøyets forsikring. MVA på 12 % kommer i tillegg. Eventuelle parkeringsavgifter, fergebilletter eller tilleggstjenester faktureres separat.' },
  { question: 'Er det dyrere å leie premiumbuss?', answer: 'Prisen avhenger av busstype, distanse og varighet — ikke utelukkende av bussens størrelse. En mindre VIP-buss kan faktisk koste mer per tur enn en stor turbuss. Bruk reiseplanleggeren for å sammenligne alternativer.' },
  { question: 'Får vi rabatt på leie av buss hvis vi bestiller flere turer?', answer: 'Ja, vi er åpne for å diskutere priser ved gjentakende oppdrag eller større kontrakter. Ta kontakt direkte for et skreddersydd tilbud.' },
  { question: 'Hva er avbestillingsfristen, og hvilke kostnader påløper ved avbestilling?', answer: 'Avbestillingsbetingelsene avtales ved booking og varierer etter oppdragets størrelse og tidspunkt. Generelt gjelder 48 timers frist for dagsturer. Ta kontakt for detaljer om din bestilling.' },
  { question: 'Gjelder prisen for turer utenfor Jæren-området?', answer: 'Ja, men tomkjøring utover 30 km fra Fosseikeland faktureres med kr 20 per km per vei. For reiser inn- og utland avtaler vi pris direkte.' },
  { question: 'Faktureres det nattillegg eller helgetillegg?', answer: 'Det beregnes 40 % tillegg på timeprisen for turer mellom kl. 21:00 og 06:00, samt på lørdager og søndager. Dette er allerede inkludert i estimatene fra reiseplanleggeren.' },
]

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-gray-50 transition-colors">
        <span className="font-semibold text-brand-dark text-sm sm:text-base">{question}</span>
        <span className={`flex-shrink-0 w-7 h-7 rounded-full border flex items-center justify-center transition-colors
          ${open ? 'bg-brand-blue border-brand-blue text-white' : 'border-gray-200 text-gray-400'}`}>
          {open ? <Minus size={13} /> : <Plus size={13} />}
        </span>
      </button>
      {open && (
        <div className="px-6 pb-5">
          <p className="text-gray-500 text-sm leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  )
}

function FactorCard({ icon: Icon, title, desc }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6">
      <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center mb-4">
        <Icon size={18} className="text-brand-blue" />
      </div>
      <h3 className="font-bold text-brand-dark text-sm mb-2">{title}</h3>
      <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
    </div>
  )
}

export default function PriserPage() {
  useSeo({
    title: 'Priser for bussleie med sjåfør',
    description: 'Se priser for leie av turbuss og minibuss på Jæren. Prisen avhenger av distanse, busstype og tidspunkt. Bruk reiseplanleggeren for et raskt estimat.',
  })
  const navigate = useNavigate()
  const [faqs, setFaqs] = useState([])

  useEffect(() => {
    api.getFaqs(true)
      .then(data => setFaqs(data.length > 0 ? data : STATIC_FAQS))
      .catch(() => setFaqs(STATIC_FAQS))
  }, [])

  return (
    <div className="pt-24 bg-white">

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
        <nav className="flex items-center gap-2 text-sm text-gray-400">
          <Link to="/" className="hover:text-brand-blue transition-colors">Hjem</Link>
          <span>→</span>
          <span className="text-brand-dark font-medium">Priser</span>
        </nav>
      </div>

      {/* ── Hero ── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl sm:text-6xl font-black text-brand-dark leading-[1.05] mb-6">
              Priser for leie av buss med sjåfør
            </h1>
            <p className="text-gray-500 text-lg leading-relaxed mb-4">
              Bruk reiseplanleggeren for å beregne pris — raskt, enkelt og uten skjulte kostnader.
            </p>
            <p className="text-gray-500 leading-relaxed mb-10">
              Prisen på å leie buss avhenger av flere faktorer som antall personer, type buss,
              kjøreavstand og varighet. Vi er alltid transparente med prissettingen.
            </p>
            <button onClick={() => navigate('/book')}
              className="inline-flex items-center gap-2.5 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold px-8 py-4 rounded-full text-base transition-all">
              Prøv Reiseplanleggeren <ArrowRight size={16} />
            </button>
          </div>
          <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
            <p className="text-xs font-bold text-brand-blue tracking-widest uppercase mb-6">Hva påvirker prisen?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FactorCard icon={MapPin} title="Kjøreavstand" desc="Pris per km beregnes tur-retur. Tomkjøring utover 30 km radius faktureres separat." />
              <FactorCard icon={Clock}  title="Varighet og tidspunkt" desc="Nattillegg (21–06) og helgetillegg (lør–søn) på 40 % legges til timeprisen." />
              <FactorCard icon={Bus}    title="Busstype" desc="Fra 19-seters minibuss til 55-seters turbuss — ulike priser etter kapasitet og utstyr." />
              <FactorCard icon={Users}  title="Tilleggstjenester" desc="Tilhenger, rullestolvogn og andre tillegg kan legges til i bestillingsskjemaet." />
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-gray-50 border-y border-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h2 className="text-2xl font-black text-brand-dark mb-10 text-center">Slik fungerer det</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'Fyll inn reisen', desc: 'Legg inn avreisested, destinasjon, dato og antall passasjerer i reiseplanleggeren.' },
              { step: '02', title: 'Velg buss og tillegg', desc: 'Se tilgjengelige busser med kapasitet og utstyr. Legg til ønskede tilleggstjenester.' },
              { step: '03', title: 'Send forespørsel', desc: 'Vi bekrefter tilgjengelighet og sender deg en bindende bekreftelse og faktura.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="bg-white rounded-2xl p-6 border border-gray-100">
                <span className="text-4xl font-black text-brand-blue/20 block mb-3">{step}</span>
                <h3 className="font-bold text-brand-dark text-sm mb-2">{title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-black text-brand-dark text-center mb-12">
            Ofte stilte spørsmål
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => <FaqItem key={faq.id ?? i} question={faq.question} answer={faq.answer} />)}
          </div>
          <div className="mt-12 text-center">
            <p className="text-gray-400 text-sm mb-4">Fant du ikke svaret du lette etter?</p>
            <a href="mailto:post@kjosavikreiser.no"
              className="inline-flex items-center gap-2 text-brand-blue font-semibold text-sm hover:underline">
              Kontakt oss direkte <ArrowRight size={13} />
            </a>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-brand-dark py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-black text-white mb-2">Klar til å beregne pris?</h2>
            <p className="text-gray-400">Bruk reiseplanleggeren — du forplikter deg til ingenting.</p>
          </div>
          <button onClick={() => navigate('/book')}
            className="flex-shrink-0 bg-brand-blue hover:bg-white hover:text-brand-dark text-white font-bold px-8 py-4 rounded-full transition-all text-sm">
            Prøv Reiseplanleggeren
          </button>
        </div>
      </section>

    </div>
  )
}
