// /api/deliberate — the only server-side piece of Y.
//
// Why a server function at all: the Anthropic API key must never reach the
// browser, and deliberation chats are private per device-session, so they are
// written with the Supabase service-role key (RLS gives the public anon key
// zero access to deliberation_messages).
//
// Runs as a Vercel serverless function in production, and via the small
// middleware in vite.config.js during `npm run dev` (same handler, no drift).
//
//   GET  /api/deliberate?issue=<id>&session=<uuid>   → { messages, persisted }
//   POST /api/deliberate { issueId, sessionId, messages: [{role, content}] }
//        → { reply, persisted }

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { ISSUES } from '../src/data/seed.js'

const MAX_TURNS = 24 // history window sent to the model
const MAX_MESSAGE_CHARS = 4000

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function adminClient() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

function systemPrompt(issue) {
  return `You are the neutral facilitator of "Y", a voluntary global assembly where people deliberate before voting on real issues. Y has no owner, no algorithm, and no political alignment.

The participant is considering this issue:
Title: ${issue.title}
Framing: ${issue.framing}
Scope: ${issue.scope}

Your role is strictly neutral facilitation:
- Present the strongest good-faith arguments on multiple sides of the issue, clearly attributed as perspectives rather than your views.
- Provide factual context where helpful, and say plainly when facts are contested or uncertain.
- Ask an occasional clarifying question to help the participant examine their own reasoning.
- Never tell the participant how to vote, never reveal a preference, and if asked for your opinion, explain that the facilitator holds none by design.
- Stay on this issue; if asked about something unrelated, briefly redirect.
- Write in plain, accessible language. Keep responses focused and under roughly 200 words unless the participant asks for depth.`
}

function json(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

async function readBody(req) {
  if (req.body !== undefined) {
    // Vercel already parsed it
    return typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  }
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? JSON.parse(raw) : {}
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') return await getHistory(req, res)
    if (req.method === 'POST') return await chat(req, res)
    return json(res, 405, { error: 'method_not_allowed' })
  } catch (err) {
    console.error('deliberate error:', err)
    return json(res, 500, { error: 'server_error', message: 'Something went wrong. Please try again.' })
  }
}

async function getHistory(req, res) {
  const url = new URL(req.url, 'http://localhost')
  const issueId = url.searchParams.get('issue')
  const sessionId = url.searchParams.get('session')
  if (!issueId || !UUID_RE.test(sessionId || '')) {
    return json(res, 400, { error: 'bad_request' })
  }

  const admin = adminClient()
  if (!admin) return json(res, 200, { messages: [], persisted: false })

  const { data, error } = await admin
    .from('deliberation_messages')
    .select('role, content, created_at')
    .eq('issue_id', issueId)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(200)

  if (error) throw error
  return json(res, 200, { messages: data ?? [], persisted: true })
}

async function chat(req, res) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return json(res, 503, {
      error: 'not_configured',
      message:
        'The deliberation facilitator is not configured yet (missing ANTHROPIC_API_KEY on the server). See README.md.',
    })
  }

  const body = await readBody(req)
  const { issueId, sessionId } = body
  const issue = ISSUES.find((i) => i.id === issueId)
  if (!issue || !UUID_RE.test(sessionId || '') || !Array.isArray(body.messages)) {
    return json(res, 400, { error: 'bad_request' })
  }

  // Sanitize the client-sent history: roles + plain text only, bounded.
  const history = body.messages
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }))
    .slice(-MAX_TURNS)

  const lastUser = [...history].reverse().find((m) => m.role === 'user')
  if (!lastUser) return json(res, 400, { error: 'bad_request' })

  const anthropic = new Anthropic()
  const response = await anthropic.messages.create({
    model: 'claude-opus-5',
    max_tokens: 4096, // thinking counts toward this cap on Opus 5 — leave headroom
    // Chat turns are short and latency-sensitive; low effort on Opus 5 is
    // still strong and keeps replies snappy. Raise if depth matters more.
    output_config: { effort: 'low' },
    system: [
      {
        type: 'text',
        text: systemPrompt(issue),
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: history,
  })

  let reply
  if (response.stop_reason === 'refusal') {
    reply =
      'I can’t engage with that request. Let’s return to the issue at hand — is there a perspective on it you’d like to explore?'
  } else {
    reply = response.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim()
  }
  if (!reply) reply = 'I don’t have a response to that — could you rephrase?'

  // Persist the exchange when the database is configured; chat still works
  // statelessly without it (history then lives only in the browser).
  let persisted = false
  const admin = adminClient()
  if (admin) {
    const { error } = await admin.from('deliberation_messages').insert([
      { issue_id: issueId, session_id: sessionId, role: 'user', content: lastUser.content },
      { issue_id: issueId, session_id: sessionId, role: 'assistant', content: reply },
    ])
    if (error) console.error('persist error:', error)
    else persisted = true
  }

  return json(res, 200, { reply, persisted })
}
