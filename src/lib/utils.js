// Shorten 0x address to 0x1234...abcd format
export function shortAddress(address) {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// Human-readable relative time ("2 hours ago")
export function timeAgo(timestamp) {
  const now = Math.floor(Date.now() / 1000)
  const diff = now - timestamp

  if (diff < 60) return 'just now'
  if (diff < 3600) {
    const m = Math.floor(diff / 60)
    return `${m} ${m === 1 ? 'min' : 'mins'} ago`
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600)
    return `${h} ${h === 1 ? 'hour' : 'hours'} ago`
  }
  if (diff < 604800) {
    const d = Math.floor(diff / 86400)
    return `${d} ${d === 1 ? 'day' : 'days'} ago`
  }
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Copy text to clipboard, returns true on success
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

// Demo confessions shown when the contract wall is empty
export const DEMO_CONFESSIONS = [
  {
    id: 999,
    author: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    text: "I've been 'learning Rust' for three years and still haven't finished the book.",
    timestamp: Math.floor(Date.now() / 1000) - 7200,
    isDemo: true,
  },
  {
    id: 998,
    author: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    text: 'I told everyone I was early on BTC. I bought at the 2021 top.',
    timestamp: Math.floor(Date.now() / 1000) - 18000,
    isDemo: true,
  },
  {
    id: 997,
    author: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    text: "I have a hardware wallet but I still keep most of my ETH on Coinbase because I'm scared I'll lose the seed phrase.",
    timestamp: Math.floor(Date.now() / 1000) - 43200,
    isDemo: true,
  },
  {
    id: 996,
    author: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    text: 'I said "we are so back" when the market was recovering and then it crashed 40% the next day.',
    timestamp: Math.floor(Date.now() / 1000) - 86400,
    isDemo: true,
  },
  {
    id: 995,
    author: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    text: 'I panic-sold my entire portfolio during a flash crash and bought back 2 hours later at a higher price.',
    timestamp: Math.floor(Date.now() / 1000) - 172800,
    isDemo: true,
  },
  {
    id: 994,
    author: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    text: 'My NFT PFP has been a rug pull project for 18 months and I still use it because the art is actually fire.',
    timestamp: Math.floor(Date.now() / 1000) - 259200,
    isDemo: true,
  },
]
