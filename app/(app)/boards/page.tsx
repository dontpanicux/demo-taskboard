import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { BoardSummary } from '@/lib/types'
import { CreateBoardButton } from '@/components/board/CreateBoardButton'

export default async function BoardsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: boards, error } = await supabase
    .from('boards')
    .select('id, title, owner_id, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (error && process.env.NODE_ENV === 'development') {
    console.error('Failed to fetch boards:', error)
  }

  const boardList = (boards ?? []) as BoardSummary[]

  return (
    <div className="max-w-5xl mx-auto w-full px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-slate-900">My Boards</h1>
        <CreateBoardButton userId={user.id} />
      </div>

      {boardList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
            </svg>
          </div>
          <p className="text-slate-700 font-medium">No boards yet</p>
          <p className="text-slate-400 text-sm mt-1">Create your first board to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boardList.map((board) => (
            <Link
              key={board.id}
              href={`/boards/${board.id}`}
              className="group bg-white rounded-xl border border-slate-200 p-5 hover:border-sky-300 hover:shadow-md transition-all"
            >
              <h2 className="font-medium text-slate-900 group-hover:text-sky-600 transition-colors truncate">
                {board.title}
              </h2>
              <p className="text-xs text-slate-400 mt-2">
                {new Date(board.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
