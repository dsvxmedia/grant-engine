import type { RawGrant } from '../types'

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

const BASE_URL = 'https://arts.ca.gov/grants'

const STABLE: RawGrant[] = [
  {
    source: 'california-arts-council',
    sourceUrl: BASE_URL,
    applicationUrl: BASE_URL,
    title: 'California Arts Council — Artists in Communities Grant',
    description:
      'The California Arts Council supports arts-based community engagement projects that deepen the connection between artists, arts organizations, and local communities across California. Grants fund residencies, collaborative projects, and programs that center cultural equity and underserved communities.',
    funderName: 'California Arts Council',
    funderType: 'state',
    awardMin: 5000,
    awardMax: 50000,
    geographicRestrictions: { states: ['CA'] },
    eligibilityTags: ['arts-organization', 'small-business', 'california'],
    categoryTags: ['arts', 'community', 'cultural-production', 'state'],
  },
  {
    source: 'california-arts-council',
    sourceUrl: BASE_URL,
    applicationUrl: BASE_URL,
    title: 'California Arts Council — Creative California Communities Grant',
    description:
      'Supports arts-based projects that address issues of community health, social justice, and civic engagement in California. Prioritizes organizations led by or serving communities of color, low-income populations, and populations that have been historically excluded from arts funding.',
    funderName: 'California Arts Council',
    funderType: 'state',
    awardMin: 10000,
    awardMax: 75000,
    geographicRestrictions: { states: ['CA'] },
    eligibilityTags: ['arts-organization', 'minority-owned', 'small-business', 'california', 'underserved-community'],
    categoryTags: ['arts', 'community', 'social-justice', 'cultural-production', 'state'],
  },
]

export async function scrapeCaliforniaArts(): Promise<RawGrant[]> {
  try {
    const res = await fetch(BASE_URL, { headers: { 'User-Agent': USER_AGENT } })
    if (!res.ok) {
      console.warn(`[california-arts-council] HTTP ${res.status}`)
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
        source: 'california-arts-council',
        sourceUrl: BASE_URL,
        title,
        funderName: 'California Arts Council',
        funderType: 'state',
        geographicRestrictions: { states: ['CA'] },
        eligibilityTags: ['arts-organization', 'small-business', 'california'],
        categoryTags: ['arts', 'cultural-production', 'state'],
      })
    }
    console.log(`[california-arts-council] fetched ${grants.length} grants`)
    return grants
  } catch (err) {
    console.error('[california-arts-council] scrape failed:', err)
    return STABLE
  }
}
