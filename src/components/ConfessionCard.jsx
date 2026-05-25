import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { shortAddress, timeAgo } from '../lib/utils'
import { getStoredHue } from '../hooks/useProfile'

// ─── Avatar ───────────────────────────────────────────────────────────────────
export function BaseAvatar({ address, size = 36, clickable = false, onClick }) {
  const hue = getStoredHue(address)
  return (
    <button
      type="button"
      disabled={!clickable}
      onClick={onClick}
      title={clickable ? `View ${shortAddress(address)}'s profile` : undefined}
      className={`rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
        clickable ? 'cursor-pointer hover:scale-110 hover:ring-2 ring-white/20' : 'cursor-default'
      }`}
      style={{
        width: size,
        height: size,
        background: `hsl(${hue},40%,10%)`,
        border: `1.5px solid hsl(${hue},40%,22%)`,
      }}
    >
      <svg viewBox="0 0 20 20" style={{ width: size * 0.5, height: size * 0.5 }} fill="none">
        <path
          d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm1 11H7V7h4c1.66 0 3 1.34 3 3s-1.34 3-3 3z"
          fill={`hsl(${hue},60%,58%)`}
        />
      </svg>
    </button>
  )
}

// ─── Compact reply card (no further nesting) ──────────────────────────────────
function ReplyCard({ confession }) {
  const navigate = useNavigate()
  return (
    <div className="flex gap-2.5 pl-4 border-l border-white/8 ml-1 py-2">
      <BaseAvatar
        address={confession.author}
        size={28}
        clickable
        onClick={() => navigate(`/profile/${confession.author}`)}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-['JetBrains_Mono'] text-[10px] text-white/55 tracking-wider">
            {shortAddress(confession.author)}
          </span>
          <span className="text-white/30 text-[10px]">·</span>
          <span className="font-['JetBrains_Mono'] text-[10px] text-white/40">
            {timeAgo(confession.timestamp)}
          </span>
        </div>
        {/* Strip the "↩ #ID: " prefix for display */}
        <p className="text-white/80 text-[14px] leading-relaxed break-words"
           style={{ fontFamily: 'Geist' }}>
          {confession.text.replace(/^↩ #\d+: /, '')}
        </p>
      </div>
    </div>
  )
}

// ─── Reply compose form ───────────────────────────────────────────────────────
function ReplyForm({ onSubmit, onCancel, disabled }) {
  const [text, setText] = useState('')
  const remaining = 260 - text.length

  const submit = (e) => {
    e.preventDefault()
    if (text.trim() && remaining >= 0) onSubmit(text.trim())
  }

  return (
    <form onSubmit={submit} className="pl-4 border-l border-white/8 ml-1 pt-3">
      <div className="relative">
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a reply..."
          rows={2}
          disabled={disabled}
          className="glass-input px-3 py-2 text-[13px] rounded-none disabled:opacity-40"
          style={{ fontFamily: 'Geist' }}
        />
        <span className={`absolute bottom-2 right-0 font-['JetBrains_Mono'] text-[9px] ${remaining < 0 ? 'text-red-400' : 'text-white/20'}`}>
          {remaining}
        </span>
      </div>
      <div className="flex gap-4 mt-2">
        <button type="button" onClick={onCancel}
          className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest text-white/25 hover:text-white/55 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={!text.trim() || remaining < 0 || disabled}
          className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest text-white/50 border border-white/15 px-3 py-1 hover:border-white/40 hover:text-white/80 disabled:opacity-25 disabled:cursor-not-allowed transition-all">
          {disabled ? 'Posting…' : 'Reply'}
        </button>
      </div>
    </form>
  )
}

// ─── Main confession card ─────────────────────────────────────────────────────
export default function ConfessionCard({ confession, index, account, isOnBase, onReply, onLike, repliesTo }) {
  const navigate = useNavigate()
  const [repliesOpen, setRepliesOpen] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [liking, setLiking] = useState(false)

  const replies = repliesTo ? repliesTo(confession.id) : []
  const canReply = account && isOnBase
  const canLike = account && isOnBase && !confession.liked

  const handleLike = async () => {
    if (!onLike || liking || !canLike) return
    setLiking(true)
    try { await onLike(confession.id) } catch {}
    finally { setLiking(false) }
  }

  const handleReply = async (text) => {
    setSubmitting(true)
    try {
      await onReply(confession.id, text)
      setShowForm(false)
      setRepliesOpen(true)
    } catch {}
    finally { setSubmitting(false) }
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.03, 0.18) }}
      className="border-b border-white/5 px-5 py-5 hover:bg-white/[0.01] transition-colors"
    >
      {/* ── Post header + body ── */}
      <div className="flex gap-3">
        <BaseAvatar
          address={confession.author}
          size={36}
          clickable
          onClick={() => navigate(`/profile/${confession.author}`)}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <button
              onClick={() => navigate(`/profile/${confession.author}`)}
              className="font-['JetBrains_Mono'] text-[10px] text-white/60 tracking-wider hover:text-white/85 transition-colors"
            >
              {shortAddress(confession.author)}
            </button>
            <span className="text-white/15 text-[10px]">·</span>
            <span className="font-['JetBrains_Mono'] text-[10px] text-white/45">
              {timeAgo(confession.timestamp)}
            </span>
          </div>

          <p className="text-white/90 text-[15px] leading-relaxed break-words whitespace-pre-wrap"
             style={{ fontFamily: 'Geist', letterSpacing: '0.01em' }}>
            {confession.text}
          </p>

          {/* ── Action row ── */}
          <div className="flex items-center gap-5 mt-3">
            {/* Like button */}
            <button
              onClick={handleLike}
              disabled={liking || !account || !isOnBase}
              title={confession.liked ? 'Already liked' : !account ? 'Connect wallet to like' : ''}
              className={`flex items-center gap-1.5 font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest transition-all ${
                confession.liked
                  ? 'text-red-400/80 cursor-default'
                  : account && isOnBase
                    ? 'text-white/45 hover:text-red-400/70 cursor-pointer'
                    : 'text-white/20 cursor-default'
              } disabled:opacity-60`}
            >
              <svg
                className={`w-3 h-3 transition-transform ${liking ? 'scale-125' : ''}`}
                viewBox="0 0 24 24"
                fill={confession.liked ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {confession.likeCount > 0 && <span>{confession.likeCount}</span>}
            </button>
            {/* Replies toggle */}
            <button
              onClick={() => setRepliesOpen(v => !v)}
              className="flex items-center gap-1.5 font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest text-white/45 hover:text-white/75 transition-colors"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Replies
              {replies.length > 0 && (
                <span className="text-white/40">({replies.length})</span>
              )}
              <span className="text-white/20">{repliesOpen ? '▲' : '▼'}</span>
            </button>

            {/* Reply compose trigger */}
            {canReply && (
              <button
                onClick={() => { setShowForm(v => !v); setRepliesOpen(true) }}
                className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest text-white/45 hover:text-white/75 transition-colors"
              >
                + Reply
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Expandable replies section ── */}
      <AnimatePresence>
        {repliesOpen && (
          <motion.div
            key="replies"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden mt-3 ml-[48px] space-y-2"
          >
            {replies.length === 0 && !showForm && (
              <p className="font-['JetBrains_Mono'] text-[10px] text-white/40 tracking-widest pl-4 border-l border-white/15 ml-1 py-2">
                no replies yet
              </p>
            )}

            {replies.map((r) => (
              <ReplyCard key={r.id} confession={r} />
            ))}

            {showForm && (
              <ReplyForm
                onSubmit={handleReply}
                onCancel={() => setShowForm(false)}
                disabled={submitting}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  )
}
