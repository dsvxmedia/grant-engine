import { differenceInCalendarDays } from 'date-fns'

export const WEIGHTS = {
  MISSION_ALIGNMENT: 0.30,
  ANGLE_MATCH: 0.25,
  AWARD_SIZE: 0.15,
  DEADLINE_URGENCY: 0.10,
  FUNDER_PRESTIGE: 0.10,
  WIN_LOSS: 0.10,
} as const

const REVENUE_RANGE_IDEAL_AWARD: Record<string, { min: number; max: number }> = {
  under_100k: { min: 5_000, max: 50_000 },
  '100k_500k': { min: 25_000, max: 200_000 },
  '500k_1m': { min: 100_000, max: 500_000 },
  '1m_5m': { min: 250_000, max: 2_000_000 },
  '5m_plus': { min: 500_000, max: 5_000_000 },
}

const FUNDER_PRESTIGE: Record<string, number> = {
  federal: 1.0,
  foundation: 0.9,
  state: 0.7,
  corporate: 0.6,
  niche: 0.5,
}

const ELIGIBILITY_TAG_KEYWORDS: Record<string, string[]> = {
  minority_owned: ['minority', 'bipoc', 'black', 'hispanic', 'asian', 'indigenous'],
  african_american_owned: ['african american', 'black-owned', 'black owned', 'black-founded', 'black founded'],
  tech_company: ['tech', 'technology', 'software', 'digital', 'ai', 'data'],
  social_enterprise: ['social', 'mission', 'impact', 'nonprofit', 'community'],
  community_serving: ['community', 'serve', 'serving', 'local', 'neighborhood'],
  sbir_eligible: ['sbir', 'research', 'innovation', 'r&d'],
  underserved_community: ['underserved', 'low-income', 'disadvantaged', 'equity'],
}

// Tags that match any small business — auto-qualify without entity keyword lookup
const UNIVERSAL_TAGS = new Set([
  'any-industry', 'any_industry', 'small-business', 'small_business',
  'entrepreneur', 'entrepreneurs', 'bootstrapped', 'rolling', 'monthly',
  'microgrant', 'micro-grant', 'creator', 'digital', 'web-search', 'community',
  'social', 'startup', 'founder', 'general',
])

// Demographic grant tags → entity boolean flag names (from entityEligibilityTags in index.ts)
const DEMOGRAPHIC_TAG_TO_ENTITY_FLAG: Record<string, string> = {
  'minority-owned': 'minority_owned',
  'minority_owned': 'minority_owned',
  'african-american-owned': 'african_american_owned',
  'african_american_owned': 'african_american_owned',
  'black-owned': 'african_american_owned',
  'black_owned': 'african_american_owned',
  'black-founded': 'african_american_owned',
  'tech-company': 'tech_company',
  'tech_company': 'tech_company',
  'tech-startup': 'tech_company',
  'social-enterprise': 'social_enterprise',
  'social_enterprise': 'social_enterprise',
  'community-serving': 'community_serving',
  'community_serving': 'community_serving',
  'underserved-community': 'underserved_community',
  'underserved_community': 'underserved_community',
}

export type FitScoreInput = {
  grant: {
    funder_type: string | null
    award_min: number | null
    award_max: number | null
    deadline: string | null
    eligibility_tags: string[]
    category_tags: string[]
    is_new_program: boolean
    title?: string | null
    description?: string | null
  }
  entity: {
    mission: string | null
    focus_area: string | null
    pitch_angles_generated: unknown
    who_we_serve: string[] | null
    revenue_range: string | null
    is_tech_company: boolean | null
    is_social_enterprise: boolean | null
    is_community_serving: boolean | null
  }
}

export type FitScoreResult = {
  score: number
  components: {
    missionAlignment: number
    angleMatch: number
    awardSizeFit: number
    deadlineUrgency: number
    funderPrestige: number
    winLoss: number
  }
  matchedAngles: string[]
}

function toAngleStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((a) =>
      typeof a === 'string'
        ? a
        : typeof a === 'object' && a !== null
          ? String(
              (a as { angle?: unknown; text?: unknown }).angle ??
                (a as { text?: unknown }).text ??
                '',
            )
          : String(a),
    )
    .filter(Boolean)
}

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\w]+/)
    .filter((token) => token.length >= 3)
}

function expandTagTokens(tags: string[]): string[] {
  return tags.flatMap((tag) => tag.toLowerCase().split(/[_-]+/).filter(Boolean))
}

function computeMissionAlignment(input: FitScoreInput): number {
  const { entity, grant } = input
  if (!entity.mission && !entity.focus_area) {
    return 0.5
  }

  const entityText = [entity.mission ?? '', entity.focus_area ?? '', ...(entity.who_we_serve ?? [])].join(' ')
  const entityKeywords = new Set(extractKeywords(entityText))
  if (entityKeywords.size === 0) {
    return 0.3
  }

  // Use tags when available, fall back to grant title + description text
  const tagTokens = expandTagTokens([...grant.eligibility_tags, ...grant.category_tags])
  const textTokens = extractKeywords([grant.title ?? '', grant.description ?? ''].join(' '))
  const grantTokens = new Set([...tagTokens, ...textTokens])

  if (grantTokens.size === 0) {
    return 0.3
  }

  let matches = 0
  for (const token of grantTokens) {
    if (entityKeywords.has(token)) {
      matches += 1
    }
  }

  // Normalize by entity keyword count (not grant token count) to reward specificity
  const overlapRatio = matches / Math.max(entityKeywords.size, 1)
  return Math.min(overlapRatio * 3, 1.0) // scale up since overlap is naturally low
}

function computeAngleMatch(input: FitScoreInput): {
  score: number
  matchedAngles: string[]
} {
  const { grant, entity } = input
  if (grant.eligibility_tags.length === 0) {
    // No specific eligibility requirements → open to any business
    return { score: 0.7, matchedAngles: [] }
  }

  const angleStrings = toAngleStrings(entity.pitch_angles_generated)
  const allAngles = [...angleStrings, ...(entity.who_we_serve ?? [])].map((s) => s.toLowerCase())

  // Entity eligibility flags injected by the matching engine (e.g. 'african_american_owned')
  const entityEligibilityFlags: string[] = Array.isArray((entity as any).eligibility_tags)
    ? (entity as any).eligibility_tags
    : []

  const matchedAngles: string[] = []
  for (const tag of grant.eligibility_tags) {
    const tagLower = tag.toLowerCase()

    // Universal tags: open to any small business — always match
    if (UNIVERSAL_TAGS.has(tagLower)) {
      matchedAngles.push(tag)
      continue
    }

    // Demographic tag → entity boolean flag (e.g. 'black-owned' → 'african_american_owned')
    const entityFlagKey = DEMOGRAPHIC_TAG_TO_ENTITY_FLAG[tagLower]
    if (entityFlagKey && entityEligibilityFlags.includes(entityFlagKey)) {
      matchedAngles.push(tag)
      continue
    }

    // Text-based keyword matching against pitch angles
    const keywords = ELIGIBILITY_TAG_KEYWORDS[tagLower] ?? [tagLower.replace(/_/g, ' ').replace(/-/g, ' ')]
    const hit = allAngles.some((angle) => keywords.some((kw) => angle.includes(kw)))
    if (hit) {
      matchedAngles.push(tag)
    }
  }

  const score = Math.min(matchedAngles.length / Math.max(grant.eligibility_tags.length, 1), 1.0)
  return { score, matchedAngles }
}

function computeAwardSizeFit(input: FitScoreInput): number {
  const { grant, entity } = input
  if (
    grant.award_min === null ||
    grant.award_max === null ||
    entity.revenue_range === null ||
    !(entity.revenue_range in REVENUE_RANGE_IDEAL_AWARD)
  ) {
    return 0.5
  }

  const band = REVENUE_RANGE_IDEAL_AWARD[entity.revenue_range]
  const midpoint = (grant.award_min + grant.award_max) / 2

  if (midpoint >= band.min && midpoint <= band.max) {
    return 1.0
  }

  if (midpoint < band.min) {
    return Math.min(midpoint / band.min, 1.0)
  }

  return Math.min(band.max / midpoint, 1.0)
}

function computeDeadlineUrgency(input: FitScoreInput): number {
  const { grant } = input
  if (grant.deadline === null) {
    return 0.5
  }

  const daysUntil = differenceInCalendarDays(new Date(grant.deadline), new Date())

  if (daysUntil <= 0) return 0
  if (daysUntil >= 14 && daysUntil <= 60) return 1.0
  if (daysUntil > 60 && daysUntil <= 120) return 0.8
  if (daysUntil > 120) return 0.6
  if (daysUntil >= 7 && daysUntil < 14) return 0.5
  return 0.2
}

function computeFunderPrestige(input: FitScoreInput): number {
  const { grant } = input
  const base =
    grant.funder_type !== null && grant.funder_type in FUNDER_PRESTIGE
      ? FUNDER_PRESTIGE[grant.funder_type]
      : 0.5
  const bonus = grant.is_new_program ? 0.1 : 0
  return Math.min(base + bonus, 1.0)
}

export function computeFitScore(input: FitScoreInput): FitScoreResult {
  const missionAlignment = computeMissionAlignment(input)
  const { score: angleMatch, matchedAngles } = computeAngleMatch(input)
  const awardSizeFit = computeAwardSizeFit(input)
  const deadlineUrgency = computeDeadlineUrgency(input)
  const funderPrestige = computeFunderPrestige(input)
  const winLoss = 0

  const raw =
    missionAlignment * WEIGHTS.MISSION_ALIGNMENT +
    angleMatch * WEIGHTS.ANGLE_MATCH +
    awardSizeFit * WEIGHTS.AWARD_SIZE +
    deadlineUrgency * WEIGHTS.DEADLINE_URGENCY +
    funderPrestige * WEIGHTS.FUNDER_PRESTIGE +
    winLoss * WEIGHTS.WIN_LOSS

  const normalized = raw / (1 - WEIGHTS.WIN_LOSS)
  const score = Math.round(Math.min(normalized * 100, 100) * 10) / 10

  return {
    score,
    components: {
      missionAlignment,
      angleMatch,
      awardSizeFit,
      deadlineUrgency,
      funderPrestige,
      winLoss,
    },
    matchedAngles,
  }
}
