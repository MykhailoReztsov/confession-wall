import { Link, useLocation } from 'react-router-dom'
import WalletButton from './WalletButton'

export default function Navbar({ account, connecting, isOnBase, connect, switchToBase }) {
  const { pathname } = useLocation()

  const links = [
    { label: 'The Ledger', to: '/' },
    { label: 'Profile',    to: account ? `/profile/${account}` : null, requiresWallet: true },
    { label: 'About',      to: '/about' },
  ]

  return (
    <nav
      className="flex-shrink-0 flex items-center justify-between px-6 sm:px-10 py-4 border-b border-white/5 relative z-50"
      style={{ background: 'rgba(10,10,10,0.6)', backdropFilter: 'blur(16px)' }}
    >
      {/* Brand */}
      <Link
        to="/"
        className="text-white tracking-tighter leading-none select-none hover:opacity-70 transition-opacity"
        style={{ fontFamily: 'Hanken Grotesk', fontSize: '20px', fontWeight: 300 }}
      >
        Onchain Wall
      </Link>

      {/* Nav links — desktop */}
      <ul className="hidden md:flex gap-7 items-center">
        {links.map(({ label, to, requiresWallet }) => {
          if (requiresWallet && !account) return null
          const active = to === '/' ? pathname === '/' : pathname.startsWith(to ?? '__none__')
          return (
            <li key={label}>
              {to ? (
                <Link
                  to={to}
                  className={`font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest transition-all duration-200 px-1 py-1 ${
                    active
                      ? 'text-white border-b border-white pb-0.5'
                      : 'text-white/35 hover:text-white/70'
                  }`}
                >
                  {label}
                </Link>
              ) : (
                <span className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest text-white/15 cursor-not-allowed px-1">
                  {label}
                </span>
              )}
            </li>
          )
        })}
      </ul>

      <WalletButton
        account={account}
        connecting={connecting}
        isOnBase={isOnBase}
        onConnect={connect}
        onSwitchToBase={switchToBase}
      />
    </nav>
  )
}
