import { useEffect } from 'react'

export default function JsonLd({ data }) {
  useEffect(() => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(data)
    script.id = `jsonld-${data['@type']}`
    const existing = document.getElementById(script.id)
    if (existing) existing.remove()
    document.head.appendChild(script)
    return () => { document.getElementById(script.id)?.remove() }
  }, [data])
  return null
}

export const ORG_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': 'https://www.kjosavikreiser.no',
  name: 'Kjosavik Reiser AS',
  url: 'https://www.kjosavikreiser.no',
  logo: 'https://www.kjosavikreiser.no/Favivon.svg',
  image: 'https://www.kjosavikreiser.no/og-image.jpg',
  description: 'Pålitelig persontransport med buss siden 2023. Charter, firmatur, skoletur, bryllupstransport og mer – over hele Norge.',
  telephone: '+4795453807',
  email: 'post@kjosavikreiser.no',
  foundingDate: '2023',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Fosseikeveien 3',
    addressLocality: 'Fosseikeland',
    addressCountry: 'NO',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 58.7333,
    longitude: 5.6500,
  },
  openingHoursSpecification: [
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday'], opens: '07:00', closes: '17:00' },
  ],
  sameAs: ['https://www.facebook.com/kjosavikreiser'],
}
