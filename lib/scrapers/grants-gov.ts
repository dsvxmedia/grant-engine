import type { RawGrant } from './types'

const GRANTS_GOV_SEARCH_URL =
  'https://apply07.grants.gov/grantsws/rest/opportunities/search/'
const GRANTS_GOV_DETAIL_URL =
  'https://apply07.grants.gov/grantsws/rest/opportunity/details'
const ROWS_PER_PAGE = 25
const MAX_PAGES = 10
const DETAIL_CONCURRENCY = 5

type OppHit = {
  id: string | number
  title: string
  description?: string
  synopsis?: string
  agencyName?: string
  applicationUrl?: string
  awardFloor?: string | number
  awardCeiling?: string | number
  closeDate?: string
  responseDateStr?: string
  applicantTypes?: string[]
  opportunityCategory?: string
}

type GrantsGovResponse = {
  oppHits: OppHit[]
  hitCount: number
  startRecord: number
}

export type OppDetail = {
  synopsis?: {
    synopsisDesc?: string
    applicantEligibilityDesc?: string
    awardFloor?: string | number
    awardCeiling?: string | number
    applicantTypes?: Array<{ id: string; description: string }>
  }
}

export async function fetchGrantDetail(
  id: string | number
): Promise<OppDetail | null> {
  try {
    const res = await fetch(GRANTS_GOV_DETAIL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `oppId=${id}`,
    })
    if (!res.ok) return null
    const body = await res.json()
    if (body?.synopsis) return body as OppDetail
    return null
  } catch {
    return null
  }
}

async function enrichBatch(hits: OppHit[]): Promise<Map<string, OppDetail>> {
  const details = new Map<string, OppDetail>()
  const needsEnrichment = hits.filter(h => !h.description && !h.synopsis)
  if (needsEnrichment.length === 0) return details

  for (let i = 0; i < needsEnrichment.length; i += DETAIL_CONCURRENCY) {
    const batch = needsEnrichment.slice(i, i + DETAIL_CONCURRENCY)
    const results = await Promise.all(
      batch.map(async h => ({
        id: String(h.id),
        detail: await fetchGrantDetail(h.id),
      }))
    )
    for (const { id, detail } of results) {
      if (detail) details.set(id, detail)
    }
  }

  return details
}

function parseAward(val: string | number | undefined): number | undefined {
  if (val === undefined || val === null || val === 'none' || val === '') return undefined
  const n = Number(val)
  return isNaN(n) ? undefined : n
}

function mapOppHit(opp: OppHit, detail?: OppDetail | null): RawGrant {
  const syn = detail?.synopsis
  return {
    source: 'grants-gov',
    sourceUrl: `https://www.grants.gov/search-results-detail/${opp.id}`,
    applicationUrl: opp.applicationUrl ?? undefined,
    title: opp.title,
    description:
      opp.description ??
      opp.synopsis ??
      syn?.synopsisDesc ??
      detail?.synopsisDesc ??
      undefined,
    funderName: (opp as any).agency ?? opp.agencyName,
    funderType: 'federal',
    awardMin: parseAward(opp.awardFloor ?? syn?.awardFloor),
    awardMax: parseAward(opp.awardCeiling ?? syn?.awardCeiling),
    deadline: opp.closeDate ?? opp.responseDateStr,
    eligibilityText:
      opp.applicantTypes?.join(', ') ??
      syn?.applicantEligibilityDesc ??
      undefined,
    categoryTags: opp.opportunityCategory ? [opp.opportunityCategory] : [],
  }
}

export async function scrapeGrantsGov(): Promise<RawGrant[]> {
  const grants: RawGrant[] = []
  try {
    let startRecordNum = 0
    let page = 0

    while (page < MAX_PAGES) {
      const res = await fetch(GRANTS_GOV_SEARCH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oppStatuses: 'posted',
          rows: ROWS_PER_PAGE,
          startRecordNum,
        }),
      })

      if (!res.ok) {
        console.error(`[grants-gov] HTTP ${res.status} on page ${page + 1}`)
        break
      }

      const body = (await res.json()) as unknown as GrantsGovResponse
      const hits = body.oppHits ?? []

      const details = await enrichBatch(hits)
      for (const hit of hits) {
        grants.push(mapOppHit(hit, details.get(String(hit.id))))
      }

      const totalRecords = body.hitCount ?? 0
      page += 1
      startRecordNum += hits.length

      if (hits.length === 0 || startRecordNum >= totalRecords) break
    }

    console.log(`[grants-gov] fetched ${grants.length} grants`)
    return grants
  } catch (err) {
    console.error('[grants-gov] scrape failed:', err)
    return []
  }
}
