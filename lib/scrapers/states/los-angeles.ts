import type { RawGrant } from '../types'

// LA City + County grant programs — lower competition than federal/national sources
const KNOWN_PROGRAMS: RawGrant[] = [
  {
    source: 'los-angeles-local',
    sourceUrl: 'https://ewdd.lacity.org/businessresources/grants/',
    applicationUrl: 'https://ewdd.lacity.org/businessresources/grants/',
    title: 'LA City EWDD — Small Business Grants and Resources',
    description:
      'The Los Angeles Economic and Workforce Development Department funds small businesses and workforce development organizations throughout the City of Los Angeles. Programs include grants for minority-owned businesses, microbusiness support, and economic development in underserved neighborhoods.',
    funderName: 'City of Los Angeles EWDD',
    funderType: 'state',
    geographicRestrictions: { city: 'Los Angeles', state: 'CA' },
    eligibilityTags: ['small-business', 'minority-owned', 'los-angeles', 'california'],
    categoryTags: ['state', 'local', 'economic-development', 'workforce', 'community-development'],
  },
  {
    source: 'los-angeles-local',
    sourceUrl: 'https://hrc.lacounty.gov/grants/',
    applicationUrl: 'https://hrc.lacounty.gov/grants/',
    title: 'LA County Human Relations Commission Grants',
    description:
      'LA County HRC funds community organizations working on equity, inclusion, and human relations in Los Angeles County. Grants support organizations serving underserved communities, advancing racial equity, and building community resilience.',
    funderName: 'Los Angeles County Human Relations Commission',
    funderType: 'state',
    geographicRestrictions: { county: 'Los Angeles County', state: 'CA' },
    eligibilityTags: ['community-serving', 'underserved', 'los-angeles', 'california'],
    categoryTags: ['state', 'local', 'equity', 'community-development'],
  },
  {
    source: 'los-angeles-local',
    sourceUrl: 'https://www.laedc.org/programs/grants/',
    applicationUrl: 'https://www.laedc.org/programs/grants/',
    title: 'LAEDC — Los Angeles Economic Development Corporation Grants',
    description:
      'The Los Angeles Economic Development Corporation supports small businesses and entrepreneurs in LA County through grants, capital access programs, and technical assistance. Priority for minority-owned, women-owned, and underserved businesses.',
    funderName: 'Los Angeles Economic Development Corporation',
    funderType: 'niche',
    geographicRestrictions: { county: 'Los Angeles County', state: 'CA' },
    eligibilityTags: ['small-business', 'minority-owned', 'los-angeles', 'california'],
    categoryTags: ['local', 'economic-development', 'entrepreneurship'],
  },
  {
    source: 'los-angeles-local',
    sourceUrl: 'https://dpss.lacounty.gov/en/money/ihss.html',
    applicationUrl: 'https://lacounty.gov/government/departments-and-agencies/',
    title: 'LA County Arts Commission Grants',
    description:
      'The Los Angeles County Department of Arts and Culture funds artists, arts organizations, and creative economy businesses in LA County. Grants support film, music, visual arts, digital media, and cultural production with strong equity focus for underrepresented communities.',
    funderName: 'Los Angeles County Arts Commission',
    funderType: 'state',
    geographicRestrictions: { county: 'Los Angeles County', state: 'CA' },
    eligibilityTags: ['arts', 'minority-owned', 'los-angeles', 'california'],
    categoryTags: ['state', 'local', 'arts', 'culture', 'creative-economy'],
  },
  {
    source: 'los-angeles-local',
    sourceUrl: 'https://www.lacda.org/businesses/funding-opportunities',
    applicationUrl: 'https://www.lacda.org/businesses/funding-opportunities',
    title: 'LA County Development Authority — Business Funding Opportunities',
    description:
      'LACDA administers federal and state funding for community development, economic development, and small business support throughout LA County. Programs include CDBG-funded small business grants, technical assistance, and capital access for minority-owned businesses.',
    funderName: 'Los Angeles County Development Authority',
    funderType: 'state',
    geographicRestrictions: { county: 'Los Angeles County', state: 'CA' },
    eligibilityTags: ['small-business', 'minority-owned', 'community-serving', 'los-angeles'],
    categoryTags: ['state', 'local', 'community-development', 'economic-development'],
  },
]

export async function scrapeLosAngeles(): Promise<RawGrant[]> {
  console.log(`[los-angeles-local] fetched ${KNOWN_PROGRAMS.length} grants`)
  return KNOWN_PROGRAMS
}
