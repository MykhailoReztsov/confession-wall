import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ethers } from 'ethers'
import Layout from '../components/Layout'
import { BaseAvatar } from '../components/ConfessionCard'
import { shortAddress, timeAgo, copyToClipboard } from '../lib/utils'
import { fetchAllConfessions, fetchGasBurnedByAddress } from '../lib/contract'
import { defaultHue, getStoredHue } from '../hooks/useProfile'
import { fetchProfile, signAndSetBio, signAndSetHue, signAndFollow, signAndUnfollow } from '../lib/social'
import toast from 'react-hot-toast'

const HUE_PRESETS = [220, 270, 320, 10, 45, 150, 190, 0]

function HuePicker({ current, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {HUE_PRESETS.map(hue => (
        <button
          key={hue}
          onClick={() => onChange(hue)}
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

// Counts up from 0 to `to` over `duration` ms
function CountUp({ to, format = v => v, duration = 1200 }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (to == null || to === 0) return
    const start = Date.now()
    const target = Number(to)
    const tick = () => {
      const t = Math.min((Date.now() - start) / duration, 1)
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
      setVal(Math.floor(eased * target))
      if (t < 1) requestAnimationFrame(tick)
      else setVal(target)
    }
    requestAnimationFrame(tick)
  }, [to, duration])
  return <>{format(val)}</>
}

function StatPill({ label, value, loading: lding }) {
  return (
    <div className="flex flex-col items-center gap-1 px-5 py-3 border border-white/8 glass-panel">
      <span className="font-['JetBrains_Mono'] text-[9px] uppercase tracking-[0.2em] text-white/30">{label}</span>
      <span className="font-['JetBrains_Mono'] text-base text-white/70">
        {lding ? <span className="text-white/25">…</span> : value}
      </span>
    </div>
  )
}

function GasPill({ weiValue, loading: lding }) {
  const gwei = weiValue != null ? Number(ethers.formatUnits(weiValue, 'gwei')) : null
  const gweiRounded = gwei != null ? (gwei >= 100 ? Math.round(gwei) : Math.round(gwei * 10) / 10) : null
  return (
    <div className="flex flex-col items-center gap-1 px-5 py-3 border border-white/8 glass-panel">
      <span className="font-['JetBrains_Mono'] text-[9px] uppercase tracking-[0.2em] text-white/30">Gas Burned</span>
      <span className="font-['JetBrains_Mono'] text-base text-white/70">
        {lding
          ? <span className="text-white/25">…</span>
          : gweiRounded == null
            ? '—'
            : gweiRounded === 0
              ? <span className="text-white/30">0 <span className="text-[10px]">gwei</span></span>
              : <><CountUp to={gweiRounded} duration={1400} format={v => v.toLocaleString()} />{' '}
                <span className="text-[10px] text-white/35">gwei</span></>
        }
      </span>
    </div>
  )
}

export default function ProfilePage({ wallet }) {
  const { address }  = useParams()
  const navigate     = useNavigate()
  const { account, signer } = wallet
  const isOwn        = account?.toLowerCase() === address?.toLowerCase()

  // Profile data from backend
  const [profile, setProfile]   = useState({ bio: '', followerCount: 0, followingCount: 0, isFollowing: false })
  const [profileLoading, setProfileLoading] = useState(true)

  // Avatar hue — backed by Redis, cached in localStorage
  const [hue, setHue]             = useState(() => getStoredHue(address))
  const [savingHue, setSavingHue] = useState(false)
  const [hueDirty, setHueDirty]   = useState(false)

  // Bio editing
  const [editingBio, setEditingBio] = useState(false)
  const [bioInput, setBioInput]     = useState('')
  const [savingBio, setSavingBio]   = useState(false)

  // Follow state
  const [following, setFollowing]   = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  // Confessions
  const [confessions, setConfessions] = useState([])
  const [loadingPosts, setLoadingPosts] = useState(true)

  // Gas burned
  const [gasBurned, setGasBurned]       = useState(null)
  const [gasLoading, setGasLoading]     = useState(true)

  const [copied, setCopied] = useState(false)

  // Load profile from backend
  const loadProfile = useCallback(async () => {
    setProfileLoading(true)
    try {
      const data = await fetchProfile(address, account)
      setProfile(data)
      setFollowing(data.isFollowing)
      setBioInput(data.bio)
      if (data.hue != null) {
        setHue(data.hue)
        localStorage.setItem(`ocw:hue:${address?.toLowerCase()}`, JSON.stringify(data.hue))
      }
    } catch {}
    finally { setProfileLoading(false) }
  }, [address, account])

  useEffect(() => { loadProfile() }, [loadProfile])

  // Load on-chain confessions
  useEffect(() => {
    let alive = true
    setLoadingPosts(true)
    fetchAllConfessions()
      .then(all => { if (alive) setConfessions(all.filter(c => c.author.toLowerCase() === address?.toLowerCase())) })
      .catch(() => { if (alive) setConfessions([]) })
      .finally(() => { if (alive) setLoadingPosts(false) })
    return () => { alive = false }
  }, [address])

  // Load gas burned separately (slower — needs receipts)
  useEffect(() => {
    if (!address) return
    let alive = true
    setGasLoading(true)
    fetchGasBurnedByAddress(address)
      .then(val => { if (alive) setGasBurned(val) })
      .catch(() => { if (alive) setGasBurned(0n) })
      .finally(() => { if (alive) setGasLoading(false) })
    return () => { alive = false }
  }, [address])

  const handleHueChange = (h) => {
    setHue(h)
    setHueDirty(true)
    localStorage.setItem(`ocw:hue:${address?.toLowerCase()}`, JSON.stringify(h))
  }

  const saveHue = async () => {
    if (!signer) return toast.error('Connect wallet to save avatar')
    setSavingHue(true)
    try {
      await signAndSetHue(signer, account, hue)
      setHueDirty(false)
      toast.success('Avatar saved.')
    } catch (err) {
      if (err.message?.includes('rejected') || err.code === 4001) {
        toast.error('Signature rejected.')
      } else {
        toast.error('Failed to save avatar.')
      }
    } finally { setSavingHue(false) }
  }

  const saveBio = async () => {
    if (!signer) return toast.error('Connect wallet to update bio')
    setSavingBio(true)
    try {
      await signAndSetBio(signer, account, bioInput)
      setProfile(p => ({ ...p, bio: bioInput }))
      setEditingBio(false)
      toast.success('Bio saved.')
    } catch (err) {
      if (err.message?.includes('rejected') || err.code === 4001) {
        toast.error('Signature rejected.')
      } else {
        toast.error('Failed to save bio.')
      }
    } finally { setSavingBio(false) }
  }

  const toggleFollow = async () => {
    if (!signer || !account) return toast.error('Connect wallet to follow')
    setFollowLoading(true)
    const wasFollowing = following
    setFollowing(!wasFollowing)
    setProfile(p => ({
      ...p,
      followerCount: wasFollowing ? p.followerCount - 1 : p.followerCount + 1,
    }))
    try {
      if (wasFollowing) {
        await signAndUnfollow(signer, account, address)
      } else {
        await signAndFollow(signer, account, address)
      }
    } catch (err) {
      setFollowing(wasFollowing)
      setProfile(p => ({
        ...p,
        followerCount: wasFollowing ? p.followerCount + 1 : p.followerCount - 1,
      }))
      if (err.message?.includes('rejected') || err.code === 4001) {
        toast.error('Signature rejected.')
      } else {
        toast.error('Failed.')
      }
    } finally { setFollowLoading(false) }
  }

  const copyAddress = async () => {
    await copyToClipboard(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const topLevel = confessions.filter(c => !c.text.startsWith('↩ #'))
  const oldest   = topLevel.length
    ? topLevel.reduce((a, b) => a.timestamp < b.timestamp ? a : b)
    : null

  return (
    <Layout wallet={wallet}>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-5 py-10">

          {/* ── Profile card ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-7 mb-6"
          >
            <div className="flex gap-5 items-start">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-3">
                <BaseAvatar address={address} size={64} hueOverride={hue} />
                {isOwn && (
                  <div className="flex flex-col items-center gap-2">
                    <HuePicker current={hue} onChange={handleHueChange} />
                    {hueDirty && (
                      <button
                        onClick={saveHue}
                        disabled={savingHue}
                        className="font-['JetBrains_Mono'] text-[9px] uppercase tracking-widest text-white/40 border border-white/12 px-2 py-0.5 hover:border-white/35 hover:text-white/60 transition-all disabled:opacity-40"
                      >
                        {savingHue ? 'Signing…' : 'Save avatar'}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                {/* Address + follow */}
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

                  {!isOwn && account && (
                    <button
                      onClick={toggleFollow}
                      disabled={followLoading}
                      className={`font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest px-3 py-1 border transition-all disabled:opacity-40 ${
                        following
                          ? 'border-white/30 text-white/50 hover:border-red-500/40 hover:text-red-400/70'
                          : 'border-white/20 text-white/40 hover:border-white/50 hover:text-white/70'
                      }`}
                    >
                      {followLoading ? '…' : following ? 'Following' : '+ Follow'}
                    </button>
                  )}
                </div>

                {/* Stats */}
                <div className="flex gap-3 mb-4 flex-wrap">
                  <StatPill label="Confessions" value={topLevel.length} />
                  <StatPill label="Following"   value={profileLoading ? undefined : profile.followingCount} loading={profileLoading} />
                  <StatPill label="Followers"   value={profileLoading ? undefined : profile.followerCount}  loading={profileLoading} />
                  <GasPill  weiValue={gasBurned} loading={gasLoading} />
                  <StatPill
                    label="Oldest"
                    value={oldest ? timeAgo(oldest.timestamp) : '—'}
                    loading={loadingPosts}
                  />
                </div>

                {/* Bio */}
                {editingBio ? (
                  <div className="space-y-2">
                    <textarea
                      value={bioInput}
                      onChange={e => setBioInput(e.target.value)}
                      maxLength={160}
                      rows={3}
                      disabled={savingBio}
                      className="glass-input px-3 py-2 text-[13px] rounded-none w-full disabled:opacity-40"
                      style={{ fontFamily: 'Geist' }}
                      placeholder="A line about yourself..."
                    />
                    <div className="flex gap-3 items-center">
                      <button
                        onClick={saveBio}
                        disabled={savingBio}
                        className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest text-white/50 border border-white/15 px-3 py-1 hover:border-white/40 transition-all disabled:opacity-40"
                      >
                        {savingBio ? 'Signing…' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditingBio(false)}
                        disabled={savingBio}
                        className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest text-white/25 hover:text-white/50 transition-colors"
                      >
                        Cancel
                      </button>
                      <span className="font-['JetBrains_Mono'] text-[9px] text-white/20 ml-auto">
                        Requires wallet signature
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <p className="text-white/50 text-[13px] leading-relaxed flex-1" style={{ fontFamily: 'Geist' }}>
                      {profile.bio || (isOwn ? 'No bio yet.' : '')}
                    </p>
                    {isOwn && (
                      <button
                        onClick={() => { setBioInput(profile.bio); setEditingBio(true) }}
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

          {/* ── Confessions ── */}
          <div>
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/5">
              <span className="font-['Hanken_Grotesk'] text-sm font-light tracking-widest uppercase text-white/40">
                Confessions
              </span>
              {!loadingPosts && (
                <span className="font-['JetBrains_Mono'] text-[10px] text-white/20">{topLevel.length}</span>
              )}
            </div>

            {loadingPosts && (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="glass-panel p-4 animate-pulse space-y-2">
                    <div className="h-2 bg-white/5 rounded-sm w-full" />
                    <div className="h-2 bg-white/5 rounded-sm w-3/5" />
                  </div>
                ))}
              </div>
            )}

            {!loadingPosts && topLevel.length === 0 && (
              <p className="font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.25em] text-white/18 text-center py-12">
                nothing here yet
              </p>
            )}

            {!loadingPosts && (
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
