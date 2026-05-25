import { motion } from 'framer-motion'
import { shortAddress } from '../lib/utils'

export default function WalletButton({ account, connecting, isOnBase, onConnect, onSwitchToBase }) {
  if (connecting) {
    return (
      <button disabled className="flex items-center gap-2 border border-white/20 px-5 py-2 text-white/40 font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest cursor-not-allowed">
        <span className="w-3.5 h-3.5 border border-white/30 border-t-white rounded-full animate-spin" />
        Connecting...
      </button>
    )
  }

  if (account && !isOnBase) {
    return (
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onSwitchToBase}
        className="flex items-center gap-2 border border-amber-500/50 px-5 py-2 text-amber-400 font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest hover:border-amber-400 hover:bg-amber-500/10 transition-all"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        Switch to Base
      </motion.button>
    )
  }

  if (account) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-2 border border-white/15 px-4 py-2 font-['JetBrains_Mono'] text-[10px] text-white/50 uppercase tracking-widest"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
        {shortAddress(account)}
      </motion.div>
    )
  }

  return (
    <motion.button
      whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
      whileTap={{ scale: 0.97 }}
      onClick={onConnect}
      className="flex items-center gap-2 border border-white/30 px-5 py-2 text-white font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest transition-all hover:border-white"
    >
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" />
        <path d="M16 12h5v4h-5a2 2 0 0 1 0-4z" />
      </svg>
      Connect Wallet
    </motion.button>
  )
}
