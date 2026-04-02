import { useState, useEffect, useRef } from 'react'

/**
 * useCountUp — Animates a number from 0 to target on reveal.
 * Returns the current display value as a string.
 * @param {number} target - The final number
 * @param {number} decimals - Decimal places
 * @param {boolean} active - Start counting when true
 * @param {number} duration - Animation duration in ms
 */
export function useCountUp(target, decimals = 0, active = false, duration = 900) {
  const [value, setValue] = useState(0)
  const startTime = useRef(null)
  const raf = useRef(null)

  useEffect(() => {
    if (!active || target == null) return

    startTime.current = performance.now()

    function tick(now) {
      const elapsed = now - startTime.current
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(eased * target)

      if (progress < 1) {
        raf.current = requestAnimationFrame(tick)
      } else {
        setValue(target)
      }
    }

    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [active, target, duration])

  return typeof target === 'number' ? value.toFixed(decimals) : String(target)
}
