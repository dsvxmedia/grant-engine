import type { RawGrant } from '../types'

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

const BASE_URL = 'https://www.lisc.org/our-resources/resource/find-funding'

const STABLE: RawGrant[] = [
  {
    source: 'lisc',
    sourceUrl: BASE_URL,
    applicationUrl: 'https://www.lisc.org/our-resources/resource/find-funding',
    title: 'LISC Small Business Relief Grants and Programs',
    description:
      'Local Initiatives Support Corporation (LISC) provides grants, loans, and technical assistance to small businesses in underserved communities. Programs support minority-owned businesses, community development, and economic opportunity through partnerships with corporate funders including JPMorgan Chase, MetLife, and others. LISC LA and LISC national both run active programs.',
    funderName: 'LISC (Local Initiatives Support Corporation)',
    funderType: 'foundation',
    awardMin: 5000,
    awardMax: 25000,
    eligibilityTags: ['minority-owned', 'small-business', 'african-american', 'underserved-community'],
    categoryTags: ['community', 'economic-development', 'small-business', 'entrepreneurship'],
  },
  {
    source: 'lisc',
    sourceUrl: BASE_URL,
    applicationUrl: 'https://www.lisc.org/los-angeles',
    title: 'LISC Los Angeles — Small Business Development Programs',
    description:
      'LISC Los Angeles supports small businesses and entrepreneurs in Los Angeles through grants, loans, and capacity-building programs. Programs prioritize businesses in low-income communities and those owned by people of color.',
    funderName: 'LISC Los Angeles',
    funderType: 'foundation',
    awardMin: 5000,
    awardMax: 20000,
    geographicRestrictions: { states: ['CA'], cities: ['Los Angeles'] },
    eligibilityTags: ['minority-owned', 'small-business', 'african-american', 'los-angeles'],
    categoryTags: ['community', 'economic-development', 'small-business'],
  },
]

export async function scrapeLisc(): Promise<RawGrant[]> {
  try {
    const res = await fetch(BASE_URL, { headers: { 'User-Agent': USER_AGENT } })
    if (!res.ok) {
      console.warn(`[lisc] HTTP ${res.status}`)
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
      if (!/grant|fund|award|program|loan|opportunit/i.test(title)) continue
      seen.add(title)
      grants.push({
        source: 'lisc',
        sourceUrl: BASE_URL,
        title,
        funderName: 'LISC',
        funderType: 'foundation',
        eligibilityTags: ['minority-owned', 'small-business'],
        categoryTags: ['community', 'economic-development'],
      })
    }
    console.log(`[lisc] fetched ${grants.length} grants`)
    return grants
  } catch (err) {
    console.error('[lisc] scrape failed:', err)
    return STABLE
  }
}
