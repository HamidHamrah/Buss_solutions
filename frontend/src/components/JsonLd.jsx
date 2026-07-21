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
