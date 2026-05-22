import Anthropic from '@anthropic-ai/sdk'
import { env } from '@/lib/env'
import type { QAInput, QAScore } from '@/lib/qa/types'

const FALLBACK: QAScore = { score: 5, issues: ['Clarity scoring failed'], passed: false }

export async function scoreClarity(input: QAInput): Promise<QAScore> {
  try {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

    const readingLevelGuidance =
      input.funderType === 'federal'
        ? 'federal: formal academic register expected'
        : 'foundation/other: conversational but professional register expected'

    const prompt = `You are a grant application evaluator. Score the following grant application on clarity and readability.

Grant title: ${input.grantTitle}
Funder type: ${input.funderType ?? 'unknown'} (${readingLevelGuidance})

Application text:
${input.draftText}

Evaluate on these 6 criteria:
1. Appropriate reading level for the funder type (${readingLevelGuidance})
2. No unexplained jargon or acronyms
3. Logical section flow (ideas connect naturally)
4. Active voice predominates over passive voice
5. Varied sentence structure (not monotonous)
6. Concise — no padding or filler phrases

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
