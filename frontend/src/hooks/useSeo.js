import { useEffect } from 'react'

const SITE = 'Kjosavik Reiser AS'
const DEFAULT_IMAGE = 'https://www.kjosavikreiser.no/og-image.jpg'
const BASE_URL = 'https://www.kjosavikreiser.no'

function setMeta(selector, attr, value) {
  let el = document.querySelector(selector)
  if (!el) {
    el = document.createElement('meta')
    const [attrName, attrVal] = selector.match(/\[([^=]+)="([^"]+)"\]/).slice(1)
    el.setAttribute(attrName, attrVal)
    document.head.appendChild(el)
  }
  el.setAttribute(attr, value)
}

export function useSeo({ title, description, image, noindex = false }) {
  useEffect(() => {
    const fullTitle = title ? `${title} – ${SITE}` : SITE
    const img = image || DEFAULT_IMAGE
    const url = BASE_URL + window.location.pathname

    document.title = fullTitle

    setMeta('meta[name="description"]', 'content', description ?? '')
    setMeta('meta[name="robots"]', 'content', noindex ? 'noindex,nofollow' : 'index,follow')

    // Open Graph
    setMeta('meta[property="og:title"]', 'content', fullTitle)
    setMeta('meta[property="og:description"]', 'content', description ?? '')
    setMeta('meta[property="og:type"]', 'content', 'website')
    setMeta('meta[property="og:url"]', 'content', url)
    setMeta('meta[property="og:image"]', 'content', img)
    setMeta('meta[property="og:image:width"]', 'content', '1200')
    setMeta('meta[property="og:image:height"]', 'content', '630')
    setMeta('meta[property="og:site_name"]', 'content', SITE)
    setMeta('meta[property="og:locale"]', 'content', 'nb_NO')

    // Twitter Card
    setMeta('meta[name="twitter:card"]', 'content', 'summary_large_image')
    setMeta('meta[name="twitter:title"]', 'content', fullTitle)
    setMeta('meta[name="twitter:description"]', 'content', description ?? '')
    setMeta('meta[name="twitter:image"]', 'content', img)

    return () => { document.title = SITE }
  }, [title, description, image, noindex])
}
