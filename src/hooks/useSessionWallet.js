import { useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'

const PK_KEY = 'ocw:session_pk'

// Base GasPriceOracle — tells us the exact L1 data fee for a given raw tx
const GAS_ORACLE = '0x420000000000000000000000000000000000000F'
const GAS_ORACLE_ABI = ['function getL1Fee(bytes) view returns (uint256)']

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
  const [wallet]              = useState(initWallet)
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
    if (!wallet) throw new Error('Wallet not ready')

    const [freshBalance, feeData, nonce] = await Promise.all([
      wallet.provider.getBalance(wallet.address),
      wallet.provider.getFeeData(),
      wallet.provider.getTransactionCount(wallet.address),
    ])

    const maxFee      = feeData.maxFeePerGas ?? feeData.gasPrice ?? 2000000000n
    const priorityFee = feeData.maxPriorityFeePerGas ?? 1000000n
    const gasLimit    = 21000n
    const l2Fee       = maxFee * gasLimit

    // Ask Base's L1 oracle for the exact L1 data fee for this transaction.
    // We build the unsigned tx to measure its byte size — the signature adds
    // ~65 bytes, so we pad the estimate by 20% to stay safe.
    let l1Fee = l2Fee // sane fallback if oracle call fails
    try {
      const oracle  = new ethers.Contract(GAS_ORACLE, GAS_ORACLE_ABI, wallet.provider)
      const dummyTx = ethers.Transaction.from({
        type: 2, chainId: 8453n, nonce,
        to: toAddress, value: 1n,   // value doesn't affect byte size
        gasLimit, maxFeePerGas: maxFee, maxPriorityFeePerGas: priorityFee,
      })
      const raw = dummyTx.unsignedSerialized
      l1Fee = (await oracle.getL1Fee(raw)) * 12n / 10n  // +20% for signature bytes
    } catch {}

    const totalFee = l2Fee + l1Fee
    if (freshBalance <= totalFee) throw new Error('Balance too low to cover gas')

    const tx = await wallet.sendTransaction({
      to: toAddress,
      value: freshBalance - totalFee,
      gasLimit,
      maxFeePerGas:         maxFee,
      maxPriorityFeePerGas: priorityFee,
    })
    await tx.wait()
    refreshBalance()
    return tx.hash
  }, [wallet, refreshBalance])

  const isActive = balance !== null && balance > 0n

  return {
    address:  wallet?.address ?? null,
    balance,
    isActive,
    signer:   wallet,
    withdraw,
    refreshBalance,
  }
}
