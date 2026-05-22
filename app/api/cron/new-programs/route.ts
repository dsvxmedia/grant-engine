import { NextResponse } from 'next/server'
import { monitorNewPrograms } from '@/lib/intelligence/new-programs'

// GET /api/cron/new-programs — daily new program monitor
// Protected by CRON_SECRET
// Schedule: 30 6 * * * (daily 6:30am UTC, after discover cron)
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await monitorNewPrograms()

  return NextResponse.json({ ok: true, result })
}
