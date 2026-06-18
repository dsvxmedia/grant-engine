import type { RawGrant } from '../types'

const URL = 'https://www.dreammakersgrant.com/apply'

const GRANTS: RawGrant[] = [
  {
    source: 'dream-makers-grant',
    sourceUrl: URL,
    applicationUrl: URL,
    title: 'Dream Makers Grant',
    description:
      'The Dream Makers Grant supports entrepreneurs and small business owners pursuing their dreams. The program provides funding and mentorship to help businesses launch and grow.',
    funderName: 'Dream Makers',
    funderType: 'niche',
    eligibilityTags: ['small-business', 'entrepreneur'],
    categoryTags: ['niche', 'entrepreneurship', 'small-business'],
  },
]

export async function scrapeDreamMakers(): Promise<RawGrant[]> {
  console.log(`[dream-makers-grant] fetched ${GRANTS.length} grants`)
  return GRANTS
}
