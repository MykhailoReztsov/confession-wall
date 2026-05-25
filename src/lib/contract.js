import { ethers } from 'ethers'
import { CONFESSION_WALL_ABI } from './abi'

export const CONTRACT_ADDRESS =
  import.meta.env.VITE_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000'

export const BASE_CHAIN_ID = 8453
export const BASE_CHAIN_ID_HEX = '0x2105'

export const BASE_NETWORK = {
  chainId: BASE_CHAIN_ID_HEX,
  chainName: 'Base',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: [import.meta.env.VITE_RPC_URL || 'https://mainnet.base.org'],
  blockExplorerUrls: ['https://basescan.org'],
}

// Read-only provider for fetching confessions without a wallet
function getReadProvider() {
  return new ethers.JsonRpcProvider(
    import.meta.env.VITE_RPC_URL || 'https://mainnet.base.org'
  )
}

// Read-only contract instance — no signer needed
function getReadContract() {
  return new ethers.Contract(CONTRACT_ADDRESS, CONFESSION_WALL_ABI, getReadProvider())
}

// Write contract instance — requires a connected signer
function getWriteContract(signer) {
  return new ethers.Contract(CONTRACT_ADDRESS, CONFESSION_WALL_ABI, signer)
}

// Fetch all confessions, newest first.
// Uses getRange(0, total) which exists in every version of the contract.
export async function fetchAllConfessions() {
  const contract = getReadContract()
  const totalBn = await contract.total()
  const totalNum = Number(totalBn)
  if (totalNum === 0) return []
  const raw = await contract.getRange(0, totalNum)
  return parseConfessions(raw).reverse()
}

// Fetch a page of confessions (newest first via reverse indexing)
export async function fetchConfessionsPage(totalCount, page, pageSize = 20) {
  if (totalCount === 0) return []
  const contract = getReadContract()

  // Reverse-paginate: newest confessions have the highest index
  const end = totalCount - page * pageSize
  const start = Math.max(0, end - pageSize)
  const count = end - start

  if (count <= 0) return []

  const raw = await contract.getRange(start, count)
  return parseConfessions(raw).reverse()
}

// Get total confession count
export async function fetchTotal() {
  const contract = getReadContract()
  const total = await contract.total()
  return Number(total)
}

// Post a confession — returns the transaction hash on success
export async function postConfession(signer, text) {
  const contract = getWriteContract(signer)
  const tx = await contract.confess(text)
  const hash = tx.hash
  try { await tx.wait() } catch { /* tx succeeded on-chain; receipt polling failed */ }
  return hash
}

// Estimate gas cost for posting a confession in ETH
export async function estimateGasCost(signer, text) {
  try {
    const contract = getWriteContract(signer)
    const gasEstimate = await contract.confess.estimateGas(text)
    const feeData = await signer.provider.getFeeData()
    const gasPrice = feeData.gasPrice ?? BigInt(0)
    const costWei = gasEstimate * gasPrice
    const costEth = ethers.formatEther(costWei)
    return parseFloat(costEth).toFixed(6)
  } catch {
    return null
  }
}

// Normalize raw contract tuple arrays into plain objects
function parseConfessions(raw) {
  return raw.map((c) => ({
    id: Number(c.id),
    author: c.author,
    text: c.text,
    timestamp: Number(c.timestamp),
  }))
}
