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

// Current US federal fiscal year. FY 2026 = Oct 2025 – Sep 2026.
// Any grant whose title references a fiscal year strictly before this is stale.
const CURRENT_FISCAL_YEAR = new Date().getFullYear()

const ROLLING_CATEGORY_TAGS = new Set([
  'rolling',
  'monthly',
  'ongoing',
  'year-round',
  'always-open',
  'open-enrollment',
  'continuous',
])

const ROLLING_SOURCES = new Set(['monthly-programs', 'monthly_programs'])

const ROLLING_TEXT_RE =
  /rolling\s+(?:application|deadline|basis)|year[\s-]round|always\s+open|no\s+deadline|ongoing\s+(?:grant|program|funding)|monthly\s+(?:grant|award|program)|accept(?:s|ing)\s+applications?\s+(?:at\s+any\s+time|anytime|year[\s-]round)/i

export function isRollingGrant(raw: Pick<import('./types').RawGrant, 'source' | 'categoryTags' | 'title' | 'description'>): boolean {
  if (ROLLING_SOURCES.has(raw.source)) return true
  if ((raw.categoryTags ?? []).some((t) => ROLLING_CATEGORY_TAGS.has(t.toLowerCase()))) return true
  const text = `${raw.title} ${raw.description ?? ''}`
  return ROLLING_TEXT_RE.test(text)
}

function extractFiscalYear(title: string): number | null {
  const patterns = [
    /\bFY\s*(\d{4})\b/i,
    /\bFiscal\s+Year\s+(\d{4})\b/i,
    /\b(\d{4})\s+Funding\s+Round\b/i,
    /\bFunding\s+Round[,\s]+(?:FY\s*)?(\d{4})\b/i,
    /\b(\d{4})\s+Grant\s+(?:Cycle|Round|Program)\b/i,
  ]
  for (const pattern of patterns) {
    const match = title.match(pattern)
    if (match) {
      const year = parseInt(match[1], 10)
      if (year >= 2000 && year <= 2100) return year
    }
  }
  return null
}

export function hasPastFiscalYear(title: string): boolean {
  const year = extractFiscalYear(title)
  return year !== null && year < CURRENT_FISCAL_YEAR
}

export function normalizeGrant(raw: RawGrant): NormalizedGrant | null {
  const deadline = parseDate(raw.deadline)
  const loiDeadline = parseDate(raw.loiDeadline)
  const detectionText = raw.description ?? raw.eligibilityText ?? ''

  // Skip grants whose deadline has already passed
  if (deadline && new Date(deadline) < new Date()) {
    return null
  }

  // Skip grants referencing past fiscal years — these are stale rounds
  // (e.g. "Bank Enterprise Award FY 2021 Funding Round")
  if (hasPastFiscalYear(raw.title)) {
    return null
  }

  // Skip grants-gov records with no deadline and no description — these are
  // archived NOFA shells with no useful data (e.g. "Climate Program FY 2012")
  if (raw.source === 'grants-gov' && !deadline && !raw.description) {
    return null
  }

  // Skip grants with no deadline unless they explicitly accept rolling applications
  if (!deadline && !isRollingGrant(raw)) {
    return null
  }

  // Skip grants with no URL at all — no way to apply means no value
  if (!raw.sourceUrl && !raw.applicationUrl) {
    return null
  }

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
