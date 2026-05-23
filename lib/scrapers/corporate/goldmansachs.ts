import type { RawGrant } from '../types'

const PROGRAMS: RawGrant[] = [
  {
    source: 'goldman-sachs',
    sourceUrl: 'https://www.goldmansachs.com/citizenship/10000-small-businesses/',
    applicationUrl: 'https://www.goldmansachs.com/citizenship/10000-small-businesses/apply/',
    title: 'Goldman Sachs 10,000 Small Businesses — Grants & Education',
    description: 'Goldman Sachs 10,000 Small Businesses provides entrepreneurs with practical business education, wrap-around support services, and access to capital including grants. Free program for established small businesses.',
    funderName: 'Goldman Sachs',
    funderType: 'corporate',
    categoryTags: ['small-business', 'education', 'entrepreneurship', 'accelerator'],
    eligibilityTags: ['small-business', 'for-profit', 'entrepreneur'],
  },
  {
    source: 'goldman-sachs',
    sourceUrl: 'https://www.goldmansachs.com/citizenship/one-million-black-women/',
    applicationUrl: 'https://www.goldmansachs.com/citizenship/one-million-black-women/',
    title: 'Goldman Sachs One Million Black Women Initiative',
    description: 'Goldman Sachs One Million Black Women initiative invests $10 billion in grants, loans, and technical assistance to narrow opportunity gaps facing Black women entrepreneurs and their communities.',
    funderName: 'Goldman Sachs',
    funderType: 'corporate',
    categoryTags: ['entrepreneurship', 'economic-development', 'diversity', 'community'],
    eligibilityTags: ['small-business', 'community-serving', 'entrepreneur'],
  },
]

export async function scrapeGoldmanSachs(): Promise<RawGrant[]> {
  console.log(`[goldman-sachs] returning ${PROGRAMS.length} known programs`)
  return PROGRAMS
}
