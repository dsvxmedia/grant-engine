import type { RawGrant } from '../types'

const GOOGLE_CSE_URL = 'https://www.googleapis.com/customsearch/v1'

const GRANT_QUERIES = [
  // Monthly / recurring programs — highest value targets
  '"monthly grant" "small business" 2026 apply -site:twitter.com -site:facebook.com',
  '"rolling deadline" grant "small business" entrepreneur 2026 apply',
  'site:helloalice.com grants 2026 apply',
  'site:candid.org grants "small business" 2026 open',
  'site:instrumentl.com grants "small business" 2026 open',

  // Well-known monthly programs — confirm still open
  '"amber grant" 2026 apply womensnet',
  '"awesome foundation" microgrant 2026 apply',
  '"sky\'s the limit" grant entrepreneur 2026',

  // Corporate social impact grant programs 2026
  '"small business grant" 2026 apply "$10,000" OR "$25,000" OR "$50,000"',
  'verizon allstate comcast fedex walmart "small business grant" apply 2026',
  'amazon "black business" OR "minority business" grant 2026 apply',
  'google microsoft salesforce "small business" OR "entrepreneur" grant 2026 apply',

  // Minority, community, underrepresented entrepreneurs
  '"black-owned" OR "minority-owned" OR "BIPOC" grant 2026 "apply now"',
  'fellowship grant "black founders" OR "minority founders" technology 2026',
  '"underserved community" OR "underrepresented" entrepreneur grant 2026 apply',
  'HBCUs "economic empowerment" OR "community development" grant 2026',

  // Tech + AI focused
  'SBIR STTR technology innovation grant 2026 apply',
  '"AI" OR "artificial intelligence" small business grant 2026 apply',
  '"tech startup" grant fund 2026 "apply now" -site:twitter.com',

  // Local government / utility / port authority grants
  '"utility economic development" grant apply 2026',
  '"port authority" business grant apply 2026',
  '"city innovation" grant "small business" 2026 apply',
  '"community development" grant 2026 "apply" entrepreneur technology',

  // Foundation programs
  'women health maternal technology grant foundation 2026',
  '"social enterprise" grant impact 2026 apply',
  '"arts" OR "creative economy" grant "small business" 2026 apply',

  // General broad hunt — catch anything new
  '"grants for small businesses" 2026 "apply" -site:grants.gov',
  '"new grant program" 2026 entrepreneur "small business" apply "$"',
]

type SearchItem = {
  title: string
  link: string
  snippet?: string
  displayLink?: string
}

type SearchResponse = {
  items?: SearchItem[]
  error?: { message: string }
}

function isGrantUrl(item: SearchItem): boolean {
  const url = item.link.toLowerCase()
  const text = `${item.title} ${item.snippet ?? ''}`.toLowerCase()
  const grantKeywords = ['grant', 'fund', 'award', 'apply', 'opportunity', 'rfp', 'nofa']
  return grantKeywords.some((kw) => text.includes(kw))
}

function inferFunderType(item: SearchItem): RawGrant['funderType'] {
  const domain = item.displayLink ?? item.link
  if (domain.includes('.gov')) return 'federal'
  if (domain.includes('foundation') || domain.includes('.org')) return 'foundation'
  if (domain.includes('grants.gov') || domain.includes('sam.gov')) return 'federal'
  return 'niche'
}

export async function scrapeGoogleSearch(): Promise<RawGrant[]> {
  const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY
  const cseId = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID

  if (!apiKey || !cseId) {
    // Skip silently if keys not configured
    return []
  }

  const grants: RawGrant[] = []
  const seenUrls = new Set<string>()

  for (const query of GRANT_QUERIES) {
    try {
      const params = new URLSearchParams({
        key: apiKey,
        cx: cseId,
        q: query,
        num: '10',
      })
      const res = await fetch(`${GOOGLE_CSE_URL}?${params}`)
      if (!res.ok) {
        console.warn(`[google-search] HTTP ${res.status} for query: ${query}`)
        continue
      }

      const body = (await res.json()) as SearchResponse
      if (body.error) {
        console.error('[google-search] API error:', body.error.message)
        break
      }

      for (const item of body.items ?? []) {
        if (seenUrls.has(item.link)) continue
        if (!isGrantUrl(item)) continue
        seenUrls.add(item.link)

        grants.push({
          source: 'google-search',
          sourceUrl: item.link,
          applicationUrl: item.link,
          title: item.title,
          description: item.snippet,
          funderName: item.displayLink,
          funderType: inferFunderType(item),
          categoryTags: ['web-search'],
          eligibilityTags: [],
        })
      }

      // Respect free tier rate limit
      await new Promise((r) => setTimeout(r, 200))
    } catch (err) {
      console.error(`[google-search] query failed: ${query}`, err)
    }
  }

  console.log(`[google-search] fetched ${grants.length} grants`)
  return grants
}
