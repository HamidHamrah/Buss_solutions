import { Link } from 'react-router-dom'
import { useSeo } from '../hooks/useSeo'
import { useConfig } from '../contexts/ConfigContext'

const DEFAULT_TERMS = `1. Parter og gyldighet
Disse vilkårene gjelder mellom Kjosavik Reiser AS, heretter kalt «Kjosavik Reiser», og kunden som bestiller transporttjenester. Ved å sende en bestilling aksepterer kunden disse vilkårene i sin helhet.

2. Bestilling og bekreftelse
En bestilling er ikke bindende før Kjosavik Reiser har sendt en skriftlig ordrebekreftelse til kunden. Prisestimater fra reiseplanleggeren er veiledende og endelig pris fastsettes i ordrebekreftelsen.

3. Pris og betaling
Alle priser er oppgitt eksklusive MVA (12 %) med mindre annet er spesifisert. Faktura sendes etter gjennomført oppdrag med 14 dagers betalingsfrist med mindre annet er avtalt. Ved forsinket betaling påløper lovpålagt forsinkelsesrente.

4. Avbestilling
Avbestilling mer enn 7 dager før avreise: gebyrfritt.
Avbestilling 2–7 dager før avreise: 50 % av avtalt pris.
Avbestilling mindre enn 48 timer før avreise: 100 % av avtalt pris.
Avbestilling skal alltid skje skriftlig til post@kjosavikreiser.no.

5. Kundens plikter
Kunden er ansvarlig for at passasjerene overholder gjeldende ferdsels- og ordensregler i bussen. Skader påført kjøretøyet av passasjerene faktureres kunden. Røyking og inntak av alkohol er ikke tillatt uten skriftlig forhåndsavtale.

6. Kjosavik Reisers plikter
Kjosavik Reiser forplikter seg til å stille med godkjent kjøretøy og sjåfør til avtalt tid og sted. Ved forsinkelser eller avvik varsles kunden så raskt som mulig. Kjosavik Reiser er ikke ansvarlig for forsinkelser som skyldes force majeure, trafikkforhold eller andre forhold utenfor vår kontroll.

7. Forsikring
Alle kjøretøy er forsikret i henhold til norsk lov. Forsikringen dekker personskader og ansvar overfor tredjeparter. Passasjerenes personlige eiendeler er ikke dekket av Kjosavik Reisers forsikring.

8. Personvern
Personopplysninger behandles i henhold til vår personvernerklæring og GDPR. Opplysninger brukes utelukkende for å gjennomføre og administrere bestillingen.

9. Tvister
Eventuelle tvister søkes løst i minnelighet. Dersom partene ikke kommer til enighet, avgjøres tvisten av norske domstoler med Time og Klepp tingrett som verneting.

10. Kontakt
Kjosavik Reiser AS
E-post: post@kjosavikreiser.no
Telefon: 95 45 38 07`

function renderTerms(text) {
  const sections = text.split(/\n\n+/)
  return sections.map((block, i) => {
    const lines = block.trim().split('\n')
    const firstLine = lines[0]
    const isHeading = /^\d+\.\s+\S/.test(firstLine)

    if (isHeading) {
      return (
        <section key={i} className="space-y-2">
          <h2 className="text-xl font-bold text-brand-dark">{firstLine}</h2>
          {lines.slice(1).length > 0 && (
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
              {lines.slice(1).join('\n')}
            </p>
          )}
        </section>
      )
    }
    return (
      <p key={i} className="text-gray-600 leading-relaxed whitespace-pre-line">{block.trim()}</p>
    )
  })
}

export default function VilkarPage() {
  useSeo({
    title: 'Vilkår og betingelser',
    description: 'Les vilkår og betingelser for leie av buss med sjåfør fra Kjosavik Reiser AS.',
  })

  const { config } = useConfig()
  const text = config?.content?.termsContent || DEFAULT_TERMS

  return (
    <div className="pt-24 bg-white min-h-screen">
      <div className="max-w-3xl mx-auto px-6 lg:px-8 py-12">

        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link to="/" className="hover:text-brand-blue transition-colors">Hjem</Link>
          <span>→</span>
          <span className="text-brand-dark font-medium">Vilkår og betingelser</span>
        </nav>

        <h1 className="text-4xl font-black text-brand-dark mb-2">Vilkår og betingelser</h1>
        <p className="text-gray-400 text-sm mb-10">Kjosavik Reiser AS</p>

        <div className="space-y-8">
          {renderTerms(text)}
        </div>

      </div>
    </div>
  )
}
