'use client'

import { ScrollArea } from '@/components/ui/scroll-area'
import { GrantCard } from './GrantCard'
import type { KanbanCard } from './types'

interface KanbanColumnProps {
  id: string
  label: string
  count: number
  cards: KanbanCard[]
}

export function KanbanColumn({ label, count, cards }: KanbanColumnProps) {
  return (
    <div className="flex w-56 shrink-0 flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-medium text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
      </div>

      <ScrollArea className="h-[calc(100vh-9rem)]">
        <div className="flex flex-col gap-2 pr-2">
          {cards.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
              Empty
            </div>
          ) : (
            cards.map((card) => <GrantCard key={card.id} card={card} />)
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
