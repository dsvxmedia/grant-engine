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
import { sendScraperAlert } from '@/lib/scrapers/health'
import { createServiceClient } from '@/lib/supabase/server'
import type { NormalizedGrant, RawGrant } from '@/lib/scrapers/types'

type SourceResult = {
  source: string
  raw: RawGrant[]
  normalized: NormalizedGrant[]
  success: boolean
  errorMessage: string | null
}

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

  const perSource: SourceResult[] = []
  let succeeded = 0
  let failed = 0

  for (let i = 0; i < settled.length; i++) {
    const job = SCRAPERS[i]
    const result = settled[i]
    if (result.status === 'fulfilled') {
      succeeded++
      const raw = result.value.grants
      perSource.push({
        source: job.source,
        raw,
        normalized: raw.map(normalizeGrant),
        success: true,
        errorMessage: null,
      })
    } else {
      failed++
      console.error(`[cron/discover] scraper ${job.source} failed`, result.reason)
      const errorMessage =
        result.reason instanceof Error
          ? result.reason.message
          : String(result.reason)
      perSource.push({
        source: job.source,
        raw: [],
        normalized: [],
        success: false,
        errorMessage,
      })
    }
  }

  const rawAll = perSource.flatMap((s) => s.raw)
  const normalized = perSource.flatMap((s) => s.normalized)
  const newGrants = await filterNewGrants(normalized)
  const persistResult = await persistGrants(newGrants)
  const newHashes = new Set(newGrants.map((g) => g.content_hash))

  await Promise.all(
    perSource.map((s) =>
      logScraperRun({
        source: s.source,
        startedAt,
        grantsFound: s.raw.length,
        grantsNew: s.normalized.filter((g) => newHashes.has(g.content_hash)).length,
        success: s.success,
        errorMessage: s.errorMessage,
      })
    )
  )

  if (failed > 0) {
    const failures = perSource
      .filter((s) => !s.success)
      .map((s) => ({ source: s.source, error: s.errorMessage ?? 'unknown error' }))
    await sendScraperAlert(failures)
  }

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
      errors: persistResult.errors,
    },
    timestamp: new Date().toISOString(),
  })
}
