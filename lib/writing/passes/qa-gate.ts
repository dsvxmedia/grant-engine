import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { env } from '@/lib/env'
import type { UniquenessOutput, PassInput } from '@/lib/writing/types'

export type QAScores = {
  narrative: number   // Model A (Sonnet): story strength + funder alignment
  clarity: number     // Model B (Haiku): readability + tone
  compliance: number  // Model C (Haiku): sections present, word limits, budget math
}

export type QAResult = {
  scores: QAScores
  passed: boolean
  feedback: string[]  // actionable notes for the revision agent if it fails
}

const PASS_THRESHOLD = 7.0

async function scoreNarrative(
  client: Anthropic,
  draft: UniquenessOutput,
  input: PassInput,
): Promise<{ score: number; feedback: string[] }> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 600,
    messages: [
      {
        role: 'user',
        content: `You are a senior grant reviewer with 20+ years of experience. Score this grant application NARRATIVE STRENGTH on a 0-10 scale.

Evaluate:
- Does it tell a compelling story with a clear human hook?
- Does it mirror the funder's own language and priorities?
- Is the equity framing specific and community-centered (not deficit-framed)?
- Does the Theory of Change / Logic Model flow clearly: activities → outputs → outcomes → impact?
- Is the opening problem statement evidence-based, not self-promotional?

Grant: ${input.grant.title}
Funder: ${input.grant.funder_name ?? 'Unknown'}
Framework: ${draft.selectedFramework}

Application text:
${draft.rawText.slice(0, 6000)}

Return ONLY valid JSON: {"score": <number 0-10>, "feedback": ["<actionable issue 1>", "<actionable issue 2>"]}
Be strict. A 7+ means this section would impress a program officer. Below 7 means revisions are needed.`,
      },
    ],
  })

  try {
    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return { score: 5, feedback: ['Narrative score could not be parsed'] }
    const parsed = JSON.parse(match[0])
    return {
      score: Math.min(10, Math.max(0, Number(parsed.score) || 5)),
      feedback: Array.isArray(parsed.feedback) ? parsed.feedback : [],
    }
  } catch {
    return { score: 5, feedback: ['Narrative scoring failed'] }
  }
}

async function scoreClarity(
  client: Anthropic,
  draft: UniquenessOutput,
): Promise<{ score: number; feedback: string[] }> {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    messages: [
      {
        role: 'user',
        content: `Score this grant application on CLARITY AND READABILITY (0-10).

Evaluate:
- Reading level appropriate for grant reviewers (not too academic, not too casual)?
- No AI-sounding filler phrases ("It is important to note", "In conclusion", "Furthermore")?
- Clear logical flow from section to section?
- Active voice used throughout?
- No jargon that reviewers won't understand?

Application text (first 4000 chars):
${draft.rawText.slice(0, 4000)}

Return ONLY valid JSON: {"score": <number 0-10>, "feedback": ["<issue 1>", "<issue 2>"]}`,
      },
    ],
  })

  try {
    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return { score: 5, feedback: ['Clarity score could not be parsed'] }
    const parsed = JSON.parse(match[0])
    return {
      score: Math.min(10, Math.max(0, Number(parsed.score) || 5)),
      feedback: Array.isArray(parsed.feedback) ? parsed.feedback : [],
    }
  } catch {
    return { score: 5, feedback: ['Clarity scoring failed'] }
  }
}

async function scoreCompliance(
  client: Anthropic,
  draft: UniquenessOutput,
  input: PassInput,
): Promise<{ score: number; feedback: string[] }> {
  const sectionNames = draft.sections.map((s) => s.name).join(', ')

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    messages: [
      {
        role: 'user',
        content: `Score this grant application on COMPLIANCE (0-10).

Grant requirements:
- Eligibility tags: ${input.grant.eligibility_tags.join(', ') || 'none'}
- Category tags: ${input.grant.category_tags.join(', ') || 'none'}
- Funder type: ${input.grant.funder_type ?? 'unknown'}

Sections present in the draft: ${sectionNames}

Evaluate:
- Are all expected sections present for this grant type?
- Does the executive summary exist and is it appropriately brief?
- Is there a budget narrative section?
- Is there a sustainability or evaluation section?
- Does the content match what the grant requires (e.g., tech grants mention tech, community grants mention community impact)?

Return ONLY valid JSON: {"score": <number 0-10>, "feedback": ["<issue 1>", "<issue 2>"]}`,
      },
    ],
  })

  try {
    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return { score: 5, feedback: ['Compliance score could not be parsed'] }
    const parsed = JSON.parse(match[0])
    return {
      score: Math.min(10, Math.max(0, Number(parsed.score) || 5)),
      feedback: Array.isArray(parsed.feedback) ? parsed.feedback : [],
    }
  } catch {
    return { score: 5, feedback: ['Compliance scoring failed'] }
  }
}

export async function runQAGate(
  draft: UniquenessOutput,
  input: PassInput,
): Promise<QAResult> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

  // Run all three models in parallel
  const [narrativeResult, clarityResult, complianceResult] = await Promise.all([
    scoreNarrative(client, draft, input),
    scoreClarity(client, draft),
    scoreCompliance(client, draft, input),
  ])

  const scores: QAScores = {
    narrative: narrativeResult.score,
    clarity: clarityResult.score,
    compliance: complianceResult.score,
  }

  const passed =
    scores.narrative >= PASS_THRESHOLD &&
    scores.clarity >= PASS_THRESHOLD &&
    scores.compliance >= PASS_THRESHOLD

  const feedback = [
    ...narrativeResult.feedback.map((f) => `[Narrative] ${f}`),
    ...clarityResult.feedback.map((f) => `[Clarity] ${f}`),
    ...complianceResult.feedback.map((f) => `[Compliance] ${f}`),
  ]

  console.log(
    `[qa-gate] narrative=${scores.narrative.toFixed(1)} clarity=${scores.clarity.toFixed(1)} compliance=${scores.compliance.toFixed(1)} passed=${passed}`,
  )

  return { scores, passed, feedback }
}
