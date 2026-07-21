import { useState } from 'react'
import ConfirmModal from '../components/ConfirmModal'

export function useConfirm() {
  const [state, setState] = useState(null)

  const askConfirm = ({ title, message, confirmLabel = 'Slett', danger = true }) =>
    new Promise(resolve => setState({ title, message, confirmLabel, danger, resolve }))

  const modal = state ? (
    <ConfirmModal
      title={state.title}
      message={state.message}
      confirmLabel={state.confirmLabel}
      danger={state.danger}
      onConfirm={() => { state.resolve(true); setState(null) }}
      onCancel={() => { state.resolve(false); setState(null) }}
    />
  ) : null

  return [modal, askConfirm]
}
