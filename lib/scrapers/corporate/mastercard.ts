import type { RawGrant } from '../types'

const PROGRAMS: RawGrant[] = [
  {
    source: 'mastercard',
    sourceUrl: 'https://www.mastercard.us/en-us/business/overview/grow-your-business/small-business-resources/small-business-grants.html',
    applicationUrl: 'https://www.mastercard.us/en-us/business/overview/grow-your-business/small-business-resources/small-business-grants.html',
    title: 'Mastercard Strive USA — Small Business Grants',
    description: 'Mastercard Strive USA provides grants and digital tools to help small businesses grow, particularly those owned by women and minorities in underserved communities.',
    funderName: 'Mastercard',
    funderType: 'corporate',
    categoryTags: ['small-business', 'digital', 'diversity', 'entrepreneurship'],
    eligibilityTags: ['small-business', 'minority-owned', 'women-owned'],
  },
  {
    source: 'mastercard',
    sourceUrl: 'https://www.mastercardcenter.org/funding-opportunities',
    applicationUrl: 'https://www.mastercardcenter.org/funding-opportunities',
    title: 'Mastercard Center for Inclusive Growth — Grants',
    description: 'The Mastercard Center for Inclusive Growth funds research and programs that advance equitable and sustainable economic growth globally, with a focus on digital financial inclusion.',
    funderName: 'Mastercard Center for Inclusive Growth',
    funderType: 'corporate',
    categoryTags: ['economic-development', 'financial-inclusion', 'community', 'research'],
    eligibilityTags: ['nonprofit', 'research-org', 'community-serving'],
  },
]

export async function scrapeMastercard(): Promise<RawGrant[]> {
  console.log(`[mastercard] returning ${PROGRAMS.length} known programs`)
  return PROGRAMS
}
