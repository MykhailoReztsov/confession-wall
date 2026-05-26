import { useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'

const PK_KEY = 'ocw:session_pk'

function makeProvider() {
  return new ethers.JsonRpcProvider(
    import.meta.env.VITE_RPC_URL || 'https://mainnet.base.org'
  )
}

function initWallet() {
  let pk = localStorage.getItem(PK_KEY)
  if (!pk) {
    pk = ethers.Wallet.createRandom().privateKey
    localStorage.setItem(PK_KEY, pk)
  }
  return new ethers.Wallet(pk, makeProvider())
}

export function useSessionWallet() {
  const [wallet]              = useState(initWallet)   // synchronous — never null
  const [balance, setBalance] = useState(null)

  const refreshBalance = useCallback(async () => {
    if (!wallet) return
    try {
      const bal = await wallet.provider.getBalance(wallet.address)
      setBalance(bal)
    } catch {}
  }, [wallet])

  useEffect(() => {
    if (!wallet) return
    refreshBalance()
    const id = setInterval(refreshBalance, 8000)
    return () => clearInterval(id)
  }, [wallet, refreshBalance])

  const withdraw = useCallback(async (toAddress) => {
    if (!wallet || balance === null) throw new Error('Wallet not ready')
    const feeData  = await wallet.provider.getFeeData()
    const gasPrice = feeData.gasPrice ?? 1000000n
    const gasLimit = 21000n
    const gasCost  = gasPrice * gasLimit
    if (balance <= gasCost) throw new Error('Balance too low to cover gas')
    const tx = await wallet.sendTransaction({
      to: toAddress, value: balance - gasCost, gasLimit, gasPrice,
    })
    await tx.wait()
    refreshBalance()
    return tx.hash
  }, [wallet, balance, refreshBalance])

  const isActive = balance !== null && balance > 0n

  return {
    address:  wallet?.address ?? null,
    balance,
    isActive,
    signer:   wallet,   // always available for signing (no ETH needed for signatures)
    withdraw,
    refreshBalance,
  }
}
