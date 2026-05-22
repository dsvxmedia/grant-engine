import type { RawGrant } from '../types'

const GRANTWATCH_URL =
  'https://www.grantwatch.com/cat/44/african-american-grants.html'
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

function extractGrants(html: string): RawGrant[] {
  const grants: RawGrant[] = []
  const titleRegex =
    /<a[^>]*class="[^"]*grant-title[^"]*"[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/gi
  let match: RegExpExecArray | null
  while ((match = titleRegex.exec(html)) !== null) {
    const url = match[1]
    const title = match[2].trim()
    if (!title) continue

    const after = html.slice(match.index + match[0].length, match.index + match[0].length + 2000)
    const descMatch = after.match(
      /<div[^>]*class="[^"]*grant-info[^"]*"[^>]*>([\s\S]*?)<\/div>/i
    )
    const description = descMatch
      ? descMatch[1].replace(/<[^>]+>/g, '').trim()
      : undefined

    grants.push({
      source: 'grantwatch',
      sourceUrl: url.startsWith('http')
        ? url
        : `https://www.grantwatch.com${url}`,
      title,
      description,
      funderType: 'niche',
    })
  }
  return grants
}

export async function scrapeGrantwatch(): Promise<RawGrant[]> {
  try {
    const res = await fetch(GRANTWATCH_URL, {
      headers: { 'User-Agent': USER_AGENT },
    })
    if (!res.ok) {
      console.warn(`[grantwatch] blocked or error — HTTP ${res.status}`)
      return []
    }
    const html = await res.text()
    const grants = extractGrants(html)
    console.log(`[grantwatch] fetched ${grants.length} grants`)
    return grants
  } catch (err) {
    console.error('[grantwatch] scrape failed:', err)
    return []
  }
}
