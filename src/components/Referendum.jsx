import { useState } from 'react'
import { castVote } from '../lib/store'

const SUPERMAJORITY = 75 // % of decided votes required for "major position change"

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
function VoteControls({ myChoice, busy, onCast }) {
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
      {myChoice && (
        <span className="vote-status">
          Your vote: <strong>{myChoice}</strong> — select again to change it.
        </span>
      )}
    </div>
  )
}

export default function Referendum({ issues, totals, myVotes, voterId, onVoted }) {
  const [busyIssue, setBusyIssue] = useState(null)
  const [error, setError] = useState(null)

  async function handleCast(issueId, choice) {
    setBusyIssue(issueId)
    setError(null)
    try {
      await castVote(voterId, issueId, choice)
      await onVoted()
    } catch (err) {
      console.error(err)
      setError('Your vote could not be recorded. Please try again.')
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
        {issues.map((issue) => (
          <article key={issue.id} className="card issue-card">
            <div className="issue-tags">
              <span className="tag">{issue.category}</span>
              <span className="tag tag-scope">{issue.scope}</span>
            </div>
            <h3 className="issue-title">{issue.title}</h3>
            <p className="issue-framing">{issue.framing}</p>
            <VoteBar counts={totals[issue.id]} />
            <VoteControls
              myChoice={myVotes[issue.id]}
              busy={busyIssue === issue.id}
              onCast={(choice) => handleCast(issue.id, choice)}
            />
          </article>
        ))}
      </div>
    </section>
  )
}
