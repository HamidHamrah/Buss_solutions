import { useSeo } from '../hooks/useSeo'

const PRIVACY_CONTENT = `1. Behandlingsansvarlig
Kjosavik Reiser AS, Fosseikeveien 3, Fosseikeland, er behandlingsansvarlig for personopplysninger som samles inn via denne nettsiden.

Kontakt: post@kjosavikreiser.no · Tlf: 95 45 38 07

2. Hvilke opplysninger samler vi inn?
Når du bruker vår bookingskjema eller kontaktskjema samler vi inn:
- Navn (for- og etternavn)
- E-postadresse
- Mobilnummer
- Bedriftsnavn og organisasjonsnummer (kun ved firmabooking)
- Reiseinformasjon (adresser, dato, antall passasjerer)
- Meldinger du sender oss

Vi samler ikke inn sensitive personopplysninger med mindre du frivillig oppgir dem i en melding.

3. Formål og rettslig grunnlag
Vi behandler opplysningene dine for å:
- Behandle og besvare din bestillingsforespørsel (kontraktsoppfyllelse – GDPR art. 6 b)
- Besvare henvendelser via kontaktskjemaet (berettiget interesse – GDPR art. 6 f)
- Sende deg nødvendig kommunikasjon om din bestilling (kontraktsoppfyllelse)
- Overholde regnskapsmessige forpliktelser (rettslig forpliktelse – GDPR art. 6 c)

Vi bruker ikke opplysningene dine til automatisert beslutningstaking eller profilering.

4. Deling med tredjeparter
Vi deler ikke personopplysningene dine med tredjeparter for markedsføring. Opplysningene kan deles med:
- E-postleverandør (for utsending av bekreftelser)
- Regnskapssystem (ved fakturabehandling)
- Offentlige myndigheter når dette er lovpålagt

Alle databehandlere er underlagt databehandleravtale og behandler opplysningene kun på våre vegne.

5. Lagringstid
Vi lagrer personopplysningene dine så lenge det er nødvendig for de formålene de ble samlet inn for:
- Bestillingsdata: 5 år (regnskapsmessige forpliktelser)
- Kontakthenvendelser: 2 år etter siste kontakt
- Når du ber om sletting, vil vi slette opplysningene innen 30 dager

6. Informasjonskapsler (cookies)
Vår nettside bruker kun nødvendige informasjonskapsler for grunnleggende funksjonalitet. Vi bruker ikke sporingsinfokapsler eller tredjeparts analyseverktøy uten ditt samtykke. Du kan administrere informasjonskapsler i nettleserinnstillingene dine.

7. Dine rettigheter
I henhold til GDPR har du rett til å:
- Kreve innsyn i personopplysningene vi har lagret om deg
- Kreve retting av feilaktige opplysninger
- Kreve sletting av dine opplysninger («retten til å bli glemt»)
- Kreve begrensning av behandlingen
- Protestere mot behandling basert på berettiget interesse
- Dataportabilitet – motta opplysningene i et maskinlesbart format

For å utøve dine rettigheter, kontakt oss på post@kjosavikreiser.no. Vi svarer innen 30 dager.

8. Klagerett
Dersom du mener vi behandler personopplysningene dine i strid med GDPR, har du rett til å klage til Datatilsynet:
Datatilsynet, Postboks 458 Sentrum, 0105 Oslo
www.datatilsynet.no · postkasse@datatilsynet.no

9. Endringer i personvernerklæringen
Vi kan oppdatere denne erklæringen. Vesentlige endringer vil varsles på nettsiden. Siste oppdatering: juli 2026.

10. Kontakt
Kjosavik Reiser AS
E-post: post@kjosavikreiser.no
Telefon: 95 45 38 07
Adresse: Fosseikeveien 3, Fosseikeland`

function renderContent(text) {
  return text.split(/\n\n+/).map((block, i) => {
    if (/^\d+\./.test(block.split('\n')[0])) {
      const [first, ...rest] = block.split('\n')
      return (
        <div key={i} className="mb-6">
          <h2 className="text-lg font-bold text-brand-dark mb-2">{first}</h2>
          {rest.length > 0 && (
            <div className="text-gray-600 text-sm leading-relaxed space-y-1">
              {rest.map((line, j) => (
                line.startsWith('-')
                  ? <p key={j} className="pl-4">• {line.slice(1).trim()}</p>
                  : <p key={j}>{line}</p>
              ))}
            </div>
          )}
        </div>
      )
    }
    return <p key={i} className="text-gray-600 text-sm leading-relaxed mb-4">{block}</p>
  })
}

export default function PersonvernPage() {
  useSeo({
    title: 'Personvernerklæring',
    description: 'Les om hvordan Kjosavik Reiser AS behandler personopplysningene dine i henhold til GDPR.',
    noindex: false,
  })

  return (
    <div className="pt-24 min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-brand-dark mb-3">Personvernerklæring</h1>
          <p className="text-gray-500">Sist oppdatert: juli 2026</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          {renderContent(PRIVACY_CONTENT)}
        </div>

        <div className="mt-8 p-6 bg-brand-blue/5 border border-brand-blue/20 rounded-2xl text-sm text-gray-600">
          <strong className="text-brand-dark block mb-1">Spørsmål om personvern?</strong>
          Kontakt oss på{' '}
          <a href="mailto:post@kjosavikreiser.no" className="text-brand-blue hover:underline font-medium">
            post@kjosavikreiser.no
          </a>{' '}
          eller ring{' '}
          <a href="tel:+4795453807" className="text-brand-blue hover:underline font-medium">95 45 38 07</a>.
        </div>
      </div>
    </div>
  )
}
