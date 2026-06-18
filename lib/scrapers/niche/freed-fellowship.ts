import type { RawGrant } from '../types'

const URL = 'https://www.freedfellowship.com/apply'

const GRANTS: RawGrant[] = [
  {
    source: 'freed-fellowship',
    sourceUrl: URL,
    applicationUrl: URL,
    title: 'Freed Fellowship',
    description:
      'The Freed Fellowship supports entrepreneurs and innovators working to create positive change. The fellowship provides funding, mentorship, and community for founders building impactful businesses and organizations.',
    funderName: 'Freed Fellowship',
    funderType: 'niche',
    eligibilityTags: ['entrepreneur', 'small-business', 'startup'],
    categoryTags: ['niche', 'fellowship', 'entrepreneurship', 'innovation'],
  },
]

export async function scrapeFreedFellowship(): Promise<RawGrant[]> {
  console.log(`[freed-fellowship] fetched ${GRANTS.length} grants`)
  return GRANTS
}
