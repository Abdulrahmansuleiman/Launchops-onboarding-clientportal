import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { onboardingQuestions, type OnboardingQuestion } from '../data/onboardingQuestions'

type Answer = string | string[] | Record<string, string>

const DRAFT_KEY = 'client-onboarding-draft'

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 60, scale: 0.98 }),
  center: { opacity: 1, x: 0, scale: 1 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -60, scale: 0.98 }),
}

function isValid(question: OnboardingQuestion, answer: Answer | undefined): boolean {
  if (answer === undefined) return false
  if (question.type === 'multi') return Array.isArray(answer) && answer.length > 0
  if (question.type === 'group') {
    const obj = answer as Record<string, string>
    return question.fields!.every((field) => obj[field.key]?.trim())
  }
  const value = String(answer).trim()
  if (!value) return false
  if (question.inputType === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  if (question.inputType === 'url') return /^https?:\/\//.test(value)
  return true
}

function loadDraft(): { answers: Record<number, Answer>; step: number } | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const answers = JSON.parse(raw) as Record<number, Answer>
    let step = 0
    for (const q of onboardingQuestions) {
      if (!isValid(q, answers[q.id])) break
      step++
    }
    if (step >= onboardingQuestions.length) return null
    return { answers, step }
  } catch {
    return null
  }
}

function OnboardingQuiz({ onFinish, onExit }: { onFinish: () => void; onExit: () => void }) {
  const [draft] = useState(loadDraft)
  const [step, setStep] = useState(draft?.step ?? 0)
  const [direction, setDirection] = useState(1)
  const [answers, setAnswers] = useState<Record<number, Answer>>(draft?.answers ?? {})
  const [error, setError] = useState(false)
  const [done, setDone] = useState(false)
  const [reference, setReference] = useState('')

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(answers))
  }, [answers])

  const total = onboardingQuestions.length
  const question = onboardingQuestions[step]
  const answer = answers[question.id]
  const progress = ((step + 1) / total) * 100

  const goNext = () => {
    if (!isValid(question, answer)) {
      setError(true)
      return
    }
    setError(false)
    if (step === total - 1) {
      const submissions = JSON.parse(
        localStorage.getItem('client-onboarding-submissions') ?? '[]',
      ) as unknown[]
      const id = crypto.randomUUID()
      submissions.push({
        id,
        submittedAt: new Date().toISOString(),
        answers,
      })
      localStorage.setItem('client-onboarding-submissions', JSON.stringify(submissions))
      localStorage.removeItem(DRAFT_KEY)
      setReference(id.slice(0, 8).toUpperCase())
      setDone(true)
      return
    }
    setDirection(1)
    setStep((s) => s + 1)
  }

  const goBack = () => {
    setError(false)
    if (step === 0) {
      onExit()
      return
    }
    setDirection(-1)
    setStep((s) => s - 1)
  }

  const setText = (value: string) => {
    setError(false)
    setAnswers((prev) => ({ ...prev, [question.id]: value }))
  }

  const setField = (key: string, value: string) => {
    setError(false)
    const current =
      answer && typeof answer === 'object' && !Array.isArray(answer)
        ? { ...(answer as Record<string, string>) }
        : {}
    setAnswers((prev) => ({ ...prev, [question.id]: { ...current, [key]: value } }))
  }

  const toggleOption = (option: string) => {
    const current = Array.isArray(answers[question.id]) ? (answers[question.id] as string[]) : []
    const next = current.includes(option)
      ? current.filter((o) => o !== option)
      : [...current, option]
    setError(false)
    setAnswers((prev) => ({ ...prev, [question.id]: next }))
  }

  const selectOption = (option: string) => {
    setError(false)
    setAnswers((prev) => ({ ...prev, [question.id]: option }))
  }

  if (done) {
    return (
      <motion.div
        className="quiz-card complete"
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.svg
          className="check"
          viewBox="0 0 52 52"
          fill="none"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        >
          <motion.circle
            cx="26"
            cy="26"
            r="24"
            stroke="#22c55e"
            strokeWidth="3"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          />
          <motion.path
            d="M14 27l8 8 16-16"
            stroke="#22c55e"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.45, delay: 0.65 }}
          />
        </motion.svg>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          You're all set!
        </motion.h1>
        <motion.p
          className="subtitle"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          Your onboarding answers were saved. We'll build your agent and reach out shortly.
        </motion.p>

        <motion.div
          className="reference"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.78 }}
        >
          Reference #{reference}
        </motion.div>

        <motion.button
          className="btn btn-client"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onFinish}
        >
          Back to home
        </motion.button>
      </motion.div>
    )
  }

  return (
    <div className="quiz-card">
      <div className="quiz-top">
        <button className="icon-btn" onClick={goBack} aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
        </button>
        <span className="quiz-count">
          {step + 1} / {total}
        </span>
      </div>

      <div className="progress-track">
        <motion.div
          className="progress-fill"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      <div className="quiz-section">{question.section}</div>

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={question.id}
          className="quiz-step"
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <h2 className="quiz-question">{question.label}</h2>

          {question.type === 'text' && (
            <input
              className={`quiz-input${error ? ' invalid' : ''}`}
              type={question.inputType ?? 'text'}
              placeholder={question.placeholder}
              value={typeof answer === 'string' ? answer : ''}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && goNext()}
              autoFocus
            />
          )}

          {question.type === 'group' && (
            <div className="quiz-group">
              {question.fields!.map((field) => {
                const groupValue =
                  answer && typeof answer === 'object' && !Array.isArray(answer)
                    ? (answer as Record<string, string>)[field.key] ?? ''
                    : ''
                return (
                  <div className="group-field" key={field.key}>
                    <label className="group-label">{field.label}</label>
                    <input
                      className={`quiz-input${error ? ' invalid' : ''}`}
                      type="text"
                      placeholder={field.placeholder}
                      value={groupValue}
                      onChange={(e) => setField(field.key, e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && goNext()}
                    />
                  </div>
                )
              })}
            </div>
          )}

          {question.type === 'single' && (
            <div className="quiz-options">
              {question.options!.map((option) => (
                <button
                  key={option}
                  className={`option-card${answer === option ? ' selected' : ''}`}
                  onClick={() => selectOption(option)}
                >
                  <span className="radio" />
                  {option}
                </button>
              ))}
            </div>
          )}

          {question.type === 'multi' && (
            <div className="quiz-chips">
              {question.options!.map((option) => {
                const selected = Array.isArray(answer) && answer.includes(option)
                return (
                  <button
                    key={option}
                    className={`chip${selected ? ' selected' : ''}`}
                    onClick={() => toggleOption(option)}
                  >
                    {option}
                    <span className="chip-check">{selected ? '✓' : '+'}</span>
                  </button>
                )
              })}
            </div>
          )}

          {error && <p className="quiz-error">Please answer before continuing.</p>}
        </motion.div>
      </AnimatePresence>

      <div className="quiz-actions">
        <button className="btn btn-ghost" onClick={goBack}>
          Back
        </button>
        <motion.button
          className="btn btn-client"
          onClick={goNext}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {step === total - 1 ? 'Submit' : 'Next'}
          <span className="btn-arrow">→</span>
        </motion.button>
      </div>
    </div>
  )
}

export default OnboardingQuiz
