import { useEffect, useMemo, useState } from 'react'
import { demoMode, listIssues, getTotals, getMyVotes } from './lib/store'
import { getVoterId } from './lib/identity'
import { useSession } from './lib/useSession'
import { supabase } from './lib/supabaseClient'
import Referendum from './components/Referendum'
import Discrepancy from './components/Discrepancy'
import Transparency from './components/Transparency'
import Deliberate from './components/Deliberate'
import { AuthDialog } from './components/auth/AuthDialog'

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
  const [authDialog, setAuthDialog] = useState(null) // null | 'login' | 'sign-up' | 'update-password'
  const { session, passwordReset, clearPasswordReset } = useSession()
  // Device id — used for demo-mode votes and per-device deliberation chats.
  const deviceId = useMemo(() => getVoterId(), [])

  async function refresh() {
    try {
      const [issueRows, totalRows, mine] = await Promise.all([
        listIssues(),
        getTotals(),
        getMyVotes(),
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

  // Re-load on mount and whenever the signed-in account changes
  // (my-votes are account-scoped in live mode).
  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id])

  // Arriving from a password-recovery email link opens the update form.
  useEffect(() => {
    if (passwordReset) {
      setAuthDialog('update-password')
      clearPasswordReset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passwordReset])

  async function signOut() {
    await supabase?.auth.signOut()
  }

  return (
    <div className="page">
      <header className="masthead">
        <div className="masthead-inner">
          <span className="wordmark">Y</span>
          <p className="tagline">
            A voluntary global assembly. <em>No owner. No algorithm. No party.</em>
          </p>
          {!demoMode && (
            <div className="account">
              {session ? (
                <>
                  <span className="account-email" title={session.user.email}>
                    {session.user.email}
                  </span>
                  <button className="account-btn" onClick={signOut}>
                    Sign out
                  </button>
                </>
              ) : (
                <button className="account-btn" onClick={() => setAuthDialog('login')}>
                  Sign in
                </button>
              )}
            </div>
          )}
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
            signedIn={demoMode || Boolean(session)}
            onRequireAuth={() => setAuthDialog('login')}
            onVoted={refresh}
          />
        )}
        {section === 'discrepancy' && <Discrepancy issues={issues} totals={totals} />}
        {section === 'transparency' && <Transparency issues={issues} />}
        {section === 'deliberate' && <Deliberate issues={issues} sessionId={deviceId} />}
      </main>

      <footer className="footer">
        <p>
          Y exists to document the gap between what people want and what institutions do — and to
          make that gap visible and hard to ignore.
        </p>
        <p className="footer-fine">
          Votes are anonymous to other participants and never shown per-person. One account (one
          confirmed email) casts one vote per issue; identity verification beyond email is a later
          phase. Institutional positions and transparency rows are curated seed data — verify
          sources before treating them as authoritative.
        </p>
      </footer>

      <AuthDialog
        open={authDialog !== null}
        initialView={authDialog ?? 'login'}
        onClose={() => setAuthDialog(null)}
      />
    </div>
  )
}
