import { createContext, useContext, useState, useEffect } from 'react'
import { getConfig, saveConfig } from '../services/config'

const ConfigContext = createContext(null)

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(getConfig)

  const update = (updater) => {
    setConfig(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      saveConfig(next)
      return next
    })
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
