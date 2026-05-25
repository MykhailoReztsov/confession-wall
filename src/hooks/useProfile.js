const NS = 'ocw:'

function load(key, fallback) {
  try {
    const v = localStorage.getItem(NS + key)
    return v !== null ? JSON.parse(v) : fallback
  } catch { return fallback }
}

function save(key, value) {
  try { localStorage.setItem(NS + key, JSON.stringify(value)) } catch {}
}

// Default avatar hue derived deterministically from address
export function defaultHue(address) {
  if (!address) return 220
  return parseInt(address.slice(2, 8), 16) % 360
}

// Profile data: bio + avatar hue for an address
export function useProfile(address) {
  const addr = address?.toLowerCase()

  function get() {
    return {
      bio: load(`bio:${addr}`, ''),
      avatarHue: load(`hue:${addr}`, defaultHue(address)),
    }
  }

  function setBio(text) { save(`bio:${addr}`, text) }
  function setAvatarHue(hue) { save(`hue:${addr}`, hue) }

  return { get, setBio, setAvatarHue }
}

// Read stored hue (no react state — used by avatar components)
export function getStoredHue(address) {
  return load(`hue:${address?.toLowerCase()}`, defaultHue(address))
}

// Following list for the currently connected wallet
export function useFollowing(myAddress) {
  const key = `following:${myAddress?.toLowerCase()}`

  function getList() {
    return load(key, [])
  }

  function follow(address) {
    const next = [...new Set([...getList(), address.toLowerCase()])]
    save(key, next)
  }

  function unfollow(address) {
    save(key, getList().filter(a => a !== address.toLowerCase()))
  }

  function isFollowing(address) {
    return getList().includes(address?.toLowerCase())
  }

  function count() {
    return getList().length
  }

  return { follow, unfollow, isFollowing, count, getList }
}

// Approximate follower count — scans localStorage for any following lists that include this address
export function getFollowerCount(address) {
  if (!address) return 0
  const addr = address.toLowerCase()
  let n = 0
  try {
    for (const k of Object.keys(localStorage)) {
      if (!k.startsWith(NS + 'following:')) continue
      try {
        const list = JSON.parse(localStorage.getItem(k) || '[]')
        if (Array.isArray(list) && list.includes(addr)) n++
      } catch {}
    }
  } catch {}
  return n
}
