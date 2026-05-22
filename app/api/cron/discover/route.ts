import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Discovery engine wired in Plan 3
  return NextResponse.json({
    ok: true,
    message: 'Grant discovery cron — implementation in Plan 3',
    timestamp: new Date().toISOString(),
  })
}
