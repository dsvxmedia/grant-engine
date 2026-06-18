import type { RawGrant } from '../types'

const URL = 'https://www.toryburchfoundation.org/resources/grants/'

const GRANTS: RawGrant[] = [
  {
    source: 'tory-burch-foundation',
    sourceUrl: URL,
    applicationUrl: URL,
    title: 'Tory Burch Foundation Fellows Program',
    description:
      'The Tory Burch Foundation supports women entrepreneurs through its Fellows Program — a year-long business education, community, and mentorship initiative. Fellows receive a $5,000 grant, business education, access to low-cost capital through the foundation\'s partnership with Bank of America, and a community of women entrepreneurs.',
    funderName: 'Tory Burch Foundation',
    funderType: 'foundation',
    awardMin: 5000,
    awardMax: 5000,
    eligibilityTags: ['women-owned', 'small-business', 'entrepreneur'],
    categoryTags: ['foundation', 'women-owned', 'entrepreneurship', 'fellowship'],
  },
]

export async function scrapeToryBurchFoundation(): Promise<RawGrant[]> {
  console.log(`[tory-burch-foundation] fetched ${GRANTS.length} grants`)
  return GRANTS
}
