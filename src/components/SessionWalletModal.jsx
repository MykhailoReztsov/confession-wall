import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'

function fmt(bal) {
  if (bal === null) return '…'
  return parseFloat(ethers.formatEther(bal)).toFixed(6) + ' ETH'
}

export default function SessionWalletModal({ sessionWallet, mainAccount, onClose }) {
  const { address, balance, isActive, withdraw } = sessionWallet
  const [withdrawing, setWithdrawing] = useState(false)
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleWithdraw = async () => {
    if (!mainAccount) return toast.error('Connect your main wallet first')
    setWithdrawing(true)
    try {
      await withdraw(mainAccount)
      toast.success('Funds withdrawn to your wallet')
    } catch (err) {
      toast.error(err.message || 'Withdraw failed')
    } finally {
      setWithdrawing(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        className="glass-panel w-full max-w-md p-8 relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <h2
              className="text-white uppercase tracking-widest"
              style={{ fontFamily: 'Hanken Grotesk', fontSize: '18px', fontWeight: 300 }}
            >
              Auto-sign
            </h2>
            <p className="font-['JetBrains_Mono'] text-[10px] text-white/40 tracking-widest mt-1 uppercase">
              Sign posts & likes without popups
            </p>
          </div>

          {/* Status dot */}
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'}`} />
            <span className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest text-white/40">
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-6">

          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-6 h-6 rounded-full border border-white/15 flex items-center justify-center">
              <span className="font-['JetBrains_Mono'] text-[10px] text-white/40">1</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-['JetBrains_Mono'] text-[11px] text-white/60 uppercase tracking-widest mb-2">
                Deposit ETH to this address
              </p>
              <div className="flex items-center gap-2 bg-white/[0.03] border border-white/8 px-3 py-2.5">
                <span className="font-['JetBrains_Mono'] text-[11px] text-white/70 truncate flex-1">
                  {address}
                </span>
                <button
                  onClick={copy}
                  className="flex-shrink-0 font-['JetBrains_Mono'] text-[10px] text-white/35 hover:text-white/70 transition-colors uppercase tracking-widest"
                >
                  {copied ? '✓' : 'Copy'}
                </button>
              </div>
              <p className="font-['JetBrains_Mono'] text-[10px] text-white/25 mt-1.5 tracking-wide">
                ~$0.50 is plenty. Balance: {fmt(balance)}
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-6 h-6 rounded-full border border-white/15 flex items-center justify-center">
              <span className="font-['JetBrains_Mono'] text-[10px] text-white/40">2</span>
            </div>
            <div className="flex-1">
              <p className="font-['JetBrains_Mono'] text-[11px] text-white/60 uppercase tracking-widest mb-1">
                Auto-sign is enabled
              </p>
              <p className="font-['JetBrains_Mono'] text-[10px] text-white/30 tracking-wide leading-relaxed">
                Once funded, all posts and likes sign instantly — no wallet popups.
                This address is stored only in your browser.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-6 h-6 rounded-full border border-white/15 flex items-center justify-center">
              <span className="font-['JetBrains_Mono'] text-[10px] text-white/40">3</span>
            </div>
            <div className="flex-1">
              <p className="font-['JetBrains_Mono'] text-[11px] text-white/60 uppercase tracking-widest mb-2">
                Withdraw anytime
              </p>
              <button
                onClick={handleWithdraw}
                disabled={!isActive || withdrawing || !mainAccount}
                className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest border border-white/15 px-4 py-2 text-white/50 hover:text-white/80 hover:border-white/35 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
              >
                {withdrawing ? 'Withdrawing…' : `Withdraw ${fmt(balance)} → main wallet`}
              </button>
              {!mainAccount && (
                <p className="font-['JetBrains_Mono'] text-[10px] text-white/25 mt-1.5 tracking-wide">
                  Connect your main wallet to withdraw
                </p>
              )}
            </div>
          </div>

        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 font-['JetBrains_Mono'] text-[10px] text-white/25 hover:text-white/60 transition-colors uppercase tracking-widest"
        >
          ✕
        </button>
      </motion.div>
    </div>
  )
}
