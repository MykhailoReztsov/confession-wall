const DOMAIN = { name: 'OnchainWall', version: '1', chainId: 8453 }
const TYPES  = {
  Like: [
    { name: 'confessionId', type: 'uint256' },
    { name: 'liker',        type: 'address'  },
    { name: 'timestamp',    type: 'uint256'  },
  ],
}

export async function fetchLikeCounts(confessionIds, likerAddress) {
  if (!confessionIds.length) return {}
  const params = new URLSearchParams({ ids: confessionIds.join(',') })
  if (likerAddress) params.set('liker', likerAddress.toLowerCase())
  const res = await fetch(`/api/likes?${params}`)
  if (!res.ok) return {}
  return res.json()
}

export async function signAndLike(signer, likerAddress, confessionId) {
  const timestamp = Math.floor(Date.now() / 1000)
  const signature = await signer.signTypedData(DOMAIN, TYPES, {
    confessionId: BigInt(confessionId),
    liker: likerAddress,
    timestamp:    BigInt(timestamp),
  })
  const res = await fetch('/api/likes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ confessionId, liker: likerAddress, signature, timestamp }),
  })
  if (!res.ok) throw new Error((await res.json()).error || 'Like failed')
  return res.json()
}
