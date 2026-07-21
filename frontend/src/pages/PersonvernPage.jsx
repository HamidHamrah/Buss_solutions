import { useSeo } from '../hooks/useSeo'
import { useConfig } from '../contexts/ConfigContext'

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
  const { config } = useConfig()
  const content = config?.content ?? {}

  useSeo({
    title: 'Personvernerklæring',
    description: `Les om hvordan ${content.companyName} behandler personopplysningene dine i henhold til GDPR.`,
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
          {renderContent(content.privacyContent || '')}
        </div>

        <div className="mt-8 p-6 bg-brand-blue/5 border border-brand-blue/20 rounded-2xl text-sm text-gray-600">
          <strong className="text-brand-dark block mb-1">Spørsmål om personvern?</strong>
          Kontakt oss på{' '}
          <a href={`mailto:${content.email}`} className="text-brand-blue hover:underline font-medium">
            {content.email}
          </a>{' '}
          eller ring{' '}
          <a href={`tel:+47${(content.phone || '').replace(/\s+/g, '')}`} className="text-brand-blue hover:underline font-medium">{content.phone}</a>.
        </div>
      </div>
    </div>
  )
}
