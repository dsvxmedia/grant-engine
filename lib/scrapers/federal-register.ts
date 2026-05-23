import type { RawGrant } from './types'

const FEDERAL_REGISTER_URL =
  'https://www.federalregister.gov/api/v1/documents.json'

const GRANT_KEYWORDS_RE =
  /NOFA|notice of funding|funding opportunity|grant program|cooperative agreement/i

type FRAgency = {
  name?: string
  id?: number
}

type FRDocument = {
  document_number?: string
  title?: string
  abstract?: string | null
  agencies?: FRAgency[]
  publication_date?: string | null
  html_url?: string
  pdf_url?: string | null
  effective_on?: string | null
  comments_close_on?: string | null
}

type FRResponse = {
  count?: number
  total_pages?: number
  results?: FRDocument[]
}

function buildUrl(): string {
  const params = new URLSearchParams()
  params.append('conditions[type][]', 'NOTICE')
  params.append(
    'conditions[term]',
    'grant OR funding OR "funding opportunity" OR NOFA'
  )
  params.append('per_page', '100')
  params.append('page', '1')
  params.append('order', 'newest')
  for (const field of [
    'document_number',
    'title',
    'abstract',
    'agencies',
    'publication_date',
    'html_url',
    'pdf_url',
    'effective_on',
    'comments_close_on',
  ]) {
    params.append('fields[]', field)
  }
  return `${FEDERAL_REGISTER_URL}?${params.toString()}`
}

function isGrantDocument(doc: FRDocument): boolean {
  const haystack = `${doc.title ?? ''} ${doc.abstract ?? ''}`
  return GRANT_KEYWORDS_RE.test(haystack)
}

function mapDocument(doc: FRDocument): RawGrant {
  const firstAgency = doc.agencies?.[0]?.name
  return {
    source: 'federal-register',
    sourceUrl: doc.html_url,
    applicationUrl: doc.html_url,
    title: doc.title ?? '',
    description: doc.abstract ?? undefined,
    funderName: firstAgency ?? undefined,
    funderType: 'federal',
    deadline: doc.comments_close_on ?? undefined,
    isNewProgram: true,
    categoryTags: ['federal', 'nofa'],
    eligibilityTags: [],
  }
}

export async function scrapeFederalRegister(): Promise<RawGrant[]> {
  try {
    const res = await fetch(buildUrl())
    if (!res.ok) {
      console.error(`[federal-register] HTTP ${res.status}`)
      return []
    }
    const body = (await res.json()) as FRResponse
    const results = body.results ?? []
    const grants = results.filter(isGrantDocument).map(mapDocument)
    console.log(`[federal-register] fetched ${grants.length} grants`)
    return grants
  } catch (err) {
    console.error('[federal-register] scrape failed:', err)
    return []
  }
}
