import { useState, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useConfessions } from '../hooks/useConfessions'
import { useSessionWallet } from '../hooks/useSessionWallet'
import Layout from '../components/Layout'
import Hero from '../components/Hero'
import ConfessionForm from '../components/ConfessionForm'
import PermanenceWarning from '../components/PermanenceWarning'
import ConfessionWall from '../components/ConfessionWall'
import SessionWalletModal from '../components/SessionWalletModal'

export default function Home({ wallet }) {
  const { account, signer, isOnBase } = wallet
  const sessionWallet = useSessionWallet()

  const {
    confessions, loading, error, total,
    submitConfession, likePost, getGasEstimate, refresh, repliesTo,
  } = useConfessions(signer, account)

  const [showSessionModal, setShowSessionModal] = useState(false)

  const handleReply = useCallback((id, text) =>
    submitConfession(`↩ #${id}: ${text}`),
  [submitConfession])

  // Use session wallet for likes if available, otherwise fall back to MetaMask signer
  const handleLike = useCallback(async (confessionId) => {
    const likeSigner  = sessionWallet.signer || signer
    const likerAddr   = sessionWallet.address || account
    if (!likeSigner || !likerAddr) throw new Error('No signer available')
    await likePost(likeSigner, likerAddr, confessionId)
  }, [sessionWallet.signer, sessionWallet.address, signer, account, likePost])

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
              onSubmit={submitConfession}
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

      {/* Session wallet modal */}
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
