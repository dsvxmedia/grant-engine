import type { RawGrant } from '../types'

const PROGRAMS: RawGrant[] = [
  {
    source: 'verizon',
    sourceUrl: 'https://www.verizon.com/about/our-company/small-business-digital-ready',
    applicationUrl: 'https://www.verizon.com/about/our-company/small-business-digital-ready',
    title: 'Verizon Small Business Digital Ready — Grants & Resources',
    description: 'Verizon Small Business Digital Ready offers free courses, coaching, and grants to small business owners. Grants of up to $10,000 available to qualifying businesses.',
    funderName: 'Verizon',
    funderType: 'corporate',
    awardMax: 10000,
    categoryTags: ['small-business', 'digital', 'technology', 'workforce'],
    eligibilityTags: ['small-business'],
  },
  {
    source: 'verizon',
    sourceUrl: 'https://www.verizon.com/about/responsibility/verizon-foundation',
    applicationUrl: 'https://www.verizon.com/about/responsibility/verizon-foundation',
    title: 'Verizon Foundation — Community Grants',
    description: 'Verizon Foundation funds nonprofits and social enterprises focused on digital inclusion, education, and public safety in underserved communities.',
    funderName: 'Verizon Foundation',
    funderType: 'corporate',
    categoryTags: ['community', 'digital-inclusion', 'education', 'nonprofit'],
    eligibilityTags: ['nonprofit', 'community-serving'],
  },
]

export async function scrapeVerizon(): Promise<RawGrant[]> {
  // Verizon's grant pages are behind auth or dynamic — return known programs
  // and verify them via the Google search scraper
  console.log(`[verizon] returning ${PROGRAMS.length} known programs`)
  return PROGRAMS
}
