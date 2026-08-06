import { useEffect, useMemo, useState } from 'react'
import { listTransparency } from '../lib/store'

export default function Transparency({ issues }) {
  const [entries, setEntries] = useState([])
  const [query, setQuery] = useState('')
  const [issueFilter, setIssueFilter] = useState('all')
  const [error, setError] = useState(null)

  useEffect(() => {
    listTransparency()
      .then(setEntries)
      .catch((err) => {
        console.error(err)
        setError('Could not load the transparency database.')
      })
  }, [])

  const issueTitle = (id) => issues.find((i) => i.id === id)?.title ?? '—'

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return entries.filter((e) => {
      if (issueFilter !== 'all' && e.issue_id !== issueFilter) return false
      if (!q) return true
      return [e.company, e.parent_company, e.connections, issueTitle(e.issue_id)]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(q))
    })
  }, [entries, query, issueFilter, issues])

  return (
    <section>
      <h2 className="section-title">Transparency</h2>
      <p className="section-intro">
        Who owns whom, and who funds whom — the connections behind the issues on the ballot.
      </p>
      <p className="sample-note">
        Illustrative sample rows. The schema is built for verified, sourced records; replace
        these before public launch.
      </p>
      {error && (
        <div className="notice notice-error" role="alert">
          {error}
        </div>
      )}

      <div className="filters">
        <input
          type="search"
          className="search-input"
          placeholder="Search companies, owners, connections…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search transparency database"
        />
        <select
          className="issue-select"
          value={issueFilter}
          onChange={(e) => setIssueFilter(e.target.value)}
          aria-label="Filter by issue"
        >
          <option value="all">All issues</option>
          {issues.map((i) => (
            <option key={i.id} value={i.id}>
              {i.title}
            </option>
          ))}
        </select>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Ownership</th>
              <th>Political connections</th>
              <th>Related issue</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e, idx) => (
              <tr key={e.id ?? idx}>
                <td className="td-company">{e.company}</td>
                <td>{e.parent_company ?? '—'}</td>
                <td>{e.connections ?? '—'}</td>
                <td>{issueTitle(e.issue_id)}</td>
                <td>
                  {e.source_url ? (
                    <a className="source-link" href={e.source_url} target="_blank" rel="noreferrer">
                      {e.source_label ?? 'Source'}
                    </a>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="td-empty">
                  No entries match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
