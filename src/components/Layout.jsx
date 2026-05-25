import { useRef, useCallback } from 'react'
import CinematicCanvas from './CinematicCanvas'
import Navbar from './Navbar'

// Wraps every page: canvas BG + grain + navbar.
// `parallax` prop enables the subtle UI mouse-follow effect (home only).
export default function Layout({ children, wallet, parallax = false }) {
  const contentRef = useRef(null)

  const handleMouseUpdate = useCallback((x, y) => {
    if (!parallax || !contentRef.current) return
    contentRef.current.style.transform = `translate(${x * 8}px, ${y * 5}px)`
  }, [parallax])

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#0a0a0a' }}>
      <div className="grain-overlay" />
      <CinematicCanvas onMouseUpdate={handleMouseUpdate} />

      {/* Navbar is the first flex item — sticky within this column */}
      <Navbar {...wallet} />

      <div
        ref={contentRef}
        className="flex-1 overflow-hidden flex flex-col"
        style={{ willChange: parallax ? 'transform' : undefined, transition: 'transform 0.12s ease-out' }}
      >
        {children}
      </div>
    </div>
  )
}
