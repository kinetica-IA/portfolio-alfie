import { useRef, useState, useEffect } from 'react'

export function useReveal(threshold = 0.25) {
  const ref = useRef(null)
  // Initial state must match between server and client render, or React
  // throws a hydration mismatch on every mount that uses this hook. The
  // IntersectionObserver effect below (client-only) does the revealing.
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setRevealed(true) },
      { threshold }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])

  return { ref, revealed }
}
