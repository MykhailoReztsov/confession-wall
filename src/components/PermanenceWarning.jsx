import { motion } from 'framer-motion'

export default function PermanenceWarning() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="max-w-3xl mx-auto px-6 py-6"
    >
      <div className="border-t border-b border-white/5 py-5 text-center">
        <motion.p
          animate={{ opacity: [0.5, 0.85, 0.5] }}
          transition={{ repeat: Infinity, duration: 3.5 }}
          className="font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.3em] text-white/40"
        >
          Everything posted here is permanent.&nbsp;&nbsp;Forever.
        </motion.p>
      </div>
    </motion.div>
  )
}
