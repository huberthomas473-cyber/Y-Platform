# Y — A Global Assembly

A civic platform where people vote on real issues, see the gap between public
opinion and what institutions actually do, browse transparency data on corporate
and political connections, and deliberate with a strictly neutral AI facilitator
before voting.

**Y has no owner, no algorithm, and no political alignment.** It exists to
document the gap between what people want and what governments do — and to make
that gap visible and hard to ignore.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + Vite | Fast, minimal, deploys anywhere |
| Database | Supabase (Postgres + RLS) | Real persistence on the free tier; schema + policies in one SQL file |
| AI deliberation | Anthropic API (`claude-opus-5`) via one Vercel serverless function | Keeps the API key server-side; chats stay private via the service-role key |
| Hosting | Vercel | Static build + `/api` function, zero config |

## Project layout

```
y-platform/
├── api/deliberate.js        # the ONLY server code: Claude proxy + private chat persistence
├── supabase/setup.sql       # full schema, RLS policies, and seed data — run once in Supabase
├── vite.config.js           # dev server mounts the same /api handler locally
├── vercel.json              # function timeout for the Claude call
├── .env.example             # every key the app uses
└── src/
    ├── App.jsx              # shell: masthead, nav, demo banner, footer
    ├── styles.css           # ink/cream/gold design system
    ├── data/seed.js         # issues, positions, transparency samples (mirrors setup.sql)
    ├── lib/
    │   ├── identity.js      # per-device voter id (MVP anti-duplicate voting)
    │   ├── supabaseClient.js
    │   └── store.js         # data layer: Supabase, or local demo mode if unconfigured
    └── components/
        ├── Referendum.jsx   # voting + live results + ¾ supermajority meter
        ├── Discrepancy.jsx  # assembly vs. institutions gap meters
        ├── Transparency.jsx # searchable ownership/connections table
        └── Deliberate.jsx   # AI-facilitated chat, one issue at a time
```

## Run it now (demo mode)

```bash
npm install
npm run dev
```

Without any configuration the app runs in **demo mode**: seeded content,
illustrative vote counts, votes stored in the browser only. A banner says so.
This exists so you can see and develop everything before wiring credentials —
it is not the product.

## Go live

### 1. Supabase (persistence — the core of the MVP)

1. Create a project at [supabase.com](https://supabase.com) (free tier is fine;
   pick an EU region if you want data residency there).
2. Open **SQL Editor**, paste the whole of [`supabase/setup.sql`](supabase/setup.sql),
   and run it. This creates the tables, row-level-security policies, the
   `vote_totals` view, and seeds the six issues plus discrepancy/transparency data.
3. From **Settings → API**, copy the project URL and the `anon` public key.
4. Copy `.env.example` to `.env` and fill in:
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (client)
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (server — for private
     deliberation history; the service key must never be prefixed `VITE_`)
5. Restart `npm run dev`. The demo banner disappears; votes now persist in
   Postgres and survive refreshes, devices, and deploys. Counts start from zero —
   real deployments get no fake baseline.

### 2. Anthropic (Deliberate section)

1. Create an API key at [platform.claude.com](https://platform.claude.com).
2. Set `ANTHROPIC_API_KEY` in `.env`.

The key is only ever read by `api/deliberate.js` on the server. If it's missing
the rest of the app works and the chat shows a clear "not configured" notice.

### 3. Deploy to Vercel

```bash
npx vercel
```

Then in the Vercel dashboard → Project → Settings → Environment Variables, add
all five variables from `.env.example`. Vercel builds the Vite app and serves
`api/deliberate.js` as a serverless function automatically (`vercel.json` gives
it a 60s timeout for the Claude call).

## Design decisions worth knowing

- **Votes**: one row per (issue, device), enforced by a unique constraint;
  changing your vote is an upsert. Aggregates come from a database view so the
  client never processes raw votes.
- **Anti-duplicate voting is deliberately minimal**: a random UUID per browser
  (`localStorage`). Clearing storage creates a new "voter". Real
  one-person-one-vote identity is a known unsolved problem and explicitly
  phase-2 — the code comments mark every place this matters.
- **Deliberation privacy**: `deliberation_messages` has RLS enabled with *no*
  public policies. Only the serverless function (service-role key) touches it,
  so no participant can read another's conversation.
- **AI neutrality is enforced in the system prompt**: the facilitator presents
  multiple perspectives, flags contested facts, and refuses to state a
  preference. It also handles Claude's `refusal` stop reason gracefully.
- **Voice-ready inputs**: vote buttons and the chat input both submit through
  plain callbacks (`onCast(choice)`, `onSend(text)`), so a voice-to-text layer
  can be added later without restructuring components.
- **Localization-ready-ish**: all issue content lives in `src/data/seed.js` /
  the database rather than being scattered through components. UI chrome strings
  are still inline — extract them when translation actually starts.

## Known limitations / roadmap

- Identity verification (one-person-one-vote) — unsolved, phase 2+.
- Vote tampering via crafted API calls is possible with anonymous device
  identity; next hardening step is moving vote writes behind a server endpoint
  with rate limiting.
- Discrepancy and transparency rows are curated seed data (August 2026) with
  source fields — verify every claim and link before public launch. The
  transparency schema is built to take real sourced records without redesign.
- Voice-first input, multi-language, moderated public deliberation walls,
  admin tooling: future phases.
