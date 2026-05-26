import { useState, useEffect, useRef } from 'react'

const TEMPLATES = [
  () => `0x${rnd(8)}…${rnd(4)}`,
  () => `#${(21800000 + Math.floor(Math.random() * 200000)).toLocaleString()}`,
  () => ['a9059cbb', 'd0e30db0', '095ea7b3', '23b872dd', '4e71d92d'][ri(5)],
  () => `calldata: 0x${rnd(16)}`,
  () => `base:8453`,
  () => `gasPrice: ${(Math.random() * 0.008 + 0.001).toFixed(4)} gwei`,
  () => `0x${rnd(40)}`,
  () => `nonce: ${Math.floor(Math.random() * 9999)}`,
]

function rnd(len) {
  return Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join('')
}
function ri(n) { return Math.floor(Math.random() * n) }

let uid = 0
function spawnItem() {
  return {
    id: uid++,
    text: TEMPLATES[ri(TEMPLATES.length)](),
    left: `${5 + Math.random() * 88}%`,
    top:  `${10 + Math.random() * 75}%`,
    dur:  `${8 + Math.random() * 9}s`,
    opacity: 0.045 + Math.random() * 0.055,
  }
}

export default function BlockchainAmbient() {
  const [items, setItems] = useState([])
  const timerRef = useRef(null)

  useEffect(() => {
    // Seed a few items immediately
    setItems([spawnItem(), spawnItem(), spawnItem()])

    const schedule = () => {
      const delay = 3500 + Math.random() * 7000
      timerRef.current = setTimeout(() => {
        setItems(prev => {
          const next = [...prev.slice(-7), spawnItem()]
          return next
        })
        schedule()
      }, delay)
    }
    schedule()

    return () => clearTimeout(timerRef.current)
  }, [])

  return (
    <div className="fixed inset-0 z-[1] pointer-events-none overflow-hidden">
      {items.map(item => (
        <span
          key={item.id}
          className="ambient-item absolute"
          style={{
            left: item.left,
            top:  item.top,
            '--dur': item.dur,
            color: `rgba(255,255,255,${item.opacity})`,
          }}
        >
          {item.text}
        </span>
      ))}
    </div>
  )
}
