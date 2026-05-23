import type { RawGrant } from '../types'

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

const CATEGORIES = [
  { path: 'business', tags: ['small-business', 'entrepreneurship'] },
  { path: 'technology', tags: ['technology', 'innovation'] },
  { path: 'arts', tags: ['arts', 'culture', 'media'] },
  { path: 'community', tags: ['community', 'civic'] },
  { path: 'education', tags: ['education', 'workforce'] },
  { path: 'nonprofit', tags: ['nonprofit'] },
  { path: 'minority', tags: ['minority-owned', 'diversity'] },
  { path: 'startup', tags: ['startup', 'entrepreneurship'] },
  { path: 'media', tags: ['media', 'journalism', 'storytelling'] },
  { path: 'environment', tags: ['environment', 'sustainability'] },
]

function extractGrants(html: string, tags: string[]): RawGrant[] {
  const grants: RawGrant[] = []
  const titleRegex =
    /<a[^>]*class="[^"]*grant-title[^"]*"[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/gi
  let match: RegExpExecArray | null

  while ((match = titleRegex.exec(html)) !== null) {
    const url = match[1]
    const title = match[2].trim()
    if (!title) continue

    const after = html.slice(
      match.index + match[0].length,
      match.index + match[0].length + 2000
    )
    const descMatch = after.match(
      /<div[^>]*class="[^"]*grant-info[^"]*"[^>]*>([\s\S]*?)<\/div>/i
    )
    const description = descMatch
      ? descMatch[1].replace(/<[^>]+>/g, '').trim()
      : undefined

    grants.push({
      source: 'grantwatch',
      sourceUrl: url.startsWith('http') ? url : `https://www.grantwatch.com${url}`,
      title,
      description,
      funderType: 'niche',
      categoryTags: tags,
    })
  }
  return grants
}

async function scrapeCategory(path: string, tags: string[]): Promise<RawGrant[]> {
  const url = `https://www.grantwatch.com/cat/${path}-grants.html`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    })
    if (!res.ok) {
      console.warn(`[grantwatch/${path}] HTTP ${res.status}`)
      return []
    }
    const html = await res.text()
    return extractGrants(html, tags)
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
