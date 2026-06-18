import type { RawGrant } from '../types'

const BASE_URL = 'https://www.digitalundivided.com'

const GRANTS: RawGrant[] = [
  {
    source: 'digitalundivided',
    sourceUrl: `${BASE_URL}/programs`,
    applicationUrl: `${BASE_URL}/programs`,
    title: 'digitalundivided (DID) Breakthrough Program',
    description:
      'digitalundivided accelerates Black and Latinx women-led startups through cohort-based programs, grants, and investment readiness training. The Breakthrough and FOCUS programs provide funding, mentorship, and access to capital networks for underrepresented tech founders building scalable businesses.',
    funderName: 'digitalundivided',
    funderType: 'niche',
    awardMin: 5000,
    awardMax: 25000,
    eligibilityTags: ['minority-owned', 'african-american', 'entrepreneur', 'tech-company', 'startup'],
    categoryTags: ['accelerator', 'technology', 'entrepreneurship', 'equity', 'startup'],
  },
]

export async function scrapeDigitalUndivided(): Promise<RawGrant[]> {
  console.log(`[digitalundivided] fetched ${GRANTS.length} grants`)
  return GRANTS
}
