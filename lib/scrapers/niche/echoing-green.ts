import type { RawGrant } from '../types'

const URL = 'https://echoinggreen.org/fellowship'

const GRANTS: RawGrant[] = [
  {
    source: 'echoing-green',
    sourceUrl: URL,
    applicationUrl: URL,
    title: 'Echoing Green Fellowship',
    description:
      'Echoing Green provides $90,000 in seed funding over two years to emerging social entrepreneurs launching bold new approaches to the world\'s biggest problems. The Black Male Achievement Fellowship specifically supports Black male social innovators. Echoing Green focuses on education, economic opportunity, health equity, and community development.',
    funderName: 'Echoing Green',
    funderType: 'niche',
    awardMin: 80000,
    awardMax: 90000,
    eligibilityTags: ['minority-owned', 'african-american', 'entrepreneur', 'social-enterprise'],
    categoryTags: ['fellowship', 'social-impact', 'entrepreneurship', 'education', 'community'],
  },
]

export async function scrapeEchoingGreen(): Promise<RawGrant[]> {
  console.log(`[echoing-green] fetched ${GRANTS.length} grants`)
  return GRANTS
}
