import Anthropic from '@anthropic-ai/sdk'
import { env } from '@/lib/env'
import type { QAInput, QAScore } from '@/lib/qa/types'

const FALLBACK: QAScore = { score: 5, issues: ['Narrative scoring failed'], passed: false }

export async function scoreNarrative(input: QAInput): Promise<QAScore> {
  try {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

    const prompt = `You are a grant application evaluator. Score the following grant application on narrative quality.

Grant title: ${input.grantTitle}
Funder type: ${input.funderType ?? 'unknown'}

Application text:
${input.draftText}

Evaluate on these 6 criteria:
1. Compelling story arc (problem → solution → impact)
2. Funder language mirrored
3. Equity framing present and specific (names specific communities)
4. Problem clearly stated with evidence
5. Impact measurable (numbers/outcomes cited)
6. Conclusion memorable

Return ONLY a JSON object with this exact shape — no markdown, no explanation:
{"score": <number 0-10>, "issues": ["<specific problem>", ...]}`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
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
