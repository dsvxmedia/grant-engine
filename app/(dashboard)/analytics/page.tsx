import { Header } from '@/components/layout/Header'
import { createServiceClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

type StatCardProps = {
  label: string
  value: string
  colorClass?: string
}

function StatCard({ label, value, colorClass }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card px-5 py-4">
      <p className={cn('text-2xl font-bold tabular-nums', colorClass)}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

type StatusCount = {
  status: string
  count: number
}

async function fetchAnalytics() {
  const supabase = await createServiceClient()

  async function safeCount(table: string, filter: (q: any) => any): Promise<number> {
    try {
      const base = (supabase as any).from(table).select('*', { count: 'exact', head: true })
      const { count, error } = await filter(base)
      if (error || count === null) return 0
      return count
    } catch {
      return 0
    }
  }

  async function safeSum(
    table: string,
    column: string,
    filter: (q: any) => any
  ): Promise<number> {
    try {
      const base = (supabase as any).from(table).select(column)
      const { data, error } = await filter(base)
      if (error || !data) return 0
      return (data as Record<string, number>[]).reduce(
        (acc, row) => acc + (row[column] ?? 0),
        0
      )
    } catch {
      return 0
    }
  }

  async function safeStatusCounts(table: string): Promise<StatusCount[]> {
    try {
      const { data, error } = await (supabase as any)
        .from(table)
        .select('status')
      if (error || !data) return []
      const counts: Record<string, number> = {}
      for (const row of data as { status: string }[]) {
        counts[row.status] = (counts[row.status] ?? 0) + 1
      }
      return Object.entries(counts)
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count)
    } catch {
      return []
    }
  }

  const [discovered, applied, won, rejected, pipelineValue, statusCounts] =
    await Promise.all([
      safeCount('grants', (q) => q.eq('status', 'active')),
      safeCount('grant_applications', (q) => q.eq('status', 'submitted')),
      safeCount('grant_applications', (q) => q.eq('outcome', 'awarded')),
      safeCount('grant_applications', (q) => q.eq('outcome', 'rejected')),
      safeSum('grants', 'award_max', (q) => q.eq('status', 'pending_review')),
      safeStatusCounts('grant_applications'),
    ])

  const winRate = applied > 0 ? (won / applied) * 100 : 0

  return { discovered, applied, won, rejected, pipelineValue, winRate, statusCounts }
}

export default async function AnalyticsPage() {
  let data
  try {
    data = await fetchAnalytics()
  } catch {
    return (
      <div className="flex flex-col h-full">
        <Header title="Analytics" />
        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-sm text-muted-foreground">Failed to load analytics data.</p>
        </div>
      </div>
    )
  }

  const { discovered, applied, won, rejected, pipelineValue, winRate, statusCounts } = data

  const statCards: StatCardProps[] = [
    { label: 'Grants discovered', value: discovered.toLocaleString() },
    { label: 'Applications submitted', value: applied.toLocaleString() },
    { label: 'Awarded', value: won.toLocaleString(), colorClass: 'text-green-600' },
    { label: 'Rejected', value: rejected.toLocaleString(), colorClass: 'text-red-500' },
    { label: 'Pipeline value', value: formatCurrency(pipelineValue) },
    { label: 'Win rate', value: `${winRate.toFixed(1)}%` },
  ]

  return (
    <div className="flex flex-col h-full">
      <Header title="Analytics" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl flex flex-col gap-8">
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {statCards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </div>

          {/* Status breakdown */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">Applications by status</h3>
            {statusCounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No applications yet.</p>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                        Count
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {statusCounts.map(({ status, count }) => (
                      <tr key={status} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 capitalize text-foreground">
                          {status.replace(/_/g, ' ')}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium">
                          {count.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
