import { useEffect, useMemo, useState } from 'react'
import { demoMode, listIssues, getTotals, getMyVotes } from './lib/store'
import { getVoterId } from './lib/identity'
import Referendum from './components/Referendum'
import Discrepancy from './components/Discrepancy'
import Transparency from './components/Transparency'
import Deliberate from './components/Deliberate'

const SECTIONS = [
  { id: 'referendum', label: 'Referendum' },
  { id: 'discrepancy', label: 'Discrepancy' },
  { id: 'transparency', label: 'Transparency' },
  { id: 'deliberate', label: 'Deliberate' },
]

export default function App() {
  const [section, setSection] = useState('referendum')
  const [issues, setIssues] = useState([])
  const [totals, setTotals] = useState({})
  const [myVotes, setMyVotes] = useState({})
  const [loadError, setLoadError] = useState(null)
  const voterId = useMemo(() => getVoterId(), [])

  async function refresh() {
    try {
      const [issueRows, totalRows, mine] = await Promise.all([
        listIssues(),
        getTotals(),
        getMyVotes(voterId),
      ])
      setIssues(issueRows)
      setTotals(totalRows)
      setMyVotes(mine)
      setLoadError(null)
    } catch (err) {
      console.error(err)
      setLoadError('Could not reach the database. Check your Supabase configuration.')
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="page">
      <header className="masthead">
        <div className="masthead-inner">
          <span className="wordmark">Y</span>
          <p className="tagline">
            A voluntary global assembly. <em>No owner. No algorithm. No party.</em>
          </p>
        </div>
        <nav className="nav" aria-label="Sections">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              className={`nav-tab ${section === s.id ? 'active' : ''}`}
              onClick={() => setSection(s.id)}
            >
              {s.label}
            </button>
          ))}
        </nav>
      </header>

      {demoMode && (
        <div className="notice" role="status">
          <strong>Demo mode.</strong> Supabase is not configured, so votes are stored in this
          browser only and all counts shown are illustrative. See <code>README.md</code> to go
          live.
        </div>
      )}
      {loadError && (
        <div className="notice notice-error" role="alert">
          {loadError}
        </div>
      )}

      <main className="content">
        {section === 'referendum' && (
          <Referendum
            issues={issues}
            totals={totals}
            myVotes={myVotes}
            voterId={voterId}
            onVoted={refresh}
          />
        )}
        {section === 'discrepancy' && <Discrepancy issues={issues} totals={totals} />}
        {section === 'transparency' && <Transparency issues={issues} />}
        {section === 'deliberate' && <Deliberate issues={issues} sessionId={voterId} />}
      </main>

      <footer className="footer">
        <p>
          Y exists to document the gap between what people want and what institutions do — and to
          make that gap visible and hard to ignore.
        </p>
        <p className="footer-fine">
          Votes are anonymous. One vote per device for now; identity verification is a later
          phase. Institutional positions and transparency rows are curated seed data — verify
          sources before treating them as authoritative.
        </p>
      </footer>
    </div>
  )
}
