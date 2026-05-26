import { useState, useCallback, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useConfessions } from '../hooks/useConfessions'
import { useSessionWallet } from '../hooks/useSessionWallet'
import { postConfession } from '../lib/contract'
import Layout from '../components/Layout'
import Hero from '../components/Hero'
import ConfessionForm from '../components/ConfessionForm'
import PermanenceWarning from '../components/PermanenceWarning'
import ConfessionWall from '../components/ConfessionWall'
import SessionWalletModal from '../components/SessionWalletModal'

export default function Home({ wallet }) {
  const { account, signer, isOnBase } = wallet
  const sessionWallet = useSessionWallet()

  // Keep refs so callbacks always read the latest values without stale closures
  const sessionWalletRef = useRef(sessionWallet)
  sessionWalletRef.current = sessionWallet
  const signerRef = useRef(signer)
  signerRef.current = signer

  const likerAddress = sessionWallet.address || account

  const {
    confessions, loading, error, total,
    likePost, getGasEstimate, refresh, repliesTo,
  } = useConfessions(signer, likerAddress)

  const [showSessionModal, setShowSessionModal] = useState(false)

  // Picks the right signer at call time — no stale closure risk
  const handleSubmit = useCallback(async (text) => {
    const sw = sessionWalletRef.current
    const txSigner = sw.isActive ? sw.signer : signerRef.current
    if (!txSigner) throw new Error('No signer available')
    const txHash = await postConfession(txSigner, text)
    refresh()
    return txHash
  }, [refresh])

  const handleReply = useCallback((id, text) =>
    handleSubmit(`↩ #${id}: ${text}`),
  [handleSubmit])

  const handleLike = useCallback(async (confessionId) => {
    const sw = sessionWalletRef.current
    if (!sw.signer || !likerAddress) throw new Error('No signer available')
    await likePost(sw.signer, likerAddress, confessionId)
  }, [likerAddress, likePost])

  const wallProps = {
    confessions, loading, error, total,
    account, isOnBase,
    onReply: handleReply,
    onLike: handleLike,
    onRefresh: refresh,
    repliesTo,
  }

  return (
    <Layout wallet={wallet} parallax>
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT PANEL ── */}
        <div
          className="w-full md:w-[420px] lg:w-[480px] flex-shrink-0 flex flex-col overflow-y-auto border-r border-white/5"
          style={{ scrollbarWidth: 'none' }}
        >
          <Hero total={total} />
          <PermanenceWarning />

          <div className="px-4 pb-6">
            <ConfessionForm
              account={account}
              isOnBase={isOnBase}
              onSubmit={handleSubmit}
              onGetGasEstimate={getGasEstimate}
              sessionWallet={sessionWallet}
              onOpenSessionModal={() => setShowSessionModal(true)}
            />
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="flex-1 hidden md:flex flex-col overflow-hidden">
          <ConfessionWall {...wallProps} />
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden border-t border-white/5 flex-1 overflow-y-auto">
        <ConfessionWall {...wallProps} />
      </div>

      <AnimatePresence>
        {showSessionModal && (
          <SessionWalletModal
            sessionWallet={sessionWallet}
            mainAccount={account}
            onClose={() => setShowSessionModal(false)}
          />
        )}
      </AnimatePresence>
    </Layout>
  )
}
