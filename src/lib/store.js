// Data layer for Y.
//
// One interface, two backends:
//  - Supabase (real persistence) when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
//    are set — this is the intended production mode.
//  - Local demo mode otherwise: seeded content + localStorage votes, so the app
//    runs out of the box before the database is wired up. The UI shows a banner
//    whenever demo mode is active.
//
// Components only import from this module, never from supabaseClient directly —
// which also keeps input surfaces (voting, chat) thin enough that a future
// voice-to-text layer can call the same functions.

import { supabase, isConfigured } from './supabaseClient'
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

export async function getMyVotes(voterId) {
  if (demoMode) return readDemoVotes()
  const { data, error } = await supabase
    .from('votes')
    .select('issue_id, choice')
    .eq('voter_id', voterId)
  if (error) throw error
  const mine = {}
  for (const row of data ?? []) mine[row.issue_id] = row.choice
  return mine
}

export async function castVote(voterId, issueId, choice) {
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
  const { error } = await supabase.from('votes').upsert(
    {
      issue_id: issueId,
      voter_id: voterId,
      choice,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'issue_id,voter_id' }
  )
  if (error) throw error
}

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
