'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'

interface NavbarProps {
  userEmail?: string | null
  userName?: string | null
}

export function Navbar({ userEmail, userName }: NavbarProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-4">
      <Link href="/boards" className="flex items-center gap-2 font-semibold text-slate-900 hover:text-sky-600 transition-colors">
        <div className="w-7 h-7 bg-sky-500 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
          </svg>
        </div>
        FlowBoard
      </Link>

      <nav className="flex-1 flex items-center gap-1">
        <Link
          href="/boards"
          className="text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors"
        >
          Boards
        </Link>
      </nav>

      <div className="flex items-center gap-3">
        {(userName || userEmail) && (
          <Link href="/account" aria-label="Account settings">
            <Avatar name={userName} email={userEmail} size="sm" />
          </Link>
        )}
        <button
          onClick={handleSignOut}
          className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
