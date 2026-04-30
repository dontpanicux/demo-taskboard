'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable'
import { createClient } from '@/lib/supabase/client'
import { Column } from './Column'
import { Card } from './Card'
import type { Board, Column as ColumnType, Card as CardType } from '@/lib/types'

interface BoardCanvasProps {
  board: Board
}

export function BoardCanvas({ board: initialBoard }: BoardCanvasProps) {
  const [columns, setColumns] = useState<ColumnType[]>(initialBoard.columns)
  const [activeCard, setActiveCard] = useState<CardType | null>(null)
  const supabase = createClient()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function findColumnOfCard(cardId: string): ColumnType | undefined {
    return columns.find((col) => col.cards.some((c) => c.id === cardId))
  }

  function handleDragStart(event: DragStartEvent) {
    const { active } = event
    if (active.data.current?.type === 'card') {
      setActiveCard(active.data.current.card as CardType)
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeType = active.data.current?.type
    if (activeType !== 'card') return

    const activeColId = findColumnOfCard(active.id as string)?.id
    const overType = over.data.current?.type

    let targetColId: string | undefined
    if (overType === 'column') {
      targetColId = over.id as string
    } else if (overType === 'card') {
      targetColId = findColumnOfCard(over.id as string)?.id
    }

    if (!activeColId || !targetColId || activeColId === targetColId) return

    setColumns((cols) => {
      const sourceCol = cols.find((c) => c.id === activeColId)!
      const destCol = cols.find((c) => c.id === targetColId)!
      const cardToMove = sourceCol.cards.find((c) => c.id === active.id)!

      const overIndex = destCol.cards.findIndex((c) => c.id === over.id)
      const insertAt = overIndex >= 0 ? overIndex : destCol.cards.length

      return cols.map((col) => {
        if (col.id === activeColId) {
          return { ...col, cards: col.cards.filter((c) => c.id !== active.id) }
        }
        if (col.id === targetColId) {
          const newCards = [...col.cards]
          newCards.splice(insertAt, 0, { ...cardToMove, column_id: targetColId })
          return { ...col, cards: newCards }
        }
        return col
      })
    })
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveCard(null)

    if (!over || active.id === over.id) return

    const activeType = active.data.current?.type
    if (activeType !== 'card') return

    const activeColId = findColumnOfCard(active.id as string)?.id
    const overType = over.data.current?.type

    let targetColId: string | undefined
    if (overType === 'column') {
      targetColId = over.id as string
    } else if (overType === 'card') {
      targetColId = findColumnOfCard(over.id as string)?.id
    }

    if (!activeColId || !targetColId) return

    setColumns((cols) => {
      const sourceCol = cols.find((c) => c.id === activeColId)!
      const destCol = cols.find((c) => c.id === targetColId!)!

      if (activeColId === targetColId) {
        const oldIndex = sourceCol.cards.findIndex((c) => c.id === active.id)
        const newIndex = sourceCol.cards.findIndex((c) => c.id === over.id)
        if (oldIndex === newIndex) return cols

        const reordered = arrayMove(sourceCol.cards, oldIndex, newIndex)
        const updated = cols.map((col) =>
          col.id === activeColId ? { ...col, cards: reordered } : col
        )
        persistCardPositions(activeColId, reordered)
        return updated
      }

      // Already moved in dragOver — just persist
      const destCards = destCol.cards
      persistCardMove(active.id as string, targetColId!, destCards)
      return cols
    })
  }

  async function persistCardPositions(columnId: string, cards: CardType[]) {
    const updates = cards.map((card, index) =>
      supabase.from('cards').update({ position: index }).eq('id', card.id)
    )
    await Promise.all(updates)
  }

  async function persistCardMove(cardId: string, newColumnId: string, newCards: CardType[]) {
    const cardIndex = newCards.findIndex((c) => c.id === cardId)
    await supabase
      .from('cards')
      .update({ column_id: newColumnId, position: cardIndex })
      .eq('id', cardId)

    // Re-number the rest
    const updates = newCards.map((card, index) =>
      supabase.from('cards').update({ position: index }).eq('id', card.id)
    )
    await Promise.all(updates)
  }

  const handleCardAdd = useCallback((columnId: string, card: CardType) => {
    setColumns((cols) =>
      cols.map((col) =>
        col.id === columnId ? { ...col, cards: [...col.cards, card] } : col
      )
    )
  }, [])

  const handleCardUpdate = useCallback((columnId: string, updated: CardType) => {
    setColumns((cols) =>
      cols.map((col) =>
        col.id === columnId
          ? { ...col, cards: col.cards.map((c) => (c.id === updated.id ? updated : c)) }
          : col
      )
    )
  }, [])

  const handleCardDelete = useCallback((columnId: string, cardId: string) => {
    setColumns((cols) =>
      cols.map((col) =>
        col.id === columnId
          ? { ...col, cards: col.cards.filter((c) => c.id !== cardId) }
          : col
      )
    )
  }, [])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 p-4 h-full items-start">
          {columns.map((column) => (
            <Column
              key={column.id}
              column={column}
              onCardAdd={handleCardAdd}
              onCardUpdate={handleCardUpdate}
              onCardDelete={handleCardDelete}
            />
          ))}

          {columns.length === 0 && (
            <div className="flex items-center justify-center w-full text-slate-400 text-sm">
              No columns yet. Add columns from the board settings.
            </div>
          )}
        </div>
      </div>

      <DragOverlay>
        {activeCard && (
          <div className="rotate-2 opacity-90 pointer-events-none">
            <Card
              card={activeCard}
              onUpdate={() => {}}
              onDelete={() => {}}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
