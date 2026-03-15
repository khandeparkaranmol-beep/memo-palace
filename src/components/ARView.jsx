import { useRef, useState, useCallback, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { createXRStore, XR, XROrigin, useXRHitTest, XRDomOverlay, IfInSessionMode } from '@react-three/xr'
import * as THREE from 'three'
import VoxelObject from './VoxelObject'

// ── Reticle: shows where the next object will be placed ──────────
const matHelper = new THREE.Matrix4()
const posHelper = new THREE.Vector3()
const quatHelper = new THREE.Quaternion()
const scaleHelper = new THREE.Vector3()

function PlacementReticle({ onSurfaceFound }) {
  const reticleRef = useRef()
  const foundRef = useRef(false)

  useXRHitTest((results, getWorldMatrix) => {
    if (results.length === 0) {
      foundRef.current = false
      if (reticleRef.current) reticleRef.current.visible = false
      return
    }

    const gotMatrix = getWorldMatrix(matHelper, results[0])
    if (!gotMatrix) return

    matHelper.decompose(posHelper, quatHelper, scaleHelper)

    if (reticleRef.current) {
      reticleRef.current.position.copy(posHelper)
      reticleRef.current.quaternion.copy(quatHelper)
      reticleRef.current.visible = true
    }

    foundRef.current = true
    onSurfaceFound(posHelper.clone(), quatHelper.clone())
  }, 'viewer')

  // Pulsing reticle animation
  useFrame((state) => {
    if (!reticleRef.current || !reticleRef.current.visible) return
    const t = state.clock.elapsedTime
    const pulse = 0.8 + 0.2 * Math.sin(t * 3)
    reticleRef.current.scale.setScalar(pulse)
  })

  return (
    <group ref={reticleRef} visible={false}>
      {/* Outer ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.08, 0.1, 32]} />
        <meshBasicMaterial color="#44cc88" transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>
      {/* Inner dot */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.015, 16]} />
        <meshBasicMaterial color="#88ffbb" transparent opacity={0.9} side={THREE.DoubleSide} />
      </mesh>
      {/* Soft glow circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]}>
        <circleGeometry args={[0.15, 32]} />
        <meshBasicMaterial color="#44cc88" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// ── PlacedObject: a concept that's been placed in AR space ───────
function PlacedObject({ concept, position, quaternion, scale = 0.04 }) {
  const groupRef = useRef()

  return (
    <group ref={groupRef} position={position} quaternion={quaternion}>
      <group scale={[scale, scale, scale]}>
        <VoxelObject
          concept={{ ...concept, position: { x: 0, y: 0, z: 0 } }}
          reviewMode={false}
          isRevealed={true}
        />
      </group>

      {/* Soft ground shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <circleGeometry args={[0.12, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>

      {/* Light for the object */}
      <pointLight
        position={[0, 0.15, 0]}
        color={concept.lights?.[0]?.color || '#ffffff'}
        intensity={0.8}
        distance={0.6}
      />
    </group>
  )
}

// ── ReviewObject: shows "?" until tapped, then reveals ──────────
function ReviewObject({ concept, position, quaternion, scale = 0.04, isRevealed, onReveal }) {
  const groupRef = useRef()

  return (
    <group
      ref={groupRef}
      position={position}
      quaternion={quaternion}
      onClick={(e) => {
        e.stopPropagation()
        if (!isRevealed) onReveal()
      }}
    >
      <group scale={[scale, scale, scale]}>
        <VoxelObject
          concept={{ ...concept, position: { x: 0, y: 0, z: 0 } }}
          reviewMode={!isRevealed}
          isRevealed={isRevealed}
        />
      </group>

      {/* Ground shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <circleGeometry args={[0.12, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>

      <pointLight
        position={[0, 0.15, 0]}
        color={isRevealed ? (concept.lights?.[0]?.color || '#ffffff') : '#ff4466'}
        intensity={isRevealed ? 0.8 : 0.3}
        distance={0.6}
      />
    </group>
  )
}

// ── AR Scene content (inside XR context) ─────────────────────────
function ARScene({ concepts, placedObjects, onPlace, mode, revealedSet, onReveal }) {
  const lastHitRef = useRef({ position: null, quaternion: null })

  const handleSurfaceFound = useCallback((pos, quat) => {
    lastHitRef.current = { position: pos, quaternion: quat }
  }, [])

  const handleTap = useCallback(() => {
    if (mode !== 'placing') return
    if (!lastHitRef.current.position) return
    onPlace(lastHitRef.current.position.clone(), lastHitRef.current.quaternion.clone())
  }, [mode, onPlace])

  return (
    <>
      {/* Ambient light for AR */}
      <ambientLight intensity={1.0} />
      <directionalLight position={[1, 3, 2]} intensity={0.5} />

      <XROrigin>
        {/* Reticle — only visible during placement mode */}
        {mode === 'placing' && (
          <PlacementReticle onSurfaceFound={handleSurfaceFound} />
        )}
      </XROrigin>

      {/* Invisible tap target covering the whole scene */}
      {mode === 'placing' && (
        <mesh
          position={[0, 0, -100]}
          onClick={handleTap}
          visible={false}
        >
          <planeGeometry args={[1000, 1000]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}

      {/* Placed objects */}
      {placedObjects.map((obj, i) => (
        mode === 'review' ? (
          <ReviewObject
            key={i}
            concept={obj.concept}
            position={obj.position}
            quaternion={obj.quaternion}
            isRevealed={revealedSet.has(i)}
            onReveal={() => onReveal(i)}
          />
        ) : (
          <PlacedObject
            key={i}
            concept={obj.concept}
            position={obj.position}
            quaternion={obj.quaternion}
          />
        )
      ))}
    </>
  )
}


// ── Main ARView Component ────────────────────────────────────────
export default function ARView({ palaceData, onBack }) {
  const rooms = palaceData.rooms || []
  const allConcepts = useMemo(() => {
    return rooms.flatMap(room => room.concepts || [])
  }, [rooms])

  // AR state
  const [mode, setMode] = useState('pre-ar')      // 'pre-ar' | 'placing' | 'done' | 'review'
  const [placedObjects, setPlacedObjects] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [revealedSet, setRevealedSet] = useState(new Set())

  // Create XR store with AR features
  const store = useMemo(() => createXRStore({
    offerSession: false,
    hitTest: true,
    domOverlay: true,
    depthSensing: false,
  }), [])

  const currentConcept = allConcepts[currentIndex] || null
  const totalConcepts = allConcepts.length

  const handleEnterAR = useCallback(async () => {
    try {
      await store.enterAR()
      setMode('placing')
    } catch (err) {
      console.error('Failed to enter AR:', err)
      alert('AR is not supported on this device/browser. Try Chrome on Android.')
    }
  }, [store])

  const handlePlace = useCallback((position, quaternion) => {
    if (!currentConcept) return

    setPlacedObjects(prev => [...prev, {
      concept: currentConcept,
      position,
      quaternion,
    }])

    if (currentIndex + 1 >= totalConcepts) {
      setMode('done')
    } else {
      setCurrentIndex(prev => prev + 1)
    }
  }, [currentConcept, currentIndex, totalConcepts])

  const handleStartReview = useCallback(() => {
    setRevealedSet(new Set())
    setMode('review')
  }, [])

  const handleReveal = useCallback((index) => {
    setRevealedSet(prev => {
      const next = new Set(prev)
      next.add(index)
      return next
    })
  }, [])

  const handleReset = useCallback(() => {
    setPlacedObjects([])
    setCurrentIndex(0)
    setRevealedSet(new Set())
    setMode('placing')
  }, [])

  // ── PRE-AR screen (before entering AR) ───────────────────────
  if (mode === 'pre-ar') {
    return (
      <div className="ar-pre-screen">
        <div className="ar-pre-content">
          <div className="ar-pre-icon">📍</div>
          <h1 className="ar-pre-title">{palaceData.theme || 'Memory Palace'}</h1>
          <p className="ar-pre-desc">
            Place <strong>{totalConcepts} memory objects</strong> around your room.
            Walk around later to review them — your real space becomes your memory palace.
          </p>

          <div className="ar-concept-preview">
            <div className="ar-concept-preview-title">Objects you'll place:</div>
            {allConcepts.map((c, i) => (
              <div key={i} className="ar-concept-chip">
                <span className="ar-concept-num">{i + 1}</span>
                {c.label}
              </div>
            ))}
          </div>

          <button className="ar-enter-btn" onClick={handleEnterAR}>
            Enter AR & Start Placing
          </button>
          <button className="ar-back-btn" onClick={onBack}>
            ← Back
          </button>
        </div>
      </div>
    )
  }

  // ── AR Canvas (placing, done, review modes) ──────────────────
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0 }}>
      <Canvas
        gl={{ antialias: true, alpha: true }}
        camera={{ near: 0.01, far: 100 }}
      >
        <XR store={store}>
          <ARScene
            concepts={allConcepts}
            placedObjects={placedObjects}
            onPlace={handlePlace}
            mode={mode}
            revealedSet={revealedSet}
            onReveal={handleReveal}
          />

          {/* DOM Overlay — HUD rendered on top of camera feed */}
          <XRDomOverlay
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
          >
            {/* ── PLACING MODE HUD ── */}
            {mode === 'placing' && currentConcept && (
              <>
                {/* Top bar — progress */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0,
                  padding: '50px 20px 16px',
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)',
                  pointerEvents: 'none',
                }}>
                  <div style={{
                    display: 'flex', gap: 4, marginBottom: 8,
                  }}>
                    {allConcepts.map((_, i) => (
                      <div key={i} style={{
                        flex: 1, height: 3, borderRadius: 2,
                        background: i < currentIndex ? '#44cc88' : i === currentIndex ? '#88ffbb' : 'rgba(255,255,255,0.2)',
                      }} />
                    ))}
                  </div>
                  <div style={{
                    color: '#fff', fontSize: 13, opacity: 0.7,
                    textAlign: 'center',
                  }}>
                    {currentIndex + 1} of {totalConcepts}
                  </div>
                </div>

                {/* Bottom card — current concept */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  padding: '20px 20px 40px',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
                  pointerEvents: 'auto',
                }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: 16,
                    padding: '16px 20px',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}>
                    <div style={{
                      fontSize: 18, fontWeight: 600, color: '#fff',
                      marginBottom: 6,
                    }}>
                      {currentConcept.label}
                    </div>
                    <div style={{
                      fontSize: 13, color: 'rgba(255,255,255,0.6)',
                      lineHeight: 1.4,
                    }}>
                      {currentConcept.association
                        ? currentConcept.association.slice(0, 100) + (currentConcept.association.length > 100 ? '…' : '')
                        : 'Point at a surface and tap to place'
                      }
                    </div>
                    <div style={{
                      marginTop: 12, fontSize: 14, color: '#88ffbb',
                      textAlign: 'center', fontWeight: 500,
                    }}>
                      Point at a surface and tap to place
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── DONE MODE HUD ── */}
            {mode === 'done' && (
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '20px 20px 40px',
                background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
                pointerEvents: 'auto',
              }}>
                <div style={{
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: 16,
                  padding: '20px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>✨</div>
                  <div style={{
                    fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 6,
                  }}>
                    All objects placed!
                  </div>
                  <div style={{
                    fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 16,
                  }}>
                    Walk around your room to see them. Ready to test your memory?
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={handleStartReview}
                      style={{
                        flex: 1, padding: '12px', borderRadius: 10,
                        background: '#44cc88', color: '#000', fontWeight: 600,
                        fontSize: 15, border: 'none', cursor: 'pointer',
                      }}
                    >
                      Start Review
                    </button>
                    <button
                      onClick={handleReset}
                      style={{
                        padding: '12px 16px', borderRadius: 10,
                        background: 'rgba(255,255,255,0.15)', color: '#fff',
                        fontSize: 15, border: 'none', cursor: 'pointer',
                      }}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── REVIEW MODE HUD ── */}
            {mode === 'review' && (
              <>
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0,
                  padding: '50px 20px 16px',
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)',
                  pointerEvents: 'none',
                }}>
                  <div style={{
                    textAlign: 'center', color: '#fff',
                  }}>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                      Review Mode
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.7 }}>
                      Walk to each object and tap to reveal · {revealedSet.size}/{totalConcepts} recalled
                    </div>
                  </div>
                  {/* Progress dots */}
                  <div style={{
                    display: 'flex', gap: 4, marginTop: 10, justifyContent: 'center',
                  }}>
                    {allConcepts.map((c, i) => (
                      <div key={i} style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: revealedSet.has(i) ? '#44cc88' : 'rgba(255,255,255,0.2)',
                        border: `1px solid ${revealedSet.has(i) ? '#44cc88' : 'rgba(255,255,255,0.3)'}`,
                        transition: 'all 0.3s',
                      }} />
                    ))}
                  </div>
                </div>

                {/* Revealed concept card (shows last revealed) */}
                {revealedSet.size > 0 && (
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    padding: '20px 20px 40px',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
                    pointerEvents: 'none',
                  }}>
                    <div style={{
                      background: 'rgba(68, 204, 136, 0.15)',
                      backdropFilter: 'blur(20px)',
                      borderRadius: 12,
                      padding: '12px 16px',
                      border: '1px solid rgba(68, 204, 136, 0.3)',
                    }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#88ffbb' }}>
                        {allConcepts[[...revealedSet].pop()]?.label}
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                        {allConcepts[[...revealedSet].pop()]?.originalText}
                      </div>
                    </div>
                  </div>
                )}

                {/* All done celebration */}
                {revealedSet.size === totalConcepts && (
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: 20,
                    padding: '24px 32px',
                    textAlign: 'center',
                    pointerEvents: 'auto',
                    border: '1px solid rgba(68,204,136,0.3)',
                  }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
                      Perfect Recall!
                    </div>
                    <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 16 }}>
                      You remembered all {totalConcepts} concepts
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        onClick={handleStartReview}
                        style={{
                          flex: 1, padding: '10px', borderRadius: 10,
                          background: 'rgba(255,255,255,0.15)', color: '#fff',
                          fontSize: 14, border: 'none', cursor: 'pointer',
                        }}
                      >
                        Review Again
                      </button>
                      <button
                        onClick={onBack}
                        style={{
                          flex: 1, padding: '10px', borderRadius: 10,
                          background: '#44cc88', color: '#000', fontWeight: 600,
                          fontSize: 14, border: 'none', cursor: 'pointer',
                        }}
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </XRDomOverlay>
        </XR>
      </Canvas>
    </div>
  )
}
