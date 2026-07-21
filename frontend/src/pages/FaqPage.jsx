import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { api } from '../services/api'
import { useSeo } from '../hooks/useSeo'

const FALLBACK = [
  { id: 1, question: 'Hva er inkludert i prisen når man leier buss med sjåfør?', answer: 'Prisen inkluderer sjåfør, drivstoff, bompenger og kjøretøyets forsikring. MVA på 12 % kommer i tillegg.' },
  { id: 2, question: 'Er det dyrere å leie premiumbuss?', answer: 'Prisen avhenger av busstype, distanse og varighet — ikke utelukkende av bussens størrelse.' },
  { id: 3, question: 'Får vi rabatt på leie av buss hvis vi bestiller flere turer?', answer: 'Ja, vi er åpne for å diskutere priser ved gjentakende oppdrag eller større kontrakter.' },
  { id: 4, question: 'Hva er avbestillingsfristen, og hvilke kostnader påløper ved avbestilling?', answer: 'Avbestillingsbetingelsene avtales ved booking og varierer etter oppdragets størrelse og tidspunkt.' },
  { id: 5, question: 'Gjelder prisen for turer utenfor Jæren-området?', answer: 'Ja, men tomkjøring utover 30 km fra Fosseikeland faktureres med kr 20 per km per vei.' },
  { id: 6, question: 'Faktureres det nattillegg eller helgetillegg?', answer: 'Det beregnes 40 % tillegg på timeprisen for turer mellom kl. 21:00 og 06:00, samt på lørdager og søndager.' },
]

function FaqItem({ item }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-brand-dark text-sm sm:text-base">{item.question}</span>
        {open
          ? <ChevronUp size={18} className="text-brand-blue flex-shrink-0" />
          : <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />
        }
      </button>
      {open && (
        <div className="px-6 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
          {item.answer}
        </div>
      )}
    </div>
  )
}

export default function FaqPage() {
  useSeo({
    title: 'Ofte stilte spørsmål',
    description: 'Svar på vanlige spørsmål om bussleie, priser, avbestilling og tilleggtjenester hos Kjosavik Reiser AS.',
  })

  const [faqs, setFaqs] = useState([])

  useEffect(() => {
    api.getFaqs(true)
      .then(data => setFaqs(Array.isArray(data) && data.length > 0 ? data : FALLBACK))
      .catch(() => setFaqs(FALLBACK))
  }, [])

  return (
    <div className="pt-24 min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-brand-dark mb-4">Ofte stilte spørsmål</h1>
          <p className="text-gray-500 max-w-xl mx-auto">
            Her finner du svar på de vanligste spørsmålene om bussleie hos Kjosavik Reiser AS. Finner du ikke svaret du leter etter?{' '}
            <a href="/kontakt" className="text-brand-blue hover:underline font-medium">Kontakt oss.</a>
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map(faq => (
            <FaqItem key={faq.id} item={faq} />
          ))}
        </div>

        <div className="mt-12 p-8 bg-brand-blue rounded-2xl text-white text-center">
          <h2 className="text-xl font-black mb-2">Har du et annet spørsmål?</h2>
          <p className="text-white/80 text-sm mb-5">Vi svarer normalt innen 2 arbeidstimer.</p>
          <a href="/kontakt"
            className="inline-flex items-center gap-2 bg-white text-brand-blue font-bold px-6 py-3 rounded-xl text-sm hover:bg-gray-100 transition-colors">
            Send oss en melding
          </a>
        </div>
      </div>
    </div>
  )
}
