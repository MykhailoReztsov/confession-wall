import { useRef, useCallback } from 'react'
import CinematicCanvas from './CinematicCanvas'
import BlockchainAmbient from './BlockchainAmbient'
import Navbar from './Navbar'
import { useGlitch } from '../hooks/useGlitch'

export default function Layout({ children, wallet, parallax = false }) {
  const contentRef = useRef(null)
  const { glitchClass } = useGlitch()

  const handleMouseUpdate = useCallback((x, y) => {
    if (!parallax || !contentRef.current) return
    contentRef.current.style.transform = `translate(${x * 8}px, ${y * 5}px)`
  }, [parallax])

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#0a0a0a' }}>
      <div className="grain-overlay" />
      <CinematicCanvas onMouseUpdate={handleMouseUpdate} />
      <BlockchainAmbient />

      <Navbar {...wallet} />

      <div
        ref={contentRef}
        className={`flex-1 overflow-hidden flex flex-col ${glitchClass}`}
        style={{ willChange: parallax ? 'transform' : undefined, transition: 'transform 0.12s ease-out' }}
      >
        {children}
      </div>
    </div>
  )
}
