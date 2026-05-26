import { useState, useEffect, useRef } from 'react'

const TYPES   = ['glitch-flicker', 'glitch-corrupt', 'glitch-glow']
const DURATIONS = { 'glitch-flicker': 450, 'glitch-corrupt': 380, 'glitch-glow': 2200 }

// Returns { glitchClass } — apply to the root content div.
// Triggers a random glitch every 35–120 seconds, very rarely.
export function useGlitch() {
  const [glitchClass, setGlitchClass] = useState('')
  const timerRef = useRef(null)

  useEffect(() => {
    const schedule = () => {
      const delay = 35000 + Math.random() * 85000 // 35–120 s
      timerRef.current = setTimeout(() => {
        const type = TYPES[Math.floor(Math.random() * TYPES.length)]
        setGlitchClass(type)
        setTimeout(() => setGlitchClass(''), DURATIONS[type] + 50)
        schedule()
      }, delay)
    }
    schedule()
    return () => clearTimeout(timerRef.current)
  }, [])

  return { glitchClass }
}
