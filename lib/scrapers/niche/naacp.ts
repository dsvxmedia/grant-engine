import type { RawGrant } from '../types'

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

const NAACP_URLS = [
  'https://naacp.org/economic-justice',
  'https://naacp.org/resources/grants',
]

function extractGrants(html: string, sourceUrl: string): RawGrant[] {
  const grants: RawGrant[] = []
  const titleRegex = /<h[234][^>]*>([^<]{20,180})<\/h[234]>/gi
  let match: RegExpExecArray | null
  while ((match = titleRegex.exec(html)) !== null) {
    const title = match[1].replace(/&amp;/g, '&').trim()
    if (!title || /nav|menu|header|footer|skip/i.test(title)) continue
    if (!/grant|fund|program|award|scholar|fellowship|opportunit/i.test(title)) continue
    grants.push({
      source: 'naacp',
      sourceUrl,
      title,
      funderName: 'NAACP',
      funderType: 'niche',
      eligibilityTags: ['minority-owned', 'african-american', 'community-serving'],
      categoryTags: ['equity', 'racial-equity', 'economic-development', 'community'],
    })
  }
  return grants
}

const STABLE: RawGrant[] = [
  {
    source: 'naacp',
    sourceUrl: 'https://naacp.org/economic-justice',
    title: 'NAACP Economic Justice Programs — Grants and Resources for Black Entrepreneurs',
    description:
      'The NAACP Economic Justice programs fund initiatives that build wealth and economic opportunity for Black Americans and communities. Programs include direct grants, technical assistance, and connections to capital for Black-owned businesses and community organizations.',
    funderName: 'NAACP',
    funderType: 'niche',
    eligibilityTags: ['minority-owned', 'african-american', 'community-serving'],
    categoryTags: ['equity', 'racial-equity', 'economic-development', 'community'],
  },
]

export async function scrapeNaacp(): Promise<RawGrant[]> {
  const all: RawGrant[] = [...STABLE]

  for (const url of NAACP_URLS) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
      if (!res.ok) {
        console.warn(`[naacp] HTTP ${res.status} for ${url}`)
        continue
      }
      const html = await res.text()
      all.push(...extractGrants(html, url))
    } catch {
      // fail silently per-URL
    }
  }

  const seen = new Set<string>()
  const unique = all.filter((g) => {
    if (seen.has(g.title)) return false
    seen.add(g.title)
    return true
  })

  console.log(`[naacp] fetched ${unique.length} grants`)
  return unique
}
