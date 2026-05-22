import Anthropic from '@anthropic-ai/sdk'
import { env } from '@/lib/env'
import type { QAInput, QAScore } from '@/lib/qa/types'

const FALLBACK: QAScore = { score: 5, issues: ['Compliance scoring failed'], passed: false }

export async function scoreCompliance(input: QAInput): Promise<QAScore> {
  try {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

    const sectionsText = input.requiredSections.length > 0
      ? input.requiredSections.join(', ')
      : 'No specific sections required'

    const wordLimitsText = Object.keys(input.wordLimits).length > 0
      ? Object.entries(input.wordLimits)
          .map(([section, limit]) => `${section}: ${limit} words max`)
          .join('; ')
      : 'No word limits specified'

    const prompt = `You are a grant application compliance auditor. Score the following grant application on compliance with requirements.

Grant title: ${input.grantTitle}

Required sections that MUST be present: ${sectionsText}
Word limits: ${wordLimitsText}

Application text:
${input.draftText}

Evaluate on these 5 criteria:
1. All required sections are present (check: ${sectionsText})
2. Word limits are respected (check: ${wordLimitsText})
3. Budget section exists and contains line items or amounts
4. SMART objectives used — goals are Specific, Measurable, and Time-bound
5. No contradictions between sections (e.g., budget totals match narrative claims)

Return ONLY a JSON object with this exact shape — no markdown, no explanation:
{"score": <number 0-10>, "issues": ["<specific problem>", ...]}`

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0]?.type === 'text' ? response.content[0].text : ''
    const parsed = JSON.parse(text) as { score: number; issues: string[] }

    const score = Math.min(10, Math.max(0, parsed.score))
    return {
      score,
      issues: parsed.issues ?? [],
      passed: score >= 7.0,
    }
  } catch {
    return FALLBACK
  }
}
