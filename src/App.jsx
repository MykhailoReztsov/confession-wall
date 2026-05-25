import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useWallet } from './hooks/useWallet'
import Home from './pages/Home'
import ProfilePage from './pages/ProfilePage'
import AboutPage from './pages/AboutPage'

// Wallet state is lifted here so all pages share one connection
export default function App() {
  const wallet = useWallet()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"              element={<Home    wallet={wallet} />} />
        <Route path="/profile/:address" element={<ProfilePage wallet={wallet} />} />
        <Route path="/about"         element={<AboutPage wallet={wallet} />} />
        <Route path="*"              element={<Home    wallet={wallet} />} />
      </Routes>

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'rgba(10,10,10,0.95)',
            color: '#e5e2e1',
            border: '1px solid rgba(255,255,255,0.08)',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '11px',
            letterSpacing: '0.05em',
            borderRadius: '0',
            backdropFilter: 'blur(12px)',
          },
          success: { iconTheme: { primary: '#34d399', secondary: '#0a0a0a' } },
          error:   { iconTheme: { primary: '#f87171', secondary: '#0a0a0a' } },
        }}
      />
    </BrowserRouter>
  )
}
