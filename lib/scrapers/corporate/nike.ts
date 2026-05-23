import type { RawGrant } from '../types'

const PROGRAMS: RawGrant[] = [
  {
    source: 'nike',
    sourceUrl: 'https://www.nikeinc.com/pages/community-investment',
    applicationUrl: 'https://www.nikeinc.com/pages/community-investment',
    title: 'Nike Community Impact Fund',
    description: 'Nike Community Impact Fund grants support nonprofit organizations and community programs focused on sport, physical activity, and youth development in communities where Nike employees live and work.',
    funderName: 'Nike',
    funderType: 'corporate',
    awardMax: 50000,
    categoryTags: ['community', 'youth', 'sports', 'wellness', 'nonprofit'],
    eligibilityTags: ['nonprofit', 'community-serving', 'youth-serving'],
  },
  {
    source: 'nike',
    sourceUrl: 'https://www.nike.com/help/a/jordan-brand',
    applicationUrl: 'https://www.nike.com/',
    title: 'Jordan Brand — Flight School Grant',
    description: 'Jordan Brand Flight School provides grants and resources to athletes, entrepreneurs, and creatives from underserved communities to pursue their dreams, with emphasis on Black communities and youth empowerment.',
    funderName: 'Jordan Brand / Nike',
    funderType: 'corporate',
    categoryTags: ['youth', 'entrepreneurship', 'sports', 'culture', 'community'],
    eligibilityTags: ['small-business', 'youth-serving', 'community-serving'],
  },
  {
    source: 'nike',
    sourceUrl: 'https://www.nikeinc.com/pages/made-to-play',
    applicationUrl: 'https://www.nikeinc.com/pages/made-to-play',
    title: 'Nike Made to Play — Active Kids & Community Grants',
    description: 'Nike Made to Play funds organizations creating physical activity opportunities for kids, especially those in underserved communities, through grants and volunteer support.',
    funderName: 'Nike Foundation',
    funderType: 'corporate',
    categoryTags: ['youth', 'sports', 'community', 'health', 'education'],
    eligibilityTags: ['nonprofit', 'youth-serving', 'community-serving'],
  },
]

export async function scrapeNike(): Promise<RawGrant[]> {
  console.log(`[nike] returning ${PROGRAMS.length} known programs`)
  return PROGRAMS
}
