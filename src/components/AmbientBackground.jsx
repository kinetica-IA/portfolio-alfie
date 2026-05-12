import { StaticMeshGradient } from '@paper-design/shaders-react'
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
      <StaticMeshGradient
        colors={[
          '#e2f0f0',
          '#a8cdd8',
          '#e8f4f4',
          '#88b9b4',
          '#eaf3f3',
          '#93bfba',
          '#e5f1f1',
          '#9dc6c1',
        ]}
        positions={42}
        waveX={0.75}
        waveY={0.75}
        mixing={0.92}
        grainMixer={0.45}
        grainOverlay={0.3}
        speed={reducedMotion ? 0 : 0.12}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}
