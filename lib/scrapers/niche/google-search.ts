import type { RawGrant } from '../types'

const GOOGLE_CSE_URL = 'https://www.googleapis.com/customsearch/v1'

const GRANT_QUERIES = [
  'small business technology startup grants 2026 apply now',
  'community development innovation grants apply 2026',
  'minority owned business grants foundation 2026',
  'women health technology grants 2026 site:.gov OR site:.org',
  'SBIR STTR technology grants 2026',
  'nonprofit grants creative economy 2026 apply',
  'arts culture entertainment grants 2026',
  'workforce development technology grants 2026',
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
