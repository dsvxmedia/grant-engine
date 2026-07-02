import { formatDeadline, isUrgent } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function DeadlineChip({ deadline }: { deadline: Date }) {
  const urgent = isUrgent(deadline)
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs',
      urgent ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'
    )}>
      {urgent && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
        </span>
      )}
      {formatDeadline(deadline)}
    </span>
  )
}
