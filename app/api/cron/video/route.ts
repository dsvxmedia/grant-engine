import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET /api/cron/video — daily cron to queue grants requiring video pitches
// Protected by CRON_SECRET
// Queries grants where requires_video = true AND status = 'active'
// Skips grants that already have a video_submission
// Creates a notification for each newly queued grant
// Returns: { ok: true, queued: number }
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServiceClient()

  const { data: grants, error: grantsError } = await (supabase as any)
    .from('grants')
    .select('id, title')
    .eq('requires_video', true)
    .eq('status', 'active')

  if (grantsError) {
    console.error('[cron/video] Failed to fetch video grants:', grantsError)
    return NextResponse.json(
      { error: 'Failed to fetch grants' },
      { status: 500 }
    )
  }

  let queued = 0

  for (const grant of grants ?? []) {
    // Check if a video_submission already exists for this grant
    const { data: existing } = await (supabase as any)
      .from('video_submissions')
      .select('id')
      .eq('grant_id', grant.id)
      .maybeSingle()

    if (existing) {
      // Already has a submission — skip
      continue
    }

    // Create a notification so the team knows this grant entered the queue
    await (supabase as any).from('notifications').insert({
      type: 'video_queued',
      title: 'Grant added to Video Queue',
      body: grant.title,
    })

    queued++
  }

  return NextResponse.json({ ok: true, queued })
}
