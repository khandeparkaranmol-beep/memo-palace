import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import VoxelObject from './VoxelObject'

/**
 * Wall mesh — dark stone.
 */
function Wall({ position, size, color }) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.7} metalness={0.15} />
    </mesh>
  )
}

/**
 * Glowing ground marker at each locus.
 */
function LocusMarker({ position, color, number }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[position[0], 0.03, position[2]]}>
        <circleGeometry args={[3.5, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
          roughness={0.5}
          transparent
          opacity={0.35}
        />
      </mesh>

      <Text
        position={[position[0], 0.05, position[2]]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={1.8}
        color={color}
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.2}
      >
        {String(number)}
      </Text>
    </group>
  )
}

/**
 * Chamber — moonlit room where glowing objects are the visual stars.
 *
 * UX design:
 * - Chamber name floats INSIDE the room, just past the entrance doorway,
 *   so the player reads it naturally as they walk in (no looking back).
 * - Floor runner lights along the center path guide your eyes forward.
 * - Objects in corners with colored light pools draw exploration.
 * - A subtle "next →" indicator near the exit doorway hints where to go.
 */
export default function Chamber({
  chamber,
  index,
  centerZ,
  chamberSize,
  wallHeight = 6,
  reviewMode,
  revealedConcepts,
  onConceptHover,
  onConceptClick,
}) {
  const {
    name = `Chamber ${index + 1}`,
    wallColor = '#2a2833',
    floorColor = '#1a1822',
    accentColor = '#445566',
    concepts = [],
  } = chamber

  const half = chamberSize / 2
  const wallT = 0.5
  const doorW = 12
  const segLen = (chamberSize - doorW) / 2

  return (
    <group position={[0, 0, centerZ]}>

      {/* ── FLOOR ────────────────────────────────────────── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[chamberSize, chamberSize]} />
        <meshStandardMaterial color={floorColor} roughness={0.5} metalness={0.25} />
      </mesh>

      {/* Floor border glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[half - 1.5, half - 0.5, 4]} />
        <meshStandardMaterial
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={0.1}
          roughness={0.5}
          transparent
          opacity={0.15}
        />
      </mesh>

      {/* Center path line — subtle guide through the room */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <planeGeometry args={[0.3, chamberSize]} />
        <meshStandardMaterial
          color="#3a3860"
          emissive="#334488"
          emissiveIntensity={0.3}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* ── WALLS ────────────────────────────────────────── */}
      {/* North wall with doorway */}
      <Wall position={[-(segLen / 2 + doorW / 2), wallHeight / 2, -half]} size={[segLen, wallHeight, wallT]} color={wallColor} />
      <Wall position={[(segLen / 2 + doorW / 2), wallHeight / 2, -half]} size={[segLen, wallHeight, wallT]} color={wallColor} />

      {/* South wall with doorway */}
      <Wall position={[-(segLen / 2 + doorW / 2), wallHeight / 2, half]} size={[segLen, wallHeight, wallT]} color={wallColor} />
      <Wall position={[(segLen / 2 + doorW / 2), wallHeight / 2, half]} size={[segLen, wallHeight, wallT]} color={wallColor} />

      {/* East wall */}
      <Wall position={[half, wallHeight / 2, 0]} size={[wallT, wallHeight, chamberSize]} color={wallColor} />

      {/* West wall */}
      <Wall position={[-half, wallHeight / 2, 0]} size={[wallT, wallHeight, chamberSize]} color={wallColor} />

      {/* ── CHAMBER NAME — small plaque above the entrance doorway ── */}
      {/* Sits just above the door frame, like an engraved sign */}
      <Billboard position={[0, wallHeight + 0.8, -half + 0.5]}>
        <Text
          fontSize={0.45}
          color="#7788aa"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.03}
          outlineColor="#0a0a1a"
          letterSpacing={0.06}
          fillOpacity={0.7}
        >
          {name}
        </Text>
      </Billboard>

      {/* ── CHAMBER AMBIENT LIGHT ────────────────────────── */}
      <pointLight position={[0, wallHeight - 0.5, 0]} color="#8899bb" intensity={2.0} distance={60} />

      {/* ── LOCI — glowing objects in CORNERS ────────────── */}
      {concepts.map((concept, ci) => {
        const conceptId = `${index}-${ci}`
        const isRevealed = revealedConcepts.has(conceptId)
        const cx = concept.position?.x || 0
        const cz = concept.position?.z || 0
        const glowColor = concept.lights?.[0]?.color || '#ffffff'

        // Calculate label height dynamically based on the tallest voxel
        // Objects are rendered at 0.7 scale, so multiply max voxel Y by 0.7
        const voxels = concept.voxels || []
        const maxVoxelY = voxels.reduce((max, v) => Math.max(max, v.y || 0), 0)
        const scaledMaxY = maxVoxelY * 0.7
        // Place label 2.5 units above the tallest point, minimum 12
        const labelY = Math.max(12, scaledMaxY + 2.5)

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
            {/* Ground marker */}
            <LocusMarker
              position={[cx, 0, cz]}
              color={accentColor}
              number={ci + 1}
            />

            {/* Glowing light pool on the floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.04, cz]}>
              <circleGeometry args={[8, 32]} />
              <meshStandardMaterial
                color={glowColor}
                emissive={glowColor}
                emissiveIntensity={1.5}
                roughness={0.3}
                transparent
                opacity={0.3}
                toneMapped={false}
              />
            </mesh>

            {/* Outer soft glow ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.03, cz]}>
              <ringGeometry args={[7, 11, 32]} />
              <meshStandardMaterial
                color={glowColor}
                emissive={glowColor}
                emissiveIntensity={0.6}
                roughness={0.5}
                transparent
                opacity={0.12}
                toneMapped={false}
              />
            </mesh>

            {/* Colored spotlight */}
            <pointLight
              position={[cx, 3, cz]}
              color={glowColor}
              intensity={5.0}
              distance={35}
            />

            {/* Voxel object */}
            <group position={[cx, 0, cz]} scale={[0.7, 0.7, 0.7]}>
              <VoxelObject
                concept={{ ...concept, position: { x: 0, y: 0, z: 0 } }}
                reviewMode={reviewMode}
                isRevealed={isRevealed}
              />
            </group>

            {/* Billboard label — positioned dynamically above tallest voxel */}
            {(!reviewMode || isRevealed) && (
              <Billboard position={[cx, labelY, cz]}>
                <Text
                  fontSize={0.7}
                  color={isRevealed ? '#44ffaa' : '#c0d8ff'}
                  anchorX="center"
                  anchorY="middle"
                  outlineWidth={0.04}
                  outlineColor="#000011"
                >
                  {concept.label}
                </Text>
              </Billboard>
            )}

            {/* Review mode "?" */}
            {reviewMode && !isRevealed && (
              <Billboard position={[cx, labelY, cz]}>
                <Text
                  fontSize={1.2}
                  color="#ff4466"
                  anchorX="center"
                  anchorY="middle"
                  outlineWidth={0.04}
                  outlineColor="#000011"
                >
                  ?
                </Text>
              </Billboard>
            )}
          </group>
        )
      })}
    </group>
  )
}
