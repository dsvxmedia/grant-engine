import type { RawGrant } from '../types'

const GEORGIA_URL =
  'https://www.georgia.org/business-development/access-to-capital/grants'
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

function extractGrants(html: string): RawGrant[] {
  const grants: RawGrant[] = []
  const cardRegex =
    /<article[^>]*class="[^"]*grant-card[^"]*"[^>]*>([\s\S]*?)<\/article>/gi
  let match: RegExpExecArray | null
  while ((match = cardRegex.exec(html)) !== null) {
    const block = match[1]
    const titleMatch = block.match(/<h[23][^>]*>([^<]+)<\/h[23]>/i)
    const descMatch = block.match(/<p[^>]*>([^<]+)<\/p>/i)
    const linkMatch = block.match(/<a[^>]*href="([^"]+)"/i)

    const title = titleMatch?.[1]?.trim()
    if (!title) continue

    grants.push({
      source: 'georgia-state',
      sourceUrl: linkMatch?.[1] ?? GEORGIA_URL,
      title,
      description: descMatch?.[1]?.trim(),
      funderName: 'State of Georgia',
      funderType: 'state',
      geographicRestrictions: { state: 'GA' },
    })
  }
  return grants
}

export async function scrapeGeorgia(): Promise<RawGrant[]> {
  try {
    const res = await fetch(GEORGIA_URL, {
      headers: { 'User-Agent': USER_AGENT },
    })
    if (!res.ok) {
      console.warn(`[georgia-state] HTTP ${res.status}`)
      return []
    }
    const html = await res.text()
    const grants = extractGrants(html)
    console.log(`[georgia-state] fetched ${grants.length} grants`)
    return grants
  } catch (err) {
    console.error('[georgia-state] scrape failed:', err)
    return []
  }
}
