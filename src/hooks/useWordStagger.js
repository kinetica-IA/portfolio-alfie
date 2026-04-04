import { useRef, useState, useMemo, useEffect } from 'react'

/**
 * useWordStagger — word-by-word reveal animation triggered by scroll
 *
 * Each word fades up individually with generous stagger delay.
 * The animation is slow enough to read as the words "build" the sentence.
 */
export function useWordStagger(text, { staggerMs = 140, threshold = 0.25 } = {}) {
  const ref = useRef(null)
  const [revealed, setRevealed] = useState(() => typeof window === 'undefined')

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
      transform: revealed ? 'translateY(0)' : 'translateY(18px)',
      filter: revealed ? 'blur(0px)' : 'blur(4px)',
      transition: `opacity 0.9s var(--ease-out), transform 0.9s var(--ease-out), filter 0.9s var(--ease-out)`,
      transitionDelay: revealed ? `${i * staggerMs}ms` : '0ms',
    },
  }))

  return { ref, words, revealed }
}
