import { useState, useRef } from 'react'
import { Save, Lock, Upload, X, Home, Info, Phone, ShoppingCart, Settings, FileText } from 'lucide-react'
import { useConfig } from '../../contexts/ConfigContext'
import { api } from '../../services/api'
import { driverApi } from '../../services/driverApi'

// ── Shared form primitives ─────────────────────────────────────────────────────

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-brand-dark mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-1.5">{hint}</p>}
      {children}
    </div>
  )
}

function TextInput({ value, onChange, placeholder }) {
  return (
    <input type="text" value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue" />
  )
}

function TextArea({ value, onChange, rows = 3, placeholder }) {
  return (
    <textarea value={value ?? ''} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder}
      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue resize-none" />
  )
}

function ImageUploader({ value, onChange, aspectHint }) {
  const inputRef = useRef()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const handle = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setUploading(true)
    try {
      const { url } = await api.uploadFile(file)
      onChange(url)
    } catch {
      setError('Opplasting feilet — prøv igjen')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="space-y-3">
      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 h-44 bg-gray-50">
          <img src={value} alt="" className="w-full h-full object-cover" />
          <button onClick={() => onChange('')}
            className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow hover:bg-red-50 text-red-400 transition-colors">
            <X size={13} />
          </button>
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-gray-200 h-44 flex flex-col items-center justify-center gap-2 text-gray-400 bg-gray-50">
          <Upload size={24} strokeWidth={1.5} />
          <span className="text-xs">Ingen bilde lastet opp</span>
        </div>
      )}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-50">
          <Upload size={13} /> {uploading ? 'Laster opp…' : value ? 'Bytt bilde' : 'Last opp bilde'}
        </button>
        <span className="text-xs text-gray-400">{aspectHint || 'JPG, PNG, WEBP — maks 10 MB'}</span>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <input ref={inputRef} type="file" accept="image/*" onChange={handle} className="hidden" />
    </div>
  )
}

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
      <h3 className="font-bold text-brand-dark text-base border-b border-gray-100 pb-3">{title}</h3>
      {children}
    </div>
  )
}

function SaveBar({ onSave, saved }) {
  return (
    <div className="flex items-center gap-4 pt-2">
      <button onClick={onSave}
        className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold px-6 py-3 rounded-full text-sm transition-colors">
        <Save size={14} /> Lagre endringer
      </button>
      {saved && <span className="text-green-600 text-sm font-semibold">✓ Lagret!</span>}
    </div>
  )
}

// ── Tab panels ─────────────────────────────────────────────────────────────────

function ForsidenTab({ content, set, onSave, saved }) {
  return (
    <div className="space-y-6">

      <Card title="Tjenesteseksjon — tekst">
        <Field label="Overskrift">
          <TextInput value={content.servicesTitle} onChange={v => set('servicesTitle', v)} placeholder="Bussreiser for alle typer oppdrag" />
        </Field>
        <Field label="Undertekst">
          <TextArea value={content.servicesSubtitle} onChange={v => set('servicesSubtitle', v)} placeholder="Fra dagsturer på Jæren til charterturer i Europa…" />
        </Field>
        <div>
          <label className="block text-sm font-semibold text-brand-dark mb-2">Punktliste (4 tjenester)</label>
          <div className="space-y-2">
            {[1,2,3,4].map(n => (
              <TextInput key={n} value={content[`servicesBullet${n}`]} onChange={v => set(`servicesBullet${n}`, v)} placeholder={`Tjeneste ${n}`} />
            ))}
          </div>
        </div>
      </Card>

      <Card title="Tjenesteseksjon — bilder (3 stk)">
        <p className="text-xs text-gray-400 -mt-1 mb-1">Bildene vises i en rutenettkolonne til høyre for teksten.</p>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Bilde 1 — høy" hint="Venstre, stor">
            <ImageUploader value={content.servicesImage1} onChange={v => set('servicesImage1', v)} aspectHint="3:4 format" />
          </Field>
          <Field label="Bilde 2 — øverst" hint="Høyre, liten">
            <ImageUploader value={content.servicesImage2} onChange={v => set('servicesImage2', v)} aspectHint="1:1 format" />
          </Field>
          <Field label="Bilde 3 — nederst" hint="Høyre, liten">
            <ImageUploader value={content.servicesImage3} onChange={v => set('servicesImage3', v)} aspectHint="1:1 format" />
          </Field>
        </div>
      </Card>

      <Card title="Statistikkrad (4 tall)">
        <p className="text-xs text-gray-400 -mt-1 mb-1">Stripen med tall som vises under tjenesteseksjonen.</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {[1,2,3,4].map(n => (
            <div key={n} className="flex gap-2 items-start">
              <Field label={`Tall ${n}`}>
                <TextInput value={content[`stat${n}Value`]} onChange={v => set(`stat${n}Value`, v)} placeholder="2023" />
              </Field>
              <Field label="Etikett">
                <TextInput value={content[`stat${n}Label`]} onChange={v => set(`stat${n}Label`, v)} placeholder="Etablert på Jæren" />
              </Field>
            </div>
          ))}
        </div>
      </Card>

      <SaveBar onSave={onSave} saved={saved} />
    </div>
  )
}

function OmOssTab({ content, set, onSave, saved }) {
  return (
    <div className="space-y-6">
      <Card title="Headerbilde">
        <Field label="Bakgrunnsbilde" hint="Det store bildet øverst på Om oss-siden">
          <ImageUploader value={content.omOssHeroImageUrl} onChange={v => set('omOssHeroImageUrl', v)} aspectHint="Anbefalt: 1600×900 px, liggende" />
        </Field>
      </Card>

      <Card title="Introduksjon">
        <Field label="Ingress (stor sitattekst)">
          <TextArea value={content.omOssIntroQuote ?? ''} onChange={v => set('omOssIntroQuote', v)} rows={3} />
        </Field>
      </Card>

      <Card title="Tekstkolonner">
        <p className="text-xs text-gray-400 -mt-1 mb-4">De tre kolonnene med tekst på Om oss-siden.</p>
        <div className="space-y-6">
          {[
            { titleKey: 'omOssCol1Title', textKey: 'omOssCol1Text', label: 'Kolonne 1' },
            { titleKey: 'omOssCol2Title', textKey: 'omOssCol2Text', label: 'Kolonne 2' },
            { titleKey: 'omOssCol3Title', textKey: 'omOssCol3Text', label: 'Kolonne 3' },
          ].map(({ titleKey, textKey, label }) => (
            <div key={titleKey} className="border border-gray-100 rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</p>
              <Field label="Tittel">
                <TextInput value={content[titleKey] ?? ''} onChange={v => set(titleKey, v)} />
              </Field>
              <Field label="Tekst">
                <TextArea value={content[textKey] ?? ''} onChange={v => set(textKey, v)} rows={6} />
              </Field>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">Tips: skill avsnitt med tom linje.</p>
      </Card>

      <SaveBar onSave={onSave} saved={saved} />
    </div>
  )
}

function KontaktTab({ content, set, onSave, saved }) {
  return (
    <div className="space-y-6">
      <Card title="Kontaktinformasjon">
        <p className="text-xs text-gray-400 -mt-1 mb-1">Vises i footer, kontaktseksjon og bestillingsskjema.</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Telefon">
            <TextInput value={content.phone} onChange={v => set('phone', v)} placeholder="95 45 38 07" />
          </Field>
          <Field label="E-post">
            <TextInput value={content.email} onChange={v => set('email', v)} placeholder="post@kjosavikreiser.no" />
          </Field>
          <Field label="Adresse">
            <TextInput value={content.address} onChange={v => set('address', v)} placeholder="Fosseikeland, Norge" />
          </Field>
          <Field label="Org.nr.">
            <TextInput value={content.orgNr} onChange={v => set('orgNr', v)} placeholder="997 036 115" />
          </Field>
        </div>
      </Card>

      <Card title="Footertekst">
        <Field label="Kort beskrivelse (vises under logoen i footer)">
          <TextArea value={content.footerAbout} onChange={v => set('footerAbout', v)} placeholder="Pålitelig persontransport siden 2023…" />
        </Field>
      </Card>

      <Card title="Sosiale medier">
        <p className="text-xs text-gray-400 -mt-1 mb-1">Lenkene vises som ikoner i footer. La feltet stå tomt for å skjule ikonet.</p>
        <div className="grid grid-cols-1 gap-4">
          <Field label="Facebook-URL">
            <TextInput value={content.socialFacebook || ''} onChange={v => set('socialFacebook', v)} placeholder="https://facebook.com/kjosavikreiser" />
          </Field>
          <Field label="Instagram-URL">
            <TextInput value={content.socialInstagram || ''} onChange={v => set('socialInstagram', v)} placeholder="https://instagram.com/kjosavikreiser" />
          </Field>
          <Field label="LinkedIn-URL">
            <TextInput value={content.socialLinkedin || ''} onChange={v => set('socialLinkedin', v)} placeholder="https://linkedin.com/company/kjosavikreiser" />
          </Field>
        </div>
      </Card>

      <SaveBar onSave={onSave} saved={saved} />
    </div>
  )
}

function BestillingTab({ content, set, onSave, saved }) {
  return (
    <div className="space-y-6">
      <Card title="Prisforbehold">
        <Field label="Tekst under «Dette er en estimert pris»" hint="Vises på siste steg i bestillingsskjemaet">
          <TextArea value={content.priceDisclaimer} onChange={v => set('priceDisclaimer', v)} rows={5} />
        </Field>
      </Card>
      <SaveBar onSave={onSave} saved={saved} />
    </div>
  )
}

function VilkarTab({ content, set, onSave, saved }) {
  return (
    <div className="space-y-6">
      <Card title="Vilkår og betingelser">
        <p className="text-xs text-gray-400 -mt-1 mb-3">
          Teksten vises på <a href="/vilkar" target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">/vilkar</a> og lenkes fra bestillingsskjemaet.
          Bruk tomme linjer for å skille avsnitt. Du kan skrive seksjoner som «1. Overskrift» — de formateres automatisk.
        </p>
        <TextArea
          value={content.termsContent}
          onChange={v => set('termsContent', v)}
          rows={24}
          placeholder={`1. Parter og gyldighet\nDisse vilkårene gjelder mellom Kjosavik Reiser AS og kunden...\n\n2. Bestilling og bekreftelse\nEn bestilling er ikke bindende før...`}
        />
      </Card>
      <SaveBar onSave={onSave} saved={saved} />
    </div>
  )
}

function AdminTab({ content, set, onSave, saved, newPassword, setNewPassword, confirmPassword, setConfirmPassword, pwSaved, pwError, onSavePassword }) {
  const smtpConfigured = !!content.smtpHost
  const [testStatus, setTestStatus] = useState(null) // null | 'sending' | 'ok' | 'error'
  const [testMsg, setTestMsg] = useState('')

  const sendTestEmail = async () => {
    setTestStatus('sending')
    try {
      const res = await api.sendTestEmail()
      setTestMsg(res.message)
      setTestStatus('ok')
    } catch (e) {
      setTestMsg(e?.message || 'Sending feilet')
      setTestStatus('error')
    }
    setTimeout(() => setTestStatus(null), 5000)
  }

  return (
    <div className="space-y-6">

      <Card title="Fakturainformasjon">
        <p className="text-xs text-gray-400 -mt-1 mb-3">Vises på fakturaer som sendes til kunder.</p>
        <Field label="Kontonummer (for betaling)">
          <TextInput value={content.bankAccountNumber || ''} onChange={v => set('bankAccountNumber', v)} placeholder="1234.56.78901" />
        </Field>
      </Card>

      <Card title="E-post / SMTP">
        <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl mb-4 w-fit
          ${smtpConfigured ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
          <span className={`w-2 h-2 rounded-full ${smtpConfigured ? 'bg-green-500' : 'bg-amber-400'}`} />
          {smtpConfigured ? 'SMTP er konfigurert — e-poster sendes automatisk' : 'SMTP ikke konfigurert — e-poster sendes ikke'}
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Fyll inn SMTP-innstillinger for å aktivere automatiske e-poster ved nye bestillinger og kontaktmeldinger.
          For Gmail: bruk <code className="bg-gray-100 px-1 rounded">smtp.gmail.com</code>, port <code className="bg-gray-100 px-1 rounded">587</code> og et app-passord.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="SMTP-server (host)">
            <TextInput value={content.smtpHost || ''} onChange={v => set('smtpHost', v)} placeholder="smtp.gmail.com" />
          </Field>
          <Field label="Port">
            <TextInput value={String(content.smtpPort || 587)} onChange={v => set('smtpPort', Number(v) || 587)} placeholder="587" />
          </Field>
          <Field label="Brukernavn">
            <TextInput value={content.smtpUsername || ''} onChange={v => set('smtpUsername', v)} placeholder="post@kjosavikreiser.no" />
          </Field>
          <Field label="Passord / App-passord">
            <input type="password" value={content.smtpPassword || ''}
              onChange={e => set('smtpPassword', e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
          </Field>
          <Field label="Avsenderadresse (From)">
            <TextInput value={content.smtpFromAddress || ''} onChange={v => set('smtpFromAddress', v)} placeholder="post@kjosavikreiser.no" />
          </Field>
          <Field label="Varsle til (NotifyTo)">
            <TextInput value={content.smtpNotifyTo || ''} onChange={v => set('smtpNotifyTo', v)} placeholder="post@kjosavikreiser.no" />
          </Field>
        </div>
        {smtpConfigured && (
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
            <button onClick={sendTestEmail} disabled={testStatus === 'sending'}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-2 rounded-full text-sm transition-colors disabled:opacity-50">
              {testStatus === 'sending' ? 'Sender…' : 'Send test-e-post'}
            </button>
            {testStatus === 'ok' && <span className="text-green-600 text-sm">✓ {testMsg}</span>}
            {testStatus === 'error' && <span className="text-red-500 text-sm">✗ {testMsg}</span>}
          </div>
        )}
      </Card>

      <SaveBar onSave={onSave} saved={saved} />

      <Card title="Endre admin-passord">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nytt passord">
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
              placeholder="Minst 12 tegn"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
          </Field>
          <Field label="Bekreft nytt passord">
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Gjenta passord"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
          </Field>
        </div>
        {pwError && <p className="text-red-500 text-sm">{pwError}</p>}
        <div className="flex items-center gap-4">
          <button onClick={onSavePassword}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white font-bold px-5 py-2.5 rounded-full text-sm transition-colors">
            <Lock size={14} /> Oppdater passord
          </button>
          {pwSaved && <span className="text-green-600 text-sm font-semibold">✓ Passord oppdatert!</span>}
        </div>
      </Card>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'forside',    label: 'Forside',    icon: Home },
  { id: 'om-oss',    label: 'Om oss',     icon: Info },
  { id: 'kontakt',   label: 'Kontakt',    icon: Phone },
  { id: 'bestilling',label: 'Bestilling', icon: ShoppingCart },
  { id: 'vilkar',    label: 'Vilkår',     icon: FileText },
  { id: 'admin',     label: 'Admin',      icon: Settings },
]

export default function AdminContentPage() {
  const { config, update } = useConfig()
  const [content, setContent] = useState({ ...config.content })
  const [tab, setTab] = useState('forside')
  const [saved, setSaved] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwSaved, setPwSaved] = useState(false)
  const [pwError, setPwError] = useState('')

  const set = (key, val) => setContent(c => ({ ...c, [key]: val }))

  const save = async () => {
    update(c => ({ ...c, content }))
    try {
      const cfg = config
      await api.updateConfig({
        ...cfg.pricing,
        customVariables: cfg.pricing?.customVariables ?? [],
        ...content,
        heroImageUrl: content.heroImageUrl ?? '',
        omOssHeroImageUrl: content.omOssHeroImageUrl ?? '',
        servicesTitle: content.servicesTitle ?? '',
        servicesSubtitle: content.servicesSubtitle ?? '',
        servicesBullet1: content.servicesBullet1 ?? '',
        servicesBullet2: content.servicesBullet2 ?? '',
        servicesBullet3: content.servicesBullet3 ?? '',
        servicesBullet4: content.servicesBullet4 ?? '',
        servicesImage1: content.servicesImage1 ?? '',
        servicesImage2: content.servicesImage2 ?? '',
        servicesImage3: content.servicesImage3 ?? '',
        stat1Value: content.stat1Value ?? '', stat1Label: content.stat1Label ?? '',
        stat2Value: content.stat2Value ?? '', stat2Label: content.stat2Label ?? '',
        stat3Value: content.stat3Value ?? '', stat3Label: content.stat3Label ?? '',
        stat4Value: content.stat4Value ?? '', stat4Label: content.stat4Label ?? '',
        recruitmentEnabled: cfg.recruitmentEnabled ?? false,
        recruitmentTeaserTitle: cfg.recruitmentTeaserTitle ?? '',
        recruitmentTeaserText: cfg.recruitmentTeaserText ?? '',
        recruitmentTeaserImageUrl: cfg.recruitmentTeaserImageUrl ?? '',
        recruitmentPageTitle: cfg.recruitmentPageTitle ?? '',
        recruitmentDescription: cfg.recruitmentDescription ?? '',
        recruitmentPageImageUrl: cfg.recruitmentPageImageUrl ?? '',
        smtpHost: content.smtpHost ?? '',
        smtpPort: content.smtpPort ?? 587,
        smtpUsername: content.smtpUsername ?? '',
        smtpPassword: content.smtpPassword ?? '',
        smtpFromAddress: content.smtpFromAddress ?? '',
        smtpNotifyTo: content.smtpNotifyTo ?? '',
        socialFacebook: content.socialFacebook ?? '',
        socialInstagram: content.socialInstagram ?? '',
        socialLinkedin: content.socialLinkedin ?? '',
        termsContent: content.termsContent ?? '',
        bankAccountNumber: content.bankAccountNumber ?? '',
      })
    } catch {}
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const savePassword = async () => {
    setPwError('')
    if (!newPassword || newPassword.length < 12) { setPwError('Passord må være minst 12 tegn.'); return }
    if (newPassword !== confirmPassword) { setPwError('Passordene stemmer ikke overens.'); return }
    try {
      // Real admin identity now lives on the Driver record (phone + password login at
      // /logg-inn) — this used to hit the old single-password /api/config endpoint, which
      // stopped mattering once that login page was removed.
      await driverApi.changePassword(newPassword)
    } catch { setPwError('Kunne ikke oppdatere passord — prøv igjen.'); return }
    setNewPassword('')
    setConfirmPassword('')
    setPwSaved(true)
    setTimeout(() => setPwSaved(false), 2500)
  }

  const tabProps = { content, set, onSave: save, saved }

  return (
    <div className="max-w-4xl">
      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl mb-8 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap
              ${tab === id
                ? 'bg-white text-brand-dark shadow-sm'
                : 'text-gray-500 hover:text-brand-dark'}`}>
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Panels */}
      {tab === 'forside'     && <ForsidenTab    {...tabProps} />}
      {tab === 'om-oss'      && <OmOssTab       {...tabProps} />}
      {tab === 'kontakt'     && <KontaktTab      {...tabProps} />}
      {tab === 'bestilling'  && <BestillingTab   {...tabProps} />}
      {tab === 'vilkar'      && <VilkarTab       {...tabProps} />}
      {tab === 'admin'       && (
        <AdminTab {...tabProps}
          newPassword={newPassword} setNewPassword={setNewPassword}
          confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
          pwSaved={pwSaved} pwError={pwError} onSavePassword={savePassword}
        />
      )}
    </div>
  )
}
