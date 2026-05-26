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

export async function fetchProfile(address, myAddress) {
  const params = new URLSearchParams({ address })
  if (myAddress) params.set('myAddress', myAddress)
  const res = await fetch(`/api/social?${params}`)
  if (!res.ok) return { bio: '', followerCount: 0, followingCount: 0, isFollowing: false }
  return res.json()
}

export async function signAndSetBio(signer, address, bio) {
  const timestamp = Math.floor(Date.now() / 1000)
  const signature = await signer.signTypedData(DOMAIN, BIO_TYPES, {
    author: address, bio, timestamp: BigInt(timestamp),
  })
  const res = await fetch('/api/social', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'bio', address, bio, signature, timestamp }),
  })
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to save bio')
  return res.json()
}

export async function signAndFollow(signer, follower, following) {
  const timestamp = Math.floor(Date.now() / 1000)
  const signature = await signer.signTypedData(DOMAIN, FOLLOW_TYPES, {
    follower, following, action: 'follow', timestamp: BigInt(timestamp),
  })
  const res = await fetch('/api/social', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'follow', follower, following, signature, timestamp }),
  })
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to follow')
  return res.json()
}

export async function signAndUnfollow(signer, follower, following) {
  const timestamp = Math.floor(Date.now() / 1000)
  const signature = await signer.signTypedData(DOMAIN, FOLLOW_TYPES, {
    follower, following, action: 'unfollow', timestamp: BigInt(timestamp),
  })
  const res = await fetch('/api/social', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'unfollow', follower, following, signature, timestamp }),
  })
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to unfollow')
  return res.json()
}
