import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../components/Layout'
import { BaseAvatar } from '../components/ConfessionCard'
import { shortAddress, timeAgo, copyToClipboard } from '../lib/utils'
import { fetchAllConfessions } from '../lib/contract'
import { useProfile, useFollowing, getFollowerCount, getStoredHue } from '../hooks/useProfile'
import toast from 'react-hot-toast'

// 8 preset avatar hues
const HUE_PRESETS = [220, 270, 320, 10, 45, 150, 190, 0]

function HuePicker({ current, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {HUE_PRESETS.map(hue => (
        <button
          key={hue}
          onClick={() => onChange(hue)}
          title={`Hue ${hue}`}
          className="w-7 h-7 rounded-full transition-all duration-200 hover:scale-110"
          style={{
            background: `hsl(${hue},60%,35%)`,
            border: current === hue ? '2px solid rgba(255,255,255,0.8)' : '2px solid transparent',
            boxShadow: current === hue ? `0 0 10px hsl(${hue},60%,35%)` : 'none',
          }}
        />
      ))}
    </div>
  )
}

function StatPill({ label, value }) {
  return (
    <div className="flex flex-col items-center gap-1 px-5 py-3 border border-white/8 glass-panel">
      <span className="font-['JetBrains_Mono'] text-[9px] uppercase tracking-[0.2em] text-white/30">{label}</span>
      <span className="font-['JetBrains_Mono'] text-base text-white/70">{value}</span>
    </div>
  )
}

export default function ProfilePage({ wallet }) {
  const { address } = useParams()
  const navigate = useNavigate()
  const { account } = wallet
  const isOwn = account?.toLowerCase() === address?.toLowerCase()

  // Profile persistence
  const profileStore = useProfile(address)
  const [profileData, setProfileData] = useState(profileStore.get())
  const following = useFollowing(account)
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)

  // Editable fields
  const [editingBio, setEditingBio] = useState(false)
  const [bioInput, setBioInput] = useState(profileData.bio)
  const [hue, setHue] = useState(profileData.avatarHue)
  const [copied, setCopied] = useState(false)

  // On-chain posts by this address
  const [confessions, setConfessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setFollowerCount(getFollowerCount(address))
    setFollowingCount(following.getList().length)
  }, [address])

  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetchAllConfessions()
      .then(all => {
        if (!mounted) return
        setConfessions(all.filter(c => c.author.toLowerCase() === address?.toLowerCase()))
      })
      .catch(() => { if (mounted) setConfessions([]) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [address])

  const handleHueChange = (h) => {
    setHue(h)
    profileStore.setAvatarHue(h)
    setProfileData(p => ({ ...p, avatarHue: h }))
    // Force localStorage to reflect new hue so avatars re-derive correctly
    localStorage.setItem(`ocw:hue:${address?.toLowerCase()}`, JSON.stringify(h))
  }

  const saveBio = () => {
    profileStore.setBio(bioInput)
    setProfileData(p => ({ ...p, bio: bioInput }))
    setEditingBio(false)
    toast.success('Bio saved.')
  }

  const copyAddress = async () => {
    await copyToClipboard(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const isFollowing = following.isFollowing(address)
  const toggleFollow = () => {
    if (isFollowing) {
      following.unfollow(address)
      setFollowerCount(n => Math.max(0, n - 1))
    } else {
      following.follow(address)
      setFollowerCount(n => n + 1)
    }
  }

  // Top-level only (no replies)
  const topLevel = confessions.filter(c => !c.text.startsWith('↩ #'))

  return (
    <Layout wallet={wallet}>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-5 py-10">

          {/* ── Profile card ─────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-7 mb-6"
          >
            <div className="flex gap-5 items-start">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-3">
                <BaseAvatar address={address} size={64} />
                {isOwn && (
                  <HuePicker current={hue} onChange={handleHueChange} />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                {/* Address row */}
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <button
                    onClick={copyAddress}
                    className="font-['JetBrains_Mono'] text-sm text-white/60 hover:text-white transition-colors tracking-wider"
                  >
                    {shortAddress(address)}
                  </button>
                  <AnimatePresence>
                    {copied && (
                      <motion.span
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="font-['JetBrains_Mono'] text-[10px] text-white/40 tracking-widest"
                      >
                        copied
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Follow button — shown when viewing someone else's profile */}
                  {!isOwn && account && (
                    <button
                      onClick={toggleFollow}
                      className={`font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest px-3 py-1 border transition-all ${
                        isFollowing
                          ? 'border-white/30 text-white/50 hover:border-red-500/40 hover:text-red-400/70'
                          : 'border-white/20 text-white/40 hover:border-white/50 hover:text-white/70'
                      }`}
                    >
                      {isFollowing ? 'Following' : '+ Follow'}
                    </button>
                  )}
                </div>

                {/* Stats */}
                <div className="flex gap-3 mb-4">
                  <StatPill label="Confessions" value={topLevel.length} />
                  <StatPill label="Following"   value={followingCount} />
                  <StatPill label="Followers"   value={followerCount}  />
                </div>

                {/* Bio */}
                {editingBio ? (
                  <div className="space-y-2">
                    <textarea
                      value={bioInput}
                      onChange={e => setBioInput(e.target.value)}
                      maxLength={160}
                      rows={3}
                      className="glass-input px-3 py-2 text-[13px] rounded-none w-full"
                      style={{ fontFamily: 'Geist' }}
                      placeholder="A line about yourself..."
                    />
                    <div className="flex gap-3">
                      <button onClick={saveBio} className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest text-white/50 border border-white/15 px-3 py-1 hover:border-white/40 transition-all">
                        Save
                      </button>
                      <button onClick={() => setEditingBio(false)} className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest text-white/25 hover:text-white/50 transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <p className="text-white/40 text-[13px] leading-relaxed flex-1" style={{ fontFamily: 'Geist' }}>
                      {profileData.bio || (isOwn ? 'No bio yet.' : '')}
                    </p>
                    {isOwn && (
                      <button
                        onClick={() => { setBioInput(profileData.bio); setEditingBio(true) }}
                        className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest text-white/20 hover:text-white/50 transition-colors flex-shrink-0"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* ── Confessions by this address ───────────────────── */}
          <div>
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/5">
              <span className="font-['Hanken_Grotesk'] text-sm font-light tracking-widest uppercase text-white/40">
                Confessions
              </span>
              {!loading && (
                <span className="font-['JetBrains_Mono'] text-[10px] text-white/20">
                  {topLevel.length}
                </span>
              )}
            </div>

            {loading && (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="glass-panel p-4 animate-pulse space-y-2">
                    <div className="h-2 bg-white/5 rounded-sm w-full" />
                    <div className="h-2 bg-white/5 rounded-sm w-3/5" />
                  </div>
                ))}
              </div>
            )}

            {!loading && topLevel.length === 0 && (
              <p className="font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.25em] text-white/18 text-center py-12">
                nothing here yet
              </p>
            )}

            {!loading && (
              <div className="space-y-3">
                {topLevel.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="glass-panel px-5 py-4"
                  >
                    <p className="text-white/65 text-[14px] leading-relaxed break-words" style={{ fontFamily: 'Geist' }}>
                      {c.text}
                    </p>
                    <p className="font-['JetBrains_Mono'] text-[10px] text-white/22 mt-2 tracking-wider">
                      {timeAgo(c.timestamp)}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
