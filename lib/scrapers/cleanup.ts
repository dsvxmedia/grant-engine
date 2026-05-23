import { createServiceClient } from '@/lib/supabase/server'
import { hasPastFiscalYear } from './normalize'

const ROLLING_SOURCES = new Set(['monthly-programs', 'monthly_programs'])
const ROLLING_CATEGORY_TAGS = new Set([
  'rolling', 'monthly', 'ongoing', 'year-round', 'always-open', 'open-enrollment', 'continuous',
])
const ROLLING_TEXT_RE =
  /rolling\s+(?:application|deadline|basis)|year[\s-]round|always\s+open|no\s+deadline|ongoing\s+(?:grant|program|funding)|monthly\s+(?:grant|award|program)|accept(?:s|ing)\s+applications?\s+(?:at\s+any\s+time|anytime|year[\s-]round)/i

function isRollingRow(row: { source: string; category_tags: string[] | null; title: string; description: string | null }): boolean {
  if (ROLLING_SOURCES.has(row.source)) return true
  if ((row.category_tags ?? []).some((t) => ROLLING_CATEGORY_TAGS.has(t.toLowerCase()))) return true
  return ROLLING_TEXT_RE.test(`${row.title} ${row.description ?? ''}`)
}

export async function cleanupExpiredGrants(): Promise<{ deleted: number; expired: number }> {
  const supabase = await createServiceClient()
  const now = new Date().toISOString()

  // Collect IDs: past deadline
  const { data: pastDeadline } = await (supabase as any)
    .from('grants')
    .select('id')
    .lt('deadline', now)
    .eq('status', 'active')

  // Collect IDs: stale grants-gov shells (null deadline, no description, older than 90 days)
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 90)
  const { data: staleGov } = await (supabase as any)
    .from('grants')
    .select('id')
    .eq('source', 'grants-gov')
    .is('deadline', null)
    .is('description', null)
    .lt('created_at', cutoff.toISOString())
    .eq('status', 'active')

  // Collect IDs: null-deadline grants that aren't rolling (no way to know when to apply)
  // Also catches past fiscal year references in the same pass
  const { data: noDeadlineGrants } = await (supabase as any)
    .from('grants')
    .select('id, title, source, category_tags, description')
    .is('deadline', null)
    .eq('status', 'active')

  type NoDeadlineRow = { id: string; title: string; source: string; category_tags: string[] | null; description: string | null }

  const nonRollingIds: string[] = ((noDeadlineGrants ?? []) as NoDeadlineRow[])
    .filter((g) => !isRollingRow(g))
    .map((g) => g.id)

  const pastFyIds: string[] = ((noDeadlineGrants ?? []) as NoDeadlineRow[])
    .filter((g) => isRollingRow(g) && hasPastFiscalYear(g.title))
    .map((g) => g.id)

  const expiredIds: string[] = [
    ...((pastDeadline ?? []) as { id: string }[]).map((r) => r.id),
    ...((staleGov ?? []) as { id: string }[]).map((r) => r.id),
    ...nonRollingIds,
    ...pastFyIds,
  ]

  // Sweep grants already marked expired by a previous run
  const { data: alreadyExpired } = await (supabase as any)
    .from('grants')
    .select('id')
    .eq('status', 'expired')

  // Sweep grants with no URL at all — no way to apply, no value
  const { data: noUrl } = await (supabase as any)
    .from('grants')
    .select('id')
    .is('source_url', null)
    .is('application_url', null)
    .eq('status', 'active')

  const alreadyExpiredIds: string[] = ((alreadyExpired ?? []) as { id: string }[]).map((r) => r.id)
  const noUrlIds: string[] = ((noUrl ?? []) as { id: string }[]).map((r) => r.id)

  const allStaleIds = [...new Set([...expiredIds, ...alreadyExpiredIds, ...noUrlIds])]

  if (allStaleIds.length === 0) return { deleted: 0, expired: 0 }

  // Delete pipeline matches — they have no value once the grant is gone
  await (supabase as any)
    .from('grant_matches')
    .delete()
    .in('grant_id', allStaleIds)

  // Preserve grants that have real application history (mark expired instead of deleting)
  const { data: withApps } = await (supabase as any)
    .from('grant_applications')
    .select('grant_id')
    .in('grant_id', allStaleIds)

  const { data: withLoi } = await (supabase as any)
    .from('loi_submissions')
    .select('grant_id')
    .in('grant_id', allStaleIds)

  const preserve = new Set<string>([
    ...((withApps ?? []) as { grant_id: string }[]).map((r) => r.grant_id),
    ...((withLoi ?? []) as { grant_id: string }[]).map((r) => r.grant_id),
  ])

  const toDelete = allStaleIds.filter((id) => !preserve.has(id))
  const toExpire = allStaleIds.filter((id) => preserve.has(id))

  // Hard delete grants with no history — erase completely
  if (toDelete.length > 0) {
    await (supabase as any).from('grants').delete().in('id', toDelete)
  }

  // Soft-expire grants that have application history so records stay intact
  if (toExpire.length > 0) {
    await (supabase as any)
      .from('grants')
      .update({ status: 'expired' })
      .in('id', toExpire)
  }

  if (toDelete.length + toExpire.length > 0) {
    console.log(
      `[cleanup] deleted ${toDelete.length} expired grants, marked ${toExpire.length} expired (have application history)`
    )
  }

  return { deleted: toDelete.length, expired: toExpire.length }
}
