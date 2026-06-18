import type { RawGrant } from '../types'

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

const BASE_URL = 'https://www.rwjf.org/en/grants/active-funding-opportunities.html'

const STABLE: RawGrant[] = [
  {
    source: 'rwjf',
    sourceUrl: BASE_URL,
    applicationUrl: BASE_URL,
    title: 'Robert Wood Johnson Foundation — Health Equity Grants',
    description:
      'RWJF funds organizations working to advance health equity, improve health outcomes in underserved communities, and address the social determinants of health. Grant programs support healthcare innovation, community health infrastructure, workforce development in healthcare, and technology solutions that improve access and quality of care for vulnerable populations.',
    funderName: 'Robert Wood Johnson Foundation',
    funderType: 'foundation',
    awardMin: 50000,
    awardMax: 500000,
    eligibilityTags: ['healthcare', 'small-business', 'nonprofit', 'underserved-community'],
    categoryTags: ['healthcare', 'health-equity', 'technology', 'community', 'foundation'],
  },
  {
    source: 'rwjf',
    sourceUrl: 'https://www.rwjf.org/en/grants/active-funding-opportunities.html',
    applicationUrl: BASE_URL,
    title: 'RWJF Culture of Health Prize — Healthy Communities',
    description:
      'The RWJF Culture of Health Prize recognizes communities across the United States that are working to make health a shared value and a priority in community decisions — including businesses, organizations, and innovators building health infrastructure in underserved communities.',
    funderName: 'Robert Wood Johnson Foundation',
    funderType: 'foundation',
    awardMin: 25000,
    awardMax: 25000,
    eligibilityTags: ['healthcare', 'community', 'underserved-community'],
    categoryTags: ['healthcare', 'community', 'health-equity', 'foundation'],
  },
]

export async function scrapeRwjf(): Promise<RawGrant[]> {
  try {
    const res = await fetch(BASE_URL, { headers: { 'User-Agent': USER_AGENT } })
    if (!res.ok) {
      console.warn(`[rwjf] HTTP ${res.status}`)
      return STABLE
    }
    const html = await res.text()
    const titleRegex = /<h[234][^>]*>([^<]{20,180})<\/h[234]>/gi
    const grants: RawGrant[] = [...STABLE]
    const seen = new Set<string>(STABLE.map((g) => g.title))
    let match: RegExpExecArray | null
    while ((match = titleRegex.exec(html)) !== null) {
      const title = match[1].replace(/&amp;/g, '&').trim()
      if (!title || seen.has(title) || /nav|menu|header|footer/i.test(title)) continue
      if (!/grant|fund|award|program|opportunit/i.test(title)) continue
      seen.add(title)
      grants.push({
        source: 'rwjf',
        sourceUrl: BASE_URL,
        title,
        funderName: 'Robert Wood Johnson Foundation',
        funderType: 'foundation',
        eligibilityTags: ['healthcare', 'nonprofit', 'small-business'],
        categoryTags: ['healthcare', 'health-equity', 'foundation'],
      })
    }
    console.log(`[rwjf] fetched ${grants.length} grants`)
    return grants
  } catch (err) {
    console.error('[rwjf] scrape failed:', err)
    return STABLE
  }
}
