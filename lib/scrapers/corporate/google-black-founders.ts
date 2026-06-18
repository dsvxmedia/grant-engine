import type { RawGrant } from '../types'

const URL = 'https://startup.google.com/programs/black-founders/'

export async function scrapeGoogleBlackFounders(): Promise<RawGrant[]> {
  return [
    {
      source: 'google-black-founders',
      sourceUrl: URL,
      applicationUrl: URL,
      title: 'Google for Startups Black Founders Fund',
      description:
        'The Google for Startups Black Founders Fund provides non-dilutive cash awards and Google Cloud credits to Black-led startups in the US. The fund awards up to $100,000 in cash and up to $200,000 in Google Cloud credits to early-stage tech startups led by Black founders.',
      funderName: 'Google for Startups',
      funderType: 'corporate',
      awardMax: 100000,
      eligibilityTags: ['minority-owned', 'african-american', 'startup', 'tech-company'],
      categoryTags: ['corporate', 'technology', 'innovation', 'equity'],
    },
  ]
}
