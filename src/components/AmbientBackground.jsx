import { GrainGradient } from '@paper-design/shaders-react'
import { useEffect, useState } from 'react'

export default function AmbientBackground() {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none',
      }}
    >
      <GrainGradient
        colors={[
          '#85a8b8',
          '#5d8a82',
          '#6b9e7a',
          '#c4855a',
          '#a8796e',
          '#bfa87a',
        ]}
        colorBack="#f0f9f9"
        softness={0.6}
        intensity={0.45}
        noise={0.4}
        shape="wave"
        speed={reducedMotion ? 0 : 0.25}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}
