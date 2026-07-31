import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  onboardingQuestions,
  type OnboardingQuestion,
  type UploadedFile,
} from '../data/onboardingQuestions'
import { supabase } from '../lib/supabase'

type Answer = string | string[] | Record<string, string> | UploadedFile[]

const DRAFT_KEY = 'client-onboarding-draft'
const MAX_FILE_SIZE = 4 * 1024 * 1024
const MAX_TOTAL_SIZE = 15 * 1024 * 1024
const ACCEPT = 'image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx'
const brandGradient = 'linear-gradient(135deg, #2563eb, #1d4ed8)'

interface ChatMsg {
  role: 'ai' | 'user'
  text: string
}

function isValid(question: OnboardingQuestion, answer: Answer | undefined): boolean {
  if (answer === undefined) return false
  if (question.type === 'upload') return Array.isArray(answer) && answer.length > 0
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

function formatAnswer(answer: Answer): string {
  if (Array.isArray(answer)) {
    if (answer.length && typeof answer[0] === 'object') {
      return (answer as UploadedFile[]).map((f) => f.name).join(', ')
    }
    return answer.join(', ')
  }
  if (typeof answer === 'object') {
    return Object.values(answer)
      .filter(Boolean)
      .join(', ')
  }
  return String(answer).trim()
}

function knownAnswers(answers: Record<number, Answer>): Record<number, Answer> {
  const ids = new Set(onboardingQuestions.map((q) => q.id))
  return Object.fromEntries(Object.entries(answers).filter(([k]) => ids.has(Number(k))))
}

function OnboardingQuiz({ onFinish, onExit }: { onFinish: () => void; onExit: () => void }) {
  const [draft] = useState(loadDraft)
  const [step, setStep] = useState(draft?.step ?? 0)
  const [answers, setAnswers] = useState<Record<number, Answer>>(draft?.answers ?? {})
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [typing, setTyping] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [reference, setReference] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [textValue, setTextValue] = useState('')
  const [groupValue, setGroupValue] = useState<Record<string, string>>({})
  const [multiValue, setMultiValue] = useState<string[]>([])
  const [uploads, setUploads] = useState<UploadedFile[]>([])
  const [uploadError, setUploadError] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const total = onboardingQuestions.length
  const question = onboardingQuestions[step]

  useEffect(() => {
    const msgs: ChatMsg[] = []
    const start = draft?.step ?? 0
    if (start === 0) {
      msgs.push({
        role: 'ai',
        text: "Hey, welcome! We'll get your business set up in about 2 minutes. Just answer the questions below.",
      })
    }
    for (let i = 0; i < start; i++) {
      const q = onboardingQuestions[i]
      msgs.push({ role: 'ai', text: q.label })
      const a = draft?.answers?.[q.id]
      if (a !== undefined) msgs.push({ role: 'user', text: formatAnswer(a) })
    }
    msgs.push({ role: 'ai', text: onboardingQuestions[start].label })
    setMessages(msgs)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages, typing])

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(answers))
    } catch {
      /* storage full, draft not persisted */
    }
  }, [answers])

  useEffect(() => {
    if (question.type === 'text') textRef.current?.focus()
  }, [step, question.type])

  useEffect(() => {
    if (question.type === 'upload') {
      const existing = answers[question.id]
      setUploads(
        Array.isArray(existing) && typeof existing[0] === 'object'
          ? (existing as UploadedFile[])
          : []
      )
    }
  }, [step, question.type, answers])

  const completeStep = (answer: Answer, displayText: string) => {
    const updated = { ...answers, [question.id]: answer }
    setAnswers(updated)
    setMessages((prev) => [...prev, { role: 'user', text: displayText }])
    setError('')
    setTyping(true)
    setTextValue('')
    setGroupValue({})
    setMultiValue([])
    setUploads([])
    setUploadError('')
    window.setTimeout(() => {
      if (step === total - 1) {
        setSubmitting(true)
        supabase
          .from('clients')
          .insert({ answers: knownAnswers(updated) })
          .select('id')
          .single()
          .then(({ data, error: insertError }) => {
            setSubmitting(false)
            setTyping(false)
            if (insertError || !data) {
              setMessages((prev) => [
                ...prev,
                {
                  role: 'ai',
                  text: "We couldn't save your answers. Check your connection and try again.",
                },
              ])
              return
            }
            localStorage.removeItem(DRAFT_KEY)
            setReference(data.id.slice(0, 8).toUpperCase())
            setDone(true)
          })
        return
      }
      const next = onboardingQuestions[step + 1]
      setStep((s) => s + 1)
      setMessages((prev) => [...prev, { role: 'ai', text: next.label }])
      setTyping(false)
    }, 500)
  }

  const submitText = () => {
    const value = textValue.trim()
    if (!isValid(question, value)) {
      setError('Please answer before moving on.')
      return
    }
    completeStep(value, value)
  }

  const submitGroup = () => {
    if (!isValid(question, groupValue)) {
      setError('Please fill in every box before moving on.')
      return
    }
    completeStep(groupValue, formatAnswer(groupValue))
  }

  const toggleMulti = (option: string) => {
    setError('')
    setMultiValue((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    )
  }

  const submitMulti = () => {
    if (multiValue.length === 0) {
      setError('Pick at least one option to continue.')
      return
    }
    completeStep([...multiValue], multiValue.join(', '))
  }

  const pickSingle = (option: string) => {
    completeStep(option, option)
  }

  const readFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setError('')
    setUploadError('')
    let total = uploads.reduce((sum, file) => sum + file.size, 0)
    const added: UploadedFile[] = []

    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(`${file.name} is too large. Max 4MB per file.`)
        continue
      }
      if (total + file.size > MAX_TOTAL_SIZE) {
        setUploadError('Total upload limit reached. Max 15MB.')
        break
      }
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(new Error('Could not read file'))
        reader.readAsDataURL(file)
      })
      added.push({ name: file.name, size: file.size, type: file.type, dataUrl })
      total += file.size
    }

    if (added.length > 0) setUploads((prev) => [...prev, ...added])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeFile = (fileName: string) => {
    setUploadError('')
    setUploads((prev) => prev.filter((file) => file.name !== fileName))
  }

  const submitUpload = () => {
    if (uploads.length === 0) {
      setError('Add at least one document to continue.')
      return
    }    const display =
      uploads.length === 1 ? uploads[0].name : `${uploads.length} documents added`
    completeStep(uploads, display)
  }

  const progress = done ? 100 : Math.round((step / total) * 100)

  return (
    <div className="chat">
      <aside className="chat-side">
        <div className="chat-brand">
          <span className="chat-logo">⬡</span>
          <div className="chat-brand-text">
            <span className="chat-name">LaunchOps</span>
            <span className="chat-tag">Tell us about your business</span>
          </div>
        </div>

        <div className="chat-progress-block">
          <div className="chat-progress-head">
            <span>Your progress</span>
            <span>{progress}%</span>
          </div>
          <div className="chat-progress-track">
            <motion.div
              className="chat-progress-fill"
              style={{ background: brandGradient }}
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 18 }}
            />
          </div>
        </div>

        <nav className="chat-steps">
          {onboardingQuestions.map((q, i) => {
            const state = i < step ? 'done' : i === step ? 'current' : 'pending'
            return (
              <div key={q.id} className={`chat-step ${state}`}>
                <span className="chat-step-dot">{i < step ? '✓' : i + 1}</span>
                <span className="chat-step-label">{q.short}</span>
              </div>
            )
          })}
        </nav>

        <div className="chat-side-foot">Powered by LaunchOps</div>
      </aside>

      <div className="chat-mobile-head">
        <button className="chat-mobile-back" onClick={onExit} type="button" aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <span className="chat-logo chat-logo-sm">⬡</span>
        <span className="chat-mobile-name">LaunchOps</span>
        <span className="chat-mobile-pct">{progress}%</span>
      </div>
      <div className="chat-mobile-progress">
        <motion.div
          className="chat-progress-fill"
          style={{ background: brandGradient }}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        />
      </div>

      <main className="chat-main">
        <div className="chat-head">
          <button className="chat-back" onClick={onExit} type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back
          </button>
          <span className="chat-head-step">{question.section}</span>
        </div>

        <div className="chat-scroll" ref={scrollRef}>
          <div className="chat-msgs">
            {messages.map((m, idx) =>
              m.role === 'ai' ? (
                <motion.div
                  key={idx}
                  className="msg-row msg-ai-row"
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                >
                  <div className="msg msg-ai">{m.text}</div>
                </motion.div>
              ) : (
                <motion.div
                  key={idx}
                  className="msg-row msg-user-row"
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                >
                  <div className="msg msg-user" style={{ background: brandGradient }}>
                    {m.text}
                  </div>
                </motion.div>
              )
            )}

            {(typing || submitting) && (
              <div className="msg-row msg-ai-row">
                <div className="msg msg-ai msg-typing">
                  <span className="typing-dot" />
                  <span className="typing-dot" style={{ animationDelay: '0.15s' }} />
                  <span className="typing-dot" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            )}

            {error && <div className="chat-err">{error}</div>}
          </div>

          {!done && (
            <div className="chat-bar">
              <div className="chat-controls">
              {question.type === 'text' && (
                <div className="chat-input-row">
                  <input
                    ref={textRef}
                    className="chat-input"
                    type="text"
                    placeholder="Type your answer"
                    value={textValue}
                    onChange={(e) => {
                      setTextValue(e.target.value)
                      setError('')
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && submitText()}
                  />
                  <button
                    className="chat-send"
                    onClick={submitText}
                    disabled={!textValue.trim()}
                    type="button"
                    aria-label="Send"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m22 2-7 20-4-9-9-4z" />
                      <path d="M22 2 11 13" />
                    </svg>
                  </button>
                </div>
              )}

              {question.type === 'single' && (
                <div className="chat-chips">
                  {question.options!.map((option) => (
                    <button
                      key={option}
                      className="chat-chip"
                      onClick={() => pickSingle(option)}
                      type="button"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {question.type === 'multi' && (
                <div className="chat-multi">
                  <div className="chat-chips">
                    {question.options!.map((option) => (
                      <button
                        key={option}
                        className={`chat-chip${multiValue.includes(option) ? ' selected' : ''}`}
                        onClick={() => toggleMulti(option)}
                        type="button"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  <button className="chat-continue" onClick={submitMulti} type="button">
                    Continue
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}

              {question.type === 'group' && (
                <div className="chat-group">
                  {question.fields!.map((field) => (
                    <label className="chat-group-field" key={field.key}>
                      <span className="chat-group-label">{field.label}</span>
                      <input
                        className="chat-input"
                        type="text"
                        placeholder={field.placeholder}
                        value={groupValue[field.key] ?? ''}
                        onChange={(e) => {
                          setGroupValue((prev) => ({ ...prev, [field.key]: e.target.value }))
                          setError('')
                        }}
                      />
                    </label>
                  ))}
                  <button className="chat-continue" onClick={submitGroup} type="button">
                    Send
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}

              {question.type === 'upload' && (
                <div className="chat-upload">
                  <input
                    ref={fileInputRef}
                    className="chat-file-input"
                    type="file"
                    multiple
                    accept={ACCEPT}
                    onChange={(e) => readFiles(e.target.files)}
                  />
                  <button
                    className="chat-dropzone"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      readFiles(e.dataTransfer.files)
                    }}
                    type="button"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <path d="m17 8-5-5-5 5" />
                      <path d="M12 3v12" />
                    </svg>
                    <span>Tap to add documents</span>
                    <em>Images, PDFs, Word, Excel. Max 4MB each</em>
                  </button>

                  {uploads.length > 0 && (
                    <div className="chat-file-list">
                      {uploads.map((file) => (
                        <div key={file.name} className="chat-file">
                          {file.type.startsWith('image/') ? (
                            <img className="chat-file-thumb" src={file.dataUrl} alt={file.name} />
                          ) : (
                            <span className="chat-file-doc">DOC</span>
                          )}
                          <div className="chat-file-meta">
                            <span className="chat-file-name">{file.name}</span>
                            <span className="chat-file-size">
                              {(file.size / 1024).toFixed(0)} KB
                            </span>
                          </div>
                          <button
                            className="chat-file-remove"
                            onClick={() => removeFile(file.name)}
                            type="button"
                            aria-label={`Remove ${file.name}`}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {uploadError && <div className="chat-err">{uploadError}</div>}

                  <button
                    className="chat-continue"
                    onClick={submitUpload}
                    disabled={uploads.length === 0}
                    type="button"
                  >
                    Continue
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
              </div>
            </div>
          )}
        </div>
      </main>

      {done && (
        <motion.div
          className="chat-done-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="chat-done-card"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <svg
              className="check"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2563eb"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <h2>You&apos;re all set!</h2>
            <p className="chat-done-text">
              All done, your answers are saved. Keep this reference handy:
            </p>
            <span className="reference">{reference}</span>
            <button className="btn btn-client chat-done-btn" onClick={onFinish}>
              Back to home
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default OnboardingQuiz
