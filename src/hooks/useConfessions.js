import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchAllConfessions, fetchLikesForRange, likeConfession, postConfession, estimateGasCost } from '../lib/contract'

export function useConfessions(signer, account) {
  const [confessions, setConfessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const loadedRef = useRef(false)
  const accountRef = useRef(account)
  accountRef.current = account

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const all = await fetchAllConfessions()
      if (all.length === 0) { setConfessions([]); return }

      const { counts, liked } = await fetchLikesForRange(all.length, accountRef.current)
      setConfessions(all.map(c => ({
        ...c,
        likeCount: counts[c.id] ?? 0,
        liked: liked[c.id] ?? false,
      })))
    } catch (err) {
      console.error('Failed to fetch confessions:', err)
      setError(err?.message || 'Failed to load confessions')
      setConfessions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    load()
  }, [load])

  const submitConfession = useCallback(async (text) => {
    if (!signer) throw new Error('Wallet not connected')
    const txHash = await postConfession(signer, text)
    await load()
    return txHash
  }, [signer, load])

  const likePost = useCallback(async (confessionId) => {
    if (!signer) throw new Error('Wallet not connected')
    // Optimistic update
    setConfessions(prev => prev.map(c =>
      c.id === confessionId
        ? { ...c, likeCount: (c.likeCount || 0) + 1, liked: true }
        : c
    ))
    try {
      await likeConfession(signer, confessionId)
    } catch (err) {
      // Revert on failure
      setConfessions(prev => prev.map(c =>
        c.id === confessionId
          ? { ...c, likeCount: Math.max(0, (c.likeCount || 0) - 1), liked: false }
          : c
      ))
      throw err
    }
  }, [signer])

  const getGasEstimate = useCallback(async (text) => {
    if (!signer) return null
    return estimateGasCost(signer, text)
  }, [signer])

  const byAuthor = useCallback((address) => {
    if (!address) return []
    const addr = address.toLowerCase()
    return confessions.filter(c => c.author.toLowerCase() === addr)
  }, [confessions])

  const repliesTo = useCallback((confessionId) => {
    return confessions.filter(c => c.text.startsWith(`↩ #${confessionId}:`))
  }, [confessions])

  return {
    confessions,
    loading,
    error,
    total: confessions.length,
    submitConfession,
    likePost,
    getGasEstimate,
    refresh: load,
    byAuthor,
    repliesTo,
  }
}
