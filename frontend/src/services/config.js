// Default site configuration — loaded once, then overridden by admin saves in localStorage

export const DEFAULT_CONFIG = {
  pricing: {
    kmRate: 18,              // kr per km
    hourRate: 850,           // kr per hour (normal)
    nightSurcharge: 40,      // % extra on hourRate between 21:00–06:00
    weekendSurcharge: 40,    // % extra on hourRate all day Saturday & Sunday
    deadMileageRate: 20,     // kr per km beyond base radius
    deadMileageRadiusKm: 30, // km radius from Fosseikeland before dead mileage kicks in
    vatPercent: 12,          // % VAT
    minInvoice: 3000,        // minimum invoice amount (kr)
    customVariables: [
      // { id, name, type: 'flat'|'per_km'|'per_hour'|'percent', value, unit, optional: bool, defaultEnabled: bool }
    ],
  },

  buses: [
    {
      id: 'sprinter',
      name: 'Mercedes Sprinter VIP',
      seats: 19,
      description: 'Våre minibusser har 16–20 regulerbare seter med setebelter, klimaanlegg, mikrofon, DAB, DVD, AUX. Bussene har bagasjerom og mulighet for tilhenger ved behov. Alle våre busser har miljømotor Euro 6 og har høyeste sikkerhetsnivået som er tilgjengelig.',
      images: [
        'https://images.unsplash.com/photo-1570125909517-53cb21c89ff2?w=600&q=80',
        'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&q=80',
      ],
      amenities: ['Wifi', 'Klimaanlegg', 'Kjøkken', '220 Volt', 'WC'],
      active: true,
    },
    {
      id: 'man',
      name: 'MAN Lions Coach',
      seats: 53,
      description: 'MAN Lions Coach er en komfortabel turbuss med plass til 49–53 passasjerer. Euro 6-motor, klimaanlegg, bagasjeplass under bussen og mulighet for lengre turer inn- og utland.',
      images: [
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
        'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=600&q=80',
      ],
      amenities: ['Wifi', 'Klimaanlegg', '220 Volt', 'WC'],
      active: true,
    },
    {
      id: 'setra',
      name: 'Setra 516 HD',
      seats: 55,
      description: 'Setra 516 HD er en premium turbuss med Euro 6-motor og høy komfortstandard. Perfekt for lange turer med store grupper som krever det beste.',
      images: [
        'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&q=80',
        'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&q=80',
      ],
      amenities: ['Wifi', 'Klimaanlegg', 'Kjøkken', '220 Volt', 'WC'],
      active: true,
    },
    {
      id: 'volvo',
      name: 'Volvo 9700 Premium',
      seats: 55,
      description: 'Volvo 9700 Premium er en moderne turbuss med toppkarakter på sikkerhet og komfort. Euro 6-standard og fullt utstyrt for lange reiser.',
      images: [
        'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=600&q=80',
        'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&q=80',
      ],
      amenities: ['Wifi', 'Klimaanlegg', '220 Volt', 'WC'],
      active: true,
    },
  ],

  content: {
    heroTitle: 'En flott og minneverdig reise',
    heroSubtitle: 'Komfortable turbussreiser fra Jæren siden 2023',
    heroCta: 'Planlegg reisen',
    badge1: 'Etablert 2023',
    badge2: 'Erfarne sjåfører',
    badge3: 'Døgnkontinuerlig drift',
    badge4: 'Inn- og utland',
    phone: '95 45 38 07',
    email: 'post@kjosavikreiser.no',
    address: 'Fosseikeveien 3, Fosseikeland',
    orgNr: '',
    footerAbout: 'Pålitelig persontransport siden 2023. Vi frakter deg trygt frem og trygt hjem — over hele Norge.',
    recruitTitle: 'Vi trenger flere sjåfører!',
    recruitText: 'Vil du kjøre for et selskap der sjåførene faktisk betyr noe? Hos oss kan du forvente et godt arbeidsmiljø, moderne kjøretøy og varierte oppdrag.',
    priceDisclaimer: 'Prisen forutsetter at turen starter, slutter eller er innom Jæren-området med ca. 30 km radius. Tomkjøring utover 30 km radius 20 kr/km (per vei). Nattillegg mellom kl 21:00–kl 06:00 beregnes 40% ekstra av prisen.',
    omOssHeroImageUrl: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=1600&q=80',
  },

  adminPassword: 'kjosavik2024',
}

const KEY = 'kjosavik_config'

export function getConfig() {
  try {
    const stored = localStorage.getItem(KEY)
    if (!stored) return DEFAULT_CONFIG
    return deepMerge(DEFAULT_CONFIG, JSON.parse(stored))
  } catch {
    return DEFAULT_CONFIG
  }
}

export function saveConfig(config) {
  localStorage.setItem(KEY, JSON.stringify(config))
}

export function getPricing() { return getConfig().pricing }
export function getBuses() { return getConfig().buses.filter(b => b.active) }
export function getAllBuses() { return getConfig().buses }
export function getContent() { return getConfig().content }

function deepMerge(defaults, overrides) {
  const result = { ...defaults }
  for (const key of Object.keys(overrides)) {
    if (Array.isArray(overrides[key])) {
      result[key] = overrides[key]
    } else if (overrides[key] && typeof overrides[key] === 'object') {
      result[key] = deepMerge(defaults[key] || {}, overrides[key])
    } else {
      result[key] = overrides[key]
    }
  }
  return result
}

// Price calculation
export function calcTripPrice(pricing, { km, departureTime, tripType, busOnStay, stayDurationHours = 0 }) {
  const { kmRate, hourRate, nightSurcharge, weekendSurcharge, vatPercent, minInvoice } = pricing

  const hour = departureTime ? parseInt(departureTime.split(':')[0]) : 12
  const isNight = hour >= 21 || hour < 6
  const isWeekend = false // would need departure date to know day

  let surcharge = 0
  if (isNight) surcharge = nightSurcharge / 100
  if (isWeekend) surcharge = Math.max(surcharge, weekendSurcharge / 100)

  const effectiveHourRate = hourRate * (1 + surcharge)

  // Estimate travel hours from km (avg 80 km/h)
  const travelHours = km / 80
  const legs = tripType === 'return' ? 2 : 1

  let base = (km * legs * kmRate) + (travelHours * legs * effectiveHourRate)

  // Bus available during stay: add hourly charge for stay duration
  if (busOnStay && stayDurationHours > 0) {
    base += stayDurationHours * effectiveHourRate
  }

  // Apply custom variables that are always-on
  for (const v of (pricing.customVariables || [])) {
    if (v.optional) continue
    if (v.type === 'flat') base += v.value
    if (v.type === 'per_km') base += v.value * km * legs
    if (v.type === 'per_hour') base += v.value * travelHours * legs
    if (v.type === 'percent') base *= (1 + v.value / 100)
  }

  base = Math.max(base, minInvoice)
  const vat = base * (vatPercent / 100)
  return { base: Math.round(base), vat: Math.round(vat), total: Math.round(base + vat) }
}
