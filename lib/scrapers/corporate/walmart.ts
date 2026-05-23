import type { RawGrant } from '../types'

const PROGRAMS: RawGrant[] = [
  {
    source: 'walmart-foundation',
    sourceUrl: 'https://walmart.org/what-we-do/community-giving',
    applicationUrl: 'https://walmart.org/what-we-do/community-giving',
    title: 'Walmart Foundation — Community Grants',
    description: 'Walmart Foundation funds nonprofits focused on hunger relief, sustainability, workforce development, and community resilience. Local store grants available through the Local Community Giving program.',
    funderName: 'Walmart Foundation',
    funderType: 'corporate',
    categoryTags: ['community', 'nonprofit', 'food-security', 'workforce', 'sustainability'],
    eligibilityTags: ['nonprofit', 'community-serving'],
  },
  {
    source: 'walmart-foundation',
    sourceUrl: 'https://walmart.org/what-we-do/workforce-development',
    applicationUrl: 'https://walmart.org/what-we-do/workforce-development',
    title: 'Walmart Foundation — Workforce Development Grants',
    description: 'Walmart Foundation workforce grants support job training, skills development, and career pathways for frontline workers and underserved communities.',
    funderName: 'Walmart Foundation',
    funderType: 'corporate',
    categoryTags: ['workforce', 'training', 'community', 'economic-development'],
    eligibilityTags: ['nonprofit', 'workforce-org', 'community-serving'],
  },
]

export async function scrapeWalmart(): Promise<RawGrant[]> {
  console.log(`[walmart] returning ${PROGRAMS.length} known programs`)
  return PROGRAMS
}
