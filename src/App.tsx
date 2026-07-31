import { useState } from 'react'
import { motion } from 'framer-motion'
import OnboardingQuiz from './components/OnboardingQuiz'
import AdminLogin from './components/AdminLogin'
import AdminDashboard from './components/AdminDashboard'

type View = 'welcome' | 'onboarding' | 'admin' | 'dashboard'
type Theme = 'light' | 'dark'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

function Welcome({ onClient, onAdmin }: { onClient: () => void; onAdmin: () => void }) {
  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, scale: 0.92, y: 40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="brand"
        initial={{ opacity: 0, rotate: -8, scale: 0.6 }}
        animate={{ opacity: 1, rotate: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 160, damping: 14, delay: 0.15 }}
      >
        <span className="brand-icon">⬡</span>
      </motion.div>

      <motion.h1 variants={fadeUp} initial="hidden" animate="visible" custom={0.25}>
        Welcome to the Client Portal
      </motion.h1>

      <motion.p className="subtitle" variants={fadeUp} initial="hidden" animate="visible" custom={0.4}>
        Choose how you would like to sign in to continue.
      </motion.p>

      <div className="actions">
        <motion.button
          className="btn btn-client"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.55}
          whileHover={{ scale: 1.04, y: -3 }}
          whileTap={{ scale: 0.97 }}
          onClick={onClient}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Sign in as Client
          <span className="btn-arrow">→</span>
        </motion.button>

        <motion.button
          className="btn btn-admin"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.7}
          whileHover={{ scale: 1.04, y: -3 }}
          whileTap={{ scale: 0.97 }}
          onClick={onAdmin}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Sign in as Admin
          <span className="btn-arrow">→</span>
        </motion.button>
      </div>

      <motion.div className="footer" variants={fadeUp} initial="hidden" animate="visible" custom={0.85}>
        <span className="dot" /> Secure access &middot; Protected by SSO
      </motion.div>
    </motion.div>
  )
}

function App() {
  const [view, setView] = useState<View>('welcome')
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('dash-theme')
    return saved === 'dark' ? 'dark' : 'light'
  })

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light'
      localStorage.setItem('dash-theme', next)
      return next
    })
  }

  return (
    <div
      className={`welcome${view === 'dashboard' ? ' welcome-dash' : ''}${
        view === 'onboarding' ? ' welcome-chat' : ''
      }`}
      data-theme={view === 'dashboard' ? theme : undefined}
    >
      {view === 'welcome' && (
        <Welcome onClient={() => setView('onboarding')} onAdmin={() => setView('admin')} />
      )}

      {view === 'onboarding' && (
        <OnboardingQuiz onExit={() => setView('welcome')} onFinish={() => setView('welcome')} />
      )}

      {view === 'admin' && (
        <AdminLogin onLogin={() => setView('dashboard')} onBack={() => setView('welcome')} />
      )}

      {view === 'dashboard' && (
        <AdminDashboard theme={theme} onToggleTheme={toggleTheme} onLogout={() => setView('welcome')} />
      )}
    </div>
  )
}

export default App
