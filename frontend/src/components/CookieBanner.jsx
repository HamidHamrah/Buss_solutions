import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const STORAGE_KEY = 'kjosavik_cookie_consent'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) setVisible(true)
  }, [])

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'accepted')
    setVisible(false)
  }

  const decline = () => {
    localStorage.setItem(STORAGE_KEY, 'declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-brand-dark text-white shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
        <p className="text-xs leading-relaxed text-white/70 max-w-2xl">
          Vi bruker informasjonskapsler for å gi deg en bedre opplevelse på nettsiden vår. Ved å fortsette
          å bruke siden godtar du dette i henhold til vår{' '}
          <Link to="/personvern" className="underline underline-offset-2 hover:text-brand-blue transition-colors">
            personvernerklæring
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            onClick={decline}
            className="px-5 py-2 text-xs font-medium text-white/60 border border-white/20 rounded-full hover:border-white/50 hover:text-white transition-all"
          >
            Avslå
          </button>
          <button
            onClick={accept}
            className="px-6 py-2 text-xs font-medium bg-brand-blue text-white rounded-full hover:bg-brand-blue-dark transition-colors"
          >
            Godta
          </button>
        </div>
      </div>
    </div>
  )
}
