import type { RawGrant } from '../types'

const PROGRAMS: RawGrant[] = [
  {
    source: 'salesforce',
    sourceUrl: 'https://www.salesforce.org/',
    applicationUrl: 'https://www.salesforce.org/grant-seeker/',
    title: 'Salesforce.org — Nonprofit Technology & Innovation Grants',
    description: 'Salesforce.org provides free and discounted Salesforce technology licenses and cash grants to nonprofits and higher education institutions driving social impact. Also funds tech innovation in underserved communities.',
    funderName: 'Salesforce.org',
    funderType: 'corporate',
    categoryTags: ['nonprofit', 'technology', 'crm', 'social-impact', 'education'],
    eligibilityTags: ['nonprofit', 'social-enterprise', 'education-org'],
  },
  {
    source: 'salesforce',
    sourceUrl: 'https://www.salesforce.com/company/equality/',
    applicationUrl: 'https://www.salesforce.com/company/equality/',
    title: 'Salesforce Equality Grants — Diverse Entrepreneurs',
    description: 'Salesforce Equality grants support diverse entrepreneurs and nonprofits advancing racial equity, gender equality, and LGBTQ+ inclusion through technology and community programs.',
    funderName: 'Salesforce',
    funderType: 'corporate',
    categoryTags: ['diversity', 'technology', 'equality', 'entrepreneurship'],
    eligibilityTags: ['small-business', 'nonprofit', 'minority-owned', 'community-serving'],
  },
]

export async function scrapeSalesforce(): Promise<RawGrant[]> {
  console.log(`[salesforce] returning ${PROGRAMS.length} known programs`)
  return PROGRAMS
}
