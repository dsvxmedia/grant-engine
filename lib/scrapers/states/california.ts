import type { RawGrant } from '../types'

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

const SOURCES = [
  {
    url: 'https://www.grants.ca.gov/grants/',
    label: 'CA Grants Portal',
  },
  {
    url: 'https://business.ca.gov/industries/small-business-innovation-and-entrepreneurship/california-small-business-grants/',
    label: 'CA Small Business Grants',
  },
]

function extractGrants(html: string, sourceUrl: string): RawGrant[] {
  const grants: RawGrant[] = []

  // Matches grant titles in h2/h3/h4 + adjacent description text
  const titleRegex = /<h[234][^>]*>([^<]{15,150})<\/h[234]>/gi
  let match: RegExpExecArray | null
  while ((match = titleRegex.exec(html)) !== null) {
    const title = match[1].replace(/&amp;/g, '&').replace(/&#\d+;/g, '').trim()
    if (!title || /nav|menu|header|footer|search|skip/i.test(title)) continue
    if (!/grant|fund|program|award|invest|opportunit/i.test(title + html.slice(match.index, match.index + 500))) continue

    grants.push({
      source: 'california-state',
      sourceUrl,
      title: `California: ${title}`,
      funderName: 'State of California',
      funderType: 'state',
      geographicRestrictions: { state: 'CA' },
      eligibilityTags: ['small-business', 'california'],
      categoryTags: ['state', 'california', 'economic-development'],
    })
  }

  return grants
}

export async function scrapeCalifornia(): Promise<RawGrant[]> {
  const all: RawGrant[] = []

  for (const { url } of SOURCES) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
      if (!res.ok) {
        console.warn(`[california-state] HTTP ${res.status} for ${url}`)
        continue
      }
      const html = await res.text()
      const grants = extractGrants(html, url)
      all.push(...grants)
    } catch (err) {
      console.warn(`[california-state] failed for ${url}:`, err)
    }
  }

  // Deduplicate by title
  const seen = new Set<string>()
  const unique = all.filter((g) => {
    if (seen.has(g.title)) return false
    seen.add(g.title)
    return true
  })

  // Always include known stable CA programs as a floor
  const stable: RawGrant[] = [
    {
      source: 'california-state',
      sourceUrl: 'https://www.ibank.ca.gov/small-business/small-business-loan-guarantee-program/',
      title: 'California IBank Small Business Loan Guarantee Program',
      description:
        'IBank provides loan guarantees to small businesses that cannot qualify for conventional loans. Supports small businesses in underserved communities including minority-owned, women-owned, and veteran-owned businesses throughout California.',
      funderName: 'California IBank',
      funderType: 'state',
      geographicRestrictions: { state: 'CA' },
      eligibilityTags: ['small-business', 'minority-owned', 'california'],
      categoryTags: ['state', 'california', 'capital-access'],
    },
    {
      source: 'california-state',
      sourceUrl: 'https://business.ca.gov/california-microbusiness-covid-19-relief-grant-program/',
      title: 'California Office of Small Business Advocate — Microbusiness Relief Grants',
      description:
        'OSBA administers grant programs for California microbusinesses. Programs prioritize businesses in low-income communities, minority-owned businesses, and those that did not receive other relief funding.',
      funderName: 'California Office of Small Business Advocate',
      funderType: 'state',
      geographicRestrictions: { state: 'CA' },
      eligibilityTags: ['small-business', 'minority-owned', 'california', 'los-angeles'],
      categoryTags: ['state', 'california', 'small-business', 'economic-development'],
    },
    {
      source: 'california-state',
      sourceUrl: 'https://www.calepa.ca.gov/envjustice/grants/',
      title: 'California Environmental Justice Grants',
      description:
        'CalEPA funds community-based organizations and small businesses working on environmental justice issues. Strong preference for organizations in disadvantaged communities throughout California.',
      funderName: 'California Environmental Protection Agency',
      funderType: 'state',
      geographicRestrictions: { state: 'CA' },
      eligibilityTags: ['small-business', 'community-serving', 'california'],
      categoryTags: ['state', 'california', 'environment', 'equity'],
    },
  ]

  const result = [...stable, ...unique]
  console.log(`[california-state] fetched ${result.length} grants`)
  return result
}
