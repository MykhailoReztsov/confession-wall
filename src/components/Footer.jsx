export default function Footer() {
  return (
    <footer className="w-full py-10 border-t border-white/5 backdrop-blur-sm relative z-10">
      <div className="flex flex-col md:flex-row justify-between items-center px-6 sm:px-12 max-w-[1440px] mx-auto gap-6 md:gap-0">
        <div
          className="text-white/25 tracking-widest uppercase"
          style={{ fontFamily: 'Hanken Grotesk', fontSize: '13px', fontWeight: 300, letterSpacing: '0.12em' }}
        >
          © Onchain Wall. The void remembers.
        </div>

        <ul className="flex gap-6 items-center flex-wrap justify-center">
          {[
            { label: 'Manifesto', href: '#' },
            { label: 'Terms of Penance', href: '#' },
            { label: 'Status: Immutable', href: '#', dot: true },
          ].map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest text-white/20 hover:text-white/50 transition-colors flex items-center gap-2"
              >
                {l.dot && <span className="w-1.5 h-1.5 rounded-full bg-white/30 shadow-[0_0_6px_rgba(255,255,255,0.3)]" />}
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  )
}
