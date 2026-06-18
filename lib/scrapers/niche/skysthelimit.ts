import type { RawGrant } from '../types'

const URL = 'https://www.skysthelimit.org/apply'

const GRANTS: RawGrant[] = [
  {
    source: 'skysthelimit',
    sourceUrl: URL,
    applicationUrl: URL,
    title: "Sky's the Limit — Grants and Mentorship for Black Entrepreneurs",
    description:
      "Sky's the Limit is a nonprofit that provides grants, mentorship, and community support to early-stage entrepreneurs from underrepresented backgrounds. The organization connects founders with experts, peers, and funders to help them launch and grow their businesses. Strong focus on Black and minority entrepreneurs.",
    funderName: "Sky's the Limit",
    funderType: 'niche',
    awardMax: 10000,
    eligibilityTags: ['minority-owned', 'african-american', 'startup', 'early-stage'],
    categoryTags: ['niche', 'entrepreneurship', 'equity', 'mentorship'],
  },
]

export async function scrapeSkysTheLimit(): Promise<RawGrant[]> {
  console.log(`[skysthelimit] fetched ${GRANTS.length} grants`)
  return GRANTS
}
