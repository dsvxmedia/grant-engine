import type { RawGrant } from '../types'

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

const URL = 'https://kirabo.co/grant'

function extractGrants(html: string): RawGrant[] {
  const grants: RawGrant[] = []
  const titleRegex = /<h[234][^>]*>([^<]{20,180})<\/h[234]>/gi
  let match: RegExpExecArray | null
  while ((match = titleRegex.exec(html)) !== null) {
    const title = match[1].replace(/&amp;/g, '&').trim()
    if (!title || /nav|menu|header|footer/i.test(title)) continue
    grants.push({
      source: 'kirabo',
      sourceUrl: URL,
      title,
      funderName: 'Kirabo',
      funderType: 'niche',
      eligibilityTags: ['small-business', 'entrepreneur', 'minority-owned'],
      categoryTags: ['niche', 'entrepreneurship', 'community'],
    })
  }
  return grants
}

const STABLE: RawGrant[] = [
  {
    source: 'kirabo',
    sourceUrl: URL,
    applicationUrl: 'https://kirabo.co/grant/apply',
    title: 'Kirabo Grant — Funding for Entrepreneurs and Small Businesses',
    description:
      'Kirabo provides grants and resources for entrepreneurs and small business owners. The platform focuses on supporting underrepresented founders with access to capital, mentorship, and community.',
    funderName: 'Kirabo',
    funderType: 'niche',
    eligibilityTags: ['small-business', 'entrepreneur', 'minority-owned'],
    categoryTags: ['niche', 'entrepreneurship', 'equity', 'community'],
  },
]

export async function scrapeKirabo(): Promise<RawGrant[]> {
  try {
    const res = await fetch(URL, { headers: { 'User-Agent': USER_AGENT } })
    if (!res.ok) {
      console.warn(`[kirabo] HTTP ${res.status}`)
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
    console.log(`[kirabo] fetched ${unique.length} grants`)
    return unique
  } catch (err) {
    console.error('[kirabo] scrape failed:', err)
    return STABLE
  }
}
