import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { onboardingQuestions, type UploadedFile } from '../data/onboardingQuestions'
import { supabase } from '../lib/supabase'

interface Submission {
  id: string
  submittedAt: string
  answers: Record<string, string | string[] | Record<string, string> | UploadedFile[]>
}

interface DbClient {
  id: string
  submitted_at: string
  answers: Submission['answers']
  status: string
}

type Theme = 'light' | 'dark'
type Status = 'new' | 'contacted' | 'onboarded'

function isUploadArray(value: unknown): value is UploadedFile[] {
  return Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && 'name' in value[0]
}

function answerText(
  answer: string | string[] | Record<string, string> | UploadedFile[] | undefined
): string {
  if (answer === undefined) return '—'
  if (Array.isArray(answer)) {
    if (isUploadArray(answer)) return answer.map((f) => f.name).join(', ')
    return answer.length ? answer.join(', ') : '—'
  }
  if (typeof answer === 'object') {
    const parts = Object.entries(answer).map(([label, value]) => `${label}: ${value}`)
    return parts.length ? parts.join(', ') : '—'
  }
  return answer.trim() || '—'
}

function locationParts(answers: Submission['answers']): {
  city: string
  state: string
  country: string
} {
  const loc = answers['4']
  if (!loc || typeof loc !== 'object' || Array.isArray(loc)) {
    return { city: '', state: '', country: '' }
  }
  const { city = '', state = '', country = '' } = loc as Record<string, string>
  return { city, state, country }
}

function locationText(answers: Submission['answers']): string {
  const { city, state, country } = locationParts(answers)
  return [city, state, country].filter(Boolean).join(', ') || '—'
}

const STATUS_LABEL: Record<Status, string> = {
  new: 'New',
  contacted: 'Contacted',
  onboarded: 'Onboarded',
}

function escapeCsv(value: string): string {
  return `"${(value ?? '').replace(/"/g, '""')}"`
}

function exportCsv(rows: Submission[], statuses: Record<string, Status>) {
  const headers = [
    'Full Name',
    'Email',
    'WhatsApp',
    'City',
    'State',
    'Country',
    'Business Name',
    'Google Review Link',
    'Common Questions',
    'Review Timing',
    'Tone',
    'Notify If Unknown/Upset',
    'Review Gate',
    'Never Say or Promise',
    'Text Consent',
    'Notify 5-Star/Hot Inquiry',
    'Submitted At',
    'Status',
  ]
  const lines = rows.map((s) => {
    const a = s.answers
    const loc = locationParts(a)
    const row = [
      answerText(a['1']),
      answerText(a['2']),
      answerText(a['3']),
      loc.city,
      loc.state,
      loc.country,
      answerText(a['5']),
      answerText(a['6']),
      answerText(a['7']),
      answerText(a['8']),
      answerText(a['10']),
      answerText(a['11']),
      answerText(a['12']),
      answerText(a['13']),
      answerText(a['14']),
      new Date(s.submittedAt).toLocaleString(),
      STATUS_LABEL[statuses[s.id] ?? 'new'],
    ]
    return row.map(escapeCsv).join(',')
  })
  const csv = '\uFEFF' + [headers.map(escapeCsv).join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `clients-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function AdminDashboard({
  theme,
  onToggleTheme,
  onLogout,
}: {
  theme: Theme
  onToggleTheme: () => void
  onLogout: () => void
}) {
  const [clients, setClients] = useState<Submission[]>([])
  const [statuses, setStatuses] = useState<Record<string, Status>>({})
  const [expanded, setExpanded] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const loadClients = async () => {
    setLoading(true)
    setLoadError('')
    const { data, error } = await supabase
      .from('clients')
      .select('id, submitted_at, answers, status')
      .order('submitted_at', { ascending: false })
    if (error) {
      setLoadError(error.message)
      setLoading(false)
      return
    }
    const rows = (data ?? []) as DbClient[]
    setClients(
      rows.map((r) => ({
        id: r.id,
        submittedAt: r.submitted_at,
        answers: r.answers,
      })),
    )
    const statusMap: Record<string, Status> = {}
    for (const r of rows) {
      statusMap[r.id] =
        r.status === 'contacted' || r.status === 'onboarded' ? r.status : 'new'
    }
    setStatuses(statusMap)
    setLoading(false)
  }

  useEffect(() => {
    loadClients()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const logout = () => {
    sessionStorage.removeItem('admin-authenticated')
    onLogout()
  }

  const statusOf = (id: string): Status => statuses[id] ?? 'new'

  const cycleStatus = async (id: string) => {
    const current = statusOf(id)
    const next: Status =
      current === 'new' ? 'contacted' : current === 'contacted' ? 'onboarded' : 'new'
    setStatuses((prev) => ({ ...prev, [id]: next }))
    const { error } = await supabase.from('clients').update({ status: next }).eq('id', id)
    if (error) {
      setStatuses((prev) => ({ ...prev, [id]: current }))
    }
  }

  const deleteClient = async (id: string) => {
    if (!window.confirm('Remove this client? This cannot be undone.')) return
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (error) return
    setClients((prev) => prev.filter((s) => s.id !== id))
    setStatuses((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const totalClients = clients.length
  const consentCount = clients.filter((s) => s.answers['13'] === 'Yes').length
  const gateCount = clients.filter((s) =>
    String(s.answers['11']).startsWith('Yes'),
  ).length

  const q = query.trim().toLowerCase()
  const filtered = clients.filter((s) => {
    const matchesQuery =
      !q ||
      [
        s.answers['1'],
        s.answers['5'],
        s.answers['2'],
        s.answers['3'],
        locationText(s.answers),
      ].some((value) => String(value ?? '').toLowerCase().includes(q))
    const matchesStatus = statusFilter === 'all' || statusOf(s.id) === statusFilter
    return matchesQuery && matchesStatus
  })

  return (
    <div className="dashboard" data-theme={theme}>
      <motion.header
        className="dash-header"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="dash-title">
          <span className="brand-icon small">⬡</span>
          <div>
            <h1>Admin Dashboard</h1>
            <p>All onboarded clients for your agency</p>
          </div>
        </div>
        <div className="dash-header-actions">
          <button className="theme-toggle" onClick={onToggleTheme}>
            {theme === 'light' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            )}
            {theme === 'light' ? 'Dark mode' : 'Light mode'}
          </button>
          <button className="dash-logout" onClick={logout}>
            Log out
          </button>
        </div>
      </motion.header>

      <motion.div
        className="dash-stats"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.6 }}
      >
        <div className="stat-card">
          <span className="stat-value">{totalClients}</span>
          <span className="stat-label">Total Clients</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{consentCount}</span>
          <span className="stat-label">Consent to Texts</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{gateCount}</span>
          <span className="stat-label">Review Gate Enabled</span>
        </div>
      </motion.div>

      <motion.div
        className="dash-toolbar"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.6 }}
      >
        <div className="dash-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, business, email, WhatsApp or location..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          className="dash-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | Status)}
        >
          <option value="all">All statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="onboarded">Onboarded</option>
        </select>
        <button
          className="dash-export"
          onClick={() => exportCsv(filtered, statuses)}
          disabled={filtered.length === 0}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <path d="m7 10 5 5 5-5" />
            <path d="M12 15V3" />
          </svg>
          Export CSV
        </button>
        <button className="theme-toggle dash-refresh" onClick={loadClients} title="Refresh clients">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-2.64-6.36" />
            <path d="M21 3v6h-6" />
          </svg>
          Refresh
        </button>
      </motion.div>

      <motion.div
        className="dash-list"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        {loading ? (
          <div className="dash-empty">
            <span className="empty-icon">⬡</span>
            <h2>Loading clients…</h2>
          </div>
        ) : loadError ? (
          <div className="dash-empty">
            <span className="empty-icon">!</span>
            <h2>Could not load clients</h2>
            <p>{loadError}</p>
            <button className="btn btn-client" onClick={loadClients}>
              Try again
            </button>
          </div>
        ) : clients.length === 0 ? (
          <div className="dash-empty">
            <span className="empty-icon">⬡</span>
            <h2>No clients yet</h2>
            <p>Complete the client onboarding flow to see clients appear here.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="dash-empty">
            <span className="empty-icon">⬡</span>
            <h2>No clients match</h2>
            <p>Try a different search or status filter.</p>
          </div>
        ) : (
          <>
            <div className="dash-list-title">
              Showing {filtered.length} of {clients.length} clients
            </div>

            {filtered.map((submission) => {
              const a = submission.answers
              const isOpen = expanded === submission.id
              const status = statusOf(submission.id)
              return (
                <div className={`client-card${isOpen ? ' open' : ''}`} key={submission.id}>
                  <div className="client-head">
                    <div className="client-avatar">{answerText(a['1']).charAt(0) || '?'}</div>
                    <div className="client-main">
                      <h3>{answerText(a['1'])}</h3>
                      <p className="client-business">{answerText(a['5'])}</p>
                    </div>
                    <div className="client-meta">
                      <span>{answerText(a['2'])}</span>
                      <span>{answerText(a['3'])}</span>
                      <span>{locationText(a)}</span>
                    </div>
                    <div className="client-actions">
                      <button
                        className={`status-badge ${status}`}
                        onClick={() => cycleStatus(submission.id)}
                        title="Click to change status"
                      >
                        {STATUS_LABEL[status]}
                      </button>
                      <button
                        className="dash-expand"
                        onClick={() => setExpanded(isOpen ? null : submission.id)}
                      >
                        {isOpen ? 'Hide' : 'View'} answers
                      </button>
                      <button
                        className="dash-delete"
                        onClick={() => deleteClient(submission.id)}
                        aria-label="Delete client"
                        title="Delete client"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <motion.div
                      className="client-detail"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                      <div className="client-submitted">
                        Submitted {new Date(submission.submittedAt).toLocaleString()}
                      </div>
                      {onboardingQuestions.map((question) => {
                        const value = a[question.id]
                        return (
                          <div className="detail-row" key={question.id}>
                            <span className="detail-q">
                              {question.id}. {question.label}
                            </span>
                            {isUploadArray(value) ? (
                              <span className="detail-a detail-files">
                                {value.map((file) => (
                                  <a
                                    key={file.name}
                                    className="detail-file"
                                    href={file.dataUrl}
                                    download={file.name}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {file.type.startsWith('image/') ? (
                                      <img
                                        className="detail-file-thumb"
                                        src={file.dataUrl}
                                        alt={file.name}
                                      />
                                    ) : (
                                      <span className="detail-file-doc">DOC</span>
                                    )}
                                    <span className="detail-file-name">{file.name}</span>
                                    <svg
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                      <path d="m7 10 5 5 5-5" />
                                      <path d="M12 15V3" />
                                    </svg>
                                  </a>
                                ))}
                              </span>
                            ) : (
                              <span className="detail-a">{answerText(value)}</span>
                            )}
                          </div>
                        )
                      })}
                    </motion.div>
                  )}
                </div>
              )
            })}
          </>
        )}
      </motion.div>
    </div>
  )
}

export default AdminDashboard
