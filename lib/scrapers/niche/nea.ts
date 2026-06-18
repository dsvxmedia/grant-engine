import type { RawGrant } from '../types'

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

const BASE_URL = 'https://www.arts.gov/grants'

const STABLE: RawGrant[] = [
  {
    source: 'nea',
    sourceUrl: BASE_URL,
    applicationUrl: 'https://www.arts.gov/grants/apply-grant',
    title: 'National Endowment for the Arts — Grants for Arts Projects',
    description:
      'The NEA\'s Grants for Arts Projects program supports projects that extend the reach of the arts to underserved populations, amplify diverse cultural voices, and build the capacity of arts organizations. Awards support music, film, media, visual arts, literary arts, and cross-disciplinary creative work. Eligible applicants include individual artists (via partner organizations), nonprofits, and arts-focused small businesses.',
    funderName: 'National Endowment for the Arts',
    funderType: 'federal',
    awardMin: 10000,
    awardMax: 100000,
    eligibilityTags: ['arts-organization', 'small-business', 'minority-owned'],
    categoryTags: ['arts', 'media', 'music', 'film', 'cultural-production', 'federal'],
  },
  {
    source: 'nea',
    sourceUrl: BASE_URL,
    applicationUrl: 'https://www.arts.gov/grants/challenge-america',
    title: 'NEA Challenge America — Reaching Underserved Communities',
    description:
      'NEA Challenge America grants support projects that extend the reach of the arts to underserved communities — those whose opportunities to experience the arts are limited by geography, ethnicity, economics, or disability. Awards of $10,000 help organizations bring arts programming to communities that rarely benefit from arts funding.',
    funderName: 'National Endowment for the Arts',
    funderType: 'federal',
    awardMin: 10000,
    awardMax: 10000,
    eligibilityTags: ['arts-organization', 'small-business', 'underserved-community'],
    categoryTags: ['arts', 'community', 'cultural-production', 'federal'],
  },
]

export async function scrapeNea(): Promise<RawGrant[]> {
  try {
    const res = await fetch(BASE_URL, { headers: { 'User-Agent': USER_AGENT } })
    if (!res.ok) {
      console.warn(`[nea] HTTP ${res.status}`)
      return STABLE
    }
    const html = await res.text()
    const titleRegex = /<h[234][^>]*>([^<]{20,180})<\/h[234]>/gi
    const grants: RawGrant[] = [...STABLE]
    const seen = new Set<string>(STABLE.map((g) => g.title))
    let match: RegExpExecArray | null
    while ((match = titleRegex.exec(html)) !== null) {
      const title = match[1].replace(/&amp;/g, '&').trim()
      if (!title || seen.has(title) || /nav|menu|header|footer/i.test(title)) continue
      if (!/grant|fund|award|program|opportunit/i.test(title)) continue
      seen.add(title)
      grants.push({
        source: 'nea',
        sourceUrl: BASE_URL,
        title,
        funderName: 'National Endowment for the Arts',
        funderType: 'federal',
        eligibilityTags: ['arts-organization', 'small-business'],
        categoryTags: ['arts', 'media', 'cultural-production', 'federal'],
      })
    }
    console.log(`[nea] fetched ${grants.length} grants`)
    return grants
  } catch (err) {
    console.error('[nea] scrape failed:', err)
    return STABLE
  }
}
