import { useRef, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PointerLockControls, Text, Stars, Billboard } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import Chamber from './Chamber'

/**
 * WASD + mouse-look movement system.
 * Slightly slower pace for a contemplative walkthrough.
 * Gentle head bob while moving for immersion.
 */
function MovementSystem({ controlsRef }) {
  const keys = useRef({})
  const bobPhase = useRef(0)

  useEffect(() => {
    const down = (e) => { keys.current[e.code] = true }
    const up = (e) => { keys.current[e.code] = false }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  useFrame((state, delta) => {
    const controls = controlsRef.current
    if (!controls || !controls.isLocked) return

    const camera = state.camera
    const direction = new THREE.Vector3()
    const right = new THREE.Vector3()

    camera.getWorldDirection(direction)
    direction.y = 0
    direction.normalize()
    right.crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize()

    const speed = 8 * delta
    let moving = false

    if (keys.current['KeyW'] || keys.current['ArrowUp']) {
      camera.position.addScaledVector(direction, speed)
      moving = true
    }
    if (keys.current['KeyS'] || keys.current['ArrowDown']) {
      camera.position.addScaledVector(direction, -speed)
      moving = true
    }
    if (keys.current['KeyA'] || keys.current['ArrowLeft']) {
      camera.position.addScaledVector(right, -speed)
      moving = true
    }
    if (keys.current['KeyD'] || keys.current['ArrowRight']) {
      camera.position.addScaledVector(right, speed)
      moving = true
    }

    // Gentle head bob while walking
    if (moving) {
      bobPhase.current += delta * 8
      camera.position.y = 2.5 + Math.sin(bobPhase.current) * 0.06
    } else {
      bobPhase.current = 0
      camera.position.y = 2.5
    }
  })

  return null
}

/**
 * Wall mesh — dark stone for nighttime.
 */
function Wall({ position, size, color = '#3a3850' }) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.8} metalness={0.1} />
    </mesh>
  )
}

/**
 * Glowing floor runner light — a small emissive orb on the ground.
 * These line the center of corridors to guide the player forward.
 */
function FloorLight({ position, color = '#4466aa' }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.06, 0]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2.0}
          toneMapped={false}
        />
      </mesh>
      {/* Soft glow circle on the floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.6, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
          transparent
          opacity={0.25}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}

/**
 * A line of floor runner lights along a path.
 */
function FloorRunnerLights({ fromZ, toZ, spacing = 4, color = '#4466aa' }) {
  const lights = []
  for (let z = fromZ + spacing / 2; z < toZ; z += spacing) {
    lights.push(<FloorLight key={z} position={[0, 0, z]} color={color} />)
  }
  return <group>{lights}</group>
}

/**
 * Glowing doorway trim — emissive strips around a door frame
 * to make transitions feel intentional.
 */
function DoorwayGlow({ position, width = 12, height = 6, color = '#4466aa' }) {
  return (
    <group position={position}>
      {/* Left pillar glow strip */}
      <mesh position={[-width / 2, height / 2, 0]}>
        <boxGeometry args={[0.15, height, 0.15]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.2}
          toneMapped={false}
        />
      </mesh>
      {/* Right pillar glow strip */}
      <mesh position={[width / 2, height / 2, 0]}>
        <boxGeometry args={[0.15, height, 0.15]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.2}
          toneMapped={false}
        />
      </mesh>
      {/* Top beam glow strip */}
      <mesh position={[0, height + 0.1, 0]}>
        <boxGeometry args={[width, 0.15, 0.15]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.2}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}

/**
 * Corridor — stone hallway with guiding floor lights.
 */
function Corridor({ fromZ, toZ, width = 12, wallHeight = 6, wallColor = '#353348' }) {
  const length = toZ - fromZ
  const centerZ = (fromZ + toZ) / 2
  const hw = width / 2

  return (
    <group>
      {/* Floor — dark polished stone */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, centerZ]}>
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial color="#252236" roughness={0.65} metalness={0.15} />
      </mesh>

      {/* Subtle center line on the floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, centerZ]}>
        <planeGeometry args={[0.3, length]} />
        <meshStandardMaterial
          color="#3a3860"
          emissive="#334488"
          emissiveIntensity={0.3}
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* Left wall */}
      <Wall
        position={[-(hw + 0.25), wallHeight / 2, centerZ]}
        size={[0.5, wallHeight, length]}
        color={wallColor}
      />

      {/* Right wall */}
      <Wall
        position={[(hw + 0.25), wallHeight / 2, centerZ]}
        size={[0.5, wallHeight, length]}
        color={wallColor}
      />

      {/* Corridor ceiling lights */}
      <pointLight position={[0, wallHeight - 1, centerZ - length * 0.25]} color="#aabbdd" intensity={1.2} distance={30} />
      <pointLight position={[0, wallHeight - 1, centerZ + length * 0.25]} color="#aabbdd" intensity={1.2} distance={30} />

      {/* Floor runner lights — guide the player forward */}
      <FloorRunnerLights fromZ={fromZ} toZ={toZ} spacing={3.5} color="#4466aa" />
    </group>
  )
}

/**
 * Grand entrance — the player's first view.
 *
 * Design principle: The title floats above a grand archway.
 * Warm light spills from inside, drawing the player in.
 * No instructions in the 3D world — the HUD overlay handles that.
 */
function Entrance({ position, title, entranceLen }) {
  return (
    <group position={position}>
      {/* ── GRAND ARCHWAY PILLARS ── */}
      {/* Left pillar — taller, grander */}
      <Wall position={[-6, 4.5, 0]} size={[1.6, 9, 1.6]} color="#303040" />
      <Wall position={[-6, 9.2, 0]} size={[2.0, 0.4, 2.0]} color="#383848" />
      {/* Right pillar */}
      <Wall position={[6, 4.5, 0]} size={[1.6, 9, 1.6]} color="#303040" />
      <Wall position={[6, 9.2, 0]} size={[2.0, 0.4, 2.0]} color="#383848" />

      {/* Arch beam — wide stone lintel */}
      <Wall position={[0, 9.5, 0]} size={[14, 0.8, 1.6]} color="#383848" />
      <Wall position={[0, 10.1, 0]} size={[13, 0.4, 1.4]} color="#404058" />

      {/* ── TITLE — floating above the arch, grand and luminous ── */}
      <Billboard position={[0, 12.5, 2]}>
        <Text
          fontSize={1.4}
          color="#d0ddff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.06}
          outlineColor="#0a0a1a"
          letterSpacing={0.08}
        >
          {title}
        </Text>
      </Billboard>

      {/* Subtle glow behind the title */}
      <pointLight position={[0, 12, 1]} color="#6677bb" intensity={1.5} distance={20} />

      {/* ── DOORWAY GLOW — emissive trim inviting you in ── */}
      <DoorwayGlow position={[0, 0, 0]} width={12} height={9} color="#4466aa" />

      {/* ── WARM LIGHT spilling from inside — draws the eye forward ── */}
      <pointLight position={[0, 4, 5]} color="#8899cc" intensity={2.0} distance={25} />
      <pointLight position={[0, 2, 3]} color="#667799" intensity={1.0} distance={15} />

      {/* ── FLOOR RUNNER LIGHTS through the entrance corridor ── */}
      <FloorRunnerLights fromZ={1} toZ={entranceLen} spacing={3} color="#4466aa" />
    </group>
  )
}

/**
 * Floating dust particles that drift gently through the moonlight.
 */
function FloatingParticles({ count = 80 }) {
  const meshRef = useRef()
  const particleData = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const speeds = []
    const phases = []
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100
      positions[i * 3 + 1] = Math.random() * 8 + 0.5
      positions[i * 3 + 2] = Math.random() * 200
      speeds.push(0.1 + Math.random() * 0.3)
      phases.push(Math.random() * Math.PI * 2)
    }
    return { positions, speeds, phases }
  }, [count])

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime
    const posArr = meshRef.current.geometry.attributes.position.array
    for (let i = 0; i < count; i++) {
      const sp = particleData.speeds[i]
      const ph = particleData.phases[i]
      posArr[i * 3] += Math.sin(t * sp + ph) * 0.003
      posArr[i * 3 + 1] += Math.sin(t * sp * 0.7 + ph) * 0.002
      posArr[i * 3 + 2] += Math.cos(t * sp * 0.5 + ph) * 0.003
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={particleData.positions}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#aabbdd"
        size={0.12}
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

/**
 * "Next →" arrow hint floating near chamber exits.
 * Gently bobs and glows to guide exploration.
 */
function NextArrow({ position }) {
  const ref = useRef()
  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime
      ref.current.position.y = 3.5 + Math.sin(t * 1.5) * 0.3
    }
  })
  return (
    <group ref={ref} position={position}>
      <Billboard>
        <Text
          fontSize={0.8}
          color="#6688bb"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.03}
          outlineColor="#0a0a1a"
          fillOpacity={0.6}
        >
          {'→'}
        </Text>
      </Billboard>
    </group>
  )
}

/**
 * CameraTracker — reports the camera Z position back to the parent
 * so the HUD can display the current chamber.
 */
function CameraTracker({ chamberCenters, chamberSize, onChamberChange }) {
  const lastChamber = useRef(-1)
  useFrame((state) => {
    const z = state.camera.position.z
    let current = -1
    for (let i = 0; i < chamberCenters.length; i++) {
      const start = chamberCenters[i] - chamberSize / 2
      const end = chamberCenters[i] + chamberSize / 2
      if (z >= start && z <= end) {
        current = i
        break
      }
    }
    if (current !== lastChamber.current) {
      lastChamber.current = current
      if (onChamberChange) onChamberChange(current)
    }
  })
  return null
}

/**
 * The main palace scene — NIGHTTIME with moonlight.
 *
 * UX principles:
 * - Player spawns facing the entrance, looking slightly up at the title
 * - Floor runner lights guide them forward at all times
 * - Doorway glows mark transitions between spaces
 * - Chamber names float inside rooms, visible as you enter
 * - "Next →" arrows near exits guide exploration
 * - No text requires looking backward — everything is ahead
 */
export default function Palace({
  palaceData,
  reviewMode,
  revealedConcepts,
  onConceptHover,
  onConceptClick,
  onLockChange,
  onChamberChange,
}) {
  const controlsRef = useRef()
  const chambers = palaceData.rooms || []

  // Layout constants
  const chamberSize = 48
  const corridorLen = 24
  const entranceLen = 16
  const wallHeight = 6

  const stride = chamberSize + corridorLen
  const chamberCenters = chambers.map(
    (_, i) => entranceLen + chamberSize / 2 + i * stride
  )

  const totalLength = chambers.length > 0
    ? chamberCenters[chambers.length - 1] + chamberSize / 2 + 30
    : 80

  return (
    <Canvas
      camera={{
        fov: 70,
        near: 0.1,
        far: 600,
        position: [0, 2.5, -8],
      }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 2.4,
      }}
      onCreated={({ gl, camera }) => {
        gl.setClearColor('#0c1020')
        // Look slightly up at the entrance title — the first thing you see
        camera.lookAt(0, 5, 6)
      }}
    >
      {/* ── NIGHTTIME LIGHTING ───────────────────────────── */}
      <ambientLight intensity={0.6} color="#8899bb" />

      <directionalLight
        position={[-40, 80, 30]}
        intensity={1.4}
        color="#b0c4e8"
      />

      <directionalLight
        position={[30, 60, -20]}
        intensity={0.5}
        color="#8899bb"
      />

      <hemisphereLight args={['#6677aa', '#1a1420', 0.4]} />

      {/* ── STARS ────────────────────────────────────────── */}
      <Stars
        radius={200}
        depth={80}
        count={3000}
        factor={4}
        saturation={0.2}
        fade
        speed={0.5}
      />

      {/* ── NIGHT FOG ─────────────────────────────────────── */}
      <fog attach="fog" args={['#0e1428', 80, 280]} />

      {/* ── GROUND PLANE ──────────────────────────────────── */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.02, totalLength / 2]}
      >
        <planeGeometry args={[300, totalLength + 80]} />
        <meshStandardMaterial color="#141828" roughness={0.85} metalness={0.1} />
      </mesh>

      {/* ── ENTRANCE — grand gate with floating title ────── */}
      <Entrance
        position={[0, 0, 0]}
        title={palaceData.theme || 'Your Memory Palace'}
        entranceLen={entranceLen}
      />

      {/* ── ENTRANCE CORRIDOR (walls only, lights in Entrance) ── */}
      <Corridor fromZ={1} toZ={entranceLen} />

      {/* ── CHAMBERS + CORRIDORS ──────────────────────────── */}
      {chambers.map((chamber, i) => {
        const centerZ = chamberCenters[i]
        const chamberStart = centerZ - chamberSize / 2
        const chamberEnd = centerZ + chamberSize / 2

        return (
          <group key={i}>
            {/* Doorway glow at chamber entrance */}
            <DoorwayGlow
              position={[0, 0, chamberStart]}
              width={12}
              height={wallHeight}
              color={chamber.concepts?.[0]?.lights?.[0]?.color || '#4466aa'}
            />

            <Chamber
              chamber={chamber}
              index={i}
              centerZ={centerZ}
              chamberSize={chamberSize}
              wallHeight={wallHeight}
              reviewMode={reviewMode}
              revealedConcepts={revealedConcepts}
              onConceptHover={onConceptHover}
              onConceptClick={onConceptClick}
            />

            {/* Doorway glow at chamber exit */}
            <DoorwayGlow
              position={[0, 0, chamberEnd]}
              width={12}
              height={wallHeight}
              color={chamber.concepts?.[chamber.concepts.length - 1]?.lights?.[0]?.color || '#4466aa'}
            />

            {/* "Next →" arrow hint near exit doorway */}
            {i < chambers.length - 1 && (
              <NextArrow position={[0, 3.5, chamberEnd - 3]} />
            )}

            {i < chambers.length - 1 && (
              <Corridor
                fromZ={chamberEnd}
                toZ={chamberCenters[i + 1] - chamberSize / 2}
              />
            )}
          </group>
        )
      })}

      {/* ── END MARKER — glowing circle at the end of the palace ── */}
      {chambers.length > 0 && (() => {
        const lastEnd = chamberCenters[chambers.length - 1] + chamberSize / 2
        return (
          <group position={[0, 0, lastEnd + 12]}>
            {/* Glowing end circle on the floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
              <circleGeometry args={[5, 32]} />
              <meshStandardMaterial
                color="#44cc88"
                emissive="#44cc88"
                emissiveIntensity={1.0}
                roughness={0.3}
                transparent
                opacity={0.25}
                toneMapped={false}
              />
            </mesh>
            <Billboard position={[0, 3, 0]}>
              <Text
                fontSize={0.9}
                color="#44cc88"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.04}
                outlineColor="#0a0a1a"
                fillOpacity={0.7}
              >
                {"Cycle Complete ✦"}
              </Text>
            </Billboard>
            <pointLight position={[0, 2, 0]} color="#44cc88" intensity={2.0} distance={20} />
          </group>
        )
      })()}

      {/* ── BLOOM POST-PROCESSING ──────────────────────────── */}
      <EffectComposer multisampling={0}>
        <Bloom
          luminanceThreshold={0.6}
          luminanceSmoothing={0.7}
          intensity={0.6}
          radius={0.4}
          levels={3}
          mipmapBlur
        />
      </EffectComposer>

      {/* ── FLOATING DUST PARTICLES ────────────────────────── */}
      <FloatingParticles count={80} />

      {/* ── CAMERA TRACKER — reports current chamber to HUD ── */}
      <CameraTracker
        chamberCenters={chamberCenters}
        chamberSize={chamberSize}
        onChamberChange={onChamberChange}
      />

      {/* ── CONTROLS ─────────────────────────────────────── */}
      <PointerLockControls
        ref={controlsRef}
        onChange={() => {
          if (onLockChange) {
            onLockChange(controlsRef.current?.isLocked || false)
          }
        }}
      />
      <MovementSystem controlsRef={controlsRef} />
    </Canvas>
  )
}
