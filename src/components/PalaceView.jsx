import { useState, useCallback, useEffect } from 'react'
import Palace from './Palace'

/**
 * PalaceView — wraps the 3D scene with HUD overlay:
 * - Room indicator with progress dots
 * - Controls hint
 * - Review mode toggle
 * - Concept tooltip
 * - Click-to-enter overlay
 */
export default function PalaceView({ palace, onBack }) {
  const [reviewMode, setReviewMode] = useState(false)
  const [revealedConcepts, setRevealedConcepts] = useState(new Set())
  const [hoveredConcept, setHoveredConcept] = useState(null)
  const [isLocked, setIsLocked] = useState(false)
  const [hasEntered, setHasEntered] = useState(false)
  const [currentChamber, setCurrentChamber] = useState(-1)

  const palaceData = palace.palace || palace

  const handleConceptHover = useCallback((concept) => {
    setHoveredConcept(concept)
  }, [])

  const handleConceptClick = useCallback((conceptId, concept) => {
    if (reviewMode) {
      setRevealedConcepts(prev => {
        const next = new Set(prev)
        next.add(conceptId)
        return next
      })
    }
    setHoveredConcept(concept)
  }, [reviewMode])

  const handleLockChange = useCallback((locked) => {
    setIsLocked(locked)
    if (locked) setHasEntered(true)
  }, [])

  const handleChamberChange = useCallback((chamberIndex) => {
    setCurrentChamber(chamberIndex)
  }, [])

  const toggleReviewMode = () => {
    setReviewMode(prev => !prev)
    if (!reviewMode) {
      // Entering review mode: clear reveals
      setRevealedConcepts(new Set())
    }
  }

  // Count total and revealed concepts for review score
  const chambers = palaceData.rooms || palaceData.chambers || []
  const totalConcepts = chambers.reduce((sum, s) => sum + (s.concepts?.length || 0), 0)
  const chamberCount = chambers.length

  // Handle ESC to show overlay again
  useEffect(() => {
    const onPointerLockChange = () => {
      if (!document.pointerLockElement) {
        setIsLocked(false)
      }
    }
    document.addEventListener('pointerlockchange', onPointerLockChange)
    return () => document.removeEventListener('pointerlockchange', onPointerLockChange)
  }, [])

  return (
    <div className="palace-container">
      {/* 3D Scene */}
      <Palace
        palaceData={palaceData}
        reviewMode={reviewMode}
        revealedConcepts={revealedConcepts}
        onConceptHover={handleConceptHover}
        onConceptClick={handleConceptClick}
        onLockChange={handleLockChange}
        onChamberChange={handleChamberChange}
      />

      {/* Crosshair */}
      {isLocked && <div className="crosshair" />}

      {/* Click-to-enter overlay */}
      {!isLocked && (
        <div className="click-to-enter" onClick={() => {
          // The PointerLockControls will handle the actual lock
          // This overlay just communicates to the user
          const canvas = document.querySelector('canvas')
          if (canvas) canvas.click()
        }}>
          <div className="click-to-enter-inner">
            <h2>{palaceData.theme || 'Your Memory Palace'}</h2>
            {palaceData.ambientDescription && (
              <p>{palaceData.ambientDescription}</p>
            )}
            <p style={{ marginTop: 8 }}>
              {chamberCount} chambers · {totalConcepts} concepts
            </p>
            <button className="enter-btn">Click to Enter</button>
            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
              WASD to move · Mouse to look · ESC to pause
            </p>
            <button
              className="back-btn"
              onClick={(e) => {
                e.stopPropagation()
                onBack()
              }}
              style={{ marginTop: 12 }}
            >
              ← Back to input
            </button>
          </div>
        </div>
      )}

      {/* HUD — only when locked */}
      {isLocked && (
        <>
          {/* Top left: palace info + chamber progress */}
          <div className="hud hud-top-left">
            <div className="hud-panel room-indicator">
              {palaceData.theme || 'Memory Palace'}
              <div className="room-desc">
                {currentChamber >= 0
                  ? chambers[currentChamber]?.name || `Chamber ${currentChamber + 1}`
                  : 'Entrance'}
                {reviewMode && ` · ${revealedConcepts.size}/${totalConcepts} recalled`}
              </div>
              {/* Progress dots */}
              <div className="chamber-progress">
                {chambers.map((c, i) => (
                  <div
                    key={i}
                    className={`chamber-dot${i === currentChamber ? ' active' : ''}${i < currentChamber ? ' visited' : ''}`}
                    title={c.name || `Chamber ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Top right: review mode toggle */}
          <div className="hud hud-top-right">
            <button
              className={`review-toggle ${reviewMode ? 'active' : ''}`}
              onClick={toggleReviewMode}
            >
              {reviewMode ? '✓ Review Mode ON' : 'Start Review Mode'}
            </button>
          </div>

          {/* Bottom center: controls hint + tooltip */}
          <div className="hud hud-bottom-center">
            <div className="controls-hint">
              <span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> move</span>
              <span><kbd>Mouse</kbd> look</span>
              <span><kbd>ESC</kbd> pause</span>
            </div>
          </div>
        </>
      )}

      {/* Concept tooltip */}
      {hoveredConcept && isLocked && (
        <div className="concept-tooltip">
          {reviewMode && !revealedConcepts.has(hoveredConcept._id) ? (
            <>
              <div className="concept-label">???</div>
              <div className="concept-assoc">Click to reveal this concept</div>
            </>
          ) : (
            <>
              <div className="concept-label">{hoveredConcept.label}</div>
              {hoveredConcept.originalText && (
                <div className="concept-original">{hoveredConcept.originalText}</div>
              )}
              <div className="concept-assoc">{hoveredConcept.association}</div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
