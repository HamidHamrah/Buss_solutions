import { useState, useRef, useEffect } from 'react'
import { Upload, CheckCircle, AlertCircle, FileText, X } from 'lucide-react'
import { api } from '../services/api'
import { useSeo } from '../hooks/useSeo'

// ── File uploader for CV / license / YSK ──────────────────────────────────
function FileUploader({ label, hint, accept, onUploaded, value }) {
  const inputRef = useRef()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [fileName, setFileName] = useState(null)

  const handle = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setUploading(true)
    try {
      const { url } = await api.uploadPublicFile(file)
      setFileName(file.name)
      onUploaded(url)
    } catch {
      setError('Opplasting feilet, prøv igjen')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div>
      <p className="text-sm font-semibold text-gray-700 mb-1">{label}</p>
      {hint && <p className="text-xs text-gray-400 mb-2">{hint}</p>}
      {value && fileName ? (
        <div className="flex items-center gap-2 p-2.5 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
          <FileText size={15} />
          <span className="flex-1 truncate">{fileName}</span>
          <button onClick={() => { onUploaded(''); setFileName(null) }}
            className="text-green-400 hover:text-red-500 transition-colors">
            <X size={14} />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="flex items-center gap-2 w-full px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-brand-blue hover:text-brand-blue transition-colors disabled:opacity-50">
          <Upload size={15} />
          {uploading ? 'Laster opp…' : 'Velg fil'}
        </button>
      )}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      <input ref={inputRef} type="file" accept={accept} onChange={handle} className="hidden" />
    </div>
  )
}

// ── Field ─────────────────────────────────────────────────────────────────
function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue bg-white"

// ── Markdown-lite renderer (bold + newlines) ───────────────────────────────
function JobDescription({ text }) {
  const lines = text.split('\n')
  return (
    <div className="space-y-2 text-gray-700 text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2" />
        // Bold headings: **text**
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={i} className="font-bold text-brand-dark text-base mt-4">{line.slice(2, -2)}</p>
        }
        // Bullet items
        if (line.startsWith('- ')) {
          return <p key={i} className="flex gap-2"><span className="text-brand-blue mt-0.5">•</span>{line.slice(2)}</p>
        }
        return <p key={i}>{line}</p>
      })}
    </div>
  )
}

export default function DriverApplicationPage() {
  useSeo({
    title: 'Jobb som sjåfør',
    description: 'Søk jobb som bussjåfør hos Kjosavik Reiser AS på Jæren. Vi ser etter erfarne og serviceinnstilte sjåfører med god kunnskap om Rogaland.',
  })
  const [config, setConfig] = useState(null)
  const [form, setForm] = useState({
    name: '', email: '', phone: '', age: '', location: '',
    education: '', currentJob: '', notes: '',
    cvUrl: '', licenseFrontUrl: '', licenseBackUrl: '', yskUrl: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.getConfig().then(setConfig).catch(() => {})
  }, [])

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.phone) {
      setError('Fyll ut navn, e-post og telefon.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await api.submitJobApplication(form)
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setError('Noe gikk galt. Prøv igjen.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-brand-dark mb-3">Søknaden er sendt!</h2>
          <p className="text-gray-500">Vi har mottatt søknaden din og tar kontakt så snart som mulig. Takk for din interesse!</p>
        </div>
      </div>
    )
  }

  const pageTitle = config?.recruitmentPageTitle || 'Søk på stillingen som bussjåfør'
  const description = config?.recruitmentDescription || ''
  const imageUrl = config?.recruitmentPageImageUrl || ''

  return (
    <div className="bg-white">
      {/* Hero image */}
      {imageUrl && (
        <div className="h-64 md:h-80 overflow-hidden">
          <img src={imageUrl} alt="Bussjåfør" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-14">
        <h1 className="text-3xl md:text-4xl font-black text-brand-dark text-center mb-10">{pageTitle}</h1>

        {/* Job description */}
        {description && (
          <div className="bg-gray-50 rounded-2xl p-7 mb-10">
            <JobDescription text={description} />
          </div>
        )}

        {/* Application form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Navn" required>
              <input value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="Fullt navn" className={inputCls} />
            </Field>
            <Field label="E-post" required>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="din@epost.no" className={inputCls} />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Telefon" required>
              <input value={form.phone} onChange={e => set('phone', e.target.value)}
                placeholder="+47 000 00 000" className={inputCls} />
            </Field>
            <Field label="Alder">
              <input value={form.age} onChange={e => set('age', e.target.value)}
                placeholder="f.eks. 35" className={inputCls} />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Bosted">
              <input value={form.location} onChange={e => set('location', e.target.value)}
                placeholder="By / kommune" className={inputCls} />
            </Field>
            <Field label="Nåværende stilling">
              <input value={form.currentJob} onChange={e => set('currentJob', e.target.value)}
                placeholder="Din nåværende jobb" className={inputCls} />
            </Field>
          </div>

          <Field label="Skole / fagbrev / utdannelse">
            <input value={form.education} onChange={e => set('education', e.target.value)}
              placeholder="Utdanningsbakgrunn" className={inputCls} />
          </Field>

          {/* File uploads */}
          <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
            <p className="text-sm font-bold text-brand-dark">Last opp dokumenter</p>
            <p className="text-xs text-gray-400">PDF, JPG eller PNG — maks 10 MB per fil</p>

            <FileUploader
              label="CV"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              value={form.cvUrl}
              onUploaded={url => set('cvUrl', url)}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FileUploader
                label="Førerkort — forside"
                accept=".pdf,.jpg,.jpeg,.png"
                value={form.licenseFrontUrl}
                onUploaded={url => set('licenseFrontUrl', url)}
              />
              <FileUploader
                label="Førerkort — bakside"
                accept=".pdf,.jpg,.jpeg,.png"
                value={form.licenseBackUrl}
                onUploaded={url => set('licenseBackUrl', url)}
              />
            </div>
            <FileUploader
              label="YSK / kjøreseddel"
              accept=".pdf,.jpg,.jpeg,.png"
              value={form.yskUrl}
              onUploaded={url => set('yskUrl', url)}
            />
          </div>

          <Field label="Annen informasjon">
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              rows={5} placeholder="Fortell oss litt om deg selv, motivasjon eller annet du ønsker å legge til…"
              className={inputCls + ' resize-none'} />
          </Field>

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <button type="submit" disabled={submitting}
            className="w-full bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-4 rounded-2xl text-base transition-colors disabled:opacity-50">
            {submitting ? 'Sender søknad…' : 'Send søknad'}
          </button>
        </form>
      </div>
    </div>
  )
}
