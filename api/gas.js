import { ethers } from 'ethers'

const RPC_URL         = process.env.VITE_RPC_URL        || 'https://mainnet.base.org'
const CONTRACT_ADDRESS = process.env.VITE_CONTRACT_ADDRESS

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
    const provider  = new ethers.JsonRpcProvider(RPC_URL)
    const normalized = ethers.getAddress(address)

    const logs = await provider.getLogs({
      address: CONTRACT_ADDRESS,
      topics: [EVENT_SIG, null, ethers.zeroPadValue(normalized, 32)],
      fromBlock: 'earliest',
      toBlock:   'latest',
    })

    if (!logs.length) return res.json({ gwei: 0 })

    const receipts = await Promise.allSettled(
      logs.slice(-50).map(log => provider.getTransactionReceipt(log.transactionHash))
    )

    let totalWei = 0n
    for (const r of receipts) {
      if (r.status !== 'fulfilled' || !r.value) continue
      try { totalWei += r.value.gasUsed * r.value.gasPrice } catch {}
    }

    return res.json({ gwei: Number(ethers.formatUnits(totalWei, 'gwei')) })
  } catch (err) {
    return res.status(500).json({ error: err.message, gwei: 0 })
  }
}
