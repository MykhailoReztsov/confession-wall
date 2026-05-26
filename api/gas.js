import { ethers } from 'ethers'

// Public Base RPC — no API key, but limited to 10,000 blocks per eth_getLogs call
const RPC_URL          = 'https://mainnet.base.org'
const CONTRACT_ADDRESS = process.env.VITE_CONTRACT_ADDRESS || '0x25DCf5f1c74b7c01c55d38E3bDd09eDc216c6d97'
const EVENT_SIG        = ethers.id('NewConfession(uint256,address,string,uint256)')
const CHUNK            = 9900    // just under the 10 000-block RPC limit
const PARALLEL         = 10     // concurrent getLogs requests per batch
const LOOKBACK         = 2_000_000  // ~46 days of Base blocks at 2 s/block

async function getLogsChunked(provider, filter, fromBlock, toBlock) {
  const chunks = []
  for (let f = fromBlock; f <= toBlock; f += CHUNK) {
    chunks.push([f, Math.min(f + CHUNK - 1, toBlock)])
  }
  const logs = []
  for (let i = 0; i < chunks.length; i += PARALLEL) {
    const batch = chunks.slice(i, i + PARALLEL)
    const results = await Promise.allSettled(
      batch.map(([from, to]) => provider.getLogs({ ...filter, fromBlock: from, toBlock: to }))
    )
    for (const r of results) {
      if (r.status === 'fulfilled') logs.push(...r.value)
    }
  }
  return logs
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { address } = req.query
  if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
    return res.status(400).json({ error: 'Invalid address', gwei: 0 })
  }

  try {
    const provider   = new ethers.JsonRpcProvider(RPC_URL)
    const normalized = ethers.getAddress(address)

    const currentBlock = await provider.getBlockNumber()
    const fromBlock    = Math.max(0, currentBlock - LOOKBACK)

    const filter = {
      address: CONTRACT_ADDRESS,
      topics:  [EVENT_SIG, null, ethers.zeroPadValue(normalized, 32)],
    }

    const logs = await getLogsChunked(provider, filter, fromBlock, currentBlock)

    if (!logs.length) return res.json({ gwei: 0, logs: 0 })

    const receipts = await Promise.allSettled(
      logs.slice(-50).map(log => provider.getTransactionReceipt(log.transactionHash))
    )

    let totalWei = 0n
    for (const r of receipts) {
      if (r.status !== 'fulfilled' || !r.value) continue
      try { totalWei += r.value.gasUsed * r.value.gasPrice } catch {}
    }

    return res.json({ gwei: Number(ethers.formatUnits(totalWei, 'gwei')), logs: logs.length })
  } catch (err) {
    console.error('[gas api]', err.message)
    return res.status(500).json({ error: err.message, gwei: 0 })
  }
}
