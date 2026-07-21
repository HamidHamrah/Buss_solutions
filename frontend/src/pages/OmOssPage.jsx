import { ShieldCheck, Leaf, Users, Star } from 'lucide-react'
import { useConfig } from '../contexts/ConfigContext'
import { useSeo } from '../hooks/useSeo'

const values = [
  { icon: ShieldCheck, title: 'Sikkerhet', desc: 'Vi holder utstyr i topp stand og følger nøye kjøre- og hviletidsbestemmelser.' },
  { icon: Leaf,        title: 'Miljø',     desc: 'Alle kjøretøy er Euro 5 eller Euro 6. Sjåførene har gjennomgått miljøkjøringskurs.' },
  { icon: Users,       title: 'Kunden',    desc: 'Vi jobber alltid for å finne den beste løsningen — ingen tur er for liten eller for stor.' },
  { icon: Star,        title: 'Service',   desc: 'Sjåførene gjør sitt ytterste for å gi det lille ekstra på hver eneste reise.' },
]

const DEFAULT_HERO = 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=1600&q=80'

const DEFAULT_INTRO = 'Et turbusselskap på Jæren som satser på komfortable og miljøvennlige busser og et høyt sikkerhetsnivå.'
const DEFAULT_COLS = [
  { title: 'Om oss', text: 'Kjosavik Reiser ble opprettet våren 2023 av Bente Malmin og Kjartan Kjosavik. Vi har kontor og garasje i Fosseikeveien 3 på Fosseikeland, der Bente har kaffen klar når du stikker innom.\n\nI garasjen har vi flere store turbusser som varierer fra 48 til 58 seter, i tillegg til en minibuss på 19 seter. Vi tar alle typer oppdrag og arrangerer noen turer i løpet av året, med og uten guide — men alltid med en smilende og godt erfaren sjåfør.\n\nVi synes det er viktig å støtte idretten lokalt, blant annet gjennom samarbeid med flere idrettslag som vi kjører til og fra kamper og turneringer.' },
  { title: 'Våre verdier', text: 'Vi jobber alltid for å finne den beste løsningen for kunden.\n\nVi setter sikkerhet i fokus, med å holde utstyr i topp stand og vi følger nøye kjøre- og hviletidsbestemmelser.\n\nVi har bare kjøretøy med utslippskrav Euro 5 og Euro 6. Sjåførene har vært gjennom miljøkjøringskurs for minst mulig utslipp.' },
  { title: 'Service', text: 'Vi vil alltid gjøre vårt ytterste for at du som passasjer skal føle deg vel tatt vare på.\n\nVåre sjåfører er der for deg og gjør sitt ytterste for å gi det lille ekstra, slik at du får den servicen du forventer.\n\nVårt mål er at du sitter igjen med en flott og minneverdig opplevelse med oss i Kjosavik Reiser AS.' },
]

export default function OmOssPage() {
  const { config } = useConfig()
  const content = config?.content ?? {}

  useSeo({
    title: 'Om oss',
    description: `${content.companyName} har drevet pålitelig persontransport siden ${content.foundingYear}. Les om hvem vi er, våre verdier og hva som gjør oss til et trygt valg for din neste reise.`,
  })
  const heroImage = content.omOssHeroImageUrl || DEFAULT_HERO
  const introQuote = content.omOssIntroQuote || DEFAULT_INTRO
  const cols = [
    { title: content.omOssCol1Title || DEFAULT_COLS[0].title, text: content.omOssCol1Text || DEFAULT_COLS[0].text },
    { title: content.omOssCol2Title || DEFAULT_COLS[1].title, text: content.omOssCol2Text || DEFAULT_COLS[1].text },
    { title: content.omOssCol3Title || DEFAULT_COLS[2].title, text: content.omOssCol3Text || DEFAULT_COLS[2].text },
  ]

  return (
    <div>

      {/* ── Header with background ── */}
      <section
        className="relative flex items-end"
        style={{ minHeight: '55vh' }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${heroImage}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-8 pb-16 w-full">
          <p className="text-brand-blue text-xs font-bold tracking-[0.2em] uppercase mb-3">{content.companyName}</p>
          <h1 className="text-5xl sm:text-6xl font-black text-white leading-tight mb-4">Om oss</h1>
          <p className="text-white/60 text-lg max-w-xl">{content.stat1Label} i {content.foundingYear}</p>
        </div>
      </section>

      {/* ── Main content ── */}
      <section className="bg-white py-20">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">

          {/* Intro quote */}
          <p className="text-2xl sm:text-3xl font-light text-brand-dark leading-relaxed border-l-4 border-brand-blue pl-6 mb-16">
            {introQuote}
          </p>

          {/* Three columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-20">
            {cols.map((col) => (
              <div key={col.title}>
                <h2 className="text-base font-bold text-brand-dark mb-4">{col.title}</h2>
                <div className="space-y-4 text-brand-gray text-sm leading-relaxed">
                  {col.text.split('\n\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 mb-20" />

          {/* 4 values */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {values.map(({ icon: Icon, title, desc }) => (
              <div key={title}>
                <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
                  <Icon size={18} className="text-brand-blue" />
                </div>
                <p className="font-bold text-brand-dark text-sm mb-1.5">{title}</p>
                <p className="text-brand-gray text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>


    </div>
  )
}
