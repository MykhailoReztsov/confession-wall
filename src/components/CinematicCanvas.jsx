import { useEffect, useRef } from 'react'

// Ported from the reference design — falling chain segments + floating ash + mouse parallax
export default function CinematicCanvas({ onMouseUpdate }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let width, height, animId, time = 0
    let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0

    class Chain {
      constructor(init = false) {
        this.reset()
        if (init) this.y = Math.random() * (height || 800)
      }
      reset() {
        this.z = Math.random() * 100 + 10
        this.x = Math.random() * (width || 1280)
        this.y = -Math.random() * 500 - 100
        this.length = Math.random() * 280 + 80
        this.speedY = 0.5 + (100 / this.z) * 0.5
        this.thickness = Math.max(0.4, 3.5 - this.z / 28)
        this.baseOpacity = Math.max(0.04, 0.38 - this.z / 260)
        this.swayPhase = Math.random() * Math.PI * 2
        this.swaySpeed = 0.001 + Math.random() * 0.002
        this.segments = Math.floor(this.length / 10)
      }
      update(t) {
        this.y += this.speedY * 0.2
        if (this.y - this.length > height) this.reset()
        this.sway = Math.sin(t * this.swaySpeed + this.swayPhase) * (15 + (100 / this.z) * 8)
      }
      draw(ctx, px, py) {
        const x = this.x + this.sway + px * (200 / this.z)
        const y = this.y + py * (100 / this.z)
        ctx.save()
        ctx.globalAlpha = this.baseOpacity
        ctx.lineWidth = this.thickness
        ctx.strokeStyle = '#ffffff'
        ctx.beginPath()
        for (let i = 0; i < this.segments; i++) {
          const y1 = y - i * 10
          const y2 = y - (i * 10 + 6)
          if (y1 < -50 || y2 > height + 50) continue
          ctx.moveTo(x, y1)
          ctx.lineTo(x, y2)
        }
        ctx.stroke()
        ctx.restore()
      }
    }

    class Ash {
      constructor() { this.reset(true) }
      reset(randomY = false) {
        this.x = Math.random() * (width || 1280)
        this.y = randomY ? Math.random() * (height || 800) : (height || 800) + 10
        this.z = Math.random() * 50 + 10
        this.size = Math.max(0.4, 2.5 - this.z / 22)
        this.speedY = -Math.random() * 0.9 - 0.15
        this.speedX = (Math.random() - 0.5) * 0.8
        this.opacity = Math.random() * 0.25 + 0.07
        this.drift = Math.random() * Math.PI * 2
      }
      update(t) {
        this.y += this.speedY
        this.x += this.speedX + Math.sin(t * 0.001 + this.drift) * 0.4
        if (this.y < -10) this.reset()
        if (this.x < -10) this.x = width + 10
        if (this.x > width + 10) this.x = -10
      }
      draw(ctx, px, py) {
        const x = this.x + px * (100 / this.z)
        const y = this.y + py * (50 / this.z)
        ctx.fillStyle = `rgba(255,255,255,${this.opacity})`
        ctx.beginPath()
        ctx.arc(x, y, this.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const resize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }

    resize()
    window.addEventListener('resize', resize)

    const chains = Array.from({ length: 150 }, () => new Chain(true))
    const ashes = Array.from({ length: 100 }, () => new Ash())

    const onMove = (e) => {
      targetX = (e.clientX / window.innerWidth) * 2 - 1
      targetY = (e.clientY / window.innerHeight) * 2 - 1
    }
    document.addEventListener('mousemove', onMove)

    const loop = () => {
      time += 16
      mouseX += (targetX - mouseX) * 0.05
      mouseY += (targetY - mouseY) * 0.05

      // Expose smoothed mouse position for UI parallax
      onMouseUpdate?.(mouseX, mouseY)

      ctx.clearRect(0, 0, width, height)

      chains.sort((a, b) => b.z - a.z)
      for (const c of chains) { c.update(time); c.draw(ctx, mouseX * -50, mouseY * -50) }
      for (const a of ashes) { a.update(time); a.draw(ctx, mouseX * -30, mouseY * -30) }

      animId = requestAnimationFrame(loop)
    }
    loop()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
      document.removeEventListener('mousemove', onMove)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />
}
