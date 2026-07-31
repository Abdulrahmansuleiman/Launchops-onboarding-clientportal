import { useState } from 'react'
import { motion } from 'framer-motion'
import OnboardingQuiz from './components/OnboardingQuiz'
import AdminLogin from './components/AdminLogin'
import AdminDashboard from './components/AdminDashboard'

type View = 'welcome' | 'onboarding' | 'admin' | 'dashboard'
type Theme = 'light' | 'dark'

function RocketIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function Welcome({ onClient, onAdmin }: { onClient: () => void; onAdmin: () => void }) {
  return (
    <div className="lp">
      <header className="lp-header">
        <div className="lp-brand">
          <span className="lp-logo">
            <RocketIcon />
          </span>
          <span className="lp-name">LaunchOps</span>
        </div>
        <button className="lp-admin-link" onClick={onAdmin} type="button">
          <ShieldIcon />
          Admin
        </button>
      </header>

      <main className="lp-main">
        <section className="lp-intro">
          <span className="lp-badge">Client onboarding</span>
          <h1 className="lp-title">
            Get your business set up with LaunchOps.
          </h1>
          <p className="lp-desc">
            Tell us about your business, your goals, and how you run things today.
            It takes about 2 minutes, and it means your LaunchOps team can start
            working for you without a long back and forth.
          </p>
        </section>

        <section className="lp-cards">
          <motion.button
            className="lp-card"
            onClick={onClient}
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="lp-card-icon">
              <RocketIcon />
            </span>
            <span className="lp-card-text">
              <span className="lp-card-title">Start onboarding</span>
              <span className="lp-card-desc">
                Fill this in and you're done in about 2 minutes.
              </span>
            </span>
            <svg className="lp-card-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </motion.button>

          <motion.button
            className="lp-card"
            onClick={onAdmin}
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="lp-card-icon">
              <ShieldIcon />
            </span>
            <span className="lp-card-text">
              <span className="lp-card-title">Admin dashboard</span>
              <span className="lp-card-desc">
                View and manage every onboarding submission.
              </span>
            </span>
            <svg className="lp-card-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </motion.button>
        </section>
      </main>
    </div>
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
      className={`welcome${view === 'welcome' ? ' welcome-landing' : ''}${
        view === 'dashboard' ? ' welcome-dash' : ''
      }${view === 'onboarding' ? ' welcome-chat' : ''}`}
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
