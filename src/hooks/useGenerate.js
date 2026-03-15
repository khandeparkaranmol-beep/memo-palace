import { useState, useCallback } from 'react'
import { MOCK_PALACE } from '../mockPalace'

const API_URL = '/api/generate'
const USE_MOCK = !import.meta.env.VITE_ANTHROPIC_API_KEY && import.meta.env.DEV

/**
 * Hook for calling the palace generation API.
 * In dev without an API key, returns mock data.
 */
export function useGenerate() {
  const [error, setError] = useState(null)

  const generate = useCallback(async (concepts, onStep) => {
    setError(null)

    try {
      // If no API key configured, use mock data for development
      if (USE_MOCK) {
        onStep(0)
        await new Promise(r => setTimeout(r, 600))
        onStep(1)
        await new Promise(r => setTimeout(r, 800))
        onStep(2)
        await new Promise(r => setTimeout(r, 700))
        onStep(3)
        await new Promise(r => setTimeout(r, 500))
        onStep(4)
        await new Promise(r => setTimeout(r, 300))
        return MOCK_PALACE
      }

      // Production: call the API
      onStep(0)

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concepts }),
      })

      onStep(1)

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || `Server error: ${response.status}`)
      }

      onStep(2)

      const data = await response.json()

      onStep(3)
      await new Promise(r => setTimeout(r, 500))
      onStep(4)
      await new Promise(r => setTimeout(r, 300))

      return data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  return { generate, error }
}
