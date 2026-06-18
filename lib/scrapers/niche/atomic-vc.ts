import type { RawGrant } from '../types'

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

const URL = 'https://atomic.vc/grants'

function extractGrants(html: string): RawGrant[] {
  const grants: RawGrant[] = []
  const titleRegex = /<h[234][^>]*>([^<]{20,180})<\/h[234]>/gi
  let match: RegExpExecArray | null
  while ((match = titleRegex.exec(html)) !== null) {
    const title = match[1].replace(/&amp;/g, '&').trim()
    if (!title || /nav|menu|header|footer/i.test(title)) continue
    if (!/grant|fund|award|program|opportunit/i.test(title)) continue
    grants.push({
      source: 'atomic-vc',
      sourceUrl: URL,
      title,
      funderName: 'Atomic',
      funderType: 'niche',
      eligibilityTags: ['startup', 'tech-company', 'entrepreneur'],
      categoryTags: ['niche', 'startup', 'technology', 'venture'],
    })
  }
  return grants
}

const STABLE: RawGrant[] = [
  {
    source: 'atomic-vc',
    sourceUrl: URL,
    applicationUrl: URL,
    title: 'Atomic VC Grants for Founders',
    description:
      'Atomic publishes and aggregates grant opportunities for startup founders and early-stage companies. The platform surfaces funding programs from government agencies, foundations, and corporate sponsors relevant to tech startups and innovative businesses.',
    funderName: 'Atomic',
    funderType: 'niche',
    eligibilityTags: ['startup', 'tech-company', 'founder'],
    categoryTags: ['niche', 'startup', 'technology', 'aggregator'],
  },
]

export async function scrapeAtomicVc(): Promise<RawGrant[]> {
  try {
    const res = await fetch(URL, { headers: { 'User-Agent': USER_AGENT } })
    if (!res.ok) {
      console.warn(`[atomic-vc] HTTP ${res.status}`)
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
    console.log(`[atomic-vc] fetched ${unique.length} grants`)
    return unique
  } catch (err) {
    console.error('[atomic-vc] scrape failed:', err)
    return STABLE
  }
}
