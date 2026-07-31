import { useState } from 'react'
import { motion } from 'framer-motion'

const ADMIN_ID = '@2005#'

function AdminLogin({ onLogin, onBack }: { onLogin: () => void; onBack: () => void }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)

  const submit = () => {
    if (value.trim() === ADMIN_ID) {
      sessionStorage.setItem('admin-authenticated', 'true')
      onLogin()
    } else {
      setError(true)
    }
  }

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, scale: 0.92, y: 40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="brand"
        initial={{ opacity: 0, rotate: -8, scale: 0.6 }}
        animate={{ opacity: 1, rotate: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 160, damping: 14, delay: 0.15 }}
      >
        <span className="brand-icon">⬡</span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.6 }}
      >
        Admin Access
      </motion.h1>

      <motion.p
        className="subtitle"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.6 }}
      >
        Enter your Admin ID to access the dashboard.
      </motion.p>

      <motion.div
        className="actions"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.6 }}
      >
        <input
          className={`quiz-input admin-id-input${error ? ' invalid' : ''}`}
          type="text"
          placeholder="Admin ID"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setError(false)
          }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          autoFocus
        />
        {error && <p className="quiz-error">Incorrect Admin ID. Please try again.</p>}

        <motion.button
          className="btn btn-admin"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={submit}
        >
          Access Dashboard
          <span className="btn-arrow">→</span>
        </motion.button>

        <button className="btn btn-ghost" onClick={onBack}>
          Back to home
        </button>
      </motion.div>
    </motion.div>
  )
}

export default AdminLogin
