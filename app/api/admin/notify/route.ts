import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createNotifications } from '@/lib/notifications'

// POST /api/admin/notify
// Generates notifications from current DB state: expiring deadlines + high-score matches
// Protected by CRON_SECRET
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServiceClient()
  const now = new Date()
  const sevenDays = new Date(now.getTime() + 7 * 86_400_000)
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Cleanup: delete notifications older than 7 days to prevent stale clutter
  await (supabase as any)
    .from('notifications')
    .delete()
    .lt('created_at', sevenDaysAgo.toISOString())

  // Deduplication: fetch titles of notifications created in the last 24 hours
  const { data: recentNotifs } = await (supabase as any)
    .from('notifications')
    .select('title')
    .gte('created_at', twentyFourHoursAgo.toISOString())

  const recentTitles = new Set<string>((recentNotifs ?? []).map((n: { title: string }) => n.title))

  const notifs: Parameters<typeof createNotifications>[0] = []

  // 1. Deadline warnings for active grants in the next 7 days
  const { data: expiringSoon } = await (supabase as any)
    .from('grants')
    .select('title, deadline')
    .eq('status', 'active')
    .gte('deadline', now.toISOString())
    .lte('deadline', sevenDays.toISOString())
    .order('deadline', { ascending: true })
    .limit(20)

  for (const g of (expiringSoon ?? []) as Array<{ title: string; deadline: string }>) {
    const daysLeft = Math.max(0, Math.ceil((new Date(g.deadline).getTime() - now.getTime()) / 86_400_000))
    const title = `Deadline in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}: ${g.title}`
    if (!recentTitles.has(title)) {
      notifs.push({
        type: 'deadline_warning',
        title,
        body: `Due ${new Date(g.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
        metadata: { deadline: g.deadline },
      })
    }
  }

  // 2. Summary of high-score matches pending action
  const { count: queuedCount } = await (supabase as any)
    .from('grant_matches')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'queued')

  if (queuedCount && queuedCount > 0) {
    const title = `${queuedCount} grant${queuedCount !== 1 ? 's' : ''} ready to draft`
    if (!recentTitles.has(title)) {
      notifs.push({
        type: 'new_match',
        title,
        body: 'High-score matches are waiting in the Review Queue.',
      })
    }
  }

  // 3. Check for pending_review applications awaiting approval
  const { count: reviewCount } = await (supabase as any)
    .from('grant_applications')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending_review')

  if (reviewCount && reviewCount > 0) {
    const title = `${reviewCount} application${reviewCount !== 1 ? 's' : ''} awaiting your review`
    if (!recentTitles.has(title)) {
      notifs.push({
        type: 'new_match',
        title,
        body: 'Drafted applications are ready for your approval in the Review Queue.',
      })
    }
  }

  if (notifs.length === 0) {
    return NextResponse.json({ ok: true, created: 0, message: 'All notifications already sent in the last 24 hours.' })
  }

  await createNotifications(notifs)

  return NextResponse.json({ ok: true, created: notifs.length })
}
