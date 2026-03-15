import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const VOXEL_SIZE = 0.85
const boxGeo = new THREE.BoxGeometry(VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE)

/**
 * Renders a single concept's voxel model.
 * Solid voxels are merged into one mesh for performance.
 * Emissive voxels are individual meshes (each needs its own material for glow + animation).
 */
export default function VoxelObject({ concept, reviewMode, isRevealed }) {
  const groupRef = useRef()
  const emissiveRefs = useRef([])
  const { voxels = [], position = { x: 0, y: 0, z: 0 } } = concept

  // Split voxels into solid vs emissive
  const { solidVoxels, emissiveVoxels } = useMemo(() => {
    const solid = []
    const emissive = []
    voxels.forEach(v => {
      if (v.emissive) emissive.push(v)
      else solid.push(v)
    })
    return { solidVoxels: solid, emissiveVoxels: emissive }
  }, [voxels])

  // Calculate center offset for the voxel group
  // NOTE: We only center on X and Z. Y is NOT centered so objects
  // sit on the ground — voxels at y=0 render at ground level.
  const center = useMemo(() => {
    if (voxels.length === 0) return { x: 0, y: 0, z: 0 }
    let cx = 0, cz = 0
    voxels.forEach(v => { cx += v.x; cz += v.z })
    return { x: cx / voxels.length, y: 0, z: cz / voxels.length }
  }, [voxels])

  // Build merged geometry for solid voxels
  const solidMesh = useMemo(() => {
    if (solidVoxels.length === 0) return null

    const positions = []
    const normals = []
    const colors = []
    const indices = []
    const basePos = boxGeo.attributes.position.array
    const baseNorm = boxGeo.attributes.normal.array
    const baseIdx = boxGeo.index.array
    const vpb = basePos.length / 3
    const tc = new THREE.Color()

    solidVoxels.forEach((voxel, i) => {
      tc.set(voxel.color)
      // Slight variation for visual richness
      const v = (Math.random() - 0.5) * 0.05
      tc.r = Math.max(0, Math.min(1, tc.r + v))
      tc.g = Math.max(0, Math.min(1, tc.g + v))
      tc.b = Math.max(0, Math.min(1, tc.b + v))

      const off = i * vpb
      for (let j = 0; j < vpb; j++) {
        positions.push(
          basePos[j * 3] + voxel.x - center.x,
          basePos[j * 3 + 1] + voxel.y - center.y,
          basePos[j * 3 + 2] + voxel.z - center.z,
        )
        normals.push(baseNorm[j * 3], baseNorm[j * 3 + 1], baseNorm[j * 3 + 2])
        colors.push(tc.r, tc.g, tc.b)
      }
      for (let j = 0; j < baseIdx.length; j++) {
        indices.push(baseIdx[j] + off)
      }
    })

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geo.setIndex(indices)

    return geo
  }, [solidVoxels, center])

  // Store animation data for emissive voxels
  const emissiveData = useMemo(() => {
    return emissiveVoxels.map((v, i) => ({
      phase: ((i * 7 + 3) % 17) / 17 * Math.PI * 2, // deterministic spread
      baseIntensity: v.emissiveIntensity || 1.0,
      animate: v.animate || null,
    }))
  }, [emissiveVoxels])

  // Animate emissive voxels each frame — no Math.random(), purely deterministic
  useFrame((state) => {
    const t = state.clock.elapsedTime

    emissiveRefs.current.forEach((mesh, i) => {
      if (!mesh || !emissiveData[i]) return
      const data = emissiveData[i]
      const phase = t + data.phase

      if (data.animate === 'flicker') {
        // Deterministic flicker using layered sine waves instead of random()
        const flicker = 0.6 + 0.4 * Math.sin(phase * 13.7 + i * 3.1)
        const wave = 0.7 + 0.3 * Math.sin(phase * 8 + Math.sin(phase * 3.7) * 2)
        mesh.material.emissiveIntensity = data.baseIntensity * flicker * wave
        mesh.position.y = (emissiveVoxels[i].y - center.y) + Math.sin(phase * 11 + i) * 0.03
      } else if (data.animate === 'drift') {
        const drift = (phase * 0.4) % 3.5
        mesh.position.y = (emissiveVoxels[i].y - center.y) + drift * 0.5
        mesh.material.emissiveIntensity = data.baseIntensity * Math.max(0.05, 1 - drift / 3.5)
        mesh.position.x = (emissiveVoxels[i].x - center.x) + Math.sin(phase * 1.3) * 0.25
        mesh.position.z = (emissiveVoxels[i].z - center.z) + Math.cos(phase * 1.1) * 0.25
      } else if (data.animate === 'pulse') {
        const pulse = 0.55 + 0.45 * Math.sin(phase * 2.5)
        mesh.material.emissiveIntensity = data.baseIntensity * pulse
      }
    })
  })

  // In review mode and not revealed: dim everything
  const opacity = reviewMode && !isRevealed ? 0.15 : 1.0

  return (
    <group
      ref={groupRef}
      position={[position.x, position.y || 0, position.z]}
    >
      <group scale={opacity < 1 ? [0.8, 0.8, 0.8] : [1, 1, 1]}>
        {/* Solid voxels — merged geometry, polished look */}
        {solidMesh && (
          <mesh geometry={solidMesh}>
            <meshStandardMaterial
              vertexColors
              roughness={0.25}
              metalness={0.2}
              transparent={opacity < 1}
              opacity={opacity}
            />
          </mesh>
        )}

        {/* Emissive voxels — individual meshes for per-voxel glow */}
        {emissiveVoxels.map((voxel, i) => (
          <mesh
            key={i}
            ref={(el) => { emissiveRefs.current[i] = el }}
            position={[
              voxel.x - center.x,
              voxel.y - center.y,
              voxel.z - center.z,
            ]}
            geometry={boxGeo}
          >
            <meshStandardMaterial
              color={voxel.color}
              emissive={voxel.emissive}
              emissiveIntensity={voxel.emissiveIntensity || 1.0}
              roughness={0.15}
              metalness={0.2}
              toneMapped={false}
              transparent={opacity < 1}
              opacity={opacity}
            />
          </mesh>
        ))}

        {/* Point lights removed — Chamber provides per-object lighting */}
      </group>
    </group>
  )
}
