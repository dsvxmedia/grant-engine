import { NextResponse } from 'next/server'
import { analyzeWinLoss } from '@/lib/intelligence/win-loss'
import { createServiceClient } from '@/lib/supabase/server'

// GET /api/cron/analyze — weekly Win/Loss analysis job
// Protected by CRON_SECRET
// Schedule: 0 9 * * 1 (Monday 9am UTC)
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const report = await analyzeWinLoss()

  try {
    const supabase = await createServiceClient()
    await (supabase as any).from('notifications').insert({
      type: 'win_loss_report',
      title: 'Weekly Win/Loss Analysis',
      body: JSON.stringify(report.topPerformers),
    })
  } catch (err) {
    console.error('[cron/analyze] failed to save notification:', err)
  }

  return NextResponse.json({ ok: true, report })
}
