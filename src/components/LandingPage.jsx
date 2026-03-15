import { useState } from 'react'

const EXAMPLE_CONCEPTS = `Krebs Cycle Steps:
1. Acetyl-CoA + Oxaloacetate → Citrate (citrate synthase)
2. Citrate → Isocitrate (aconitase)
3. Isocitrate → α-Ketoglutarate (isocitrate dehydrogenase, produces NADH + CO2)
4. α-Ketoglutarate → Succinyl-CoA (α-ketoglutarate dehydrogenase, produces NADH + CO2)
5. Succinyl-CoA → Succinate (succinyl-CoA synthetase, produces GTP)
6. Succinate → Fumarate (succinate dehydrogenase, produces FADH2)
7. Fumarate → Malate (fumarase)
8. Malate → Oxaloacetate (malate dehydrogenase, produces NADH)`

export default function LandingPage({ onBuild, error }) {
  const [concepts, setConcepts] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (concepts.trim()) {
      onBuild(concepts.trim())
    }
  }

  const loadExample = () => {
    setConcepts(EXAMPLE_CONCEPTS)
  }

  return (
    <div className="landing">
      <div className="landing-content">
        <h1>
          Turn concepts into a<br />
          <span>3D memory palace</span>
        </h1>
        <p className="subtitle">
          Paste what you want to memorize. An AI builds a navigable 3D palace
          with vivid voxel objects for each concept — so you remember by walking,
          not cramming.
        </p>

        <form className="input-area" onSubmit={handleSubmit}>
          <textarea
            value={concepts}
            onChange={(e) => setConcepts(e.target.value)}
            placeholder={`Paste your concepts here — one per line, or a structured list.\n\nExample:\nKrebs Cycle Steps:\n1. Acetyl-CoA + Oxaloacetate → Citrate\n2. Citrate → Isocitrate\n...`}
            autoFocus
          />
          <button
            className="build-btn"
            type="submit"
            disabled={!concepts.trim()}
          >
            Build My Palace
          </button>
          <button
            type="button"
            className="example-link"
            onClick={loadExample}
          >
            Load an example (Krebs cycle)
          </button>
        </form>

        {error && (
          <p style={{ color: 'var(--danger)', fontSize: '14px' }}>{error}</p>
        )}
      </div>
    </div>
  )
}
