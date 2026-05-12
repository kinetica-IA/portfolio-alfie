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
          '#cce3e6',
          '#c4dde2',
          '#c8e1e3',
          '#c2dbe0',
          '#cae2e4',
          '#c6dfe2',
        ]}
        colorBack="#d8ecec"
        softness={0.92}
        intensity={0.38}
        noise={0.72}
        shape="blob"
        speed={reducedMotion ? 0 : 0.1}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}
