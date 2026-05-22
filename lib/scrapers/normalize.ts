import { createHash } from 'crypto'
import type { NormalizedGrant, RawGrant } from './types'

function parseDate(input: string | undefined): string | null {
  if (!input) return null
  const date = new Date(input)
  if (isNaN(date.getTime())) return null
  return date.toISOString()
}

function detectLoi(text: string): boolean {
  return /letter of in(?:quiry|tent)|loi\s+(?:required|deadline|submission)|submit\s+(?:a\s+|an\s+)?loi/i.test(
    text
  )
}

function detectVideo(text: string): boolean {
  return /video\s+(?:required|submission|application)|pitch\s+video/i.test(text)
}

function detectCoalition(text: string): boolean {
  return /coalition|partnership\s+encouraged|multi-organization|collaborative\s+application|lead\s+applicant/i.test(
    text
  )
}

export function normalizeGrant(raw: RawGrant): NormalizedGrant {
  const deadline = parseDate(raw.deadline)
  const loiDeadline = parseDate(raw.loiDeadline)
  const detectionText = raw.description ?? raw.eligibilityText ?? ''

  const datePart = deadline ? deadline.slice(0, 10) : ''
  const hashInput = `${raw.funderName ?? ''}|${raw.title}|${datePart}`
  const contentHash = createHash('sha256').update(hashInput).digest('hex')

  return {
    source: raw.source,
    source_url: raw.sourceUrl ?? null,
    application_url: raw.applicationUrl ?? null,
    title: raw.title,
    description: raw.description ?? null,
    funder_name: raw.funderName ?? null,
    funder_type: raw.funderType ?? null,
    award_min: raw.awardMin ?? null,
    award_max: raw.awardMax ?? null,
    deadline,
    eligibility_text: raw.eligibilityText ?? null,
    eligibility_tags: raw.eligibilityTags ?? [],
    category_tags: raw.categoryTags ?? [],
    geographic_restrictions: raw.geographicRestrictions ?? {},
    requires_loi: raw.requiresLoi ?? detectLoi(detectionText),
    loi_deadline: loiDeadline,
    requires_video: raw.requiresVideo ?? detectVideo(detectionText),
    coalition_preferred:
      raw.coalitionPreferred ?? detectCoalition(detectionText),
    competition_estimate: raw.competitionEstimate ?? null,
    is_new_program: raw.isNewProgram ?? false,
    content_hash: contentHash,
    status: 'active',
  }
}
