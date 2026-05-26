import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchAllConfessions, fetchTotal, estimateGasCost } from '../lib/contract'
import { fetchLikeCounts, signAndLike } from '../lib/likes'

export function useConfessions(signer, account) {
  const [confessions, setConfessions] = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)

  const loadedRef      = useRef(false)
  const accountRef     = useRef(account)
  const confessionsRef = useRef([])
  const lastTotalRef   = useRef(0)
  const onNewPostsRef  = useRef(null)

  accountRef.current = account

  const applyLikes = useCallback(async (all) => {
    if (!all.length) return all
    const ids = all.map(c => c.id)
    let likeData = {}
    try { likeData = await fetchLikeCounts(ids, accountRef.current) } catch {}
    return all.map(c => ({
      ...c,
      likeCount: likeData[c.id]?.count ?? 0,
      liked:     likeData[c.id]?.liked ?? false,
    }))
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const all = await fetchAllConfessions()
      const withLikes = await applyLikes(all)
      lastTotalRef.current = all.length
      confessionsRef.current = withLikes
      setConfessions(withLikes)
    } catch (err) {
      console.error('Failed to fetch confessions:', err)
      setError(err?.message || 'Failed to load confessions')
      setConfessions([])
    } finally {
      setLoading(false)
    }
  }, [applyLikes])

  // Initial load
  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    load()
  }, [load])

  // Live polling — check for new posts every 10 s
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const newTotal = await fetchTotal()
        if (newTotal <= lastTotalRef.current) return

        const all = await fetchAllConfessions()
        const prevIds = new Set(confessionsRef.current.map(c => c.id))
        const incomingIds = new Set(all.filter(c => !prevIds.has(c.id)).map(c => c.id))
        if (!incomingIds.size) return

        const withLikes = await applyLikes(all)
        const marked = withLikes.map(c => ({ ...c, isNew: incomingIds.has(c.id) }))

        lastTotalRef.current = newTotal
        confessionsRef.current = marked
        setConfessions(marked)

        onNewPostsRef.current?.(incomingIds.size)

        // Clear isNew flag after 4 s
        setTimeout(() => {
          setConfessions(prev => prev.map(c => ({ ...c, isNew: false })))
          confessionsRef.current = confessionsRef.current.map(c => ({ ...c, isNew: false }))
        }, 4000)
      } catch {}
    }, 10000)

    return () => clearInterval(id)
  }, [applyLikes])

  const likePost = useCallback(async (likeSigner, likerAddress, confessionId) => {
    setConfessions(prev => prev.map(c =>
      c.id === confessionId ? { ...c, likeCount: c.likeCount + 1, liked: true } : c
    ))
    try {
      await signAndLike(likeSigner, likerAddress, confessionId)
    } catch (err) {
      setConfessions(prev => prev.map(c =>
        c.id === confessionId ? { ...c, likeCount: Math.max(0, c.likeCount - 1), liked: false } : c
      ))
      throw err
    }
  }, [])

  const getGasEstimate = useCallback(async (text) => {
    if (!signer) return null
    return estimateGasCost(signer, text)
  }, [signer])

  const repliesTo = useCallback((confessionId) => {
    return confessions.filter(c => c.text.startsWith(`↩ #${confessionId}:`))
  }, [confessions])

  // Register a callback for when live-poll finds new posts (used for sounds)
  const onNewPosts = useCallback((fn) => { onNewPostsRef.current = fn }, [])

  return {
    confessions, loading, error,
    total: confessions.length,
    likePost,
    getGasEstimate,
    refresh: load,
    repliesTo,
    onNewPosts,
  }
}
