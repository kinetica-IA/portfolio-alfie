import { useRef, useState, useMemo, useEffect } from 'react'

/**
 * useWordStagger — word-by-word reveal animation triggered by scroll
 *
 * Returns { ref, words } where words is an array of { text, style } objects.
 * Attach ref to the container element. Render each word in a <span>.
 */
export function useWordStagger(text, { staggerMs = 100, threshold = 0.25 } = {}) {
  const ref = useRef(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setRevealed(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])

  const wordTexts = useMemo(() => text.split(' ').filter(Boolean), [text])

  const words = wordTexts.map((word, i) => ({
    text: word,
    style: {
      display: 'inline-block',
      marginRight: '0.3em',
      opacity: revealed ? 1 : 0,
      transform: revealed ? 'translateY(0)' : 'translateY(12px)',
      transition: `opacity 0.6s var(--ease-out), transform 0.6s var(--ease-out)`,
      transitionDelay: revealed ? `${i * staggerMs}ms` : '0ms',
    },
  }))

  return { ref, words, revealed }
}
