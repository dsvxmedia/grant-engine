import type { RawGrant } from '../types'

const PROGRAMS: RawGrant[] = [
  {
    source: 'bank-of-america',
    sourceUrl: 'https://about.bankofamerica.com/en/making-an-impact/neighborhood-builders',
    applicationUrl: 'https://about.bankofamerica.com/en/making-an-impact/neighborhood-builders',
    title: 'Bank of America Neighborhood Builders',
    description: 'Bank of America Neighborhood Builders awards $200,000 to nonprofits making a difference in their communities, plus leadership development for nonprofit executive directors and emerging leaders.',
    funderName: 'Bank of America',
    funderType: 'corporate',
    awardMax: 200000,
    categoryTags: ['community', 'nonprofit', 'leadership', 'economic-development'],
    eligibilityTags: ['nonprofit', 'community-serving'],
  },
  {
    source: 'bank-of-america',
    sourceUrl: 'https://about.bankofamerica.com/en/making-an-impact/community-development',
    applicationUrl: 'https://about.bankofamerica.com/en/making-an-impact/community-development',
    title: 'Bank of America Community Development Grants',
    description: 'Bank of America Community Development grants support affordable housing, economic mobility, workforce development, and financial health initiatives for underserved communities.',
    funderName: 'Bank of America',
    funderType: 'corporate',
    categoryTags: ['community', 'housing', 'economic-development', 'financial-inclusion', 'workforce'],
    eligibilityTags: ['nonprofit', 'cdfi', 'community-serving'],
  },
]

export async function scrapeBankOfAmerica(): Promise<RawGrant[]> {
  console.log(`[bank-of-america] returning ${PROGRAMS.length} known programs`)
  return PROGRAMS
}
