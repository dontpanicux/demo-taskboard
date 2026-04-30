import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BoardCanvas } from '@/components/board/BoardCanvas'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import type { Board, Column, Card } from '@/lib/types'

interface BoardPageProps {
  params: Promise<{ id: string }>
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: boardData, error: boardError } = await supabase
    .from('boards')
    .select('id, title, owner_id')
    .eq('id', id)
    .single()

  if (boardError || !boardData) {
    if (process.env.NODE_ENV === 'development') console.error(boardError)
    notFound()
  }

  const { data: columnsData, error: columnsError } = await supabase
    .from('columns')
    .select('id, board_id, title, position')
    .eq('board_id', id)
    .order('position', { ascending: true })

  if (columnsError && process.env.NODE_ENV === 'development') {
    console.error(columnsError)
  }

  const columnIds = (columnsData ?? []).map((c) => c.id)

  const { data: cardsData, error: cardsError } = columnIds.length > 0
    ? await supabase
        .from('cards')
        .select('id, column_id, title, description, priority, due_date, assignee_id, position, created_at, updated_at')
        .in('column_id', columnIds)
        .order('position', { ascending: true })
    : { data: [], error: null }

  if (cardsError && process.env.NODE_ENV === 'development') {
    console.error(cardsError)
  }

  const cardsByColumn = ((cardsData ?? []) as Card[]).reduce<Record<string, Card[]>>((acc, card) => {
    if (!acc[card.column_id]) acc[card.column_id] = []
    acc[card.column_id].push(card)
    return acc
  }, {})

  const columns: Column[] = (columnsData ?? []).map((col) => ({
    ...col,
    cards: cardsByColumn[col.id] ?? [],
  }))

  const board: Board = {
    ...boardData,
    columns,
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 bg-white flex items-center gap-3">
        <h1 className="text-base font-semibold text-slate-900 truncate">{board.title}</h1>
        <span className="text-xs text-slate-400">{columns.length} column{columns.length !== 1 ? 's' : ''}</span>
      </div>

      <ErrorBoundary>
        <BoardCanvas board={board} />
      </ErrorBoundary>
    </div>
  )
}
