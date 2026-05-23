import type { RawGrant } from '../types'

const KNOWN_PROGRAMS: RawGrant[] = [
  {
    source: 'knight-foundation',
    sourceUrl: 'https://knightfoundation.org/grants/',
    applicationUrl: 'https://knightfoundation.org/apply/',
    title: 'Knight Arts Challenge',
    description: 'The Knight Arts Challenge funds the best ideas that celebrate and strengthen arts and culture in Knight communities. Open to individuals and organizations. Projects must be arts-related and take place in a Knight community.',
    funderName: 'Knight Foundation',
    funderType: 'foundation',
    awardMin: 5000,
    awardMax: 200000,
    eligibilityTags: ['arts', 'community', 'nonprofit', 'individual'],
    categoryTags: ['arts', 'culture', 'community'],
    geographicRestrictions: { cities: ['Miami', 'Philadelphia', 'Detroit', 'Akron', 'Charlotte', 'Columbus', 'Macon', 'San Jose', 'Tallahassee', 'St. Paul'] },
  },
  {
    source: 'knight-foundation',
    sourceUrl: 'https://knightfoundation.org/programs/community-and-national-initiatives/',
    applicationUrl: 'https://knightfoundation.org/apply/',
    title: 'Knight Community Information Challenge',
    description: 'Supports innovative projects that help people in Knight communities find and act on local information they need. Funds media, journalism, civic tech, and information access initiatives.',
    funderName: 'Knight Foundation',
    funderType: 'foundation',
    awardMin: 25000,
    awardMax: 500000,
    eligibilityTags: ['media', 'journalism', 'nonprofit', 'tech', 'civic-tech'],
    categoryTags: ['journalism', 'media', 'information-access', 'technology'],
  },
  {
    source: 'knight-foundation',
    sourceUrl: 'https://knightfoundation.org/programs/journalism/',
    applicationUrl: 'https://knightfoundation.org/apply/',
    title: 'Knight Journalism Initiative',
    description: 'Supports journalism and media projects that serve the public interest, including investigative reporting, local news, and innovative storytelling formats.',
    funderName: 'Knight Foundation',
    funderType: 'foundation',
    awardMin: 50000,
    awardMax: 1000000,
    eligibilityTags: ['journalism', 'media', 'nonprofit'],
    categoryTags: ['journalism', 'media', 'storytelling'],
  },
  {
    source: 'knight-foundation',
    sourceUrl: 'https://knightfoundation.org/programs/technology/',
    applicationUrl: 'https://knightfoundation.org/apply/',
    title: 'Knight Tech for Engagement Initiative',
    description: 'Funds technology projects that improve how people engage with information, participate in democracy, and connect with their communities. Includes civic tech, open data, and digital tools.',
    funderName: 'Knight Foundation',
    funderType: 'foundation',
    awardMin: 25000,
    awardMax: 750000,
    eligibilityTags: ['tech', 'civic-tech', 'nonprofit', 'startup'],
    categoryTags: ['technology', 'civic-engagement', 'open-data', 'democracy'],
  },
  {
    source: 'knight-foundation',
    sourceUrl: 'https://knightfoundation.org/programs/learning-and-impact/',
    applicationUrl: 'https://knightfoundation.org/apply/',
    title: 'Knight Learning and Impact Grants',
    description: 'Supports research and evaluation projects that generate actionable knowledge about community engagement, media, arts, and technology.',
    funderName: 'Knight Foundation',
    funderType: 'foundation',
    awardMin: 10000,
    awardMax: 250000,
    eligibilityTags: ['research', 'nonprofit', 'academic'],
    categoryTags: ['research', 'evaluation', 'community'],
  },
]

export async function scrapeKnightFoundation(): Promise<RawGrant[]> {
  try {
    const res = await fetch('https://knightfoundation.org/grants/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        Accept: 'text/html',
      },
    })

    if (!res.ok) {
      console.warn(`[knight-foundation] HTTP ${res.status} — returning known programs`)
      return KNOWN_PROGRAMS
    }

    const html = await res.text()
    const scraped: RawGrant[] = []

    const linkRegex = /href="(https?:\/\/knightfoundation\.org\/grants\/[^"]+)"[^>]*>([^<]{10,150})</gi
    let m: RegExpExecArray | null
    const seen = new Set<string>()

    while ((m = linkRegex.exec(html)) !== null) {
      const url = m[1]
      const title = m[2].trim()
      if (seen.has(url) || !title) continue
      seen.add(url)

      scraped.push({
        source: 'knight-foundation',
        sourceUrl: url,
        applicationUrl: 'https://knightfoundation.org/apply/',
        title,
        funderName: 'Knight Foundation',
        funderType: 'foundation',
        categoryTags: ['arts', 'journalism', 'technology', 'community'],
        eligibilityTags: ['nonprofit', 'individual', 'startup'],
      })
    }

    const all = scraped.length > 0 ? scraped : KNOWN_PROGRAMS
    console.log(`[knight-foundation] fetched ${all.length} grants`)
    return all
  } catch (err) {
    console.error('[knight-foundation] scrape failed, returning known programs:', err)
    return KNOWN_PROGRAMS
  }
}
