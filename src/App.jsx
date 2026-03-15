import { useState } from 'react'
import LandingPage from './components/LandingPage'
import LoadingScreen from './components/LoadingScreen'
import PalaceView from './components/PalaceView'
import ARView from './components/ARView'
import { useGenerate } from './hooks/useGenerate'
import './App.css'

/**
 * Mode chooser — after generating, user picks how to experience their palace:
 *   1. Virtual Palace (desktop): Walk through a 3D moonlit palace
 *   2. AR Mode (mobile): Place objects in your real room
 */
function ModeChooser({ palaceData, onChoosePalace, onChooseAR, onBack }) {
  const rooms = palaceData.rooms || []
  const totalConcepts = rooms.reduce((sum, r) => sum + (r.concepts?.length || 0), 0)

  return (
    <div className="mode-chooser">
      <div className="mode-chooser-content">
        <h1>{palaceData.theme || 'Your Memory Palace'}</h1>
        <p className="mode-subtitle">
          {totalConcepts} concepts generated. How would you like to learn them?
        </p>

        <div className="mode-cards">
          <div className="mode-card" onClick={onChoosePalace}>
            <div className="mode-icon">🏛️</div>
            <div className="mode-name">Virtual Palace</div>
            <div className="mode-desc">
              Walk through a moonlit 3D palace with glowing objects at each station
            </div>
            <span className="mode-tag desktop">Desktop</span>
          </div>

          <div className="mode-card" onClick={onChooseAR}>
            <div className="mode-icon">📱</div>
            <div className="mode-name">Place in AR</div>
            <div className="mode-desc">
              Use your phone camera to place memory objects around your real room
            </div>
            <span className="mode-tag mobile">Mobile</span>
          </div>
        </div>

        <button className="ar-back-btn" onClick={onBack}>
          ← Start Over
        </button>
      </div>
    </div>
  )
}


// App states: 'landing' | 'loading' | 'choose' | 'palace' | 'ar'
function App() {
  const [appState, setAppState] = useState('landing')
  const [palaceData, setPalaceData] = useState(null)
  const [loadingStep, setLoadingStep] = useState(0)
  const { generate, error } = useGenerate()

  const handleBuild = async (concepts) => {
    setAppState('loading')
    setLoadingStep(0)

    try {
      setLoadingStep(0)

      const data = await generate(concepts, (step) => {
        setLoadingStep(step)
      })

      setPalaceData(data)
      setAppState('choose')
    } catch (err) {
      console.error('Generation failed:', err)
      setAppState('landing')
    }
  }

  const handleBack = () => {
    setAppState('landing')
    setPalaceData(null)
  }

  if (appState === 'loading') {
    return <LoadingScreen step={loadingStep} />
  }

  if (appState === 'choose' && palaceData) {
    return (
      <ModeChooser
        palaceData={palaceData.palace || palaceData}
        onChoosePalace={() => setAppState('palace')}
        onChooseAR={() => setAppState('ar')}
        onBack={handleBack}
      />
    )
  }

  if (appState === 'palace' && palaceData) {
    return <PalaceView palace={palaceData} onBack={() => setAppState('choose')} />
  }

  if (appState === 'ar' && palaceData) {
    return <ARView palaceData={palaceData.palace || palaceData} onBack={() => setAppState('choose')} />
  }

  return <LandingPage onBuild={handleBuild} error={error} />
}

export default App
