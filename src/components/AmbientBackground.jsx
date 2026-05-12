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
          '#a8cdd8',
          '#88b9b4',
          '#b2d4d8',
          '#93bfba',
          '#9dc6c1',
          '#a0caca',
        ]}
        colorBack="#d5e9e9"
        softness={0.95}
        intensity={0.62}
        noise={0.82}
        shape="blob"
        speed={reducedMotion ? 0 : 0.12}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}
