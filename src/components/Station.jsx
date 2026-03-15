import { Text } from '@react-three/drei'
import VoxelObject from './VoxelObject'

/**
 * A Station is an open-air landmark along the path.
 * Instead of enclosed rooms, each station is a distinct area with:
 * - A circular ground platform (stone, grass, wood — themed)
 * - A station marker (glowing pillar or post)
 * - The voxel concept objects placed around the platform
 * - Floating station name
 */
export default function Station({
  station,
  index,
  reviewMode,
  revealedConcepts,
  onConceptHover,
  onConceptClick,
}) {
  const {
    name = `Station ${index + 1}`,
    description = '',
    position = { x: 0, z: 0 },
    platformColor = '#4a5a4a',
    platformAccent = '#7c83ff',
    concepts = [],
  } = station

  const sx = position.x || 0
  const sz = position.z || index * 22

  return (
    <group position={[sx, 0, sz]}>

      {/* ── Circular ground platform ──────────────────────── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <circleGeometry args={[8, 32]} />
        <meshStandardMaterial
          color={platformColor}
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>

      {/* Platform rim — a subtle ring to define the area */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[7.5, 8.2, 32]} />
        <meshStandardMaterial
          color={platformAccent}
          emissive={platformAccent}
          emissiveIntensity={0.4}
          roughness={0.5}
        />
      </mesh>

      {/* ── Station marker pillar (glowing, visible from distance) ─ */}
      <mesh position={[0, 3.5, 0]}>
        <cylinderGeometry args={[0.15, 0.2, 7, 8]} />
        <meshStandardMaterial
          color="#667788"
          roughness={0.4}
          metalness={0.6}
        />
      </mesh>

      {/* Marker top glow */}
      <mesh position={[0, 7.2, 0]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial
          color={platformAccent}
          emissive={platformAccent}
          emissiveIntensity={2.5}
          roughness={0.2}
        />
      </mesh>

      {/* Marker light — illuminates the station */}
      <pointLight
        position={[0, 7.5, 0]}
        color={platformAccent}
        intensity={1.5}
        distance={20}
      />

      {/* Station area light — makes everything clearly visible */}
      <pointLight
        position={[0, 10, 0]}
        color="#ffffff"
        intensity={0.8}
        distance={25}
      />

      {/* ── Station name — floating above the marker ───── */}
      <Text
        position={[0, 8.5, 0]}
        fontSize={0.7}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.04}
        outlineColor="#000000"
        maxWidth={10}
      >
        {name}
      </Text>

      {/* Station description (smaller, below name) */}
      {description && (
        <Text
          position={[0, 7.9, 0]}
          fontSize={0.3}
          color="#aaaacc"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
          maxWidth={12}
        >
          {description}
        </Text>
      )}

      {/* ── Number marker on the ground ────────────────── */}
      <Text
        position={[0, 0.06, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={2.5}
        color={platformAccent}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
        fillOpacity={0.2}
      >
        {String(index + 1)}
      </Text>

      {/* ── Concept voxel objects ─────────────────────── */}
      {concepts.map((concept, ci) => {
        const conceptId = `${index}-${ci}`
        const isRevealed = revealedConcepts.has(conceptId)

        return (
          <group
            key={ci}
            onClick={(e) => {
              e.stopPropagation()
              onConceptClick(conceptId, concept)
            }}
            onPointerOver={(e) => {
              e.stopPropagation()
              onConceptHover(concept)
              document.body.style.cursor = 'pointer'
            }}
            onPointerOut={(e) => {
              e.stopPropagation()
              onConceptHover(null)
              document.body.style.cursor = 'default'
            }}
          >
            <VoxelObject
              concept={concept}
              reviewMode={reviewMode}
              isRevealed={isRevealed}
            />

            {/* Floating label above object */}
            {(!reviewMode || isRevealed) && (
              <Text
                position={[
                  concept.position?.x || 0,
                  10,
                  concept.position?.z || 0,
                ]}
                fontSize={0.5}
                color={isRevealed ? '#44cc88' : '#ffffff'}
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.03}
                outlineColor="#000000"
              >
                {concept.label}
              </Text>
            )}

            {/* Review mode: "?" when not revealed */}
            {reviewMode && !isRevealed && (
              <Text
                position={[
                  concept.position?.x || 0,
                  10,
                  concept.position?.z || 0,
                ]}
                fontSize={0.9}
                color="#ff4466"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.03}
                outlineColor="#000000"
              >
                ?
              </Text>
            )}
          </group>
        )
      })}
    </group>
  )
}
