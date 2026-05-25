import { motion } from 'framer-motion'
import StatsBar from './StatsBar'

export default function Hero({ total }) {
  return (
    <section className="px-8 pt-10 pb-6 flex flex-col gap-3">
      <motion.h1
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="toxic-glow uppercase"
        style={{
          fontFamily: 'Hanken Grotesk',
          fontSize: 'clamp(28px, 4vw, 52px)',
          fontWeight: 200,
          letterSpacing: '0.14em',
          lineHeight: 1.1,
          color: '#e5e2e1',
        }}
      >
        Onchain Wall
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="text-white/60"
        style={{ fontFamily: 'Geist', fontSize: '14px', letterSpacing: '0.02em' }}
      >
        A permanent, decentralised wall of anonymous regret.
        <br />
        Nothing disappears.
      </motion.p>

      <StatsBar total={total} compact />
    </section>
  )
}
