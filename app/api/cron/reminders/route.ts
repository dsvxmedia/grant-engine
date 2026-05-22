import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY)

type ApplicationRow = {
  id: string
  grant_title?: string | null
  funder_name?: string | null
  deadline?: string | null
  status: string
}

function daysUntil(deadline: string): number {
  const now = new Date()
  const due = new Date(deadline)
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function bucketLabel(days: number): string {
  if (days <= 2) return '48 hours'
  if (days <= 7) return '7 days'
  return '14 days'
}

// GET /api/cron/reminders
// Protected by CRON_SECRET
// Checks grant_applications for deadlines in 14, 7 days, or 48 hours windows
// Sends one Resend email per bucket with the list of applications
// Logs each send to scraper_runs (source = 'reminders')
// Returns: { ok: true, remindersSet: number }
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServiceClient()
  const startedAt = new Date().toISOString()

  // Fetch applications with deadlines in the next 15 days
  const { data: applications, error } = await (supabase as any)
    .from('grant_applications')
    .select('id, grant_title, funder_name, deadline, status')
    .in('status', ['approved', 'pending_review'])
    .gte('deadline', new Date().toISOString())
    .lte('deadline', new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString())

  if (error) {
    console.error('[cron/reminders] Failed to fetch applications:', error)
    await logRun(supabase, startedAt, 0, false, error.message)
    return NextResponse.json({ ok: true, remindersSet: 0 })
  }

  const rows: ApplicationRow[] = applications ?? []

  // Group into buckets: 48h, 7d, 14d
  const buckets: Record<string, ApplicationRow[]> = {
    '48 hours': [],
    '7 days': [],
    '14 days': [],
  }

  for (const app of rows) {
    if (!app.deadline) continue
    const days = daysUntil(app.deadline)
    if (days <= 15) {
      buckets[bucketLabel(days)].push(app)
    }
  }

  const alertEmail = process.env.RESEND_ALERT_EMAIL
  let remindersSet = 0

  for (const [label, apps] of Object.entries(buckets)) {
    if (apps.length === 0) continue

    const list = apps
      .map((a) => `• ${a.grant_title ?? 'Unknown Grant'} (${a.funder_name ?? 'Unknown Funder'}) — due ${a.deadline}`)
      .join('\n')

    try {
      await resend.emails.send({
        from: 'Grant Engine <noreply@grantengine.app>',
        to: alertEmail ?? '',
        subject: `[Grant Engine] ${apps.length} application(s) due within ${label}`,
        text: `The following grant applications are due within ${label}:\n\n${list}\n\nLog in to review and submit.`,
      })
      remindersSet++
    } catch (err) {
      console.error(`[cron/reminders] Failed to send ${label} bucket email:`, err)
    }
  }

  await logRun(supabase, startedAt, remindersSet, true, null)

  return NextResponse.json({ ok: true, remindersSet })
}

async function logRun(
  supabase: any,
  startedAt: string,
  grantsFound: number,
  success: boolean,
  errorMessage: string | null
) {
  try {
    await (supabase as any).from('scraper_runs').insert({
      source: 'reminders',
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      grants_found: grantsFound,
      grants_new: 0,
      success,
      error_message: errorMessage,
    })
  } catch (err) {
    console.error('[cron/reminders] Failed to log scraper_run:', err)
  }
}
