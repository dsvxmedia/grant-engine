'use client'

import { ScrollArea } from '@/components/ui/scroll-area'
import { GrantCard } from './GrantCard'
import type { KanbanCard } from './types'

const DOT_COLOR: Record<string, string> = {
  discovered: 'bg-slate-400',
  loi:        'bg-blue-400',
  matched:    'bg-violet-500',
  qa_review:  'bg-amber-400',
  review:     'bg-orange-400',
  submitted:  'bg-green-500',
}

interface KanbanColumnProps {
  id: string
  label: string
  count: number
  cards: KanbanCard[]
}

export function KanbanColumn({ id, label, count, cards }: KanbanColumnProps) {
  const dot = DOT_COLOR[id] ?? 'bg-slate-400'
  return (
    <div className="flex w-56 shrink-0 flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <span className={`size-1.5 rounded-full shrink-0 ${dot}`} aria-hidden="true" />
          <span className="text-xs font-medium text-foreground">{label}</span>
        </div>
        <span className="rounded-full bg-muted px-1.5 py-px text-[10px] font-medium tabular-nums text-muted-foreground leading-none">
          {count}
        </span>
      </div>

      <ScrollArea className="h-[calc(100vh-16rem)]">
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
