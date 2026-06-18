import type { RawGrant } from '../types'

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

const URL = 'https://foundersfirstcdc.org/programs'

const STABLE: RawGrant[] = [
  {
    source: 'founders-first',
    sourceUrl: URL,
    applicationUrl: URL,
    title: 'Founders First CDC Revenue-Based Financing & Grant Program',
    description:
      'Founders First CDC provides grant capital and revenue-based financing to underrepresented entrepreneurs — particularly Black, Latinx, women, and veteran founders — building businesses that create jobs in underserved communities. Programs focus on service-based businesses generating $100K–$10M in revenue with a mission to grow and hire locally.',
    funderName: 'Founders First CDC',
    funderType: 'niche',
    awardMin: 15000,
    awardMax: 100000,
    eligibilityTags: ['minority-owned', 'african-american', 'small-business', 'entrepreneur', 'underserved-community'],
    categoryTags: ['community', 'entrepreneurship', 'economic-development', 'small-business'],
  },
]

export async function scrapeFoundersFirst(): Promise<RawGrant[]> {
  try {
    const res = await fetch(URL, { headers: { 'User-Agent': USER_AGENT } })
    if (!res.ok) {
      console.warn(`[founders-first] HTTP ${res.status}`)
      return STABLE
    }
    const html = await res.text()
    const titleRegex = /<h[234][^>]*>([^<]{20,180})<\/h[234]>/gi
    const grants: RawGrant[] = [...STABLE]
    let match: RegExpExecArray | null
    const seen = new Set<string>(STABLE.map((g) => g.title))
    while ((match = titleRegex.exec(html)) !== null) {
      const title = match[1].replace(/&amp;/g, '&').trim()
      if (!title || seen.has(title) || /nav|menu|header|footer/i.test(title)) continue
      if (!/grant|fund|program|capital|award|opportunit/i.test(title)) continue
      seen.add(title)
      grants.push({
        source: 'founders-first',
        sourceUrl: URL,
        title,
        funderName: 'Founders First CDC',
        funderType: 'niche',
        eligibilityTags: ['minority-owned', 'african-american', 'small-business', 'entrepreneur'],
        categoryTags: ['community', 'entrepreneurship', 'economic-development'],
      })
    }
    console.log(`[founders-first] fetched ${grants.length} grants`)
    return grants
  } catch (err) {
    console.error('[founders-first] scrape failed:', err)
    return STABLE
  }
}
