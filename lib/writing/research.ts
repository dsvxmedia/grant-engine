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
    const response = await fetch(url)
    if (!response.ok) return ''
    const html = await response.text()
    // Strip HTML tags with regex to extract plain text
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 5000) // cap to keep context manageable
  } catch (err) {
    console.error('[research] Failed to fetch guidelines URL:', err)
    return ''
  }
}

async function callClaude(
  client: Anthropic,
  prompt: string
): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }],
  })
  const block = response.content[0]
  if (block.type === 'text') return block.text
  return ''
}

async function synthesizeFunderResearch(
  client: Anthropic,
  funderName: string,
  guidelinesText: string
): Promise<{ background: string; recipients: string[]; criteria: string[]; language: string[] }> {
  const context = guidelinesText
    ? `\n\nGrant guidelines page content:\n${guidelinesText}`
    : ''

  let recipientsRaw = ''
  let criteriaRaw = ''
  let prioritiesRaw = ''

  try {
    recipientsRaw = await callClaude(
      client,
      `Based on your training data, summarize what you know about previous grant recipients of ${funderName}. List names or descriptions of organizations that have received grants from this funder. Keep it brief.${context}`
    )
  } catch (err) {
    console.error('[research] Failed to synthesize recipients:', err)
  }

  try {
    criteriaRaw = await callClaude(
      client,
      `Based on your training data, summarize the grant evaluation criteria and scoring rubric used by ${funderName}. List explicit criteria or dimensions they use to evaluate applications.${context}`
    )
  } catch (err) {
    console.error('[research] Failed to synthesize criteria:', err)
  }

  try {
    prioritiesRaw = await callClaude(
      client,
      `Based on your training data, summarize the funding priorities, values, and mission of ${funderName}. Include key phrases and language they use in their own materials.${context}`
    )
  } catch (err) {
    console.error('[research] Failed to synthesize priorities:', err)
  }

  // Parse recipients from the raw text (split on newlines or semicolons)
  const recipients = recipientsRaw
    ? recipientsRaw
        .split(/\n|;/)
        .map((s) => s.replace(/^[-*•\d.]+\s*/, '').trim())
        .filter((s) => s.length > 0)
    : []

  // Parse criteria similarly
  const criteria = criteriaRaw
    ? criteriaRaw
        .split(/\n|;/)
        .map((s) => s.replace(/^[-*•\d.]+\s*/, '').trim())
        .filter((s) => s.length > 0)
    : []

  // Extract key phrases from priorities as funder language
  const language = prioritiesRaw
    ? prioritiesRaw
        .split(/\n|;/)
        .map((s) => s.replace(/^[-*•\d.]+\s*/, '').trim())
        .filter((s) => s.length > 0 && s.length < 100)
        .slice(0, 10)
    : []

  const background = prioritiesRaw || ''

  return { background, recipients, criteria, language }
}

async function extractRequiredSections(
  client: Anthropic,
  description: string | null,
  eligibilityText: string | null
): Promise<string[]> {
  const content = [description, eligibilityText].filter(Boolean).join('\n\n')
  if (!content.trim()) return DEFAULT_SECTIONS

  try {
    const response = await callClaude(
      client,
      `List the required sections for this grant application. Return a JSON array of section names only, with no other text.\n\nGrant description and eligibility:\n${content}`
    )

    // Extract JSON array from response
    const match = response.match(/\[[\s\S]*\]/)
    if (!match) return DEFAULT_SECTIONS

    const parsed = JSON.parse(match[0])
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_SECTIONS

    // Validate all items are strings
    const sections = parsed.filter((item): item is string => typeof item === 'string')
    if (sections.length === 0) return DEFAULT_SECTIONS

    return sections
  } catch (err) {
    console.error('[research] Failed to extract required sections, using defaults:', err)
    return DEFAULT_SECTIONS
  }
}

export async function researchGrant(input: ResearchInput): Promise<ResearchFindings> {
  const { grant } = input

  // Step 3: Framework selection — deterministic, always succeeds
  const selectedFramework = selectFramework(grant.funder_type)

  // Step 1: Fetch grant guidelines page
  const url = grant.application_url ?? grant.source_url
  const guidelinesText = await fetchGuidelinesText(url)

  // Lazy instantiate Anthropic client
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

  // Step 2: Web research synthesis (skip if no funder name)
  let funderBackground = ''
  let previousRecipients: string[] = []
  let evaluationCriteria: string[] = []
  let funderLanguage: string[] = []

  if (grant.funder_name) {
    try {
      const synthesis = await synthesizeFunderResearch(client, grant.funder_name, guidelinesText)
      funderBackground = synthesis.background
      previousRecipients = synthesis.recipients
      evaluationCriteria = synthesis.criteria
      funderLanguage = synthesis.language
    } catch (err) {
      console.error('[research] Funder synthesis failed:', err)
    }
  }

  // Step 4: Section extraction
  const requiredSections = await extractRequiredSections(
    client,
    grant.description,
    grant.eligibility_text
  )

  // Assemble raw notes for Pass 1 context
  const rawNotesParts: string[] = []
  if (guidelinesText) rawNotesParts.push(`=== Guidelines Page ===\n${guidelinesText}`)
  if (funderBackground) rawNotesParts.push(`=== Funder Background ===\n${funderBackground}`)
  if (previousRecipients.length > 0)
    rawNotesParts.push(`=== Previous Recipients ===\n${previousRecipients.join('\n')}`)
  if (evaluationCriteria.length > 0)
    rawNotesParts.push(`=== Evaluation Criteria ===\n${evaluationCriteria.join('\n')}`)

  const rawNotes = rawNotesParts.join('\n\n')

  return {
    funderBackground,
    previousRecipients,
    evaluationCriteria,
    requiredSections,
    wordLimits: {},
    selectedFramework,
    funderLanguage,
    rawNotes,
  }
}
