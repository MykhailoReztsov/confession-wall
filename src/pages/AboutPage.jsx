import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'

const STEPS = [
  {
    n: '01',
    title: 'Connect',
    body: 'Link your wallet. No email, no account, no identity — just a cryptographic signature.',
  },
  {
    n: '02',
    title: 'Confess',
    body: 'Type up to 280 characters. One transaction. The words are written into a block and sealed.',
  },
  {
    n: '03',
    title: 'Forever',
    body: 'The Base blockchain has no delete function. Your confession outlives you, the app, and everyone who reads it.',
  },
]

const item = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}

export default function AboutPage({ wallet }) {
  const [visitorCount, setVisitorCount] = useState(null)

  useEffect(() => {
    fetch('/api/visitors')
      .then(r => r.json())
      .then(d => setVisitorCount(d.count))
      .catch(() => {})
  }, [])

  return (
    <Layout wallet={wallet}>
      <div className="flex-1 overflow-y-auto">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-2xl mx-auto px-6 py-16 space-y-16"
        >
          {/* ── Title ─── */}
          <motion.div variants={item} className="space-y-4">
            <p className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.3em] text-white/25">
              About
            </p>
            <h1
              className="toxic-glow uppercase"
              style={{
                fontFamily: 'Hanken Grotesk',
                fontSize: 'clamp(36px, 6vw, 68px)',
                fontWeight: 200,
                letterSpacing: '0.14em',
                lineHeight: 1.1,
                color: '#e5e2e1',
              }}
            >
              A permanent<br />wall of regret.
            </h1>

            {/* Unique wallet counter */}
            {visitorCount != null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-baseline gap-3 pt-2"
              >
                <span
                  className="font-['JetBrains_Mono'] text-white/70"
                  style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 200, letterSpacing: '0.05em' }}
                >
                  {visitorCount.toLocaleString()}
                </span>
                <span className="font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.25em] text-white/25">
                  unique wallets connected
                </span>
              </motion.div>
            )}
          </motion.div>

          {/* ── Description ─── */}
          <motion.div variants={item} className="space-y-4 border-l border-white/8 pl-6">
            <p className="text-white/55 text-[15px] leading-[1.8]" style={{ fontFamily: 'Geist' }}>
              Onchain Wall is a decentralised confession booth built on{' '}
              <span className="text-white/80">Base</span>. There is no company behind it,
              no moderation, no server, and no support team. Every confession is a
              transaction on a public blockchain — visible to anyone, editable by no one.
            </p>
            <p className="text-white/40 text-[14px] leading-[1.8]" style={{ fontFamily: 'Geist' }}>
              The smart contract has no owner function. The deployer cannot delete posts.
              No upgrade mechanism exists. What you write today will be readable in 2050.
              The truth outlives the confessor.
            </p>
          </motion.div>

          {/* ── How it works ─── */}
          <motion.div variants={item}>
            <p className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.25em] text-white/25 mb-8">
              How it works
            </p>
            <div className="space-y-0 divide-y divide-white/5">
              {STEPS.map(({ n, title, body }) => (
                <div key={n} className="flex gap-6 py-6 group">
                  <span
                    className="font-['JetBrains_Mono'] text-[11px] text-white/20 mt-0.5 flex-shrink-0 group-hover:text-white/50 transition-colors"
                    style={{ minWidth: '24px' }}
                  >
                    {n}
                  </span>
                  <div>
                    <p className="text-white/70 text-[14px] font-semibold mb-1" style={{ fontFamily: 'Geist' }}>
                      {title}
                    </p>
                    <p className="text-white/35 text-[13px] leading-relaxed" style={{ fontFamily: 'Geist' }}>
                      {body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── Technical ─── */}
          <motion.div variants={item} className="glass-panel px-6 py-6 space-y-3">
            <p className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.25em] text-white/25">
              Technical
            </p>
            {[
              ['Network',    'Base Mainnet (L2 on Ethereum)'],
              ['Contract',   import.meta.env.VITE_CONTRACT_ADDRESS || '0x000…000'],
              ['Language',   'Solidity 0.8.24'],
              ['Char limit', '280 bytes per confession'],
              ['Delete fn',  'Does not exist'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-[12px] border-b border-white/5 pb-2 last:border-0 last:pb-0">
                <span className="font-['JetBrains_Mono'] text-white/30 uppercase tracking-widest text-[10px]">{k}</span>
                <span className="font-['JetBrains_Mono'] text-white/55 text-[11px] text-right">{v}</span>
              </div>
            ))}
          </motion.div>

          {/* ── CTA + Twitter ─── */}
          <motion.div variants={item} className="flex flex-col items-center gap-5 pt-4">
            <Link
              to="/"
              className="inline-block font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.25em] text-white/30 border border-white/12 px-8 py-3 hover:border-white/35 hover:text-white/60 transition-all duration-300"
            >
              → Enter the Wall
            </Link>

            <a
              href="https://x.com/anderio_eth"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/20 hover:text-white/50 transition-colors duration-200"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.741l7.735-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              @anderio_eth
            </a>
          </motion.div>

        </motion.div>
      </div>
    </Layout>
  )
}
