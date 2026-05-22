import { formatDeadline, isUrgent } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function DeadlineChip({ deadline }: { deadline: Date }) {
  const urgent = isUrgent(deadline)
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2 py-0.5 text-xs',
      urgent ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'
    )}>
      {formatDeadline(deadline)}
    </span>
  )
}
