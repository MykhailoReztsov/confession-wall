import { useEffect, useRef } from 'react'

// Chain attachment points as fraction of viewport width
const CHAIN_DEFS = [
  { xFrac: 0.05, segments: 30, segLen: 24 },
  { xFrac: 0.15, segments: 42, segLen: 20 },
  { xFrac: 0.28, segments: 25, segLen: 26 },
  { xFrac: 0.42, segments: 38, segLen: 22 },
  { xFrac: 0.58, segments: 28, segLen: 24 },
  { xFrac: 0.72, segments: 44, segLen: 20 },
  { xFrac: 0.85, segments: 32, segLen: 23 },
  { xFrac: 0.96, segments: 22, segLen: 25 },
]

const GRAVITY = 0.35
const DAMPING = 0.985
const ITERATIONS = 12
const GRAB_RADIUS = 40

function makeChain(anchorX, segments, segLen) {
  const nodes = []
  for (let i = 0; i <= segments; i++) {
    nodes.push({
      x: anchorX,
      y: i * segLen - 60,  // start slightly above screen
      prevX: anchorX,
      prevY: i * segLen - 60,
      pinned: i === 0,
    })
  }
  return { nodes, segLen }
}

function updatePhysics(chains) {
  // Integrate
  for (const chain of chains) {
    for (const n of chain.nodes) {
      if (n.pinned) continue
      const vx = (n.x - n.prevX) * DAMPING
      const vy = (n.y - n.prevY) * DAMPING
      n.prevX = n.x
      n.prevY = n.y
      n.x += vx
      n.y += vy + GRAVITY
    }
  }

  // Satisfy distance constraints
  for (let iter = 0; iter < ITERATIONS; iter++) {
    for (const chain of chains) {
      for (let i = 0; i < chain.nodes.length - 1; i++) {
        const a = chain.nodes[i]
        const b = chain.nodes[i + 1]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.001
        const diff = (dist - chain.segLen) / dist * 0.5
        if (!a.pinned) { a.x += dx * diff; a.y += dy * diff }
        if (!b.pinned) { b.x -= dx * diff; b.y -= dy * diff }
      }
    }
  }
}

function drawChains(ctx, chains) {
  for (const chain of chains) {
    const nodes = chain.nodes
    for (let i = 0; i < nodes.length - 1; i++) {
      const a = nodes[i]
      const b = nodes[i + 1]
      const cx = (a.x + b.x) / 2
      const cy = (a.y + b.y) / 2
      const angle = Math.atan2(b.y - a.y, b.x - a.x)
      const dist = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2)

      ctx.save()
      ctx.translate(cx, cy)

      // Alternate link orientation: even links follow chain direction, odd links are perpendicular
      if (i % 2 === 0) {
        ctx.rotate(angle)
      } else {
        ctx.rotate(angle + Math.PI / 2)
      }

      const rX = dist / 2 + 3
      const rY = 4.5

      // Outer ring
      ctx.beginPath()
      ctx.ellipse(0, 0, rX, rY, 0, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(79, 70, 229, 0.55)'
      ctx.lineWidth = 2.5
      ctx.stroke()

      // Inner highlight (metallic sheen)
      ctx.beginPath()
      ctx.ellipse(0, -1, rX * 0.7, rY * 0.45, 0, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(165, 180, 252, 0.2)'
      ctx.lineWidth = 1
      ctx.stroke()

      ctx.restore()
    }
  }
}

export default function InteractiveChains() {
  const canvasRef = useRef(null)
  const chainsRef = useRef([])
  const grabRef = useRef(null)   // { chainIdx, nodeIdx }
  const rafRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      // Rebuild chains on resize so anchor x tracks viewport width
      chainsRef.current = CHAIN_DEFS.map((def) =>
        makeChain(def.xFrac * canvas.width, def.segments, def.segLen)
      )
    }

    resize()
    window.addEventListener('resize', resize)

    const loop = () => {
      updatePhysics(chainsRef.current)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      drawChains(ctx, chainsRef.current)
      rafRef.current = requestAnimationFrame(loop)
    }
    loop()

    // --- Interaction helpers ---
    function findNearest(mx, my) {
      let best = null
      let bestDist = GRAB_RADIUS
      chainsRef.current.forEach((chain, ci) => {
        chain.nodes.forEach((node, ni) => {
          if (node.pinned) return
          const d = Math.hypot(node.x - mx, node.y - my)
          if (d < bestDist) { bestDist = d; best = { ci, ni } }
        })
      })
      return best
    }

    function getPos(e) {
      const r = canvas.getBoundingClientRect()
      if (e.touches) {
        return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top }
      }
      return { x: e.clientX - r.left, y: e.clientY - r.top }
    }

    const onDown = (e) => {
      const { x, y } = getPos(e)
      const hit = findNearest(x, y)
      if (hit) {
        grabRef.current = hit
        e.preventDefault()
      }
    }

    const onMove = (e) => {
      if (!grabRef.current) return
      const { x, y } = getPos(e)
      const { ci, ni } = grabRef.current
      const node = chainsRef.current[ci].nodes[ni]
      node.x = x
      node.y = y
      node.prevX = x
      node.prevY = y
      e.preventDefault()
    }

    const onUp = () => { grabRef.current = null }

    canvas.addEventListener('mousedown', onDown)
    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('mouseup', onUp)
    canvas.addEventListener('touchstart', onDown, { passive: false })
    canvas.addEventListener('touchmove', onMove, { passive: false })
    canvas.addEventListener('touchend', onUp)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('mousedown', onDown)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('mouseup', onUp)
      canvas.removeEventListener('touchstart', onDown)
      canvas.removeEventListener('touchmove', onMove)
      canvas.removeEventListener('touchend', onUp)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0"
      style={{ cursor: 'grab', opacity: 0.85 }}
    />
  )
}
