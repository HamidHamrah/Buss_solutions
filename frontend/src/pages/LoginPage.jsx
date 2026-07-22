import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Lock, AlertCircle, LogIn } from 'lucide-react'
import { setToken } from '../services/api'
import { driverApi, setDriverSession } from '../services/driverApi'
import { useConfig } from '../contexts/ConfigContext'

export default function LoginPage() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { config } = useConfig()

  const login = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await driverApi.login(phone.trim(), password)
      setDriverSession(result.token, result.mustChangePassword, result.driver, result.isAdmin)
      // Admins get the same token — it carries both roles — so the admin panel's
      // own session key also has to be populated for its requests to authenticate.
      if (result.isAdmin) setToken(result.token)
      if (result.mustChangePassword) navigate('/driver/bytt-passord')
      else navigate(result.isAdmin ? '/admin/dashboard' : '/driver')
    } catch {
      setError('Feil telefonnummer eller passord. Prøv igjen.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex w-14 h-14 rounded-2xl bg-brand-blue items-center justify-center mb-4">
            <LogIn size={24} className="text-white" />
          </Link>
          <h1 className="text-2xl font-black text-brand-dark">Logg inn</h1>
          <p className="text-sm text-brand-gray mt-1">{config?.content?.companyName}</p>
        </div>

        <form onSubmit={login} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-1.5">Telefonnummer</label>
            <input
              value={phone}
              onChange={e => { setPhone(e.target.value); setError('') }}
              placeholder="98765432"
              inputMode="tel"
              autoFocus
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-1.5 flex items-center gap-1.5">
              <Lock size={13} /> Passord
            </label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2.5 rounded-xl">
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !phone.trim() || !password}
            className="w-full bg-brand-blue hover:bg-brand-blue-dark disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-colors"
          >
            {loading ? 'Logger inn...' : 'Logg inn'}
          </button>
        </form>
      </div>
    </div>
  )
}
