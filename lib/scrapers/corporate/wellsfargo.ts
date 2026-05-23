import type { RawGrant } from '../types'

// Wells Fargo funds community development and small business grants
// Their programs vary; these are the active ones as of 2026
const PROGRAMS: RawGrant[] = [
  {
    source: 'wells-fargo',
    sourceUrl: 'https://www.wellsfargo.com/about/corporate-responsibility/community-giving/',
    applicationUrl: 'https://www.wellsfargo.com/about/corporate-responsibility/community-giving/',
    title: 'Wells Fargo Open for Business Fund',
    description: 'Wells Fargo supports small businesses, especially those owned by women, people of color, and low-to-moderate income entrepreneurs, through grants and technical assistance.',
    funderName: 'Wells Fargo Foundation',
    funderType: 'corporate',
    categoryTags: ['small-business', 'community', 'diversity', 'financial-inclusion'],
    eligibilityTags: ['small-business', 'minority-owned', 'women-owned', 'community-serving'],
  },
  {
    source: 'wells-fargo',
    sourceUrl: 'https://www.wellsfargo.com/about/corporate-responsibility/community-giving/community-development/',
    applicationUrl: 'https://www.wellsfargo.com/about/corporate-responsibility/community-giving/community-development/',
    title: 'Wells Fargo Community Development Grants',
    description: 'Wells Fargo Community Development grants support CDFIs and nonprofits focused on affordable housing, economic development, and community services for low-income communities.',
    funderName: 'Wells Fargo Foundation',
    funderType: 'corporate',
    categoryTags: ['community', 'nonprofit', 'economic-development', 'housing'],
    eligibilityTags: ['nonprofit', 'cdfi', 'community-serving'],
  },
]

export async function scrapeWellsFargo(): Promise<RawGrant[]> {
  console.log(`[wells-fargo] returning ${PROGRAMS.length} known programs`)
  return PROGRAMS
}
