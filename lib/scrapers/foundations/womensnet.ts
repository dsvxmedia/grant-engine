import type { RawGrant } from '../types'

const KNOWN_WOMENSNET_GRANTS: RawGrant[] = [
  {
    source: 'womensnet',
    title: 'WomensNet Amber Grant',
    description:
      'Monthly $10,000 grant awarded to a woman business owner. No application fee, no minimum revenue requirement, no minimum age for business. Winners announced monthly. All industries eligible.',
    funderName: 'WomensNet / Amber Grant Foundation',
    funderType: 'foundation',
    awardMax: 10000,
    sourceUrl: 'https://ambergrant.com',
    applicationUrl: 'https://ambergrant.com/apply',
    eligibilityTags: ['women-owned', 'small-business', 'any-industry'],
    categoryTags: ['monthly', 'women-business', 'rolling'],
    requiresLoi: false,
  },
  {
    source: 'womensnet',
    title: 'WomensNet Monthly Business Grant',
    description:
      'Additional $10,000 monthly grant separate from the Amber Grant. Awarded each month to a different woman entrepreneur. Same simple application process.',
    funderName: 'WomensNet',
    funderType: 'foundation',
    awardMax: 10000,
    sourceUrl: 'https://womensnet.com',
    applicationUrl: 'https://womensnet.com/apply-for-a-grant/',
    eligibilityTags: ['women-owned', 'small-business'],
    categoryTags: ['monthly', 'women-business', 'rolling'],
    requiresLoi: false,
  },
]

export async function scrapeWomensnet(): Promise<RawGrant[]> {
  try {
    const res = await fetch('https://ambergrant.com', {
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GrantBot/1.0)' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const html = await res.text()

    // Check if the grant is still actively accepting applications
    const isActive =
      /apply|application|submit/i.test(html) && !/closed|suspended|paused/i.test(html)

    if (isActive) {
      console.log('[womensnet] confirmed Amber Grant is accepting applications')
    }

    return KNOWN_WOMENSNET_GRANTS
  } catch (err) {
    console.warn('[womensnet] live check failed, returning known programs:', err)
    return KNOWN_WOMENSNET_GRANTS
  }
}
