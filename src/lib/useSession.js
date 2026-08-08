import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

// React hook for the Supabase auth session. Returns:
//   session        — the current session or null
//   authReady      — false until the initial session load resolves
//   passwordReset  — true after the user lands from a recovery email link
export function useSession() {
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(!supabase)
  const [passwordReset, setPasswordReset] = useState(false)

  useEffect(() => {
    if (!supabase) return

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null)
      setAuthReady(true)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession ?? null)
      if (event === 'PASSWORD_RECOVERY') setPasswordReset(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  return { session, authReady, passwordReset, clearPasswordReset: () => setPasswordReset(false) }
}
