import type { RawGrant } from './types'

const SBIR_URL =
  'https://api.sbir.gov/public/solicitations?rows=100&fields=program,phase,agency,title,open,close,description,solicitation_url&status=1'

type SbirSolicitation = {
  program?: string
  phase?: string
  agency?: string
  title?: string
  open?: string
  close?: string
  description?: string
  solicitation_url?: string
}

function mapSolicitation(sol: SbirSolicitation): RawGrant | null {
  const categoryTags = [
    sol.program ?? '',
    sol.phase ? `Phase ${sol.phase}` : '',
  ].filter(Boolean)

  const prefix = [sol.agency, sol.program, sol.phase && `Phase ${sol.phase}`]
    .filter(Boolean)
    .join(' ')
  const title = [prefix, sol.title].filter(Boolean).join(' - ')
  if (!title) return null

  return {
    source: 'sbir',
    sourceUrl: sol.solicitation_url ?? 'https://www.sbir.gov/solicitations',
    title,
    description: sol.description,
    funderName: sol.agency,
    funderType: 'federal',
    deadline: sol.close,
    isNewProgram: false,
    categoryTags,
    eligibilityTags: ['sbir_eligible', 'tech_company'],
  }
}

export async function scrapeSbir(): Promise<RawGrant[]> {
  try {
    const res = await fetch(SBIR_URL)
    if (!res.ok) {
      console.error(`[sbir] HTTP ${res.status}`)
      return []
    }

    const body = (await res.json()) as unknown as SbirSolicitation[]
    const grants = (body ?? [])
      .map(mapSolicitation)
      .filter((item): item is RawGrant => item !== null)
    console.log(`[sbir] fetched ${grants.length} grants`)
    return grants
  } catch (err) {
    console.error('[sbir] scrape failed:', err)
    return []
  }
}
