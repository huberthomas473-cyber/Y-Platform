// Adapted from Supabase UI Library `password-based-auth-react` block
// (supabase.com/ui). Changes: shared supabase client, SPA callbacks, explicit
// emailRedirectTo so confirmation links land back on this deployment.
import { useState } from 'react'

import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function SignUpForm({ className, onSwitch, ...props }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSignUp = async (e) => {
    e.preventDefault()
    setError(null)

    if (password !== repeatPassword) {
      setError('Passwords do not match')
      return
    }
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      })
      if (error) throw error
      setSuccess(true)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      {success ? (
        <Card className="border-0 bg-transparent">
          <CardHeader>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription>Confirm your address to activate your account</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              We sent a confirmation link to <strong>{email}</strong>. Open it, then come back
              and sign in. One account = one email = one vote per issue.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 bg-transparent">
          <CardHeader>
            <CardTitle className="text-2xl">Sign up</CardTitle>
            <CardDescription>
              Voting requires an account so each email counts once.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.org"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="signup-repeat-password">Repeat password</Label>
                  <Input
                    id="signup-repeat-password"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Creating account…' : 'Sign up'}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => onSwitch?.('login')}
                  className="underline underline-offset-4"
                >
                  Sign in
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
