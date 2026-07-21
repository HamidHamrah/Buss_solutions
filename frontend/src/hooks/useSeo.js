import { useEffect } from 'react'
import { useConfig } from '../contexts/ConfigContext'

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
  const { config } = useConfig() ?? {}
  const site = config?.content?.companyName || ''
  const baseUrl = config?.content?.siteDomain || ''
  const defaultImage = baseUrl ? baseUrl + (config?.content?.ogImagePath || '') : ''

  useEffect(() => {
    const fullTitle = title ? `${title} – ${site}` : site
    const img = image || defaultImage
    const url = baseUrl + window.location.pathname

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
    setMeta('meta[property="og:site_name"]', 'content', site)
    setMeta('meta[property="og:locale"]', 'content', 'nb_NO')

    // Twitter Card
    setMeta('meta[name="twitter:card"]', 'content', 'summary_large_image')
    setMeta('meta[name="twitter:title"]', 'content', fullTitle)
    setMeta('meta[name="twitter:description"]', 'content', description ?? '')
    setMeta('meta[name="twitter:image"]', 'content', img)

    return () => { document.title = site }
  }, [title, description, image, noindex, site, baseUrl, defaultImage])
}
