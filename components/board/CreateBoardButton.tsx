'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface CreateBoardButtonProps {
  userId: string
}

export function CreateBoardButton({ userId }: CreateBoardButtonProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    setError(null)

    const { data: board, error: boardError } = await supabase
      .from('boards')
      .insert({ title: title.trim(), owner_id: userId })
      .select('id')
      .single()

    if (boardError || !board) {
      setError('Failed to create board. Please try again.')
      if (process.env.NODE_ENV === 'development') console.error(boardError)
      setLoading(false)
      return
    }

    // Seed default columns
    await supabase.from('columns').insert([
      { board_id: board.id, title: 'To Do', position: 0 },
      { board_id: board.id, title: 'In Progress', position: 1 },
      { board_id: board.id, title: 'Done', position: 2 },
    ])

    router.push(`/boards/${board.id}`)
    router.refresh()
  }

  function handleClose() {
    setOpen(false)
    setTitle('')
    setError(null)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        New Board
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Create board</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label htmlFor="board-title" className="block text-sm font-medium text-slate-700 mb-1">
                  Board name
                </label>
                <input
                  id="board-title"
                  type="text"
                  autoFocus
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Product Roadmap"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !title.trim()}
                  className="px-4 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
