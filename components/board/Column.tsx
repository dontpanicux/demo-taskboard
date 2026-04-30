'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Card } from './Card'
import { AddCardForm } from './AddCardForm'
import { EmptyColumn } from './EmptyColumn'
import type { Card as CardType, Column as ColumnType } from '@/lib/types'

interface ColumnProps {
  column: ColumnType
  onCardAdd: (columnId: string, card: CardType) => void
  onCardUpdate: (columnId: string, card: CardType) => void
  onCardDelete: (columnId: string, cardId: string) => void
}

export function Column({ column, onCardAdd, onCardUpdate, onCardDelete }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id, data: { type: 'column', column } })

  const cardIds = column.cards.map((c) => c.id)

  return (
    <div className={`bg-slate-100 rounded-xl p-3 w-72 shrink-0 flex flex-col max-h-full transition-colors ${isOver ? 'bg-sky-50 ring-2 ring-sky-300' : ''}`}>
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-sm font-semibold text-slate-700">{column.title}</span>
        <span className="text-xs text-slate-400 bg-slate-200 rounded-full px-2 py-0.5">
          {column.cards.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto scrollbar-thin space-y-2 min-h-[4px]"
      >
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {column.cards.length === 0 ? (
            <EmptyColumn />
          ) : (
            column.cards.map((card) => (
              <Card
                key={card.id}
                card={card}
                onUpdate={(updated) => onCardUpdate(column.id, updated)}
                onDelete={(cardId) => onCardDelete(column.id, cardId)}
              />
            ))
          )}
        </SortableContext>
      </div>

      <div className="mt-2 pt-2 border-t border-slate-200">
        <AddCardForm
          columnId={column.id}
          nextPosition={column.cards.length}
          onAdd={(card) => onCardAdd(column.id, card)}
        />
      </div>
    </div>
  )
}
