import { useEffect, useState } from 'react'
import { listPositions } from '../lib/store'
import { STANCE_LABELS, STANCE_SCORE } from '../data/seed'

function GapMeter({ support, stance }) {
  const alignment = STANCE_SCORE[stance]
  return (
    <div className="gapmeter">
      <div className="gapmeter-row">
        <span className="gapmeter-side">The assembly</span>
        <div className="gapmeter-track">
          <div className="gapmeter-fill fill-people" style={{ width: `${support}%` }} />
        </div>
        <span className="gapmeter-value">{support}%</span>
      </div>
      <div className="gapmeter-row">
        <span className="gapmeter-side">Institutions</span>
        <div className="gapmeter-track">
          {alignment === null ? (
            <div className="gapmeter-fill fill-unclear" style={{ width: '100%' }} />
          ) : (
            <div className="gapmeter-fill fill-inst" style={{ width: `${alignment}%` }} />
          )}
        </div>
        <span className="gapmeter-value">{alignment === null ? '—' : `${alignment}`}</span>
      </div>
      <p className="gapmeter-note">
        Assembly bar: % “yes” among decided votes. Institutional bar: illustrative alignment
        score (aligned 100 · partial 50 · diverges 8).
      </p>
    </div>
  )
}

export default function Discrepancy({ issues, totals }) {
  const [positions, setPositions] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    listPositions()
      .then(setPositions)
      .catch((err) => {
        console.error(err)
        setError('Could not load institutional positions.')
      })
  }, [])

  return (
    <section>
      <h2 className="section-title">Discrepancy</h2>
      <p className="section-intro">
        What the assembly votes, next to what governments and institutions actually do. The gap
        is the point.
      </p>
      <p className="sample-note">
        Institutional positions are curated seed data (August 2026) with sources — verify before
        citing.
      </p>
      {error && (
        <div className="notice notice-error" role="alert">
          {error}
        </div>
      )}

      <div className="issue-list">
        {issues.map((issue) => {
          const pos = positions.find((p) => p.issue_id === issue.id)
          const counts = totals[issue.id] ?? { yes: 0, no: 0 }
          const decided = (counts.yes ?? 0) + (counts.no ?? 0)
          const support = decided > 0 ? Math.round((counts.yes / decided) * 100) : 0
          return (
            <article key={issue.id} className="card">
              <h3 className="issue-title">{issue.title}</h3>
              {pos ? (
                <>
                  <GapMeter support={support} stance={pos.stance} />
                  <div className="position">
                    <p className="position-head">
                      <span className={`stance stance-${pos.stance}`}>
                        {STANCE_LABELS[pos.stance] ?? pos.stance}
                      </span>
                      <span className="position-actor">{pos.actor}</span>
                    </p>
                    <p className="position-summary">{pos.position_summary}</p>
                    {pos.source_url && (
                      <a
                        className="source-link"
                        href={pos.source_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Source: {pos.source_label ?? pos.source_url}
                      </a>
                    )}
                  </div>
                </>
              ) : (
                <p className="position-summary">No institutional position recorded yet.</p>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
