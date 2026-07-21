import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Phone, Mail, MapPin, Clock, Send, CheckCircle, ArrowRight } from 'lucide-react'
import { api } from '../services/api'
import { useSeo } from '../hooks/useSeo'

const SUBJECTS = [
  'Spørsmål om priser',
  'Bestilling / tilbud',
  'Endring av eksisterende bestilling',
  'Samarbeid / partnerskap',
  'Rekruttering / jobb',
  'Annet',
]

const inp = "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"

export default function KontaktPage() {
  useSeo({
    title: 'Kontakt oss',
    description: 'Ta kontakt med Kjosavik Reiser AS for spørsmål om priser, tilgjengelighet eller bestilling. Vi svarer innen én virkedag. Ring oss på 95 45 38 07.',
  })
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: SUBJECTS[0], message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const valid = form.name.trim() && form.email.trim() && form.message.trim()

  const submit = async (e) => {
    e.preventDefault()
    if (!valid) return
    setSending(true); setError(null)
    try {
      await api.submitContact(form)
      setSent(true)
    } catch (err) {
      if (err?.status === 429) {
        setError('For mange forespørsler. Vent litt og prøv igjen.')
      } else {
        setError('Noe gikk galt — prøv igjen eller ring oss direkte.')
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="pt-24 bg-white">

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
        <nav className="flex items-center gap-2 text-sm text-gray-400">
          <Link to="/" className="hover:text-brand-blue transition-colors">Hjem</Link>
          <span>→</span>
          <span className="text-brand-dark font-medium">Kontakt</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="max-w-2xl mb-14">
          <p className="text-brand-blue text-xs font-bold tracking-[0.2em] uppercase mb-4">Ta kontakt</p>
          <h1 className="text-5xl sm:text-6xl font-black text-brand-dark leading-[1.05] mb-5">
            Vi hjelper deg gjerne
          </h1>
          <p className="text-gray-500 text-lg leading-relaxed">
            Har du spørsmål om priser, ledige datoer eller ønsker et skreddersydd tilbud?
            Fyll inn skjemaet, så svarer vi deg innen én virkedag.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">

          {/* ── Form ── */}
          <div className="lg:col-span-3">
            {sent ? (
              <div className="bg-green-50 border border-green-200 rounded-3xl p-10 text-center">
                <CheckCircle size={48} className="text-green-500 mx-auto mb-4" strokeWidth={1.5} />
                <h2 className="text-2xl font-black text-brand-dark mb-3">Melding sendt!</h2>
                <p className="text-gray-500 mb-8">
                  Takk for at du tok kontakt. Vi svarer deg på <strong>{form.email}</strong> innen én virkedag.
                </p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => setSent(false)}
                    className="px-5 py-2.5 rounded-full border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                    Send ny melding
                  </button>
                  <button onClick={() => navigate('/')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-blue text-white text-sm font-semibold hover:bg-brand-blue-dark transition-colors">
                    Tilbake til forsiden <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-dark mb-1.5">Navn *</label>
                    <input value={form.name} onChange={e => set('name', e.target.value)}
                      placeholder="Kari Nordmann" required className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-dark mb-1.5">E-post *</label>
                    <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                      placeholder="kari@eksempel.no" required className={inp} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-dark mb-1.5">
                      Telefon <span className="text-gray-400 font-normal">(valgfritt)</span>
                    </label>
                    <input value={form.phone} onChange={e => set('phone', e.target.value)}
                      placeholder="95 45 38 07" className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-dark mb-1.5">Emne</label>
                    <select value={form.subject} onChange={e => set('subject', e.target.value)} className={inp}>
                      {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-dark mb-1.5">Melding *</label>
                  <textarea value={form.message} onChange={e => set('message', e.target.value)}
                    rows={6} required placeholder="Fortell oss om turen din — reiserute, antall passasjerer, dato og andre ønsker…"
                    className={inp + ' resize-none'} />
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button type="submit" disabled={sending || !valid}
                  className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark disabled:opacity-50 text-white font-bold px-7 py-3.5 rounded-full text-sm transition-all">
                  <Send size={14} /> {sending ? 'Sender…' : 'Send melding'}
                </button>
              </form>
            )}
          </div>

          {/* ── Contact info sidebar ── */}
          <div className="lg:col-span-2 space-y-6">

            <div className="bg-gray-50 rounded-3xl p-7 space-y-5">
              <h3 className="font-black text-brand-dark text-base">Kontaktinformasjon</h3>
              {[
                { icon: Phone, label: 'Telefon', value: '95 45 38 07', href: 'tel:+4795453807' },
                { icon: Mail,  label: 'E-post',  value: 'post@kjosavikreiser.no', href: 'mailto:post@kjosavikreiser.no' },
                { icon: MapPin, label: 'Adresse', value: 'Fosseikeveien 3, Fosseikeland', href: null },
              ].map(({ icon: Icon, label, value, href }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-blue/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon size={16} className="text-brand-blue" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                    {href ? (
                      <a href={href} className="text-sm font-semibold text-brand-dark hover:text-brand-blue transition-colors">{value}</a>
                    ) : (
                      <p className="text-sm font-semibold text-brand-dark">{value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 rounded-3xl p-7 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={15} className="text-brand-blue" />
                <h3 className="font-black text-brand-dark text-base">Åpningstider</h3>
              </div>
              {[
                ['Mandag – fredag', '07:00 – 17:00'],
                ['Lørdag',          '08:00 – 14:00'],
                ['Søndag',          'Stengt'],
              ].map(([day, time]) => (
                <div key={day} className="flex justify-between text-sm">
                  <span className="text-gray-500">{day}</span>
                  <span className="font-semibold text-brand-dark">{time}</span>
                </div>
              ))}
              <p className="text-xs text-gray-400 pt-1 border-t border-gray-200 mt-1">
                Beredskapsvakt tilgjengelig 24/7 for pågående oppdrag.
              </p>
            </div>

            <div className="bg-brand-dark rounded-3xl p-7">
              <h3 className="font-black text-white mb-2">Vil du ha et tilbud?</h3>
              <p className="text-gray-400 text-sm mb-5">
                Bruk reiseplanleggeren for å beregne pris raskt og enkelt.
              </p>
              <button onClick={() => navigate('/book')}
                className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold px-5 py-2.5 rounded-full text-sm transition-all">
                Prøv reiseplanleggeren <ArrowRight size={13} />
              </button>
            </div>

          </div>
        </div>
      </section>

    </div>
  )
}
