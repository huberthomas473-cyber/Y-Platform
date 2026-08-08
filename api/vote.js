// /api/vote — the guarded door for vote writes (Phase 1).
//
// The browser can no longer write to the votes table (RLS allows no client
// inserts/updates — see supabase/setup.sql). Every vote goes through this
// endpoint, which:
//   1. requires a signed-in Supabase user (Bearer access token),
//   2. derives the voter id from the VERIFIED token — never from the client,
//   3. validates the issue and choice against the ballot,
//   4. rate-limits per IP and per user, plus a per-issue cooldown in the DB
//      (survives serverless instance churn),
//   5. writes with the service-role key.
//
// This does not solve identity (one PERSON, one vote) — it enforces one
// ACCOUNT, one vote per issue, and makes mass-cheating scripts expensive.
//
//   POST /api/vote  { issueId, choice }   Authorization: Bearer <access token>
//        → 200 { ok: true, issueId, choice }
//        → 401 auth_required · 400 bad_request · 429 rate_limited

import { createClient } from '@supabase/supabase-js'
import { ISSUES } from '../src/data/seed.js'

const CHOICES = new Set(['yes', 'no', 'abstain'])
const ISSUE_IDS = new Set(ISSUES.map((i) => i.id))

// In-memory sliding windows. Serverless instances don't share memory, so this
// is a best-effort burst brake per instance; the DB cooldown below is the
// cross-instance guarantee.
const WINDOW_MS = 60_000
const MAX_PER_IP = 30
const MAX_PER_USER = 12
const CHANGE_COOLDOWN_MS = 2_000

const hits = new Map() // key → [timestamps]

function overLimit(key, max) {
  const now = Date.now()
  const list = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS)
  if (list.length >= max) {
    hits.set(key, list)
    return true
  }
  list.push(now)
  hits.set(key, list)
  // Opportunistic cleanup so the map can't grow unbounded.
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k)
    }
  }
  return false
}

function adminClient() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

function json(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

async function readBody(req) {
  if (req.body !== undefined) {
    return typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  }
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? JSON.parse(raw) : {}
}

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for']
  return (typeof fwd === 'string' ? fwd.split(',')[0].trim() : '') || req.socket?.remoteAddress || 'unknown'
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { error: 'method_not_allowed' })

    const admin = adminClient()
    if (!admin) {
      return json(res, 503, {
        error: 'not_configured',
        message: 'Voting is not configured on the server (missing Supabase keys). See README.md.',
      })
    }

    if (overLimit(`ip:${clientIp(req)}`, MAX_PER_IP)) {
      return json(res, 429, { error: 'rate_limited', message: 'Too many requests. Slow down.' })
    }

    // --- authenticate: the voter is whoever the token proves they are ---
    const auth = req.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) {
      return json(res, 401, { error: 'auth_required', message: 'Sign in to vote.' })
    }
    const { data: userData, error: userError } = await admin.auth.getUser(token)
    if (userError || !userData?.user) {
      return json(res, 401, { error: 'auth_required', message: 'Your session has expired. Sign in again.' })
    }
    const voterId = userData.user.id

    if (overLimit(`user:${voterId}`, MAX_PER_USER)) {
      return json(res, 429, { error: 'rate_limited', message: 'Too many votes in a short time. Slow down.' })
    }

    // --- validate ---
    const body = await readBody(req)
    const { issueId, choice } = body ?? {}
    if (!ISSUE_IDS.has(issueId) || !CHOICES.has(choice)) {
      return json(res, 400, { error: 'bad_request' })
    }

    // --- per-(user, issue) cooldown, enforced in the database so it holds
    //     across serverless instances ---
    const { data: existing, error: readError } = await admin
      .from('votes')
      .select('updated_at')
      .eq('issue_id', issueId)
      .eq('voter_id', voterId)
      .maybeSingle()
    if (readError) throw readError
    if (existing && Date.now() - new Date(existing.updated_at).getTime() < CHANGE_COOLDOWN_MS) {
      return json(res, 429, { error: 'rate_limited', message: 'You are changing this vote too quickly.' })
    }

    // --- write (one row per (issue, voter); changing your vote is an upsert) ---
    const { error: writeError } = await admin.from('votes').upsert(
      {
        issue_id: issueId,
        voter_id: voterId,
        choice,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'issue_id,voter_id' }
    )
    if (writeError) throw writeError

    return json(res, 200, { ok: true, issueId, choice })
  } catch (err) {
    console.error('vote error:', err)
    return json(res, 500, { error: 'server_error', message: 'Something went wrong. Please try again.' })
  }
}
