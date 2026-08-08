// Publish verified content to the live database.
//
// Syncs POSITIONS and TRANSPARENCY from src/data/seed.js (the editorial
// source of truth — see docs/editorial-rulebook.md) into Supabase.
// Content tables only: never touches issues, votes, or deliberation data.
//
// Usage:  node scripts/sync-content.mjs
// Reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env — server-side
// only, never commit that file. (No local setup? Run the equivalent
// supabase/phase2-content.sql in the Supabase SQL Editor instead.)

import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { POSITIONS, TRANSPARENCY } from '../src/data/seed.js'

for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
}

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const db = createClient(url, key, { auth: { persistSession: false } })

async function replaceAll(table, rows) {
  const del = await db.from(table).delete().not('id', 'is', null)
  if (del.error) throw new Error(`${table} delete: ${del.error.message}`)
  const ins = await db.from(table).insert(rows)
  if (ins.error) throw new Error(`${table} insert: ${ins.error.message}`)
  console.log(`${table}: replaced with ${rows.length} verified rows`)
}

await replaceAll('government_positions', POSITIONS)
await replaceAll('transparency_entries', TRANSPARENCY)
console.log('Done. Reload the app to see the updated content.')
