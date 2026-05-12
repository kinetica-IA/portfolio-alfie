import { useEffect, useRef } from 'react'
import { NeatGradient } from '@firecms/neat'

export default function AmbientBackground() {
  const canvasRef = useRef(null)
  const gradientRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    gradientRef.current = new NeatGradient({
      ref: canvasRef.current,
      colors: [
        { color: '#ddeef5', enabled: true },
        { color: '#d9ece9', enabled: true },
        { color: '#ddeee4', enabled: true },
        { color: '#f0e8df', enabled: true },
        { color: '#eee6e4', enabled: true },
      ],
      speed: reducedMotion ? 0 : 2,
      horizontalPressure: 4,
      verticalPressure: 5,
      waveFrequencyX: 2,
      waveFrequencyY: 3,
      waveAmplitude: 5,
      shadows: 0,
      highlights: 1,
      colorSaturation: 0,
      colorBrightness: 1.1,
      wireframe: false,
      colorBlending: 6,
      backgroundColor: '#f0f9f9',
      backgroundAlpha: 1,
      grainIntensity: 0.05,
      resolution: 0.5,
    })

    return () => gradientRef.current?.destroy?.()
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none',
        isolation: 'isolate',
      }}
    />
  )
}
