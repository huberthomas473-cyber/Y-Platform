import { useState } from 'react'
import { castVote, demoMode } from '../lib/store'

const SUPERMAJORITY = 75 // % of decided votes required for "major position change"

// Phase 3 launch: one issue, pinned first, with the published consequence
// attached. See docs/launch/ — the commitment text is versioned there.
const LAUNCH_ISSUE_ID = 'beach-access'
const LAUNCH_DOC_URL =
  'https://github.com/huberthomas473-cyber/Y-Platform/blob/main/docs/launch/the-75-percent-rule.md'

const CHOICES = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'abstain', label: 'Abstain' },
]

function pct(part, whole) {
  return whole > 0 ? Math.round((part / whole) * 100) : 0
}

function VoteBar({ counts }) {
  const { yes = 0, no = 0, abstain = 0, total = 0 } = counts ?? {}
  const decided = yes + no
  const yesShare = decided > 0 ? (yes / decided) * 100 : 0
  const thresholdMet = decided > 0 && yesShare >= SUPERMAJORITY

  return (
    <div className="votebar">
      <div className="votebar-track" aria-hidden="true">
        <div className="votebar-seg seg-yes" style={{ width: `${pct(yes, total)}%` }} />
        <div className="votebar-seg seg-no" style={{ width: `${pct(no, total)}%` }} />
        <div className="votebar-seg seg-abstain" style={{ width: `${pct(abstain, total)}%` }} />
      </div>
      <div className="votebar-legend">
        <span>
          <i className="dot dot-yes" /> Yes {pct(yes, total)}%
        </span>
        <span>
          <i className="dot dot-no" /> No {pct(no, total)}%
        </span>
        <span>
          <i className="dot dot-abstain" /> Abstain {pct(abstain, total)}%
        </span>
        <span className="votebar-count">{total.toLocaleString()} votes</span>
      </div>

      <div className="consensus">
        <div className="consensus-track" aria-hidden="true">
          <div className="consensus-fill" style={{ width: `${Math.min(yesShare, 100)}%` }} />
          <div className="consensus-marker" style={{ left: `${SUPERMAJORITY}%` }} />
        </div>
        <p className="consensus-label">
          Support among decided votes: <strong>{Math.round(yesShare)}%</strong>
          {' · '}
          <span className={thresholdMet ? 'threshold met' : 'threshold'}>
            ¾ consensus threshold {thresholdMet ? 'met' : 'not met'}
          </span>
        </p>
      </div>
    </div>
  )
}

// Vote submission is a plain callback taking the choice value, so a future
// voice-to-text layer can drive it without touching this component's markup.
function VoteControls({ myChoice, busy, signedIn, onCast }) {
  return (
    <div className="vote-controls">
      {CHOICES.map((c) => (
        <button
          key={c.value}
          className={`vote-btn ${myChoice === c.value ? 'chosen' : ''}`}
          disabled={busy}
          onClick={() => onCast(c.value)}
        >
          {c.label}
        </button>
      ))}
      {myChoice ? (
        <span className="vote-status">
          Your vote: <strong>{myChoice}</strong> — select again to change it.
        </span>
      ) : signedIn ? null : (
        <span className="vote-status">Sign in to vote — one account, one vote.</span>
      )}
    </div>
  )
}

// Radical transparency about our own mechanics (roadmap Phase 1): say on the
// page exactly how voting works and where its limits are.
function HowVotingWorks() {
  return (
    <details className="card methods">
      <summary className="methods-summary">How voting works — and its limits</summary>
      <div className="methods-body">
        <p>
          <strong>What one vote means.</strong> Voting requires an account with a confirmed email
          address. One account holds at most one vote per issue; you can change your vote at any
          time, and only the latest choice counts.
        </p>
        <p>
          <strong>How votes are counted.</strong> Your browser never writes to the vote store
          directly. Votes go through a server endpoint that checks your session, enforces rate
          limits, and records the vote. Public results are aggregate counts only — individual
          votes are never displayed, and other participants cannot see how you voted.
        </p>
        <p>
          <strong>Known limits — read this before trusting our numbers.</strong> Email accounts
          are not people: one person with several email addresses can vote several times. We rate
          limit and monitor for abuse, but a motivated actor with many addresses can still inflate
          counts. Until stronger, privacy-preserving identity verification exists (a later phase),
          treat results as an indicative signal, not a certified election.
        </p>
        <p>
          <strong>What we store.</strong> Your email (for sign-in), your vote choices, and
          timestamps. Deliberation chats are private to your device-session and are never linked
          to public results.
        </p>
      </div>
    </details>
  )
}

export default function Referendum({ issues, totals, myVotes, signedIn, onRequireAuth, onVoted }) {
  const [busyIssue, setBusyIssue] = useState(null)
  const [error, setError] = useState(null)

  async function handleCast(issueId, choice) {
    // Live mode requires an account; route straight to sign-in instead of
    // letting the request fail server-side.
    if (!demoMode && !signedIn) {
      onRequireAuth?.()
      return
    }
    setBusyIssue(issueId)
    setError(null)
    try {
      await castVote(issueId, choice)
      await onVoted()
    } catch (err) {
      console.error(err)
      if (err.code === 'auth_required') {
        onRequireAuth?.()
      } else if (err.code === 'rate_limited') {
        setError(err.message || 'You are voting too quickly — wait a moment and try again.')
      } else {
        setError('Your vote could not be recorded. Please try again.')
      }
    } finally {
      setBusyIssue(null)
    }
  }

  return (
    <section>
      <h2 className="section-title">Referendum</h2>
      <p className="section-intro">
        Vote on the issues below. Results are live. A three-quarters supermajority of decided
        votes marks the assembly’s bar for demanding a major position change.
      </p>
      {error && (
        <div className="notice notice-error" role="alert">
          {error}
        </div>
      )}

      <div className="issue-list">
        {[...issues]
          .sort(
            (a, b) => Number(b.id === LAUNCH_ISSUE_ID) - Number(a.id === LAUNCH_ISSUE_ID)
          )
          .map((issue) => (
            <article key={issue.id} className="card issue-card">
              <div className="issue-tags">
                {issue.id === LAUNCH_ISSUE_ID && (
                  <span className="tag tag-launch">Launch issue</span>
                )}
                <span className="tag">{issue.category}</span>
                <span className="tag tag-scope">{issue.scope}</span>
              </div>
              <h3 className="issue-title">{issue.title}</h3>
              <p className="issue-framing">{issue.framing}</p>
              {issue.id === LAUNCH_ISSUE_ID && (
                <p className="launch-note">
                  <strong>Y’s first test.</strong> If support reaches 75% of decided votes
                  (minimum 1,000), the result and its evidence dossier go formally to the
                  Government of Jamaica — and their response, or their silence, is published
                  here.{' '}
                  <a href={LAUNCH_DOC_URL} target="_blank" rel="noreferrer">
                    Read the commitment
                  </a>
                  .
                </p>
              )}
              <VoteBar counts={totals[issue.id]} />
              <VoteControls
                myChoice={myVotes[issue.id]}
                busy={busyIssue === issue.id}
                signedIn={signedIn}
                onCast={(choice) => handleCast(issue.id, choice)}
              />
            </article>
          ))}
      </div>

      <HowVotingWorks />
    </section>
  )
}
