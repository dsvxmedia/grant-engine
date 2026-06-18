import type { RawGrant } from '../types'

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

const BASE_URL = 'https://www.blackenterprise.com/category/grants'

function extractGrants(html: string): RawGrant[] {
  const grants: RawGrant[] = []
  const titleRegex = /<h[234][^>]*class="[^"]*(?:entry-title|post-title|article-title)[^"]*"[^>]*>(?:<a[^>]*>)?([^<]{15,180})(?:<\/a>)?<\/h[234]>/gi
  const fallbackRegex = /<h[234][^>]*>([^<]{15,180})<\/h[234]>/gi
  const seen = new Set<string>()

  let match: RegExpExecArray | null
  const useRegex = titleRegex.test(html) ? titleRegex : fallbackRegex
  useRegex.lastIndex = 0

  while ((match = useRegex.exec(html)) !== null) {
    const title = match[1].replace(/&amp;/g, '&').replace(/&#8217;/g, "'").trim()
    if (!title || seen.has(title) || /nav|menu|header|footer|sidebar/i.test(title)) continue
    if (!/grant|fund|award|opportunity|program|money|capital/i.test(title)) continue
    seen.add(title)
    grants.push({
      source: 'black-enterprise',
      sourceUrl: BASE_URL,
      title,
      funderName: 'Black Enterprise (Aggregated)',
      funderType: 'niche',
      eligibilityTags: ['african-american', 'minority-owned', 'small-business', 'entrepreneur'],
      categoryTags: ['aggregator', 'entrepreneurship', 'small-business'],
    })
  }
  return grants
}

const STABLE: RawGrant[] = [
  {
    source: 'black-enterprise',
    sourceUrl: BASE_URL,
    applicationUrl: BASE_URL,
    title: 'Black Enterprise — Grants & Funding Opportunities for Black Businesses',
    description:
      'Black Enterprise aggregates grant opportunities, funding programs, and capital resources for Black entrepreneurs and business owners. The platform covers federal grants, corporate programs, foundation funding, and pitch competitions specifically targeting Black-owned businesses across industries including technology, media, healthcare, and consumer goods.',
    funderName: 'Black Enterprise (Aggregated)',
    funderType: 'niche',
    eligibilityTags: ['african-american', 'minority-owned', 'small-business', 'entrepreneur'],
    categoryTags: ['aggregator', 'entrepreneurship', 'small-business', 'technology'],
  },
]

export async function scrapeBlackEnterprise(): Promise<RawGrant[]> {
  try {
    const res = await fetch(BASE_URL, { headers: { 'User-Agent': USER_AGENT } })
    if (!res.ok) {
      console.warn(`[black-enterprise] HTTP ${res.status}`)
      return STABLE
    }
    const html = await res.text()
    const scraped = extractGrants(html)
    const all = [...STABLE, ...scraped]
    const seen = new Set<string>()
    const unique = all.filter((g) => {
      if (seen.has(g.title)) return false
      seen.add(g.title)
      return true
    })
    console.log(`[black-enterprise] fetched ${unique.length} grants`)
    return unique
  } catch (err) {
    console.error('[black-enterprise] scrape failed:', err)
    return STABLE
  }
}
