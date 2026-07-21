import { Link } from 'react-router-dom'
import { useSeo } from '../hooks/useSeo'
import { useConfig } from '../contexts/ConfigContext'

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
  const { config } = useConfig()
  const content = config?.content ?? {}

  useSeo({
    title: 'Vilkår og betingelser',
    description: `Les vilkår og betingelser for leie av buss med sjåfør fra ${content.companyName}.`,
  })

  const text = config?.termsContent || ''

  return (
    <div className="pt-24 bg-white min-h-screen">
      <div className="max-w-3xl mx-auto px-6 lg:px-8 py-12">

        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link to="/" className="hover:text-brand-blue transition-colors">Hjem</Link>
          <span>→</span>
          <span className="text-brand-dark font-medium">Vilkår og betingelser</span>
        </nav>

        <h1 className="text-4xl font-black text-brand-dark mb-2">Vilkår og betingelser</h1>
        <p className="text-gray-400 text-sm mb-10">{content.companyName}</p>

        <div className="space-y-8">
          {renderTerms(text)}
        </div>

      </div>
    </div>
  )
}
