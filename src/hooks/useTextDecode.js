/**
 * useTextDecode.js -- binary shuffle->reveal effect
 *
 * Decode: each tick one more character "locks" (left to right).
 * Unlocked chars show random chars from charset.
 * Duration: 800ms per cycle.
 * Loop: if loop=true, repeats every intervalMs (default 30s).
 * Only active when isActive=true.
 */
import { useState, useEffect, useRef } from 'react'

const CHARSET = '01'

function randomChar() {
  return CHARSET[Math.floor(Math.random() * CHARSET.length)]
}

function scramble(text) {
  return text.split('').map(ch =>
    ch === ' ' || ch === '\u00b7' || ch === '/' ? ch : randomChar()
  ).join('')
}

export function useTextDecode(
  text,
  {
    charset = '01',
    duration = 800,
    loop = false,
    intervalMs = 30000,
    isActive = true,
    delay = 0,
  } = {}
) {
  const [displayed, setDisplayed] = useState(() => scramble(text))
  const timersRef = useRef([])

  useEffect(() => {
    timersRef.current.forEach(id => clearTimeout(id))
    timersRef.current = []

    if (!isActive) {
      setDisplayed(text)
      return
    }

    function runDecode(onComplete) {
      const chars    = text.split('')
      const tickMs   = Math.max(30, Math.floor(duration / chars.length))
      let step       = 0

      const tick = () => {
        step++
        setDisplayed(
          chars.map((ch, i) => {
            if (ch === ' ' || ch === '\u00b7' || ch === '/') return ch
            if (i < step) return ch
            return randomChar()
          }).join('')
        )

        if (step >= chars.length) {
          setDisplayed(text)
          if (onComplete) onComplete()
        } else {
          const id = setTimeout(tick, tickMs)
          timersRef.current.push(id)
        }
      }

      setDisplayed(scramble(text))
      const id = setTimeout(tick, tickMs)
      timersRef.current.push(id)
    }

    function startLoop() {
      runDecode(() => {
        if (loop && isActive) {
          const id = setTimeout(() => {
            startLoop()
          }, intervalMs)
          timersRef.current.push(id)
        }
      })
    }

    const delayId = setTimeout(() => {
      startLoop()
    }, delay)
    timersRef.current.push(delayId)

    return () => {
      timersRef.current.forEach(id => clearTimeout(id))
      timersRef.current = []
    }
  }, [text, isActive, loop, intervalMs, duration, delay])

  return displayed
}
