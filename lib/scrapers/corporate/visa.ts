import type { RawGrant } from '../types'

const VISA_URL = 'https://usa.visa.com/run-your-business/visa-everywhere-initiative.html'

export async function scrapeVisa(): Promise<RawGrant[]> {
  return [
    {
      source: 'visa',
      sourceUrl: VISA_URL,
      applicationUrl: VISA_URL,
      title: 'Visa Everywhere Initiative — Small Business Edition',
      description:
        'The Visa Everywhere Initiative challenges small businesses and startups to solve real-world business problems. Winners receive cash prizes and access to Visa\'s global network. The program awards up to $100,000 to innovative small businesses addressing commerce, payments, and financial inclusion.',
      funderName: 'Visa Foundation',
      funderType: 'corporate',
      awardMax: 100000,
      eligibilityTags: ['small-business', 'startup', 'innovation'],
      categoryTags: ['corporate', 'technology', 'financial-inclusion', 'competition'],
    },
  ]
}
