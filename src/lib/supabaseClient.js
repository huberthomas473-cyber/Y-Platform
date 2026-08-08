import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isConfigured = Boolean(url && anonKey)

// Default auth options: sessions persist in localStorage, tokens auto-refresh,
// and auth redirects (email confirmation, password recovery) are picked up
// from the URL on load. Phase 1 ties votes to signed-in accounts, so the
// session must survive reloads.
export const supabase = isConfigured ? createClient(url, anonKey) : null
