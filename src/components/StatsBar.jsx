import { motion } from 'framer-motion'
import { useBlockHeight } from '../hooks/useBlockHeight'

export default function StatsBar({ total, compact = false }) {
  const { blockHeight, flash } = useBlockHeight()

  const wrapClass = compact
    ? 'flex items-center gap-5 mt-3 opacity-40 hover:opacity-80 transition-opacity duration-500'
    : 'flex items-center gap-8 mt-10 opacity-45 hover:opacity-90 transition-opacity duration-500'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.7 }}
      className={wrapClass}
    >
      <Stat label="Network" value="Base" compact={compact} />
      <Sep />
      <Stat label="Block" value={blockHeight ? blockHeight.toLocaleString() : '—'} glow={flash} mono compact={compact} />
      <Sep />
      <Stat label="Confessions" value={total > 0 ? total.toLocaleString() : '0'} compact={compact} />
    </motion.div>
  )
}

function Stat({ label, value, glow, mono, compact }) {
  const labelCls = compact ? 'text-[9px]' : 'text-[10px]'
  const valueCls = compact ? 'text-[11px]' : 'text-sm'
  return (
    <div className="flex flex-col items-start gap-0.5">
      <span className={`font-['JetBrains_Mono'] ${labelCls} tracking-widest uppercase text-white/30`}>{label}</span>
      <span
        className={`font-['JetBrains_Mono'] ${valueCls} transition-all duration-300 ${mono ? 'tabular-nums' : ''} ${glow ? 'text-white' : 'text-white/55'}`}
        style={glow ? { textShadow: '0 0 10px rgba(255,255,255,0.8)' } : {}}
      >
        {value}
      </span>
    </div>
  )
}

function Sep() {
  return <div className="w-px h-6 bg-white/10" />
}
