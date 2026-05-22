import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET /api/analytics
// Returns aggregate dashboard stats
// On any per-metric error, returns 0 for that metric — never 500s the whole route.
export async function GET() {
  const supabase = await createServiceClient()

  // Helper: run a count query safely, returning 0 on error
  async function safeCount(
    table: string,
    filter: (q: any) => any
  ): Promise<number> {
    try {
      const base = (supabase as any).from(table).select('*', { count: 'exact', head: true })
      const { count, error } = await filter(base)
      if (error || count === null) return 0
      return count
    } catch {
      return 0
    }
  }

  // Helper: sum a column for matching rows, returning 0 on error
  async function safeSum(
    table: string,
    column: string,
    filter: (q: any) => any
  ): Promise<number> {
    try {
      const base = (supabase as any).from(table).select(column)
      const { data, error } = await filter(base)
      if (error || !data) return 0
      return (data as Record<string, number>[]).reduce((acc, row) => acc + (row[column] ?? 0), 0)
    } catch {
      return 0
    }
  }

  const [discovered, applied, won, rejected, pipelineValue] = await Promise.all([
    safeCount('grants', (q) => q.eq('status', 'active')),
    safeCount('grant_applications', (q) => q.eq('status', 'submitted')),
    safeCount('grant_applications', (q) => q.eq('outcome', 'awarded')),
    safeCount('grant_applications', (q) => q.eq('outcome', 'rejected')),
    safeSum('grants', 'award_max', (q) => q.eq('status', 'pending_review')),
  ])

  const winRate = applied > 0 ? (won / applied) * 100 : 0

  return NextResponse.json({
    discovered,
    applied,
    won,
    rejected,
    pipelineValue,
    winRate,
  })
}
