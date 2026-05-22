import { NextRequest, NextResponse } from 'next/server'
import { runVideoPipeline } from '@/lib/video/pipeline'

// POST /api/webhooks/video — Vercel Queue handler for video generation
// Protected by CRON_SECRET
// Body: { grant_match_id: string }
// Returns: { ok: true, result: VideoResult }
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { grant_match_id } = (body ?? {}) as Record<string, unknown>

  if (!grant_match_id || typeof grant_match_id !== 'string') {
    return NextResponse.json(
      { error: 'Missing required field: grant_match_id' },
      { status: 400 }
    )
  }

  try {
    const result = await runVideoPipeline(grant_match_id)
    return NextResponse.json({ ok: true, result })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[webhooks/video] runVideoPipeline failed:', message)
    return NextResponse.json(
      { error: 'Video pipeline failed', details: message },
      { status: 500 }
    )
  }
}
