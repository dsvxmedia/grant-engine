import { NextResponse } from 'next/server'
import { runMatching } from '@/lib/matching'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runMatching()
    console.log(`[cron/match] queued: ${result.pairs_queued}, pending: ${result.pairs_archived}, rejected: ${result.pairs_rejected}`)
    return NextResponse.json({ ok: true, ...result, timestamp: new Date().toISOString() })
  } catch (err) {
    console.error('[cron/match] failed:', err)
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
