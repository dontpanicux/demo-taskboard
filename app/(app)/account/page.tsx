'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

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

export default function AccountPage() {
  const supabase = createClient()

  const [displayName, setDisplayName] = useState('')
  const [nameStatus, setNameStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [nameLoading, setNameLoading] = useState(false)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [pwStatus, setPwStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [pwLoading, setPwLoading] = useState(false)

  async function handleUpdateName(e: React.FormEvent) {
    e.preventDefault()
    setNameLoading(true)
    setNameStatus(null)
    const { error } = await supabase.auth.updateUser({
      data: { full_name: displayName.trim() },
    })
    setNameStatus(
      error
        ? { type: 'error', text: error.message }
        : { type: 'success', text: 'Display name updated.' }
    )
    setNameLoading(false)
  }

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault()
    setPwStatus(null)

    if (password !== confirmPassword) {
      setPwStatus({ type: 'error', text: 'Passwords do not match.' })
      return
    }
    const { score } = passwordStrength(password)
    if (score < 2) {
      setPwStatus({ type: 'error', text: 'Password is too weak. Use at least 8 characters with mixed case or numbers.' })
      return
    }

    setPwLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setPwStatus({ type: 'error', text: error.message })
    } else {
      setPwStatus({ type: 'success', text: 'Password set. You can now sign in with email and password.' })
      setPassword('')
      setConfirmPassword('')
    }
    setPwLoading(false)
  }

  const { score: pwScore, label: pwLabel } = passwordStrength(password)

  return (
    <div className="max-w-lg mx-auto px-4 py-10 space-y-8">
      <h1 className="text-xl font-bold text-slate-900">Account settings</h1>

      {/* Display name */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Display name</h2>
          <p className="text-xs text-slate-500 mt-0.5">Shown in the app next to your avatar.</p>
        </div>
        <form onSubmit={handleUpdateName} className="space-y-3">
          <input
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            maxLength={64}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={nameLoading}
            className="w-full py-2 px-4 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {nameLoading ? 'Saving…' : 'Save name'}
          </button>
          {nameStatus && (
            <p className={`text-sm text-center rounded-lg px-3 py-2 ${
              nameStatus.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {nameStatus.text}
            </p>
          )}
        </form>
      </section>

      {/* Set / update password */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Set or update password</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            If you signed in with a magic link or GitHub, setting a password lets you also sign in with email and password.
          </p>
        </div>
        <form onSubmit={handleSetPassword} className="space-y-3">
          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">New password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

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

          {/* Confirm password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={pwLoading}
            className="w-full py-2 px-4 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pwLoading ? 'Saving…' : 'Set password'}
          </button>

          {pwStatus && (
            <p className={`text-sm text-center rounded-lg px-3 py-2 ${
              pwStatus.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {pwStatus.text}
            </p>
          )}
        </form>
      </section>
    </div>
  )
}
