import { useState, useCallback, useRef, useEffect } from 'react'

// Delays a modal's real dismissal by `duration` ms so an exit animation (tailwindcss-animate's
// animate-out) can play before the parent unmounts it. Call close(realCallback) from every
// dismiss trigger (backdrop click, Cancel, X, Confirm) instead of calling realCallback directly.
export function useClosingTransition(duration = 150) {
  const [closing, setClosing] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const close = useCallback((cb) => {
    setClosing(true)
    timer.current = setTimeout(cb, duration)
  }, [duration])

  return { closing, close }
}
