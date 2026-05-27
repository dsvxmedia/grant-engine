import Anthropic from '@anthropic-ai/sdk'
import { env } from '@/lib/env'
import type { ApplicationDraft, PassInput, CritiqueOutput } from '@/lib/writing/types'

const FALLBACK: CritiqueOutput = {
  items: [],
  overallScore: 5,
  summary: 'Self-critique parsing failed — proceed with revision.',
}

function buildPrompt(draft: ApplicationDraft, input: PassInput): string {
  const { research, grant } = input

  const evaluationCriteriaText =
    research.evaluationCriteria.length > 0
      ? research.evaluationCriteria.map((c) => `- ${c}`).join('\n')
      : '- No specific criteria provided.'

  const funderLanguageText =
    research.funderLanguage.length > 0
      ? research.funderLanguage.map((l) => `- ${l}`).join('\n')
      : '- No key phrases identified.'

  const wordLimitsText =
    Object.keys(research.wordLimits).length > 0
      ? Object.entries(research.wordLimits)
          .map(([section, limit]) => `- ${section}: ${limit} words`)
          .join('\n')
      : '- No specific limits provided.'

  const sectionWordCountsText = draft.sections
    .map((s) => `- ${s.name}: ${s.wordCount} words written`)
    .join('\n')

  return `You are a grant-writing expert performing a rigorous self-critique of a draft grant application.

Review the following draft against each of the criteria below. For each issue you find, produce a critique item. Be specific, actionable, and honest. If the draft is strong in an area, you may still note minor improvements.

---
## Grant Opportunity

**Title:** ${grant.title}
**Funder:** ${grant.funder_name ?? 'Unknown'}
**Funder Type:** ${grant.funder_type ?? 'Unknown'}

---
## Evaluation Criteria (provided by funder or inferred)

${evaluationCriteriaText}

---
## Funder Key Language (must appear in the application)

${funderLanguageText}

---
## Word Limits per Section

${wordLimitsText}

## Actual Section Word Counts

${sectionWordCountsText}

---
## Review Checklist

Evaluate the draft against ALL of the following dimensions:

1. **Evaluation criteria alignment** — Does each section directly address the funder's stated evaluation criteria?
2. **SMART objectives** — Are all goals Specific, Measurable, Achievable, Relevant, and Time-bound? Flag any vague or unmeasurable objectives.
3. **Budget justification** — Is the budget narrative present? Is every line item justified with a clear rationale?
4. **Equity framing** — Does the narrative center the community being served, not the organization? Is the language equity-centered?
5. **Language mirroring** — Does the draft use the funder's key phrases listed above? Flag any missing phrases.
6. **Word limit compliance** — Flag any section where the word count exceeds its limit.

---
## Draft Application

${draft.rawText}

---
## Instructions

Return ONLY a valid JSON object with this exact shape — no markdown fences, no explanation:

{
  "items": [
    {
      "section": "<section name or 'overall'>",
      "issue": "<what is wrong or could be improved>",
      "suggestion": "<specific actionable fix>",
      "severity": "<'critical' | 'important' | 'minor'>"
    }
  ],
  "overallScore": <integer 0-10>,
  "summary": "<1-2 sentence summary of the draft's main weakness>"
}`
}

function clampScore(score: unknown): number {
  const n = Number(score)
  if (!Number.isFinite(n)) return 5
  return Math.max(0, Math.min(10, Math.round(n)))
}

function parseResponse(text: string): CritiqueOutput {
  // Strip optional markdown code fences
  const stripped = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()

  // Try to extract a JSON object if there's surrounding text
  const match = stripped.match(/\{[\s\S]*\}/)
  if (!match) return { ...FALLBACK }

  const parsed: unknown = JSON.parse(match[0])
  if (typeof parsed !== 'object' || parsed === null) return { ...FALLBACK }

  const obj = parsed as Record<string, unknown>

  const items = Array.isArray(obj.items) ? obj.items : []
  const validItems = items.filter(
    (item): item is { section: string; issue: string; suggestion: string; severity: 'critical' | 'important' | 'minor' } =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as Record<string, unknown>).section === 'string' &&
      typeof (item as Record<string, unknown>).issue === 'string' &&
      typeof (item as Record<string, unknown>).suggestion === 'string' &&
      ['critical', 'important', 'minor'].includes((item as Record<string, unknown>).severity as string)
  )

  return {
    items: validItems,
    overallScore: clampScore(obj.overallScore),
    summary: typeof obj.summary === 'string' ? obj.summary : FALLBACK.summary,
  }
}

export async function selfCritique(
  draft: ApplicationDraft,
  input: PassInput
): Promise<CritiqueOutput> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

  let responseText: string
  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: buildPrompt(draft, input),
        },
      ],
    })

    const block = response.content[0]
    responseText = block.type === 'text' ? block.text : ''
  } catch (err) {
    console.error('[critique] Pass 2 API call failed:', err)
    return { ...FALLBACK }
  }

  try {
    return parseResponse(responseText)
  } catch (err) {
    console.error('[critique] Pass 2 JSON parse failed:', err)
    return { ...FALLBACK }
  }
}
