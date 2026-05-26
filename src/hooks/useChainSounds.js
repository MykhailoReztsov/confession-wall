import { useRef, useCallback, useEffect } from 'react'

// Procedural Web Audio sounds — requires one user gesture to unlock AudioContext.
// Sounds are intentionally very quiet and rare.
export function useChainSounds() {
  const ctxRef     = useRef(null)
  const unlockedRef = useRef(false)

  // Unlock on first user interaction
  useEffect(() => {
    const unlock = () => {
      if (unlockedRef.current) return
      unlockedRef.current = true
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    window.addEventListener('click', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('click', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  // Metallic ping — plays when a new post arrives
  const playNewPost = useCallback(() => {
    const ctx = ctxRef.current
    if (!ctx || ctx.state === 'suspended') return
    try {
      const sr = ctx.sampleRate
      const buf = ctx.createBuffer(1, Math.floor(sr * 0.25), sr)
      const data = buf.getChannelData(0)
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sr * 0.04))
      }
      const src = ctx.createBufferSource()
      src.buffer = buf
      const bp = ctx.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = 1100 + Math.random() * 300
      bp.Q.value = 18
      const gain = ctx.createGain()
      gain.gain.value = 0.035
      src.connect(bp)
      bp.connect(gain)
      gain.connect(ctx.destination)
      src.start()
    } catch {}
  }, [])

  // Low chain creak — plays randomly every 60–180 s as ambient
  useEffect(() => {
    let t
    const schedule = () => {
      t = setTimeout(() => {
        const ctx = ctxRef.current
        if (ctx && ctx.state !== 'suspended') {
          try {
            const sr = ctx.sampleRate
            const dur = 0.6
            const buf = ctx.createBuffer(1, Math.floor(sr * dur), sr)
            const data = buf.getChannelData(0)
            for (let i = 0; i < data.length; i++) {
              const t2 = i / sr
              const env = Math.sin(Math.PI * t2 / dur) * Math.exp(-t2 * 2.5)
              data[i] = (Math.random() * 2 - 1) * env
            }
            const src = ctx.createBufferSource()
            src.buffer = buf
            const lp = ctx.createBiquadFilter()
            lp.type = 'lowpass'
            lp.frequency.value = 220
            const gain = ctx.createGain()
            gain.gain.value = 0.018
            src.connect(lp)
            lp.connect(gain)
            gain.connect(ctx.destination)
            src.start()
          } catch {}
        }
        schedule()
      }, 60000 + Math.random() * 120000)
    }
    schedule()
    return () => clearTimeout(t)
  }, [])

  return { playNewPost }
}
