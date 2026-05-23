import type { RawGrant } from './types'

const GRANTS_GOV_URL =
  'https://apply07.grants.gov/grantsws/rest/opportunities/search/'
const ROWS_PER_PAGE = 25
const MAX_PAGES = 10

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

function mapOppHit(opp: OppHit): RawGrant {
  return {
    source: 'grants-gov',
    sourceUrl: `https://www.grants.gov/search-results-detail/${opp.id}`,
    applicationUrl: opp.applicationUrl ?? undefined,
    title: opp.title,
    description: opp.description ?? opp.synopsis,
    funderName: (opp as any).agency ?? opp.agencyName,
    funderType: 'federal',
    awardMin: opp.awardFloor ? Number(opp.awardFloor) : undefined,
    awardMax: opp.awardCeiling ? Number(opp.awardCeiling) : undefined,
    deadline: opp.closeDate ?? opp.responseDateStr,
    eligibilityText: opp.applicantTypes?.join(', '),
    categoryTags: opp.opportunityCategory ? [opp.opportunityCategory] : [],
  }
}

export async function scrapeGrantsGov(): Promise<RawGrant[]> {
  const grants: RawGrant[] = []
  try {
    let startRecordNum = 0
    let page = 0

    while (page < MAX_PAGES) {
      const res = await fetch(GRANTS_GOV_URL, {
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
      for (const hit of hits) {
        grants.push(mapOppHit(hit))
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
