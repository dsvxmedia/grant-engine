import type { RawGrant } from '../types'

// Famous Amos was founded by Wally Amos, a Black entrepreneur.
// The Wally Amos Foundation supports entrepreneurship education.
// The brand itself (now owned by Ferrero) runs periodic small business campaigns.
const PROGRAMS: RawGrant[] = [
  {
    source: 'wally-amos-foundation',
    sourceUrl: 'https://www.wallyamos.com/',
    applicationUrl: 'https://www.wallyamos.com/',
    title: 'Wally Amos Foundation — Entrepreneurship Support',
    description: 'The Wally Amos Foundation, founded by the creator of Famous Amos cookies, supports entrepreneurship education and self-improvement programs for aspiring small business owners and youth.',
    funderName: 'Wally Amos Foundation',
    funderType: 'foundation',
    categoryTags: ['entrepreneurship', 'education', 'small-business', 'youth'],
    eligibilityTags: ['small-business', 'nonprofit', 'entrepreneur'],
  },
]

export async function scrapeFamousAmos(): Promise<RawGrant[]> {
  console.log(`[famous-amos] returning ${PROGRAMS.length} known programs`)
  return PROGRAMS
}
