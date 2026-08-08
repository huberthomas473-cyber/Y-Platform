// Modal wrapper for the auth forms. Hand-rolled (no extra dependency):
// role="dialog" + aria-modal, Escape and backdrop close, focus moved into the
// dialog on open and restored on close.
import { useEffect, useRef, useState } from 'react'

import { LoginForm } from './LoginForm'
import { SignUpForm } from './SignUpForm'
import { ForgotPasswordForm } from './ForgotPasswordForm'
import { UpdatePasswordForm } from './UpdatePasswordForm'

export function AuthDialog({ open, initialView = 'login', onClose }) {
  const [view, setView] = useState(initialView)
  const panelRef = useRef(null)
  const restoreFocusRef = useRef(null)

  useEffect(() => {
    if (open) setView(initialView)
  }, [open, initialView])

  useEffect(() => {
    if (!open) return
    restoreFocusRef.current = document.activeElement
    // Move focus to the first focusable element inside the dialog.
    const first = panelRef.current?.querySelector('input, button')
    first?.focus()

    function onKeyDown(e) {
      if (e.key === 'Escape') onClose?.()
      if (e.key === 'Tab' && panelRef.current) {
        // Minimal focus trap: keep Tab cycling inside the dialog.
        const focusables = panelRef.current.querySelectorAll(
          'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
        )
        if (focusables.length === 0) return
        const firstEl = focusables[0]
        const lastEl = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault()
          lastEl.focus()
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault()
          firstEl.focus()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      restoreFocusRef.current?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Account"
        className="w-full max-w-md rounded-lg border border-border bg-card shadow-xl"
      >
        <div className="flex justify-end px-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="px-2 py-1 text-xl leading-none text-muted-foreground hover:text-foreground"
          >
            ×
          </button>
        </div>
        <div className="px-2 pb-2">
          {view === 'login' && <LoginForm onSuccess={onClose} onSwitch={setView} />}
          {view === 'sign-up' && <SignUpForm onSwitch={setView} />}
          {view === 'forgot-password' && <ForgotPasswordForm onSwitch={setView} />}
          {view === 'update-password' && <UpdatePasswordForm onSuccess={onClose} />}
        </div>
      </div>
    </div>
  )
}
