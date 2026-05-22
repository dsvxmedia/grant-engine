import type { RawGrant } from './types'

const SAM_GOV_URL = 'https://api.sam.gov/opportunities/v2/search'

type SamOpportunity = {
  noticeId: string
  title: string
  description?: string
  departmentName?: string
  organizationName?: string
  responseDeadLine?: string
  award?: { amount?: string | number }
  placeOfPerformance?: Record<string, unknown>
}

type SamGovResponse = {
  opportunitiesData: SamOpportunity[]
  totalRecords: number
}

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
}

function mapOpportunity(opp: SamOpportunity): RawGrant {
  return {
    source: 'sam-gov',
    sourceUrl: `https://sam.gov/opp/${opp.noticeId}/view`,
    title: opp.title,
    description: opp.description,
    funderName: opp.departmentName ?? opp.organizationName,
    funderType: 'federal',
    deadline: opp.responseDeadLine,
    awardMax: opp.award?.amount ? Number(opp.award.amount) : undefined,
    geographicRestrictions: opp.placeOfPerformance
      ? { placeOfPerformance: opp.placeOfPerformance }
      : {},
  }
}

export async function scrapeSamGov(): Promise<RawGrant[]> {
  try {
    const thirtyDaysAgo = isoDaysAgo(30)
    const apiKey = process.env.SAM_GOV_API_KEY
    const params = new URLSearchParams({
      limit: '100',
      ptype: 'g',
      postedFrom: thirtyDaysAgo,
    })
    if (apiKey) params.append('api_key', apiKey)
    if (!apiKey)
      console.warn(
        '[sam-gov] SAM_GOV_API_KEY not set — requests may be rate-limited'
      )
    const url = `${SAM_GOV_URL}?${params}`

    const res = await fetch(url)
    if (!res.ok) {
      console.error(`[sam-gov] HTTP ${res.status}`)
      return []
    }

    const body = (await res.json()) as unknown as SamGovResponse
    const grants = (body.opportunitiesData ?? []).map(mapOpportunity)
    console.log(`[sam-gov] fetched ${grants.length} grants`)
    return grants
  } catch (err) {
    console.error('[sam-gov] scrape failed:', err)
    return []
  }
}
