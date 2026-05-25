import { useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'
import { BASE_CHAIN_ID, BASE_CHAIN_ID_HEX, BASE_NETWORK } from '../lib/contract'

export function useWallet() {
  const [account, setAccount] = useState(null)
  const [signer, setSigner] = useState(null)
  const [chainId, setChainId] = useState(null)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState(null)

  const isOnBase = chainId === BASE_CHAIN_ID

  // Restore existing connection on page load
  useEffect(() => {
    if (!window.ethereum) return

    const restore = async () => {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' })
        if (accounts.length > 0) {
          await hydrate(accounts[0])
        }
      } catch (e) {
        console.error('Wallet restore failed:', e)
      }
    }

    restore()

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnect()
      } else {
        hydrate(accounts[0])
      }
    }

    const handleChainChanged = (hexChainId) => {
      setChainId(parseInt(hexChainId, 16))
    }

    window.ethereum.on('accountsChanged', handleAccountsChanged)
    window.ethereum.on('chainChanged', handleChainChanged)

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
      window.ethereum.removeListener('chainChanged', handleChainChanged)
    }
  }, [])

  async function hydrate(address) {
    const provider = new ethers.BrowserProvider(window.ethereum)
    const network = await provider.getNetwork()
    const s = await provider.getSigner()
    setAccount(address)
    setSigner(s)
    setChainId(Number(network.chainId))
  }

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError('MetaMask not detected. Please install it to continue.')
      return
    }

    setConnecting(true)
    setError(null)

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      await hydrate(accounts[0])
    } catch (e) {
      if (e.code === 4001) {
        setError('Connection rejected.')
      } else {
        setError('Failed to connect wallet.')
      }
    } finally {
      setConnecting(false)
    }
  }, [])

  const switchToBase = useCallback(async () => {
    if (!window.ethereum) return
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BASE_CHAIN_ID_HEX }],
      })
    } catch (e) {
      // Chain not yet added to wallet — add it
      if (e.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [BASE_NETWORK],
        })
      }
    }
  }, [])

  const disconnect = useCallback(() => {
    setAccount(null)
    setSigner(null)
    setChainId(null)
  }, [])

  return { account, signer, chainId, isOnBase, connecting, error, connect, switchToBase, disconnect }
}
