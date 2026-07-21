import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, AlertCircle } from 'lucide-react'
import { driverApi, driverIsAdmin } from '../../services/driverApi'

export default function DriverChangePasswordPage() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (newPassword.length < 8) return setError('Passordet må være minst 8 tegn.')
    if (newPassword !== confirmPassword) return setError('Passordene er ikke like.')

    setLoading(true)
    try {
      await driverApi.changePassword(newPassword)
      sessionStorage.setItem('driver_must_change_password', '')
      navigate(driverIsAdmin() ? '/admin/dashboard' : '/driver')
    } catch (e) {
      setError(e?.message || 'Kunne ikke bytte passord.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-brand-blue items-center justify-center mb-4">
            <KeyRound size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-brand-dark">Bytt passord</h1>
          <p className="text-sm text-brand-gray mt-1">Du må velge et nytt passord før du fortsetter.</p>
        </div>

        <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-1.5">Nytt passord</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => { setNewPassword(e.target.value); setError('') }}
              placeholder="Minst 8 tegn"
              autoFocus
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-1.5">Bekreft nytt passord</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => { setConfirmPassword(e.target.value); setError('') }}
              placeholder="Gjenta passordet"
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
            disabled={loading || !newPassword || !confirmPassword}
            className="w-full bg-brand-blue hover:bg-brand-blue-dark disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-colors"
          >
            {loading ? 'Lagrer...' : 'Bytt passord'}
          </button>
        </form>
      </div>
    </div>
  )
}
