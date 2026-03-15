const STEPS = [
  'Sending concepts to AI...',
  'Designing room layout...',
  'Creating vivid associations...',
  'Sculpting voxel objects...',
  'Building your palace...',
]

export default function LoadingScreen({ step }) {
  return (
    <div className="loading-screen">
      <h2>Building your memory palace</h2>
      <div className="loading-steps">
        {STEPS.map((label, i) => {
          let status = ''
          if (i < step) status = 'done'
          else if (i === step) status = 'active'

          return (
            <div key={i} className={`loading-step ${status}`}>
              <div className="loading-dot" />
              <span>{label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
