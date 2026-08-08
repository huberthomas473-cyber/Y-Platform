// Data layer for Y.
//
// One interface, two backends:
//  - Supabase (real persistence) when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
//    are set — this is the intended production mode. Since Phase 1, votes are
//    tied to signed-in accounts and written ONLY via /api/vote (the browser
//    has no write access to the votes table).
//  - Local demo mode otherwise: seeded content + localStorage votes keyed by a
//    device id, so the app runs out of the box before the database is wired
//    up. The UI shows a banner whenever demo mode is active.
//
// Components only import from this module, never from supabaseClient directly —
// which also keeps input surfaces (voting, chat) thin enough that a future
// voice-to-text layer can call the same functions.

import { supabase, isConfigured } from './supabaseClient'
import { getVoterId } from './identity'
import { ISSUES, POSITIONS, TRANSPARENCY, DEMO_BASELINE } from '../data/seed'

export const demoMode = !isConfigured

const DEMO_VOTES_KEY = 'y-demo-votes'

// ---------- issues ----------

export async function listIssues() {
  if (demoMode) return ISSUES
  const { data, error } = await supabase.from('issues').select('*').order('sort_order')
  if (error) throw error
  // If the DB is reachable but not seeded yet, fall back to bundled issues so
  // the ballot still renders (votes will fail until setup.sql is run).
  return data?.length ? data : ISSUES
}

// ---------- votes ----------

function readDemoVotes() {
  try {
    return JSON.parse(localStorage.getItem(DEMO_VOTES_KEY)) ?? {}
  } catch {
    return {}
  }
}

export async function getTotals() {
  if (demoMode) {
    const mine = readDemoVotes()
    const totals = {}
    for (const issue of ISSUES) {
      const base = { ...(DEMO_BASELINE[issue.id] ?? { yes: 0, no: 0, abstain: 0 }) }
      const myChoice = mine[issue.id]
      if (myChoice) base[myChoice] += 1
      totals[issue.id] = { ...base, total: base.yes + base.no + base.abstain }
    }
    return totals
  }
  const { data, error } = await supabase.from('vote_totals').select('*')
  if (error) throw error
  const totals = {}
  for (const row of data ?? []) {
    totals[row.issue_id] = { yes: row.yes, no: row.no, abstain: row.abstain, total: row.total }
  }
  return totals
}

// My votes are keyed by the signed-in account (live) or the device (demo).
// Live mode reads are scoped server-side by RLS: a signed-in user can only
// ever select their own vote rows.
export async function getMyVotes() {
  if (demoMode) return readDemoVotes()

  const { data: sessionData } = await supabase.auth.getSession()
  const userId = sessionData?.session?.user?.id
  if (!userId) return {}

  const { data, error } = await supabase
    .from('votes')
    .select('issue_id, choice')
    .eq('voter_id', userId)
  if (error) throw error
  const mine = {}
  for (const row of data ?? []) mine[row.issue_id] = row.choice
  return mine
}

// Cast (or change) a vote. In live mode this goes through /api/vote — the
// server verifies the session token, applies rate limits, and is the only
// path that can write to the votes table.
//
// Throws an Error with `.code` set to:
//   'auth_required' — no active session; open the sign-in dialog
//   'rate_limited'  — server asked us to slow down
export async function castVote(issueId, choice) {
  if (demoMode) {
    const mine = readDemoVotes()
    mine[issueId] = choice
    try {
      localStorage.setItem(DEMO_VOTES_KEY, JSON.stringify(mine))
    } catch {
      // storage unavailable — vote holds for this page load only
    }
    return
  }

  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData?.session?.access_token
  if (!token) {
    const err = new Error('Sign in to vote.')
    err.code = 'auth_required'
    throw err
  }

  const res = await fetch('/api/vote', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ issueId, choice }),
  })

  if (!res.ok) {
    let body = {}
    try {
      body = await res.json()
    } catch {
      // non-JSON error body — fall through to the generic message
    }
    const err = new Error(body.message || 'Your vote could not be recorded.')
    err.code = body.error || 'server_error'
    throw err
  }
}

// Device id — still used for demo-mode votes and for private deliberation
// chat sessions (chats are per-device by design; see api/deliberate.js).
export { getVoterId }

// ---------- discrepancy & transparency ----------

export async function listPositions() {
  if (demoMode) return POSITIONS
  const { data, error } = await supabase.from('government_positions').select('*')
  if (error) throw error
  return data?.length ? data : POSITIONS
}

export async function listTransparency() {
  if (demoMode) return TRANSPARENCY
  const { data, error } = await supabase.from('transparency_entries').select('*')
  if (error) throw error
  return data?.length ? data : TRANSPARENCY
}
