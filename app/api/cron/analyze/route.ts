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
    let body: string
    if (report.topPerformers.length === 0) {
      body = 'No completed applications yet — outcomes will be analyzed as data accumulates.'
    } else {
      const lines = report.topPerformers.map(
        (s) => `${s.dimension.split('|')[0].replace('funder_type:', '')}: ${Math.round(s.winRate * 100)}% win rate (${s.wins}/${s.attempts})`
      )
      body = `Top segments:\n${lines.join('\n')}`
    }
    await (supabase as any).from('notifications').insert({
      type: 'win_loss_report',
      title: 'Weekly Win/Loss Analysis',
      body,
    })
  } catch (err) {
    console.error('[cron/analyze] failed to save notification:', err)
  }

  return NextResponse.json({ ok: true, report })
}
