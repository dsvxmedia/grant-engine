import type { RawGrant } from '../types'

const SANTANDER_URL =
  'https://www.santanderbank.com/us/about/corporate-responsibility/cultivate-small-business'

export async function scrapeSantander(): Promise<RawGrant[]> {
  return [
    {
      source: 'santander',
      sourceUrl: SANTANDER_URL,
      applicationUrl: SANTANDER_URL,
      title: 'Santander Cultivate Small Business',
      description:
        'Santander Bank\'s Cultivate Small Business program provides grants and resources to small businesses in underserved communities. The program focuses on businesses owned by women, people of color, and other underrepresented entrepreneurs in the bank\'s footprint states (MA, NH, CT, RI, NY, NJ, PA, DE, MD, DC).',
      funderName: 'Santander Bank',
      funderType: 'corporate',
      awardMax: 50000,
      eligibilityTags: ['small-business', 'minority-owned', 'women-owned', 'underserved'],
      categoryTags: ['corporate', 'community-development', 'economic-development'],
      geographicRestrictions: {
        states: ['MA', 'NH', 'CT', 'RI', 'NY', 'NJ', 'PA', 'DE', 'MD', 'DC'],
      },
    },
  ]
}
