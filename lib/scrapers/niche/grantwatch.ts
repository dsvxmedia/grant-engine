import type { RawGrant } from '../types'

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

const CATEGORIES = [
  { path: 'cat/13/small-business-grants.html',                    tags: ['small-business', 'entrepreneurship'] },
  { path: 'cat/16/entrepreneurs-and-startups-grants.html',        tags: ['startup', 'entrepreneurship'] },
  { path: 'cat/36/technology-grants.html',                        tags: ['technology', 'innovation'] },
  { path: 'cat/2/arts-and-culture-grants.html',                   tags: ['arts', 'culture', 'media'] },
  { path: 'cat/8/community-and-economic-development-grants.html', tags: ['community', 'economic-development'] },
  { path: 'cat/5/community-services-grants.html',                 tags: ['community', 'civic'] },
  { path: 'cat/59/education-grants.html',                         tags: ['education', 'workforce'] },
  { path: 'cat/40/workforce-grants.html',                         tags: ['workforce', 'economic-development'] },
  { path: 'cat/53/bipoc-grants.html',                             tags: ['minority-owned', 'diversity', 'bipoc'] },
  { path: 'cat/57/social-justice-grants.html',                    tags: ['social-justice', 'equity', 'community'] },
  { path: 'cat/10/environment-and-conservation-grants.html',      tags: ['environment', 'sustainability'] },
  { path: 'cat/30/science-grants.html',                           tags: ['science', 'research', 'technology'] },
  { path: 'cat/29/research-and-evaluation-grants.html',           tags: ['research', 'innovation'] },
  { path: 'cat/3/capital-funding-grants.html',                    tags: ['capital', 'funding', 'small-business'] },
  { path: 'cat/46/individual-grants.html',                        tags: ['individual', 'fellowship'] },
]

function extractGrants(html: string, categoryPath: string, tags: string[]): RawGrant[] {
  const grants: RawGrant[] = []
  const categoryUrl = `https://www.grantwatch.com/${categoryPath}`

  // GrantWatch embeds grant descriptions in <p> tags starting with "Grant"
  const descRegex = /<p[^>]*>\s*((?:Grants?|Award) (?:to|for|of|up)[^\n<]{30,400})\s*<\/p>/gi
  let match: RegExpExecArray | null

  while ((match = descRegex.exec(html)) !== null) {
    const fullDesc = match[1].trim().replace(/\s+/g, ' ')

    // Use first sentence as title (up to first period or 120 chars)
    const periodIdx = fullDesc.indexOf('. ')
    const title = periodIdx > 20 && periodIdx < 120
      ? fullDesc.slice(0, periodIdx)
      : fullDesc.slice(0, 110).trimEnd()

    if (!title || title.length < 20) continue

    grants.push({
      source: 'grantwatch',
      sourceUrl: categoryUrl,
      // applicationUrl intentionally omitted — category listing pages are not grant application URLs
      title,
      description: fullDesc.slice(0, 500),
      funderType: 'niche',
      categoryTags: tags,
      eligibilityTags: ['nonprofit', 'small-business', 'individual'],
    })
  }

  return grants
}

async function scrapeCategory(path: string, tags: string[]): Promise<RawGrant[]> {
  const url = `https://www.grantwatch.com/${path}`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    })
    if (!res.ok) {
      console.warn(`[grantwatch/${path}] HTTP ${res.status}`)
      return []
    }
    const html = await res.text()
    return extractGrants(html, path, tags)
  } catch {
    return []
  }
}

export async function scrapeGrantwatch(): Promise<RawGrant[]> {
  try {
    const results = await Promise.allSettled(
      CATEGORIES.map(({ path, tags }) => scrapeCategory(path, tags))
    )

    const all = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))

    const seen = new Set<string>()
    const unique = all.filter((g) => {
      if (seen.has(g.title)) return false
      seen.add(g.title)
      return true
    })

    console.log(`[grantwatch] fetched ${unique.length} grants across ${CATEGORIES.length} categories`)
    return unique
  } catch (err) {
    console.error('[grantwatch] scrape failed:', err)
    return []
  }
}
