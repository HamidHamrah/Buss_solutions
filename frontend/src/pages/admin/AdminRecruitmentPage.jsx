import { useState, useEffect, useRef } from 'react'
import { Save, Upload, X, ChevronDown, ChevronUp, ExternalLink, Trash2, RefreshCw } from 'lucide-react'
import { api } from '../../services/api'
import { useConfirm } from '../../hooks/useConfirm'

const STATUS_COLORS = {
  Ny: 'bg-blue-100 text-blue-700',
  Vurderes: 'bg-yellow-100 text-yellow-700',
  Ansatt: 'bg-green-100 text-green-700',
  Avvist: 'bg-red-100 text-red-600',
}

// ── Image uploader ──────────────────────────────────────────────────────────
function ImageUploader({ label, value, onUploaded }) {
  const inputRef = useRef()
  const [uploading, setUploading] = useState(false)

  const handle = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { url } = await api.uploadFile(file)
      onUploaded(url)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-brand-dark mb-2">{label}</label>
      {value && (
        <div className="relative mb-2 inline-block">
          <img src={value} alt="preview" className="h-32 rounded-xl object-cover border border-gray-200" />
          <button onClick={() => onUploaded('')}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center">
            <X size={12} />
          </button>
        </div>
      )}
      <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
        className="flex items-center gap-2 text-sm bg-brand-blue hover:bg-brand-blue-dark text-white px-4 py-2 rounded-xl transition-colors disabled:opacity-50">
        <Upload size={14} /> {uploading ? 'Laster opp…' : value ? 'Bytt bilde' : 'Last opp bilde'}
      </button>
      <input ref={inputRef} type="file" accept="image/*" onChange={handle} className="hidden" />
    </div>
  )
}

// ── Application row ─────────────────────────────────────────────────────────
function ApplicationRow({ app, onStatusChange, onDelete }) {
  const [open, setOpen] = useState(false)
  const [updating, setUpdating] = useState(false)

  const changeStatus = async (status) => {
    setUpdating(true)
    try { await onStatusChange(app.id, status) } finally { setUpdating(false) }
  }

  const fileLink = (url, label) => url
    ? <a href={url} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-brand-blue text-xs hover:underline">
        {label} <ExternalLink size={11} />
      </a>
    : <span className="text-xs text-gray-300">Ikke lastet opp</span>

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={() => setOpen(o => !o)}>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-brand-dark">{app.name}</p>
          <p className="text-xs text-gray-400">{app.email} · {app.phone} · {new Date(app.submittedAt).toLocaleDateString('nb-NO')}</p>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLORS[app.status] || 'bg-gray-100 text-gray-500'}`}>
          {app.status}
        </span>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </div>

      {open && (
        <div className="border-t border-gray-100 p-5 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {[['Alder', app.age], ['Bosted', app.location], ['Utdanning', app.education], ['Nåværende stilling', app.currentJob]].map(([k, v]) =>
              v ? <div key={k}><p className="text-xs text-gray-400">{k}</p><p className="font-medium text-brand-dark">{v}</p></div> : null
            )}
          </div>

          {app.notes && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Tilleggsinfo</p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{app.notes}</p>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div><p className="text-xs text-gray-400 mb-1">CV</p>{fileLink(app.cvUrl, 'Åpne CV')}</div>
            <div><p className="text-xs text-gray-400 mb-1">Førerkort (f)</p>{fileLink(app.licenseFrontUrl, 'Forside')}</div>
            <div><p className="text-xs text-gray-400 mb-1">Førerkort (b)</p>{fileLink(app.licenseBackUrl, 'Bakside')}</div>
            <div><p className="text-xs text-gray-400 mb-1">YSK</p>{fileLink(app.yskUrl, 'Åpne YSK')}</div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-2 flex-wrap">
              {['Ny', 'Vurderes', 'Ansatt', 'Avvist'].map(s => (
                <button key={s} onClick={() => changeStatus(s)} disabled={updating || app.status === s}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors disabled:opacity-40
                    ${app.status === s ? 'bg-brand-blue text-white border-brand-blue' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                  {s}
                </button>
              ))}
            </div>
            <button onClick={() => onDelete(app.id)}
              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors">
              <Trash2 size={13} /> Slett søknad
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function AdminRecruitmentPage() {
  const [confirmModal, askConfirm] = useConfirm()
  const [config, setConfig] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [applications, setApplications] = useState([])
  const [appsLoading, setAppsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('settings') // settings | applications

  useEffect(() => {
    api.getConfig().then(c => setConfig(c)).catch(() => {})
    api.getJobApplications().then(r => setApplications(r.items || [])).catch(() => {}).finally(() => setAppsLoading(false))
  }, [])

  const set = (field, val) => setConfig(c => ({ ...c, [field]: val }))

  const save = async () => {
    setSaving(true)
    try {
      const p = config.pricing ?? {}
      const ct = config.content ?? {}
      await api.updateConfig({
        // pricing fields
        kmRate: p.kmRate ?? 18,
        hourRate: p.hourRate ?? 850,
        nightSurcharge: p.nightSurcharge ?? 40,
        weekendSurcharge: p.weekendSurcharge ?? 40,
        deadMileageRate: p.deadMileageRate ?? 20,
        deadMileageRadiusKm: p.deadMileageRadiusKm ?? 30,
        vatPercent: p.vatPercent ?? 12,
        minInvoice: p.minInvoice ?? 3000,
        customVariables: p.customVariables ?? [],
        // content fields
        heroTitle: ct.heroTitle ?? '',
        heroSubtitle: ct.heroSubtitle ?? '',
        heroCta: ct.heroCta ?? '',
        badge1: ct.badge1 ?? '',
        badge2: ct.badge2 ?? '',
        badge3: ct.badge3 ?? '',
        badge4: ct.badge4 ?? '',
        phone: ct.phone ?? '',
        email: ct.email ?? '',
        address: ct.address ?? '',
        orgNr: ct.orgNr ?? '',
        footerAbout: ct.footerAbout ?? '',
        recruitTitle: ct.recruitTitle ?? '',
        recruitText: ct.recruitText ?? '',
        priceDisclaimer: ct.priceDisclaimer ?? '',
        omOssHeroImageUrl: ct.omOssHeroImageUrl ?? '',
        // root-level fields
        termsContent: config.termsContent ?? '',
        bankAccountNumber: config.bankAccountNumber ?? '',
        recruitmentEnabled: config.recruitmentEnabled ?? false,
        recruitmentTeaserTitle: config.recruitmentTeaserTitle ?? '',
        recruitmentTeaserText: config.recruitmentTeaserText ?? '',
        recruitmentTeaserImageUrl: config.recruitmentTeaserImageUrl ?? '',
        recruitmentPageTitle: config.recruitmentPageTitle ?? '',
        recruitmentDescription: config.recruitmentDescription ?? '',
        recruitmentPageImageUrl: config.recruitmentPageImageUrl ?? '',
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (id, status) => {
    await api.updateJobApplicationStatus(id, status)
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a))
  }

  const handleDelete = async (id) => {
    if (!await askConfirm({ title: 'Slett søknad', message: 'Er du sikker på at du vil slette denne søknaden permanent?' })) return
    await api.deleteJobApplication(id)
    setApplications(prev => prev.filter(a => a.id !== id))
  }

  if (!config) return <div className="text-gray-400 text-sm">Laster…</div>

  const newCount = applications.filter(a => a.status === 'Ny').length

  return (
    <div className="max-w-3xl">
      {confirmModal}
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${activeTab === 'settings' ? 'bg-brand-blue text-white' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
          Innstillinger
        </button>
        <button onClick={() => setActiveTab('applications')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors relative ${activeTab === 'applications' ? 'bg-brand-blue text-white' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
          Søknader
          {newCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {newCount}
            </span>
          )}
        </button>
      </div>

      {/* Settings tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Toggle */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-brand-dark text-lg">Rekruttering</h2>
                <p className="text-sm text-gray-400 mt-0.5">Vis «Vi trenger sjåfører»-seksjonen på forsiden</p>
              </div>
              <button onClick={() => set('recruitmentEnabled', !config.recruitmentEnabled)}
                className={`relative inline-flex items-center w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${config.recruitmentEnabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                <span className={`inline-block w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 motion-reduce:transition-none ${config.recruitmentEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </section>

          {/* Legacy banner (Om oss / recruiter blurb shown elsewhere on the site) */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
            <div>
              <h2 className="font-bold text-brand-dark text-lg">Rekrutteringsbanner</h2>
              <p className="text-sm text-gray-400">Kort tekst som vises i «Bli sjåfør»-seksjonen på Om oss-siden</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">Tittel</label>
              <input value={config.content?.recruitTitle ?? ''} onChange={e => set('content', { ...config.content, recruitTitle: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">Tekst</label>
              <textarea value={config.content?.recruitText ?? ''} onChange={e => set('content', { ...config.content, recruitText: e.target.value })}
                rows={3} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 resize-none" />
            </div>
          </section>

          {/* Teaser section */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
            <div>
              <h2 className="font-bold text-brand-dark text-lg">Forsideboks</h2>
              <p className="text-sm text-gray-400">Den lille boksen som vises på forsiden med «Søk her»-knappen</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">Tittel</label>
              <input value={config.recruitmentTeaserTitle} onChange={e => set('recruitmentTeaserTitle', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">Ingress</label>
              <textarea value={config.recruitmentTeaserText} onChange={e => set('recruitmentTeaserText', e.target.value)}
                rows={3} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 resize-none" />
            </div>
            <ImageUploader
              label="Bilde (forsideboks)"
              value={config.recruitmentTeaserImageUrl}
              onUploaded={url => set('recruitmentTeaserImageUrl', url)}
            />
          </section>

          {/* Job page section */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
            <div>
              <h2 className="font-bold text-brand-dark text-lg">Stillingssiden</h2>
              <p className="text-sm text-gray-400">Innhold på søknadssiden (/jobb)</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">Sidetittel</label>
              <input value={config.recruitmentPageTitle} onChange={e => set('recruitmentPageTitle', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">Stillingstekst</label>
              <p className="text-xs text-gray-400 mb-2">Bruk **tekst** for fet tittel og - for punktlister</p>
              <textarea value={config.recruitmentDescription} onChange={e => set('recruitmentDescription', e.target.value)}
                rows={18} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 resize-none font-mono" />
            </div>
            <ImageUploader
              label="Toppbilde (stillingssiden)"
              value={config.recruitmentPageImageUrl}
              onUploaded={url => set('recruitmentPageImageUrl', url)}
            />
          </section>

          <div className="flex items-center gap-4">
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold px-6 py-3 rounded-full text-sm transition-colors disabled:opacity-50">
              <Save size={15} /> {saving ? 'Lagrer…' : 'Lagre endringer'}
            </button>
            {saved && <span className="text-green-600 text-sm font-medium">✓ Lagret!</span>}
          </div>
        </div>
      )}

      {/* Applications tab */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {appsLoading && <p className="text-sm text-gray-400">Laster søknader…</p>}
          {!appsLoading && applications.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-2xl">
              Ingen søknader mottatt ennå.
            </div>
          )}
          {applications.map(app => (
            <ApplicationRow
              key={app.id}
              app={app}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
