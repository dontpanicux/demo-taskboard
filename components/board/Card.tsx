'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CardModal } from './CardModal'
import type { Card as CardType } from '@/lib/types'

interface CardProps {
  card: CardType
  onUpdate: (updated: CardType) => void
  onDelete: (cardId: string) => void
}

const PRIORITY_STYLES: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-amber-100 text-amber-700',
  critical: 'bg-red-100 text-red-700',
}

export function Card({ card, onUpdate, onDelete }: CardProps) {
  const [modalOpen, setModalOpen] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, data: { type: 'card', card } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const isOverdue =
    card.due_date && new Date(card.due_date) < new Date(new Date().toDateString())

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={() => setModalOpen(true)}
        className="bg-white rounded-lg p-3 shadow-sm border border-slate-200 cursor-pointer hover:border-sky-300 hover:shadow-md transition-all select-none"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setModalOpen(true) }}
        aria-label={`Card: ${card.title}`}
      >
        <p className="text-sm text-slate-800 font-medium leading-snug line-clamp-3">
          {card.title}
        </p>

        {(card.priority || card.due_date) && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {card.priority && (
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PRIORITY_STYLES[card.priority] ?? ''}`}>
                {card.priority.charAt(0).toUpperCase() + card.priority.slice(1)}
              </span>
            )}
            {card.due_date && (
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                isOverdue ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {new Date(card.due_date + 'T00:00:00').toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            )}
          </div>
        )}
      </div>

      {modalOpen && (
        <CardModal
          card={card}
          onClose={() => setModalOpen(false)}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      )}
    </>
  )
}
