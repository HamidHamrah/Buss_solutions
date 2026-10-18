import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import { SkeletonRows } from '../../components/Skeleton'
import { DriverModal, DriversTab } from '../../components/admin/DriverParts'

export default function AdminDriversPage() {
  const toast = useToast()
  const [drivers, setDrivers] = useState(null)
  const [modal, setModal] = useState(null)

  useEffect(() => {
    api.getDrivers().then(setDrivers).catch(() => { setDrivers([]); toast.error('Kunne ikke hente sjåfører') })
  }, [toast])

  const handleSave = (result, editing) => {
    setDrivers(prev => editing ? prev.map(d => d.id === result.id ? result : d) : [...prev, result])
    setModal(null)
    toast.success(editing ? 'Sjåfør oppdatert' : 'Sjåfør lagt til')
  }
  const handleDelete = (id) => { setDrivers(prev => prev.filter(d => d.id !== id)); setModal(null); toast.success('Sjåfør slettet') }
  // Keeps the modal open — used for in-modal actions (resend credentials, toggle admin).
  const handleUpdated = (result) => setDrivers(prev => prev.map(d => d.id === result.id ? result : d))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-brand-dark">Sjåfører</h1>
        <p className="text-sm text-gray-400 mt-0.5">Administrer sjåfører og innlogging. Tildeling gjøres i Planlegger.</p>
      </div>
      {drivers === null ? <SkeletonRows rows={4} /> : (
        <DriversTab drivers={drivers} onAdd={() => setModal({ initial: null })} onEdit={(d) => setModal({ initial: d })} />
      )}
      {modal && (
        <DriverModal initial={modal.initial} onSave={handleSave} onDelete={handleDelete} onUpdated={handleUpdated} onClose={() => setModal(null)} />
      )}
    </div>
  )
}
