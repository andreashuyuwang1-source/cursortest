import { useEffect, useRef } from 'react'

export function useDebouncedEffect(effect: () => void, delayMs: number, deps: unknown[]): void {
  const effectRef = useRef(effect)

  // Keep latest effect without re-triggering timers.
  useEffect(() => {
    effectRef.current = effect
  }, [effect])

  useEffect(() => {
    const handle = window.setTimeout(() => effectRef.current(), delayMs)
    return () => window.clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delayMs, ...deps])
}

