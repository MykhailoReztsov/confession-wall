import { useCallback } from 'react'
import { useConfessions } from '../hooks/useConfessions'
import Layout from '../components/Layout'
import Hero from '../components/Hero'
import ConfessionForm from '../components/ConfessionForm'
import PermanenceWarning from '../components/PermanenceWarning'
import ConfessionWall from '../components/ConfessionWall'

export default function Home({ wallet }) {
  const { account, signer, isOnBase } = wallet
  const {
    confessions, loading, error, total,
    submitConfession, likePost, getGasEstimate, refresh, repliesTo,
  } = useConfessions(signer, account)

  const handleReply = useCallback((id, text) =>
    submitConfession(`↩ #${id}: ${text}`),
  [submitConfession])

  return (
    <Layout wallet={wallet} parallax>
      {/* Two-column split — both panels independently scroll */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT PANEL — post interface ─────────────────────── */}
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
            />
          </div>
        </div>

        {/* ── RIGHT PANEL — The Ledger (fixed, internal scroll) ─ */}
        <div className="flex-1 hidden md:flex flex-col overflow-hidden">
          <ConfessionWall
            confessions={confessions}
            loading={loading}
            error={error}
            total={total}
            account={account}
            isOnBase={isOnBase}
            onReply={handleReply}
            onLike={likePost}
            onRefresh={refresh}
            repliesTo={repliesTo}
          />
        </div>
      </div>

      {/* Mobile: ledger stacks below the form */}
      <div className="md:hidden border-t border-white/5 flex-1 overflow-y-auto">
        <ConfessionWall
          confessions={confessions}
          loading={loading}
          error={error}
          total={total}
          account={account}
          isOnBase={isOnBase}
          onReply={handleReply}
          onRefresh={refresh}
          repliesTo={repliesTo}
        />
      </div>
    </Layout>
  )
}
