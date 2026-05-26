import { ethers } from 'ethers'

// Alchemy free tier limits eth_getLogs to 10 blocks — use the public Base RPC instead
const RPC_URL          = 'https://mainnet.base.org'
const CONTRACT_ADDRESS = process.env.VITE_CONTRACT_ADDRESS || '0x25DCf5f1c74b7c01c55d38E3bDd09eDc216c6d97'

const EVENT_SIG = ethers.id('NewConfession(uint256,address,string,uint256)')

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

    const logs = await provider.getLogs({
      address: CONTRACT_ADDRESS,
      topics:  [EVENT_SIG, null, ethers.zeroPadValue(normalized, 32)],
      fromBlock: 0,
      toBlock:   'latest',
    })

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
