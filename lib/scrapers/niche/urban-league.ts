import type { RawGrant } from '../types'

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

const BASE_URL = 'https://nul.org/entrepreneurship-and-small-business'

const STABLE: RawGrant[] = [
  {
    source: 'national-urban-league',
    sourceUrl: BASE_URL,
    applicationUrl: BASE_URL,
    title: 'National Urban League — Entrepreneurship Center Grants',
    description:
      'The National Urban League\'s Entrepreneurship Center programs provide funding, technical assistance, and capacity-building resources to Black entrepreneurs and small business owners. Programs focus on startups and early-stage businesses in technology, services, and community-oriented industries, particularly in urban communities.',
    funderName: 'National Urban League',
    funderType: 'niche',
    awardMin: 5000,
    awardMax: 50000,
    eligibilityTags: ['minority-owned', 'african-american', 'small-business', 'entrepreneur'],
    categoryTags: ['community', 'entrepreneurship', 'economic-development', 'small-business'],
  },
  {
    source: 'national-urban-league',
    sourceUrl: 'https://urbanleagueca.org',
    applicationUrl: 'https://urbanleagueca.org/programs',
    title: 'Urban League of Southern California — Small Business Programs',
    description:
      'The Urban League of Southern California supports Black entrepreneurs and small business owners in the Los Angeles region through grants, business development programs, and workforce initiatives. Programs serve businesses across technology, professional services, and community-focused industries.',
    funderName: 'Urban League of Southern California',
    funderType: 'niche',
    awardMin: 2500,
    awardMax: 25000,
    geographicRestrictions: { states: ['CA'], cities: ['Los Angeles'] },
    eligibilityTags: ['minority-owned', 'african-american', 'small-business', 'los-angeles'],
    categoryTags: ['community', 'entrepreneurship', 'economic-development'],
  },
]

export async function scrapeUrbanLeague(): Promise<RawGrant[]> {
  try {
    const res = await fetch(BASE_URL, { headers: { 'User-Agent': USER_AGENT } })
    if (!res.ok) {
      console.warn(`[national-urban-league] HTTP ${res.status}`)
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
        source: 'national-urban-league',
        sourceUrl: BASE_URL,
        title,
        funderName: 'National Urban League',
        funderType: 'niche',
        eligibilityTags: ['minority-owned', 'african-american', 'small-business'],
        categoryTags: ['community', 'entrepreneurship'],
      })
    }
    console.log(`[national-urban-league] fetched ${grants.length} grants`)
    return grants
  } catch (err) {
    console.error('[national-urban-league] scrape failed:', err)
    return STABLE
  }
}
