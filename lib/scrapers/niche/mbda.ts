import type { RawGrant } from '../types'

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

const MBDA_GRANTS_URL = 'https://www.mbda.gov/businesscenters/grants'

function extractGrants(html: string): RawGrant[] {
  const grants: RawGrant[] = []
  const titleRegex = /<h[234][^>]*>([^<]{15,150})<\/h[234]>/gi
  let match: RegExpExecArray | null
  while ((match = titleRegex.exec(html)) !== null) {
    const title = match[1].replace(/&amp;/g, '&').trim()
    if (!title || /nav|menu|header|footer|skip|breadcrumb/i.test(title)) continue
    if (!/grant|fund|award|program|opportunit/i.test(title)) continue
    grants.push({
      source: 'mbda',
      sourceUrl: MBDA_GRANTS_URL,
      title,
      funderName: 'Minority Business Development Agency',
      funderType: 'federal',
      eligibilityTags: ['minority-owned', 'african-american', 'small-business'],
      categoryTags: ['federal', 'minority-business', 'economic-development'],
    })
  }
  return grants
}

// Stable known MBDA programs as a floor — always returned even if scrape fails
const STABLE: RawGrant[] = [
  {
    source: 'mbda',
    sourceUrl: 'https://www.mbda.gov/businesscenters/grants',
    title: 'MBDA Business Center — Minority Business Grants and Capital Access',
    description:
      'The Minority Business Development Agency (MBDA) is the only federal agency dedicated to the growth and global competitiveness of minority business enterprises. MBDA Business Centers provide grants, technical assistance, and access to capital for minority-owned businesses. Programs include direct grants and connections to federal contracting opportunities.',
    funderName: 'Minority Business Development Agency (MBDA)',
    funderType: 'federal',
    eligibilityTags: ['minority-owned', 'african-american', 'small-business'],
    categoryTags: ['federal', 'minority-business', 'economic-development', 'capital-access'],
  },
  {
    source: 'mbda',
    sourceUrl: 'https://www.mbda.gov/programs/technical-assistance',
    title: 'MBDA Enterprising Women of Color Initiative',
    description:
      'MBDA program focused on supporting minority women-owned businesses with access to capital, contracts, and markets. Provides direct technical assistance and grant access for minority women entrepreneurs.',
    funderName: 'Minority Business Development Agency (MBDA)',
    funderType: 'federal',
    eligibilityTags: ['minority-owned', 'women-owned', 'african-american', 'small-business'],
    categoryTags: ['federal', 'minority-business', 'women-owned', 'equity'],
  },
]

export async function scrapeMbda(): Promise<RawGrant[]> {
  try {
    const res = await fetch(MBDA_GRANTS_URL, {
      headers: { 'User-Agent': USER_AGENT },
    })
    if (!res.ok) {
      console.warn(`[mbda] HTTP ${res.status}`)
      return STABLE
    }
    const html = await res.text()
    const scraped = extractGrants(html)
    const combined = [...STABLE, ...scraped]

    const seen = new Set<string>()
    const unique = combined.filter((g) => {
      if (seen.has(g.title)) return false
      seen.add(g.title)
      return true
    })

    console.log(`[mbda] fetched ${unique.length} grants`)
    return unique
  } catch (err) {
    console.error('[mbda] scrape failed:', err)
    return STABLE
  }
}
