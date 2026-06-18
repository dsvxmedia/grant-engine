import type { RawGrant } from '../types'

const URL = 'https://camelbackventures.org/fellowship'

const GRANTS: RawGrant[] = [
  {
    source: 'camelback-ventures',
    sourceUrl: URL,
    applicationUrl: URL,
    title: 'Camelback Ventures Fellowship',
    description:
      'Camelback Ventures provides $25,000–$100,000 in unrestricted capital, plus coaching and network access, to underrepresented founders building solutions for youth and communities of color. Fellows are typically education, workforce, and social impact entrepreneurs. The fellowship centers Black and Latinx founders solving problems in education, economic mobility, and community development.',
    funderName: 'Camelback Ventures',
    funderType: 'niche',
    awardMin: 25000,
    awardMax: 100000,
    eligibilityTags: ['minority-owned', 'african-american', 'entrepreneur', 'social-enterprise'],
    categoryTags: ['fellowship', 'education', 'social-impact', 'entrepreneurship', 'community'],
  },
]

export async function scrapeCamelback(): Promise<RawGrant[]> {
  console.log(`[camelback] fetched ${GRANTS.length} grants`)
  return GRANTS
}
