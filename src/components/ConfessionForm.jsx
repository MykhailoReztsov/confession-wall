import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { copyToClipboard } from '../lib/utils'

const MAX = 280

export default function ConfessionForm({ account, isOnBase, onSubmit, onGetGasEstimate, sessionWallet, onOpenSessionModal }) {
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [gasEstimate, setGasEstimate] = useState(null)
  const [showStamp, setShowStamp] = useState(false)
  const [lastTxHash, setLastTxHash] = useState(null)

  const remaining = MAX - text.length
  const isOverLimit = remaining < 0
  const isEmpty = text.trim().length === 0
  const canSubmit = account && isOnBase && !isEmpty && !isOverLimit && !submitting

  // Debounced gas estimate
  useEffect(() => {
    if (!account || !isOnBase || isEmpty) { setGasEstimate(null); return }
    const t = setTimeout(async () => {
      const est = await onGetGasEstimate(text.trim())
      setGasEstimate(est)
    }, 600)
    return () => clearTimeout(t)
  }, [text, account, isOnBase])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    try {
      const txHash = await onSubmit(text.trim())
      setLastTxHash(txHash)
      setText('')
      setGasEstimate(null)
      setShowStamp(true)
      setTimeout(() => setShowStamp(false), 3000)
      toast.success('Confessed. Forever.', { icon: '⛓️' })
    } catch (err) {
      if (err.code === 4001 || err.message?.includes('rejected')) {
        toast.error('Transaction rejected.')
      } else {
        toast.error('Transaction failed. Try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopyTx = async () => {
    if (await copyToClipboard(lastTxHash)) toast.success('Tx hash copied!')
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-6 pb-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative group"
      >
        {/* Hover glow bloom */}
        <div className="absolute -inset-px bg-gradient-to-r from-transparent via-white/4 to-transparent blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />

        <form onSubmit={handleSubmit} className="glass-panel p-7 sm:p-9 relative z-10">
          {/* Label row */}
          <div className="flex items-center justify-between mb-5">
            <label
              htmlFor="confession"
              className="flex items-center gap-2.5 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/65"
            >
              <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-pulse" />
              Awaiting Input
            </label>

            {/* Wallet / network notice */}
            {!account && (
              <span className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest text-white/50">
                Connect wallet to post
              </span>
            )}
            {account && !isOnBase && (
              <span className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest text-amber-500/60">
                Switch to Base
              </span>
            )}
          </div>

          {/* Textarea */}
          <div className="relative">
            <textarea
              id="confession"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter your cryptographic penance..."
              disabled={!account || !isOnBase || submitting}
              rows={4}
              className={`glass-input p-4 text-[15px] leading-relaxed disabled:opacity-40 disabled:cursor-not-allowed ${
                isOverLimit ? 'border-b-red-500/60' : ''
              }`}
              style={{ fontFamily: 'Geist', letterSpacing: '-0.01em' }}
            />

            <span
              className={`absolute bottom-3 right-0 font-['JetBrains_Mono'] text-[10px] transition-colors ${
                isOverLimit ? 'text-red-400' : remaining <= 40 ? 'text-amber-400/70' : 'text-white/20'
              }`}
            >
              {remaining}
            </span>
          </div>

          {/* Gas + tx hash row */}
          <div className="flex items-center justify-between mt-3 min-h-[18px]">
            <AnimatePresence>
              {gasEstimate && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="font-['JetBrains_Mono'] text-[10px] text-white/50 tracking-widest"
                >
                  ~{gasEstimate} ETH gas
                </motion.span>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {lastTxHash && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={handleCopyTx}
                  className="font-['JetBrains_Mono'] text-[10px] text-white/50 tracking-widest hover:text-white/75 transition-colors flex items-center gap-1.5 group/tx ml-auto"
                >
                  <span>tx: {lastTxHash.slice(0, 10)}…</span>
                  <span className="opacity-0 group-hover/tx:opacity-100 transition-opacity">⎘</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Auto-sign status */}
          {onOpenSessionModal && (
            <div className="flex items-center justify-between mt-3">
              <button
                type="button"
                onClick={onOpenSessionModal}
                className="flex items-center gap-2 font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest text-white/25 hover:text-white/55 transition-colors"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${sessionWallet?.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-white/15'}`} />
                {sessionWallet?.isActive ? 'Auto-sign active' : 'Set up auto-sign'}
              </button>
            </div>
          )}

          {/* Submit button */}
          <div className="mt-6 pt-6 border-t border-white/5">
            <button
              type="submit"
              disabled={!canSubmit}
              className="btn-submit"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border border-black/30 border-t-black rounded-full animate-spin" />
                  Writing to chain...
                </>
              ) : (
                <>
                  Submit
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>

        {/* STORED FOREVER stamp */}
        <AnimatePresence>
          {showStamp && (
            <motion.div
              initial={{ opacity: 0, scale: 1.8, rotate: -15 }}
              animate={{ opacity: 1, scale: 1, rotate: -3 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 380, damping: 22 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
            >
              <div className="border-4 border-white/60 px-10 py-5 text-center -rotate-3">
                <div className="font-['Hanken_Grotesk'] font-black text-3xl tracking-widest uppercase text-white" style={{ textShadow: '0 0 20px rgba(255,255,255,0.5)' }}>
                  Stored
                </div>
                <div className="font-['Hanken_Grotesk'] font-black text-3xl tracking-widest uppercase text-white">
                  Forever
                </div>
                <div className="font-['JetBrains_Mono'] text-[10px] tracking-[0.3em] text-white/40 mt-1 uppercase">
                  On Base
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
