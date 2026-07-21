import { Link, useNavigate, Outlet } from 'react-router-dom'
import { clearDriverSession, driverName } from '../services/driverApi'
import { clearToken } from '../services/api'
import { LogOut, Bus } from 'lucide-react'

export default function DriverLayout() {
  const navigate = useNavigate()

  const logout = () => {
    clearDriverSession()
    clearToken()
    navigate('/logg-inn')
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-brand-dark text-white px-4 py-3.5 flex items-center justify-between sticky top-0 z-10">
        <Link to="/driver" className="flex items-center gap-2 font-bold">
          <Bus size={18} className="text-brand-blue" /> Sjåfør
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-300">{driverName()}</span>
          <button onClick={logout} className="text-gray-300 hover:text-red-400 transition-colors">
            <LogOut size={17} />
          </button>
        </div>
      </header>
      <main className="flex-1 max-w-lg w-full mx-auto p-4">
        <Outlet />
      </main>
    </div>
  )
}
