import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'

export type GrantCycleRecord = {
  grantId: string
  year: number
  openDate: string | null
  closeDate: string | null
  predictedNextOpen: string | null
}

function addOneYear(dateStr: string): string {
  const d = new Date(dateStr)
  d.setFullYear(d.getFullYear() + 1)
  // Format as YYYY-MM-DD preserving the month/day
  return d.toISOString().split('T')[0]
}

export async function recordGrantCycle(
  grantId: string,
  openDate: string,
  closeDate: string
): Promise<void> {
  try {
    const supabase = await createServiceClient()
    const year = new Date().getFullYear()
    const predictedNextOpen = addOneYear(openDate)

    const { error } = await (supabase as any).from('grant_cycles').upsert({
      grant_id: grantId,
      year,
      open_date: openDate,
      close_date: closeDate,
      predicted_next_open: predictedNextOpen,
    })

    if (error) {
      console.error('[calendar] recordGrantCycle error:', error)
    }
  } catch (err) {
    console.error('[calendar] recordGrantCycle unexpected error:', err)
  }
}

export async function predictNextOpen(grantId: string): Promise<string | null> {
  try {
    const supabase = await createServiceClient()

    const { data, error } = await (supabase as any)
      .from('grant_cycles')
      .select('predicted_next_open')
      .eq('grant_id', grantId)
      .order('year', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !data) {
      if (error) console.error('[calendar] predictNextOpen error:', error)
      return null
    }

    return data.predicted_next_open ?? null
  } catch (err) {
    console.error('[calendar] predictNextOpen unexpected error:', err)
    return null
  }
}

export async function getUpcomingGrants(daysAhead: number): Promise<GrantCycleRecord[]> {
  try {
    const supabase = await createServiceClient()
    const now = new Date().toISOString()
    const future = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await (supabase as any)
      .from('grant_cycles')
      .select('grant_id, year, open_date, close_date, predicted_next_open')
      .gte('predicted_next_open', now)
      .lte('predicted_next_open', future)

    if (error || !data) {
      if (error) console.error('[calendar] getUpcomingGrants error:', error)
      return []
    }

    return data.map((row: any) => ({
      grantId: row.grant_id,
      year: row.year,
      openDate: row.open_date ?? null,
      closeDate: row.close_date ?? null,
      predictedNextOpen: row.predicted_next_open ?? null,
    }))
  } catch (err) {
    console.error('[calendar] getUpcomingGrants unexpected error:', err)
    return []
  }
}

export async function getPreWriteCandidates(): Promise<GrantCycleRecord[]> {
  return getUpcomingGrants(30)
}
