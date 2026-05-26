import { ethers } from 'ethers'

const REDIS_URL   = process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

async function redis(...cmd) {
  const res = await fetch(REDIS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  })
  const { result } = await res.json()
  return result
}

const DOMAIN = { name: 'OnchainWall', version: '1', chainId: 8453 }

const BIO_TYPES = {
  Bio: [
    { name: 'author',    type: 'address' },
    { name: 'bio',       type: 'string'  },
    { name: 'timestamp', type: 'uint256' },
  ],
}

const FOLLOW_TYPES = {
  Follow: [
    { name: 'follower',  type: 'address' },
    { name: 'following', type: 'address' },
    { name: 'action',    type: 'string'  },
    { name: 'timestamp', type: 'uint256' },
  ],
}

const HUE_TYPES = {
  Hue: [
    { name: 'author',    type: 'address' },
    { name: 'hue',       type: 'uint256' },
    { name: 'timestamp', type: 'uint256' },
  ],
}

function stale(timestamp) {
  return Math.abs(Math.floor(Date.now() / 1000) - timestamp) > 300
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  // ── GET /api/social?address=0x...&myAddress=0x... ──────────────────────────
  if (req.method === 'GET') {
    const address   = req.query.address?.toLowerCase()
    const myAddress = req.query.myAddress?.toLowerCase()
    if (!address) return res.status(400).json({ error: 'Missing address' })

    const [bio, hue, followerCount, followingCount, isFollowing] = await Promise.all([
      redis('GET', `bio:${address}`),
      redis('GET', `hue:${address}`),
      redis('SCARD', `followers:${address}`),
      redis('SCARD', `following:${address}`),
      myAddress ? redis('SISMEMBER', `followers:${address}`, myAddress) : Promise.resolve(0),
    ])

    return res.json({
      bio:            bio || '',
      hue:            hue != null ? Number(hue) : null,
      followerCount:  followerCount || 0,
      followingCount: followingCount || 0,
      isFollowing:    !!isFollowing,
    })
  }

  // ── POST /api/social ───────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { type, timestamp } = req.body || {}
    if (stale(timestamp)) return res.status(400).json({ error: 'Timestamp expired' })

    // ── Set bio ──
    if (type === 'bio') {
      const { address, bio, signature } = req.body
      if (!address || bio == null || !signature) return res.status(400).json({ error: 'Missing fields' })

      let recovered
      try {
        recovered = ethers.verifyTypedData(DOMAIN, BIO_TYPES, {
          author: address, bio, timestamp: BigInt(timestamp),
        }, signature)
      } catch { return res.status(401).json({ error: 'Invalid signature' }) }

      if (recovered.toLowerCase() !== address.toLowerCase()) {
        return res.status(401).json({ error: 'Signature mismatch' })
      }

      await redis('SET', `bio:${address.toLowerCase()}`, bio)
      return res.json({ ok: true })
    }

    // ── Follow / unfollow ──
    if (type === 'follow' || type === 'unfollow') {
      const { follower, following, signature } = req.body
      if (!follower || !following || !signature) return res.status(400).json({ error: 'Missing fields' })

      let recovered
      try {
        recovered = ethers.verifyTypedData(DOMAIN, FOLLOW_TYPES, {
          follower, following, action: type, timestamp: BigInt(timestamp),
        }, signature)
      } catch { return res.status(401).json({ error: 'Invalid signature' }) }

      if (recovered.toLowerCase() !== follower.toLowerCase()) {
        return res.status(401).json({ error: 'Signature mismatch' })
      }

      const f  = follower.toLowerCase()
      const fg = following.toLowerCase()

      if (type === 'follow') {
        await Promise.all([
          redis('SADD', `following:${f}`, fg),
          redis('SADD', `followers:${fg}`, f),
        ])
      } else {
        await Promise.all([
          redis('SREM', `following:${f}`, fg),
          redis('SREM', `followers:${fg}`, f),
        ])
      }

      const [followerCount, followingCount] = await Promise.all([
        redis('SCARD', `followers:${fg}`),
        redis('SCARD', `following:${f}`),
      ])
      return res.json({ followerCount, followingCount })
    }

    // ── Set hue ──
    if (type === 'hue') {
      const { address, hue, signature } = req.body
      if (!address || hue == null || !signature) return res.status(400).json({ error: 'Missing fields' })
      if (!Number.isInteger(hue) || hue < 0 || hue > 359) return res.status(400).json({ error: 'Invalid hue' })

      let recovered
      try {
        recovered = ethers.verifyTypedData(DOMAIN, HUE_TYPES, {
          author: address, hue: BigInt(hue), timestamp: BigInt(timestamp),
        }, signature)
      } catch { return res.status(401).json({ error: 'Invalid signature' }) }

      if (recovered.toLowerCase() !== address.toLowerCase()) {
        return res.status(401).json({ error: 'Signature mismatch' })
      }

      await redis('SET', `hue:${address.toLowerCase()}`, hue)
      return res.json({ ok: true })
    }

    return res.status(400).json({ error: 'Unknown type' })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
