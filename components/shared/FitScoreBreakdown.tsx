import type { ScoreComponents } from '@/components/pipeline/types'

const BARS = [
  { key: 'missionAlignment' as const, label: 'Mission',  color: 'bg-blue-500',    weight: 0.30 },
  { key: 'angleMatch'       as const, label: 'Angle',    color: 'bg-emerald-500', weight: 0.25 },
  { key: 'awardSizeFit'     as const, label: 'Award',    color: 'bg-violet-500',  weight: 0.15 },
  { key: 'deadlineUrgency'  as const, label: 'Deadline', color: 'bg-orange-500',  weight: 0.10 },
  { key: 'funderPrestige'   as const, label: 'Prestige', color: 'bg-slate-400',   weight: 0.10 },
]

interface FitScoreBreakdownProps {
  components: ScoreComponents
}

export function FitScoreBreakdown({ components }: FitScoreBreakdownProps) {
  return (
    <div className="flex flex-col gap-1">
      {BARS.map(({ key, label, color, weight }) => {
        const score = Math.min(Math.max(components[key], 0), 1)
        const pct = Math.round(score * 100)
        const pts = Math.round(score * weight / 0.9 * 100)
        return (
          <div key={key} className="flex items-center gap-1.5">
            <span className="w-12 shrink-0 text-[10px] text-muted-foreground">{label}</span>
            <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="w-5 shrink-0 text-right text-[10px] text-muted-foreground tabular-nums">
              {pts}
            </span>
          </div>
        )
      })}
    </div>
  )
}
