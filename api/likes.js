import { ethers } from 'ethers'

const REDIS_URL   = process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

async function redis(...cmd) {
  const res = await fetch(REDIS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(cmd),
  })
  const { result } = await res.json()
  return result
}

const DOMAIN = { name: 'OnchainWall', version: '1', chainId: 8453 }
const TYPES  = {
  Like: [
    { name: 'confessionId', type: 'uint256' },
    { name: 'liker',        type: 'address'  },
    { name: 'timestamp',    type: 'uint256'  },
  ],
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  // GET /api/likes?ids=0,1,2&liker=0xabc
  if (req.method === 'GET') {
    const ids    = (req.query.ids || '').split(',').map(s => s.trim()).filter(Boolean)
    const liker  = req.query.liker?.toLowerCase()
    if (!ids.length) return res.json({})

    const result = {}
    await Promise.all(ids.map(async (id) => {
      const count = await redis('SCARD', `likes:${id}`)
      const liked = liker ? !!(await redis('SISMEMBER', `likes:${id}`, liker)) : false
      result[id]  = { count: count || 0, liked }
    }))
    return res.json(result)
  }

  // POST /api/likes — record a like with EIP-712 proof
  if (req.method === 'POST') {
    const { confessionId, liker, signature, timestamp } = req.body || {}
    if (!confessionId == null || !liker || !signature || !timestamp) {
      return res.status(400).json({ error: 'Missing fields' })
    }

    // Reject stale timestamps (replay protection, ±5 min)
    const now = Math.floor(Date.now() / 1000)
    if (Math.abs(now - timestamp) > 300) {
      return res.status(400).json({ error: 'Timestamp expired' })
    }

    // Verify the EIP-712 signature
    let recovered
    try {
      recovered = ethers.verifyTypedData(DOMAIN, TYPES, {
        confessionId: BigInt(confessionId),
        liker,
        timestamp: BigInt(timestamp),
      }, signature)
    } catch {
      return res.status(401).json({ error: 'Invalid signature' })
    }

    if (recovered.toLowerCase() !== liker.toLowerCase()) {
      return res.status(401).json({ error: 'Signature mismatch' })
    }

    // SADD: Redis set — one address per confession, duplicates silently ignored
    const added = await redis('SADD', `likes:${confessionId}`, liker.toLowerCase())
    const count  = await redis('SCARD', `likes:${confessionId}`)
    return res.json({ added: added === 1, count })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
