export type Priority = 'low' | 'medium' | 'high' | 'critical'

export type Card = {
  id: string
  column_id: string
  title: string
  description: string | null
  priority: Priority | null
  due_date: string | null
  assignee_id: string | null
  position: number
  created_at: string
  updated_at: string
}

export type Column = {
  id: string
  board_id: string
  title: string
  position: number
  cards: Card[]
}

export type Board = {
  id: string
  title: string
  owner_id: string
  columns: Column[]
}

export type BoardSummary = {
  id: string
  title: string
  owner_id: string
  created_at: string
  updated_at: string
}
