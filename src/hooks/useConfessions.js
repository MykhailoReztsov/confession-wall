import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchAllConfessions, postConfession, estimateGasCost } from '../lib/contract'

export function useConfessions(signer) {
  const [confessions, setConfessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const loadedRef = useRef(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const all = await fetchAllConfessions()
      setConfessions(all)
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
    await load() // reload wall after posting
    return txHash
  }, [signer, load])

  const getGasEstimate = useCallback(async (text) => {
    if (!signer) return null
    return estimateGasCost(signer, text)
  }, [signer])

  // Filter confessions by a specific author (used by ProfilePage)
  const byAuthor = useCallback((address) => {
    if (!address) return []
    const addr = address.toLowerCase()
    return confessions.filter(c => c.author.toLowerCase() === addr)
  }, [confessions])

  // Find replies to a confession: format "↩ #ID: text"
  const repliesTo = useCallback((confessionId) => {
    return confessions.filter(c => c.text.startsWith(`↩ #${confessionId}:`))
  }, [confessions])

  return {
    confessions,
    loading,
    error,
    total: confessions.length,
    submitConfession,
    getGasEstimate,
    refresh: load,
    byAuthor,
    repliesTo,
  }
}
