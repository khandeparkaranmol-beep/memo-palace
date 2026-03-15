import { useRef, useState, useCallback, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import VoxelObject from './VoxelObject'

// ══════════════════════════════════════════════════════════════════
// CAMERA-BASED AR (works on ALL phones — iOS, Android, desktop)
//
// Strategy: getUserMedia for the camera feed as a <video> background,
// Three.js Canvas with alpha:true overlaid on top.
// User taps the screen → object appears at that position.
// Objects are rendered in a fixed 3D scene; the camera feed
// provides the "AR" context behind them.
// ══════════════════════════════════════════════════════════════════

// ── Spinning object on a pedestal ────────────────────────────────
function PlacedARObject({ concept, screenX, screenY, index, isRevealed, reviewMode, onReveal }) {
  const groupRef = useRef()
  const { viewport } = useThree()

  // Convert screen percentage (0-1) to 3D world position
  const worldX = (screenX - 0.5) * viewport.width
  const worldY = (0.5 - screenY) * viewport.height

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime
    // Gentle idle rotation
    groupRef.current.rotation.y = t * 0.3 + index * 1.5
    // Subtle floating bob
    groupRef.current.position.y = worldY + Math.sin(t * 1.5 + index) * 0.02
  })

  const glowColor = concept.lights?.[0]?.color || '#ffffff'
  const scale = 0.035

  return (
    <group
      ref={groupRef}
      position={[worldX, worldY, 0]}
      onClick={(e) => {
        e.stopPropagation()
        if (reviewMode && !isRevealed && onReveal) onReveal()
      }}
    >
      <group scale={[scale, scale, scale]}>
        <VoxelObject
          concept={{ ...concept, position: { x: 0, y: 0, z: 0 } }}
          reviewMode={reviewMode && !isRevealed}
          isRevealed={!reviewMode || isRevealed}
        />
      </group>

      {/* Glow light */}
      <pointLight
        position={[0, 0.08, 0.05]}
        color={(!reviewMode || isRevealed) ? glowColor : '#ff4466'}
        intensity={(!reviewMode || isRevealed) ? 1.2 : 0.4}
        distance={0.5}
      />

      {/* Shadow circle underneath */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
        <circleGeometry args={[0.06, 16]} />
        <meshBasicMaterial color="#000" transparent opacity={0.25} />
      </mesh>
    </group>
  )
}

// ── Placement reticle that follows your finger/tap location ──────
function PlacementReticle({ screenX, screenY }) {
  const ref = useRef()
  const { viewport } = useThree()

  useFrame((state) => {
    if (!ref.current) return
    const worldX = (screenX - 0.5) * viewport.width
    const worldY = (0.5 - screenY) * viewport.height
    ref.current.position.set(worldX, worldY, 0)
    const t = state.clock.elapsedTime
    const pulse = 0.8 + 0.2 * Math.sin(t * 4)
    ref.current.scale.setScalar(pulse)
  })

  return (
    <group ref={ref}>
      <mesh>
        <ringGeometry args={[0.035, 0.045, 32]} />
        <meshBasicMaterial color="#44cc88" transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>
      <mesh>
        <circleGeometry args={[0.008, 16]} />
        <meshBasicMaterial color="#88ffbb" transparent opacity={0.9} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}


// ── Main ARView Component ────────────────────────────────────────
export default function ARView({ palaceData, onBack }) {
  const rooms = palaceData.rooms || []
  const allConcepts = useMemo(() => {
    return rooms.flatMap(room => room.concepts || [])
  }, [rooms])

  // State
  const [mode, setMode] = useState('pre-ar')   // 'pre-ar' | 'placing' | 'done' | 'review'
  const [placedObjects, setPlacedObjects] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [revealedSet, setRevealedSet] = useState(new Set())
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const [reticlePos, setReticlePos] = useState({ x: 0.5, y: 0.5 })

  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const currentConcept = allConcepts[currentIndex] || null
  const totalConcepts = allConcepts.length

  // ── Start camera ──────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',   // Back camera
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setCameraReady(true)
      setMode('placing')
    } catch (err) {
      console.error('Camera error:', err)
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera access denied. Please allow camera access and try again.'
          : 'Could not access camera. Make sure no other app is using it.'
      )
    }
  }, [])

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
    }
  }, [])

  // ── Handle tap to place ───────────────────────────────────────
  const handleCanvasTap = useCallback((e) => {
    if (mode !== 'placing' || !currentConcept) return

    const rect = e.target.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height

    setPlacedObjects(prev => [...prev, {
      concept: currentConcept,
      screenX: x,
      screenY: y,
    }])

    if (currentIndex + 1 >= totalConcepts) {
      setMode('done')
    } else {
      setCurrentIndex(prev => prev + 1)
    }
  }, [mode, currentConcept, currentIndex, totalConcepts])

  // Track finger/mouse for reticle
  const handlePointerMove = useCallback((e) => {
    if (mode !== 'placing') return
    const rect = e.target.getBoundingClientRect()
    setReticlePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    })
  }, [mode])

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

  const handleExit = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }
    onBack()
  }, [onBack])

  // ── PRE-AR screen ─────────────────────────────────────────────
  if (mode === 'pre-ar') {
    return (
      <div className="ar-pre-screen">
        <div className="ar-pre-content">
          <div className="ar-pre-icon">📍</div>
          <h1 className="ar-pre-title">{palaceData.theme || 'Memory Palace'}</h1>
          <p className="ar-pre-desc">
            Place <strong>{totalConcepts} memory objects</strong> around your room using your camera.
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

          {cameraError && (
            <div style={{
              background: 'rgba(255,68,102,0.15)',
              border: '1px solid rgba(255,68,102,0.3)',
              borderRadius: 10,
              padding: '12px 16px',
              marginBottom: 16,
              fontSize: 13,
              color: '#ff6688',
            }}>
              {cameraError}
            </div>
          )}

          <button className="ar-enter-btn" onClick={startCamera}>
            Open Camera & Start Placing
          </button>
          <button className="ar-back-btn" onClick={onBack}>
            ← Back
          </button>
        </div>
      </div>
    )
  }

  // ── AR Experience (camera + 3D overlay) ───────────────────────
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0,
      width: '100vw', height: '100vh',
      background: '#000',
      overflow: 'hidden',
    }}>
      {/* Camera feed — fills the screen */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: 'absolute', top: 0, left: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          zIndex: 0,
        }}
      />

      {/* 3D Canvas — transparent, overlaid on camera */}
      <div
        style={{
          position: 'absolute', top: 0, left: 0,
          width: '100%', height: '100%',
          zIndex: 1,
        }}
        onClick={handleCanvasTap}
        onPointerMove={handlePointerMove}
      >
        <Canvas
          gl={{ antialias: true, alpha: true }}
          camera={{ position: [0, 0, 1], near: 0.01, far: 10 }}
          style={{ background: 'transparent' }}
        >
          <ambientLight intensity={1.2} />
          <directionalLight position={[1, 2, 3]} intensity={0.6} />
          <directionalLight position={[-1, 1, -1]} intensity={0.3} color="#aabbff" />

          {/* Placement reticle */}
          {mode === 'placing' && (
            <PlacementReticle screenX={reticlePos.x} screenY={reticlePos.y} />
          )}

          {/* All placed objects */}
          {placedObjects.map((obj, i) => (
            <PlacedARObject
              key={i}
              concept={obj.concept}
              screenX={obj.screenX}
              screenY={obj.screenY}
              index={i}
              isRevealed={!mode.includes('review') || revealedSet.has(i)}
              reviewMode={mode === 'review'}
              onReveal={() => handleReveal(i)}
            />
          ))}
        </Canvas>
      </div>

      {/* ── HUD OVERLAY ──────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 0, left: 0,
        width: '100%', height: '100%',
        zIndex: 2,
        pointerEvents: 'none',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}>

        {/* ── PLACING MODE ── */}
        {mode === 'placing' && currentConcept && (
          <>
            {/* Top: progress bar */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              padding: '50px 20px 16px',
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)',
            }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                {allConcepts.map((_, i) => (
                  <div key={i} style={{
                    flex: 1, height: 3, borderRadius: 2,
                    background: i < currentIndex ? '#44cc88' : i === currentIndex ? '#88ffbb' : 'rgba(255,255,255,0.2)',
                    transition: 'background 0.3s',
                  }} />
                ))}
              </div>
              <div style={{ color: '#fff', fontSize: 13, opacity: 0.7, textAlign: 'center' }}>
                {currentIndex + 1} of {totalConcepts}
              </div>
            </div>

            {/* Bottom: concept card */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              padding: '20px 20px 40px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
              pointerEvents: 'auto',
            }}>
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: 16,
                padding: '16px 20px',
                border: '1px solid rgba(255,255,255,0.15)',
              }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 6 }}>
                  {currentConcept.label}
                </div>
                <div style={{
                  fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4,
                }}>
                  {currentConcept.association
                    ? currentConcept.association.slice(0, 120) + (currentConcept.association.length > 120 ? '…' : '')
                    : ''
                  }
                </div>
                <div style={{
                  marginTop: 12, fontSize: 14, color: '#88ffbb',
                  textAlign: 'center', fontWeight: 500,
                }}>
                  Tap anywhere to place this object
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── DONE MODE ── */}
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
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: 16, padding: '20px',
              border: '1px solid rgba(255,255,255,0.15)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>✨</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 6 }}>
                All {totalConcepts} objects placed!
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 16 }}>
                You can see your objects overlaid on the camera. Ready to test your memory?
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleStartReview} style={{
                  flex: 1, padding: '12px', borderRadius: 10,
                  background: '#44cc88', color: '#000', fontWeight: 600,
                  fontSize: 15, border: 'none', cursor: 'pointer',
                }}>
                  Start Review
                </button>
                <button onClick={handleReset} style={{
                  padding: '12px 16px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.15)', color: '#fff',
                  fontSize: 15, border: 'none', cursor: 'pointer',
                }}>
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── REVIEW MODE ── */}
        {mode === 'review' && (
          <>
            {/* Top */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              padding: '50px 20px 16px',
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)',
            }}>
              <div style={{ textAlign: 'center', color: '#fff' }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                  Review Mode
                </div>
                <div style={{ fontSize: 13, opacity: 0.7 }}>
                  Tap each object to reveal · {revealedSet.size}/{totalConcepts} recalled
                </div>
              </div>
              <div style={{
                display: 'flex', gap: 4, marginTop: 10, justifyContent: 'center',
              }}>
                {allConcepts.map((_, i) => (
                  <div key={i} style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: revealedSet.has(i) ? '#44cc88' : 'rgba(255,255,255,0.2)',
                    border: `1px solid ${revealedSet.has(i) ? '#44cc88' : 'rgba(255,255,255,0.3)'}`,
                    transition: 'all 0.3s',
                  }} />
                ))}
              </div>
            </div>

            {/* Last revealed card */}
            {revealedSet.size > 0 && revealedSet.size < totalConcepts && (
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '20px 20px 40px',
                background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
              }}>
                <div style={{
                  background: 'rgba(68,204,136,0.15)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  borderRadius: 12, padding: '12px 16px',
                  border: '1px solid rgba(68,204,136,0.3)',
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

            {/* All recalled celebration */}
            {revealedSet.size === totalConcepts && (
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'rgba(0,0,0,0.85)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: 20, padding: '24px 32px',
                textAlign: 'center', pointerEvents: 'auto',
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
                  <button onClick={handleStartReview} style={{
                    flex: 1, padding: '10px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.15)', color: '#fff',
                    fontSize: 14, border: 'none', cursor: 'pointer',
                  }}>
                    Review Again
                  </button>
                  <button onClick={handleExit} style={{
                    flex: 1, padding: '10px', borderRadius: 10,
                    background: '#44cc88', color: '#000', fontWeight: 600,
                    fontSize: 14, border: 'none', cursor: 'pointer',
                  }}>
                    Done
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── CLOSE BUTTON (always visible in AR) ── */}
        <button
          onClick={handleExit}
          style={{
            position: 'absolute', top: 50, left: 16,
            zIndex: 10, pointerEvents: 'auto',
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 20, padding: '6px 14px',
            color: '#fff', fontSize: 13, cursor: 'pointer',
          }}
        >
          ✕ Close
        </button>
      </div>
    </div>
  )
}
