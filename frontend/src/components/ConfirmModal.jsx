import { Trash2, AlertTriangle } from 'lucide-react'
import { useClosingTransition } from '../hooks/useClosingTransition'

export default function ConfirmModal({ title, message, confirmLabel = 'Slett', onConfirm, onCancel, danger = true }) {
  const { closing, close } = useClosingTransition()
  return (
    <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity duration-150 motion-reduce:transition-none ${closing ? 'opacity-0' : 'opacity-100'}`}
      onClick={e => e.target === e.currentTarget && close(onCancel)}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-sm duration-150 motion-reduce:animate-none ${closing ? 'animate-out fade-out zoom-out-95' : 'animate-in fade-in zoom-in-95'}`}>
        <div className="p-6">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${danger ? 'bg-red-100' : 'bg-amber-100'}`}>
            {danger
              ? <Trash2 size={22} className="text-red-500" />
              : <AlertTriangle size={22} className="text-amber-500" />}
          </div>
          <h3 className="text-lg font-bold text-brand-dark mb-1">{title}</h3>
          {message && <p className="text-sm text-gray-500 leading-relaxed">{message}</p>}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={() => close(onCancel)}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 active:scale-[0.97] transition-[background-color,transform] motion-reduce:transition-none">
            Avbryt
          </button>
          <button onClick={() => close(onConfirm)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white active:scale-[0.97] transition-[background-color,transform] motion-reduce:transition-none
              ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-amber-500 hover:bg-amber-600'}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
