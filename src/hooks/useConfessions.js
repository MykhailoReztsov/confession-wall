import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchAllConfessions, postConfession, estimateGasCost } from '../lib/contract'
import { fetchLikeCounts, signAndLike } from '../lib/likes'

export function useConfessions(signer, account) {
  const [confessions, setConfessions] = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  const loadedRef  = useRef(false)
  const accountRef = useRef(account)
  accountRef.current = account

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const all = await fetchAllConfessions()
      if (all.length === 0) { setConfessions([]); return }

      const ids      = all.map(c => c.id)
      let likeData   = {}
      try { likeData = await fetchLikeCounts(ids, accountRef.current) } catch {}

      setConfessions(all.map(c => ({
        ...c,
        likeCount: likeData[c.id]?.count ?? 0,
        liked:     likeData[c.id]?.liked ?? false,
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

  // likeSigner: session wallet (ethers.Wallet) or MetaMask signer
  // likerAddress: address of whoever is liking (session wallet address or account)
  const likePost = useCallback(async (likeSigner, likerAddress, confessionId) => {
    // Optimistic update
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

  const byAuthor = useCallback((address) => {
    if (!address) return []
    return confessions.filter(c => c.author.toLowerCase() === address.toLowerCase())
  }, [confessions])

  const repliesTo = useCallback((confessionId) => {
    return confessions.filter(c => c.text.startsWith(`↩ #${confessionId}:`))
  }, [confessions])

  return {
    confessions, loading, error,
    total: confessions.length,
    submitConfession, likePost,
    getGasEstimate, refresh: load,
    byAuthor, repliesTo,
  }
}
