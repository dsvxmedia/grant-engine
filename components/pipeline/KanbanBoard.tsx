'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { KanbanColumn } from './KanbanColumn'
import type { KanbanColumn as KanbanColumnType } from './types'

interface KanbanBoardProps {
  columns: KanbanColumnType[]
  discoveredCount: number
}

export function KanbanBoard({ columns, discoveredCount }: KanbanBoardProps) {
  const [search, setSearch] = useState('')

  const q = search.trim().toLowerCase()

  const hydratedColumns = columns.map((col) => {
    const base = col.id === 'discovered' ? { ...col, count: discoveredCount } : col
    if (!q) return base
    const filtered = base.cards.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.funderName ?? '').toLowerCase().includes(q) ||
        (c.entityName ?? '').toLowerCase().includes(q)
    )
    return { ...base, cards: filtered, count: col.id === 'discovered' ? discoveredCount : filtered.length }
  })

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="flex items-center gap-2 px-6 pt-3 pb-2">
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search grants…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 rounded-md border border-input bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
          />
        </div>
        {q && (
          <button
            onClick={() => setSearch('')}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>

      {/* Kanban columns */}
      <div className="flex-1 flex gap-4 overflow-x-auto px-6 pb-6 pt-2">
        {hydratedColumns.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            label={col.label}
            count={col.count}
            cards={col.cards}
          />
        ))}
      </div>
    </div>
  )
}
