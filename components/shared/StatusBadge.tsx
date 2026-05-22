import { cn } from '@/lib/utils'

const styles: Record<string, string> = {
  queued:          'bg-slate-100 text-slate-600',
  drafting:        'bg-blue-50 text-blue-600',
  qa_review:       'bg-purple-50 text-purple-600',
  pending_review:  'bg-yellow-50 text-yellow-600',
  approved:        'bg-green-50 text-green-600',
  submitted:       'bg-indigo-50 text-indigo-600',
  awarded:         'bg-emerald-50 text-emerald-700',
  rejected:        'bg-red-50 text-red-600',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize',
      styles[status] ?? 'bg-slate-100 text-slate-500'
    )}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}
