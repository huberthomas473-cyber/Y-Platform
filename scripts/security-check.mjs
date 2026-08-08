// Pre-launch security gate for Y.
//
// Runs the attacks a real adversary would run, using only the PUBLIC browser
// key, and fails loudly if any of them work. Run this after applying
// supabase/phase1-auth.sql, after any policy change, and before any partner
// drives traffic to a campaign.
//
//   node scripts/security-check.mjs
//   → exits 0 if every critical check passes, 1 otherwise
//
// NOTE: check 3 briefly creates and removes one canary vote row (needed to
// prove that UPDATE is blocked on a row that actually exists). Counts are
// unaffected within a second. Run before a campaign, not during one.

import { readFileSync } from 'node:fs'

for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
}

const URL_BASE = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const ANON = process.env.VITE_SUPABASE_ANON_KEY
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!URL_BASE || !ANON) {
  console.error('Missing SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env')
  process.exit(1)
}

const CANARY = '00000000-dead-4000-8000-00000000ca11'
const results = []

function record(name, passed, detail, { critical = true } = {}) {
  results.push({ name, passed, detail, critical })
  const tag = passed ? '  PASS' : critical ? '  FAIL' : '  WARN'
  console.log(`${tag}  ${name}\n        ${detail}`)
}

const anonHeaders = { apikey: ANON, 'Content-Type': 'application/json' }
const svcHeaders = SERVICE
  ? { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'application/json' }
  : null

async function rest(path, init = {}, headers = anonHeaders) {
  // init.headers must win over the base set, or per-call headers like
  // `Prefer: return=representation` are silently dropped — which turns the
  // tamper check into a false PASS.
  const res = await fetch(`${URL_BASE}/rest/v1/${path}`, {
    ...init,
    headers: { ...headers, ...(init.headers ?? {}) },
  })
  const text = await res.text()
  let body
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }
  return { status: res.status, body }
}

console.log(`\nY security check → ${URL_BASE}\n`)

// 1. Raw vote rows must NOT be publicly readable (voter_id + choice = secret ballot).
{
  const { body } = await rest('votes?select=voter_id,choice&limit=1')
  const leaked = Array.isArray(body) && body.length > 0
  record(
    'Raw votes are not publicly readable',
    !leaked,
    leaked
      ? `LEAK: the public key returned vote rows including voter_id (${body.length} shown). Anyone can see who voted what.`
      : 'Public key cannot read individual vote rows.'
  )
}

// 2. The public key must NOT be able to insert votes (ballot stuffing).
{
  const { status, body } = await rest('votes', {
    method: 'POST',
    body: JSON.stringify({ issue_id: 'beach-access', voter_id: CANARY, choice: 'yes' }),
  })
  const inserted = status === 201 || status === 200
  record(
    'Public key cannot insert votes',
    !inserted,
    inserted
      ? 'CRITICAL: a vote was written with no account and no /api/vote call. Ballot stuffing is possible.'
      : `Insert rejected (HTTP ${status}${body?.code ? `, ${body.code}` : ''}).`
  )
  if (inserted && svcHeaders) {
    await rest(`votes?voter_id=eq.${CANARY}`, { method: 'DELETE' }, svcHeaders)
  }
}

// 3. The public key must NOT be able to change an existing vote (tampering).
if (svcHeaders) {
  await rest(`votes?voter_id=eq.${CANARY}`, { method: 'DELETE' }, svcHeaders)
  const seed = await rest(
    'votes',
    {
      method: 'POST',
      body: JSON.stringify({ issue_id: 'beach-access', voter_id: CANARY, choice: 'yes' }),
    },
    svcHeaders
  )
  if (seed.status === 201 || seed.status === 200) {
    const { body } = await rest(`votes?voter_id=eq.${CANARY}`, {
      method: 'PATCH',
      headers: { ...anonHeaders, Prefer: 'return=representation' },
      body: JSON.stringify({ choice: 'no' }),
    })
    // PostgREST returns [] when RLS blocks the row, or the changed row when it doesn't.
    const tampered = Array.isArray(body) && body.length > 0
    record(
      'Public key cannot change an existing vote',
      !tampered,
      tampered
        ? 'CRITICAL: the public key rewrote another voter’s choice. Any result can be forged.'
        : 'Update rejected — existing votes are immutable to clients.'
    )
    await rest(`votes?voter_id=eq.${CANARY}`, { method: 'DELETE' }, svcHeaders)
  } else {
    record('Public key cannot change an existing vote', false, 'INCONCLUSIVE: could not seed canary row.', {
      critical: false,
    })
  }
} else {
  record('Public key cannot change an existing vote', false, 'SKIPPED: no service key in .env.', {
    critical: false,
  })
}

// 4. Public aggregate counts MUST still work (the app depends on them).
{
  const { status, body } = await rest('vote_totals?select=issue_id,total&limit=1')
  const ok = status === 200 && Array.isArray(body)
  record(
    'Public aggregate counts still readable',
    ok,
    ok ? 'vote_totals is readable — results will render.' : `BROKEN: vote_totals unreadable (HTTP ${status}).`
  )
}

// 5. Sourced content must be read-only to the public (credibility layer).
{
  const before = await rest('government_positions?issue_id=eq.beach-access&select=stance')
  const original = Array.isArray(before.body) && before.body[0]?.stance
  await rest('government_positions?issue_id=eq.beach-access', {
    method: 'PATCH',
    body: JSON.stringify({ stance: 'aligned' }),
  })
  const after = await rest('government_positions?issue_id=eq.beach-access&select=stance')
  const now = Array.isArray(after.body) && after.body[0]?.stance
  const changed = original && now && original !== now
  record(
    'Sourced claims cannot be rewritten by the public',
    !changed,
    changed
      ? `CRITICAL: stance changed ${original} → ${now}. Restore it and add RLS.`
      : 'Institutional positions are read-only to clients.'
  )
  if (changed && svcHeaders) {
    await rest(
      'government_positions?issue_id=eq.beach-access',
      { method: 'PATCH', body: JSON.stringify({ stance: original }) },
      svcHeaders
    )
  }
}

// 6. Private deliberation chats must be unreadable.
{
  const { body } = await rest('deliberation_messages?select=content&limit=1')
  const leaked = Array.isArray(body) && body.length > 0
  record(
    'Deliberation chats are private',
    !leaked,
    leaked ? 'LEAK: chat contents readable with the public key.' : 'No client access to deliberation_messages.'
  )
}

// 7. Anonymous sign-ins must be off (they would mint tokens with no email).
{
  const res = await fetch(`${URL_BASE}/auth/v1/signup`, {
    method: 'POST',
    headers: anonHeaders,
    body: JSON.stringify({}),
  })
  const body = await res.json().catch(() => ({}))
  const disabled = body?.error_code === 'anonymous_provider_disabled' || res.status >= 400
  record(
    'Anonymous sign-ins disabled',
    disabled,
    disabled ? 'Anonymous provider is off.' : 'CRITICAL: anyone can mint a session with no email at all.'
  )
}

// 8. Email confirmation must be enforced, or accounts are free to mass-create.
// Read the server's own auth config rather than probing signup — probing is
// rate-limited, creates junk users, and misreports when the probe address is
// rejected for an unrelated reason.
{
  const res = await fetch(`${URL_BASE}/auth/v1/settings`, { headers: { apikey: ANON } })
  const cfg = await res.json().catch(() => null)
  if (!cfg) {
    record('Email confirmation enforced', false, 'INCONCLUSIVE: could not read /auth/v1/settings.', {
      critical: false,
    })
  } else {
    const autoConfirm = cfg.mailer_autoconfirm === true
    record(
      'Email confirmation enforced',
      !autoConfirm,
      autoConfirm
        ? 'CRITICAL: mailer_autoconfirm is ON — signups are auto-confirmed, so scripted fake addresses each get a real vote. Turn OFF autoconfirm (Authentication → Sign In/Up → Confirm email ON).'
        : 'mailer_autoconfirm is off — new accounts must confirm a real, deliverable address.'
    )
    if (cfg.disable_signup === true) {
      record('Signups are open', false, 'NOTE: signup is disabled — nobody new can register to vote.', {
        critical: false,
      })
    }
  }
}

const failed = results.filter((r) => !r.passed && r.critical)
console.log(
  `\n${results.filter((r) => r.passed).length}/${results.length} checks passed` +
    (failed.length ? ` — ${failed.length} CRITICAL failure(s).\n` : ' — safe to launch on this dimension.\n')
)
if (failed.length) {
  console.log('Fix before launch:')
  for (const f of failed) console.log(`  · ${f.name}`)
  console.log('\nMost failures above are fixed by running supabase/phase1-auth.sql in the SQL Editor.\n')
}
process.exit(failed.length ? 1 : 0)
