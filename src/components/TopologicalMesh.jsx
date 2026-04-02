import { useRef, useMemo, useCallback, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const ACCENT = [0.565, 0.655, 0.647]
const GREEN  = [0.420, 0.620, 0.478]
const WARM   = [0.769, 0.522, 0.353]

function lerp3(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return mobile
}

/* ── Floating particles ────────────────────────────────── */
function Particles({ mobile, count = 200 }) {
  const ref = useRef()
  const pointer = useRef(new THREE.Vector3(999, 0, 999))

  const { positions, colors, basePositions } = useMemo(() => {
    const n = mobile ? 80 : count
    const pos = new Float32Array(n * 3)
    const base = new Float32Array(n * 3)
    const col = new Float32Array(n * 3)
    const palette = [ACCENT, GREEN, WARM]
    for (let i = 0; i < n; i++) {
      const x = (Math.random() - 0.5) * 18
      const y = Math.random() * 0.8 + 0.2
      const z = (Math.random() - 0.5) * 11
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z
      base[i * 3] = x; base[i * 3 + 1] = y; base[i * 3 + 2] = z
      const c = palette[Math.floor(Math.random() * 3)]
      col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2]
    }
    return { positions: pos, colors: col, basePositions: base }
  }, [mobile, count])

  useEffect(() => {
    if (mobile) return
    const handler = (e) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 18 - 9
      pointer.current.z = -(e.clientY / window.innerHeight) * 11 + 5.5
    }
    window.addEventListener('pointermove', handler)
    return () => window.removeEventListener('pointermove', handler)
  }, [mobile])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    const pos = ref.current.geometry.attributes.position.array
    const px = pointer.current.x
    const pz = pointer.current.z
    const n = pos.length / 3

    for (let i = 0; i < n; i++) {
      const bx = basePositions[i * 3]
      const by = basePositions[i * 3 + 1]
      const bz = basePositions[i * 3 + 2]

      let x = bx + Math.sin(t * 0.2 + i) * 0.15
      let y = by + Math.cos(t * 0.15 + i * 0.5) * 0.08
      let z = bz + Math.sin(t * 0.18 + i * 0.7) * 0.12

      // Cursor repulsion (desktop)
      if (!mobile) {
        const dx = x - px
        const dz = z - pz
        const dist2 = dx * dx + dz * dz
        const force = 0.3 * Math.exp(-dist2 / 3)
        const dist = Math.sqrt(dist2) || 0.01
        x += (dx / dist) * force
        z += (dz / dist) * force
      }

      pos[i * 3] = x
      pos[i * 3 + 1] = y
      pos[i * 3 + 2] = z
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={positions.length / 3} itemSize={3} />
        <bufferAttribute attach="attributes-color" array={colors} count={colors.length / 3} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial vertexColors transparent opacity={0.25} size={0.04} sizeAttenuation />
    </points>
  )
}

/* ── Flow lines ────────────────────────────────────────── */
function FlowLines() {
  const ref = useRef()
  const lines = useMemo(() => {
    const result = []
    for (let l = 0; l < 4; l++) {
      const pts = []
      const z = -4 + l * 2.5
      for (let i = 0; i <= 60; i++) {
        pts.push(new THREE.Vector3(-9 + i * 0.3, 0, z))
      }
      result.push({ points: pts, z, phase: l * 1.5 })
    }
    return result
  }, [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    ref.current.children.forEach((line, l) => {
      const pos = line.geometry.attributes.position.array
      const phase = lines[l].phase
      const z = lines[l].z
      for (let i = 0; i < pos.length / 3; i++) {
        const x = -9 + i * 0.3
        pos[i * 3 + 1] = Math.sin(x * 0.4 + t * 0.25 + phase) * 0.12
        pos[i * 3 + 2] = z + Math.cos(x * 0.2 + t * 0.15 + phase) * 0.08
      }
      line.geometry.attributes.position.needsUpdate = true
    })
  })

  return (
    <group ref={ref}>
      {lines.map((l, i) => {
        const positions = new Float32Array(l.points.length * 3)
        l.points.forEach((p, j) => { positions[j * 3] = p.x; positions[j * 3 + 1] = p.y; positions[j * 3 + 2] = p.z })
        return (
          <line key={i}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" array={positions} count={l.points.length} itemSize={3} />
            </bufferGeometry>
            <lineBasicMaterial color={i % 2 === 0 ? '#90a7a5' : '#6b9e7a'} transparent opacity={0.08} />
          </line>
        )
      })}
    </group>
  )
}

/* ── Main mesh surface ─────────────────────────────────── */
function MeshSurface({ mobile }) {
  const meshRef = useRef()
  const wireRef = useRef()
  const pointer = useRef(new THREE.Vector3(999, 0, 999))
  const { raycaster, camera } = useThree()

  const segX = mobile ? 40 : 80
  const segZ = mobile ? 25 : 50
  const width = 18
  const height = 11

  const basePositions = useMemo(() => {
    const geo = new THREE.PlaneGeometry(width, height, segX, segZ)
    geo.rotateX(-Math.PI / 2)
    return geo.attributes.position.array.slice()
  }, [segX, segZ])

  const handlePointerMove = useCallback((e) => {
    if (mobile) return
    const x = (e.clientX / window.innerWidth) * 2 - 1
    const y = -(e.clientY / window.innerHeight) * 2 + 1
    raycaster.setFromCamera({ x, y }, camera)
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const target = new THREE.Vector3()
    raycaster.ray.intersectPlane(plane, target)
    if (target) pointer.current.copy(target)
  }, [mobile, raycaster, camera])

  useEffect(() => {
    if (mobile) return
    window.addEventListener('pointermove', handlePointerMove)
    return () => window.removeEventListener('pointermove', handlePointerMove)
  }, [handlePointerMove, mobile])

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const t = clock.getElapsedTime()
    const pos = meshRef.current.geometry.attributes.position
    const arr = pos.array
    const colors = meshRef.current.geometry.attributes.color.array
    const px = pointer.current.x
    const pz = pointer.current.z

    for (let i = 0; i < arr.length; i += 3) {
      const bx = basePositions[i]
      const bz = basePositions[i + 2]

      // Stronger breathing (0.25 amplitude)
      let y = Math.sin(bx * 0.5 + t * 0.3) * 0.25
            + Math.cos(bz * 0.3 + t * 0.2) * 0.15

      // Cursor proximity (desktop only)
      if (!mobile) {
        const dx = bx - px
        const dz = bz - pz
        const dist2 = dx * dx + dz * dz
        const radius2 = 4
        y += 0.35 * Math.exp(-dist2 / radius2)
      }

      arr[i + 1] = y

      // Vertex color with temporal shift
      const norm = (y + 0.4) / 0.9
      const timeShift = Math.sin(t * 0.1 + bx * 0.3) * 0.15 + 0.5
      let col
      if (norm < timeShift) {
        col = lerp3(ACCENT, GREEN, norm / timeShift)
      } else {
        col = lerp3(GREEN, WARM, (norm - timeShift) / (1 - timeShift))
      }
      colors[i] = col[0]
      colors[i + 1] = col[1]
      colors[i + 2] = col[2]
    }

    pos.needsUpdate = true
    meshRef.current.geometry.attributes.color.needsUpdate = true

    if (wireRef.current) {
      const wPos = wireRef.current.geometry.attributes.position
      wPos.array.set(arr)
      wPos.needsUpdate = true
    }
  })

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(width, height, segX, segZ)
    geo.rotateX(-Math.PI / 2)
    const count = geo.attributes.position.count
    const col = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      col[i * 3] = ACCENT[0]; col[i * 3 + 1] = ACCENT[1]; col[i * 3 + 2] = ACCENT[2]
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
    return geo
  }, [segX, segZ])

  const wireGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(width, height, segX, segZ)
    geo.rotateX(-Math.PI / 2)
    return geo
  }, [segX, segZ])

  return (
    <>
      <mesh ref={meshRef} geometry={geometry}>
        <meshBasicMaterial vertexColors transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={wireRef} geometry={wireGeometry}>
        <meshBasicMaterial wireframe transparent opacity={0.04} color="#1a2a28" />
      </mesh>
    </>
  )
}

export default function TopologicalMesh() {
  const mobile = useIsMobile()

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 0,
      pointerEvents: 'none',
    }}>
      <Canvas
        orthographic
        camera={{ zoom: 80, position: [0, 8, 6], near: 0.1, far: 100 }}
        style={{ pointerEvents: 'none' }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.5]}
      >
        <MeshSurface mobile={mobile} />
        <Particles mobile={mobile} />
        {!mobile && <FlowLines />}
      </Canvas>
    </div>
  )
}
