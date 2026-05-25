import { motion, AnimatePresence } from 'framer-motion'
import ConfessionCard from './ConfessionCard'

export default function ConfessionWall({
  confessions, loading, error, total, onRefresh,
  account, isOnBase, onReply, repliesTo,
}) {
  const topLevel = confessions.filter(c => !c.text.startsWith('↩ #'))

  return (
    <section className="flex flex-col h-full overflow-hidden">
      {/* Ledger header */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-white/5 z-10"
        style={{ background: 'rgba(10,10,10,0.8)', backdropFilter: 'blur(12px)' }}
      >
        <span
          className="uppercase tracking-widest text-white/70"
          style={{ fontFamily: 'Hanken Grotesk', fontSize: '13px', fontWeight: 300 }}
        >
          The Ledger
        </span>

        <div className="flex items-center gap-4">
          {!loading && total > 0 && (
            <span className="font-['JetBrains_Mono'] text-[10px] text-white/50 tracking-widest">
              {total.toLocaleString()} entries
            </span>
          )}

          {/* Manual refresh */}
          <button
            onClick={onRefresh}
            disabled={loading}
            title="Refresh"
            className="font-['JetBrains_Mono'] text-[10px] text-white/50 hover:text-white/80 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
          >
            {loading ? '…' : '↻'}
          </button>

          <span className={`w-1.5 h-1.5 rounded-full ${error ? 'bg-red-500' : 'bg-white/25 animate-pulse'}`} />
        </div>
      </div>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex-shrink-0 flex items-center justify-between px-5 py-2.5 bg-red-500/8 border-b border-red-500/15"
          >
            <span className="font-['JetBrains_Mono'] text-[10px] text-red-400/80 tracking-widest">
              RPC error — {error}
            </span>
            <button
              onClick={onRefresh}
              className="font-['JetBrains_Mono'] text-[10px] text-red-400/60 hover:text-red-400 uppercase tracking-widest transition-colors"
            >
              Retry
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scrollable feed */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>

        {loading && (
          <div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-3 px-5 py-5 border-b border-white/5 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-white/5 flex-shrink-0" />
                <div className="flex-1 space-y-2.5 pt-1">
                  <div className="h-2 bg-white/5 rounded-sm w-28" />
                  <div className="h-2 bg-white/5 rounded-sm w-full" />
                  <div className="h-2 bg-white/5 rounded-sm w-3/5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && topLevel.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center justify-center h-full min-h-[300px] px-8 gap-4"
          >
            <div className="w-px h-16 bg-gradient-to-b from-transparent via-white/15 to-transparent" />
            <p className="text-white/18 uppercase tracking-[0.3em]" style={{ fontFamily: 'JetBrains Mono', fontSize: '11px' }}>
              nothing here yet
            </p>
            <div className="w-px h-16 bg-gradient-to-b from-white/15 via-transparent to-transparent" />
          </motion.div>
        )}

        {!loading && (
          <AnimatePresence>
            {topLevel.map((confession, index) => (
              <ConfessionCard
                key={confession.id}
                confession={confession}
                index={index}
                account={account}
                isOnBase={isOnBase}
                onReply={onReply}
                repliesTo={repliesTo}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </section>
  )
}
