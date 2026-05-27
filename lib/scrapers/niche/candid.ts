import type { RawGrant } from '../types'

const CANDID_URL = 'https://candid.org/find-funding/'
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

function extractGrants(html: string): RawGrant[] {
  const grants: RawGrant[] = []
  const itemRegex =
    /<div[^>]*class="[^"]*funding-item[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>|<div[^>]*class="[^"]*funding-item[^"]*"[^>]*>([\s\S]*?)<\/div>/gi
  let match: RegExpExecArray | null
  while ((match = itemRegex.exec(html)) !== null) {
    const block = match[1] || match[2] || ''
    const titleMatch = block.match(
      /<h3[^>]*class="[^"]*funding-title[^"]*"[^>]*>([^<]+)<\/h3>/i
    )
    const descMatch = block.match(
      /<p[^>]*class="[^"]*funding-description[^"]*"[^>]*>([^<]+)<\/p>/i
    )
    const linkMatch = block.match(
      /<a[^>]*class="[^"]*funding-link[^"]*"[^>]*href="([^"]+)"/i
    )

    const title = titleMatch?.[1]?.trim()
    if (!title) continue

    grants.push({
      source: 'candid',
      sourceUrl: linkMatch?.[1] ?? CANDID_URL,
      // applicationUrl intentionally omitted — Candid find-funding links go to their directory, not the funder's actual application page
      title,
      description: descMatch?.[1]?.trim(),
      funderType: 'niche',
    })
  }
  return grants
}

export async function scrapeCandid(): Promise<RawGrant[]> {
  try {
    const res = await fetch(CANDID_URL, {
      headers: { 'User-Agent': USER_AGENT },
    })
    if (!res.ok) {
      console.warn(`[candid] blocked or error — HTTP ${res.status}`)
      return []
    }
    const html = await res.text()
    const grants = extractGrants(html)
    console.log(`[candid] fetched ${grants.length} grants`)
    return grants
  } catch (err) {
    console.error('[candid] scrape failed:', err)
    return []
  }
}
