import type { RawGrant } from '../types'

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

// PND publishes RFPs and grant opportunities from foundations nationwide
// Free, public — one of the highest-volume foundation grant aggregators
const CATEGORIES = [
  {
    url: 'https://philanthropynewsdigest.org/rfps?category=arts-and-culture',
    tags: ['arts', 'culture', 'creative-economy', 'media'],
  },
  {
    url: 'https://philanthropynewsdigest.org/rfps?category=education',
    tags: ['education', 'workforce', 'youth'],
  },
  {
    url: 'https://philanthropynewsdigest.org/rfps?category=health',
    tags: ['health', 'community-health', 'healthcare'],
  },
  {
    url: 'https://philanthropynewsdigest.org/rfps?category=community-development',
    tags: ['community', 'economic-development', 'equity'],
  },
  {
    url: 'https://philanthropynewsdigest.org/rfps?category=technology',
    tags: ['technology', 'innovation', 'digital'],
  },
  {
    url: 'https://philanthropynewsdigest.org/rfps?category=social-justice',
    tags: ['equity', 'social-justice', 'racial-equity'],
  },
  {
    url: 'https://philanthropynewsdigest.org/rfps?category=economic-development',
    tags: ['economic-development', 'entrepreneurship', 'small-business'],
  },
]

function extractGrants(html: string, sourceUrl: string, tags: string[]): RawGrant[] {
  const grants: RawGrant[] = []

  // PND article titles are in <h2 class="article-title"> or similar
  const titleRegex =
    /<(?:h2|h3)[^>]*class="[^"]*(?:title|headline|post-title)[^"]*"[^>]*>\s*(?:<a[^>]*>)?([^<]{20,200})(?:<\/a>)?\s*<\/(?:h2|h3)>/gi
  let match: RegExpExecArray | null
  while ((match = titleRegex.exec(html)) !== null) {
    const title = match[1].replace(/&amp;/g, '&').replace(/&#\d+;/g, '').trim()
    if (!title || title.length < 20) continue

    grants.push({
      source: 'philanthropy-news-digest',
      sourceUrl,
      title,
      funderType: 'foundation',
      categoryTags: ['foundation', ...tags],
      eligibilityTags: ['nonprofit', 'small-business', 'community-organization'],
    })
  }

  return grants
}

async function scrapeCategory(url: string, tags: string[]): Promise<RawGrant[]> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
    if (!res.ok) {
      console.warn(`[pnd] HTTP ${res.status} for ${url}`)
      return []
    }
    const html = await res.text()
    return extractGrants(html, url, tags)
  } catch {
    return []
  }
}

export async function scrapePhilanthropyNewsDigest(): Promise<RawGrant[]> {
  try {
    const results = await Promise.allSettled(
      CATEGORIES.map(({ url, tags }) => scrapeCategory(url, tags))
    )

    const all = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))

    const seen = new Set<string>()
    const unique = all.filter((g) => {
      if (seen.has(g.title)) return false
      seen.add(g.title)
      return true
    })

    console.log(`[pnd] fetched ${unique.length} grants across ${CATEGORIES.length} categories`)
    return unique
  } catch (err) {
    console.error('[pnd] scrape failed:', err)
    return []
  }
}
