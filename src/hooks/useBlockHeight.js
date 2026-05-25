import { useState, useEffect, useRef } from 'react'
import { ethers } from 'ethers'

export function useBlockHeight() {
  const [blockHeight, setBlockHeight] = useState(null)
  const [flash, setFlash] = useState(false)
  const prevRef = useRef(null)

  useEffect(() => {
    const provider = new ethers.JsonRpcProvider(
      import.meta.env.VITE_RPC_URL || 'https://mainnet.base.org'
    )
    let mounted = true

    const fetch = async () => {
      try {
        const block = await provider.getBlockNumber()
        if (!mounted) return
        if (prevRef.current !== null && block !== prevRef.current) {
          setFlash(true)
          setTimeout(() => setFlash(false), 800)
        }
        prevRef.current = block
        setBlockHeight(block)
      } catch {}
    }

    fetch()
    const id = setInterval(fetch, 10000)
    return () => { mounted = false; clearInterval(id) }
  }, [])

  return { blockHeight, flash }
}
