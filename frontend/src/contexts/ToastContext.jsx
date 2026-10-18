import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { CheckCircle2, XCircle, X } from 'lucide-react'

const ToastContext = createContext({ success: () => {}, error: () => {} })

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(1)

  const dismiss = useCallback((id) => setToasts(t => t.filter(x => x.id !== id)), [])
  const push = useCallback((kind, message) => {
    const id = nextId.current++
    setToasts(t => [...t.slice(-3), { id, kind, message }])
    setTimeout(() => dismiss(id), kind === 'error' ? 6000 : 3500)
  }, [dismiss])

  const api = useMemo(() => ({ success: (m) => push('success', m), error: (m) => push('error', m) }), [push])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div aria-live="polite" className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none max-w-[calc(100vw-2rem)]">
        {toasts.map(t => (
          <div key={t.id} role="status"
            className={`toast-in pointer-events-auto flex items-start gap-2.5 pl-3.5 pr-2.5 py-2.5 rounded-xl shadow-lg text-sm font-medium text-white ${t.kind === 'error' ? 'bg-red-600' : 'bg-brand-dark'}`}>
            {t.kind === 'error' ? <XCircle size={16} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-green-400" />}
            <span>{t.message}</span>
            <button onClick={() => dismiss(t.id)} aria-label="Lukk" className="ml-1 text-white/60 hover:text-white"><X size={14} /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
