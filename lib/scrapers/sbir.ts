import type { RawGrant } from './types'

// SBIR solicitations via SAM.gov opportunities API (sbir.gov API is no longer publicly accessible)
const SAM_SBIR_URL =
  'https://api.sam.gov/opportunities/v2/search?api_key=DEMO_KEY&limit=100&typeOfSetAsideDescription=Small+Business+Innovation+Research&ptype=k&active=true'

type SamOpportunity = {
  noticeId?: string
  title?: string
  solicitationNumber?: string
  fullParentPathName?: string
  organizationName?: string
  postedDate?: string
  responseDeadLine?: string
  archiveDate?: string
  awardAmount?: number
  description?: string
  uiLink?: string
  naicsCode?: string
}

type SamResponse = {
  opportunitiesData?: SamOpportunity[]
  totalRecords?: number
}

function mapSamSbir(opp: SamOpportunity): RawGrant | null {
  if (!opp.title) return null
  return {
    source: 'sbir',
    sourceUrl: opp.uiLink ?? 'https://sam.gov/search/?index=opp&sfm%5BsimpleSearch%5D%5BkeywordRadio%5D=ALL&sfm%5BsimpleSearch%5D%5BkeywordTags%5D%5B0%5D%5Bkey%5D=SBIR',
    title: `SBIR - ${opp.title}`,
    description: opp.description,
    funderName: opp.organizationName ?? opp.fullParentPathName,
    funderType: 'federal',
    deadline: opp.responseDeadLine,
    isNewProgram: false,
    categoryTags: ['SBIR', 'federal', 'tech'],
    eligibilityTags: ['sbir_eligible', 'tech_company'],
  }
}

export async function scrapeSbir(): Promise<RawGrant[]> {
  try {
    const res = await fetch(SAM_SBIR_URL)
    if (!res.ok) {
      console.error(`[sbir] SAM.gov HTTP ${res.status}`)
      return []
    }
    const body = (await res.json()) as SamResponse
    const opps = body.opportunitiesData ?? []
    const grants = opps.map(mapSamSbir).filter((g): g is RawGrant => g !== null)
    console.log(`[sbir] fetched ${grants.length} SBIR grants via SAM.gov`)
    return grants
  } catch (err) {
    console.error('[sbir] scrape failed:', err)
    return []
  }
}
