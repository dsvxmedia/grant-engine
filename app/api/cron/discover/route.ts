import { NextResponse } from 'next/server'
import { scrapeGrantsGov } from '@/lib/scrapers/grants-gov'
import { scrapeSamGov } from '@/lib/scrapers/sam-gov'
import { scrapeSbir } from '@/lib/scrapers/sbir'
import { scrapeFoundations } from '@/lib/scrapers/foundations'
import { scrapeCorporate } from '@/lib/scrapers/corporate'
import { scrapeNiche } from '@/lib/scrapers/niche'
import { scrapeStates } from '@/lib/scrapers/states'
import { normalizeGrant } from '@/lib/scrapers/normalize'
import { filterNewGrants } from '@/lib/scrapers/deduplicate'
import { persistGrants } from '@/lib/scrapers/persist'
import { createServiceClient } from '@/lib/supabase/server'
import type { RawGrant } from '@/lib/scrapers/types'

type ScraperJob = { source: string; run: () => Promise<RawGrant[]> }

const SCRAPERS: ScraperJob[] = [
  { source: 'grants-gov', run: scrapeGrantsGov },
  { source: 'sam-gov', run: scrapeSamGov },
  { source: 'sbir', run: scrapeSbir },
  { source: 'foundations', run: scrapeFoundations },
  { source: 'corporate', run: scrapeCorporate },
  { source: 'niche', run: scrapeNiche },
  { source: 'states', run: scrapeStates },
]

async function logScraperRun(input: {
  source: string
  startedAt: string
  grantsFound: number
  grantsNew: number
  success: boolean
  errorMessage: string | null
}) {
  try {
    const supabase = await createServiceClient()
    await (supabase as any).from('scraper_runs').insert({
      source: input.source,
      started_at: input.startedAt,
      completed_at: new Date().toISOString(),
      grants_found: input.grantsFound,
      grants_new: input.grantsNew,
      success: input.success,
      error_message: input.errorMessage,
    })
  } catch (err) {
    console.error(`[cron/discover] failed to log scraper_run for ${input.source}`, err)
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startedAt = new Date().toISOString()

  const settled = await Promise.allSettled(
    SCRAPERS.map(async (job) => ({
      source: job.source,
      grants: await job.run(),
    }))
  )

  const perSource: Array<{ source: string; raw: RawGrant[] }> = []
  let succeeded = 0
  let failed = 0

  for (let i = 0; i < settled.length; i++) {
    const job = SCRAPERS[i]
    const result = settled[i]
    if (result.status === 'fulfilled') {
      succeeded++
      perSource.push({ source: job.source, raw: result.value.grants })
    } else {
      failed++
      console.error(`[cron/discover] scraper ${job.source} failed`, result.reason)
      perSource.push({ source: job.source, raw: [] })
    }
  }

  const rawAll = perSource.flatMap((s) => s.raw)
  const normalized = rawAll.map(normalizeGrant)
  const newGrants = await filterNewGrants(normalized)
  const persistResult = await persistGrants(newGrants)

  await Promise.all(
    perSource.map((s, i) => {
      const result = settled[i]
      const errorMessage =
        result.status === 'rejected'
          ? result.reason instanceof Error
            ? result.reason.message
            : String(result.reason)
          : null
      return logScraperRun({
        source: s.source,
        startedAt,
        grantsFound: s.raw.length,
        grantsNew: 0,
        success: result.status === 'fulfilled',
        errorMessage,
      })
    })
  )

  return NextResponse.json({
    ok: true,
    scrapers: {
      total: SCRAPERS.length,
      succeeded,
      failed,
    },
    grants: {
      raw: rawAll.length,
      normalized: normalized.length,
      new: newGrants.length,
      inserted: persistResult.inserted,
    },
    timestamp: new Date().toISOString(),
  })
}
