import { useMemo } from 'react'
import * as THREE from 'three'
import { Text } from '@react-three/drei'
import VoxelObject from './VoxelObject'

const WALL_HEIGHT = 6
const WALL_THICKNESS = 0.3
const DOOR_WIDTH = 3
const DOOR_HEIGHT = 4

/**
 * Renders a single room: floor, walls with doorways, concept objects, labels.
 */
export default function Room({
  room,
  index,
  totalRooms,
  reviewMode,
  revealedConcepts,
  onConceptHover,
  onConceptClick,
}) {
  const {
    name = 'Room',
    description = '',
    position = { x: 0, z: 0 },
    size = { width: 12, depth: 12 },
    floorColor = '#222244',
    wallColor = '#2a2a44',
    concepts = [],
  } = room

  const roomX = position.x || 0
  const roomZ = position.z || index * 18
  const w = size.width || 12
  const d = size.depth || 12

  // Create wall geometry with a doorway cutout
  const wallWithDoor = useMemo(() => {
    const shape = new THREE.Shape()
    // Full wall
    shape.moveTo(-w / 2, 0)
    shape.lineTo(w / 2, 0)
    shape.lineTo(w / 2, WALL_HEIGHT)
    shape.lineTo(-w / 2, WALL_HEIGHT)
    shape.lineTo(-w / 2, 0)

    // Door hole
    const hole = new THREE.Path()
    hole.moveTo(-DOOR_WIDTH / 2, 0)
    hole.lineTo(DOOR_WIDTH / 2, 0)
    hole.lineTo(DOOR_WIDTH / 2, DOOR_HEIGHT)
    hole.lineTo(-DOOR_WIDTH / 2, DOOR_HEIGHT)
    hole.lineTo(-DOOR_WIDTH / 2, 0)
    shape.holes.push(hole)

    return new THREE.ExtrudeGeometry(shape, {
      depth: WALL_THICKNESS,
      bevelEnabled: false,
    })
  }, [w])

  // Solid wall (no door) for sides and back
  const solidWall = useMemo(() => {
    return new THREE.BoxGeometry(WALL_THICKNESS, WALL_HEIGHT, d)
  }, [d])

  return (
    <group position={[roomX, 0, roomZ]}>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color={floorColor} roughness={0.8} metalness={0.2} />
      </mesh>

      {/* Ceiling (subtle, slightly lighter) */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, WALL_HEIGHT, 0]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#1a1a33" roughness={0.9} />
      </mesh>

      {/* Left wall */}
      <mesh position={[-w / 2, WALL_HEIGHT / 2, 0]}>
        <primitive object={solidWall.clone()} />
        <meshStandardMaterial color={wallColor} roughness={0.7} />
      </mesh>

      {/* Right wall */}
      <mesh position={[w / 2, WALL_HEIGHT / 2, 0]}>
        <primitive object={solidWall.clone()} />
        <meshStandardMaterial color={wallColor} roughness={0.7} />
      </mesh>

      {/* Front wall with door (unless first room) */}
      {index > 0 ? (
        <mesh position={[0, 0, -d / 2]} rotation={[0, 0, 0]}>
          <primitive object={wallWithDoor.clone()} />
          <meshStandardMaterial color={wallColor} roughness={0.7} side={THREE.DoubleSide} />
        </mesh>
      ) : (
        // First room: open entrance on front
        <mesh position={[0, 0, -d / 2]} rotation={[0, 0, 0]}>
          <primitive object={wallWithDoor.clone()} />
          <meshStandardMaterial color={wallColor} roughness={0.7} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Back wall with door (unless last room) */}
      {index < totalRooms - 1 ? (
        <mesh position={[0, 0, d / 2]} rotation={[0, Math.PI, 0]}>
          <primitive object={wallWithDoor.clone()} />
          <meshStandardMaterial color={wallColor} roughness={0.7} side={THREE.DoubleSide} />
        </mesh>
      ) : (
        // Last room: solid back wall
        <mesh position={[0, WALL_HEIGHT / 2, d / 2]}>
          <boxGeometry args={[w, WALL_HEIGHT, WALL_THICKNESS]} />
          <meshStandardMaterial color={wallColor} roughness={0.7} />
        </mesh>
      )}

      {/* Room ambient light */}
      <pointLight
        position={[0, WALL_HEIGHT - 1, 0]}
        color="#8888aa"
        intensity={0.4}
        distance={20}
      />

      {/* Room name floating text */}
      <Text
        position={[0, WALL_HEIGHT - 0.5, -d / 2 + 0.5]}
        fontSize={0.5}
        color="#7c83ff"
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {name}
      </Text>

      {/* Concept voxel objects */}
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

            {/* Floating label above object (hidden in review mode unless revealed) */}
            {(!reviewMode || isRevealed) && (
              <Text
                position={[
                  concept.position?.x || 0,
                  8,
                  concept.position?.z || 0,
                ]}
                fontSize={0.4}
                color={isRevealed ? '#44cc88' : '#ffffff'}
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.02}
                outlineColor="#000000"
              >
                {concept.label}
              </Text>
            )}

            {/* In review mode, show "?" when not revealed */}
            {reviewMode && !isRevealed && (
              <Text
                position={[
                  concept.position?.x || 0,
                  8,
                  concept.position?.z || 0,
                ]}
                fontSize={0.7}
                color="#ff4466"
                anchorX="center"
                anchorY="middle"
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
