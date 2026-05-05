'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Mode = 'magic-link' | 'password' | 'signup'

function passwordStrength(pw: string): { score: number; label: string } {
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong']
  return { score, label: labels[score] ?? '' }
}

const strengthColor = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400', 'bg-emerald-500']

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const supabase = createClient()

  function resetForm() {
    setPassword('')
    setConfirmPassword('')
    setMessage(null)
    setShowPassword(false)
  }

  function switchMode(next: Mode) {
    setMode(next)
    resetForm()
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setMessage(
      error
        ? { type: 'error', text: error.message }
        : { type: 'success', text: 'Check your email for the login link!' }
    )
    setLoading(false)
  }

  async function handlePasswordSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      // Generic message — don't reveal whether email exists
      setMessage({ type: 'error', text: 'Invalid email or password.' })
    }
    setLoading(false)
  }

  async function handleForgotPassword() {
    if (!email) {
      setMessage({ type: 'error', text: 'Enter your email address above first.' })
      return
    }
    setLoading(true)
    setMessage(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    })
    // Always show success — don't confirm whether the email exists
    setMessage({
      type: 'success',
      text: error ? error.message : 'If that email is registered you\'ll receive a reset link shortly.',
    })
    setLoading(false)
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' })
      return
    }
    const { score } = passwordStrength(password)
    if (score < 2) {
      setMessage({ type: 'error', text: 'Password is too weak. Use at least 8 characters with mixed case or numbers.' })
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Account created! Check your email to confirm before signing in.' })
      resetForm()
    }
    setLoading(false)
  }

  async function handleGitHub() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setMessage({ type: 'error', text: error.message })
      setLoading(false)
    }
  }

  const { score: pwScore, label: pwLabel } = passwordStrength(password)

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-sky-500 mb-4">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">FlowBoard</h1>
          <p className="text-slate-500 mt-1 text-sm">Sign in to manage your boards</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">

          {/* Mode tabs */}
          <div className="flex rounded-lg bg-slate-100 p-1 gap-1">
            {(['password', 'magic-link', 'signup'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  mode === m
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {m === 'password' ? 'Password' : m === 'magic-link' ? 'Magic link' : 'Sign up'}
              </button>
            ))}
          </div>

          {/* Magic link */}
          {mode === 'magic-link' && (
            <form onSubmit={handleMagicLink} className="space-y-3">
              <EmailField email={email} onChange={setEmail} />
              <SubmitButton loading={loading}>Send magic link</SubmitButton>
            </form>
          )}

          {/* Password sign-in */}
          {mode === 'password' && (
            <form onSubmit={handlePasswordSignIn} className="space-y-3">
              <EmailField email={email} onChange={setEmail} />
              <div className="space-y-1">
                <PasswordField
                  value={password}
                  onChange={setPassword}
                  show={showPassword}
                  onToggleShow={() => setShowPassword((v) => !v)}
                  label="Password"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={loading}
                    className="text-xs text-sky-600 hover:text-sky-700 disabled:opacity-50"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>
              <SubmitButton loading={loading}>Sign in</SubmitButton>
            </form>
          )}

          {/* Sign up */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3">
              <EmailField email={email} onChange={setEmail} />
              <PasswordField
                value={password}
                onChange={setPassword}
                show={showPassword}
                onToggleShow={() => setShowPassword((v) => !v)}
                label="Password"
              />
              {/* Strength meter */}
              {password.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i <= pwScore ? strengthColor[pwScore] : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">{pwLabel}</p>
                </div>
              )}
              <PasswordField
                value={confirmPassword}
                onChange={setConfirmPassword}
                show={showPassword}
                onToggleShow={() => setShowPassword((v) => !v)}
                label="Confirm password"
                autoComplete="new-password"
              />
              <SubmitButton loading={loading}>Create account</SubmitButton>
            </form>
          )}

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs text-slate-400">
              <span className="bg-white px-2">or</span>
            </div>
          </div>

          {/* GitHub */}
          <button
            onClick={handleGitHub}
            disabled={loading}
            className="w-full py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Continue with GitHub
          </button>

          {message && (
            <p className={`text-sm text-center rounded-lg px-3 py-2 ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message.text}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function EmailField({ email, onChange }: { email: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
        Email address
      </label>
      <input
        id="email"
        type="email"
        required
        value={email}
        onChange={(e) => onChange(e.target.value)}
        placeholder="you@example.com"
        autoComplete="email"
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
      />
    </div>
  )
}

function PasswordField({
  value,
  onChange,
  show,
  onToggleShow,
  label,
  autoComplete = 'current-password',
}: {
  value: string
  onChange: (v: string) => void
  show: boolean
  onToggleShow: () => void
  label: string
  autoComplete?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          minLength={8}
          className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
          tabIndex={-1}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}

function SubmitButton({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full py-2 px-4 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Please wait…' : children}
    </button>
  )
}
