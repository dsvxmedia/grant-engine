/**
 * One-shot seed endpoint — inserts known monthly/recurring grants directly.
 * Run manually: GET /api/cron/seed  (Authorization: Bearer $CRON_SECRET)
 */
import { NextResponse } from 'next/server'
import { scrapeMonthlyPrograms } from '@/lib/scrapers/niche/monthly-programs'
import { normalizeGrant } from '@/lib/scrapers/normalize'
import { filterNewGrants } from '@/lib/scrapers/deduplicate'
import { persistGrants } from '@/lib/scrapers/persist'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const raw = await scrapeMonthlyPrograms()
    const normalized = raw.flatMap((g) => { const n = normalizeGrant(g); return n ? [n] : [] })
    const newGrants = await filterNewGrants(normalized)
    const result = await persistGrants(newGrants)

    console.log(`[seed] inserted ${result.inserted} grants from ${raw.length} raw`)
    return NextResponse.json({
      ok: true,
      raw: raw.length,
      normalized: normalized.length,
      new: newGrants.length,
      inserted: result.inserted,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[seed] failed:', err)
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
