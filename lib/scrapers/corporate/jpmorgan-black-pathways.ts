import type { RawGrant } from '../types'

const URL = 'https://www.jpmorganchase.com/impact/people/advancing-black-pathways'

export async function scrapeJPMorganBlackPathways(): Promise<RawGrant[]> {
  return [
    {
      source: 'jpmorgan-black-pathways',
      sourceUrl: URL,
      applicationUrl: URL,
      title: 'JPMorgan Chase Advancing Black Pathways',
      description:
        'JPMorgan Chase\'s Advancing Black Pathways initiative provides grants, capital access, and resources to Black-owned businesses and entrepreneurs. The program focuses on wealth creation, career advancement, and business development for Black Americans through direct funding and ecosystem support.',
      funderName: 'JPMorgan Chase',
      funderType: 'corporate',
      awardMax: 150000,
      eligibilityTags: ['minority-owned', 'african-american', 'small-business'],
      categoryTags: ['corporate', 'economic-development', 'equity', 'community-development'],
    },
  ]
}
