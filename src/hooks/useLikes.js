import { useState, useCallback } from 'react'

const KEY = 'ocw:likes'

function load() {
  try { return new Set(JSON.parse(localStorage.getItem(KEY) || '[]')) } catch { return new Set() }
}

function save(set) {
  localStorage.setItem(KEY, JSON.stringify([...set]))
}

export function useLikes() {
  const [liked, setLiked] = useState(load)

  const toggle = useCallback((id) => {
    setLiked(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      save(next)
      return next
    })
  }, [])

  const isLiked = useCallback((id) => liked.has(id), [liked])

  return { isLiked, toggle }
}
