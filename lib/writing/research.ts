import Anthropic from '@anthropic-ai/sdk'
import { env } from '@/lib/env'

export type GrantFramework = 'logic-model' | 'theory-of-change' | 'roi' | 'narrative'

export type ResearchFindings = {
  funderBackground: string
  previousRecipients: string[]
  evaluationCriteria: string[]
  requiredSections: string[]
  wordLimits: Record<string, number>
  selectedFramework: GrantFramework
  funderLanguage: string[]
  rawNotes: string
}

export type ResearchInput = {
  grant: {
    title: string
    funder_name: string | null
    funder_type: string | null
    description: string | null
    eligibility_text: string | null
    source_url: string | null
    application_url: string | null
  }
}

const DEFAULT_SECTIONS = [
  'Executive Summary',
  'Organizational Background',
  'Problem / Needs Statement',
  'Project Description & Methodology',
  'Goals, Objectives & Evaluation Plan',
  'Budget Narrative',
  'Sustainability Plan',
]

function selectFramework(funderType: string | null): GrantFramework {
  switch (funderType) {
    case 'federal':
      return 'logic-model'
    case 'foundation':
      return 'theory-of-change'
    case 'corporate':
      return 'roi'
    default:
      return 'narrative'
  }
}

async function fetchGuidelinesText(url: string | null): Promise<string> {
  if (!url) return ''
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)
    if (!response.ok) return ''
    const html = await response.text()
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000)
  } catch {
    return ''
  }
}

async function callClaude(client: Anthropic, prompt: string, maxTokens = 800): Promise<string> {
  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    })
    const block = response.content[0]
    return block.type === 'text' ? block.text : ''
  } catch (err) {
    console.error('[research] Claude call failed:', err)
    return ''
  }
}

function buildGrantContext(
  grantTitle: string,
  funderName: string | null,
  description: string | null,
  eligibilityText: string | null,
  guidelinesText: string,
): string {
  const parts: string[] = [`Grant: ${grantTitle}`]
  if (funderName) parts.push(`Funder: ${funderName}`)
  if (description) parts.push(`Description:\n${description}`)
  if (eligibilityText) parts.push(`Eligibility & Requirements:\n${eligibilityText}`)
  if (guidelinesText) parts.push(`Guidelines page text:\n${guidelinesText}`)
  return parts.join('\n\n')
}

async function extractRequiredSections(
  client: Anthropic,
  grantContext: string,
): Promise<string[]> {
  const response = await callClaude(
    client,
    `You are analyzing a grant opportunity to determine what sections the application must contain.

${grantContext}

Based on ALL the grant information above, list the required application sections in order.
If the grant specifies required sections, use those exactly.
If not, infer the appropriate sections from the grant type and description.

Return ONLY a JSON array of section name strings, no other text. Example:
["Executive Summary", "Organizational Background", "Project Description"]`,
    600,
  )

  try {
    const match = response.match(/\[[\s\S]*?\]/)
    if (!match) return DEFAULT_SECTIONS
    const parsed = JSON.parse(match[0])
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_SECTIONS
    const sections = parsed.filter((s): s is string => typeof s === 'string' && s.length > 0)
    return sections.length > 0 ? sections : DEFAULT_SECTIONS
  } catch {
    return DEFAULT_SECTIONS
  }
}

async function extractWordLimits(
  client: Anthropic,
  grantContext: string,
): Promise<Record<string, number>> {
  const response = await callClaude(
    client,
    `Analyze this grant information and extract any word limits or page limits for application sections.

${grantContext}

Return ONLY a JSON object mapping section names to word counts. If no word limits are specified, return {}.
Example: {"Executive Summary": 250, "Project Description": 500}`,
    400,
  )

  try {
    const match = response.match(/\{[\s\S]*?\}/)
    if (!match) return {}
    const parsed = JSON.parse(match[0])
    if (typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const limits: Record<string, number> = {}
    for (const [key, val] of Object.entries(parsed)) {
      if (typeof val === 'number' && val > 0) limits[key] = val
    }
    return limits
  } catch {
    return {}
  }
}

async function synthesizeFunderResearch(
  client: Anthropic,
  funderName: string,
  grantContext: string,
): Promise<{ background: string; recipients: string[]; criteria: string[]; language: string[] }> {

  const [criteriaRaw, prioritiesRaw] = await Promise.all([
    callClaude(
      client,
      `Based on your training data and this grant information, describe the evaluation criteria ${funderName} uses to score applications. Be specific — list the actual scoring dimensions or review criteria they prioritize.

${grantContext}

Return a bullet list of evaluation criteria.`,
      600,
    ),
    callClaude(
      client,
      `Based on your training data and this grant information, describe ${funderName}'s funding priorities, values, and mission. Extract the exact vocabulary and phrases they use so we can mirror it in the application.

${grantContext}

Return a bullet list of key phrases and priorities.`,
      600,
    ),
  ])

  const criteria = criteriaRaw
    ? criteriaRaw.split('\n').map((s) => s.replace(/^[-*•\d.]+\s*/, '').trim()).filter((s) => s.length > 10)
    : []

  const languageLines = prioritiesRaw
    ? prioritiesRaw.split('\n').map((s) => s.replace(/^[-*•\d.]+\s*/, '').trim()).filter((s) => s.length > 5 && s.length < 120)
    : []

  return {
    background: prioritiesRaw || '',
    recipients: [],
    criteria,
    language: languageLines.slice(0, 12),
  }
}

export async function researchGrant(input: ResearchInput): Promise<ResearchFindings> {
  const { grant } = input

  const selectedFramework = selectFramework(grant.funder_type)

  // Fetch live guidelines page
  const url = grant.application_url ?? grant.source_url
  const guidelinesText = await fetchGuidelinesText(url)

  // Build a unified grant context string used in every prompt
  const grantContext = buildGrantContext(
    grant.title,
    grant.funder_name,
    grant.description,
    grant.eligibility_text,
    guidelinesText,
  )

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

  // Run all research in parallel
  const [funderSynthesis, requiredSections, wordLimits] = await Promise.all([
    grant.funder_name
      ? synthesizeFunderResearch(client, grant.funder_name, grantContext)
      : Promise.resolve({ background: '', recipients: [], criteria: [], language: [] }),
    extractRequiredSections(client, grantContext),
    extractWordLimits(client, grantContext),
  ])

  const rawNotesParts: string[] = []
  if (guidelinesText) rawNotesParts.push(`=== Live Guidelines Page ===\n${guidelinesText}`)
  if (grant.eligibility_text) rawNotesParts.push(`=== Eligibility Text ===\n${grant.eligibility_text}`)
  if (funderSynthesis.background) rawNotesParts.push(`=== Funder Priorities ===\n${funderSynthesis.background}`)
  if (funderSynthesis.criteria.length > 0)
    rawNotesParts.push(`=== Evaluation Criteria ===\n${funderSynthesis.criteria.join('\n')}`)

  return {
    funderBackground: funderSynthesis.background,
    previousRecipients: funderSynthesis.recipients,
    evaluationCriteria: funderSynthesis.criteria,
    requiredSections,
    wordLimits,
    selectedFramework,
    funderLanguage: funderSynthesis.language,
    rawNotes: rawNotesParts.join('\n\n'),
  }
}
