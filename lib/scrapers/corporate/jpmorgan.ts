import type { RawGrant } from '../types'

const PROGRAMS: RawGrant[] = [
  {
    source: 'jpmorgan-chase',
    sourceUrl: 'https://www.jpmorganchase.com/impact/small-business',
    applicationUrl: 'https://www.jpmorganchase.com/impact/small-business',
    title: 'JPMorgan Chase Entrepreneurs of Color Fund',
    description: 'JPMorgan Chase Entrepreneurs of Color Fund provides grants and capital to CDFIs that support Black, Latino, and other minority-owned small businesses with below-market-rate loans and technical assistance.',
    funderName: 'JPMorgan Chase',
    funderType: 'corporate',
    categoryTags: ['small-business', 'diversity', 'economic-development', 'community'],
    eligibilityTags: ['small-business', 'minority-owned', 'cdfi', 'community-serving'],
  },
  {
    source: 'jpmorgan-chase',
    sourceUrl: 'https://www.jpmorganchase.com/impact/neighborhoods',
    applicationUrl: 'https://www.jpmorganchase.com/impact/neighborhoods',
    title: 'JPMorgan Chase PRO Neighborhoods — Community Development',
    description: 'PRO Neighborhoods awards $3M+ in grants to collaboratives of CDFIs addressing community development challenges in low-income urban areas, covering housing, small business, and workforce needs.',
    funderName: 'JPMorgan Chase Foundation',
    funderType: 'corporate',
    awardMax: 3000000,
    categoryTags: ['community', 'cdfi', 'economic-development', 'housing', 'workforce'],
    eligibilityTags: ['cdfi', 'nonprofit', 'community-serving'],
  },
  {
    source: 'jpmorgan-chase',
    sourceUrl: 'https://www.jpmorganchase.com/impact/workforce',
    applicationUrl: 'https://www.jpmorganchase.com/impact/workforce',
    title: 'JPMorgan Chase New Skills at Work — Workforce Grants',
    description: 'JPMorgan Chase New Skills at Work invests in workforce development programs that connect workers — especially those in low-income communities — to good jobs in growing industries.',
    funderName: 'JPMorgan Chase Foundation',
    funderType: 'corporate',
    categoryTags: ['workforce', 'education', 'community', 'economic-development'],
    eligibilityTags: ['nonprofit', 'workforce-org', 'community-serving'],
  },
]

export async function scrapeJpmorgan(): Promise<RawGrant[]> {
  console.log(`[jpmorgan-chase] returning ${PROGRAMS.length} known programs`)
  return PROGRAMS
}
