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
          '#b5d0da',
          '#a8c9c5',
          '#bdd5d1',
          '#c8dde0',
          '#aec8c4',
          '#c3d8d4',
        ]}
        colorBack="#e8f2f2"
        softness={0.75}
        intensity={0.55}
        noise={0.5}
        shape="blob"
        speed={reducedMotion ? 0 : 0.18}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}
