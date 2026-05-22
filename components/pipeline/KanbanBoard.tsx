'use client'

import { KanbanColumn } from './KanbanColumn'
import type { KanbanColumn as KanbanColumnType } from './types'

interface KanbanBoardProps {
  columns: KanbanColumnType[]
  discoveredCount: number
}

export function KanbanBoard({ columns, discoveredCount }: KanbanBoardProps) {
  // Inject the discovered count into the first column
  const hydratedColumns = columns.map((col) =>
    col.id === 'discovered' ? { ...col, count: discoveredCount } : col
  )

  return (
    <div className="flex h-full gap-4 overflow-x-auto px-6 pb-6 pt-4">
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
  )
}
