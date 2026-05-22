import { NextResponse } from 'next/server'
import { runQAGate } from '@/lib/qa/gate'

// POST /api/webhooks/qa — triggered by writing pipeline to run QA gate
// Body: { applicationId: string }
// Protected by CRON_SECRET header (same pattern as discover cron)
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const { applicationId } = body as Record<string, unknown>
  if (!applicationId || typeof applicationId !== 'string' || applicationId.trim() === '') {
    return NextResponse.json(
      { error: 'applicationId is required and must be a non-empty string' },
      { status: 400 }
    )
  }

  try {
    const result = await runQAGate(applicationId)
    return NextResponse.json({ ok: true, result })
  } catch (err) {
    console.error('[webhooks/qa] runQAGate failed:', err)
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { error: 'QA gate failed', details: message },
      { status: 500 }
    )
  }
}
