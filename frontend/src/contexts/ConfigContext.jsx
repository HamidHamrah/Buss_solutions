import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../services/api'

const ConfigContext = createContext(null)

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    api.getConfig().then(setConfig).finally(() => setLoaded(true))
  }, [])

  const update = (updater) => {
    setConfig(prev => (typeof updater === 'function' ? updater(prev) : updater))
  }

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <ConfigContext.Provider value={{ config, update }}>
      {children}
    </ConfigContext.Provider>
  )
}

export function useConfig() {
  return useContext(ConfigContext)
}
